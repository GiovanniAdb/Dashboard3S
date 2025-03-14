// Función para limpiar todo el contenido anterior
function clearPreviousData() {
    // Limpiar la tabla
    const tableContainer = document.querySelector(".table-container");
    tableContainer.innerHTML = "";
    tableContainer.classList.add("hidden"); // Ocultar el contenedor de la tabla

    // Limpiar la gráfica
    const graphicContainer = document.getElementById("graphic");
    graphicContainer.innerHTML = '<canvas id="myChart"></canvas>'; // Reemplazar el canvas
    graphicContainer.classList.add("hidden"); // Ocultar el contenedor de la gráfica

    // Limpiar las oportunidades
    const opportunityContainer = document.querySelector(".opportunity-content");
    opportunityContainer.innerHTML = "";
}

// Evento para cargar archivos
document
    .getElementById("fileInput")
    .addEventListener("change", async (event) => {
        const files = event.target.files;
        const fileData = [];

        if (files.length > 4) {
            alert("Por favor, sube un máximo de 4 archivos.");
            return;
        }

        // Limpiar datos anteriores
        clearPreviousData();

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const reader = new FileReader();

            reader.onload = function (e) {
                const content = e.target.result;
                const processedData = processFile(content, file.name);
                fileData.push(processedData);

                if (fileData.length === files.length) {
                    displayData(fileData);
                    generateChart(fileData);
                    displayOpportunities(fileData);
                }
            };

            reader.readAsText(file);
        }
    });

function displayData(fileData) {
    const tableContainer = document.querySelector(".table-container");
    tableContainer.innerHTML = ""; // Limpiar contenedor existente

    fileData.forEach((file, index) => {
        const table = document.createElement("table");
        table.id = `dataTable${index}`;
        const thead = document.createElement("thead");
        const tbody = document.createElement("tbody");

        // Crear encabezados de la tabla
        const row = document.createElement("tr");
        Object.keys(file.dataPoints[0]).forEach((key) => {
            const th = document.createElement("th");
            th.textContent = key;
            row.appendChild(th);
        });
        thead.appendChild(row);

        // Agregar datos a la tabla
        file.dataPoints.forEach((dataPoint) => {
            const row = document.createElement("tr");
            Object.values(dataPoint).forEach((value) => {
                const cell = document.createElement("td");
                cell.textContent = value;
                row.appendChild(cell);
            });
            tbody.appendChild(row);
        });

        // Agregar tabla al contenedor
        table.appendChild(thead);
        table.appendChild(tbody);
        tableContainer.appendChild(table);

        // Agregar título a la tabla
        const title = document.createElement("h3");
        title.textContent = file.name;
        tableContainer.insertBefore(title, table);
    });

    // Mostrar la tabla y el gráfico
    tableContainer.classList.remove("hidden");
    document.getElementById("graphic").classList.remove("hidden");
}

function displayOpportunities(fileData) {
    const opportunities = [];

    // Calcular el total de medición por área
    fileData.forEach((file) => {
        file.dataPoints.forEach((point) => {
            opportunities.push({
                area: point.area,
                totalMedicion: point.totalMedicion,
            });
        });
    });

    // Agrupar y sumar los totales por área
    const areaTotals = opportunities.reduce((acc, curr) => {
        if (!acc[curr.area]) {
            acc[curr.area] = 0;
        }
        acc[curr.area] += curr.totalMedicion;
        return acc;
    }, {});

    // Convertir a un array y ordenar por total
    const sortedOpportunities = Object.entries(areaTotals)
        .map(([area, totalMedicion]) => ({ area, totalMedicion }))
        .sort((a, b) => b.totalMedicion - a.totalMedicion);

    const opportunityContainer = document.querySelector(".opportunity-content");
    opportunityContainer.innerHTML = ""; // Limpiar contenedor existente

    // Mostrar solo la primera área de oportunidad
    sortedOpportunities.forEach((opportunity, index) => {
        const card = document.createElement("div");
        card.className = "opportunity-card";
        card.innerHTML = `
            <h3>${index + 1}ª Área de Oportunidad: ${opportunity.area}</h3>
            <p>Total Medición: ${opportunity.totalMedicion}</p>
        `;
        opportunityContainer.appendChild(card);
    });

    // Deslizar a la primera tarjeta
    opportunityContainer.style.transform = `translateX(0)`;
}

function processFile(content, fileName) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, "text/html");
    const rows = doc.querySelectorAll("tr.CeldaIESS"); // Seleccionar filas con la clase CeldaIESS
    const dataPoints = [];

    // Identificar el tipo de archivo
    const tipo = doc.querySelector('select[name="calculo"]').value; // S o I
    const inconformidades = doc.querySelector('select[name="acumulado"]').value; // M o A

    // Convertir abreviaciones a nombres completos
    const tipoCalculo = tipo === "S" ? "Eventos" : "IMU"; // Si es S, es Eventos; si es I, es IMU
    const tipoArchivo = inconformidades === "M" ? "Mensual" : "Acumulado"; // Si es M, es Mensual; si es A, es Acumulado

    // Iterar sobre las filas de la tabla
    rows.forEach((row) => {
        const cells = row.querySelectorAll("td");

        // Asegurarse de que la fila tenga suficientes celdas
        if (cells.length >= 30) {
            const cve = cells[0]?.textContent.trim() || "";
            const area = cells[1]?.textContent.trim() || "";
            const constAnormComercial = cells[2]?.textContent.trim() || "";
            const corteIndebComercial = cells[3]?.textContent.trim() || "";
            const recibExtrvComercial = cells[4]?.textContent.trim() || "";
            const cargoMalAplicComercial =
                parseFloat(cells[5]?.textContent.trim()) || 0;
            const demorAtnComercial = cells[6]?.textContent.trim() || "";
            const totProcComercial = cells[7]?.textContent.trim() || "";
            const altoConsmComercial = cells[8]?.textContent.trim() || "";
            const comerComercial = cells[9]?.textContent.trim() || "";
            const totalImprComercial = cells[10]?.textContent.trim() || "";
            const totalComercial = cells[11]?.textContent.trim() || "";

            const falsoContcMedicion = cells[12]?.textContent.trim() || "";
            const acomtAveriMedicion = cells[13]?.textContent.trim() || "";
            const fallaMedidMedicion = cells[14]?.textContent.trim() || "";
            const demorAtenMedicion = cells[15]?.textContent.trim() || "";
            const totProcMedicion = cells[16]?.textContent.trim() || "";
            const totalImprMedicion = cells[17]?.textContent.trim() || "";
            const totalMedicion = parseFloat(cells[18]?.textContent.trim()) || 0; // Asegurarse de que sea un número

            const sectFueraDistribucion = cells[19]?.textContent.trim() || "";
            const deficVoltDistribucion = cells[20]?.textContent.trim() || "";
            const falsoContcDistribucion = cells[21]?.textContent.trim() || "";
            const demorAtnDistribucion = cells[22]?.textContent.trim() || "";
            const totProcDistribucion = cells[23]?.textContent.trim() || "";
            const totImprDistribucion = cells[24]?.textContent.trim() || "";
            const totalDistribucion = cells[25]?.textContent.trim() || "";

            const totProcGeneral = cells[26]?.textContent.trim() || "";
            const totImprGeneral = cells[27]?.textContent.trim() || "";
            const totalGeneral = cells[28]?.textContent.trim() || "";
            const usuariosAcumuladosGeneral = cells[29]?.textContent.trim() || "";

            // Solo agregar datos si hay un valor en la columna CVE
            if (cve) {
                dataPoints.push({
                    cve,
                    area,
                    constAnormComercial,
                    corteIndebComercial,
                    recibExtrvComercial,
                    cargoMalAplicComercial,
                    demorAtnComercial,
                    totProcComercial,
                    altoConsmComercial,
                    comerComercial,
                    totalImprComercial,
                    totalComercial,
                    falsoContcMedicion,
                    acomtAveriMedicion,
                    fallaMedidMedicion,
                    demorAtenMedicion,
                    totProcMedicion,
                    totalImprMedicion,
                    totalMedicion,
                    sectFueraDistribucion,
                    deficVoltDistribucion,
                    falsoContcDistribucion,
                    demorAtnDistribucion,
                    totProcDistribucion,
                    totImprDistribucion,
                    totalDistribucion,
                    totProcGeneral,
                    totImprGeneral,
                    totalGeneral,
                    usuariosAcumuladosGeneral,
                    tipoCalculo, // Agregar tipo de cálculo
                    tipoArchivo, // Agregar tipo de archivo
                });
            }
        }
    });

    return {
        name: fileName,
        dataPoints: dataPoints,
    };
}

function generateChart(fileData) {
    const areaTotals = {};
    const datasets = [];

    // Calcular el total de medición por área y agrupar por tipo
    fileData.forEach((file) => {
        file.dataPoints.forEach((point) => {
            const key = `${point.tipoCalculo}-${point.tipoArchivo}-${point.area}`;
            if (!areaTotals[key]) {
                areaTotals[key] = 0;
            }
            areaTotals[key] += point.totalMedicion;
        });
    });

    // Preparar datos para el gráfico
    Object.entries(areaTotals).forEach(([key, value]) => {
        const [tipoCalculo, tipoArchivo, area] = key.split("-");
        if (
            !datasets.find(
                (dataset) => dataset.label === `${tipoCalculo} ${tipoArchivo}`
            )
        ) {
            datasets.push({
                label: `${tipoCalculo} ${tipoArchivo}`,
                data: [],
                backgroundColor: `rgba(${Math.floor(Math.random() * 256)}, ${Math.floor(
                    Math.random() * 256
                )}, ${Math.floor(Math.random() * 256)}, 0.2)`,
                borderColor: `rgba(${Math.floor(Math.random() * 256)}, ${Math.floor(
                    Math.random() * 256
                )}, ${Math.floor(Math.random() * 256)}, 1)`,
                borderWidth: 1,
                fill: true,
            });
        }
        const dataset = datasets.find(
            (dataset) => dataset.label === `${tipoCalculo} ${tipoArchivo}`
        );
        dataset.data.push(value);
    });

    const labels = [
        ...new Set(
            fileData.flatMap((file) => file.dataPoints.map((point) => point.area))
        ),
    ];

    const ctx = document.getElementById("myChart").getContext("2d");
    const myChart = new Chart(ctx, {
        type: "line", // Cambiar a gráfico de líneas para polígonos
        data: {
            labels: labels,
            datasets: datasets,
        },
        options: {
            responsive: true, // Hacer que la gráfica sea responsive
            maintainAspectRatio: false, // No mantener la proporción automática
            scales: {
                y: {
                    beginAtZero: true,
                },
            },
        },
    });

    document.getElementById("graphic").classList.remove("hidden");
}

// Evento para cargar archivos de página
document
    .getElementById("pageFileInput")
    .addEventListener("change", async (event) => {
        const file = event.target.files[0];
        const reader = new FileReader();
        reader.onload = function (e) {
            const content = e.target.result;
            const processData = processPage(content);
            dataPoints = processData; // Asignar los datos a la variable dataPoints
            displayPageData(dataPoints);
            generatePageChart(dataPoints);

            // Agregar un select con las opciones de filtro
            const select = document.createElement("select");
            select.id = "filtroSelect";
            const opciones = [
                "Selecciona una opcion",
                "MEDICION",
                "DISTRIBUCION",
                "COMERCIAL",
            ];
            opciones.forEach((opcion) => {
                const option = document.createElement("option");
                option.value = opcion;
                option.textContent = opcion;
                select.appendChild(option);
            });
            document.getElementById("filtro-container").appendChild(select);

            select.addEventListener("change", () => {
                const filtroValue = select.value;
                const filteredDataPoints = dataPoints.filter((point) => {
                    if (filtroValue === "Todos") {
                        return true;
                    } else {
                        return point.proceso === filtroValue;
                    }
                });
                displayPageData(filteredDataPoints, filtroValue);
                if (myChart) {
                    myChart.destroy();
                }
                generatePageChart(filteredDataPoints, filtroValue);
            });
        };

        reader.readAsText(file);
    });

let myChart;

function generatePageChart(dataPoints, filtroValue) {
    const pageGraphicContainer = document.getElementById("pageGraphic");
    pageGraphicContainer.innerHTML = ""; // Limpiar el contenedor

    // Crear un contenedor para los botones
    const buttonContainer = document.createElement("div");
    buttonContainer.style.display = "flex";
    buttonContainer.style.flexWrap = "wrap";
    buttonContainer.style.justifyContent = "center";
    pageGraphicContainer.appendChild(buttonContainer);

    // Crear botones por orig
    const origs = [...new Set(dataPoints.map((point) => point.orig))]; // Obtener los origs únicos

    origs.forEach((orig, index) => {
        const button = document.createElement("button");
        button.textContent = orig;
        button.classList.add("orig-button");
        button.classList.add("active"); // Agregar la clase active
        button.dataset.orig = orig;
        button.style.background = `hsl(${index * 30}, 100%, 20%)`; // Colores más oscuros

        // Agregar evento de clic para mostrar/ocultar el dataset correspondiente
        button.addEventListener("click", () => {
            const meta = myChart.getDatasetMeta(index);
            meta.hidden = !meta.hidden;
            myChart.update();
            button.classList.toggle("active"); // Agregar o quitar la clase active
        });

        // Agregar el botón al contenedor
        buttonContainer.appendChild(button);
    });

    // Crear la gráfica
    const canvas = document.createElement("canvas");
    canvas.id = "pageChart";
    pageGraphicContainer.appendChild(canvas);

    const ctx = canvas.getContext("2d");

    // Destruir la instancia anterior del gráfico si existe
    if (myChart) {
        myChart.destroy();
    }

    // Crear los datasets sin mostrar los orig
    const datasets = origs.map((orig, index) => {
        const filteredDataPoints = dataPoints.filter(
            (point) =>
                point.orig === orig &&
                (filtroValue === "Todos" || point.proceso === filtroValue)
        );
        const tiemposAtencion = filteredDataPoints.map((point) => {
            const fecha = new Date(point.fecha);
            const atencion = new Date(point.atencion);
            return {
                x: point.fecha, // Fecha como etiqueta
                y: (atencion - fecha) / (1000 * 60 * 60 * 24), // Días entre fecha y atención
                numSolicitud: point.numSolicitud, // Incluir NUM SOLICITUD
            };
        });

        return {
            label: "", // Quitar el label del dataset
            data: tiemposAtencion,
            borderColor: `hsl(${index * 30}, 100%, 20%)`, // Colores más oscuros
            backgroundColor: `hsl(${index * 30}, 100%, 20%, 0.2)`, // Colores más oscuros
            fill: true,
            hidden: true, // Ocultar el dataset por defecto
        };
    });

    myChart = new Chart(ctx, {
        type: "line",
        data: {
            labels: [], // Quitar los labels
            datasets: datasets,
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: "Días", // Etiqueta del eje Y
                    },
                },
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const value = context.raw.y; // Obtener el valor en días
                            const numSolicitud = context.raw.numSolicitud; // Obtener NUM SOLICITUD
                            const tiempoDetallado = convertirDiasATiempo(value); // Convertir días a días, horas, minutos y segundos
                            return `Tiempo de atención: ${tiempoDetallado} (Solicitud: ${numSolicitud})`; // Mostrar el tiempo detallado y NUM SOLICITUD
                        },
                    },
                },
                legend: {
                    display: false, // Quitar la leyenda
                },
            },
        },
    });

    // Agregar evento de clic para mostrar/ocultar el dataset correspondiente
    origs.forEach((orig, index) => {
        const button = buttonContainer.children[index];
        button.addEventListener("click", () => {
            const meta = myChart.getDatasetMeta(index);
            meta.hidden = !meta.hidden;
            myChart.update();
            button.classList.toggle("active"); // Agregar o quitar la clase active
        });
    });

    document.getElementById("pageGraphic").classList.remove("hidden");
}

function processPage(content) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, "text/html");

    const rows = doc.querySelectorAll("tr");
    console.log("Filas encontradas:", rows);

    const dataPoints = [];

    rows.forEach((row, index) => {
        if (index > 0) {
            // Ignorar la primera fila de la tabla
            const cells = row.querySelectorAll("td");
            if (cells.length >= 14) {
                const sec = cells[0].textContent.trim();
                const numSolicitud = cells[1].textContent.trim();
                const numSolinfo = cells[2].textContent.trim();
                const numCuenta = cells[3].textContent.trim();
                const area = cells[4].textContent.trim();
                const cveCol = cells[5].textContent.trim();
                const inicio = cells[6].textContent.trim();
                const termino = cells[7].textContent.trim();
                const fecha = cells[8].textContent.trim();
                const atencion = cells[9].textContent.trim();
                const termino2 = cells[10].textContent.trim();
                const pob = cells[11].textContent.trim();
                const orig = cells[12].textContent.trim();
                const rpu = cells[13].textContent.trim();
                const proceso = cells[14].textContent.trim();

                dataPoints.push({
                    sec,
                    numSolicitud,
                    numSolinfo,
                    numCuenta,
                    area,
                    cveCol,
                    inicio,
                    termino,
                    fecha,
                    atencion,
                    termino2,
                    pob,
                    orig,
                    rpu,
                    proceso,
                });
            } else {
                console.log("No se encontraron celdas suficientes en la fila");
            }
        }
    });

    // Eliminar los primeros dos elementos del arreglo
    dataPoints.splice(0, 2);

    console.log("Datos procesados:", dataPoints);
    return dataPoints;
}

function displayPageData(dataPoints, filtroValue) {
    console.log("displayPageData llamada");
    console.log("dataPoints:", dataPoints);
    console.log("filtroValue:", filtroValue);

    const graphicTableContainer = document.querySelector(".graphic-table-container");
    graphicTableContainer.innerHTML = ""; // Limpiar contenedor existente

    // Agregar un div para mostrar el total de solicitudes
    const totalSolicitudesDiv = document.createElement("div");
    totalSolicitudesDiv.classList.add("total-solicitudes");
    totalSolicitudesDiv.style.height = "250px";
    totalSolicitudesDiv.style.borderRadius = "50%";
    totalSolicitudesDiv.style.backgroundColor = "#043e26";
    totalSolicitudesDiv.style.display = "flex";
    totalSolicitudesDiv.style.justifyContent = "center";
    totalSolicitudesDiv.style.alignItems = "center";
    totalSolicitudesDiv.style.fontSize = "20px";
    totalSolicitudesDiv.style.fontWeight = "bold";
    totalSolicitudesDiv.style.color = "#444";
    totalSolicitudesDiv.style.transition = "transform 0.3s ease-in-out";
    totalSolicitudesDiv.style.border = "1px solid rgba(255, 255, 255, 0.1)";

    totalSolicitudesDiv.addEventListener("mouseover", () => {
        const tooltip = document.createElement("div");
        tooltip.classList.add("tooltip");
        tooltip.style.position = "absolute";
        tooltip.style.top = "-50px"; // Cambia la posición del tooltip para que salga arriba del círculo
        tooltip.style.left = "50%";
        tooltip.style.transform = "translateX(-50%)"; // Cambia la transformación para que el tooltip se centre horizontalmente
        tooltip.style.backgroundColor = "#043e26";
        tooltip.style.padding = "10px";
        tooltip.style.color = "#ffffff";
        tooltip.style.borderRadius = "5px";
        tooltip.style.boxShadow = "0 0 10px rgba(0, 0, 0, 0.1)";
        tooltip.style.zIndex = "1";
        tooltip.innerHTML = "Solicitudes encontradas";
        totalSolicitudesDiv.appendChild(tooltip);
    });

    totalSolicitudesDiv.addEventListener("mouseout", () => {
        const tooltip = totalSolicitudesDiv.querySelector(".tooltip");
        if (tooltip) {
            tooltip.remove();
        }
    });
    // Agregar un texto para mostrar el total de solicitudes
    const totalSolicitudesText = document.createElement("p");
    totalSolicitudesText.style.fontWeight = "bold";

    // Agregar un span para mostrar el total de solicitudes
    const totalSolicitudesSpan = document.createElement("span");
    totalSolicitudesSpan.id = "total-solicitudes-span";

    // Agregar el texto y el span al div
    totalSolicitudesDiv.appendChild(totalSolicitudesSpan);

    // Agregar el div al contenedor
    graphicTableContainer.appendChild(totalSolicitudesDiv);

    // Agregar un div para mostrar la gráfica de pastel
    const graficaDiv = document.createElement("div");
    graficaDiv.classList.add("grafica");
    graficaDiv.style.padding = "10px";

    // Agregar un canvas para la gráfica de pastel
    const graficaCanvas = document.createElement("canvas");
    graficaCanvas.id = "grafica-canvas";
    graficaCanvas.width = 400;
    graficaCanvas.height = 400;

    // Agregar el canvas al div
    graficaDiv.appendChild(graficaCanvas);

    // Agregar el div al contenedor
    graphicTableContainer.appendChild(graficaDiv);

    // Crear la gráfica de pastel
    const ctx = graficaCanvas.getContext("2d");
    const grafica = new Chart(ctx, {
        type: "pie",
        data: {
            labels: ["Solicitudes por área"],
            datasets: [{
                label: "Solicitudes por área",
                data: [100],
                backgroundColor: ["#fff"],
                borderColor: ["#333"],
                borderWidth: 1
            }]
        },
        options: {
            title: {
                display: true,
                text: "Solicitudes por área",
                fontSize: 18, // Asegúrate de que el tamaño de la fuente sea lo suficientemente grande para que se vea
                fontColor: "#333" // Asegúrate de que el color de la fuente sea lo suficientemente oscuro para que se vea
            },
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
        }
    });

    const titulo = document.createElement("div");
    titulo.textContent = "Gráfica de solicitudes por área";
    titulo.style.position = "absolute";
    titulo.style.top = "10px";
    titulo.style.left = "67%";
    titulo.style.transform = "translateX(-50%)";
    titulo.style.fontSize = "18px";
    titulo.style.fontWeight = "bold";
    titulo.style.color = "#043e26";

    ctx.canvas.parentNode.appendChild(titulo);

    // Crear tabla
    const tableContainer = document.querySelector(".page-table-container");
    tableContainer.innerHTML = ""; // Limpiar contenedor existente
    const table = document.createElement("table");
    table.id = "pageTable";

    const thead = document.createElement("thead");
    const tbody = document.createElement("tbody");

    // Crear encabezados de la tabla
    const headerRow = document.createElement("tr");
    const headers = [
        "SEC",
        "NUM SOLICITUD",
        "NUM SOLINFO",
        "NUM CUENTA",
        "AREA",
        "CVE COL",
        "INICIO",
        "TERMINO",
        "FECHA",
        "ATENCION",
        "TERMINO",
        "POB",
        "ORIG",
        "RPU",
        "PROCESO",
        "Tiempo de fecha a atención",
    ];
    headers.forEach((header) => {
        const th = document.createElement("th");
        th.textContent = header;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);

    // Agrupar los datos por ÁREA y CVE COL
    const groupedData = {};
    dataPoints.forEach((point) => {
        if (!groupedData[point.area]) {
            groupedData[point.area] = {};
        }
        if (!groupedData[point.area][point.cveCol]) {
            groupedData[point.area][point.cveCol] = [];
        }
        groupedData[point.area][point.cveCol].push(point);
    });

    // Crear filtro
    const filtroContainer = document.createElement("div");
    filtroContainer.classList.add("filtro-container");
    filtroContainer.style.background = '#d9f0e2';
    filtroContainer.style.display = 'flex';
    filtroContainer.style.justifyContent = 'center';
    filtroContainer.style.alignItems = 'center';

    const inicioSelect = document.createElement("select");
    inicioSelect.id = "inicio-select-tabla";
    inicioSelect.classList.add("filtroSelect-tabla");
    inicioSelect.title = "Seleccione el inicio de la fecha";

    const terminoSelect = document.createElement("select");
    terminoSelect.id = "termino-select-tabla";
    terminoSelect.classList.add("filtroSelect-tabla");
    inicioSelect.ariaLabel = "Seleccione el inicio de la fecha";

    const inicioOptions = Array.from(
        new Set(dataPoints.map((point) => point.inicio))
    );
    inicioOptions.forEach((option) => {
        const inicioOption = document.createElement("option");
        inicioOption.value = option;
        inicioOption.textContent = option;
        inicioSelect.appendChild(inicioOption);
    });

    const terminoOptions = Array.from(
        new Set(dataPoints.map((point) => point.termino))
    );
    terminoOptions.forEach((option) => {
        const terminoOption = document.createElement("option");
        terminoOption.value = option;
        terminoOption.textContent = option;
        terminoSelect.appendChild(terminoOption);
    });

    const filtroButton = document.createElement("button");
    filtroButton.textContent = "Aplicar filtro";
    filtroButton.id = "filtro-button-tabla";
    filtroButton.classList.add("filtroButton-tabla");

    filtroContainer.appendChild(inicioSelect);
    filtroContainer.appendChild(terminoSelect);
    filtroContainer.appendChild(filtroButton);

    tableContainer.appendChild(filtroContainer);

    filtroButton.style.width = "100px";
    filtroButton.style.textAlign = "center";
    filtroButton.addEventListener("click", () => {
        const inicioValue = inicioSelect.value;
        const terminoValue = terminoSelect.value;

        // Filtrar datos
        const filteredData = dataPoints.filter((point) => {
            return (
                (inicioValue === "" || point.inicio === inicioValue) &&
                (terminoValue === "" || point.termino === terminoValue)
            );
        });

        // Actualizar tabla con datos filtrados
        tbody.innerHTML = "";
        Object.keys(groupedData).forEach((area) => {
            const totalSolicitudesArea = Object.values(groupedData[area]).reduce(
                (sum, col) => sum + col.length,
                0
            );
            const filteredSolicitudesArea = Object.values(groupedData[area]).reduce(
                (sum, col) =>
                    sum +
                    col.filter(
                        (point) =>
                            (inicioValue === "" || point.inicio === inicioValue) &&
                            (terminoValue === "" || point.termino === terminoValue)
                    ).length,
                0
            );

            // Fila de área
            const areaRow = document.createElement("tr");
            areaRow.classList.add("area-row");
            areaRow.dataset.area = area;
            areaRow.style.backgroundColor = "rgba(255, 255, 255, 0.2)";
            areaRow.style.color = "#043e26";
            areaRow.style.cursor = "pointer";
            areaRow.style.transition = "background-color 0.3s";

            const areaCell = document.createElement("td");
            areaCell.textContent = `${area} (${filteredSolicitudesArea} solicitudes)`;
            areaCell.colSpan = headers.length;
            areaCell.style.fontWeight = "bold";
            areaCell.style.padding = "10px";
            areaRow.appendChild(areaCell);
            tbody.appendChild(areaRow);

            areaRow.addEventListener("click", () => {
                document
                    .querySelectorAll(`.colonia-row[data-area='${area}']`)
                    .forEach((row) => {
                        row.classList.toggle("hidden");
                        row.style.transition = "all 0.3s ease-in-out";
                    });
            });

            Object.keys(groupedData[area]).forEach((colonia) => {
                const totalSolicitudesColonia = groupedData[area][colonia].length;
                const filteredSolicitudesColonia = groupedData[area][colonia].filter(
                    (point) =>
                        (inicioValue === "" || point.inicio === inicioValue) &&
                        (terminoValue === "" || point.termino === terminoValue)
                ).length;

                // Fila de colonia (CVE COL)
                const coloniaRow = document.createElement("tr");
                coloniaRow.classList.add("colonia-row", "hidden");
                coloniaRow.dataset.area = area;
                coloniaRow.dataset.colonia = colonia;
                coloniaRow.style.backgroundColor = "#e0f2f1";
                coloniaRow.style.cursor = "pointer";
                coloniaRow.style.transition = "all 0.3s ease-in-out";

                const coloniaCell = document.createElement("td");
                coloniaCell.textContent = `${colonia} (${filteredSolicitudesColonia} solicitudes)`;
                coloniaCell.colSpan = headers.length;
                coloniaCell.style.paddingLeft = "20px";
                coloniaRow.appendChild(coloniaCell);
                tbody.appendChild(coloniaRow);

                if (filteredSolicitudesColonia === 0) {
                    coloniaRow.classList.add("hidden");
                }

                coloniaRow.addEventListener("click", () => {
                    document
                        .querySelectorAll(`.solicitud-row[data-colonia='${colonia}']`)
                        .forEach((row) => {
                            row.classList.toggle("hidden");
                            row.style.transition = "all 0.3s ease-in-out";
                        });
                });

                groupedData[area][colonia].forEach((dataPoint) => {
                    if (
                        (inicioValue === "" || dataPoint.inicio === inicioValue) &&
                        (terminoValue === "" || dataPoint.termino === terminoValue)
                    ) {
                        // Fila de solicitud con todos los datos
                        const solicitudRow = document.createElement("tr");
                        solicitudRow.classList.add("solicitud-row", "hidden");
                        solicitudRow.dataset.colonia = colonia;

                        Object.values(dataPoint).forEach((value) => {
                            const cell = document.createElement("td");
                            cell.textContent = value;
                            solicitudRow.appendChild(cell);
                        });

                        // Calcular y agregar el tiempo de atención
                        const tiempoAtencionCell = document.createElement("td");
                        tiempoAtencionCell.textContent = calcularTiempo(
                            dataPoint.fecha,
                            dataPoint.atencion
                        );
                        solicitudRow.appendChild(tiempoAtencionCell);

                        tbody.appendChild(solicitudRow);
                    }
                });
            });
        });
    });

    // Agregar tabla al contenedor
    table.appendChild(thead);
    table.appendChild(tbody);
    tableContainer.appendChild(table);
    tableContainer.classList.remove("hidden");

    // Mostrar todos los datos al principio
    Object.keys(groupedData).forEach((area) => {
        const totalSolicitudesArea = Object.values(groupedData[area]).reduce(
            (sum, col) => sum + col.length,
            0
        );

        // Fila de área
        const areaRow = document.createElement("tr");
        areaRow.classList.add("area-row");
        areaRow.dataset.area = area;
        areaRow.style.backgroundColor = "rgba(255, 255, 255, 0.2)";
        areaRow.style.color = "#043e26";
        areaRow.style.cursor = "pointer";
        areaRow.style.transition = "background-color 0.3s";

        const areaCell = document.createElement("td");
        areaCell.textContent = `${area} (${totalSolicitudesArea} solicitudes)`;
        areaCell.colSpan = headers.length;
        areaCell.style.fontWeight = "bold";
        areaCell.style.padding = "10px";
        areaRow.appendChild(areaCell);
        tbody.appendChild(areaRow);

        areaRow.addEventListener("click", () => {
            document
                .querySelectorAll(`.colonia-row[data-area='${area}']`)
                .forEach((row) => {
                    row.classList.toggle("hidden");
                    row.style.transition = "all 0.3s ease-in-out";
                });
        });

        Object.keys(groupedData[area]).forEach((colonia) => {
            const totalSolicitudesColonia = groupedData[area][colonia].length;

            // Fila de colonia (CVE COL)
            const coloniaRow = document.createElement("tr");
            coloniaRow.classList.add("colonia-row", "hidden");
            coloniaRow.dataset.area = area;
            coloniaRow.dataset.colonia = colonia;
            coloniaRow.style.backgroundColor = "#e0f2f1";
            coloniaRow.style.cursor = "pointer";
            coloniaRow.style.transition = "all 0.3s ease-in-out";

            const coloniaCell = document.createElement("td");
            coloniaCell.textContent = `${colonia} (${totalSolicitudesColonia} solicitudes)`;
            coloniaCell.colSpan = headers.length;
            coloniaCell.style.paddingLeft = "20px";
            coloniaRow.appendChild(coloniaCell);
            tbody.appendChild(coloniaRow);

            coloniaRow.addEventListener("click", () => {
                document
                    .querySelectorAll(`.solicitud-row[data-colonia='${colonia}']`)
                    .forEach((row) => {
                        row.classList.toggle("hidden");
                        row.style.transition = "all 0.3s ease-in-out";
                    });
            });

            groupedData[area][colonia].forEach((dataPoint) => {
                // Fila de solicitud con todos los datos
                const solicitudRow = document.createElement("tr");
                solicitudRow.classList.add("solicitud-row", "hidden");
                solicitudRow.dataset.colonia = colonia;

                Object.values(dataPoint).forEach((value) => {
                    const cell = document.createElement("td");
                    cell.textContent = value;
                    solicitudRow.appendChild(cell);
                });

                // Calcular y agregar el tiempo de atención
                const tiempoAtencionCell = document.createElement("td");
                tiempoAtencionCell.textContent = calcularTiempo(
                    dataPoint.fecha,
                    dataPoint.atencion
                );
                solicitudRow.appendChild(tiempoAtencionCell);

                tbody.appendChild(solicitudRow);
            });
        });
    });

    // Actualizar el total de solicitudes cuando se aplica el filtro
    filtroButton.addEventListener("click", () => {
        const inicioValue = inicioSelect.value;
        const terminoValue = terminoSelect.value;

        // Filtrar datos
        const filteredData = dataPoints.filter((point) => {
            return (
                (inicioValue === "" || point.inicio === inicioValue) &&
                (terminoValue === "" || point.termino === terminoValue)
            );
        });

        // Actualizar el total de solicitudes
        const totalSolicitudes = filteredData.length;
        document.getElementById("total-solicitudes-span").textContent = totalSolicitudes;

        // Agrupar los datos por área
        const areas = {};
        filteredData.forEach((point) => {
            if (!areas[point.area]) {
                areas[point.area] = 0;
            }
            areas[point.area]++;
        });

        // Actualizar la gráfica de pastel
        grafica.data.labels = Object.keys(areas);
        grafica.data.datasets[0].data = Object.values(areas);
        grafica.data.datasets[0].backgroundColor = Object.keys(areas).map((area, index) => {
            return `hsl(${index * 30}, 100%, 50%)`;
        });
        grafica.data.datasets[0].borderColor = Object.keys(areas).map((area, index) => {
            return `hsl(${index * 30}, 100%, 50%)`;
        });
        grafica.update();
    });
}

function toggleRows(parentRow, childClass) {
    const rows = parentRow.parentNode.querySelectorAll(`.${childClass}`);
    rows.forEach((row) => row.classList.toggle("hidden"));
}

function calcularTiempo(fecha1, fecha2) {
    const date1 = new Date(fecha1);
    const date2 = new Date(fecha2);
    const tiempo = date2 - date1;

    const dias = Math.floor(tiempo / (1000 * 60 * 60 * 24));
    const horas = Math.floor((tiempo % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutos = Math.floor((tiempo % (1000 * 60 * 60)) / (1000 * 60));
    const segundos = Math.floor((tiempo % (1000 * 60)) / 1000);

    if (isNaN(dias) || isNaN(horas) || isNaN(minutos) || isNaN(segundos)) {
        return "0";
    }

    if (dias === 0 && horas === 0 && minutos === 0) {
        return `${segundos} segundos`;
    } else if (dias === 0 && horas === 0) {
        return `${minutos} minutos, ${segundos} segundos`;
    } else if (dias === 0) {
        return `${horas} horas, ${minutos} minutos, ${segundos} segundos`;
    } else {
        return `${dias} días, ${horas} horas, ${minutos} minutos, ${segundos} segundos`;
    }
}

function convertirDiasATiempo(dias) {
    const diasEnteros = Math.floor(dias); // Días completos
    const horasDecimal = (dias - diasEnteros) * 24; // Horas restantes
    const horasEnteras = Math.floor(horasDecimal); // Horas completas
    const minutosDecimal = (horasDecimal - horasEnteras) * 60; // Minutos restantes
    const minutosEnteros = Math.floor(minutosDecimal); // Minutos completos
    const segundosDecimal = (minutosDecimal - minutosEnteros) * 60; // Segundos restantes
    const segundosEnteros = Math.floor(segundosDecimal); // Segundos completos

    return `${diasEnteros} días, ${horasEnteras} horas, ${minutosEnteros} minutos, ${segundosEnteros} segundos`;
}
