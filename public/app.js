document.addEventListener('DOMContentLoaded', () => {
    fetchData();
});

async function fetchData() {
    const loadingEl = document.getElementById('loading');
    const containerEl = document.getElementById('data-container');
    containerEl.style.display = 'none';

    try {
        // --- ¡CAMBIO HECHO AQUÍ! ---
        // Ahora apunta a /api, que Vercel dirigirá a api/index.js
        const API_ENDPOINT = '/api'; 

        const response = await fetch(API_ENDPOINT);
        
        if (!response.ok) {
            // Lanza un error para que sea capturado por el bloque catch
            throw new Error(`Error HTTP: ${response.statusText}`);
        }

        const data = await response.json();
        
        // Si el script de la API devolvió un error (ej. mal login)
        if (data.error) {
             throw new Error(`Error de la API: ${data.details || data.error}`);
        }

        // Ocultamos "Cargando" y mostramos el contenedor
        loadingEl.style.display = 'none';
        containerEl.style.display = 'block';

        // Limpiamos el contenedor
        containerEl.innerHTML = '';

        // --- Aquí personalizas los datos que quieres ver ---
        // (Esto es un ejemplo basado en lo que la API suele devolver)

        containerEl.innerHTML += `
            <div class="data-point">
                <span>Producción Hoy (kWh):</span>
                ${data.kpi.eday || 0}
            </div>
            <div class="data-point">
                <span>Potencia Actual (W):</span>
                ${data.kpi.pac || 0}
            </div>
            <div class="data-point">
                <span>Total Generado (MWh):</span>
                ${data.kpi.etotal || 0}
            </div>
        `;
        // ---------------------------------------------------

    } catch (error) {
        // Muestra el error en la web
        loadingEl.innerText = `Error al cargar los datos: ${error.message}`;
        console.error(error); // También muéstralo en la consola del navegador
    }
}
