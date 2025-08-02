let playersData = [];
let techniquesData = [];

const elementMapping = { 'Fire': 'feu', 'Wood': 'bois', 'Wind': 'air', 'Earth': 'terre', 'Void': 'néant' };
const contreElements = { 'terre': 'air', 'bois': 'feu', 'feu': 'terre', 'air': 'bois' };

function convertSqlResultToObjectArray(sqlResult) {
    if (!sqlResult) return [];
    return sqlResult.values.map(row => {
        let obj = {};
        sqlResult.columns.forEach((col, index) => obj[col] = row[index]);
        return obj;
    });
}

function CalcCmndPowerExp(prmBase, cmndPow) {
    return -0.00030000001 * (prmBase * prmBase) + 0.53100002 * prmBase + 0.4693 + cmndPow;
}

function calculateOutcomeProbabilities(rate, skillDif) {
    let minCount = 0, maxCount = 0;
    const totalOutcomes = 52;
    const roundedRate = Math.ceil(rate);
    const maxThreshold = Math.ceil(skillDif * 1.5);
    const minThreshold = Math.ceil(skillDif * 0.5);
    for (let randVal = 0; randVal <= 51; randVal++) {
        const sum = randVal + roundedRate;
        if (sum > maxThreshold) maxCount++;
        else if (sum < minThreshold) minCount++;
    }
    const constantCount = totalOutcomes - minCount - maxCount;
    return {
        probMin: (minCount / totalOutcomes) * 100,
        probConstant: (constantCount / totalOutcomes) * 100,
        probMax: (maxCount / totalOutcomes) * 100
    };
}

export async function loadDatabases() {
    const SQL = await initSqlJs({ locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/${file}` });
    const [playerDbFile, techDbFile] = await Promise.all([
        fetch('databases/players.db').then(res => res.arrayBuffer()),
        fetch('databases/techniques.db').then(res => res.arrayBuffer())
    ]);
    const playerDb = new SQL.Database(new Uint8Array(playerDbFile));
    const techDb = new SQL.Database(new Uint8Array(techDbFile));

    playersData = convertSqlResultToObjectArray(playerDb.exec("SELECT * FROM players")[0]);
    techniquesData = convertSqlResultToObjectArray(techDb.exec("SELECT * FROM moves")[0]);

    playerDb.close();
    techDb.close();

    if (playersData.length === 0 || techniquesData.length === 0) throw new Error("Les bases de données sont vides.");

    techniquesData.forEach(tech => {
        tech.Element = elementMapping[tech.Element] || 'néant';
        tech.Catégorie = tech.Catégorie?.toLowerCase();
    });
    playersData.forEach(p => p.Element = elementMapping[p.Element] || 'néant');
}

export const getPlayers = () => playersData;
export const getTechniques = () => techniquesData;
export const getPlayerById = (id) => playersData.find(p => p.ID === id);
export const getTechniqueById = (id) => techniquesData.find(t => t.ID === id);

export function calculatePower(calculationData) {
    const {
        player,
        technique,
        stats,
        talents,
        options
    } = calculationData;

    const customPuissance = options.customPower || technique.Puissance;
    const elementTechnique = options.techElement;
    const elementJoueur = player.Element;

    let statPrimaire;
    switch (technique.Categorie) {
        case 'Shoot': statPrimaire = stats.Frappe; break;
        case 'Block': statPrimaire = stats.Defense; break;
        case 'Dribble': statPrimaire = stats.Maitrise; break;
        case 'Save': statPrimaire = stats.Interception; break;
        default: statPrimaire = stats.Frappe;
    }

    const power = Math.floor(statPrimaire * 0.8 + stats.Precision * 0.2);
    const powerBase = CalcCmndPowerExp(power, customPuissance);

    let elementPlus = 0;
    if (elementJoueur === elementTechnique) {
        elementPlus += 5;
    } else if (contreElements[elementJoueur] === elementTechnique) {
        elementPlus -= 5;
    }

    talents.forEach(talent => {
        if (talent.Name === 'Sans élément') {
			elementPlus = 0;
		}
        else if (talent.Name === 'Super éléments' && elementJoueur === elementTechnique) {
			elementPlus += 10;
		}
        else if (talent.Name.startsWith('Faveur')) {
            const FaveurElement = talent.Name.split(' ').pop();
			
			if (FaveurElement == elementTechnique) {
				elementPlus += 10;
			}
        }
    });

    if (options.appel.checked) {
        if (options.appel.element === elementTechnique) elementPlus += 20;
    }

    let numRev = (options.partners.count === 2) ? 1.25 : (options.partners.count === 3) ? 1.5 : 1.0;
    let partyElemRev = ((1 + options.partners.sameElement) === 2) ? 5 : ((1 + options.partners.sameElement) === 3) ? 10 : 0;
    let puissanceBaseFinale = Math.floor((powerBase * numRev + elementPlus + partyElemRev));
	
	const hasSuperTech = talents.some(t => t.Name === 'Super techniques' || t.Name === 'Donne-toi à fond !');
	if (hasSuperTech) {
		puissanceBaseFinale = Math.floor(puissanceBaseFinale * 1.2);
	}	

    const _tec = stats.Precision * 0.2;
    let basePrecision = -0.00050000002 * (_tec * _tec) + 0.1122 * _tec + 0.88779998;
    if (elementTechnique !== 'néant') {
        if (elementJoueur === elementTechnique) basePrecision += 5;
        else if (contreElements[elementJoueur] === elementTechnique) basePrecision -= 5;
    }
    basePrecision += 20;
    
    if (technique.NB_Partenaire == 1) {
        basePrecision *= 1;
    } else if (technique.NB_Partenaire == 2) {
        basePrecision *= 0.89999998;
    } else if (technique.NB_Partenaire == 2) {
        basePrecision *= 0.80000001;
    }

    const probabilities = calculateOutcomeProbabilities(basePrecision, technique.Precision);
    const puissanceMin = Math.floor(puissanceBaseFinale * 0.8);
    const puissanceMax = Math.floor(puissanceBaseFinale * 1.2);

    const hasCritiqueTalent = talents.some(t => t.Name === 'Critique');
    const hasSuperPoisseTalent = talents.some(t => t.Name === 'Super poisse');
    let critChance = stats.Chance * 0.03;
    let critMultiplier = 2;
    if (hasCritiqueTalent) critChance *= 1.5;
    if (hasSuperPoisseTalent) {
        critChance *= 0.3;
        critMultiplier = 4;
    }

    return {
        power,
        powerBase,
        elementPlus,
        critChance,
        critMultiplier,
        finalMin: puissanceMin,
        finalConstant: puissanceBaseFinale,
        finalMax: puissanceMax,
        probabilities
    };
}