// Importamos 'crypto' (aunque no lo usamos para el login, es bueno tenerlo por si acaso)
import crypto from 'crypto';

// Esta es la función principal que Vercel ejecutará
export default async function handler(req, res) {
    
    // --- 1. OBTENER SECRETOS ---
    const { GOODWE_USER, GOODWE_PASS, STATION_ID } = process.env;

    if (!GOODWE_USER || !GOODWE_PASS || !STATION_ID) {
        return res.status(500).json({ error: 'Variables de entorno no configuradas en Vercel' });
    }

    try {
        // --- 2. PASO DE LOGIN (MÉTODO v1 CORREGIDO) ---
        
        // ¡CAMBIO CLAVE! Usamos la API v1 y un token de "cliente" estático, como la app móvil
        const loginResponse = await fetch('https://www.semsportal.com/api/v1/Common/CrossLogin', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Token': '{"version":"v2.1.0","client":"ios","language":"en"}' // Token de cliente estático
            },
            body: JSON.stringify({
                account: GOODWE_USER,
                pwd: GOODWE_PASS, // ¡CAMBIO CLAVE! Enviamos la contraseña en texto plano
            }),
        });

        const loginData = await loginResponse.json();

        // Si el login falla... (Aquí es donde te daba 401)
        if (loginData.code !== 0 || !loginData.data || !loginData.data.token) {
            console.error('Error de login GoodWe:', loginData);
            return res.status(401).json({ error: 'Fallo de autenticación con GoodWe' });
        }

        const token = loginData.data.token; // Este es el token de sesión real

        // --- 3. PASO DE DATOS (Usando el token de sesión) ---
        // Este endpoint v2 sí funciona con el token de sesión
        const dataResponse = await fetch('https://www.semsportal.com/api/v2/PowerStation/GetMonitorDetailByPowerstationId', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Token': token, // ¡Usamos el token de sesión que acabamos de obtener!
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

        // --- 4. ÉXITO: DEVOLVER LOS DATOS AL FRONTEND ---
        // ¡IMPORTANTE! Añadimos el permiso CORS aquí para que tu web pueda leer la respuesta
        res.setHeader('Access-Control-Allow-Origin', '*'); 
        return res.status(200).json(stationData.data);

    } catch (error) {
        console.error('Error en el servidor:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
}
