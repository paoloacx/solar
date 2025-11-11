import crypto from 'crypto';

// Esta es la función principal que Vercel ejecutará
export default async function handler(req, res) {
    
    // --- 1. OBTENER SECRETOS ---
    const { GOODWE_USER, GOODWE_PASS, STATION_ID } = process.env;

    if (!GOODWE_USER || !GOODWE_PASS || !STATION_ID) {
        return res.status(500).json({ error: 'Variables de entorno no configuradas en Vercel' });
    }

    try {
        // --- 2. PASO DE LOGIN (MÉTODO v1) ---
        const loginResponse = await fetch('https://www.semsportal.com/api/v1/Common/CrossLogin', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Token': '{"version":"v2.1.0","client":"ios","language":"en"}' 
            },
            body: JSON.stringify({
                account: GOODWE_USER,
                pwd: GOODWE_PASS, 
            }),
        });

        const loginData = await loginResponse.json();

        if (loginData.code !== 0 || !loginData.data || !loginData.data.token) {
            console.error('Error de login GoodWe:', loginData);
            return res.status(401).json({ error: 'Fallo de autenticación con GoodWe' });
        }

        // Este es nuestro token de sesión
        const sessionToken = loginData.data.token; 

        // --- 3. PASO DE DATOS (Usando el token de sesión) ---
        
        // ¡¡CAMBIO CLAVE AQUÍ!!
        // Creamos el "Token de Cliente" para la API v2, 
        // inyectando el token de sesión que acabamos de obtener.
        const dataHeaderToken = JSON.stringify({
            version: "v2.1.0",
            client: "ios",
            language: "en",
            token: sessionToken // <-- ¡La pieza que faltaba!
        });

        const dataResponse = await fetch('https://www.semsportal.com/api/v2/PowerStation/GetMonitorDetailByPowerstationId', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Token': dataHeaderToken, // <-- ¡Usamos el token de cliente completo!
            },
            body: JSON.stringify({
                powerStationId: STATION_ID,
            }),
        });

        const stationData = await dataResponse.json();

        // ¡Aquí es donde saltaba tu error 100001!
        if (stationData.code !== 0) {
            console.error('Error de datos GoodWe:', stationData);
            return res.status(500).json({ error: 'Fallo al obtener datos de la planta' });
        }

        // --- 4. ÉXITO: DEVOLVER LOS DATOS AL FRONTEND ---
        res.setHeader('Access-Control-Allow-Origin', '*'); 
        return res.status(200).json(stationData.data);

    } catch (error) {
        console.error('Error en el servidor:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
}
