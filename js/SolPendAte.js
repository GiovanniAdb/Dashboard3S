// Inicializar Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getDatabase, ref, set, get, onValue } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-database.js";

// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDmu-oZyTBWsde-VH8QkXmS3p6FNj-tcTI",
    authDomain: "rutasrapidas-863dc.firebaseapp.com",
    projectId: "rutasrapidas-863dc",
    storageBucket: "rutasrapidas-863dc.appspot.com",
    messagingSenderId: "87894271558",
    appId: "1:87894271558:web:425efd35e60ecb88bf0c47",
    measurementId: "G-GY4V5RJQL7",
    databaseURL: "https://rutasrapidas-863dc-default-rtdb.firebaseio.com/"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Variable global para solicitudes pendientes
let pendingRequests = [];
let markers = []; // Para almacenar los marcadores existentes
let map; // Instancia global del mapa

document.addEventListener("DOMContentLoaded", () => {
    // Inicializa mapa
    initMap();

    // Inicializa calendario
    initializeCalendar();

    // Configurar eventos para cargar archivos y buscar solicitudes
    document.getElementById("fileInputPending").addEventListener("change", handlePendingFileUpload);
    document.getElementById("fileInputSpecific").addEventListener("change", handleSpecificFileUpload);
    document.getElementById("searchButton").addEventListener("click", searchRequest);
});

// **MANEJO DE SOLICITUDES PENDIENTES**
function handlePendingFileUpload(event) {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = function (e) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(e.target.result, "text/html");
        pendingRequests = extractPendingRequests(doc);
        displayPendingRequests(pendingRequests);
    };

    reader.readAsText(file);
}

function extractPendingRequests(doc) {
    const rows = Array.from(doc.querySelectorAll("table tbody tr"));
    return rows.map(row => {
        const cells = row.querySelectorAll("td");
        if (!cells[0] || !/^P\d+$/.test(cells[0].textContent.trim())) return null;

        return {
            id: cells[0]?.textContent.trim(),
            col: cells[1]?.textContent.trim() || "N/A",
            type: cells[2]?.textContent.trim() || "N/A",
            date: cells[3]?.textContent.trim() || "N/A",
            time: cells[4]?.textContent.trim() || "N/A",
            hoursRemaining: cells[5]?.textContent.trim() || "00:00",
            status: cells[6]?.textContent.trim() || "N/A",
        };
    }).filter(req => req);
}

function displayPendingRequests(requests) {
    const container = document.getElementById("pendingRequestsContainer");
    container.innerHTML = "<h3>Solicitudes Pendientes</h3>";

    const table = document.createElement("table");
    table.innerHTML = `
        <thead>
            <tr>
                <th>ID</th>
                <th>Colonia</th>
                <th>Tipo</th>
                <th>Fecha</th>
                <th>Hora</th>
                <th>Horas Restantes</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            ${requests.map(req => `
                <tr>
                    <td>${req.id}</td>
                    <td>${req.col}</td>
                    <td>${req.type}</td>
                    <td>${req.date}</td>
                    <td>${req.time}</td>
                    <td>${req.hoursRemaining}</td>
                    <td>${req.status}</td>
                </tr>`).join("")}
        </tbody>
    `;

    container.appendChild(table);
}

// **MANEJO DE SOLICITUDES ESPECÍFICAS**
function handleSpecificFileUpload(event) {
    const files = Array.from(event.target.files);
    files.forEach(file => {
        const reader = new FileReader();

        reader.onload = function (e) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(e.target.result, "text/html");
            const requestData = extractSpecificRequest(doc);

            if (requestData) {
                const matchingRequest = pendingRequests.find(req => req.id === requestData.solicitud);

                if (matchingRequest) {
                    requestData.time_remaining = matchingRequest.hoursRemaining;
                } else {
                    requestData.time_remaining = "N/A";
                }

                displaySpecificRequest(requestData);
                uploadRequestToFirebase(requestData);
            }
        };

        reader.readAsText(file);
    });
}

function extractSpecificRequest(doc) {
    const rows = Array.from(doc.querySelectorAll("table tbody tr"));
    const requestData = {};

    const relevantFields = [
        "Solicitud", "Situación", "Registrada como", "Origen", "Centro", "Nombre", "Dirección",
        "Entre Calles", "Referencia", "Colonia", "Población", "Municipio", "Teléfonos", "Tarifa",
        "Código Postal", "Observaciones de Registro"
    ];

    rows.forEach(row => {
        const cells = row.querySelectorAll("td");
        const key = cells[0]?.textContent.trim();
        const value = cells[1]?.textContent.trim();

        if (key && value && relevantFields.includes(key)) {
            requestData[key.toLowerCase().replace(/\s+/g, "_")] = value;
        }
    });

    return Object.keys(requestData).length > 0 ? requestData : null;
}

function displaySpecificRequest(requestData) {
    const container = document.getElementById("requestDataContainer");

    const table = document.createElement("table");
    table.classList.add("request-table");
    const tbody = document.createElement("tbody");

    Object.entries(requestData).forEach(([key, value]) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${key.replace(/_/g, " ").toUpperCase()}</td>
            <td>${value}</td>
        `;
        tbody.appendChild(row);
    });

    table.appendChild(tbody);
    container.appendChild(table);
}

function uploadRequestToFirebase(requestData) {
    const id = requestData.solicitud;
    const fechaSubida = new Date(); // Obtiene la fecha actual
    const localDate = fechaSubida.toLocaleDateString('en-CA'); // Formato YYYY-MM-DD
    const sanitizedData = { ...requestData, fecha_subida: localDate };

    set(ref(db, "solicitudes/" + id), sanitizedData)
        .then(() => showMessage("Solicitud subida correctamente.", "success"))
        .catch(error => showMessage("Error al subir la solicitud: " + error.message, "error"));
}

function showMessage(message, type) {
    const statusContainer = document.getElementById("statusContainer");
    const msg = document.createElement("div");
    msg.textContent = message;
    msg.classList.add("message", type);
    statusContainer.appendChild(msg);

    setTimeout(() => {
        msg.remove();
    }, 5000);
}

// **MAPA**
function initMap() {
    // Coordenadas de Salvatierra 38900
    const salvatierraLocation = { lat: 20.210972, lng: -100.880861 }; // Coordenadas convertidas

    map = new google.maps.Map(document.getElementById("map"), {
        center: salvatierraLocation, // Centrar en Salvatierra
        zoom: 13, // Ajusta el nivel de zoom para una vista más alejada
        mapTypeId: "roadmap", // Tipo de mapa
    });
    // Agregar las ubicaciones en tiempo real
    loadRealTimeLocations();
}

function loadRealTimeLocations() {
    const ubicacionesRef = ref(db, "ubicaciones/");
    onValue(ubicacionesRef, (snapshot) => {
        // Eliminar marcadores existentes antes de añadir nuevos
        markers.forEach((marker) => marker.setMap(null));
        markers = [];

        snapshot.forEach((childSnapshot) => {
            const ubicacion = childSnapshot.val();
            const { lat, lng, timestamp } = ubicacion;

            // Crear y agregar un marcador para cada ubicación
            const marker = new google.maps.Marker({
                position: { lat, lng },
                map,
                title: `Actualizado: ${new Date(timestamp).toLocaleString()}`,
                icon: {
                    url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png", // Ícono rojo para las ubicaciones
                    scaledSize: new google.maps.Size(40, 40), // Tamaño ajustable
                },
            });

            markers.push(marker);
        });
    });
}

// **CALENDARIO**
function initializeCalendar() {
    const calendarEl = document.getElementById("calendarContainer");
    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: "dayGridMonth",
        events: [],
    });

    const solicitudesRef = ref(db, "solicitudes/");
    onValue(solicitudesRef, snapshot => {
        const events = [];
        snapshot.forEach(childSnapshot => {
            const solicitud = childSnapshot.val();
            if (solicitud.fecha_subida) {
                events.push({
                    title: `Solicitud: ${solicitud.solicitud}`,
                    start: solicitud.fecha_subida,
                });
            }
        });
        calendar.removeAllEvents();
        calendar.addEventSource(events);
    });

    calendar.render();
}

// **BÚSQUEDA DE SOLICITUD**
function searchRequest() {
    const input = document.getElementById("searchInput").value.trim();
    const resultsContainer = document.getElementById("searchResults");

    if (!input) {
        resultsContainer.innerHTML = "<p>Por favor, ingresa un ID válido.</p>";
        return;
    }

    const solicitudRef = ref(db, "solicitudes/" + input);
    onValue(solicitudRef, snapshot => {
        if (snapshot.exists()) {
            const solicitud = snapshot.val();
            resultsContainer.innerHTML = `
                <div class="message-card" data-solicitud='${JSON.stringify(solicitud)}'>
                    <div class="message-header">
                        <strong>${solicitud.solicitud}</strong> <!-- ID como nombre -->
                    </div>
                    <div class="message-body">
                        <p>${solicitud.colonia}</p> <!-- Mensaje como tipo -->
                    </div>
                    <div class="message-footer">
                        <span>${solicitud.dirección}</span> <!-- Dirección -->
                        <span>${solicitud.fecha_subida}</span> <!-- Fecha -->
                    </div>
                </div>
            `;

            // Agregar evento de clic al message-card
            const messageCard = resultsContainer.querySelector(".message-card");
            messageCard.addEventListener("click", () => {
                showModal(solicitud);
            });
        } else {
            resultsContainer.innerHTML = "<p>No se encontró ninguna solicitud con ese ID.</p>";
        }
    });
}
document.getElementById("searchInput").addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
        searchRequest();
    }
});

function showModal(requestData) {
    const modal = document.getElementById("requestModal");
    const modalContent = document.getElementById("modalRequestDetails");

    // Limpiar contenido anterior
    modalContent.innerHTML = "";

    // Agregar información de la solicitud al modal
    Object.entries(requestData).forEach(([key, value]) => {
        modalContent.innerHTML += `<p><strong>${key.replace(/_/g, " ").toUpperCase()}:</strong> ${value}</p>`;
    });

    // Mostrar el modal
    modal.style.display = "block";
    document.body.classList.add("modal-open"); // Agregar clase para desenfoque
}

// Cerrar el modal al hacer clic en la "X"
document.getElementById("closeModal").addEventListener("click", () => {
    document.getElementById("requestModal").style.display = "none";
    document.body.classList.remove("modal-open"); // Remover clase para desenfoque
});

// Cerrar el modal al hacer clic fuera del contenido del modal
window.addEventListener("click", (event) => {
    const modal = document.getElementById("requestModal");
    if (event.target === modal) {
        modal.style.display = "none";
        document.body.classList.remove("modal-open"); // Remover clase para desenfoque
    }
});

// Cerrar el modal al hacer clic en la "X"
document.getElementById("closeModal").addEventListener("click", () => {
    document.getElementById("requestModal").style.display = "none";
});

// Cerrar el modal al hacer clic fuera del contenido del modal
window.addEventListener("click", (event) => {
    const modal = document.getElementById("requestModal");
    if (event.target === modal) {
        modal.style.display = "none";
    }
});


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