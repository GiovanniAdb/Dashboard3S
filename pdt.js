const $XLSX = "https://code.jquery.com/jquery-3.6.0.min"
const $ = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.17.2/xlsx.full.min"

// Función para obtener la agencia según el código de la ruta
function getAgencia(cuenta) {
    const letra = cuenta.charAt(6); // Obtener la letra del código de la cuenta
    const agencias = {
        A: 'SALVATIERRA',
        B: 'ACAMBARO',
        C: 'MOROLEON',
        D: 'TARIMORO',
        E: 'YURIRIA',
        F: 'MARAVATIO',
        G: 'VALLE',
        H: 'JARAL'
    };

    return agencias[letra] || 'Desconocida'; // Devolver la agencia correspondiente o 'Desconocida'
}

// Función para validar si una cuenta pertenece al Grupo ProAgro
function isGrupoProAgro(cuenta, nombre, direccion) {
    const keywords = ['PROAGRO', 'Predio', 'Ejido'];
    return cuenta.includes('9999') || keywords.some(keyword =>
        nombre.toLowerCase().includes(keyword.toLowerCase()) ||
        direccion.toLowerCase().includes(keyword.toLowerCase())
    );
}
function processRows(rows) {
    const result = {};
    const rutaToCuentas = {}; // Objeto para almacenar cuentas por ruta

    // Primero, procesamos las filas y agrupamos las cuentas por ruta
    rows.forEach(row => {
        const cuenta = row.Cuenta || '';
        const ruta = cuenta.substring(0, 2); // Extraer la ruta
        const gpoProagro = isGrupoProAgro(cuenta, row.Nombre, row.Dirección);
        const agencia = getAgencia(cuenta); // Obtener la agencia basada en la ruta

        // Agrupar cuentas por ruta
        if (!rutaToCuentas[ruta]) {
            rutaToCuentas[ruta] = [];
        }
        rutaToCuentas[ruta].push({ cuenta, gpoProagro, row });

        // Inicializar el resultado para la agencia
        if (!result[agencia]) result[agencia] = [];
    });

    // Ahora, revisamos las cuentas agrupadas por ruta
    Object.keys(rutaToCuentas).forEach(ruta => {
        const cuentasEnRuta = rutaToCuentas[ruta];

        // Verificar si hay cuentas que pertenecen a Grupo ProAgro en esta ruta
        const hayProAgroEnRuta = cuentasEnRuta.some(item => item.gpoProagro);

        // Agregar las filas al resultado
        cuentasEnRuta.forEach(item => {
            const { cuenta, gpoProagro, row } = item;
            const perteneceGrupo = gpoProagro || (hayProAgroEnRuta && cuenta.includes('9999')); // Si pertenece a Grupo ProAgro o hay otro en la ruta

            result[getAgencia(cuenta)].push({
                Agencia: getAgencia(cuenta),
                Tensión: row.Tensión || '',
                Ruta: ruta,
                Tarifa: row.Tarifa || '',
                Falla: row.Falla || '',
                Dirección: row.Dirección || '',
                Nombre: row.Nombre || '',
                Cuenta: cuenta,
                RPU: formatRPU(row.RPU),
                "Tipo de Orden": row["TIPO DE ORDEN"] || '',
                "Orden de Corte 2024": row["ORDEN DE CORTE 2024"] || '',
                Medidor: row.Medidor || '',
                Geo: row.Geo || '',
                GpoPROAGRO: perteneceGrupo ? 'SI' : 'NO',
                "kWh Actual": parseFloat(row["kWh Actual"] || 0),
                "Importe Real": parseFloat(row["Importe Real"] || 0),
                "Observaciones": row["Observaciones"] || "",
                "Año": row["AÑO"] || "",
                "Fecha de Corte": row["FECHA DE CORTE"] || "",
                "Mes de Corte": row["MES DE CORTE"] || "",
                "Fecha Elab": row["Fecha Elab"] || "",
                "Número": row["Número"] || "",
            });
        });
    });

    return result;
}

// Formatear el RPU
function formatRPU(rpu) {
    return String(rpu || '').padStart(12, '0');
}

function createTable(agency, rows) {
    const container = document.getElementById("tablesContainer");

    // Crear el contenedor de la tabla
    const table = document.createElement("table");
    table.id = "myTable"; // Añadir el id a la tabla
    table.className = "display"; // Usar la clase de DataTables para habilitar el estilo
    const thead = document.createElement("thead");
    const tbody = document.createElement("tbody");

    // Aseguramos que todas las columnas estén presentes
    const headers = [
        "Agencia", "Tensión", "Ruta", "Tarifa", "Falla", "Dirección", "Nombre",
        "Cuenta", "RPU", "Tipo de Orden", "Orden de Corte 2024", "Medidor",
        "Geo", "GpoPROAGRO", "kWh Actual", "Importe Real",
        "Observaciones", "Año", "Fecha de Corte", "Mes de Corte", "Fecha Elab", "Número"
    ];

    // Crear fila de encabezados
    const headerRow = document.createElement("tr");
    headers.forEach(header => {
        const th = document.createElement("th");
        th.textContent = header;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);

    // Crear filas de datos
    rows.forEach(row => {
        const tr = document.createElement("tr");
        headers.forEach(header => {
            const td = document.createElement("td");
            td.textContent = row[header] || "-"; // Mostrar valor de la propiedad o "-" si no existe
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });

    // Añadir el thead y tbody a la tabla
    table.appendChild(thead);
    table.appendChild(tbody);

    // Limpiar el contenedor y agregar la tabla
    container.innerHTML = "";
    container.appendChild(table);

    // Inicializar DataTable para la tabla recién creada
    $(document).ready(function() {
        $('#myTable').DataTable({
            paging: true, // Habilitar la paginación
            searching: true, // Habilitar la búsqueda
            info: true, // Mostrar información sobre el número de registros
            dom: 'Bfrtip', // Habilitar los botones de exportación
            buttons: ['excel', 'pdf', 'print'], // Opciones de botones para exportar (Excel, PDF, Imprimir)
            order: [[0, 'asc']] // Ordenar la tabla por la primera columna (Agencia)
        });
    });
}


// Función para crear la gráfica general
function createGeneralChart(data) {
    const agencies = Object.keys(data);
    const kWhData = agencies.map(agency =>
        data[agency].reduce((sum, row) => sum + row["kWh Actual"], 0)
    );
    const importeData = agencies.map(agency =>
        data[agency].reduce((sum, row) => sum + row["Importe Real"], 0)
    );

    const options = {
        series: [
            { name: "kWh Actual", data: kWhData },
            { name: "Importe Real", data: importeData }
        ],
        chart: {
            type: "bar",
            height: 350,
            toolbar: { show: false }
        },
        colors: ["#006837", "#00A94F"], // Colores verdes para las barras
        xaxis: {
            categories: agencies,
            labels: {
                style: { colors: "#006837", fontSize: "14px" }
            }
        },
        title: {
            text: "Resumen General por Agencias",
            align: "center",
            style: {
                color: "#006837",
                fontSize: "16px"
            }
        },
        dataLabels: {
            enabled: true, // Habilita las etiquetas de datos
            style: {
                fontSize: '8px',
                fontWeight: 'bold',
                colors: ['rgba(20, 45, 19)'], // Color blanco para las etiquetas de datos
                textShadow: '2px 2px 5px rgba(0, 0, 0, 0.5)', // Sombra de texto
            }
        },
        grid: { borderColor: "#B2D8C7" },
    };

    new ApexCharts(document.querySelector("#general-chart"), options).render();
}

// Función para crear el dropdown de agencias
function createAgencyDropdown(data) {
    const dropdown = document.getElementById("agencySelect");
    if (!dropdown) {
        console.error("El elemento dropdown no existe en el DOM.");
        return;
    }

    Object.keys(data).forEach(agency => {
        const option = document.createElement("option");
        option.value = agency;
        option.textContent = agency;
        dropdown.appendChild(option);
    });

    dropdown.addEventListener("change", (e) => {
        const selectedAgency = e.target.value;
        const tablesContainer = document.getElementById("tablesContainer");
        tablesContainer.innerHTML = '';

        if (selectedAgency === "all") {
            Object.keys(data).forEach(agency => {
                createTable(agency, data[agency]);
                createDownloadButton(agency, data[agency]);
            });
        } else {
            createTable(selectedAgency, data[selectedAgency]);
            createDownloadButton(selectedAgency, data[selectedAgency]);
        }
    });
}

// Función para descargar el Excel de una agencia
function downloadExcel(agency, data) {
    // Verifica que los datos no estén vacíos
    if (data.length === 0) {
        alert("No hay datos disponibles para descargar.");
        return;
    }

    // Crear un nuevo libro de Excel
    const wb = XLSX.utils.book_new();

    // Convertir los datos a una hoja de Excel
    const ws = XLSX.utils.json_to_sheet(data);

    // Agregar la hoja al libro de Excel
    XLSX.utils.book_append_sheet(wb, ws, agency);

    // Escribir el archivo Excel y descargarlo
    XLSX.writeFile(wb, `${agency}.xlsx`);
}

// Función para descargar todos los datos en Excel
function downloadAllExcel(groupedData) {
    const wb = XLSX.utils.book_new();  // Crear un nuevo libro de Excel

    // Itera sobre cada agencia y agrega una hoja al libro
    Object.entries(groupedData).forEach(([agency, rows]) => {
        const ws = XLSX.utils.json_to_sheet(rows);
        XLSX.utils.book_append_sheet(wb, ws, agency);  // Agregar cada hoja
    });

    // Escribir el archivo Excel con todos los datos y descargarlo
    XLSX.writeFile(wb, "Datos_Completos.xlsx");
}

// Función para crear el botón de descarga de Excel para una agencia
function createDownloadButton(agency, data) {
    if (document.getElementById(`download-${agency}`)) return;

    const button = document.createElement("button");
    button.textContent = `Descargar Excel - ${agency}`;
    button.className = "btn-download";
    button.id = `download-${agency}`;
    button.addEventListener("click", () => downloadExcel(agency, data));

    document.getElementById("tablesContainer").insertAdjacentElement("afterend", button);
}

// Función para manejar el evento de carga de un archivo
document.getElementById("fileInput").addEventListener("change", function (e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function () {
            const data = new Uint8Array(reader.result);
            const workbook = XLSX.read(data, { type: "array" });  // Usamos "array" para leer el archivo binario
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(sheet);
            const groupedData = processRows(rows);  // Asumiendo que tienes una función de procesamiento
            displayData(groupedData);  // Mostrar los datos procesados
        };
        reader.readAsArrayBuffer(file);  // Usa readAsArrayBuffer para archivos binarios
    }
});

// Función para mostrar los datos (gráficos, tablas y botones de descarga)
function displayData(groupedData) {
    createGeneralChart(groupedData);
    createAgencyDropdown(groupedData);

    // Crear gráficas de Importe Real por agencia
    Object.keys(groupedData).forEach(agency => {
        const rows = groupedData[agency];

        // Cálculos para gráficas de Importe Real
        const proAgro = rows.filter(row => row.GpoPROAGRO === "SI").reduce((sum, row) => sum + row["Importe Real"], 0);
        const nonProAgro = rows.filter(row => row.GpoPROAGRO === "NO").reduce((sum, row) => sum + row["Importe Real"], 0);

        // Crear gráfica de dona para Importe Real
        createDoughnutChart(agency, proAgro, nonProAgro);

        // Crear tabla y botón de descarga por agencia
        createTable(agency, rows);
        createDownloadButton(agency, rows);
    });

    // Crear gráficas de Recuperación de Energía
    createEnergyRecoveryCharts(groupedData);

    // Crear botón para descargar todo
    createDownloadAllButton(groupedData);
}
// Función para crear el botón de descarga del Excel completo
function createDownloadAllButton(groupedData) {
    const downloadAllBtn = document.getElementById("downloadAll");

    downloadAllBtn.style.display = "none"; // Escondemos el botón de inicio
    downloadAllBtn.addEventListener("click", () => {
        downloadAllExcel(groupedData); // Llamar la función para descargar el Excel completo
    });

    // Mostrar el botón de descarga cuando se hayan procesado los datos
    downloadAllBtn.style.display = "inline-block";
}

function createDoughnutChart(agency, proAgro, nonProAgro) {
    // Crear un contenedor único para el gráfico
    const chartId = `chart-${agency.replace(/\s+/g, "-")}`;
    const chartDiv = document.createElement("div");
    chartDiv.id = chartId;
    chartDiv.className = "chart-wrapper";
    document.getElementById("chart-container").appendChild(chartDiv);

    // Cargar y dibujar el gráfico de Google Charts
    google.charts.load('current', { packages: ['corechart'] });
    google.charts.setOnLoadCallback(() => {
        const data = google.visualization.arrayToDataTable([
            ['Categoría', 'Importe'],
            ['Sin Registro Formal', proAgro],
            ['Con Registro Formal', nonProAgro],
        ]);

        const options = {
            title: `Importe Real - ${agency}`,
            pieHole: 0.4, // Dona
            legend: { position: 'bottom' },
            colors: ['#af2727', '#004c2c'],
            chartArea: { width: '90%', height: '75%' },
        };

        const chart = new google.visualization.PieChart(document.getElementById(chartId));
        chart.draw(data, options);
    });
}

function createEnergyRecoveryCharts(data) {
    const mediaContainer = document.getElementById("chart-media-tension");
    const bajaContainer = document.getElementById("chart-baja-tension");

    // Limpiar contenedores antes de crear nuevas gráficas
    mediaContainer.innerHTML = "";
    bajaContainer.innerHTML = "";

    Object.keys(data).forEach(agency => {
        const rows = data[agency];

        // Cálculos para Media Tensión
        const mediaTension = rows.filter(row => row.Tensión === "MEDIA");
        const mediaRecuperada = mediaTension.filter(row => !isGrupoProAgro(row.Cuenta, row.Nombre, row.Dirección)).reduce((sum, row) => sum + row["kWh Actual"], 0);
        const mediaNoRecuperada = mediaTension.filter(row => isGrupoProAgro(row.Cuenta, row.Nombre, row.Dirección)).reduce((sum, row) => sum + row["kWh Actual"], 0);

        // Crear gráfica para Media Tensión
        createEnergyRecoveryChart(
            `media-tension-${agency}`,
            `Media Tensión (${agency})`,
            mediaRecuperada,
            mediaNoRecuperada,
            mediaContainer
        );

        // Cálculos para Baja Tensión
        const bajaTension = rows.filter(row => row.Tensión === "BAJA");
        const bajaRecuperada = bajaTension.filter(row => !isGrupoProAgro(row.Cuenta, row.Nombre, row.Dirección)).reduce((sum, row) => sum + row["kWh Actual"], 0);
        const bajaNoRecuperada = bajaTension.filter(row => isGrupoProAgro(row.Cuenta, row.Nombre, row.Dirección)).reduce((sum, row) => sum + row["kWh Actual"], 0);

        // Crear gráfica para Baja Tensión
        createEnergyRecoveryChart(
            `baja-tension-${agency}`,
            `Baja Tensión (${agency})`,
            bajaRecuperada,
            bajaNoRecuperada,
            bajaContainer
        );
    });
}

function createEnergyRecoveryChart(chartId, title, recoveredEnergy, nonRecoveredEnergy, container) {
    // Crear un contenedor único para el gráfico
    const chartDiv = document.createElement("div");
    chartDiv.id = chartId;
    chartDiv.className = "chart-wrapperEnergy";
    container.appendChild(chartDiv);

    // Cargar y dibujar el gráfico de Google Charts
    google.charts.load('current', { packages: ['corechart'] });
    google.charts.setOnLoadCallback(() => {
        const data = google.visualization.arrayToDataTable([
            ['Categoría', 'Energía (kWh)'],
            ['Con Posibilidad de Recuperación', recoveredEnergy],
            ['Sin Posibilidad de Recuperación', nonRecoveredEnergy],
        ]);

        const options = {
            title: title,
            pieHole: 0.4, // Dona
            legend: { position: 'bottom' },
            colors: ['#00a906', '#93af15'],
            chartArea: { width: '90%', height: '75%' },
        };

        const chart = new google.visualization.PieChart(document.getElementById(chartId));
        chart.draw(data, options);
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