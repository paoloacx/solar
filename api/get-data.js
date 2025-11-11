// Importamos 'crypto' para hashear la contraseña (la API de GoodWe lo requiere)
const crypto = require('crypto');

// Esta es la función principal que Vercel ejecutará
export default async function handler(req, res) {
    
    // --- 1. CONFIGURACIÓN DE SEGURIDAD (CORS) ---
    // Esto permite que tu web (y solo tu web, una vez desplegada) le hable a esta API.
    // Por ahora usamos '*' (cualquiera) para que funcione en desarrollo.
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Si el navegador solo está "preguntando" si puede conectarse (OPTIONS request)
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // --- 2. OBTENER SECRETOS ---
    // Obtenemos las variables seguras que configuraremos en Vercel
    const { GOODWE_USER, GOODWE_PASS, STATION_ID } = process.env;

    if (!GOODWE_USER || !GOODWE_PASS || !STATION_ID) {
        return res.status(500).json({ error: 'Variables de entorno no configuradas en Vercel' });
    }

    // Hasheamos la contraseña a MD5 (requisito de la API de GoodWe)
    const hashedPassword = crypto.createHash('md5').update(GOODWE_PASS).digest('hex');

    try {
        // --- 3. PASO DE LOGIN: OBTENER EL TOKEN ---
        const loginResponse = await fetch('https://www.semsportal.com/api/v2/Common/CrossLogin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                account: GOODWE_USER,
                pwd: hashedPassword,
            }),
        });

        const loginData = await loginResponse.json();

        // Si el login falla...
        if (loginData.code !== 0 || !loginData.data || !loginData.data.token) {
            console.error('Error de login GoodWe:', loginData);
            return res.status(401).json({ error: 'Fallo de autenticación con GoodWe' });
        }

        const token = loginData.data.token;

        // --- 4. PASO DE DATOS: OBTENER DATOS DE LA PLANTA ---
        const dataResponse = await fetch('https://www.semsportal.com/api/v2/PowerStation/GetMonitorDetailByPowerstationId', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Token': token,
            },
            body: JSON.stringify({
                powerStationId: STATION_ID,
            }),
        });

        const stationData = await dataResponse.json();

        if (stationData.code !== 0) {
            console.error('Error de datos GoodWe:', stationData);
            return res.status(500).json({ error: 'Fallo al obtener datos de la planta' });
        }

        // --- 5. ÉXITO: DEVOLVER LOS DATOS AL FRONTEND ---
        // Devolvemos solo la parte 'data' que es lo que nos interesa
        return res.status(200).json(stationData.data);

    } catch (error) {
        console.error('Error en el servidor:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
}
