export const DOMElements = {};

export const tomSelects = {
    player: null,
    techniques: {},
    calculation: null
};

export function cacheDOMElements() {
    DOMElements.playerInfo = document.getElementById('player1Info');
    DOMElements.playerName = document.getElementById('player1Name');
    DOMElements.playerPosition = document.getElementById('player1Position');
    DOMElements.playerElement = document.getElementById('player1Element');
    DOMElements.playerStats = {
        GP: document.getElementById('player1GP'),
        PT: document.getElementById('player1PT'),
        Frappe: document.getElementById('player1Frappe'),
        Maitrise: document.getElementById('player1Maitrise'),
        Precision: document.getElementById('player1Precision'),
        Defense: document.getElementById('player1Defense'),
        Vitesse: document.getElementById('player1Vitesse'),
        Endurance: document.getElementById('player1Endurance'),
        Interception: document.getElementById('player1Interception'),
        Chance: document.getElementById('player1Chance'),
    };
    DOMElements.techSlots = Array.from({ length: 6 }, (_, i) => ({
        select: document.getElementById(`player1Tech${i + 1}`),
        power: document.getElementById(`player1Tech${i + 1}Power`),
        element: document.getElementById(`player1Tech${i + 1}Element`),
    }));
    DOMElements.appelCheckbox = document.getElementById('player1Appel');
    DOMElements.appelElementSelect = document.getElementById('player1ElementAppel');
    DOMElements.partnersCount = document.getElementById('nombrePartenaires');
    DOMElements.partnersSameElement = document.getElementById('partenairesMemeElement');
    DOMElements.calculateBtn = document.getElementById('calculateBtn');
    DOMElements.resultsContainer = document.getElementById('results');
    DOMElements.resultPower = document.getElementById('resultPower');
    DOMElements.resultPowerBase = document.getElementById('resultPowerBase');
    DOMElements.resultElementPlus = document.getElementById('resultElementPlus');
    DOMElements.resultCritChance = document.getElementById('resultCritChance');
    DOMElements.resultCritMultiplier = document.getElementById('resultCritMultiplier');
    DOMElements.resultFinalMinLabel = document.getElementById('resultFinalMinLabel');
    DOMElements.resultFinalMin = document.getElementById('resultFinalMin');
    DOMElements.resultFinalConstantLabel = document.getElementById('resultFinalConstantLabel');
    DOMElements.resultFinalConstant = document.getElementById('resultFinalConstant');
    DOMElements.resultFinalMaxLabel = document.getElementById('resultFinalMaxLabel');
    DOMElements.resultFinalMax = document.getElementById('resultFinalMax');
    DOMElements.savedPlayersList = document.getElementById('savedPlayersList');
    DOMElements.addPlayerBuildBtn = document.getElementById('addPlayerBuildBtn');
    DOMElements.deletePlayerBuildBtn = document.getElementById('deletePlayerBuildBtn');
}


export function initTomSelects(callbacks) {
    const tomSelectSettings = { create: false, sortField: { field: "text", direction: "asc" } };
    
    tomSelects.player = new TomSelect('#player1Select', { ...tomSelectSettings, maxOptions: null, onChange: callbacks.onPlayerChange });
    for (let i = 1; i <= 6; i++) {
        tomSelects.techniques[`tech${i}`] = new TomSelect(`#player1Tech${i}`, { ...tomSelectSettings, maxOptions: null, onChange: (techId) => callbacks.onTechniqueChange(i, techId) });
    }
    tomSelects.calculation = new TomSelect('#calculationTechnique', { create: false, onChange: callbacks.onCalculationTechniqueChange });
}

export function populatePlayerOptions(players) {
    tomSelects.player.clearOptions();
    const sortedPlayers = [...players].sort((a, b) => a.Nom.localeCompare(b.Nom, 'fr'));
    sortedPlayers.forEach(player => tomSelects.player.addOption({ value: player.ID, text: player.Nom }));
}

export function populateTechniqueOptions(techniques) {
    const sortedTechniques = [...techniques].sort((a, b) => a.Name.localeCompare(b.Name, 'fr'));
    const options = [{ value: "", text: "-- Aucune --" }, ...sortedTechniques.map(tech => ({ value: tech.ID, text: `${tech.Name} (${tech.Type})` }))];
    for (let i = 1; i <= 6; i++) {
        tomSelects.techniques[`tech${i}`].clearOptions();
        tomSelects.techniques[`tech${i}`].addOption(options);
    }
    const elementOptions = ['feu', 'bois', 'air', 'terre', 'néant'].map(key => `<option value="${key}">${key.charAt(0).toUpperCase() + key.slice(1)}</option>`).join('');
    document.querySelectorAll('.technique-element-select, #player1ElementAppel').forEach(select => select.innerHTML = elementOptions);
}

export function displayPlayer(player, allTechniques) {
    if (!player) {
        DOMElements.playerInfo.style.display = 'none';
        return;
    }
    DOMElements.playerName.textContent = player.Nom;
    DOMElements.playerPosition.textContent = player.Position;
    DOMElements.playerElement.textContent = player.Element;
    DOMElements.playerElement.className = `value element-badge ${player.Element}`;

    Object.entries(DOMElements.playerStats).forEach(([key, element]) => {
        element.value = player[key] || 0;
    });

    for (let i = 1; i <= 6; i++) {
        let techName = player[`Technique_${i}`]?.replace(/\s*\([^)]*\)/, "").trim();
        const techData = techName ? allTechniques.find(t => t.Name.trim() === techName) : null;
        const techId = techData ? techData.ID : "";
        tomSelects.techniques[`tech${i}`].setValue(techId, true);
        updateTechniqueSlot(i, techData);
    }
    DOMElements.playerInfo.style.display = 'block';
}

export function updateTechniqueSlot(slotNumber, technique) {
    const slot = DOMElements.techSlots[slotNumber - 1];
    if (technique) {
        slot.power.value = technique.Puissance;
        slot.element.value = technique.Element;
    } else {
        slot.power.value = '';
        slot.element.value = 'feu';
    }
}

export function updateCalculationTechniqueOptions(movableTechniques, techIdToSelect = null) {
    const valueToRestore = techIdToSelect !== null ? techIdToSelect : tomSelects.calculation.getValue();

    tomSelects.calculation.clear();
    tomSelects.calculation.clearOptions();
    tomSelects.calculation.addOption({ value: '', text: '-- Sélectionner --' });

    movableTechniques.forEach(techInfo => {
        tomSelects.calculation.addOption({
            value: techInfo.id,
            text: `${techInfo.name} (Slot ${techInfo.slot})`,
            slot: techInfo.slot
        });
    });

    // Wait until TomSelect has finished processing all options
    requestAnimationFrame(() => {
        const techniqueExists = movableTechniques.some(tech => tech.id === valueToRestore);
        
        if (valueToRestore && techniqueExists) {
            console.log("Restauration de la technique:", valueToRestore);
            tomSelects.calculation.setValue(valueToRestore, false);
            
            // Check if the selection was successful
            setTimeout(() => {
                const currentValue = tomSelects.calculation.getValue();
                console.log("Valeur actuelle après restauration:", currentValue);
                if (currentValue !== valueToRestore) {
                    console.warn("Échec de la restauration, nouvelle tentative...");
                    tomSelects.calculation.setValue(valueToRestore, true);
                }
            }, 50);
        } else {
            console.log("Technique non trouvée ou pas de technique à restaurer");
            tomSelects.calculation.setValue('', true);
            DOMElements.resultsContainer.style.display = 'none';
        }
    });
}

export function updateCalculationUI(technique) {
    const isShotOrSave = technique && (technique.Catégorie === 'frappe' || technique.Catégorie === 'arrêt');
    DOMElements.partnersCount.disabled = isShotOrSave;
    if (isShotOrSave) DOMElements.partnersCount.value = "1";

    const nbPartenaires = parseInt(DOMElements.partnersCount.value);
    DOMElements.partnersSameElement.disabled = (nbPartenaires === 1);
    if (nbPartenaires === 1) DOMElements.partnersSameElement.value = 0;
    
    DOMElements.partnersSameElement.max = nbPartenaires - 1;
    if (parseInt(DOMElements.partnersSameElement.value) > parseInt(DOMElements.partnersSameElement.max)) {
        DOMElements.partnersSameElement.value = DOMElements.partnersSameElement.max;
    }
}

export function displayResults(results) {
    DOMElements.resultPower.textContent = results.power;
    DOMElements.resultPowerBase.textContent = results.powerBase;
    DOMElements.resultElementPlus.textContent = results.elementPlus;
    DOMElements.resultCritChance.textContent = `${results.critChance.toFixed(2)}%`;
    DOMElements.resultCritMultiplier.textContent = `x${results.critMultiplier}`;
    DOMElements.resultFinalMinLabel.textContent = `Puissance Finale Min (${results.probabilities.probMin.toFixed(2)}%):`;
    DOMElements.resultFinalMin.textContent = results.finalMin;
    DOMElements.resultFinalConstantLabel.textContent = `Puissance Finale Constant (${results.probabilities.probConstant.toFixed(2)}%):`;
    DOMElements.resultFinalConstant.textContent = results.finalConstant;
    DOMElements.resultFinalMaxLabel.textContent = `Puissance Finale Max (${results.probabilities.probMax.toFixed(2)}%):`;
    DOMElements.resultFinalMax.textContent = results.finalMax;
    DOMElements.resultsContainer.style.display = 'block';
}

export function hideResults() {
    DOMElements.resultsContainer.style.display = 'none';
}

export function captureUIState() {
    const state = {
        selectedPlayerId: tomSelects.player.getValue(),
        playerStats: {},
        techniqueSlots: {},
        calculationState: {}
    };

    Object.keys(DOMElements.playerStats).forEach(id => {
        state.playerStats[id] = DOMElements.playerStats[id].value;
    });

    for (let i = 1; i <= 6; i++) {
        state.techniqueSlots[i] = {
            id: tomSelects.techniques[`tech${i}`].getValue(),
            power: DOMElements.techSlots[i - 1].power.value,
            element: DOMElements.techSlots[i - 1].element.value
        };
    }
	
	console.log(tomSelects.calculation.getValue());

    state.calculationState = {
        appel: DOMElements.appelCheckbox.checked,
        appelElement: DOMElements.appelElementSelect.value,
        partners: DOMElements.partnersCount.value,
        sameElementPartners: DOMElements.partnersSameElement.value,
        selectedCalculationTech: tomSelects.calculation.getValue()
    };
    return state;
}

export function applyStateToUI(state, allTechniques) {
    tomSelects.player.setValue(state.selectedPlayerId, true);
    
    const player = allTechniques.players.find(p => p.ID === state.selectedPlayerId);
    if(player) {
        DOMElements.playerName.textContent = player.Nom;
        DOMElements.playerPosition.textContent = player.Position;
        DOMElements.playerElement.textContent = player.Element;
        DOMElements.playerElement.className = `value element-badge ${player.Element}`;
        DOMElements.playerInfo.style.display = 'block';
    }

    Object.entries(state.playerStats).forEach(([statId, value]) => {
        if (DOMElements.playerStats[statId]) DOMElements.playerStats[statId].value = value;
    });

    for (let i = 1; i <= 6; i++) {
        const slotData = state.techniqueSlots[i];
        if (slotData) {
            tomSelects.techniques[`tech${i}`].setValue(slotData.id, true);
            DOMElements.techSlots[i - 1].power.value = slotData.power;
            DOMElements.techSlots[i - 1].element.value = slotData.element;
        }
    }

    if (state.calculationState) {
        console.log("État de calcul à restaurer:", state.calculationState);
        DOMElements.appelCheckbox.checked = state.calculationState.appel;
        DOMElements.appelElementSelect.disabled = !state.calculationState.appel;
        DOMElements.appelElementSelect.value = state.calculationState.appelElement || 'feu';
        DOMElements.partnersCount.value = state.calculationState.partners || "1";
        DOMElements.partnersSameElement.value = state.calculationState.sameElementPartners || "0";
    }
}

export function renderSavedBuildsList(builds, selectedBuildId) {
    DOMElements.savedPlayersList.innerHTML = '';
    if (builds.length === 0) {
        DOMElements.savedPlayersList.innerHTML = `<li>Aucun build sauvegardé.</li>`;
    } else {
        builds.forEach(build => {
            const li = document.createElement('li');
            li.textContent = build.buildName;
            li.dataset.buildId = build.id;
            if (build.id === selectedBuildId) {
                li.classList.add('selected');
            }
            DOMElements.savedPlayersList.appendChild(li);
        });
    }
    DOMElements.deletePlayerBuildBtn.disabled = !selectedBuildId;
}

export function showError(message) {
    alert(message);
}