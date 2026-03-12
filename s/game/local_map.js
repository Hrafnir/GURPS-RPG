/* Version: #13 */

// === SEKSJON: LOKAL KARTMOTOR (CANVAS) ===
const LocalMap = (function() {

    // --- DOM og Rendering ---
    let container = null;
    let canvas = null;
    let ctx = null;
    let animationFrameId = null;

    // --- Spilltilstand (State) ---
    const state = {
        isRunning: false,
        camera: {
            x: 0,
            y: 0
        },
        map: {
            tileSize: 50, // Størrelse på hver rute (tile) i piksler
            cols: 40,     // Størrelse på selve kartet (antall ruter)
            rows: 40
        },
        player: {
            x: 10, // Startposisjon (grid-koordinater)
            y: 10,
            pixelX: 500, // Faktisk pikselposisjon på kartet
            pixelY: 500,
            speed: 4, // Piksler per frame
            radius: 20,
            image: null,
            isImageLoaded: false
        },
        keys: {
            ArrowUp: false,
            ArrowDown: false,
            ArrowLeft: false,
            ArrowRight: false,
            w: false,
            a: false,
            s: false,
            d: false
        }
    };

    // === SEKSJON: INITIALISERING OG OPPSETT ===

    function init() {
        Logger.info('LocalMap', 'Initialiserer Lokal Kartmotor (Canvas)...');
        container = document.getElementById('local-map-container');

        if (!container) {
            Logger.error('LocalMap', 'Fant ikke #local-map-container i DOM!');
            return;
        }

        // Tøm containeren i tilfelle den har gammelt innhold
        container.innerHTML = '';

        // Opprett Canvas
        canvas = document.createElement('canvas');
        canvas.id = 'local-map-canvas';
        
        // Sett størrelse basert på containerens størrelse (med fallback)
        canvas.width = container.clientWidth || 800;
        canvas.height = container.clientHeight || 600;
        
        // Sørg for at canvaset tar all tilgjengelig plass hvis vinduet endres
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.display = 'block';

        ctx = canvas.getContext('2d');
        container.appendChild(canvas);

        setupEventListeners();
        loadPlayerData();

        Logger.info('LocalMap', `Canvas opprettet med størrelse ${canvas.width}x${canvas.height}.`);
    }

    function setupEventListeners() {
        Logger.debug('LocalMap', 'Setter opp hendelseslyttere for tastatur...');
        
        // Lytter på hele vinduet for å fange opp tastetrykk
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        // Håndter endring av vindustørrelse
        window.addEventListener('resize', handleResize);
    }

    function removeEventListeners() {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
        window.removeEventListener('resize', handleResize);
    }

    function handleKeyDown(e) {
        if (state.keys.hasOwnProperty(e.key)) {
            state.keys[e.key] = true;
        }
    }

    function handleKeyUp(e) {
        if (state.keys.hasOwnProperty(e.key)) {
            state.keys[e.key] = false;
        }
    }

    function handleResize() {
        if (canvas && container) {
            canvas.width = container.clientWidth;
            canvas.height = container.clientHeight;
            Logger.debug('LocalMap', `Canvas endret størrelse til ${canvas.width}x${canvas.height}`);
        }
    }

    function loadPlayerData() {
        Logger.debug('LocalMap', 'Henter spillerdata fra Character-modulen...');
        
        // Hvis Character-modulen finnes, hent portrett og hastighet
        if (typeof Character !== 'undefined') {
            const charData = Character.getCharacterData();
            
            // Juster hastighet basert på GURPS Basic Move (med en multiplikator for spillbarhet)
            if (charData.secondary && charData.secondary.BasicMove) {
                state.player.speed = charData.secondary.BasicMove * 0.8;
                Logger.debug('LocalMap', `Spillerhastighet satt til ${state.player.speed} (Basert på Basic Move ${charData.secondary.BasicMove})`);
            }

            // Last inn portrett hvis det finnes
            if (charData.portrait) {
                const img = new Image();
                img.onload = () => {
                    state.player.image = img;
                    state.player.isImageLoaded = true;
                    Logger.info('LocalMap', 'Spillerportrett lastet vellykket inn i kartmotoren.');
                };
                img.onerror = () => {
                    Logger.warn('LocalMap', 'Kunne ikke laste spillerportrett som bilde i canvas. Bruker standardform.');
                };
                img.src = charData.portrait;
            } else {
                Logger.info('LocalMap', 'Ingen spillerportrett funnet. Bruker standardform for spiller.');
            }
        }
    }

    // === SEKSJON: SPILL-LØKKE (GAME LOOP) ===

    function start() {
        if (!state.isRunning) {
            Logger.info('LocalMap', 'Starter spill-løkken for lokalt kart.');
            state.isRunning = true;
            
            // Sørg for at vi plasserer spilleren riktig i piksel-koordinater ved start
            state.player.pixelX = state.player.x * state.map.tileSize;
            state.player.pixelY = state.player.y * state.map.tileSize;

            loop();
        }
    }

    function stop() {
        if (state.isRunning) {
            Logger.info('LocalMap', 'Stopper spill-løkken for lokalt kart.');
            state.isRunning = false;
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
        }
    }

    function loop() {
        if (!state.isRunning) return;

        update();
        draw();

        animationFrameId = requestAnimationFrame(loop);
    }

    // === SEKSJON: LOGIKK OG OPPDATERING ===

    function update() {
        let dx = 0;
        let dy = 0;

        // Sjekk input for bevegelse
        if (state.keys.ArrowUp || state.keys.w) dy -= state.player.speed;
        if (state.keys.ArrowDown || state.keys.s) dy += state.player.speed;
        if (state.keys.ArrowLeft || state.keys.a) dx -= state.player.speed;
        if (state.keys.ArrowRight || state.keys.d) dx += state.player.speed;

        // Normaliser diagonal bevegelse så vi ikke går raskere på skrå
        if (dx !== 0 && dy !== 0) {
            const length = Math.sqrt(dx * dx + dy * dy);
            dx = (dx / length) * state.player.speed;
            dy = (dy / length) * state.player.speed;
        }

        // Oppdater spillerens posisjon
        state.player.pixelX += dx;
        state.player.pixelY += dy;

        // Begrens spilleren til kartets grenser
        const maxPixelX = state.map.cols * state.map.tileSize;
        const maxPixelY = state.map.rows * state.map.tileSize;
        
        if (state.player.pixelX < 0) state.player.pixelX = 0;
        if (state.player.pixelY < 0) state.player.pixelY = 0;
        if (state.player.pixelX > maxPixelX) state.player.pixelX = maxPixelX;
        if (state.player.pixelY > maxPixelY) state.player.pixelY = maxPixelY;

        // Oppdater grid-koordinater (for fremtidig logikk, f.eks. kollisjon med vegger)
        state.player.x = Math.floor(state.player.pixelX / state.map.tileSize);
        state.player.y = Math.floor(state.player.pixelY / state.map.tileSize);

        // Oppdater kameraet (følg spilleren, hold spilleren i sentrum)
        state.camera.x = state.player.pixelX - (canvas.width / 2);
        state.camera.y = state.player.pixelY - (canvas.height / 2);

        // Begrens kameraet til kartkanten
        if (state.camera.x < 0) state.camera.x = 0;
        if (state.camera.y < 0) state.camera.y = 0;
        if (state.camera.x > maxPixelX - canvas.width) Math.max(0, state.camera.x = maxPixelX - canvas.width);
        if (state.camera.y > maxPixelY - canvas.height) Math.max(0, state.camera.y = maxPixelY - canvas.height);
    }

    // === SEKSJON: TEGNING (RENDERING) ===

    function draw() {
        // Tøm skjermen med en mørk bakgrunnsfarge
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Bruk save/restore for å påføre kamerakompensasjon på alt som tegnes i verdenen
        ctx.save();
        ctx.translate(-state.camera.x, -state.camera.y);

        drawGrid();
        drawPlayer();

        ctx.restore(); // Gjenopprett canvaset slik at UI (hvis vi legger til det) ikke påvirkes av kameraet
    }

    function drawGrid() {
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;

        const maxPixelX = state.map.cols * state.map.tileSize;
        const maxPixelY = state.map.rows * state.map.tileSize;

        // Tegn vertikale linjer
        for (let x = 0; x <= maxPixelX; x += state.map.tileSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, maxPixelY);
            ctx.stroke();
        }

        // Tegn horisontale linjer
        for (let y = 0; y <= maxPixelY; y += state.map.tileSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(maxPixelX, y);
            ctx.stroke();
        }

        // Tegn en ytre ramme rundt hele kartet
        ctx.strokeStyle = '#8b2626'; // Vår accent-red farge
        ctx.lineWidth = 4;
        ctx.strokeRect(0, 0, maxPixelX, maxPixelY);
    }

    function drawPlayer() {
        if (state.player.isImageLoaded && state.player.image) {
            // Tegn portrettbilde (skalert til å passe roughly en tile)
            const size = state.map.tileSize;
            // Sentrer bildet på pixelX/Y
            ctx.drawImage(
                state.player.image, 
                state.player.pixelX - (size/2), 
                state.player.pixelY - (size/2), 
                size, 
                size
            );
            
            // Tegn en ramme rundt portrettet
            ctx.strokeStyle = '#e2d8c3';
            ctx.lineWidth = 2;
            ctx.strokeRect(state.player.pixelX - (size/2), state.player.pixelY - (size/2), size, size);
        } else {
            // Tegn standardform (sirkel) hvis bilde mangler
            ctx.fillStyle = '#8b2626';
            ctx.beginPath();
            ctx.arc(state.player.pixelX, state.player.pixelY, state.player.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#e2d8c3';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }

    // === SEKSJON: OFFENTLIGE METODER ===
    return {
        init: init,
        start: start,
        stop: stop,
        cleanup: function() {
            Logger.info('LocalMap', 'Rydder opp lokalt kart.');
            stop();
            removeEventListeners();
            if (container) container.innerHTML = '';
        }
    };
})();

/* Version: #13 */
