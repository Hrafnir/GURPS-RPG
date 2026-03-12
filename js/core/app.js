/* Version: #15 */

// === SEKSJON: HOVEDAPPLIKASJON (APP) ===
const App = (function() {
    
    // Internt state-objekt for å holde styr på applikasjonens tilstand
    const state = {
        currentView: 'view-main-menu',
        isLocalMapInitialized: false // Holder styr på om kartet har blitt satt opp enda
    };

    // Cache for DOM-elementer for å unngå å søke i DOMen gjentatte ganger (bedre ytelse)
    const domElements = {
        views: {},
        buttons: {}
    };

    // === SEKSJON: INITIALISERING ===
    
    // Finner og lagrer referanser til alle viktige DOM-elementer
    function cacheDOM() {
        Logger.debug('App', 'Beregner og mellomlagrer DOM-elementer...');
        
        // Visninger (Views)
        domElements.views.mainMenu = document.getElementById('view-main-menu');
        domElements.views.characterCreation = document.getElementById('view-character-creation');
        domElements.views.localMap = document.getElementById('view-local-map');
        domElements.views.regionalMap = document.getElementById('view-regional-map');

        // Knapper
        domElements.buttons.newGame = document.getElementById('btn-new-game');
        domElements.buttons.loadGame = document.getElementById('btn-load-game');
        domElements.buttons.finishChar = document.getElementById('btn-finish-char');
        domElements.buttons.toRegional = document.getElementById('btn-to-regional');
        domElements.buttons.toLocal = document.getElementById('btn-to-local');

        Logger.debug('App', 'DOM-elementer er mellomlagret:', domElements);
    }

    // Setter opp alle hendelseslyttere (event listeners)
    function setupEventListeners() {
        Logger.debug('App', 'Setter opp hendelseslyttere for knapper...');

        // Hovedmeny -> Karakterbygging
        if (domElements.buttons.newGame) {
            domElements.buttons.newGame.addEventListener('click', () => {
                Logger.info('App', 'Bruker klikket på "Nytt Spill". Starter karakterbygging.');
                
                // INITIALISERER KARAKTER-UI NÅR VI GÅR INN I SKJERMEN
                if (typeof CharacterUI !== 'undefined') {
                    CharacterUI.init();
                } else {
                    Logger.error('App', 'CharacterUI er ikke definert! Sjekk at scriptet er lastet i index.html.');
                }
                
                switchView('view-character-creation');
            });
        }

        // Karakterbygging -> Lokalt kart
        if (domElements.buttons.finishChar) {
            domElements.buttons.finishChar.addEventListener('click', () => {
                Logger.info('App', 'Bruker fullførte karakterbygging. Går til lokalt kart.');
                switchView('view-local-map');
            });
        }

        // Lokalt kart -> Regionalt kart
        if (domElements.buttons.toRegional) {
            domElements.buttons.toRegional.addEventListener('click', () => {
                Logger.info('App', 'Bruker forlater lokalt område. Går til regionalt kart.');
                switchView('view-regional-map');
            });
        }

        // Regionalt kart -> Lokalt kart
        if (domElements.buttons.toLocal) {
            domElements.buttons.toLocal.addEventListener('click', () => {
                Logger.info('App', 'Bruker går inn i et område. Bytter til lokalt kart.');
                switchView('view-local-map');
            });
        }
        
        // Knapp for å laste inn spill (Ikke implementert enda)
        if (domElements.buttons.loadGame) {
            domElements.buttons.loadGame.addEventListener('click', () => {
                Logger.warn('App', 'Funksjonalitet for "Last Inn Spill" er ikke implementert ennå.');
                alert("Lagring/Lasting av spill er ikke implementert i dette stadiet av prosjektet.");
            });
        }
    }

    // === SEKSJON: VISNINGSLOGIKK (VIEW ROUTING) ===
    
    // Håndterer bytting mellom de ulike skjermene/fasene
    function switchView(targetViewId) {
        Logger.debug('App', `Forsøker å bytte visning fra '${state.currentView}' til '${targetViewId}'`);

        const targetView = document.getElementById(targetViewId);
        const currentView = document.getElementById(state.currentView);

        if (!targetView) {
            Logger.error('App', `Kunne ikke finne visningen med ID: ${targetViewId}. Sjekk index.html.`);
            return;
        }

        // --- HÅNDTERING FØR VI FORLATER NÅVÆRENDE SKJERM ---
        if (state.currentView === 'view-local-map') {
            if (typeof LocalMap !== 'undefined') {
                Logger.info('App', 'Pauser lokal kartmotor (spilleren forlater skjermen).');
                LocalMap.stop();
            }
        }

        // Skjul nåværende visning
        if (currentView) {
            currentView.classList.remove('active');
            currentView.classList.add('hidden');
        } else {
            Logger.warn('App', `Kunne ikke finne nåværende visning for å skjule den: ${state.currentView}`);
        }

        // Vis ny visning
        targetView.classList.remove('hidden');
        targetView.classList.add('active');

        // --- HÅNDTERING ETTER VI HAR GÅTT INN I NY SKJERM ---
        if (targetViewId === 'view-local-map') {
            if (typeof LocalMap !== 'undefined') {
                // Vi initialiserer kartet her fordi elementet må ha mistet '.hidden' 
                // for at canvaset skal vite hvor stort det kan være.
                if (!state.isLocalMapInitialized) {
                    Logger.info('App', 'Første gang spilleren ser kartet. Initialiserer LocalMap.');
                    LocalMap.init();
                    state.isLocalMapInitialized = true;
                }
                
                Logger.info('App', 'Starter lokal kartmotor.');
                LocalMap.start();
            } else {
                Logger.error('App', 'LocalMap er ikke definert! Sjekk index.html.');
            }
        }

        // Oppdater tilstand
        state.currentView = targetViewId;
        Logger.info('App', `Visning byttet vellykket til: ${targetViewId}`);
    }

    // === SEKSJON: OFFENTLIGE METODER ===
    return {
        init: function() {
            Logger.info('App', 'Initialiserer hovedapplikasjonen...');
            cacheDOM();
            setupEventListeners();
            Logger.info('App', 'Applikasjonen er ferdig initialisert og klar for brukerinput.');
        }
    };
})();

// Start applikasjonen trygt når hele HTML-dokumentet (DOM) er ferdig lastet og parset
document.addEventListener('DOMContentLoaded', () => {
    Logger.debug('System', 'DOMContentLoaded-hendelse utløst. Venter på at alt er klart...');
    App.init();
});

/* Version: #15 */
