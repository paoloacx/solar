import crypto from 'crypto';

// Un User-Agent común para simular un navegador
const FAKE_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36';

// ¡NUEVO! Cabeceras comunes para simular un navegador
const COMMON_HEADERS = {
    'Content-Type': 'application/json',
    'User-Agent': FAKE_USER_AGENT,
    'Accept': 'application/json, text/plain, */*',
    'Referer': 'https://eu.semsportal.com/' // <-- ¡Esta es la nueva clave!
};

// Esta es la función principal que Vercel ejecutará
export default async function handler(req, res) {
    
    // --- 1. OBTENER SECRETOS ---
    const { GOODWE_USER, GOODWE_PASS, STATION_ID } = process.env;

    if (!GOODWE_USER || !GOODWE_PASS || !STATION_ID) {
        return res.status(500).json({ error: 'Variables de entorno no configuradas en Vercel' });
    }

    try {
        // --- 2. PASO DE LOGIN (¡Servidor EU v1!) ---
        const loginResponse = await fetch('https://eu.semsportal.com/api/v1/Common/CrossLogin', {
            method: 'POST',
            headers: { 
                ...COMMON_HEADERS, // <-- Usamos las cabeceras comunes
                'Token': '{"version":"v2.1.0","client":"ios","language":"en"}'
            },
            body: JSON.stringify({
                account: GOODWE_USER,
                pwd: GOODWE_PASS, 
            }),
        });

        const loginData = await loginResponse.json();

        if (loginData.code !== 0 || !loginData.data || !loginData.data.token) {
            console.error('Error de login GoodWe (v1 EU):', loginData);
            return res.status(401).json({ error: 'Fallo de autenticación con GoodWe (v1 EU)' });
        }

        const sessionToken = loginData.data.token; 

        // --- 3. PASO DE DATOS (Usando v1 de EU) ---
        
        // Creamos el "Token" para la segunda llamada
        const dataHeaderToken = JSON.stringify({
            version: "v2.1.0",
            client: "ios",
            language: "en",
            token: sessionToken
        });

        const dataResponse = await fetch('https://eu.semsportal.com/api/v1/PowerStation/GetMonitorDetailByPowerstationId', {
            method: 'POST',
            headers: {
                ...COMMON_HEADERS, // <-- Usamos las cabeceras comunes
                'Token': dataHeaderToken
            },
            body: JSON.stringify({
                powerStationId: STATION_ID,
            }),
        });

        // ¡AQUÍ ES DONDE FALLABA! (Línea 65 aprox)
        const stationData = await dataResponse.json();

        if (stationData.code !== 0) {
            console.error('Error de datos GoodWe (v1 EU):', stationData); 
            return res.status(500).json({ error: 'Fallo al obtener datos de la planta (v1 EU)' });
        }

        // --- 4. ÉXITO: DEVOLVER LOS DATOS AL FRONTEND ---
        res.setHeader('Access-Control-Allow-Origin', '*'); 
        return res.status(200).json(stationData.data);

    } catch (error) {
        console.error('Error en el servidor:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
}
