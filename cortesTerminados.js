const $ = "https://code.jquery.com/jquery-3.6.0.min"
const XLSX = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.17.2/xlsx.full.min"

// Variables globales para almacenar los datos
let allDataActual = [];
let allDataAnterior = [];
let repeticionesFiltro = 2; // Valor inicial

document.getElementById('fileInput').addEventListener('change', async (event) => {
    const files = event.target.files;
    document.getElementById("analisisContainer").innerHTML = ""; // Limpiar contenedores previos

    allDataActual = []; // Reiniciar los datos actuales
    let contratoData = [];
    let quejaData = [];

    for (const file of files) {
        const content = await file.text();
        const data = await processFile(content);

        if (data.tipo.startsWith("S")) {
            contratoData.push(...data.rows);
        } else if (data.tipo.startsWith("S")) {
            quejaData.push(...data.rows);
        }

        allDataActual.push(...data.rows); // Combina todos los datos en allData
    }

    if (files.length === 1) {
        renderAnomaliesChartByType(allDataActual, "Gráfica de Anomalías en Solicitudes Repetidas");
        mostrarResumenFinal(allDataActual, "Resumen Solicitudes Repetidas por RPU");
        tabla1mostrarTablaSolicitudesRepetidas(allDataActual, "Ordenes Repetidas");
        generarGraficosAnualesPorCto(allDataActual, "ConteoAnual");
        // Llama a la función para generar la gráfica de proyección después de generar los gráficos anuales
        generarGraficaProyeccion(allDataActual);

    } 
        const downloadButton = document.getElementById("downloadExcel");
        downloadButton.style.display = "block";
        downloadButton.onclick = () => downloadExcel(allData);
    });

// Manejo de carga del archivo del año anterior
document.getElementById('fileInputAnioAnterior').addEventListener('change', async (event) => {
    const files = event.target.files;

    document.getElementById("anio").innerHTML = ""; // Limpiar contenedores previos

    allDataAnterior = []; // Reiniciar los datos anteriores
    let contratoData = [];
    let quejaData = [];

    for (const file of files) {
        const content = await file.text();
        const data = await processFile(content);

        if (data.tipo.startsWith("S")) {
            contratoData.push(...data.rows);
        } else if (data.tipo.startsWith("S")) {
            quejaData.push(...data.rows);
        }

        allDataAnterior.push(...data.rows); // Combina todos los datos en allDataAnterior
    }

    // Llama a la función para generar la gráfica comparativa
    generarGraficosAnualesPorCtoAmbos(allDataActual, allDataAnterior);
});

// Función para proyectar los datos a 5 años
function proyectarDatos(dataActual) {
    const ctoGroups = agruparPorCto(dataActual);
    const ctos = Object.keys(ctoGroups);
    const proyecciones = {};

    ctos.forEach(cto => {
        const totalRepeticiones = Object.values(ctoGroups[cto]).reduce((a, b) => a + b, 0);
        // Suponiendo un crecimiento del 10% anual
        const crecimientoAnual = totalRepeticiones * 0.10;
        const proyeccion = [];

        for (let i = 0; i <= 5; i++) {
            proyeccion.push(totalRepeticiones + (crecimientoAnual * i));
        }

        proyecciones[cto] = proyeccion;
    });

    return proyecciones;
}

// Función para generar la gráfica de polígonos
function generarGraficaProyeccion(dataActual) {
    const proyecciones = proyectarDatos(dataActual);
    const container = document.getElementById("anio");

    // Crear un nuevo canvas para la gráfica de proyección
    const canvasProyeccion = document.createElement("canvas");
    canvasProyeccion.id = "chartProyeccion";
    container.appendChild(canvasProyeccion);

    const ctos = Object.keys(proyecciones);
    const datasets = ctos.map((cto, index) => ({
        label: `Proyección ${cto}`,
        data: proyecciones[cto],
        backgroundColor: `rgba(${75 + index * 20}, ${192 - index * 20}, 112, 0.2)`,
        borderColor: `rgb(${75 + index * 20}, ${192 - index * 20}, 112)`,
        borderWidth: 2,
        fill: true,
        tension: 0.4 // Para suavizar la línea
    }));

    // Crear gráfico de polígonos
    new Chart(canvasProyeccion.getContext('2d'), {
        type: 'line', // Cambiar a tipo 'line' para gráfica poligonal
        data: {
            labels: ['Año Actual', '1 Año', '2 Años', '3 Años', '4 Años', '5 Años'],
            datasets: datasets
        },
        options: {
            plugins: {
                legend: {
                    labels: {
                        font: {
                            size: 20 // Cambia el tamaño de la fuente de la leyenda
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                },
                x: {
                    ticks: {
                        font: {
                            size: 12 // Cambia el tamaño de la fuente de los labels del eje X
                        }
                    }
                },
            }
        }
    });
}

// Función para generar gráficos anuales por CTO
function generarGraficosAnualesPorCtoAmbos(dataActual, dataAnterior) {
    const ctoGroupsActual = agruparPorCto(dataActual);
    const ctoGroupsAnterior = agruparPorCto(dataAnterior);
    const container = document.getElementById("anio");

    // Gráfico de líneas para total de repeticiones por CTO
    const ctos = Object.keys(ctoGroupsActual);
    const totalRepeticionesActual = ctos.map(cto => {
        return Object.values(ctoGroupsActual[cto]).reduce((a, b) => a + b, 0); // Sumar todas las repeticiones de RPU
    });

    const totalRepeticionesAnterior = ctos.map(cto => {
        return Object.values(ctoGroupsAnterior[cto] || {}).reduce((a, b) => a + b, 0); // Sumar todas las repeticiones de RPU
    });

    // Crear un nuevo canvas para el gráfico
    const canvasTotal = document.createElement("canvas");
    canvasTotal.id = "chartTotalRepeticiones";
    container.innerHTML = ""; // Limpiar el contenedor antes de agregar el nuevo gráfico
    container.appendChild(canvasTotal);

    // Crear gráfico de líneas
    new Chart(canvasTotal.getContext('2d'), {
        type: 'line', // Cambiar a tipo 'line' para gráfica poligonal
        data: {
            labels: ctos,
            datasets: [
                {
                    label: 'Total de Repeticiones de RPU (Año Actual)',
                    data: totalRepeticionesActual,
                    backgroundColor: 'rgba(75, 192, 112, 0.2)',
                    borderColor: 'rgb(75, 192, 112)',
                    borderWidth: 2,
                    fill: true // Rellenar el área bajo la línea
                },
                {
                    label: 'Total de Repeticiones de RPU (Año Anterior)',
                    data: totalRepeticionesAnterior,
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderColor: 'rgb(246, 55, 96)',
                    borderWidth: 2,
                    fill: true // Rellenar el área bajo la línea
                }
            ]
        },
        options: {
            plugins: {
                legend: {
                    labels: {
                        font: {
                            size: 20 // Cambia el tamaño de la fuente de la leyenda
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                },
                x: {
                    ticks: {
                        font: {
                            size: 12 // Cambia el tamaño de la fuente de los labels del eje X
                        }
                    }
                },
            }
        }
    });
}

function generarGraficosMensualesPorCto(ctoGroups) {
    const container = document.getElementById("mesagency");
    container.innerHTML = ""; // Limpiar el contenedor antes de agregar nuevos gráficos

    // Suponiendo que tienes datos mensuales en el mismo formato que los anuales
    const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    
    // Crear un nuevo canvas para el gráfico mensual
    const canvasMensual = document.createElement("canvas");
    canvasMensual.id = "chartMensual";
    container.appendChild(canvasMensual);

    // Aquí deberías agregar la lógica para calcular los datos mensuales
    const totalMensual = meses.map(mes => {
        // Aquí deberías sumar las repeticiones de RPU para cada mes
        // Esto es solo un ejemplo, necesitarás adaptar esto a tu estructura de datos
        return Math.floor(Math.random() * 100); // Reemplaza esto con tu lógica de suma
    });

    // Crear gráfico mensual
    new Chart(canvasMensual.getContext('2d'), {
        type: 'bar',
        data: {
            labels: meses,
            datasets: [{
                label: 'Repeticiones Mensuales de RPU 2024',
                data: totalMensual,
                backgroundColor: 'rgba(188, 192, 75, 0.2)',
                borderColor: 'rgb(188, 192, 75)',
                borderWidth: 1
            }]
        },
        options: {
            plugins: {
                legend: {
                    labels: {
                        font: {
                            size: 20 // Cambia el tamaño de la fuente de la leyenda
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                },
                x: {
                    ticks: {
                        font: {
                            size: 12 // Cambia el tamaño de la fuente de los labels del eje X
                        }
                    }
                },
            }
        }
    });
}

// Función para agrupar solicitudes por CTO
function agruparPorCto(data) {
    const ctoGroups = {};

    data.forEach(item => {
        const cto = item.cto;
        const rpu = item.rpu;

        if (!ctoGroups[cto]) {
            ctoGroups[cto] = {};
        }
        if (!ctoGroups[cto][rpu]) {
            ctoGroups[cto][rpu] = 0;
        }
        ctoGroups[cto][rpu]++;
    });

    return ctoGroups;
}

function graficarSolicitudesPorColonia(resumenCto) {
    const container = document.getElementById("coloniaContainer");
    container.innerHTML = ""; // Limpiar el contenedor antes de agregar nuevos gráficos

    // Crear un contenedor principal para los botones y la gráfica
    const mainContainer = document.createElement("div");
    mainContainer.style.display = "flex"; // Usar flexbox
    mainContainer.style.alignItems = "flex-start"; // Alinear elementos al inicio
    container.appendChild(mainContainer);

    // Crear un contenedor para los botones
    const buttonContainer = document.createElement("div");
    buttonContainer.id = "buttonContainer2";
    buttonContainer.style.marginRight = "20px"; // Espacio entre botones y gráfico
    mainContainer.appendChild(buttonContainer);

    // Crear un nuevo canvas para el gráfico
    const canvasColonia = document.createElement("canvas");
    canvasColonia.id = "chartSolicitudesPorColonia";
    mainContainer.appendChild(canvasColonia);

    // Obtener los CTOs
    const ctos = Object.keys(resumenCto);
    let chart; // Variable para almacenar la referencia al gráfico

    // Función para actualizar el gráfico
    const actualizarGrafico = (cto) => {
        const colonias = resumenCto[cto].colonias;
        const coloniasArray = Object.keys(colonias);
        const totalPorColonia = coloniasArray.map(colonia => colonias[colonia] ? colonias[colonia].length : 0);

        // Destruir el gráfico existente si ya existe
        if (chart) {
            chart.destroy();
        }

        // Crear gráfico de barras
        chart = new Chart(canvasColonia.getContext('2d'), {
            type: 'bar',
            data: {
                labels: coloniasArray, // Usar el array de colonias del CTO seleccionado
                datasets: [{
                    label: `Solicitudes para ${cto} 2024`,
                    data: totalPorColonia,
                    backgroundColor: 'rgba(100, 192, 75, 0.2)',
                    borderColor: 'rgb(100, 192, 75)',
                    borderWidth: 1
                }]
            },
            options: {
                plugins: {
                    legend: {
                        labels: {
                            font: {
                                size: 20 // Cambia el tamaño de la fuente de la leyenda
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    },
                    x: {
                        ticks: {
                            font: {
                                size: 12 // Cambia el tamaño de la fuente de los labels del eje X
                            }
                        }
                    },
                }
            }
        });
    };

    // Crear botones para cada CTO
    ctos.forEach(cto => {
        const button = document.createElement("button");
        button.textContent = cto;
        button.onclick = () => {
            // Remover la clase 'active' de todos los botones
            const buttons = buttonContainer.getElementsByTagName("button");
            for (let btn of buttons) {
                btn.classList.remove("active");
            }

            // Agregar la clase 'active' al botón pulsado
            button.classList.add("active");

            // Actualizar el gráfico con el CTO seleccionado
            actualizarGrafico(cto);
        };
        buttonContainer.appendChild(button);
    });

    // Inicializar el gráfico con el primer CTO
    if (ctos.length > 0) {
        actualizarGrafico(ctos[0]);
    }
}

// Función para generar gráficos anuales por Cto
function generarGraficosAnualesPorCto(data) {
    const ctoGroups = agruparPorCto(data);
    const container = document.getElementById("anio");

    // Gráfico de barras para total de repeticiones por Cto
    const ctos = Object.keys(ctoGroups);
    const totalRepeticiones = ctos.map(cto => {
        return Object.values(ctoGroups[cto]).reduce((a, b) => a + b, 0); // Sumar todas las repeticiones de RPU
    });

    // Crear un nuevo canvas para el gráfico total
    const canvasTotal = document.createElement("canvas");
    canvasTotal.id = "chartTotalRepeticiones";
    container.appendChild(canvasTotal);

    // Crear gráfico total
    new Chart(canvasTotal.getContext('2d'), {
        type: 'bar',
        data: {
            labels: ctos,
            datasets: [{
                label: 'Repeticiones Generales de RPU 2024',
                data: totalRepeticiones,
                backgroundColor: 'rgba(75, 192, 112, 0.2)',
                borderColor: 'rgb(75, 192, 112)',
                borderWidth: 1
            }]
        },
        options: {
            plugins: {
                legend: {
                    labels: {
                        font: {
                            size: 20 // Cambia el tamaño de la fuente de la leyenda
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                },
                x: {
                    ticks: {
                        font: {
                            size: 12 // Cambia el tamaño de la fuente de los labels del eje X
                        }
                    }
                },
            }
        }
    });

    // Crear un contenedor para la gráfica y los botones en anioagency
    const anioAgencyContainer = document.getElementById("anioagency");
    const chartContainer = document.createElement("div");
    chartContainer.id = "chartContainerAgency";
    anioAgencyContainer.appendChild(chartContainer);

    // Crear un contenedor para los botones
    const buttonContainer = document.createElement("div");
    buttonContainer.id = "buttonContainer";
    chartContainer.appendChild(buttonContainer);

    // Crear un nuevo canvas para el gráfico individual
    const canvasIndividual = document.createElement("canvas");
    canvasIndividual.id = "chartIndividual";
    chartContainer.appendChild(canvasIndividual);

    // Variable para almacenar la referencia al gráfico individual
    let chartIndividual;

    // Crear botones para cada CTO
    ctos.forEach(cto => {
        const button = document.createElement("button");
        button.textContent = cto;
        button.onclick = () => {
            // Remover la clase 'active' de todos los botones
            const buttons = buttonContainer.getElementsByTagName("button");
            for (let btn of buttons) {
                btn.classList.remove("active");
            }

            // Agregar la clase 'active' al botón pulsado
            button.classList.add("active");

            // Filtrar los datos para mostrar solo el CTO seleccionado
            const rpuCounts = Object.entries(ctoGroups[cto])
                .map(([rpu, count]) => ({ rpu, count }))
                .filter(item => item.count >= 1);

            // Destruir el gráfico existente si ya existe
            if (chartIndividual) {
                chartIndividual.destroy();
            }

            // Crear el nuevo gráfico
            chartIndividual = new Chart(canvasIndividual.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: rpuCounts.map(item => item.rpu),
                    datasets: [{
                        label: `Repeticiones de RPU para ${cto}`,
                        data: rpuCounts.map(item => item.count),
                        backgroundColor: 'rgba(27, 42, 211, 0.52)',
                        borderColor: 'rgba(27, 42, 211, 0.7)',
                        borderWidth: 1
                    }]
                },
                options: {
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        };
        buttonContainer.appendChild(button);
    });
    // Crear un botón para ver por mes
    const buttonMes = document.createElement("button");
    buttonMes.textContent = "Ver por Meses";
    buttonMes.onclick = () => {
        // Llamar a la función para generar gráficos mensuales
        generarGraficosMensualesPorCto(ctoGroups);
    };
    buttonContainer.appendChild(buttonMes);
}

function renderAnomaliesChartByType(data, title) {
    const repeatOrders = findRepeatOrdersRPU(data);
    const container = document.getElementById("analisisContainer");

    const quejas = repeatOrders.filter(item => item.requests[0].tipo.startsWith("S"));

    const chartContainer = document.createElement("div");
    chartContainer.classList.add("chart-container");

    const canvas = document.createElement("canvas");
    chartContainer.appendChild(canvas);
    container.insertBefore(chartContainer, container.firstChild);

    const ctx = canvas.getContext("2d");

    // Crear el gradiente de fondo
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, 'rgba(255, 99, 132, 0.4)'); // Parte superior
    gradient.addColorStop(1, 'rgba(255, 99, 132, 0.05)'); // Parte inferior

    const chartData = {
        labels: repeatOrders.map(item => item.rpu),
        datasets: [
            {
                label: "CORTES",
                data: quejas.map(item => item.count),
                borderColor: '#FF6384', 
                backgroundColor: gradient, // Agregar el gradiente aquí
                tension: 0.4,
                fill: true, // Importante para rellenar con el gradiente
                pointBackgroundColor: '#FF6384',
                pointBorderColor: '#FF6384',
                pointRadius: 4,
            }
        ]
    };

    const chart = new Chart(ctx, {
        type: 'line',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    enabled: true,
                    callbacks: {
                        label: (context) => {
                            const rpu = chartData.labels[context.dataIndex];
                            const solicitudes = repeatOrders.find(item => item.rpu === rpu).requests.map(req => req.order).join(", ");
                            return `RPU: ${rpu} | Repeticiones: ${context.raw} | Solicitudes: ${solicitudes}`;
                        }
                    }
                }
            },
            onClick: (event, elements) => {
                if (elements.length > 0) {
                    const index = elements[0].index;
                    const rpu = chartData.labels[index];
                    const solicitudes = repeatOrders.find(item => item.rpu === rpu).requests;

                    renderDetailsTable(rpu, solicitudes);
                }
            },
            scales: {
                x: { title: { display: true, text: 'RPU' }},
                y: { title: { display: true, text: 'Repeticiones' }}
            }
        }
    });
}

// Función para mostrar la tabla de solicitudes repetidas
function tabla1mostrarTablaSolicitudesRepetidas(data, title) {
    const container = document.getElementById("analisisContainer");
    const repeatOrders = tabla1encontrarSolicitudesRepetidas(data);

    if (repeatOrders.length > 0) {
        const repeatTable = tabla1renderizarTabla(repeatOrders, title, true);
        container.appendChild(repeatTable);

         // Agregar un botón para descargar los datos de la tabla
         const downloadButton = document.createElement("button");
         downloadButton.textContent = "Descargar en Excel";
         downloadButton.onclick = () => downloadExcel(repeatOrders); // Descargar solo las solicitudes repetidas
         container.appendChild(downloadButton);

    } else {
        const noDataMessage = document.createElement("p");
        noDataMessage.textContent = `No hay ${title}`;
        container.appendChild(noDataMessage);
    }
}

/**
 ** Es el chido de mostrar tabla
*/
// Función para renderizar la tabla de resultados con opción de clic en celdas
function tabla1renderizarTabla(data, title, clickable = false) {
    const tableContainer = document.createElement("div");
    tableContainer.classList.add("table-container");

    const heading = document.createElement("h3");
    heading.textContent = title;
    tableContainer.appendChild(heading);

    // Agrupar las solicitudes por RPU y contar las repeticiones
    const rpuSummary = {};
    data.forEach(item => {
        const rpu = item.rpu;
        if (!rpuSummary[rpu]) {
            rpuSummary[rpu] = { count: 0, solicitudes: [] };
        }
        rpuSummary[rpu].count++;
        rpuSummary[rpu].solicitudes.push(item.order);
    });

    const table = document.createElement("table");
    table.id = "resumenRepetidasTable"; // Asignar un ID a la tabla
    table.innerHTML = `
        <thead>
            <tr>
                <th>Número</th>
                     <th>Solicitud</th>
                    <th>Tipo</th>
                    <th>H</th>
                    <th>Ta</th>
                    <th>Cto</th>
                    <th>RPE CAP</th>
                    <th>Medidor(es)</th>
                    <th>RPU</th>
                    <th>Origen</th>
                    <th>Nombre</th>
                    <th>Direccion</th>
                    <th>CveCol</th>
                    <th>Colonia</th>
                    <th>TipoRed</th>
                    <th>Fecha Reg</th>
                    <th>Situación del envio</th>
                    <th>TP</th>
                    <th>Repeticiones</th>
                    <th>SolicitudesRepetidas</th>
        </tr></thead>
        <tbody>
            ${data.map(item => `
                <tr>
                    <td>${item.num}</td>
                    <td>${item.order}</td>
                    <td>${item.tipo}</td>
                    <td>${item.h}</td>
                    <td>${item.ta}</td>
                    <td>${item.cto}</td>
                   <td>${item.rpeCap}</td>  
                    <td>${item.meter}</td>
                    <td>${item.rpu}</td>
                    <td>${item.origen}</td>
                    <td>${item.name}</td>
                    <td>${item.address}</td>
                    <td>${item.cveCol}</td>
                    <td>${item.colony}</td>
                    <td>${item.tipoRed}</td>
                    <td>${item.date}</td>
                  <td>${item.situacionEnvio}</td>
                   <td>${item.tp}</td>
                    <td>${rpuSummary[item.rpu].count > 1 ? rpuSummary[item.rpu].count : ''}</td>
                    <td>${rpuSummary[item.rpu].count > 1 ? rpuSummary[item.rpu].solicitudes.join(", ") : ''}</td>
                </tr>
            `).join("")}
        </tbody>
    `;

    tableContainer.appendChild(table);
    return tableContainer;
}

async function processFile(content) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, "text/html");

    const rows = doc.querySelectorAll('table tr');
    const dataPoints = [];
    let tipo = '';

    rows.forEach((row) => {
        const cells = row.querySelectorAll('td');

        // Verificar que la fila tenga al menos 19 celdas para evitar errores
        if (cells.length >= 19) {
            tipo = cells[3]?.textContent.trim().toUpperCase().startsWith("S") 
                ? cells[3].textContent.trim().charAt(0) + cells[3].textContent.trim().slice(1, 3) 
                : cells[3]?.textContent.trim().charAt(0) + cells[3].textContent.trim().slice(1, 3);

            let cto = cells[6]?.textContent.trim() || ''; // Obtener CTO actual
            const rpu = cells[11]?.textContent.trim() || ''; // Obtener RPU

            // Validar y ajustar CTO según los primeros tres dígitos del RPU
            if (rpu.length >= 3) {
                const rpuPrefix = rpu.substring(0, 3);
                switch (rpuPrefix) {
                    case '089':
                        cto = 'Maravatio';
                        break;
                    case '084':
                        cto = 'Salvatierra';
                        break;
                    case '085':
                        cto = 'Acambaro';
                        break;
                    case '086':
                        cto = 'Moroleon';
                        break;
                    case '087':
                        cto = 'Tarimoro';
                        break;
                    case '088':
                        cto = 'Yuriria';
                        break;
                    case '090':
                        cto = 'Valle de Santiago';
                        break;
                    case '091':
                        cto = 'Jaral del Progreso';
                        break;
                    default:
                        cto = 'Desconocido'; // Valor por defecto si el prefijo no coincide
                        break;
                }
            } else {
                cto = 'Desconocido'; // Valor por defecto si el RPU no es válido
            }

            dataPoints.push({
                num: cells[0]?.textContent.trim() || '',          // "Num."
                order: cells[1]?.textContent.trim() || '',        // "Solicitud"
                tipo: tipo || '',                                 // "Tipo"
                h: cells[4]?.textContent.trim() || '',            // "H"
                ta: cells[5]?.textContent.trim() || '',           // "Ta"
                cto: cto,                                         // Usar el CTO ajustado
                rpeCap: cells[7]?.textContent.trim() || '',       // "RPE CAP"
                meter: cells[9]?.textContent.trim() || '',        // "Medidor(es)"
                rpu: rpu,                                         // "RPU"
                origen: cells[12]?.textContent.trim() || '',      // "Origen"
                name: cells[13]?.textContent.trim() || '',        // "Nombre"
                address: cells[14]?.textContent.trim() || '',     // "Dirección"
                cveCol: cells[15]?.textContent.trim() || '',      // "CveCol"
                colony: cells[16]?.textContent.trim() || '',      // "Colonia"
                tipoRed: cells[18]?.textContent.trim() || '',     // "TipoRed"
                date: cells[19]?.textContent.trim() || '',        // "Fecha Reg"
                situacionEnvio: cells[20]?.textContent.trim() || '', // "Situación del envío"
                tp: cells[21]?.textContent.trim() || ''           // "TP"
            });
        }
    });

    return { tipo, rows: dataPoints };
}
/* 
* Función para renderizar la tabla de detalles de las solicitudes repetidas por RPU
* Funcion para el clic de la grafica que manda a la tabla del RPU
*/

function renderDetailsTable(rpu, solicitudes) {
    // Verificar si el contenedor existe, si no, crearlo
    let container = document.getElementById("detailsContainer");
    if (!container) {
        container = document.createElement("div");
        container.id = "detailsContainer";
        document.body.appendChild(container); // Insertar al final del cuerpo
    }

    container.innerHTML = ""; // Limpiar contenido previo

    const heading = document.createElement("h3");
    heading.textContent = `NFORMACION DETALLADA DE LAS SOLICITUDES DEL MISMO RPU: ${rpu}`;
    container.appendChild(heading);

    const table = document.createElement("table");
    table.classList.add("details-table");
    table.innerHTML = `
        <thead>
            <tr>
                    <th>Número</th>
                    <th>Solicitud</th>
                    <th>Tipo</th>
                    <th>H</th>
                    <th>Ta</th>
                    <th>Cto</th>
                    <th>RPE CAP</th>
                    <th>Medidor(es)</th>
                    <th>RPU</th>
                    <th>Origen</th>
                    <th>Nombre</th>
                    <th>Direccion</th>
                    <th>CveCol</th>
                    <th>Colonia</th>
                    <th>TipoRed</th>
                    <th>Fecha Reg</th>
                    <th>Situación del envio</th>
                    <th>TP</th>
            </tr>
        </thead>
        <tbody>
            ${solicitudes.map(order => {
                // Verificar si las propiedades existen antes de mostrarlas
                return `
                <tr>
                    <td>${order.num}</td>
                    <td>${order.order}</td>
                    <td>${order.tipo}</td>
                    <td>${order.h}</td>
                    <td>${order.ta}</td>
                    <td>${order.cto}</td>
                   <td>${order.rpeCap}</td>  
                    <td>${order.meter}</td>
                    <td>${order.rpu}</td>
                    <td>${order.origen}</td>
                    <td>${order.name}</td>
                    <td>${order.address}</td>
                    <td>${order.cveCol}</td>
                    <td>${order.colony}</td>
                    <td>${order.tipoRed}</td>
                    <td>${order.date}</td>
                  <td>${order.situacionEnvio}</td>
                   <td>${order.tp}</td>
                </tr>
                `;
            }).join("")}
        </tbody>
    `;
    container.appendChild(table);

    // Desplazar automáticamente hacia la tabla de detalles
    container.scrollIntoView({ behavior: 'smooth' });
}
// Función para descargar los datos en Excel
function downloadExcel(repeatOrders) {
    // Agrupar las solicitudes repetidas por RPU
    const rpuSummary = {};
    repeatOrders.forEach((item) => {
        const rpu = item.rpu;
        if (!rpuSummary[rpu]) {
            rpuSummary[rpu] = { count: 0, solicitudes: [] };
        }
        rpuSummary[rpu].count++;
        rpuSummary[rpu].solicitudes.push(item.order);
    });

    // Formatear los datos de las filas incluyendo "Repeticiones RPU" y "Solicitudes"
    const formattedData = repeatOrders.map((item) => {
        const rpuData = rpuSummary[item.rpu];
        return {
            ...item,
            "Repeticiones RPU": rpuData.count > 1 ? rpuData.count : "",
            Solicitudes: rpuData.count > 1 ? rpuData.solicitudes.join(", ") : "",
        };
    });

    // Convertir los datos formateados a formato Excel
    const ws = XLSX.utils.json_to_sheet(formattedData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Órdenes Repetidas");

    // Descargar el archivo Excel
    XLSX.writeFile(wb, "Ordenes_Repetidas.xlsx");

    // Opcional: Usar jQuery para mostrar un mensaje de éxito
    $('body').append('<div id="success-message">Archivo descargado con éxito!</div>');
    $('#success-message').fadeOut(3000);  // El mensaje desaparece después de 3 segundos
}
// Función para identificar todos los tipos de quejas en los datos
function getComplaintTypes(data) {
    const complaintTypes = new Set();
    data.forEach(item => complaintTypes.add(item.tipo));
    return Array.from(complaintTypes);
}

function renderGroupedTableByCto(data, title) {
    const groupedData = {};
    
    // Detectar si el archivo es de "quejas" o "contratos"
    const isContractData = title.toLowerCase().includes("contratos");
    const types = isContractData ? getContractTypes(data) : getComplaintTypes(data);  // Obtener tipos únicos de contratos o quejas
    const dataKey = isContractData ? "contratos" : "quejas"; // Clave para agrupar datos

    // Agrupación de datos por Cto y tipo
    data.forEach(item => {
        const { cto, tipo } = item;
        if (!groupedData[cto]) {
            groupedData[cto] = { [dataKey]: {} };
            types.forEach(type => groupedData[cto][dataKey][type] = 0); // Inicializar cada tipo con 0
        }
        groupedData[cto][dataKey][tipo]++; // Incrementar el contador para el tipo específico
    });

    // Crear contenedor y tabla
    const tableContainer = document.createElement("div");
    tableContainer.classList.add("table-container");

    const heading = document.createElement("h3");
    heading.textContent = title;
    tableContainer.appendChild(heading);

    // Construir la cabecera de la tabla con todos los tipos de contratos o quejas dinámicamente
    table.classList.add("compact-table"); // Clase para compactar el diseño de la tabla
    table.innerHTML = `
        <thead>
            <tr>
                <th>Cto</th>
                <th>${isContractData ? "Contratos" : "Quejas"}</th>
                ${types.map(type => `<th>${type}</th>`).join("")}
            </tr>
        </thead>
        <tbody>
            ${Object.entries(groupedData).map(([cto, entry], index) => `
                <tr data-cto="${cto}" onclick="toggleColonyTable('${cto}', ${index}, '${dataKey}')">
                    <td>${cityNames[cto] || cto}</td>
                    <td>${Object.values(entry[dataKey]).reduce((a, b) => a + b, 0)}</td>
                    ${types.map(type => `<td>${entry[dataKey][type] || 0}</td>`).join("")}
                </tr>
                <tr id="colony-details-${index}" style="display: none;">
                    <td colspan="${2 + types.length}">${renderColonyTable(data, cto, types)}</td>
                </tr>
            `).join("")}
        </tbody>
    `;
    tableContainer.appendChild(table);
    return tableContainer;
}


// Función para mostrar la tabla de detalles de colonias al hacer clic
function renderColonyTable(data, cto) {
    const filteredData = data.filter(item => item.cto === cto);
    const colonyData = {};

    // Agrupación de datos por colonia
    filteredData.forEach(item => {
        const { colony, tipo, rpu, order, date, name, observaciones, registro} = item;
        if (!colonyData[colony]) {
            colonyData[colony] = { count: 0, details: [] };
        }
        colonyData[colony].count++;
        colonyData[colony].details.push({ rpu, order, date, tipo, name, observaciones, registro });
    });

    return `
        <table class="colony-details-table">
            <thead><tr>
            <th>Colonia</th>
            <th>Cantidad</th>
            <th>Tipo</th>
            <th>Solicitud</th>
            <th>Nombre</th>
            <th>RPU</th>
            <th>Registro</th>
            <th>Fecha</th>
            <th>Observaciones</th>
            </tr></thead>
            <tbody>
                ${Object.entries(colonyData).map(([colony, { count, details }]) => `
                    <tr>
                        <td>${colony}</td>
                        <td>${count}</td>
                        <td>${details.map(detail => detail.tipo).join(", ")}</td>
                        <td>${details.map(detail => detail.order).join(", ")}</td>
                        <td>${details.map(detail => detail.name).join(", ")}</td>
                        <td>${details.map(detail => detail.rpu).join(", ")}</td>
                        <td>${details.map(detail => detail.registro).join(", ")}</td>
                        <td>${details.map(detail => detail.date).join(", ")}</td>
                        <td>${details.map(detail => detail.observaciones).join(", ")}</td>
                    </tr>
                `).join("")}
            </tbody>
        </table>
    `;
}
// Mapa de abreviaturas a nombres completos de ciudades
const cityNames = {
    "SV": "Salvatierra",
    "VS": "Valle de Santiago",
    "JP": "Jaral del Progreso",
    "MT": "Maravatio de Ocampo",
    "YR": "Yuriria",
    "ML": "Moroleon",
    "ML": "Uriangato",
    "AC": "Acambaro",
    "TR": "Tarimoro"
};

// Función principal para mostrar el resumen final agrupado por Cto y Colonia
function mostrarResumenFinal(data, title) {
    const container = document.getElementById("analisisContainer");
    const resumenPorCto = encontrarResumenFinalPorCtoYTipo(data);

    if (Object.keys(resumenPorCto).length > 0) {
        const finalTable = renderizarResumenFinalPorCto(resumenPorCto, title);
        container.appendChild(finalTable);
        graficarSolicitudesPorColonia(resumenPorCto);
    } else {
        const noDataMessage = document.createElement("p");
        noDataMessage.textContent = `No hay ${title}`;
        container.appendChild(noDataMessage);
    }
}

/*
 *Función para renderizar las solicitudes repetidas por RPU dentro de una colonia
 *Funcion resumen por cto

 */
function renderSolicitudesRepetidasPorRPU(solicitudes) {
    const rpuGroups = {};

    solicitudes.forEach(item => {
        const rpu = item.rpu;
        if (!rpuGroups[rpu]) {
            rpuGroups[rpu] = [];
        }
        rpuGroups[rpu].push(item);
    });

    return `
        <table class="rpu-details-table">
            <thead>
                <tr>
                <th>Cantidad</th>
                    <th>Número</th>
                    <th>Solicitud</th>
                    <th>Tipo</th>
                    <th>H</th>
                    <th>Ta</th>
                    <th>Cto</th>
                    <th>RPE CAP</th>
                    <th>Medidor(es)</th>
                    <th>RPU</th>
                    <th>Origen</th>
                    <th>Nombre</th>
                    <th>Direccion</th>
                    <th>CveCol</th>
                    <th>Colonia</th>
                    <th>TipoRed</th>
                    <th>Fecha Reg</th>
                    <th>Situación del envio</th>
                    <th>TP</th>
                </tr>
            </thead>
            <tbody>
                ${Object.entries(rpuGroups).map(([rpu, solicitudes]) => `
                    ${solicitudes.map((s, index) => `
                    <tr>
                    ${index === 0 ? `<td rowspan="${solicitudes.length}">${solicitudes.length}</td>` : ""}
                    <td>${s.num}</td>
                    <td>${s.order}</td>
                    <td>${s.tipo}</td>
                    <td>${s.h}</td>
                    <td>${s.ta}</td>
                    <td>${s.cto}</td>
                   <td>${s.rpeCap}</td>  
                    <td>${s.meter}</td>
                    <td>${s.rpu}</td>
                    <td>${s.origen}</td>
                    <td>${s.name}</td>
                    <td>${s.address}</td>
                    <td>${s.cveCol}</td>
                    <td>${s.colony}</td>
                    <td>${s.tipoRed}</td>
                    <td>${s.date}</td>
                  <td>${s.situacionEnvio}</td>
                   <td>${s.tp}</td>
                        </tr>
                    `).join("")}
                `).join("")}
            </tbody>
        </table>
    `;
}
// Función para guardar los datos del cto y su total en localStorage con hora (sin minutos ni segundos)
function saveResumenCtoToLocalStorage(cto, total, keyName) {
    // Obtenemos los datos actuales de localStorage o inicializamos un objeto vacío
    let resumenGuardado = JSON.parse(localStorage.getItem(keyName)) || {};

    // Obtener la hora actual (sin minutos ni segundos)
    const now = new Date();
    const hourOnly = `${now.getHours()}:00`; // Ejemplo: "14:00" para las 2 PM

    // Si el cto no existe, inicializamos su estructura
    if (!resumenGuardado[cto]) {
        resumenGuardado[cto] = [];
    }

    // Verificar si ya existe un registro para esta hora
    const existingEntry = resumenGuardado[cto].find(entry => entry.hour === hourOnly);

    if (existingEntry) {
        // Actualizar el total para la hora existente
        existingEntry.total = total;
    } else {
        // Agregar una nueva entrada con el total y la hora
        resumenGuardado[cto].push({
            total,
            hour: hourOnly
        });
    }

    // Guardamos los datos actualizados en localStorage bajo la clave especificada
    localStorage.setItem(keyName, JSON.stringify(resumenGuardado));

    console.log(`Datos guardados en localStorage bajo ${keyName}:`, resumenGuardado); // Verificación en consola
}

function findRepeatOrdersRPU(data) {
    const orderCount = {};
    const repeatOrders = [];

    data.forEach(item => {
        const rpu = item.rpu;
        if (!orderCount[rpu]) {
            orderCount[rpu] = { rpu, count: 1, requests: [item] };
        } else {
            orderCount[rpu].count++;
            orderCount[rpu].requests.push(item);
        }
    });

    // Filtrar solo los que tienen más de `repeticionesFiltro` repeticiones
    Object.values(orderCount).forEach(item => {
        if (item.count > repeticionesFiltro) {
            repeatOrders.push(item);
        }
    });

    return repeatOrders;
}
function tabla1encontrarSolicitudesRepetidas(data) {
    const orderGroups = {};
    const repeatOrders = [];

    data.forEach(item => {
        const rpu = item.rpu;
        if (!orderGroups[rpu]) {
            orderGroups[rpu] = { count: 1, solicitudesRepetidas: [item] };
        } else {
            orderGroups[rpu].count++;
            orderGroups[rpu].solicitudesRepetidas.push(item);
        }
    });

    Object.values(orderGroups).forEach(group => {
        if (group.count > repeticionesFiltro) {
            repeatOrders.push(...group.solicitudesRepetidas);
        }
    });

    return repeatOrders;
}

function encontrarResumenFinalPorCtoYTipo(data) {
    const rpuCount = {};
    const resumenCto = {};
    const tiposUnicos = new Set();

    data.forEach(item => {
        const rpu = item.rpu;
        if (!rpuCount[rpu]) {
            rpuCount[rpu] = 0;
        }
        rpuCount[rpu]++;
    });

    data.forEach(item => {
        const rpu = item.rpu;
        if (rpuCount[rpu] > repeticionesFiltro) {
            const cto = item.cto;
            const tipo = item.tipo;
            const colonia = item.colony;

            tiposUnicos.add(tipo);

            if (!resumenCto[cto]) {
                resumenCto[cto] = { totalQuejas: 0, tipos: {}, colonias: {} };
            }

            if (!resumenCto[cto].tipos[tipo]) {
                resumenCto[cto].tipos[tipo] = 0;
            }

            resumenCto[cto].totalQuejas++;
            resumenCto[cto].tipos[tipo]++;

            if (!resumenCto[cto].colonias[colonia]) {
                resumenCto[cto].colonias[colonia] = [];
            }

            resumenCto[cto].colonias[colonia].push(item);
        }
    });

    resumenCto.tiposUnicos = Array.from(tiposUnicos).sort();
    return resumenCto;
}

document.getElementById("repeatDropdown").addEventListener("change", (event) => {
    repeticionesFiltro = parseInt(event.target.value, 10); // Actualizar la variable global
    actualizarVista(); // Actualizar las tablas y gráficas con el nuevo filtro
});

function actualizarVista() {
    document.getElementById("analisisContainer").innerHTML = "";
    renderAnomaliesChartByType(allDataActual, "Gráfica Actualizada");
    mostrarResumenFinal(allDataActual, "Resumen Actualizado por RPU");
    tabla1mostrarTablaSolicitudesRepetidas(allDataActual, "Ordenes Repetidas");
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

// Función para alternar la visualización de los detalles de colonias al hacer clic en un Cto
function toggleDetallesColonia(index) {
    const detallesRow = document.getElementById(`detalles-colonia-${index}`);
    const isVisible = detallesRow.style.display === "table-row";
    detallesRow.style.display = isVisible ? "none" : "table-row";

    // Añadir o quitar la clase para el resaltado
    if (!isVisible) {
        detallesRow.classList.add("expanded-table-row");
    } else {
        detallesRow.classList.remove("expanded-table-row");
    }
}

// Función para alternar la visualización de las solicitudes repetidas por RPU al hacer clic en una colonia y tipo específico
function toggleDetallesRPU(id) {
    const detallesRow = document.getElementById(`detalles-rpu-${id}`);
    const isVisible = detallesRow.style.display === "table-row";
    detallesRow.style.display = isVisible ? "none" : "table-row";

    // Añadir o quitar la clase para el resaltado
    if (!isVisible) {
        detallesRow.classList.add("expanded-table-row");
    } else {
        detallesRow.classList.remove("expanded-table-row");
    }
}

function renderizarResumenFinalPorCto(resumenCto, title) {
    const tableContainer = document.createElement("div");
    tableContainer.classList.add("table-container");

    const heading = document.createElement("h3");
    heading.textContent = title;
    tableContainer.appendChild(heading);

    const tiposUnicos = resumenCto.tiposUnicos;

    const table = document.createElement("table");
    table.id = "resumenFinalTable"; // Asignar un ID a la tabla 
    table.innerHTML = `
        <thead>
            <tr>
                <th>Cto</th>
                <th>TOTAL</th>
                ${tiposUnicos.map((tipo) => `<th>${tipo}</th>`).join("")}
            </tr>
        </thead>
        <tbody>
            ${Object.entries(resumenCto)
            .map(([cto, data], index) => {
                if (cto === "tiposUnicos") return ""; // Ignorar el campo 'tiposUnicos' en las filas
                const ctoName = cityNames[cto] || cto; // Reemplazar abreviaturas con nombres completos

                return `
                <tr data-cto="${cto}" data-index="${index}">
                    <td>${ctoName}</td>
                    <td>${data.totalQuejas}</td>
                    ${tiposUnicos
                        .map((tipo) => `<td>${data.tipos[tipo] || 0}</td>`)
                        .join("")}
                </tr>
                <tr id="detalles-colonia-${index}" class="detalles-colonia-row" style="display: none;">
                    <td colspan="${2 + tiposUnicos.length
                    }">${renderTablaColonias(data.colonias, index)}</td>
                </tr>
                `;
            })
            .join("")}
        </tbody>
    `;

    tableContainer.appendChild(table);
   // Agregar botón para guardar todos los datos
   const saveButton = document.createElement("button");
   saveButton.textContent = "Guardar todos los datos";
   saveButton.addEventListener("click", () => {
       Object.entries(resumenCto).forEach(([cto, data]) => {
           if (cto !== "tiposUnicos") {
               saveResumenCtoToLocalStorage(cto, data.totalQuejas, "CortesTerminados");
           }
       });
   });
   tableContainer.appendChild(saveButton);

   // Agregar evento click a las filas de la tabla
   const tableRows = table.querySelectorAll('tbody tr[data-cto]');
   tableRows.forEach((row) => {
       row.addEventListener('click', () => {
           const index = row.getAttribute('data-index');
           toggleDetallesColonia(index);
       });
   });

   // Agregar evento click a las filas de la tabla de colonias
   const tableRowsColonias = table.querySelectorAll('.colony-details-table tbody tr[data-colonia]');
   tableRowsColonias.forEach((row) => {
       row.addEventListener('click', () => {
           const ctoIndex = row.getAttribute('data-cto-index');
           const index = row.getAttribute('data-index');
           const tipoIndex = row.getAttribute('data-tipo-index');
           toggleDetallesRPU(`${ctoIndex}-${index}-${tipoIndex}`);
       });
   });

   return tableContainer;
}

function renderTablaColonias(colonias, ctoIndex) {
    return `
        <table class="colony-details-table">
            <thead>
                <tr>
                    <th>Colonia</th>
                    <th>Cantidad</th>
                    <th>Tipo</th>
                </tr>
            </thead>
            <tbody>
                ${Object.entries(colonias).map(([colonia, solicitudes], index) => {
                    const tipoGroups = {};
                    solicitudes.forEach(solicitud => {
                        const tipo = solicitud.tipo;
                        if (!tipoGroups[tipo]) {
                            tipoGroups[tipo] = [];
                        }
                        tipoGroups[tipo].push(solicitud);
                    });

                    return Object.entries(tipoGroups).map(([tipo, solicitudesDeTipo], tipoIndex) => `
                        <tr data-colonia="${colonia}" data-cto-index="${ctoIndex}" data-index="${index}" data-tipo-index="${tipoIndex}">
                            <td>${colonia}</td>
                            <td>${solicitudesDeTipo.length}</td>
                            <td>${tipo}</td>
                        </tr>
                        <tr id="detalles-rpu-${ctoIndex}-${index}-${tipoIndex}" class="detalles-rpu-row" style="display: none;">
                            <td colspan="19">${renderSolicitudesRepetidasPorRPU(solicitudesDeTipo)}</td>
                        </tr>
                    `).join("");
                }).join("")}
            </tbody>
        </table>
    `;
}
