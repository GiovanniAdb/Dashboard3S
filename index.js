document.addEventListener("DOMContentLoaded", () => {
    const quejasConfig = {
        sinAtencionKey: "SolicitudSinAtencionQueja",
        terminadasKey: "SolicitudTerminadaQueja",
    };

    const contratosConfig = {
        sinAtencionKey: "SolicitudSinAtencionContrato",
        terminadasKey: "SolicitudTerminadaContrato",
    };

    const cortesConfig = {
        sinAtencionKey: "CortesSinAtencion",
        terminadasKey: "CortesTerminados",
    };

    // Renderizar cada categoría en el dashboard
    renderDashboard(quejasConfig, "Quejas");
    renderDashboard(contratosConfig, "Contratos");
    renderDashboard(cortesConfig, "Cortes");

    // Agregar eventos para scroll horizontal entre agencias
    const dashboard = document.getElementById("dashboardContainer");

    const scrollLeft = () =>
        dashboard.scrollBy({ left: -window.innerWidth, behavior: "smooth" });
    const scrollRight = () =>
        dashboard.scrollBy({ left: window.innerWidth, behavior: "smooth" });

    document.addEventListener("keydown", (e) => {
        if (e.key === "ArrowLeft") scrollLeft();
        if (e.key === "ArrowRight") scrollRight();
    });

    // Botón para limpiar el localStorage
    const clearStorageButton = document.getElementById("clearStorageButton");
    if (clearStorageButton) {
        clearStorageButton.addEventListener("click", function () {
            localStorage.clear();
            alert("Local Storage ha sido borrado.");
        });
    }
});

// Obtener datos para gráficos desde localStorage
function getChartDataForCategory(sinAtencionKey, terminadasKey) {
    const sinAtencionData =
        JSON.parse(localStorage.getItem(sinAtencionKey)) || {};
    const terminadasData =
        JSON.parse(localStorage.getItem(terminadasKey)) || {};

    const agencies = new Set([
        ...Object.keys(sinAtencionData),
        ...Object.keys(terminadasData),
    ]);

    const result = {};

    agencies.forEach((agency) => {
        const sinAtencion = sinAtencionData[agency] || [];
        const terminadas = terminadasData[agency] || [];

        // Organizar datos por hora
        const hourlyData = {};
        sinAtencion.forEach((entry) => {
            if (!hourlyData[entry.hour])
                hourlyData[entry.hour] = { sinAtencion: 0, terminadas: 0 };
            hourlyData[entry.hour].sinAtencion += entry.total;
        });

        terminadas.forEach((entry) => {
            if (!hourlyData[entry.hour])
                hourlyData[entry.hour] = { sinAtencion: 0, terminadas: 0 };
            hourlyData[entry.hour].terminadas += entry.total;
        });

        result[agency] = hourlyData;
    });

    return result;
}

// Crear gráfico de pastel con título de agencia y hora
function createPieChart(canvas, agency, hour, sinAtencion, terminadas) {
    new Chart(canvas, {
        type: "pie",
        data: {
            labels: ["Sin Atención", "Terminadas"],
            datasets: [
                {
                    label: `${agency} - ${hour}`, // Mostrar agencia y hora
                    data: [sinAtencion, terminadas],
                    backgroundColor: ["#FF6384", "#36A2EB"],
                },
            ],
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: `Agencia: ${agency} - Hora: ${hour}`, // Mostrar agencia y hora en el gráfico
                },
            },
        },
    });
}

// Renderizar el dashboard por categoría
function renderDashboard(categoryConfig, categoryName) {
    const container = document.createElement("div");
    container.classList.add("row-container");

    // Crear encabezado para la categoría
    const categoryHeading = document.createElement("h2");
    categoryHeading.classList.add("category-heading"); // Clase para estilizar
    categoryHeading.textContent = categoryName;
    document.getElementById("dashboardContainer").appendChild(categoryHeading);

    // Agregar el contenedor de las agencias
    document.getElementById("dashboardContainer").appendChild(container);

    const data = getChartDataForCategory(
        categoryConfig.sinAtencionKey,
        categoryConfig.terminadasKey
    );

    Object.entries(data).forEach(([agency, hourlyData]) => {
        const agencyContainer = document.createElement("div");
        agencyContainer.classList.add("agency-container");

        Object.entries(hourlyData).forEach(([hour, values]) => {
            const chartContainer = document.createElement("div");
            chartContainer.classList.add("chart-container");

            const canvas = document.createElement("canvas");
            chartContainer.appendChild(canvas);

            agencyContainer.appendChild(chartContainer);

            createPieChart(
                canvas,
                agency,
                hour,
                values.sinAtencion,
                values.terminadas
            );
        });

        container.appendChild(agencyContainer);
    });
}


// Selecciona todos los elementos con la clase "dropdown-toggle"
const dropdownToggles = document.querySelectorAll('.dropdown-toggle');

dropdownToggles.forEach((toggle) => {
  toggle.addEventListener('click', function (event) {
    event.preventDefault(); // Evita que el enlace redirija

    // Obtiene el menú desplegable asociado usando el atributo data-target
    const targetId = this.getAttribute('data-target');
    const dropdownMenu = document.getElementById(targetId);

    // Cierra todos los menús desplegables abiertos excepto el actual
    document.querySelectorAll('.dropdown-menu.show').forEach((menu) => {
      if (menu !== dropdownMenu) {
        menu.classList.remove('show');
      }
    });

    // Alterna la visibilidad del menú desplegable actual
    dropdownMenu.classList.toggle('show');
  });
});

// Cierra el menú desplegable si se hace clic fuera de él
document.addEventListener('click', function (event) {
  if (!event.target.closest('.sidebar li')) {
    document.querySelectorAll('.dropdown-menu.show').forEach((menu) => {
      menu.classList.remove('show');
    });
  }
});