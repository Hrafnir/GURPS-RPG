/* Version: #11 */

// === SEKSJON: GURPS KARAKTERMOTOR ===
const Character = (function() {

    // --- Datamodell (State) ---
    const STARTING_POINTS = 150;
    const DISADVANTAGE_LIMIT = -50; // Standard GURPS grense for ulemper

    let state = {
        name: "Ukjent Kriger",
        portrait: null, // Base64 bilde eller sti til standardbilde
        pointsSpent: 0,
        disadvantagesPoints: 0, 
        
        // Grunnattributter
        attributes: {
            ST: 10,
            DX: 10,
            IQ: 10,
            HT: 10
        },

        // Valgte egenskaper
        advantages: [], 
        disadvantages: [], 
        skills: {} 
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
            "absolute_direction": { name: "Absolute Direction", cost: 5, desc: "+3 på Navigation, vet alltid hvor nord er." },
            "combat_reflexes": { name: "Combat Reflexes", cost: 15, desc: "+1 på aktivt forsvar, +2 på Fright Checks, aldri 'frozen' i kamp." },
            "danger_sense": { name: "Danger Sense", cost: 15, desc: "Får et Perception-slag for å føle bakholdsangrep eller skjulte farer." },
            "fearlessness_1": { name: "Fearlessness 1", cost: 2, desc: "+1 på alle Fright Checks eller for å motstå Intimidation." },
            "fearlessness_2": { name: "Fearlessness 2", cost: 4, desc: "+2 på alle Fright Checks eller for å motstå Intimidation." },
            "fearlessness_3": { name: "Fearlessness 3", cost: 6, desc: "+3 på alle Fright Checks eller for å motstå Intimidation." },
            "fit": { name: "Fit", cost: 5, desc: "+1 på alle HT-slag, raskere FP-regenerering." },
            "very_fit": { name: "Very Fit", cost: 15, desc: "+2 på HT-slag, mister FP saktere, regenererer raskt." },
            "hard_to_kill_1": { name: "Hard to Kill 1", cost: 2, desc: "+1 på HT-slag for å overleve ved negative HP." },
            "hard_to_kill_2": { name: "Hard to Kill 2", cost: 4, desc: "+2 på HT-slag for å overleve ved negative HP." },
            "high_pain_threshold": { name: "High Pain Threshold", cost: 10, desc: "Ignorerer sjokk-penalties fra skade." },
            "luck": { name: "Luck", cost: 15, desc: "Rull 3 ganger for en handling og velg beste resultat (1 gang pr time av spilltid)." },
            "night_vision_1": { name: "Night Vision 1", cost: 1, desc: "Reduserer straff for mørke med 1." },
            "night_vision_2": { name: "Night Vision 2", cost: 2, desc: "Reduserer straff for mørke med 2." },
            "outdoorsman_1": { name: "Outdoorsman 1", cost: 10, desc: "+1 på Camouflage, Navigation, Survival og Tracking." },
            "rapid_healing": { name: "Rapid Healing", cost: 5, desc: "+5 på HT for å gro sår naturlig." },
            "status_1": { name: "Status 1 (Karl/Storbondi)", cost: 5, desc: "Respektert fri mann." },
            "wealth_comfortable": { name: "Wealth (Comfortable)", cost: 10, desc: "Dobbel startkapital." }
        },
        disadvantages: {
            "alcoholism": { name: "Alcoholism", cost: -15, desc: "Må rulle Will-slag når i nærheten av alkohol for å unngå å drikke." },
            "bad_temper": { name: "Bad Temper", cost: -10, desc: "Må rulle Will-slag for å ikke miste besinnelsen under stress." },
            "bloodlust": { name: "Bloodlust", cost: -10, desc: "Ønsker alltid å drepe fiender, selv om de overgir seg." },
            "code_of_honor_viking": { name: "Code of Honor (Viking)", cost: -10, desc: "Krev alltid wergild eller hevn, gjestfrihet, vis mot." },
            "cowardice": { name: "Cowardice", cost: -10, desc: "Må rulle Will-slag for å gå inn i farlige situasjoner." },
            "gluttony": { name: "Gluttony", cost: -5, desc: "Må rulle Will for å takke nei til god mat og drikke." },
            "greed": { name: "Greed", cost: -15, desc: "Gjør nesten hva som helst for rikdom." },
            "impulsiveness": { name: "Impulsiveness", cost: -10, desc: "Må rulle Will-slag for å tenke før du handler." },
            "one_eye": { name: "One Eye", cost: -15, desc: "Mangler dybdesyn, -1 DX i kamp, -3 på avstandsangrep." },
            "overconfidence": { name: "Overconfidence", cost: -5, desc: "Tror du er bedre enn du er. Tar for store sjanser." },
            "phobia_sea": { name: "Phobia (Thalassophobia - Hav)", cost: -10, desc: "Sterk frykt for det åpne havet og å være i båt." },
            "phobia_fire": { name: "Phobia (Pyrophobia - Ild)", cost: -5, desc: "Frykt for store flammer (ikke vanlig leirbål)." },
            "sense_of_duty_clan": { name: "Sense of Duty (Clan/Family)", cost: -10, desc: "Vil ofre alt for klanen og familien." },
            "stubbornness": { name: "Stubbornness", cost: -5, desc: "Nekter å innrømme feil eller endre mening lett." },
            "vow_never_refuse_combat": { name: "Vow (Aldri takk nei til duell)", cost: -10, desc: "Du må akseptere alle utfordringer til kamp." }
        },
        skills: {
            "animal_handling": { name: "Animal Handling (Equines)", attr: "IQ", difficulty: "A" },
            "axe_mace": { name: "Axe/Mace", attr: "DX", difficulty: "A" },
            "bow": { name: "Bow", attr: "DX", difficulty: "A" },
            "brawling": { name: "Brawling", attr: "DX", difficulty: "E" },
            "broadsword": { name: "Broadsword", attr: "DX", difficulty: "A" },
            "carousing": { name: "Carousing", attr: "HT", difficulty: "E" },
            "climbing": { name: "Climbing", attr: "DX", difficulty: "A" },
            "first_aid": { name: "First Aid", attr: "IQ", difficulty: "E" },
            "intimidation": { name: "Intimidation", attr: "Will", difficulty: "A" },
            "knife": { name: "Knife", attr: "DX", difficulty: "E" },
            "navigation": { name: "Navigation (Land)", attr: "IQ", difficulty: "A" },
            "seamanship": { name: "Seamanship", attr: "IQ", difficulty: "E" },
            "shield": { name: "Shield", attr: "DX", difficulty: "E" },
            "spear": { name: "Spear", attr: "DX", difficulty: "A" },
            "stealth": { name: "Stealth", attr: "DX", difficulty: "A" },
            "survival": { name: "Survival (Woodlands)", attr: "Per", difficulty: "A" },
            "swimming": { name: "Swimming", attr: "HT", difficulty: "E" },
            "tracking": { name: "Tracking", attr: "Per", difficulty: "A" },
            "wrestling": { name: "Wrestling", attr: "DX", difficulty: "A" }
        }
    };

    // --- Interne Hjelpefunksjoner ---

    function calculateSkillLevel(attrValue, difficulty, points) {
        if (points === 0) return 0; 
        
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
        
        let extraLevels = Math.floor((points - 4) / 4);
        return baseLevel + diffOffset + 2 + extraLevels;
    }

    function recalculateTotalPoints() {
        Logger.debug('Character', 'Kalkulerer totale poeng brukt...');
        let total = 0;
        let disadvTotal = 0;

        // Attributter
        total += (state.attributes.ST - 10) * costs.ST;
        total += (state.attributes.DX - 10) * costs.DX;
        total += (state.attributes.IQ - 10) * costs.IQ;
        total += (state.attributes.HT - 10) * costs.HT;

        // Fordeler
        state.advantages.forEach(advId => {
            if (catalogs.advantages[advId]) total += catalogs.advantages[advId].cost;
        });

        // Ulemper
        state.disadvantages.forEach(disId => {
            if (catalogs.disadvantages[disId]) {
                let cost = catalogs.disadvantages[disId].cost;
                total += cost; 
                disadvTotal += cost;
            }
        });

        // Ferdigheter
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
        // --- Core Data Methods ---
        getCharacterData: function() {
            const hp = state.attributes.ST;
            const will = state.attributes.IQ;
            const per = state.attributes.IQ;
            const fp = state.attributes.HT;
            const basicSpeed = (state.attributes.DX + state.attributes.HT) / 4;
            const basicMove = Math.floor(basicSpeed);
            const dodge = Math.floor(basicSpeed) + 3; 

            return {
                name: state.name,
                portrait: state.portrait,
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

        setName: function(newName) {
            state.name = newName;
            Logger.info('Character', `Karakternavn satt til: ${newName}`);
        },

        setPortrait: function(portraitData) {
            state.portrait = portraitData;
            Logger.info('Character', 'Portrett oppdatert.');
        },

        // --- GURPS Logic Methods ---
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

        setSkillPoints: function(skillId, points) {
            if (catalogs.skills[skillId]) {
                if (points === 0) {
                    delete state.skills[skillId];
                    Logger.info('Character', `Fjernet ferdighet: ${catalogs.skills[skillId].name}`);
                } else if (points === 1 || points === 2 || points % 4 === 0) {
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

        getCalculatedSkillLevel: function(skillId) {
            if (!state.skills[skillId] || !catalogs.skills[skillId]) return 0;
            const skillData = catalogs.skills[skillId];
            let baseAttr = state.attributes[skillData.attr];
            
            if (skillData.attr === "Per" || skillData.attr === "Will") {
                baseAttr = state.attributes.IQ; 
            }
            return calculateSkillLevel(baseAttr, skillData.difficulty, state.skills[skillId]);
        },

        // --- Persistens (Lagring og Lasting) ---
        saveToLocalStorage: function() {
            try {
                const serializedState = JSON.stringify(state);
                localStorage.setItem('gurps_midgard_character', serializedState);
                Logger.info('Character', 'Karakter lagret vellykket til nettleserens lokalminne (localStorage).');
                return true;
            } catch (e) {
                Logger.error('Character', 'Feil ved lagring til localStorage: ' + e.message);
                return false;
            }
        },

        loadFromLocalStorage: function() {
            try {
                const serializedState = localStorage.getItem('gurps_midgard_character');
                if (serializedState) {
                    const parsedState = JSON.parse(serializedState);
                    state = { ...state, ...parsedState }; // Fletter inn eksisterende state
                    recalculateTotalPoints();
                    Logger.info('Character', 'Karakter lastet vellykket fra nettleserens lokalminne.');
                    return true;
                }
                Logger.info('Character', 'Ingen lagret karakter funnet i localStorage.');
                return false;
            } catch (e) {
                Logger.error('Character', 'Feil ved lasting fra localStorage: ' + e.message);
                return false;
            }
        },

        exportToJSON: function() {
            Logger.info('Character', 'Forbereder eksport av karakterdata til JSON-streng.');
            return JSON.stringify(state, null, 2); // Returnerer pent formatert JSON
        },

        importFromJSON: function(jsonString) {
            try {
                const parsedState = JSON.parse(jsonString);
                // Grunnleggende validering
                if (parsedState.attributes && parsedState.attributes.ST) {
                    state = { ...state, ...parsedState };
                    recalculateTotalPoints();
                    Logger.info('Character', 'Karakter vellykket importert fra JSON-streng.');
                    return true;
                } else {
                    Logger.error('Character', 'Feil format på JSON. Mangler GURPS attributter.');
                    return false;
                }
            } catch (e) {
                Logger.error('Character', 'Feil ved tolking av JSON-streng for import: ' + e.message);
                return false;
            }
        }
    };
})();

Logger.info('System', 'Utvidet GURPS Karakter-modul (V2) med persistens og full TL4 katalog lastet og klar.');

/* Version: #11 */
