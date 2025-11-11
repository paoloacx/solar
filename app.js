document.addEventListener('DOMContentLoaded', () => {
    fetchData();
});

async function fetchData() {
    const loadingEl = document.getElementById('loading');
    const containerEl = document.getElementById('data-container');
    containerEl.style.display = 'none';

    try {
        // IMPORTANTE: Esta URL apuntará a tu "intermediario" en Vercel/Netlify
        // No es la API de GoodWe directamente.
        const API_ENDPOINT = 'https://TU-PROYECTO-EN-VERCEL.vercel.app/api/get-data'; // <-- ¡CAMBIARÁS ESTO!

        const response = await fetch(API_ENDPOINT);
        
        if (!response.ok) {
            throw new Error(`Error: ${response.statusText}`);
        }

        const data = await response.json();

        // Ocultamos "Cargando" y mostramos el contenedor
        loadingEl.style.display = 'none';
        containerEl.style.display = 'block';

        // Limpiamos el contenedor por si acaso
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
