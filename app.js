document.addEventListener('DOMContentLoaded', () => {
    fetchData();
});

async function fetchData() {
    const loadingEl = document.getElementById('loading');
    const containerEl = document.getElementById('data-container');
    containerEl.style.display = 'none';

    try {
        // --- ¡CAMBIO HECHO AQUÍ! ---
        // Esta es la URL de tu Google App Script
        const API_ENDPOINT = 'https://script.google.com/macros/s/AKfycbzvxVJrmcxxkCmC-6boBjGg-LOQHlpiazDUVLeNjggWnm7ol7NJurzktfWpl_m_Bg0yXQ/exec';

        const response = await fetch(API_ENDPOINT);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.statusText}`);
        }

        const data = await response.json();
        
        // Si el propio script de Google devolvió un error (ej. mal login)
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
        loadingEl.innerText = `Error al cargar los datos: ${error.message}`;
        console.error(error);
    }
}
