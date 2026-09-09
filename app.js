const map = L.map('map').setView([49.1640319, 19.9], 11);

L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
  maxZoom: 17,
  attribution: 'Map style: &copy; OpenTopoMap'
}).addTo(map);

const routeListContainer = document.getElementById('route-list');
const checkboxContainer = document.getElementById('grade-checkboxes');
const markers = {};
let routeGameObjects = []; 

// Modal Elements (Keep these from the previous step)
const modal = document.getElementById('route-modal');
const closeBtn = document.querySelector('.close-btn');
const modalTitle = document.getElementById('modal-title');
const modalMeta = document.getElementById('modal-meta');
const modalTopo = document.getElementById('modal-topo');
const modalDesc = document.getElementById('modal-desc');



function getMarkerColorClass(gradeString) {
  const grade = gradeString.toUpperCase();
  
  // If it contains IV, V, or B/C, it's a medium route
  if (grade.includes('IV') || grade.includes('V') || grade.includes('B/C')) {
    return 'grade-medium';
  }
  // If it contains VI or above, it's hard
  else if (grade.includes('VI') || grade.includes('VII') || grade.includes('C/D')) {
    return 'grade-hard';
  }
  // Everything else (I, II, III, A) defaults to easy
  else {
    return 'grade-easy';
  }
}

fetch('routes.json')
  .then(response => response.json())
  .then(routes => {
    // 1. Generate unique grades, sort them, and build checkboxes
    const uniqueGrades = [...new Set(routes.map(r => r.grade))].sort();
    
    uniqueGrades.forEach(grade => {
      const label = document.createElement('label');
      label.className = 'checkbox-label';
      label.innerHTML = `<input type="checkbox" value="${grade}" class="grade-filter-cb"> ${grade}`;
      checkboxContainer.appendChild(label);
    });

    // 2. Add an event listener to EVERY checkbox we just created
    const allCheckboxes = document.querySelectorAll('.grade-filter-cb');
    allCheckboxes.forEach(cb => {
      cb.addEventListener('change', applyFilters);
    });

    // 3. Instantiate routes and markers
    routes.forEach(route => {
      
      // 1. Get the color class based on this specific route's grade
const colorClass = getMarkerColorClass(route.grade);

// 2. Create an HTML-based icon
const dynamicIcon = L.divIcon({
  className: `map-dot ${colorClass}`, // Combines the base shape and the color
  iconSize: [14, 14],                 // Matches the CSS width/height
  iconAnchor: [7, 7],                 // Centers the dot directly over the coordinate
  popupAnchor: [0, -10]               // Pushes the popup slightly above the dot
});

// 3. Add the marker to the map using the dynamic icon
const marker = L.marker([route.lat, route.lng], { icon: dynamicIcon }).addTo(map);

      const card = document.createElement('div');
      card.className = 'route-card';
      card.innerHTML = `
        <h3>${route.name}</h3>
        <div class="route-meta">
          
          <span class="meta-item">
            <img src="Icons/elevation.svg" class="custom-icon" alt="Elevation">
            ${route.elevation}
          </span>
          
          <span class="meta-item">
            <img src="Icons/UIAA.svg" class="custom-icon" alt="Grade">
            ${route.grade}
          </span>
        </div>
        <p>${route.description}</p>
      `;

      card.addEventListener('click', () => {
        map.flyTo([route.lat, route.lng], 12, { duration: 1.5 });
        modalTitle.textContent = route.name;
        modalMeta.textContent = `Elevation: ${route.elevation} | Grade: ${route.grade}`;
        modalTopo.src = route.topoImage;
        modalDesc.textContent = route.fullDescription;
        modal.style.display = 'flex';
      });

      routeListContainer.appendChild(card);

      // Store references for the filter system
      routeGameObjects.push({
        grade: route.grade,
        cardElement: card,
        mapMarker: marker
      });
    });
  });

// 4. The Multi-Select Filter Logic
function applyFilters() {
  // Grab all checkboxes that currently have `isOn == true`
  const activeCheckboxes = Array.from(document.querySelectorAll('.grade-filter-cb:checked'));
  
  // Extract just the string values (e.g., ["III+", "V"])
  const selectedGrades = activeCheckboxes.map(cb => cb.value);
  
  routeGameObjects.forEach(obj => {
    // Show the route IF the list of selected grades contains this route's grade, 
    // OR if no checkboxes are ticked at all (show everything)
    const shouldShow = (selectedGrades.length === 0 || selectedGrades.includes(obj.grade));

    if (shouldShow) {
      obj.cardElement.style.display = 'block'; 
      if (!map.hasLayer(obj.mapMarker)) map.addLayer(obj.mapMarker); 
    } else {
      obj.cardElement.style.display = 'none'; 
      if (map.hasLayer(obj.mapMarker)) map.removeLayer(obj.mapMarker); 
    }
  });
}

// Modal closing logic
closeBtn.addEventListener('click', () => modal.style.display = 'none');
window.addEventListener('click', (e) => {
  if (e.target === modal) modal.style.display = 'none';
});

// Close Modal logic
closeBtn.addEventListener('click', () => {
  modal.style.display = 'none'; // SetActive = false
});

// Close Modal if user clicks on the dark background outside the window
window.addEventListener('click', (event) => {
  if (event.target === modal) {
    modal.style.display = 'none';
  }
});

// --- COLLAPSIBLE FILTER LOGIC ---
const filterBtn = document.getElementById('filter-toggle-btn');
const filterPanel = document.getElementById('filter-panel');
const filterChevron = document.getElementById('filter-chevron');

filterBtn.addEventListener('click', () => {
  // Toggle the 'active' class on the panel (like SetActive(!active))
  filterPanel.classList.toggle('active');
  
  // Flip the arrow icon based on whether the panel is open or closed
  if (filterPanel.classList.contains('active')) {
    filterChevron.textContent = '▲';
    filterBtn.style.borderRadius = '4px 4px 0 0'; // Flatten bottom corners when open
  } else {
    filterChevron.textContent = '▼';
    filterBtn.style.borderRadius = '4px'; // Round all corners when closed
  }
});

// --- Donate BUTTON LOGIC ---

const donateBtn = document.getElementById('donate-btn');
donateBtn.addEventListener('click', () => {
  window.open('https://www.buymeacoffee.com/david', '_blank');
});


