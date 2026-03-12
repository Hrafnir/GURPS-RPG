/* Version: #7 */

// === SEKSJON: GURPS KARAKTERMOTOR ===
const Character = (function() {

    // --- Datamodell (State) ---
    const STARTING_POINTS = 150;
    const DISADVANTAGE_LIMIT = -50; // Standard GURPS grense for ulemper

    let state = {
        name: "Ukjent Kriger",
        pointsSpent: 0,
        disadvantagesPoints: 0, // For å spore grensen på -50
        
        // Grunnattributter
        attributes: {
            ST: 10,
            DX: 10,
            IQ: 10,
            HT: 10
        },

        // Valgte egenskaper
        advantages: [], // Inneholder IDer til valgte fordeler
        disadvantages: [], // Inneholder IDer til valgte ulemper
        skills: {} // Format: { skillId: pointsSpent }
    };

    // --- Kostnader (GURPS 4E Regler) ---
    const costs = {
        ST: 10,
        DX: 20,
        IQ: 20,
        HT: 10
    };

    // --- Kataloger for Low Fantasy / Norrøn setting (TL4) ---
    const catalogs = {
        advantages: {
            "combat_reflexes": { name: "Combat Reflexes", cost: 15, desc: "+1 på aktivt forsvar, +2 på Fright Checks, aldri 'frozen' i kamp." },
            "high_pain_threshold": { name: "High Pain Threshold", cost: 10, desc: "Ignorerer sjokk-penalties fra skade." },
            "fit": { name: "Fit", cost: 5, desc: "+1 på alle HT-slag, raskere FP-regenerering." },
            "very_fit": { name: "Very Fit", cost: 15, desc: "+2 på HT-slag, mister FP saktere, regenererer raskt." },
            "wealth_comfortable": { name: "Wealth (Comfortable)", cost: 10, desc: "Dobbel startkapital." },
            "status_1": { name: "Status 1 (Karl/Storbondi)", cost: 5, desc: "Respektert fri mann." },
            "luck": { name: "Luck", cost: 15, desc: "Rull 3 ganger for en handling og velg beste resultat (1 gang pr time)." }
        },
        disadvantages: {
            "code_of_honor_viking": { name: "Code of Honor (Viking)", cost: -10, desc: "Krev alltid wergild eller hevn, gjestfrihet, vis mot." },
            "bloodlust": { name: "Bloodlust", cost: -10, desc: "Ønsker alltid å drepe fiender, selv om de overgir seg." },
            "one_eye": { name: "One Eye", cost: -15, desc: "Mangler dybdesyn, -1 DX i kamp, -3 på avstandsangrep." },
            "bad_temper": { name: "Bad Temper", cost: -10, desc: "Må rulle Will-slag for å ikke miste besinnelsen under stress." },
            "sense_of_duty_clan": { name: "Sense of Duty (Clan/Family)", cost: -10, desc: "Vil ofre alt for klanen og familien." },
            "stubbornness": { name: "Stubbornness", cost: -5, desc: "Nekter å innrømme feil eller endre mening lett." }
        },
        skills: {
            "axe_mace": { name: "Axe/Mace", attr: "DX", difficulty: "A" },
            "broadsword": { name: "Broadsword", attr: "DX", difficulty: "A" },
            "shield": { name: "Shield", attr: "DX", difficulty: "E" },
            "brawling": { name: "Brawling", attr: "DX", difficulty: "E" },
            "survival": { name: "Survival", attr: "Per", difficulty: "A" },
            "seamanship": { name: "Seamanship", attr: "IQ", difficulty: "E" },
            "stealth": { name: "Stealth", attr: "DX", difficulty: "A" },
            "tracking": { name: "Tracking", attr: "Per", difficulty: "A" }
        }
    };

    // --- Interne Hjelpefunksjoner ---

    // GURPS skill-kostnad kalkulator (Forenklet struktur for 4E)
    function calculateSkillLevel(attrValue, difficulty, points) {
        if (points === 0) return 0; // Har ikke ferdigheten
        
        let baseLevel = attrValue;
        let diffOffset = 0;

        switch(difficulty) {
            case "E": diffOffset = 0; break;
            case "A": diffOffset = -1; break;
            case "H": diffOffset = -2; break;
            case "VH": diffOffset = -3; break;
        }

        if (points === 1) return baseLevel + diffOffset;
        if (points === 2) return baseLevel + diffOffset + 1;
        if (points === 4) return baseLevel + diffOffset + 2;
        
        // For poeng over 4, koster det 4 poeng per nivå
        let extraLevels = Math.floor((points - 4) / 4);
        return baseLevel + diffOffset + 2 + extraLevels;
    }

    // Rekalkulerer total poengsum for karakteren
    function recalculateTotalPoints() {
        Logger.debug('Character', 'Kalkulerer totale poeng brukt...');
        let total = 0;
        let disadvTotal = 0;

        // 1. Attributter (avvik fra 10)
        total += (state.attributes.ST - 10) * costs.ST;
        total += (state.attributes.DX - 10) * costs.DX;
        total += (state.attributes.IQ - 10) * costs.IQ;
        total += (state.attributes.HT - 10) * costs.HT;

        // 2. Fordeler
        state.advantages.forEach(advId => {
            total += catalogs.advantages[advId].cost;
        });

        // 3. Ulemper (Gis som minuspoeng som legger tilgjengelige poeng tilbake til potten)
        state.disadvantages.forEach(disId => {
            let cost = catalogs.disadvantages[disId].cost;
            total += cost; // cost er et negativt tall, så dette reduserer totalen
            disadvTotal += cost;
        });

        // 4. Ferdigheter
        for (let skillId in state.skills) {
            total += state.skills[skillId];
        }

        state.pointsSpent = total;
        state.disadvantagesPoints = disadvTotal;

        Logger.info('Character', `Poengkalkulasjon fullført. Poeng brukt: ${state.pointsSpent} / ${STARTING_POINTS}`);
        
        if (state.disadvantagesPoints < DISADVANTAGE_LIMIT) {
            Logger.warn('Character', `Advarsel: Karakteren har passert grensen for ulemper (${state.disadvantagesPoints} / ${DISADVANTAGE_LIMIT})`);
        }
    }

    // --- Offentlige Metoder (API) ---
    return {
        // Hent alle data for å vise i UI
        getCharacterData: function() {
            // Kalkuler sekundære egenskaper dynamisk før data returneres
            const hp = state.attributes.ST;
            const will = state.attributes.IQ;
            const per = state.attributes.IQ;
            const fp = state.attributes.HT;
            const basicSpeed = (state.attributes.DX + state.attributes.HT) / 4;
            const basicMove = Math.floor(basicSpeed);
            const dodge = Math.floor(basicSpeed) + 3; // Grunnleggende dodge før Combat Reflexes etc.

            return {
                name: state.name,
                pointsSpent: state.pointsSpent,
                pointsRemaining: STARTING_POINTS - state.pointsSpent,
                attributes: { ...state.attributes },
                secondary: {
                    HP: hp,
                    Will: will,
                    Per: per,
                    FP: fp,
                    BasicSpeed: basicSpeed,
                    BasicMove: basicMove,
                    Dodge: dodge
                },
                advantages: [...state.advantages],
                disadvantages: [...state.disadvantages],
                skills: { ...state.skills }
            };
        },

        getCatalogs: function() {
            return catalogs;
        },

        // Endre grunnattributter
        setAttribute: function(attrName, value) {
            if (state.attributes[attrName] !== undefined && typeof value === 'number') {
                if (value < 1) {
                    Logger.warn('Character', 'Attributter kan ikke settes lavere enn 1.');
                    return false;
                }
                state.attributes[attrName] = value;
                Logger.info('Character', `Attributt ${attrName} satt til ${value}`);
                recalculateTotalPoints();
                return true;
            }
            Logger.error('Character', `Ugyldig attributt: ${attrName}`);
            return false;
        },

        // Legg til / Fjern Fordeler
        addAdvantage: function(advId) {
            if (catalogs.advantages[advId] && !state.advantages.includes(advId)) {
                state.advantages.push(advId);
                Logger.info('Character', `Lagt til fordel: ${catalogs.advantages[advId].name}`);
                recalculateTotalPoints();
                return true;
            }
            return false;
        },
        removeAdvantage: function(advId) {
            const index = state.advantages.indexOf(advId);
            if (index > -1) {
                state.advantages.splice(index, 1);
                Logger.info('Character', `Fjernet fordel: ${advId}`);
                recalculateTotalPoints();
                return true;
            }
            return false;
        },

        // Legg til / Fjern Ulemper
        addDisadvantage: function(disId) {
            if (catalogs.disadvantages[disId] && !state.disadvantages.includes(disId)) {
                state.disadvantages.push(disId);
                Logger.info('Character', `Lagt til ulempe: ${catalogs.disadvantages[disId].name}`);
                recalculateTotalPoints();
                return true;
            }
            return false;
        },
        removeDisadvantage: function(disId) {
            const index = state.disadvantages.indexOf(disId);
            if (index > -1) {
                state.disadvantages.splice(index, 1);
                Logger.info('Character', `Fjernet ulempe: ${disId}`);
                recalculateTotalPoints();
                return true;
            }
            return false;
        },

        // Sett poeng brukt på en ferdighet
        setSkillPoints: function(skillId, points) {
            if (catalogs.skills[skillId]) {
                if (points === 0) {
                    delete state.skills[skillId];
                    Logger.info('Character', `Fjernet ferdighet: ${catalogs.skills[skillId].name}`);
                } else if (points === 1 || points === 2 || points % 4 === 0) {
                    // Tillatte GURPS poengsteg for ferdigheter: 1, 2, 4, 8, 12, etc.
                    state.skills[skillId] = points;
                    Logger.info('Character', `Ferdighet ${catalogs.skills[skillId].name} satt til ${points} poeng.`);
                } else {
                    Logger.warn('Character', `Ugyldig poengsum for GURPS ferdigheter. Bruk 1, 2, 4, 8, 12, osv.`);
                    return false;
                }
                recalculateTotalPoints();
                return true;
            }
            Logger.error('Character', `Ferdighet ${skillId} finnes ikke i katalogen.`);
            return false;
        },

        // Hjelpefunksjon for å få den kalkulerte ferdighetsscoren (f.eks. "14") for et kast
        getCalculatedSkillLevel: function(skillId) {
            if (!state.skills[skillId] || !catalogs.skills[skillId]) return 0;
            
            const skillData = catalogs.skills[skillId];
            let baseAttr = state.attributes[skillData.attr];
            
            // Håndtere Per og Will siden de ikke ligger direkte i state.attributes
            if (skillData.attr === "Per" || skillData.attr === "Will") {
                baseAttr = state.attributes.IQ; // Per og Will er basert på IQ i GURPS 4E, avvik koster poeng, men vi bruker base IQ her for enkelhet
            }

            return calculateSkillLevel(baseAttr, skillData.difficulty, state.skills[skillId]);
        }
    };
})();

// Initialiserer karakteren i loggen
Logger.info('System', 'GURPS Karakter-modul lastet og klar. Startpoeng: 150.');

/* Version: #7 */
