import crypto from 'crypto';

// Esta es la función principal que Vercel ejecutará
export default async function handler(req, res) {
    
    // --- 1. OBTENER SECRETOS ---
    const { GOODWE_USER, GOODWE_PASS, STATION_ID } = process.env;

    if (!GOODWE_USER || !GOODWE_PASS || !STATION_ID) {
        return res.status(500).json({ error: 'Variables de entorno no configuradas en Vercel' });
    }

    try {
        // --- 2. PASO DE LOGIN (¡Servidor EU v2 con Texto Plano!) ---

        // ¡CAMBIO CLAVE! Usamos el endpoint de login v2 de EU
        const loginResponse = await fetch('https://eu.semsportal.com/api/Auth/GetTokenV2', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Token': '{"version":"v2.1.0","client":"ios","language":"en"}' 
            },
            body: JSON.stringify({
                account: GOODWE_USER,
                // ¡CAMBIO CLAVE! Enviamos la contraseña en texto plano, no hasheada
                pwd: GOODWE_PASS, 
            }),
        });

        const loginData = await loginResponse.json();

        // ¡Aquí es donde saltaba tu error 100005!
        if (loginData.code !== 0 || !loginData.data || !loginData.data.token) {
            console.error('Error de login GoodWe (v2 EU):', loginData);
            return res.status(401).json({ error: 'Fallo de autenticación con GoodWe (v2 EU)' });
        }

        // Este es nuestro token de sesión v2
        const sessionToken = loginData.data.token; 

        // --- 3. PASO DE DATOS (Usando v2 de EU) ---
        
        // Creamos el "Token de Cliente" para la API v2
        const dataHeaderToken = JSON.stringify({
            version: "v2.1.0",
            client: "ios",
            language: "en",
            token: sessionToken 
        });

        // ¡CAMBIO CLAVE! Usamos también el servidor de EU para los datos
        const dataResponse = await fetch('https://eu.semsportal.com/api/v2/PowerStation/GetMonitorDetailByPowerstationId', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Token': dataHeaderToken, // Usamos el token de cliente completo
            },
            body: JSON.stringify({
                powerStationId: STATION_ID,
            }),
        });

        const stationData = await dataResponse.json();

        if (stationData.code !== 0) {
            console.error('Error de datos GoodWe (v2 EU):', stationData); 
            return res.status(500).json({ error: 'Fallo al obtener datos de la planta (v2 EU)' });
        }

        // --- 4. ÉXITO: DEVOLVER LOS DATOS AL FRONTEND ---
        res.setHeader('Access-Control-Allow-Origin', '*'); 
        return res.status(200).json(stationData.data);

    } catch (error) {
        console.error('Error en el servidor:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
}
