import * as model from './model.js';
import * as view from './view.js';

const SAVE_STATE_KEY = 'playerBuilderState';
const SAVED_BUILDS_KEY = 'playerSavedBuilds';
let selectedBuildId = null;
let currentPlayer = null;

function saveState() {
    if (!currentPlayer) return;
    const state = view.captureUIState();
    localStorage.setItem(SAVE_STATE_KEY, JSON.stringify(state));

    if (selectedBuildId) {
        const builds = getSavedBuilds();
        const buildIndex = builds.findIndex(b => b.id === selectedBuildId);
        if (buildIndex !== -1) {
            builds[buildIndex] = { ...state, id: builds[buildIndex].id, buildName: builds[buildIndex].buildName };
            saveBuilds(builds);
        }
    }
}

function loadState() {
    const savedStateJSON = localStorage.getItem(SAVE_STATE_KEY);
    if (!savedStateJSON) return false;
    try {
        const state = JSON.parse(savedStateJSON);
        applyAndProcessState(state);
        return true;
    } catch (e) {
        console.error("Erreur chargement état:", e);
        localStorage.removeItem(SAVE_STATE_KEY);
        return false;
    }
}

function getSavedBuilds() {
    return JSON.parse(localStorage.getItem(SAVED_BUILDS_KEY) || '[]');
}

function saveBuilds(builds) {
    localStorage.setItem(SAVED_BUILDS_KEY, JSON.stringify(builds));
}

function renderBuilds() {
    view.renderSavedBuildsList(getSavedBuilds(), selectedBuildId);
}

function addCurrentBuild() {
    if (!currentPlayer) {
        view.showError("Veuillez d'abord charger un joueur.");
        return;
    }
    const buildName = prompt("Entrez un nom pour ce build :", currentPlayer.Nom);
    if (!buildName || buildName.trim() === '') return;

    const currentState = view.captureUIState();
    currentState.id = `build_${Date.now()}`;
    currentState.buildName = buildName.trim();

    const builds = getSavedBuilds();
    builds.push(currentState);
    saveBuilds(builds);
    selectedBuildId = currentState.id;
    renderBuilds();
}

function loadSavedBuild(buildId) {
    console.log("=== DÉBUT loadSavedBuild ===", buildId);
    const builds = getSavedBuilds();
    const buildToLoad = builds.find(b => b.id === buildId);
	console.log(buildToLoad);
    
    if (buildToLoad) {
        console.log("Build trouvé:", buildToLoad);
        console.log("Technique à restaurer:", buildToLoad.calculationState?.selectedCalculationTech);
        
        selectedBuildId = buildId;
        
        // Make sure the player is loaded first
        currentPlayer = model.getPlayerById(buildToLoad.selectedPlayerId);
        console.log("Joueur chargé:", currentPlayer?.Nom);
        
        // Apply the state
        applyAndProcessState(buildToLoad);
        
        renderBuilds();
    } else {
        console.log("Build non trouvé");
        selectedBuildId = null;
        renderBuilds();
    }
    console.log("=== FIN loadSavedBuild ===");
}

function deleteSelectedBuild() {
    if (!selectedBuildId || !confirm("Êtes-vous sûr de vouloir supprimer ce build ?")) return;
    let builds = getSavedBuilds();
    builds = builds.filter(b => b.id !== selectedBuildId);
    saveBuilds(builds);
    selectedBuildId = null;
    renderBuilds();
}

function handlePlayerChange(playerId) {
    selectedBuildId = null;
    renderBuilds();
    loadPlayer(playerId);
    saveState();
}

function handleTechniqueChange(slot, techId) {
    const technique = model.getTechniqueById(techId);
    view.updateTechniqueSlot(slot, technique);
    updateCalculableMovesAndRecalculate();
    saveState();
}

function handleCalculationTechniqueChange() {
    const techId = view.tomSelects.calculation.getValue();
    const tech = model.getTechniqueById(techId);
    view.updateCalculationUI(tech);
    recalculatePower();
    saveState();
}

function handleAutoSaveEvent() {
    recalculatePower();
    saveState();
}

function recalculatePower() {
    const techId = view.tomSelects.calculation.getValue();
    if (!currentPlayer || !techId) {
        view.hideResults();
        return;
    }
    const state = view.captureUIState();
    const technique = model.getTechniqueById(techId);
    const selectedOptionData = view.tomSelects.calculation.options[techId];
    if (!technique || !selectedOptionData) return;

    const slot = selectedOptionData.slot;
    const talents = [];
    for (let i = 1; i <= 6; i++) {
        const tech = model.getTechniqueById(state.techniqueSlots[i].id);
        if (tech && tech.Position === 'Skill') {
            talents.push(tech);
        }
    }
    
    const calculationData = {
        player: currentPlayer,
        technique: technique,
        stats: {
            Frappe: parseInt(state.playerStats.Frappe),
            Maitrise: parseInt(state.playerStats.Maitrise),
            Precision: parseInt(state.playerStats.Precision),
            Defense: parseInt(state.playerStats.Defense),
            Interception: parseInt(state.playerStats.Interception),
            Chance: parseInt(state.playerStats.Chance),
        },
        talents: talents,
        options: {
            customPower: parseInt(state.techniqueSlots[slot].power),
            techElement: state.techniqueSlots[slot].element,
            appel: {
                checked: state.calculationState.appel,
                element: state.calculationState.appelElement
            },
            partners: {
                count: parseInt(state.calculationState.partners),
                sameElement: parseInt(state.calculationState.sameElementPartners)
            }
        }
    };
    
    const results = model.calculatePower(calculationData);
    view.displayResults(results);
}

function updateCalculableMovesAndRecalculate(techIdToSelect = null) {
    const state = view.captureUIState();
    const movableTechniques = [];
    for (let i = 1; i <= 6; i++) {
        const techId = state.techniqueSlots[i].id;
        if (techId) {
            const tech = model.getTechniqueById(techId);
            if (tech && tech.Type === 'Move') {
                movableTechniques.push({ id: tech.ID, name: tech.Name, slot: i });
            }
        }
    }
	
    // Pass the ID to the view function
    view.updateCalculationTechniqueOptions(movableTechniques, techIdToSelect);
    recalculatePower();
}

function loadPlayer(playerId) {
    currentPlayer = model.getPlayerById(playerId);
    view.displayPlayer(currentPlayer, model.getTechniques());
    updateCalculableMovesAndRecalculate();
}

function applyAndProcessState(state) {
    currentPlayer = model.getPlayerById(state.selectedPlayerId);
    
    // This function updates skill slots, stats, etc.
    view.applyStateToUI(state, { players: model.getPlayers(), techniques: model.getTechniques() });

    // Ensure that the technique to be restored exists before using it.
    const techIdToRestore = state.calculationState?.selectedCalculationTech;
    console.log("Tentative de restauration de la technique:", techIdToRestore);
    
    updateCalculableMovesAndRecalculate(techIdToRestore);

    // Wait until the technique is selected before updating the UI.
    setTimeout(() => {
        const tech = model.getTechniqueById(techIdToRestore);
        if (tech) {
            view.updateCalculationUI(tech);
        }
    }, 10);
}

function setupEventListeners() {
    view.DOMElements.calculateBtn.addEventListener('click', recalculatePower);
    view.DOMElements.addPlayerBuildBtn.addEventListener('click', addCurrentBuild);
    view.DOMElements.deletePlayerBuildBtn.addEventListener('click', deleteSelectedBuild);

    view.DOMElements.savedPlayersList.addEventListener('click', (e) => {
        if (e.target && e.target.nodeName === 'LI' && e.target.dataset.buildId) {
            loadSavedBuild(e.target.dataset.buildId);
        }
    });
    
    const autoSaveElements = [
        ...Object.values(view.DOMElements.playerStats),
        ...view.DOMElements.techSlots.map(s => s.power),
        ...view.DOMElements.techSlots.map(s => s.element),
        view.DOMElements.appelCheckbox,
        view.DOMElements.appelElementSelect,
        view.DOMElements.partnersCount,
        view.DOMElements.partnersSameElement,
    ];

    autoSaveElements.forEach(element => {
        const eventType = (element.tagName === 'INPUT' && element.type !== 'checkbox') ? 'input' : 'change';
        element.addEventListener(eventType, handleAutoSaveEvent);
    });

    view.DOMElements.partnersCount.addEventListener('change', () => {
        const techId = view.tomSelects.calculation.getValue();
        const tech = model.getTechniqueById(techId);
        view.updateCalculationUI(tech);
    });

    view.DOMElements.appelCheckbox.addEventListener('change', (e) => {
        view.DOMElements.appelElementSelect.disabled = !e.target.checked;
    });
}

async function init() {
    try {
        // This function is called first to ensure that all elements are found.
        view.cacheDOMElements();
        
        await model.loadDatabases();
        view.initTomSelects({
            onPlayerChange: handlePlayerChange,
            onTechniqueChange: handleTechniqueChange,
            onCalculationTechniqueChange: handleCalculationTechniqueChange
        });
        view.populatePlayerOptions(model.getPlayers());
        view.populateTechniqueOptions(model.getTechniques());

        setupEventListeners();

        renderBuilds();
        if (!loadState()) {
            view.tomSelects.player.setValue("para_cp1575");
        }
    } catch (err) {
        console.error("Erreur fatale lors de l'initialisation:", err);
        view.showError("Impossible de charger les bases de données.");
    }
}

document.addEventListener('DOMContentLoaded', init);