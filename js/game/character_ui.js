/* Version: #16 */

// === SEKSJON: KARAKTERBYGGING BRUKERGRENSESNITT ===
const CharacterUI = (function() {

    let container = null;

    // Definerer stiene til de 10 standardportrettene (krever at filene eksisterer i mappen)
    const presetPortraits = [
        { id: 'm1', path: 'assets/portraits/male_1.jpg', label: 'M1' },
        { id: 'm2', path: 'assets/portraits/male_2.jpg', label: 'M2' },
        { id: 'm3', path: 'assets/portraits/male_3.jpg', label: 'M3' },
        { id: 'm4', path: 'assets/portraits/male_4.jpg', label: 'M4' },
        { id: 'm5', path: 'assets/portraits/male_5.jpg', label: 'M5' },
        { id: 'f1', path: 'assets/portraits/female_1.jpg', label: 'K1' },
        { id: 'f2', path: 'assets/portraits/female_2.jpg', label: 'K2' },
        { id: 'f3', path: 'assets/portraits/female_3.jpg', label: 'K3' },
        { id: 'f4', path: 'assets/portraits/female_4.jpg', label: 'K4' },
        { id: 'f5', path: 'assets/portraits/female_5.jpg', label: 'K5' }
    ];

    // === SEKSJON: INITIALISERING OG DOM-OPPSETT ===
    function init() {
        Logger.info('CharacterUI', 'Initialiserer brukergrensesnitt for karakterbygging (V3 med preset portretter)...');
        container = document.getElementById('char-creation-content');
        
        if (!container) {
            Logger.error('CharacterUI', 'Fant ikke containeren #char-creation-content i DOM!');
            return;
        }

        // Bygger selve skjelettet for grensesnittet
        buildUIStructure();
        
        // Fyller grensesnittet med data fra datamodellen
        render();
        
        Logger.info('CharacterUI', 'Brukergrensesnitt for karakterbygging er klart.');
    }

    function buildUIStructure() {
        Logger.debug('CharacterUI', 'Bygger DOM-struktur for karakterbygging...');
        
        // Generer HTML for miniatyrbildene til forhåndsvalg
        let presetsHTML = '';
        presetPortraits.forEach(preset => {
            presetsHTML += `
                <button onclick="CharacterUI.setPresetPortrait('${preset.path}')" 
                        style="width: 35px; height: 35px; margin: 2px; padding: 0; font-size: 0.7rem; background-color: var(--color-iron-dark); border: 1px solid var(--color-iron); color: var(--color-text-main); cursor: pointer;"
                        title="Velg portrett ${preset.label}">
                    ${preset.label}
                </button>
            `;
        });

        container.innerHTML = `
            <div id="char-header" style="border-bottom: 2px solid var(--color-iron); padding-bottom: 1rem; margin-bottom: 1rem; display: flex; gap: 2rem; align-items: flex-start;">
                
                <div id="char-portrait-container" style="text-align: center; width: 220px;">
                    <div style="width: 150px; height: 150px; margin: 0 auto; border: 2px solid var(--color-iron); background-color: #000; overflow: hidden; display: flex; align-items: center; justify-content: center; margin-bottom: 10px;">
                        <img id="char-portrait-img" src="" alt="Ingen portrett" style="width: 100%; height: 100%; object-fit: cover; display: none;">
                        <span id="char-portrait-placeholder" style="color: var(--color-iron); font-size: 0.8rem;">[Bilde mangler]</span>
                    </div>
                    
                    <label for="portrait-upload" style="cursor: pointer; background: var(--color-iron-dark); color: var(--color-text-main); padding: 5px; font-size: 0.8rem; border: 1px solid var(--color-iron); display: block; margin-bottom: 10px;">Last opp eget bilde</label>
                    <input type="file" id="portrait-upload" accept="image/*" style="display: none;">
                    
                    <div style="border-top: 1px dashed var(--color-iron); padding-top: 5px;">
                        <span style="font-size: 0.8rem; color: var(--color-iron); display: block; margin-bottom: 5px;">Eller velg standard:</span>
                        <div id="portrait-presets-container" style="display: flex; flex-wrap: wrap; justify-content: center; gap: 2px;">
                            ${presetsHTML}
                        </div>
                    </div>
                </div>

                <div style="flex-grow: 1;">
                    <h3>Navn: <input type="text" id="char-name-input" value="Ukjent Kriger" style="background: var(--color-bg-dark); color: var(--color-text-main); border: 1px solid var(--color-iron); padding: 5px; font-family: var(--font-heading); width: 80%; max-width: 300px;"></h3>
                    <h3 id="char-points-display" style="color: var(--color-accent-red); margin-top: 10px;">Poeng: 0 / 150</h3>
                </div>
            </div>

            <div style="display: flex; flex-wrap: wrap; gap: 2rem;">
                
                <div id="char-attributes" style="flex: 1; min-width: 250px; border: 1px solid var(--color-iron-dark); padding: 1rem;">
                    <h4>Grunnattributter</h4>
                    <div id="attr-list"></div>
                </div>

                <div id="char-secondary" style="flex: 1; min-width: 250px; border: 1px solid var(--color-iron-dark); padding: 1rem;">
                    <h4>Sekundære Egenskaper</h4>
                    <div id="secondary-list"></div>
                </div>

            </div>

            <div style="display: flex; flex-wrap: wrap; gap: 2rem; margin-top: 2rem;">
                
                <div id="char-advantages" style="flex: 1; min-width: 250px; border: 1px solid var(--color-iron-dark); padding: 1rem;">
                    <h4>Fordeler</h4>
                    <select id="adv-select" style="width: 100%; margin-bottom: 10px; background: var(--color-bg-dark); color: var(--color-text-main); padding: 5px;"></select>
                    <button id="btn-add-adv" style="width: 100%; font-size: 1rem; padding: 5px;">Legg til Fordel</button>
                    <ul id="adv-list" style="margin-top: 10px; list-style-type: none; padding: 0;"></ul>
                </div>

                <div id="char-disadvantages" style="flex: 1; min-width: 250px; border: 1px solid var(--color-iron-dark); padding: 1rem;">
                    <h4>Ulemper (Maks -50p)</h4>
                    <select id="disadv-select" style="width: 100%; margin-bottom: 10px; background: var(--color-bg-dark); color: var(--color-text-main); padding: 5px;"></select>
                    <button id="btn-add-disadv" style="width: 100%; font-size: 1rem; padding: 5px;">Legg til Ulempe</button>
                    <ul id="disadv-list" style="margin-top: 10px; list-style-type: none; padding: 0;"></ul>
                </div>

            </div>

            <div id="char-skills" style="margin-top: 2rem; border: 1px solid var(--color-iron-dark); padding: 1rem;">
                <h4>Ferdigheter</h4>
                <div style="display: flex; gap: 10px; margin-bottom: 10px;">
                    <select id="skill-select" style="flex: 1; background: var(--color-bg-dark); color: var(--color-text-main); padding: 5px;"></select>
                    <button id="btn-add-skill" style="font-size: 1rem; padding: 5px 15px; width: auto; margin: 0;">Kjøp (1p)</button>
                </div>
                <ul id="skill-list" style="list-style-type: none; padding: 0;"></ul>
            </div>

            <div id="char-save-load" style="margin-top: 2rem; border-top: 2px solid var(--color-iron); padding-top: 1rem; display: flex; gap: 10px; flex-wrap: wrap; justify-content: center;">
                <button id="btn-save-local" style="width: auto; font-size: 0.9rem; margin: 5px;">Lagre i Nettleser</button>
                <button id="btn-load-local" style="width: auto; font-size: 0.9rem; margin: 5px;">Last fra Nettleser</button>
                <button id="btn-export-json" style="width: auto; font-size: 0.9rem; margin: 5px;">Last ned JSON</button>
                <label for="import-json-upload" style="cursor: pointer; background: var(--color-iron-dark); color: var(--color-text-main); padding: 10px 20px; font-size: 0.9rem; border: 2px solid var(--color-iron); margin: 5px; display: inline-block; font-family: var(--font-heading); transition: all 0.2s ease;">Last opp JSON</label>
                <input type="file" id="import-json-upload" accept=".json" style="display: none;">
            </div>
        `;

        setupStaticListeners();
    }

    function setupStaticListeners() {
        // Navn
        document.getElementById('char-name-input').addEventListener('change', (e) => {
            Character.setName(e.target.value);
            render();
        });

        // Portrett opplasting (Konverterer fil til Base64 streng)
        document.getElementById('portrait-upload').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            Logger.info('CharacterUI', `Forsøker å laste opp bilde: ${file.name}`);
            const reader = new FileReader();
            reader.onload = function(event) {
                Character.setPortrait(event.target.result);
                render();
            };
            reader.readAsDataURL(file);
        });

        // Legg til fordel
        document.getElementById('btn-add-adv').addEventListener('click', () => {
            const select = document.getElementById('adv-select');
            if (select.value) {
                Character.addAdvantage(select.value);
                render();
            }
        });

        // Legg til ulempe
        document.getElementById('btn-add-disadv').addEventListener('click', () => {
            const select = document.getElementById('disadv-select');
            if (select.value) {
                Character.addDisadvantage(select.value);
                render();
            }
        });

        // Legg til ferdighet
        document.getElementById('btn-add-skill').addEventListener('click', () => {
            const select = document.getElementById('skill-select');
            if (select.value) {
                Character.setSkillPoints(select.value, 1);
                render();
            }
        });

        // --- LAGRING OG PERSISTENS LYTTERE ---

        document.getElementById('btn-save-local').addEventListener('click', () => {
            const success = Character.saveToLocalStorage();
            if (success) alert("Karakter lagret i nettleseren!");
        });

        document.getElementById('btn-load-local').addEventListener('click', () => {
            const success = Character.loadFromLocalStorage();
            if (success) {
                render();
                alert("Karakter lastet inn fra nettleseren!");
            } else {
                alert("Ingen lagret karakter funnet.");
            }
        });

        document.getElementById('btn-export-json').addEventListener('click', () => {
            const jsonString = Character.exportToJSON();
            const blob = new Blob([jsonString], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `${Character.getCharacterData().name.replace(/\s+/g, '_')}_GURPS.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            Logger.info('CharacterUI', 'JSON-fil eksportert og lastet ned.');
        });

        document.getElementById('import-json-upload').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            Logger.info('CharacterUI', `Forsøker å importere JSON fra fil: ${file.name}`);
            const reader = new FileReader();
            reader.onload = function(event) {
                const success = Character.importFromJSON(event.target.result);
                if (success) {
                    render();
                    alert("Karakter importert vellykket!");
                } else {
                    alert("Feil ved import. Sjekk at filen er en gyldig GURPS-JSON for dette spillet.");
                }
            };
            reader.readAsText(file);
            e.target.value = '';
        });
    }

    // === SEKSJON: OPPDATERING AV GRENSESNITT (RENDER) ===
    function render() {
        Logger.debug('CharacterUI', 'Tegner brukergrensesnitt på nytt basert på datamodell...');
        const charData = Character.getCharacterData();
        const catalogs = Character.getCatalogs();

        // Oppdater Navn i input-feltet
        const nameInput = document.getElementById('char-name-input');
        if (nameInput.value !== charData.name) {
            nameInput.value = charData.name;
        }

        // Oppdater Portrett
        const imgEl = document.getElementById('char-portrait-img');
        const placeholderEl = document.getElementById('char-portrait-placeholder');
        if (charData.portrait) {
            imgEl.src = charData.portrait;
            imgEl.style.display = 'block';
            placeholderEl.style.display = 'none';
        } else {
            imgEl.src = '';
            imgEl.style.display = 'none';
            placeholderEl.style.display = 'inline';
        }

        // Oppdater poeng
        const pointsDisplay = document.getElementById('char-points-display');
        pointsDisplay.innerText = `Poeng Brukt: ${charData.pointsSpent} / 150 (Gjenstår: ${charData.pointsRemaining})`;
        if (charData.pointsRemaining < 0) {
            pointsDisplay.style.color = "red";
        } else {
            pointsDisplay.style.color = "var(--color-text-main)";
        }

        // Render Attributter
        const attrList = document.getElementById('attr-list');
        attrList.innerHTML = '';
        const attrNames = ['ST', 'DX', 'IQ', 'HT'];
        attrNames.forEach(attr => {
            const val = charData.attributes[attr];
            const div = document.createElement('div');
            div.style.display = 'flex';
            div.style.justifyContent = 'space-between';
            div.style.marginBottom = '5px';
            div.innerHTML = `
                <span><strong>${attr}:</strong> ${val}</span>
                <div>
                    <button onclick="CharacterUI.changeAttr('${attr}', ${val - 1})" style="width: 30px; margin: 0; padding: 0;">-</button>
                    <button onclick="CharacterUI.changeAttr('${attr}', ${val + 1})" style="width: 30px; margin: 0; padding: 0;">+</button>
                </div>
            `;
            attrList.appendChild(div);
        });

        // Render Sekundære egenskaper
        const secList = document.getElementById('secondary-list');
        secList.innerHTML = `
            <p><strong>HP (Hit Points):</strong> ${charData.secondary.HP}</p>
            <p><strong>FP (Fatigue Points):</strong> ${charData.secondary.FP}</p>
            <p><strong>Will:</strong> ${charData.secondary.Will}</p>
            <p><strong>Perception:</strong> ${charData.secondary.Per}</p>
            <p><strong>Basic Speed:</strong> ${charData.secondary.BasicSpeed}</p>
            <p><strong>Basic Move:</strong> ${charData.secondary.BasicMove}</p>
            <p><strong>Dodge:</strong> ${charData.secondary.Dodge}</p>
        `;

        // Oppdater Dropdowns
        updateDropdown('adv-select', catalogs.advantages, charData.advantages);
        updateDropdown('disadv-select', catalogs.disadvantages, charData.disadvantages);
        updateDropdown('skill-select', catalogs.skills, Object.keys(charData.skills));

        // Render Valgte Fordeler
        const advList = document.getElementById('adv-list');
        advList.innerHTML = '';
        charData.advantages.forEach(id => {
            if (!catalogs.advantages[id]) return; 
            const adv = catalogs.advantages[id];
            const li = document.createElement('li');
            li.style.marginBottom = '5px';
            li.innerHTML = `<button onclick="CharacterUI.removeAdv('${id}')" style="width:auto; margin:0 10px 0 0; padding:2px 5px; font-size: 0.8rem; background: var(--color-accent-red);">X</button> <strong title="${adv.desc}">${adv.name}</strong> [${adv.cost}]`;
            advList.appendChild(li);
        });

        // Render Valgte Ulemper
        const disadvList = document.getElementById('disadv-list');
        disadvList.innerHTML = '';
        charData.disadvantages.forEach(id => {
            if (!catalogs.disadvantages[id]) return; 
            const disadv = catalogs.disadvantages[id];
            const li = document.createElement('li');
            li.style.marginBottom = '5px';
            li.innerHTML = `<button onclick="CharacterUI.removeDisadv('${id}')" style="width:auto; margin:0 10px 0 0; padding:2px 5px; font-size: 0.8rem; background: var(--color-accent-red);">X</button> <strong title="${disadv.desc}">${disadv.name}</strong> [${disadv.cost}]`;
            disadvList.appendChild(li);
        });

        // Render Valgte Ferdigheter
        const skillListElement = document.getElementById('skill-list');
        skillListElement.innerHTML = '';
        for (const [id, points] of Object.entries(charData.skills)) {
            if (!catalogs.skills[id]) continue; 
            const skill = catalogs.skills[id];
            const level = Character.getCalculatedSkillLevel(id);
            const li = document.createElement('li');
            li.style.display = 'flex';
            li.style.justifyContent = 'space-between';
            li.style.borderBottom = '1px solid var(--color-iron-dark)';
            li.style.padding = '5px 0';
            li.innerHTML = `
                <span>
                    <button onclick="CharacterUI.removeSkill('${id}')" style="width:auto; margin:0 10px 0 0; padding:2px 5px; font-size: 0.8rem; background: var(--color-accent-red);">X</button>
                    <strong>${skill.name}</strong> (${skill.attr}/${skill.difficulty}) - Nivå: <strong>${level}</strong> [${points}p]
                </span>
                <div>
                    <button onclick="CharacterUI.upgradeSkill('${id}', ${points})" style="width:auto; margin:0; padding:2px 5px; font-size: 0.8rem;">Øk nivå</button>
                </div>
            `;
            skillListElement.appendChild(li);
        }
    }

    function updateDropdown(selectId, catalog, excludeList) {
        const select = document.getElementById(selectId);
        select.innerHTML = '<option value="">-- Velg --</option>';
        
        const sortedKeys = Object.keys(catalog).sort((a, b) => {
            return catalog[a].name.localeCompare(catalog[b].name);
        });

        for (const id of sortedKeys) {
            const item = catalog[id];
            if (!excludeList.includes(id)) {
                const costText = item.cost !== undefined ? ` [${item.cost}]` : '';
                select.innerHTML += `<option value="${id}">${item.name}${costText}</option>`;
            }
        }
    }

    // === SEKSJON: OFFENTLIGE METODER (TILGJENGELIG FOR INLINE HTML ONCLICK) ===
    return {
        init: init,
        setPresetPortrait: function(path) {
            Logger.info('CharacterUI', `Forhåndsvalgt portrett valgt: ${path}`);
            Character.setPortrait(path);
            render();
        },
        changeAttr: function(attr, newVal) {
            Character.setAttribute(attr, newVal);
            render();
        },
        removeAdv: function(id) {
            Character.removeAdvantage(id);
            render();
        },
        removeDisadv: function(id) {
            Character.removeDisadvantage(id);
            render();
        },
        removeSkill: function(id) {
            Character.setSkillPoints(id, 0);
            render();
        },
        upgradeSkill: function(id, currentPoints) {
            let nextPoints = 0;
            if (currentPoints === 1) nextPoints = 2;
            else if (currentPoints === 2) nextPoints = 4;
            else nextPoints = currentPoints + 4;
            
            Character.setSkillPoints(id, nextPoints);
            render();
        }
    };
})();

/* Version: #16 */
