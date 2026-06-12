// PLINTH APPLICATION LOGIC

// 1. SEED SPECIMENS DATABASE
const initialSpecimens = [
  {
    id: 'CONC-C09',
    name: 'Concrete Column Cast',
    category: 'brutalism',
    material: 'Portland Aggregates',
    dimensions: '80 x 30 x 30 cm',
    stress: '450 kN/m²',
    porosity: '8.2%',
    description: 'Cast in plywood shuttering. Features structural grid impressions and aggregate exposure along the chamfered relief edges.',
    cubesCount: 3
  },
  {
    id: 'GLAS-P12',
    name: 'Fluted Borosilicate Pane',
    category: 'glass',
    material: 'Borosilicate Silicate',
    dimensions: '120 x 45 x 2 cm',
    stress: '120 kN/m²',
    porosity: '0.0%',
    description: 'High-durability fluted structural glass panel. Diffuses light at 64-degree angles while maintaining high shear load capacity.',
    cubesCount: 2
  },
  {
    id: 'ALUM-T77',
    name: 'T-Section Extruded Beam',
    category: 'metals',
    material: 'Aluminum 6061-T6',
    dimensions: '200 x 15 x 15 cm',
    stress: '680 kN/m²',
    porosity: '0.0%',
    description: 'Anodized structural framing component. High tensile strength to weight ratio with countersunk mounting joints.',
    cubesCount: 4
  },
  {
    id: 'CLAY-M02',
    name: 'Clay Masonry Module',
    category: 'terracotta',
    material: 'Terracotta Silt',
    dimensions: '40 x 20 x 20 cm',
    stress: '280 kN/m²',
    porosity: '18.5%',
    description: 'Kiln-fired porous clay brick. Textured exterior faces for mortar keying and thermal heat storage capacity.',
    cubesCount: 1
  }
];

let specimens = [...initialSpecimens];
let activeSpecimenId = 'CONC-C09';
let activeCategory = 'all';

// Plinth state: grid coordinates occupancy mapping (X, Y are 0, 1, 2)
let cubesOnPlinth = [];

// 2. DOM SELECTORS
const blocksStage = document.getElementById('blocks-stage');
const specimensList = document.querySelector('.specimens-list');
const specTitle = document.getElementById('spec-title');
const specId = document.getElementById('spec-id');
const specMaterial = document.getElementById('spec-material');
const specDimensions = document.getElementById('spec-dimensions');
const specStress = document.getElementById('spec-stress');
const specPorosity = document.getElementById('spec-porosity');
const specDescription = document.getElementById('spec-description');
const viewportWrapper = document.querySelector('.viewport-wrapper');
const exhibitTabs = document.querySelectorAll('.exhibit-tab');
const addBlockBtn = document.getElementById('add-block-btn');
const clearPlinthBtn = document.getElementById('clear-plinth-btn');
const curationForm = document.getElementById('curation-form');

// 3. 3D RENDER ENGINE (HTML + 3D CSS Face Construction)
function create3DCubeElement(category, x, y, z) {
  const cube = document.createElement('div');
  cube.className = `cube-3d cube-${category}`;
  
  // Position in 3D coordinate system. Cubes are 60px wide.
  // Origin (0,0) is bottom-left on the platform.
  const posX = x * 60;
  const posY = y * 60;
  const posZ = z * 60;
  
  cube.style.transform = `translate3d(${posX}px, ${-posY}px, ${posZ}px)`;
  cube.setAttribute('data-category', category);
  
  // Create the 6 faces
  const faces = ['front', 'back', 'left', 'right', 'top', 'bottom'];
  faces.forEach(faceName => {
    const face = document.createElement('div');
    face.className = `cube-face ${faceName}`;
    cube.appendChild(face);
  });
  
  return cube;
}

function renderPlinthCubes() {
  blocksStage.innerHTML = '';
  
  cubesOnPlinth.forEach(c => {
    const el = create3DCubeElement(c.category, c.x, c.y, c.z);
    
    // Apply dim/opacity if another category is selected
    if (activeCategory !== 'all' && c.category !== activeCategory) {
      el.style.opacity = '0.15';
    } else {
      el.style.opacity = '1';
    }
    
    blocksStage.appendChild(el);
  });
  
  // Update ALT indicator height log
  const maxZ = cubesOnPlinth.reduce((max, c) => c.z > max ? c.z : max, -1);
  const zText = maxZ >= 0 ? `${(maxZ + 1) * 60}mm` : '0.0mm';
  document.querySelector('.coordinate-label.bottom-right').textContent = `ALT_Z_INDICATOR: ${zText}`;
}

// 4. LOAD INITIAL CUBES BASED ON ACTIVE CATEGORY
function loadSeededCubes() {
  cubesOnPlinth = [];
  let index = 0;
  
  specimens.forEach(spec => {
    // Determine a column coordinate based on item index
    const gridX = index % 3;
    const gridY = Math.floor(index / 3) % 3;
    
    // Stack blocks vertically based on cubesCount
    for (let h = 0; h < spec.cubesCount; h++) {
      cubesOnPlinth.push({
        x: gridX,
        y: gridY,
        z: h,
        category: spec.category
      });
    }
    index++;
  });
  
  renderPlinthCubes();
}

// 5. UPDATE SPEC VIEWPORT DETAIL
function updateSpecManifest(specIdVal) {
  const item = specimens.find(s => s.id === specIdVal);
  if (!item) return;
  
  // Trigger transition class
  const dataEl = document.getElementById('spec-data');
  dataEl.classList.remove('animate-fade');
  void dataEl.offsetWidth; // Trigger reflow
  dataEl.classList.add('animate-fade');
  
  specTitle.textContent = item.name;
  specId.textContent = `#${item.id}`;
  specMaterial.textContent = item.material;
  specDimensions.textContent = item.dimensions;
  specStress.textContent = item.stress;
  specPorosity.textContent = item.porosity;
  specDescription.textContent = item.description;
}

// 6. RENDER SPECIMENS CARDS (HORIZONTAL ROW)
function renderSpecimenCards() {
  specimensList.innerHTML = '';
  
  // Filter items matching active category
  const list = activeCategory === 'all'
    ? specimens
    : specimens.filter(s => s.category === activeCategory);
    
  list.forEach(item => {
    const card = document.createElement('div');
    card.className = `specimen-card divide-y divide-grout ${item.id === activeSpecimenId ? 'active' : ''}`;
    card.setAttribute('data-id', item.id);
    
    card.innerHTML = `
      <div class="space-y-4">
        <span class="font-mono text-[9px] text-silver uppercase block">${item.id}</span>
        <h4 class="font-display text-xs uppercase tracking-wider font-bold truncate max-w-[160px]">${item.name}</h4>
        <p class="font-mono text-[10px] text-silver uppercase mt-8">${item.material}</p>
      </div>
    `;
    
    card.addEventListener('click', () => {
      activeSpecimenId = item.id;
      updateSpecManifest(item.id);
      
      // Update active states of cards
      document.querySelectorAll('.specimen-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
    });
    
    specimensList.appendChild(card);
  });
}

// 7. INTERACTIVE 3D PERSPECTIVE TILT ON CURSOR TRACKING
viewportWrapper.addEventListener('mousemove', (e) => {
  const rect = viewportWrapper.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;
  
  // Map horizontal pixel to Y-rotation (between 15deg and 75deg)
  const rotY = 15 + (mouseX / rect.width) * 60;
  
  // Map vertical pixel to X-rotation (between -45deg and -15deg)
  const rotX = -45 + (mouseY / rect.height) * 30;
  
  document.documentElement.style.setProperty('--rotate-y', `${rotY}deg`);
  document.documentElement.style.setProperty('--rotate-x', `${rotX}deg`);
});

// Reset perspective on cursor leave
viewportWrapper.addEventListener('mouseleave', () => {
  document.documentElement.style.setProperty('--rotate-y', '45deg');
  document.documentElement.style.setProperty('--rotate-x', '-30deg');
});

// 8. INSERT BLOCK ACTION
addBlockBtn.addEventListener('click', () => {
  // Find a random coordinates on the 3x3 platform to insert the block
  const rx = Math.floor(Math.random() * 3);
  const ry = Math.floor(Math.random() * 3);
  
  // Calculate stack height (Z-axis) at this coordinate
  const stackedHeight = cubesOnPlinth.filter(c => c.x === rx && c.y === ry).length;
  
  if (stackedHeight >= 4) {
    toastWarning('Coordinate stack limit reached (Max Height: 4).');
    return;
  }
  
  // Pick active category or random material
  const categoriesList = ['brutalism', 'glass', 'metals', 'terracotta'];
  const cat = activeCategory === 'all' 
    ? categoriesList[Math.floor(Math.random() * categoriesList.length)]
    : activeCategory;
    
  cubesOnPlinth.push({
    x: rx,
    y: ry,
    z: stackedHeight,
    category: cat
  });
  
  renderPlinthCubes();
});

// Clear plinth viewport
clearPlinthBtn.addEventListener('click', () => {
  cubesOnPlinth = [];
  renderPlinthCubes();
});

// Helper for UI notifications
function toastWarning(msg) {
  // Simply alert utilizing console log or standard print logic.
  // Since we replace standard alert(), we print a neat micro message
  console.log(`[PLINTH WARNING]: ${msg}`);
}

// 9. HANDLE FILTER TABS
exhibitTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    exhibitTabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    
    activeCategory = tab.getAttribute('data-category');
    
    // Refresh specimens horizontal display list
    renderSpecimenCards();
    
    // Dim unrelated cubes in plinth viewport
    renderPlinthCubes();
  });
});

// 10. CURATE FORM SUBMISSION
curationForm.addEventListener('submit', (e) => {
  e.preventDefault();
  
  const name = document.getElementById('form-name').value;
  const category = document.getElementById('form-category').value;
  const height = parseInt(document.getElementById('form-height').value);
  const desc = document.getElementById('form-desc').value;
  
  // Generate random IDs and mineral specifications
  const randomId = `${category.slice(0, 4).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
  const materialsMap = {
    brutalism: 'Granular Concrete Aggregate',
    glass: 'Flashed Silicate Pane',
    metals: 'Structural Cobalt Frame',
    terracotta: 'Glazed Stoneware Clay'
  };
  
  const newSpec = {
    id: randomId,
    name: name,
    category: category,
    material: materialsMap[category] || 'Mixed aggregates',
    dimensions: `${height * 30} x 30 x 30 cm`,
    stress: `${200 + Math.floor(Math.random() * 500)} kN/m²`,
    porosity: `${(Math.random() * 20).toFixed(1)}%`,
    description: desc,
    cubesCount: height
  };
  
  // Add to in-memory specimens array
  specimens.unshift(newSpec);
  activeSpecimenId = randomId;
  
  // Reset form
  curationForm.reset();
  
  // Add cubes representing this spec directly to the plinth
  // Clear plinth first and load current list
  loadSeededCubes();
  
  // Refresh layout
  renderSpecimenCards();
  updateSpecManifest(randomId);
});

// Initialize on page load
loadSeededCubes();
renderSpecimenCards();
updateSpecManifest(activeSpecimenId);
