/*
!Primera parte; archivo detallado de solicitudes
*/
document
    .getElementById("fileInput")
    .addEventListener("change", function (event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function (e) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(e.target.result, "text/html");
            const tableRows = doc.querySelectorAll("table tbody tr");

            let data = [];

            tableRows.forEach((row, index) => {
                const cells = row.querySelectorAll("td");
                if (cells.length < 15) return;

                const rowData = {
                    sec: cells[0].textContent.trim(),
                    num: cells[1].textContent.trim(),
                    area: cells[2].textContent.trim(),
                    inicio: cells[3].textContent.trim(),
                    registro: cells[4].textContent.trim(),
                    proceso: cells[5].textContent.trim(),
                    pob: cells[6].textContent.trim(),
                    sts: cells[7].textContent.trim(),
                    orig: cells[8].textContent.trim(),
                    rpu: cells[9].textContent.trim(),
                    en_tiempo: cells[10].textContent.trim(),
                    rpe_captura: cells[11].textContent.trim(),
                    tarifa: cells[12].textContent.trim(),
                    cuenta: cells[13].textContent.trim(),
                    hilos: cells[14].textContent.trim(),
                };

                if (
                    rowData.sec.toUpperCase() === "SEC" &&
                    rowData.num.toUpperCase() === "NUM"
                ) {
                    console.warn(
                        "Se detectó una fila de encabezado duplicada y se omitió."
                    );
                } else {
                    data.push(rowData);
                }
            });

            data.shift();
            //console.log("Datos extraídos correctamente:", data);
            mostrarTabla(data);
        };
        reader.readAsText(file);
    });

function mostrarTabla(data) {
    const tableContainer = document.querySelector(".table-container");
    tableContainer.innerHTML = "";

    // Agrupar los datos por área, inicio y en tiempo
    const groupedData = {};
    data.forEach((point) => {
        if (!groupedData[point.area]) {
            groupedData[point.area] = {};
        }
        if (!groupedData[point.area][point.inicio]) {
            groupedData[point.area][point.inicio] = {};
        }
        if (!groupedData[point.area][point.inicio][point.en_tiempo]) {
            groupedData[point.area][point.inicio][point.en_tiempo] = [];
        }
        groupedData[point.area][point.inicio][point.en_tiempo].push(point);
    });

    // Crear tabla
    const table = document.createElement("table");
    table.style.marginLeft = "0px";
    table.style.width = "100%";
    table.style.margin = "0 auto";
    const thead = document.createElement("thead");
    const tbody = document.createElement("tbody");

    const row = document.createElement("tr");
    const headers = ["ÁREA", "INICIO", "EN TIEMPO", "VENCIDAS", "PENDIENTES", "TOTAL"];
    headers.forEach((header) => {
        const th = document.createElement("th");
        th.textContent = header;
        row.appendChild(th);
    });
    thead.appendChild(row);

    // Llenar la tabla con los datos agrupados
    Object.keys(groupedData).forEach((area) => {
        const row = document.createElement("tr");
        const areaCell = document.createElement("td");
        areaCell.textContent = area;
        areaCell.addEventListener("click", () => {
            const detallesContainer = row.querySelector(".detalles-container");
            detallesContainer.style.display =
                detallesContainer.style.display === "none" ? "block" : "none";
        });
        row.appendChild(areaCell);

        const inicioCell = document.createElement("td");
        inicioCell.innerHTML = `
                <div class="detalles-container" style="display: none;">
                    <table style="width: 100%;">
                        <thead>
                            <tr>
                                <th>INICIO</th>
                                <th>P</th>
                                <th>V</th>
                                <th>E</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${Object.keys(groupedData[area])
                .map(
                    (inicio) => `
                                <tr>
                                    <td>${inicio}</td>
                                    <td>${groupedData[area][inicio]["P"]
                            ? groupedData[area][inicio]["P"].length
                            : 0
                        }</td>
                                    <td>${groupedData[area][inicio]["V"]
                            ? groupedData[area][inicio]["V"].length
                            : 0
                        }</td>
                                    <td>${groupedData[area][inicio]["E"]
                            ? groupedData[area][inicio]["E"].length
                            : 0
                        }</td>
                                </tr>
                            `
                )
                .join("")}
                        </tbody>
                    </table>
                    <div class="detalles-solicitud" style="display: none;">
                        <table style="width: 100%;">
                            <thead>
                                <tr>
                                    <th>SEC</th>
                                    <th>NUM</th>
                                    <th>AREA</th>
                                    <th>INICIO</th>
                                    <th>REGISTRO</th>
                                    <th>PROCESO</th>
                                    <th>POB</th>
                                    <th>STS</th>
                                    <th>ORIG</th>
                                    <th>RPU</th>
                                    <th>EN TIEMPO</th>
                                    <th>RPE CAPTURA</th>
                                    <th>TARIFA</th>
                                    <th>CUENTA</th>
                                    <th>HILOS</th>
                                </tr>
                            </thead>
                            <tbody id="detalles-solicitud-tbody">
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        row.appendChild(inicioCell);

        const totalEnTiempoCell = document.createElement("td");
        totalEnTiempoCell.textContent = Object.keys(groupedData[area]).reduce(
            (acc, inicio) =>
                acc +
                (groupedData[area][inicio]["E"] ? groupedData[area][inicio]["E"].length : 0),
            0
        );

        row.appendChild(totalEnTiempoCell);

        const vencidasCell = document.createElement("td");
        vencidasCell.textContent = Object.keys(groupedData[area]).reduce(
            (acc, inicio) =>
                acc +
                (groupedData[area][inicio]["V"] ? groupedData[area][inicio]["V"].length : 0),
            0
        );
        row.appendChild(vencidasCell);

        const pendientesCell = document.createElement("td");
        pendientesCell.textContent = Object.keys(groupedData[area]).reduce(
            (acc, inicio) =>
                acc +
                (groupedData[area][inicio]["P"] ? groupedData[area][inicio]["P"].length : 0),
            0
        );
        row.appendChild(pendientesCell);

        const totalCell = document.createElement("td");
        totalCell.textContent = Object.keys(groupedData[area]).reduce(
            (acc, inicio) =>
                acc +
                Object.keys(groupedData[area][inicio]).reduce(
                    (acc, enTiempo) => acc + groupedData[area][inicio][enTiempo].length,
                    0
                ),
            0
        );
        row.appendChild(totalCell);

        tbody.appendChild(row);
    });

    table.appendChild(thead);
    table.appendChild(tbody);
    tableContainer.appendChild(table);

    // Agregar evento de clic a cada fila de la tabla de detalles
    const detallesContainers = document.querySelectorAll(".detalles-container");
    detallesContainers.forEach((detallesContainer) => {
        const detallesTable = detallesContainer.querySelector("table");
        detallesTable.addEventListener("click", (e) => {
            if (e.target.tagName === "TD") {
                const filaPadre = e.target.parentNode;
                if (filaPadre.cells && filaPadre.cells[0]) {
                    const inicio = filaPadre.cells[0].textContent;
                    const area = detallesContainer
                        .closest("tr")
                        .querySelector("td").textContent;
                    const detallesSolicitud = filaPadre.nextElementSibling;

                    // Si ya existe una tabla de detalles, la eliminamos en lugar de duplicarla
                    if (
                        detallesSolicitud &&
                        detallesSolicitud.classList.contains("detalles-solicitud")
                    ) {
                        detallesSolicitud.remove();
                        return; // Salimos para evitar que se vuelva a agregar
                    }

                    // Agregar la tabla de detalles de solicitud
                    const detallesSolicitudHtml = `
        <tr class="detalles-solicitud">
            <td colspan="4">
                <table style="width: 100%;">
                    <thead>
                        <tr>
                            <th>SEC</th>
                            <th>NUM</th>
                            <th>AREA</th>
                            <th>INICIO</th>
                            <th>REGISTRO</th>
                            <th>PROCESO</th>
                            <th>POB</th>
                            <th>STS</th>
                            <th>ORIG</th>
                            <th>RPU</th>
                            <th>EN TIEMPO</th>
                            <th>RPE CAPTURA</th>
                            <th>TARIFA</th>
                            <th>CUENTA</th>
                            <th>HILOS</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${Object.keys(groupedData[area][inicio])
                            .map(
                                (enTiempo) => `
                            ${groupedData[area][inicio][enTiempo]
                                        .map(
                                            (solicitud) => `
                                <tr class="detalle-fila no-click">
                                    <td>${solicitud.sec}</td>
                                    <td>${solicitud.num}</td>
                                    <td>${solicitud.area}</td>
                                    <td>${solicitud.inicio}</td>
                                    <td>${solicitud.registro}</td>
                                    <td>${solicitud.proceso}</td>
                                    <td>${solicitud.pob}</td>
                                    <td>${solicitud.sts}</td>
                                    <td>${solicitud.orig}</td>
                                    <td>${solicitud.rpu}</td>
                                    <td>${solicitud.en_tiempo}</td>
                                    <td>${solicitud.rpe_captura}</td>
                                    <td>${solicitud.tarifa}</td>
                                    <td>${solicitud.cuenta}</td>
                                    <td>${solicitud.hilos}</td>
                                </tr>
                            `
                                        )
                                        .join("")}
                        `
                            )
                            .join("")}
                    </tbody>
                </table>
            </td>
        </tr>
    `;

                    filaPadre.insertAdjacentHTML("afterend", detallesSolicitudHtml);
                }
            }
        });

        // Mostrar totales de solicitudes y generar gráfica
        mostrarTotalesSolicitudes(data);

        const groupedData2 = {};
        Object.keys(groupedData).forEach((area) => {
            Object.keys(groupedData[area]).forEach((inicio) => {
                Object.keys(groupedData[area][inicio]).forEach((enTiempo) => {
                    if (!groupedData2[area]) {
                        groupedData2[area] = {};
                    }
                    if (!groupedData2[area][enTiempo]) {
                        groupedData2[area][enTiempo] = [];
                    }
                    groupedData2[area][enTiempo].push(...groupedData[area][inicio][enTiempo]);
                });
            });
        });

        generarGrafica(groupedData2);

        const groupedDataPorInicio = {};
        Object.keys(groupedData).forEach((area) => {
            Object.keys(groupedData[area]).forEach((inicio) => {
                if (!groupedDataPorInicio[inicio]) {
                    groupedDataPorInicio[inicio] = {};
                }
                groupedDataPorInicio[inicio][area] = groupedData[area][inicio];
            });
        });

        // Agregar filtro para seleccionar áreas
        const filtroContainer = document.getElementById("filtro-container");
        if (filtroContainer.children.length === 0) {
            const select = document.createElement("select");
            select.className = "filtroButton-tabla";
            select.innerHTML = `
        <option value="todas" selected>Todas las áreas</option>
        ${Object.keys(groupedData).map((area) => `<option value="${area}">${area}</option>`).join("")}
    `;
            filtroContainer.appendChild(select);

            select.addEventListener("change", (e) => {
                const seleccionada = e.target.value;
                if (seleccionada === "todas") {
                    generarGraficaDesdeDatos(groupedDataPorInicio, seleccionada);
                } else {
                    generarGraficaDesdeDatos(groupedDataPorInicio, seleccionada);
                }
            });

            // Llamar a la función para mostrar la gráfica con la opción "todas las áreas" predefinida
            generarGraficaDesdeDatos(groupedDataPorInicio, "todas");
        }


        // Evitar que los detalles tengan eventos de clic no deseados
        document.addEventListener("click", (e) => {
            if (e.target.closest(".detalle-fila")) {
                e.stopPropagation();
            }
        });
    });
}

function generarGraficaDesdeDatos(datos, seleccionada) {
    if (typeof datos !== "object") {
        //console.error("Error: 'datos' no es un objeto válido. Valor recibido:", datos);
        return;
    }

    // Convertir el objeto a un array de datos
    let filteredData = {};
    if (seleccionada === "todas") {
        filteredData = datos;
    } else {
        Object.keys(datos).forEach((inicio) => {
            const areas = Object.keys(datos[inicio]);
            const filteredAreas = areas.filter((area) => area.includes(seleccionada));
            if (filteredAreas.length > 0) {
                filteredData[inicio] = {};
                filteredAreas.forEach((area) => {
                    filteredData[inicio][area] = datos[inicio][area];
                });
            }
        });
    }

    const datosArray = Object.entries(filteredData).flatMap(([inicio, areas]) =>
        Object.entries(areas).map(([area, valores]) => ({
            Área: area,
            Inicio: inicio,
            Pendientes: valores["P"] ? valores["P"].length : 0,
            Vencidas: valores["V"] ? valores["V"].length : 0,
            "En Tiempo": valores["E"] ? valores["E"].length : 0
        }))
    );

    // Filtrar datos para no mostrar 0
    const datosArrayFiltrado = datosArray.filter((dato) => dato.Pendientes > 0 || dato.Vencidas > 0 || dato["En Tiempo"] > 0);

    if (datosArrayFiltrado.length === 0) {
        //console.warn("Advertencia: No hay datos para mostrar en la gráfica.");
        return;
    }

    const ctx = document.getElementById("myChartInicio").getContext("2d");

    // Destruir el gráfico anterior si existe
    if (window.myChartInicio && window.myChartInicio instanceof Chart) {
        window.myChartInicio.destroy();
    }

    // Extraer datos para la gráfica
    const labels = datosArrayFiltrado.map(d => `${d.Área} - ${d.Inicio}`);
    const pendientesData = datosArrayFiltrado.map(d => d.Pendientes);
    const vencidasData = datosArrayFiltrado.map(d => d.Vencidas);
    const enTiempoData = datosArrayFiltrado.map(d => d["En Tiempo"]);

    window.myChartInicio = new Chart(ctx, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [
                {
                    label: "Pendientes (P)",
                    data: pendientesData,
                    backgroundColor: "rgba(144, 238, 144, 0.6)", // Verde claro
                    borderColor: "rgba(144, 238, 144, 1)",
                    borderWidth: 1,
                },
                {
                    label: "En Tiempo (E)",
                    data: enTiempoData,
                    backgroundColor: "rgba(0, 100, 0, 0.6)", // Verde oscuro
                    borderColor: "rgba(0, 100, 0, 1)",
                    borderWidth: 1,
                },
                {
                    label: "Vencidas (V)",
                    data: vencidasData,
                    backgroundColor: "#006837", // Verde normal
                    borderColor: "#006837",
                    borderWidth: 1,
                },
            ],
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                },
            },
            plugins: {
                legend: {
                    display: true,
                },
                datalabels: {
                    display: true,
                    anchor: "end",
                    align: "end",
                    font: {
                        size: 12,
                    },
                    color: "black",
                    formatter: (value) => value > 0 ? `${value}` : '',
                    textStrokeColor: "white",
                    textStrokeWidth: 2,
                },
            },
        },
        plugins: [ChartDataLabels], // Asegurar que el plugin está activo
    });


}

function generarGrafica(groupedData2) {
    const ctx = document.getElementById("myChart").getContext("2d");

    // Destruir el gráfico anterior si existe
    if (window.myChart && window.myChart instanceof Chart) {
        window.myChart.destroy();
    }

    // Crear el nuevo gráfico
    window.myChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: Object.keys(groupedData2),
            datasets: [
                {
                    label: "P",
                    data: Object.keys(groupedData2).map((area) => groupedData2[area]["P"] ? groupedData2[area]["P"].length : 0),
                    backgroundColor: "rgba(144, 238, 144, 0.6)", // Verde claro
                    borderColor: "rgba(144, 238, 144, 1)",
                    borderWidth: 1,
                },
                {
                    label: "V",
                    data: Object.keys(groupedData2).map((area) => groupedData2[area]["V"] ? groupedData2[area]["V"].length : 0),
                    backgroundColor: "#006837", // Verde normal
                    borderColor: "#006837",
                    borderWidth: 1,
                },
                {
                    label: "E",
                    data: Object.keys(groupedData2).map((area) => groupedData2[area]["E"] ? groupedData2[area]["E"].length : 0),
                    backgroundColor: "rgba(0, 100, 0, 0.6)", // Verde fuerte (casi oscuro)
                    borderColor: "rgba(0, 100, 0, 1)",
                    borderWidth: 1,
                },
            ],
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                },
            },
            plugins: {
                legend: {
                    display: true,
                },
                datalabels: {
                    display: true,
                    anchor: "end",
                    align: "end",
                    font: {
                        size: 12,
                    },
                    color: "black",
                    formatter: (value, context) => {
                        const index = context.dataIndex;
                        const total = Object.keys(groupedData2).reduce((acc, area) => acc + (groupedData2[area]["P"] ? groupedData2[area]["P"].length : 0) + (groupedData2[area]["V"] ? groupedData2[area]["V"].length : 0) + (groupedData2[area]["E"] ? groupedData2[area]["E"].length : 0), 0);
                        const porcentaje = ((value / total) * 100).toFixed(2);
                        return `${value} (${porcentaje}%)`;
                    },
                    textStrokeColor: "white", // Borde blanco
                    textStrokeWidth: 2, // Ancho del borde
                },
            },
        },
        plugins: [ChartDataLabels], // Asegúrate de incluir este plugin
    });
}

function mostrarTotalesSolicitudes(data) {
    let totalP = 0,
        totalV = 0,
        totalE = 0;

    // Contar las solicitudes según su tipo
    data.forEach((solicitud) => {
        if (solicitud.en_tiempo === "P") {
            totalP++;
        } else if (solicitud.en_tiempo === "V") {
            totalV++;
        } else if (solicitud.en_tiempo === "E") {
            totalE++;
        }
    });

    // Actualizar los divs con los totales
    document.querySelector(
        "#opportunityContainer .opportunity-content"
    ).textContent = `Solicitudes Pendientes: ${totalP}`;
    document.querySelector(
        "#opportunityContainer1 .opportunity-content"
    ).textContent = `Solicitudes Vencidas: ${totalV}`;
    document.querySelector(
        "#opportunityContainer2 .opportunity-content"
    ).textContent = `Solicitudes en Tiempo: ${totalE}`;
}

/*
*Segunda parte; solicitudes pendientes de atencion
*/

document
    .getElementById("pageFileInput")
    .addEventListener("change", function (event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function (e) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(e.target.result, "text/html");
            const tableRows = doc.querySelectorAll("table tbody tr");

            let data = [];

            tableRows.forEach((row, index) => {
                const cells = row.querySelectorAll("td");
                if (cells.length < 18) return;

                const rowData = {
                    num: cells[0].textContent.trim(),
                    orden: cells[1].textContent.trim(),
                    area: cells[2].textContent.trim(),
                    agencia: cells[3].textContent.trim(),
                    zona: cells[4].textContent.trim(),
                    inicio: cells[5].textContent.trim(),
                    status: cells[6].textContent.trim(),
                    fechasolicitud: cells[7].textContent.trim(),
                    fechaextraccionsicos: cells[8].textContent.trim(),
                    hilos: cells[9].textContent.trim(),
                    tipopoblacion: cells[10].textContent.trim(),
                    rpu: cells[11].textContent.trim(),
                    numcuenta: cells[12].textContent.trim(),
                    telefono: cells[13].textContent.trim(),
                    tarifa: cells[14].textContent.trim(),
                    minutos: cells[15].textContent.trim(),
                    horas: cells[16].textContent.trim(),
                    dias: cells[17].textContent.trim(),
                    diasColor: cells[17].getAttribute("bgcolor"), // Extrae el color de fondo de la celda
                };

                if (
                    rowData.num.toUpperCase() === "num" &&
                    rowData.orden.toUpperCase() === "orden"
                ) {
                    console.warn(
                        "Se detectó una fila de encabezado duplicada y se omitió."
                    );
                } else {
                    data.push(rowData);
                }
            });

            data.shift();
            //console.log("Datos extraídos correctamente:", data);
            mostrarTablaSolicitudesPorEstado(data);
            mostrarGrafico(data);
            mostrarSolicitudesPorColor(data);
            //generarGraficaPorEstado(data);
        };
        reader.readAsText(file);
    });

// Función para expandir/cerrar los detalles de cada "Inicio"
function toggleDetalles(area, inicio) {
    const detallesRow = document.getElementById(`detalles-${area}-${inicio}`);
    detallesRow.style.display = detallesRow.style.display === "none" ? "table-row" : "none";
}

function mostrarTablaSolicitudesPorEstado(data) {
    const tableContainer = document.querySelector(".table-container2");
    tableContainer.innerHTML = "";
    // Agrupar los datos por Área e Inicio
    const groupedData = {};
    data.forEach((point) => {
        if (!groupedData[point.area]) {
            groupedData[point.area] = { "verde": 0, "amarillo": 0, "rojo": 0, "total": 0, "inicios": {} };
        }
        if (!groupedData[point.area]["inicios"][point.inicio]) {
            groupedData[point.area]["inicios"][point.inicio] = { "verde": 0, "amarillo": 0, "rojo": 0, "total": 0, "detalles": [] };
        }

        // Obtener el estado según el color de fondo de la celda "Días"
        const diasColor = point.diasColor;
        let estado = "verde"; // Predeterminado

        if (diasColor === "#FF0000") {
            estado = "rojo";
        } else if (diasColor === "#FFFF00") {
            estado = "amarillo";
        }

        // Sumar al inicio
        groupedData[point.area]["inicios"][point.inicio][estado]++;
        groupedData[point.area]["inicios"][point.inicio]["total"]++;
        groupedData[point.area]["inicios"][point.inicio]["detalles"].push(point);

        // Sumar al área
        groupedData[point.area][estado]++;
        groupedData[point.area]["total"]++;
    });

    // Crear la tabla
    const table = document.createElement("table");
    table.style.width = "100%";
    table.style.margin = "0 auto";
    const thead = document.createElement("thead");
    const tbody = document.createElement("tbody");

    // Encabezados de la tabla
    const headers = ["ÁREA", "VERDE", "AMARILLO", "ROJO", "TOTAL"];
    const row = document.createElement("tr");
    headers.forEach((header) => {
        const th = document.createElement("th");
        th.textContent = header;
        row.appendChild(th);
    });
    thead.appendChild(row);

    // Llenar la tabla con los datos agrupados
    Object.keys(groupedData).forEach((area) => {
        const areaData = groupedData[area];

        // Fila de Área (clic para expandir/cerrar)
        const areaRow = document.createElement("tr");
        areaRow.classList.add("area-row");
        areaRow.style.cursor = "pointer";

        areaRow.addEventListener("click", () => {
            const iniciosContainer = areaRow.nextElementSibling;
            iniciosContainer.style.display = iniciosContainer.style.display === "none" ? "table-row" : "none";
        });

        // Datos de la fila de Área
        const areaCell = document.createElement("td");
        areaCell.textContent = area;
        areaRow.appendChild(areaCell);

        ["verde", "amarillo", "rojo", "total"].forEach((key) => {
            const cell = document.createElement("td");
            cell.textContent = areaData[key];
            areaRow.appendChild(cell);
        });

        tbody.appendChild(areaRow);

        // Contenedor de los inicios dentro del área
        const iniciosContainer = document.createElement("tr");
        iniciosContainer.style.display = "none";
        iniciosContainer.classList.add("inicio-container");

        const inicioCell = document.createElement("td");
        inicioCell.colSpan = 5;
        inicioCell.innerHTML = `
            <table style="width:100%; border-collapse: collapse;">
                <thead>
                    <tr>
                        <th>INICIO</th>
                        <th>VERDE</th>
                        <th>AMARILLO</th>
                        <th>ROJO</th>
                        <th>TOTAL</th>
                    </tr>
                </thead>
                <tbody>
                    ${Object.keys(areaData["inicios"])
                .map((inicio) => {
                    return `
                            <tr class="inicio-row" style="cursor:pointer;" onclick="toggleDetalles('${area}', '${inicio}')">
                                <td>${inicio}</td>
                                <td>${areaData["inicios"][inicio]["verde"]}</td>
                                <td>${areaData["inicios"][inicio]["amarillo"]}</td>
                                <td>${areaData["inicios"][inicio]["rojo"]}</td>
                                <td>${areaData["inicios"][inicio]["total"]}</td>
                            </tr>
                            <tr id="detalles-${area}-${inicio}" class="detalles-container" style="display:none;">
                                <td colspan="5">
                                    <table style="width:100%; border-collapse: collapse;">
                                        <thead>
                                            <tr>
                                                <th>NUM</th>
                                                <th>ORDEN</th>
                                                <th>ÁREA</th>
                                                <th>AGENCIA</th>
                                                <th>ZONA</th>
                                                <th>INICIO</th>
                                                <th>STATUS</th>
                                                <th>FECHA SOLICITUD</th>
                                                <th>HILOS</th>
                                                <th>TIPO POBLACIÓN</th>
                                                <th>RPU</th>
                                                <th>NUM CUENTA</th>
                                                <th>TELÉFONO</th>
                                                <th>TARIFA</th>
                                                <th>MINUTOS</th>
                                                <th>HORAS</th>
                                                <th>DÍAS</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${areaData["inicios"][inicio]["detalles"]
                            .map((solicitud) => {
                                let estiloFondo = "";
                                if (solicitud.diasColor === "#FF0000") {
                                    estiloFondo = "background-color: #FFC0CB;"; // Color rojo claro
                                } else if (solicitud.diasColor === "#FFFF00") {
                                    estiloFondo = "background-color: #FFFFCC;"; // Color amarillo claro
                                } else {
                                    estiloFondo = "background-color: #C6F4D6;"; // Color verde claro
                                }

                                return `
                                                    <tr style="${estiloFondo}">
                                                        <td>${solicitud.num}</td>
                                                        <td>${solicitud.orden}</td>
                                                        <td>${solicitud.area}</td>
                                                        <td>${solicitud.agencia}</td>
                                                        <td>${solicitud.zona}</td>
                                                        <td>${solicitud.inicio}</td>
                                                        <td>${solicitud.status}</td>
                                                        <td>${solicitud.fechasolicitud}</td>
                                                        <td>${solicitud.hilos}</td>
                                                        <td>${solicitud.tipopoblacion}</td>
                                                        <td>${solicitud.rpu}</td>
                                                        <td>${solicitud.numcuenta}</td>
                                                        <td>${solicitud.telefono}</td>
                                                        <td>${solicitud.tarifa}</td>
                                                        <td>${solicitud.minutos}</td>
                                                        <td>${solicitud.horas}</td>
                                                        <td>${solicitud.dias}</td>
                                                    </tr>
                                                `;
                            })
                            .join("")}
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                        `;
                })
                .join("")}
                </tbody>
            </table>
        `;

        iniciosContainer.appendChild(inicioCell);
        tbody.appendChild(iniciosContainer);
    });

    table.appendChild(thead);
    table.appendChild(tbody);
    tableContainer.appendChild(table);

}
function mostrarGrafico(data) {
    const graphicContainer = document.getElementById("graphic3");
    if (graphicContainer) {
        // Obtener el canvas
        const ctx = document.getElementById("myChart2");

        // Obtener los datos agrupados por área
        const groupedData = {};
        data.forEach((point) => {
            if (!groupedData[point.area]) {
                groupedData[point.area] = { "verde": 0, "amarillo": 0, "rojo": 0, "total": 0 };
            }

            // Obtener el estado según el color de fondo de la celda "Días"
            const diasColor = point.diasColor;
            let estado = "verde"; // Predeterminado

            if (diasColor === "#FF0000") {
                estado = "rojo";
            } else if (diasColor === "#FFFF00") {
                estado = "amarillo";
            }

            // Sumar al área
            groupedData[point.area][estado]++;
            groupedData[point.area]["total"]++;
        });

        // Crear la gráfica
        const chart = new Chart(ctx, {
            type: "bar",
            data: {
                labels: Object.keys(groupedData),
                datasets: [
                    {
                        label: "Verde",
                        data: Object.values(groupedData).map((area) => area.verde),
                        backgroundColor: "rgba(0, 128, 0, 0.5)",
                        borderColor: "rgba(0, 128, 0, 1)",
                        borderWidth: 1
                    },
                    {
                        label: "Amarillo",
                        data: Object.values(groupedData).map((area) => area.amarillo),
                        backgroundColor: "rgba(255, 255, 0, 0.5)",
                        borderColor: "rgba(255, 255, 0, 1)",
                        borderWidth: 1
                    },
                    {
                        label: "Rojo",
                        data: Object.values(groupedData).map((area) => area.rojo),
                        backgroundColor: "rgba(255, 0, 0, 0.5)",
                        borderColor: "rgba(255, 0, 0, 1)",
                        borderWidth: 1
                    }
                ]
            },
            options: {
                title: {
                    display: true,
                    text: "Información agrupada por área"
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                },
                plugins: {
                    datalabels: {
                        display: true,
                        anchor: "end",
                        align: "end",
                        font: {
                            size: 12,
                        },
                        color: "black",
                        formatter: (value, context) => {
                            const index = context.dataIndex;
                            const total = Object.values(groupedData).reduce((acc, area) => acc + area.verde + area.amarillo + area.rojo, 0);
                            const porcentaje = ((value / total) * 100).toFixed(2);
                            return `${value} (${porcentaje}%)`;
                        },
                        textStrokeColor: "white", // Borde blanco
                        textStrokeWidth: 2, // Ancho del borde
                    },
                },
            },
            plugins: [ChartDataLabels], // Asegúrate de incluir este plugin
        });
    } else {
        console.error("El elemento con el ID 'graphic3' no existe");
    }
}

function mostrarSolicitudesPorColor(data) {
    // Inicializar contadores
    let verde = 0;
    let amarillo = 0;
    let rojo = 0;

    // Recorrer los datos y contar las solicitudes por color
    data.forEach((point) => {
        const diasColor = point.diasColor;
        if (diasColor === "#FF0000") {
            rojo++;
        } else if (diasColor === "#FFFF00") {
            amarillo++;
        } else {
            verde++;
        }
    });

    // Mostrar la cantidad de solicitudes por color en los divs correspondientes
    const opportunityContainerVerde = document.getElementById("opportunityContainerVerde");
    const opportunityContainerAmarillo = document.getElementById("opportunityContainerAmarillo");
    const opportunityContainerRojo = document.getElementById("opportunityContainerRojo");

    opportunityContainerVerde.querySelector(".opportunity-content").innerHTML = `Solicitudes en Verde: ${verde}`;
    opportunityContainerAmarillo.querySelector(".opportunity-content").innerHTML = `Solicitudes en Amarillo: ${amarillo}`;
    opportunityContainerRojo.querySelector(".opportunity-content").innerHTML = `Solicitudes en Rojo: ${rojo}`;
}

/*
* INTENTO DE CREAR GRAFICA POR AREA, INICIO
function generarGraficaPorEstado(groupedData) {
    // Obtener el contenedor de la gráfica
    const ctx = document.getElementById("myChartFinal").getContext("2d");

    // Destruir el gráfico anterior si existe
    if (window.myChartFinal && window.myChartFinal instanceof Chart) {
        window.myChartFinal.destroy();
    }

    // Filtrar áreas para el filtro
    const filtroContainer = document.querySelector(".filtro-container2");
    const areas = Object.keys(groupedData);
    areas.forEach(area => {
        const option = document.createElement("option");
        option.value = area;
        option.textContent = area;
        filtroContainer.appendChild(option);
    });

    // Obtener el área seleccionada desde el filtro
    filtroContainer.addEventListener("change", function() {
        const selectedArea = filtroContainer.value;
        const areaData = groupedData[selectedArea];

        // Crear las etiquetas y los datos para la gráfica
        const labels = Object.keys(areaData["inicios"]);
        const verdesData = labels.map(inicio => areaData["inicios"][inicio]["verde"]);
        const amarillosData = labels.map(inicio => areaData["inicios"][inicio]["amarillo"]);
        const rojosData = labels.map(inicio => areaData["inicios"][inicio]["rojo"]);

        // Crear la gráfica
        window.myChartGraphic4 = new Chart(ctx, {
            type: "bar",
            data: {
                labels: labels,
                datasets: [
                    {
                        label: "Verde",
                        data: verdesData,
                        backgroundColor: "rgba(144, 238, 144, 0.6)", // Verde claro
                        borderColor: "rgba(144, 238, 144, 1)",
                        borderWidth: 1,
                    },
                    {
                        label: "Amarillo",
                        data: amarillosData,
                        backgroundColor: "rgba(255, 255, 0, 0.6)", // Amarillo
                        borderColor: "rgba(255, 255, 0, 1)",
                        borderWidth: 1,
                    },
                    {
                        label: "Rojo",
                        data: rojosData,
                        backgroundColor: "rgba(255, 99, 132, 0.6)", // Rojo
                        borderColor: "rgba(255, 99, 132, 1)",
                        borderWidth: 1,
                    },
                ],
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                    },
                },
                plugins: {
                    legend: {
                        display: true,
                    },
                    datalabels: {
                        display: true,
                        anchor: "end",
                        align: "end",
                        font: {
                            size: 12,
                        },
                        color: "black",
                        formatter: (value) => value > 0 ? `${value}` : '',
                        textStrokeColor: "white",
                        textStrokeWidth: 2,
                    },
                },
            },
            plugins: [ChartDataLabels], // Asegurar que el plugin está activo
        });
    });

    // Seleccionar el área por defecto si es necesario
    if (areas.length > 0) {
        filtroContainer.value = areas[0];
        filtroContainer.dispatchEvent(new Event("change"));
    }
}
*/
/*
function mostrarTabla2(data) {
    const tableContainer = document.querySelector(".table-container2");
    tableContainer.innerHTML = "";

    // Agrupar los datos por área e inicio
    const groupedData = {};
    data.forEach((point) => {
        if (!groupedData[point.area]) {
            groupedData[point.area] = {};
        }
        if (!groupedData[point.area][point.inicio]) {
            groupedData[point.area][point.inicio] = {};
        }
        if (!groupedData[point.area][point.inicio][point.dias]) {
            groupedData[point.area][point.inicio][point.dias] = [];
        }
        groupedData[point.area][point.inicio][point.dias].push(point);
    });

    // Crear tabla
    const table = document.createElement("table");
    table.style.marginLeft = "0px";
    table.style.width = "100%";
    table.style.margin = "0 auto";
    const thead = document.createElement("thead");
    const tbody = document.createElement("tbody");

    const row = document.createElement("tr");
    const headers = ["ÁREA", "INICIO", "ROJO", "AMARILLO", "VERDE", "TOTAL"];
    headers.forEach((header) => {
        const th = document.createElement("th");
        th.textContent = header;
        row.appendChild(th);
    });
    thead.appendChild(row);

    // Llenar la tabla con los datos agrupados
    Object.keys(groupedData).forEach((area) => {
        const row = document.createElement("tr");
        const areaCell = document.createElement("td");
        areaCell.textContent = area;
        row.appendChild(areaCell);

        const inicioCell = document.createElement("td");
        inicioCell.innerHTML = `
                    <div class="detalles-container" style="display: none;">
                        <table style="width: 100%;">
                            <thead>
                                <tr>
                                    <th>INICIO</th>
                                    <th>ROJO</th>
                                    <th>AMARILLO</th>
                                    <th>VERDE</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${Object.keys(groupedData[area])
                .map(
                    (inicio) => `
                                    <tr>
                                        <td>${inicio}</td>
                                        <td>${Object.keys(groupedData[area][inicio]).reduce(
                        (acc, dias) =>
                            acc +
                            groupedData[area][inicio][dias].filter(
                                (solicitud) => solicitud.dias === "ROJO"
                            ).length,
                        0
                    )}</td>
                                        <td>${Object.keys(groupedData[area][inicio]).reduce(
                        (acc, dias) =>
                            acc +
                            groupedData[area][inicio][dias].filter(
                                (solicitud) => solicitud.dias === "AMARILLO"
                            ).length,
                        0
                    )}</td>
                                        <td>${Object.keys(groupedData[area][inicio]).reduce(
                        (acc, dias) =>
                            acc +
                            groupedData[area][inicio][dias].filter(
                                (solicitud) => solicitud.dias === "VERDE"
                            ).length,
                        0
                    )}</td>
                                    </tr>
                                `
                )
                .join("")}
                            </tbody>
                        </table>
                        <div class="detalles-solicitud" style="display: none;">
                            <table style="width: 100%;">
                                <thead>
                                    <tr>
                                        <th>NUM</th>
                                        <th>ORDEN</th>
                                        <th>AREA</th>
                                        <th>AGENCIA</th>
                                        <th>ZONA</th>
                                        <th>INICIO</th>
                                        <th>STATUS</th>
                                        <th>FECHA SOLICITUD</th>
                                        <th>FECHA EXTRACCION SICOSS</th>
                                        <th>HILOS</th>
                                        <th>TIPO POBLACION</th>
                                        <th>RPU</th>
                                        <th>NUM CUENTA</th>
                                        <th>TELEFONO</th>
                                        <th>TARIFA</th>
                                        <th>MINUTOS</th>
                                        <th>HORAS</th>
                                        <th>DIAS</th>
                                    </tr>
                                </thead>
                                <tbody id="detalles-solicitud-tbody">
                                </tbody>
                            </table>
                        </div>
                    </div>
                `;
        row.appendChild(inicioCell);

        const rojoCell = document.createElement("td");
        rojoCell.textContent = Object.keys(groupedData[area]).reduce(
            (acc, inicio) =>
                acc +
                Object.keys(groupedData[area][inicio]).reduce(
                    (acc, dias) =>
                        acc +
                        groupedData[area][inicio][dias].filter(
                            (solicitud) => solicitud.dias.style.backgroundColor === "red"
                        ).length,
                    0
                ),
            0
        );
        row.appendChild(rojoCell);

        const amarilloCell = document.createElement("td");
        amarilloCell.textContent = Object.keys(groupedData[area]).reduce(
            (acc, inicio) =>
                acc +
                Object.keys(groupedData[area][inicio]).reduce(
                    (acc, dias) =>
                        acc +
                        groupedData[area][inicio][dias].filter(
                            (solicitud) => solicitud.dias.style.backgroundColor === "yellow"
                        ).length,
                    0
                ),
            0
        );
        row.appendChild(amarilloCell);

        const verdeCell = document.createElement("td");
        verdeCell.textContent = Object.keys(groupedData[area]).reduce(
            (acc, inicio) =>
                acc +
                Object.keys(groupedData[area][inicio]).reduce(
                    (acc, dias) =>
                        acc +
                        groupedData[area][inicio][dias].filter(
                            (solicitud) => solicitud.dias.style.backgroundColor === "green"
                        ).length,
                    0
                ),
            0
        );
        row.appendChild(verdeCell);

        const totalCell = document.createElement("td");
        totalCell.textContent = Object.keys(groupedData[area]).reduce(
            (acc, inicio) =>
                acc +
                Object.keys(groupedData[area][inicio]).reduce(
                    (acc, dias) => acc + groupedData[area][inicio][dias].length,
                    0
                ),
            0
        );
        row.appendChild(totalCell);

        tbody.appendChild(row);
    });

    table.appendChild(thead);
    table.appendChild(tbody);
    tableContainer.appendChild(table);

    // Agregar evento de clic a cada fila de la tabla de detalles
    const detallesContainers = document.querySelectorAll(".detalles-container");
    detallesContainers.forEach((detallesContainer) => {
        const detallesTable = detallesContainer.querySelector("table");
        detallesTable.addEventListener("click", (e) => {
            if (e.target.tagName === "TD") {
                const filaPadre = e.target.parentNode;
                if (filaPadre.cells && filaPadre.cells[0]) {
                    const inicio = filaPadre.cells[0].textContent;
                    const area = detallesContainer
                        .closest("tr")
                        .querySelector("td").textContent;
                    const detallesSolicitud = filaPadre.nextElementSibling;

                    // Si ya existe una tabla de detalles, la eliminamos en lugar de duplicarla
                    if (
                        detallesSolicitud &&
                        detallesSolicitud.classList.contains("detalles-solicitud")
                    ) {
                        detallesSolicitud.remove();
                        return; // Salimos para evitar que se vuelva a agregar
                    }

                    // Agregar la tabla de detalles de solicitud
                    const detallesSolicitudHtml = `
            <tr class="detalles-solicitud">
                <td colspan="4">
                    <table style="width: 100%;">
                        <thead>
                            <tr>
                                <th>NUM</th>
                                <th>ORDEN</th>
                                <th>AREA</th>
                                <th>AGENCIA</th>
                                <th>ZONA</th>
                                <th>INICIO</th>
                                <th>STATUS</th>
                                <th>FECHA SOLICITUD</th>
                                <th>FECHA EXTRACCION SICOSS</th>
                                <th>HILOS</th>
                                <th>TIPO POBLACION</th>
                                <th>RPU</th>
                                <th>NUM CUENTA</th>
                                <th>TELEFONO</th>
                                <th>TARIFA</th>
                                <th>MINUTOS</th>
                                <th>HORAS</th>
                                <th>DIAS</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${Object.keys(groupedData[area][inicio])
                            .map(
                                (dias) => `
                                ${groupedData[area][inicio][dias]
                                        .map(
                                            (solicitud) => `
                                    <tr class="detalle-fila no-click">
                                        <td>${solicitud.num}</td>
                                        <td>${solicitud.orden}</td>
                                        <td>${solicitud.area}</td>
                                        <td>${solicitud.agencia}</td>
                                        <td>${solicitud.zona}</td>
                                        <td>${sol.inicio}</td>
                                        <td>${solicitud.status}</td>
                                        <td>${solicitud.fechasolicitud}</td>
                                        <td>${solicitud.fechaextraccionsicos}</td>
                                        <td>${solicitud.hilos}</td>
                                        <td>${solicitud.tipopoblacion}</td>
                                        <td>${solicitud.rpu}</td>
                                        <td>${solicitud.numcuenta}</td>
                                        <td>${solicitud.telefono}</td>
                                        <td>${solicitud.tarifa}</td>
                                        <td>${solicitud.minutos}</td>
                                        <td>${solicitud.horas}</td>
                                        <td>${solicitud.dias}</td>
                                    </tr>
                                `
                                        )
                                        .join("")}
                            `
                            )
                            .join("")}
                        </tbody>
                    </table>
                </td>
            </tr>
        `;

                    filaPadre.insertAdjacentHTML("afterend", detallesSolicitudHtml);
                }
            }
        });
    });
}
*/