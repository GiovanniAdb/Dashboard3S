/*
const XLSX = window.XLSX;
const $ = window.jQuery;
const XLSX = require('xlsx');
const $ = require('jquery');  // Requiere jQuery

*/
const XLSX = window.XLSX;
const $ = window.jQuery;

const Chart = window.Chart; // Asegúrate de tener Chart.js importado

const filtroSelect = document.getElementById('filtro-select');
let formato = null;
let processedRows;
let charts = []; // Para almacenar referencias a las gráficas creadas

function detectFormat(columns) {
    const cleanedColumns = columns.map(column => column.trim().replace(/"/g, ''));

    if (cleanedColumns.includes('Date/Time') && cleanedColumns.includes('kWh E') && cleanedColumns.includes('kVARh Q1')) {
        return "VAS";
    } else if (cleanedColumns.includes('Date') && cleanedColumns.includes('Time') && cleanedColumns.includes('WH3_DEL') && cleanedColumns.includes('QH3_REC_LD') && cleanedColumns.includes('Status')) {
        return "JYU";
    } else if (cleanedColumns.includes('Date') && cleanedColumns.includes('Time') && cleanedColumns.includes('WH3_DEL') && cleanedColumns.includes('QH3_DEL_LG')) {
        return "GPO";
    } else if (cleanedColumns.includes('Date') && cleanedColumns.includes('Time') && cleanedColumns.includes('WH3_DEL') && cleanedColumns.includes('QH3_REC_LD')) {
        return "JDP";
    }
    return null;
}
function processRows(rows, format) {
    return rows.map(row => {
        const cleanedRow = {};
        for (const key in row) {
            const cleanedKey = key.trim().replace(/"/g, '');
            cleanedRow[cleanedKey] = row[key];
        }

        if (format === "VAS" || format === "JDP") {
            return {
                'Date/Time': formatExcelDate(cleanedRow['Date/Time']),
                'kWh': cleanedRow['kWh E'] || cleanedRow['WH3_DEL'],
                'kVARh': cleanedRow['kVARh Q1'] || cleanedRow['QH3_REC_LD']
            };
        } else if (format === "GPO") {
            return {
                'Date/Time': (cleanedRow['Date'] ? `${cleanedRow['Date'].trim()} ` : '') + (cleanedRow['Time'] ? cleanedRow['Time'].trim() : ''),
                'kWh': parseFloat(cleanedRow['WH3_DEL']),
                'kVARh': parseFloat(cleanedRow['QH3_DEL_LG'])
            };
        } else {
            return {
                'Date': cleanedRow['Date'],
                'Time': cleanedRow['Time'],
                'kWh': cleanedRow['WH3_DEL'],
                'kVARh': cleanedRow['QH3_REC_LD']
            };
        }
    });
}

function formatExcelDate(excelDate) {
    if (!excelDate || isNaN(excelDate)) return excelDate;
    const date = new Date((excelDate - 25569) * 86400 * 1000);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function aggregateData(rows, group, semana) {
    const groupedData = {};

    rows.forEach(row => {
        const date = new Date(row['Date/Time'] || `${row['Date']} ${row['Time']}`);
        let key;
        switch (group) {
            case '5min':
                key = `${date.getHours()}:${Math.floor(date.getMinutes() / 5) * 5}`;
                break;
            case 'hour':
                key = `${date.getHours()}`;
                break;
            case 'day':
                key = `${date.getDate()}`;
                break;
            case 'week':
                const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                key = diasSemana[date.getDay()];
                break;
            case 'month':
                key = `${date.getMonth() + 1}`;
                break;
        }

        if (!groupedData[key]) {
            groupedData[key] = { kWh: 0, kVARh: 0, count: 0 };
        }

        if (group === 'week' && semana === 'semana1') {
            if (date.getDate() >= 1 && date.getDate() <= 7) {
                groupedData[key].kWh += parseFloat(row['kWh']) || 0;
                groupedData[key].kVARh += parseFloat(row['kVARh']) || 0;
                groupedData[key].count++;
            }
        } else if (group === 'week' && semana === 'semana2') {
            if (date.getDate() >= 8 && date.getDate() <= 14) {
                groupedData[key].kWh += parseFloat(row['kWh']) || 0;
                groupedData[key].kVARh += parseFloat(row['kVARh']) || 0;
                groupedData[key].count++;
            }
        } else if (group === 'week' && semana === 'semana3') {
            if (date.getDate() >= 15 && date.getDate() <= 21) {
                groupedData[key].kWh += parseFloat(row['kWh']) || 0;
                groupedData[key].kVARh += parseFloat(row['kVARh']) || 0;
                groupedData[key].count++;
            }
        } else {
            groupedData[key].kWh += parseFloat(row['kWh']) || 0;
            groupedData[key].kVARh += parseFloat(row['kVARh']) || 0;
            groupedData[key].count++;
        }
    });

    return Object.keys(groupedData).map(key => {
        const data = groupedData[key];
        return {
            label: key,
            kWh: data.kWh / data.count,
            kVARh: data.kVARh / data.count
        };
    });
}

document.getElementById("fileInput").addEventListener("change", function (e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function () {
            const data = new Uint8Array(reader.result);
            readExcelFile(data);
        };
        reader.readAsArrayBuffer(file);
    }
});

function readExcelFile(file) {
    try {
        const workbook = XLSX.read(file, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet);

        const columns = Object.keys(rows[0]);

        formato = detectFormat(columns);

        if (!formato) {
            console.error("Formato no reconocido");
            return;
        }

        processedRows = processRows(rows, formato);

        createGraphs(processedRows, formato);
    } catch (error) {
        console.error("Error al leer el archivo Excel:", error);
    }
}

function createGraphs(rows, format) {
    const container = document.getElementById("general-chart");
    container.innerHTML = "";

    charts.forEach(chart => chart.destroy());
    charts = [];

    const timeGroups = [
        { value: '5min', label: '5 minutos', xlabel: 'Horas' },
        { value: 'hour', label: 'horas', xlabel: 'Horas' },
        { value: 'day', label: 'días', xlabel: 'Días' },
        { value: 'week', label: 'días de la semana', xlabel: 'Días de la semana' },
        { value: 'month', label: 'mes', xlabel: 'Mes' }
    ];

    const dataKeys = [
        { value: 'kWh', label: 'Consumo' },
        { value: 'kVARh', label: 'Reactivos' }
    ];

    timeGroups.forEach(group => {
        const filteredData = aggregateData(rows, group.value);

        dataKeys.forEach(dataKey => {
            const canvas = document.createElement("canvas");
            container.appendChild(canvas);

            const chart = new Chart(canvas, {
                type: 'line',
                data: {
                    labels: filteredData.map(d => d.label),
                    datasets: [{
                        label: `${dataKey.label} (${group.label})`,
                        data: filteredData.map(d => d[dataKey.value]),
                        borderColor: dataKey.value === 'kWh' ? 'blue' : 'red',
                        fill: false
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        title: {
                            display: true,
                            text: `${dataKey.label} agrupado por ${group.label}`
                        }
                    },
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: group.xlabel
                            }
                        },
                        y: {
                            title: {
                                display: true,
                                text: dataKey.label
                            }
                        }
                    }
                }
            });
            charts.push(chart);
        });
    });
}