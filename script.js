// Store references to DOM elements
const canvas = document.getElementById('canvas');
const elementProperties = document.getElementById('element-properties');
const noSelection = document.getElementById('no-selection');
const propertiesPanel = document.querySelector('.properties-panel');
let selectedElement = null;
let isMobile = window.innerWidth <= 992;

// Handle window resize
window.addEventListener('resize', () => {
    isMobile = window.innerWidth <= 992;
    if (selectedElement) {
        updatePropertiesPanelVisibility(true);
    }
});

// Initialize draggable elements
document.querySelectorAll('.element').forEach(element => {
    element.addEventListener('dragstart', handleDragStart);
    element.addEventListener('touchstart', handleTouchStart);
    element.addEventListener('touchmove', handleTouchMove);
    element.addEventListener('touchend', handleTouchEnd);
});

// Canvas event listeners
canvas.addEventListener('dragover', handleDragOver);
canvas.addEventListener('drop', handleDrop);
canvas.addEventListener('click', handleCanvasClick);
canvas.addEventListener('touchend', handleCanvasTouch);

// Touch handling for draggable elements
let touchDragging = false;
let touchElement = null;
let startX, startY;

function handleTouchStart(e) {
    touchDragging = true;
    touchElement = e.target.cloneNode(true);
    const touch = e.touches[0];
    startX = touch.clientX;
    startY = touch.clientY;
    
    // Style the clone element
    touchElement.style.position = 'fixed';
    touchElement.style.opacity = '0.8';
    touchElement.style.zIndex = '1000';
    document.body.appendChild(touchElement);
}

function handleTouchMove(e) {
    if (!touchDragging) return;
    e.preventDefault();
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - startX;
    const deltaY = touch.clientY - startY;
    
    touchElement.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
}

function handleTouchEnd(e) {
    if (!touchDragging) return;
    touchDragging = false;
    
    const touch = e.changedTouches[0];
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    
    if (target === canvas || target.closest('.canvas')) {
        const rect = canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        createElementAtPosition(touchElement.dataset.type, x, y);
    }
    
    document.body.removeChild(touchElement);
    touchElement = null;
}

// Update properties panel visibility for mobile
function updatePropertiesPanelVisibility(show) {
    if (isMobile) {
        propertiesPanel.classList.toggle('active', show);
        if (show) {
            propertiesPanel.style.display = 'block';
            setTimeout(() => {
                propertiesPanel.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }
    }
}

// Handle element dragging from toolbar
function handleDragStart(e) {
    e.dataTransfer.setData('text/plain', e.target.dataset.type);
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

// Create and add new elements to canvas
function handleDrop(e) {
    e.preventDefault();
    const type = e.dataTransfer.getData('text/plain');
    const element = createCanvasElement(type);
    
    // Set position where element was dropped
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - (element.offsetWidth / 2);
    const y = e.clientY - rect.top - (element.offsetHeight / 2);
    
    element.style.left = `${x}px`;
    element.style.top = `${y}px`;
    
    canvas.appendChild(element);
    selectElement(element);
}

// Create new canvas elements
function createCanvasElement(type) {
    const element = document.createElement('div');
    element.className = 'canvas-element';
    element.dataset.type = type;
    element.draggable = true;
    
    switch(type) {
        case 'text':
            element.textContent = 'Text Block';
            element.style.color = '#f1f5f9';
            element.style.backgroundColor = '#1e293b';
            element.style.padding = '12px';
            element.style.borderRadius = '6px';
            element.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3)';
            break;
        case 'button':
            element.innerHTML = `
                <button style="
                    padding: 12px 24px;
                    background: linear-gradient(to right, #6366f1, #4f46e5);
                    color: white;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 500;
                    font-size: 14px;
                    transition: all 0.3s ease;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
                ">Click Me</button>
            `;
            break;
        case 'image':
            const randomId = Math.floor(Math.random() * 1000);
            element.innerHTML = `
                <img 
                    src="https://picsum.photos/400/300?random=${randomId}" 
                    alt="Sample Image" 
                    style="
                        max-width: 100%;
                        height: auto;
                        border-radius: 8px;
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
                    "
                >
            `;
            break;
    }
    
    // Add event listeners for dragging and selection
    element.addEventListener('dragstart', handleElementDragStart);
    element.addEventListener('dragend', handleElementDragEnd);
    element.addEventListener('click', (e) => {
        e.stopPropagation();
        selectElement(element);
    });
    
    return element;
}

// Handle dragging elements within canvas
function handleElementDragStart(e) {
    e.dataTransfer.setData('text/plain', 'move');
    selectElement(e.target);
}

function handleElementDragEnd(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - (e.target.offsetWidth / 2);
    const y = e.clientY - rect.top - (e.target.offsetHeight / 2);
    
    e.target.style.left = `${x}px`;
    e.target.style.top = `${y}px`;
}

// Handle element selection and property updates
function selectElement(element) {
    if (selectedElement) {
        selectedElement.classList.remove('selected');
    }
    
    selectedElement = element;
    element.classList.add('selected');
    
    updatePropertiesPanelVisibility(true);
    noSelection.style.display = 'none';
    elementProperties.style.display = 'block';
    
    // Update form fields
    updateFormFields(element);
}

// Update form fields
function updateFormFields(element) {
    const type = element.dataset.type;
    document.querySelector('.image-url-group').style.display = type === 'image' ? 'block' : 'none';
    
    document.getElementById('content').value = type === 'image' ? 
        element.querySelector('img').src : 
        element.textContent;
    document.getElementById('font-size').value = parseInt(getComputedStyle(element).fontSize) || 16;
    document.getElementById('color').value = rgbToHex(getComputedStyle(element).color);
    document.getElementById('background').value = rgbToHex(getComputedStyle(element).backgroundColor);
    document.getElementById('padding').value = parseInt(getComputedStyle(element).padding) || 0;
}

// Create element at specific position
function createElementAtPosition(type, x, y) {
    const element = createCanvasElement(type);
    element.style.left = `${x - element.offsetWidth / 2}px`;
    element.style.top = `${y - element.offsetHeight / 2}px`;
    canvas.appendChild(element);
    selectElement(element);
}

// Handle canvas click (deselect elements)
function handleCanvasClick(e) {
    if (e.target === canvas || e.target.classList.contains('template-outline')) {
        if (selectedElement) {
            selectedElement.classList.remove('selected');
            selectedElement = null;
            noSelection.style.display = 'block';
            elementProperties.style.display = 'none';
        }
    }
}

// Update element properties
elementProperties.addEventListener('input', (e) => {
    if (!selectedElement) return;
    
    const type = selectedElement.dataset.type;
    switch(e.target.name) {
        case 'content':
            if (type === 'image') {
                selectedElement.querySelector('img').src = e.target.value;
            } else {
                selectedElement.textContent = e.target.value;
            }
            break;
        case 'fontSize':
            selectedElement.style.fontSize = `${e.target.value}px`;
            break;
        case 'color':
            selectedElement.style.color = e.target.value;
            break;
        case 'background':
            selectedElement.style.backgroundColor = e.target.value;
            break;
        case 'padding':
            selectedElement.style.padding = `${e.target.value}px`;
            break;
    }
});

// Helper function to convert RGB to Hex
function rgbToHex(rgb) {
    if (!rgb || rgb === 'transparent' || rgb === 'none') return '#000000';
    const rgbArray = rgb.match(/\d+/g);
    if (!rgbArray) return '#000000';
    return '#' + rgbArray.map(x => {
        const hex = parseInt(x).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
}

// Add event listeners for color presets
document.querySelectorAll('.color-preset').forEach(preset => {
    preset.addEventListener('click', (e) => {
        if (!selectedElement) return;
        const color = e.target.dataset.color;
        selectedElement.style.color = color;
        document.getElementById('color').value = color;
    });
});

// Add event listeners for background presets
document.querySelectorAll('.bg-preset').forEach(preset => {
    preset.addEventListener('click', (e) => {
        if (!selectedElement) return;
        const color = e.target.dataset.color;
        selectedElement.style.backgroundColor = color;
        document.getElementById('background').value = color;
    });
});

// Add event listeners for image presets
document.querySelectorAll('.image-preset').forEach(preset => {
    preset.addEventListener('click', (e) => {
        if (!selectedElement || selectedElement.dataset.type !== 'image') return;
        const imageUrl = e.target.src;
        selectedElement.querySelector('img').src = imageUrl;
        document.getElementById('image-url').value = imageUrl;
    });
}); 