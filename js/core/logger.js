/* Version: #3 */

// === SEKSJON: OPETT OG KONFIGURASJON ===
const Logger = (function() {
    
    // Internt konfigurasjonsobjekt
    const config = {
        // Hvilket nivå vi logger på. Kan settes til 'INFO', 'WARN', 'ERROR', eller 'DEBUG'
        currentLevel: 'DEBUG', 
        showTimestamp: true
    };

    // Definerer farger for konsollen for å gjøre loggen lettere å lese
    const colors = {
        INFO: 'color: #4CAF50; font-weight: bold;',   // Grønn
        WARN: 'color: #FF9800; font-weight: bold;',   // Oransje
        ERROR: 'color: #F44336; font-weight: bold;',  // Rød
        DEBUG: 'color: #2196F3; font-weight: bold;'   // Blå
    };

    // Nivå-hierarki for å filtrere logg
    const levels = {
        DEBUG: 1,
        INFO: 2,
        WARN: 3,
        ERROR: 4
    };

    // === SEKSJON: HJELPEFUNKSJONER ===
    
    // Genererer et pent formatert tidsstempel [HH:MM:SS:MS]
    function getTimestamp() {
        if (!config.showTimestamp) return '';
        const now = new Date();
        const h = String(now.getHours()).padStart(2, '0');
        const m = String(now.getMinutes()).padStart(2, '0');
        const s = String(now.getSeconds()).padStart(2, '0');
        const ms = String(now.getMilliseconds()).padStart(3, '0');
        return `[${h}:${m}:${s}:${ms}] `;
    }

    // Sjekker om meldingen skal logges basert på nåværende loggnivå
    function shouldLog(level) {
        return levels[level] >= levels[config.currentLevel];
    }

    // Kjernemetode for å skrive ut til konsollen
    function output(level, context, message, data) {
        if (!shouldLog(level)) return;

        const timestamp = getTimestamp();
        const prefix = `${timestamp}[${level}] [${context}]`;

        if (data !== null && data !== undefined) {
            console.log(`%c${prefix}`, colors[level], message, data);
        } else {
            console.log(`%c${prefix}`, colors[level], message);
        }
    }

    // === SEKSJON: OFFENTLIGE METODER ===
    return {
        // Endre loggnivå underveis (f.eks. via konsollen under testing)
        setLevel: function(newLevel) {
            if (levels[newLevel]) {
                config.currentLevel = newLevel;
                this.info('Logger', `Loggnivå endret til: ${newLevel}`);
            } else {
                this.error('Logger', `Ugyldig loggnivå: ${newLevel}`);
            }
        },

        // Ulike loggnivåer for ulik type informasjon
        debug: function(context, message, data = null) {
            output('DEBUG', context, message, data);
        },
        info: function(context, message, data = null) {
            output('INFO', context, message, data);
        },
        warn: function(context, message, data = null) {
            output('WARN', context, message, data);
        },
        error: function(context, message, data = null) {
            output('ERROR', context, message, data);
        }
    };
})();

// Bekreftelse på at loggeren er lastet og klar
Logger.info('System', 'Logger-modulen er initialisert og klar til bruk.');

/* Version: #3 */
