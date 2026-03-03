// --- STATE MANAGEMENT ---
const menuScreen = document.getElementById('menu-screen');
const tracingScreen = document.getElementById('tracing-screen');
const sortingScreen = document.getElementById('sorting-screen');
const canvas = document.getElementById('drawingCanvas');
const ctx = canvas.getContext('2d');

let completedSections = JSON.parse(localStorage.getItem('completed')) || {};

// --- TRACING ENGINE DATA ---
// Coordinates for drawing direction (0,0 is the center of the canvas)
const traceData = {
    '1': [ [ {x: 0, y: -100}, {x: 0, y: 100} ] ],
    'A': [
        [ {x: 0, y: -100}, {x: -60, y: 100} ], // Stroke 1: Top to bottom left
        [ {x: 0, y: -100}, {x: 60, y: 100} ],  // Stroke 2: Top to bottom right
        [ {x: -30, y: 20}, {x: 30, y: 20} ]    // Stroke 3: Left to right crossbar
    ],
    'B': [
        [ {x: -40, y: -100}, {x: -40, y: 100} ], // Stroke 1: Straight down
        [ {x: -40, y: -100}, {x: 20, y: -100}, {x: 40, y: -50}, {x: 20, y: 0}, {x: -40, y: 0} ], // Top curve
        [ {x: -40, y: 0}, {x: 30, y: 0}, {x: 50, y: 50}, {x: 30, y: 100}, {x: -40, y: 100} ]  // Bottom curve
    ],
    'C': [
        // One continuous curve starting from the top right
        [ {x: 40, y: -80}, {x: 0, y: -100}, {x: -40, y: -50}, {x: -40, y: 50}, {x: 0, y: 100}, {x: 40, y: 80} ]
    ],
    'D': [
        [ {x: -40, y: -100}, {x: -40, y: 100} ], // Stroke 1: Straight line down
        [ {x: -40, y: -100}, {x: 20, y: -100}, {x: 50, y: -50}, {x: 50, y: 50}, {x: 20, y: 100}, {x: -40, y: 100} ] // Stroke 2: Large right curve
    ],
    'E': [
        [ {x: -40, y: -100}, {x: -40, y: 100} ], // Stroke 1: Straight line down
        [ {x: -40, y: -100}, {x: 30, y: -100} ], // Stroke 2: Top bar
        [ {x: -40, y: 0}, {x: 20, y: 0} ],       // Stroke 3: Middle bar (slightly shorter)
        [ {x: -40, y: 100}, {x: 30, y: 100} ]    // Stroke 4: Bottom bar
    ],
    'F': [
        [ {x: -40, y: -100}, {x: -40, y: 100} ], // Stroke 1: Straight line down
        [ {x: -40, y: -100}, {x: 30, y: -100} ], // Stroke 2: Top bar
        [ {x: -40, y: 0}, {x: 20, y: 0} ]        // Stroke 3: Middle bar
    ],
    'G': [
        // Stroke 1: The 'C' curve that continues up to the middle
        [ {x: 40, y: -80}, {x: 0, y: -100}, {x: -40, y: -50}, {x: -40, y: 50}, {x: 0, y: 100}, {x: 40, y: 50}, {x: 40, y: 0} ],
        // Stroke 2: The inner crossbar
        [ {x: 40, y: 0}, {x: 10, y: 0} ]
    ]
};

const menuItems = [
    { type: 'trace', title: 'Numbers (1)', items: ['1'] },
    { type: 'trace', title: 'Letters A - E', items: ['A', 'B', 'C', 'D', 'E'] },
    { type: 'trace', title: 'Letters F - G', items: ['F', 'G'] },
    { type: 'sort', title: 'Puzzle: Animals vs Fruits' }
];

let currentGroup = null;
let currentItemIndex = 0;
let currentStrokeIndex = 0;
let currentWaypointIndex = 0;
let drawnPaths = []; // Stores completed strokes

// --- MENU LOGIC ---
function buildMenu() {
    const grid = document.getElementById('menu-grid');
    grid.innerHTML = '';
    menuItems.forEach((item, index) => {
        let btn = document.createElement('button');
        btn.className = 'menu-btn';
        let isDone = completedSections[item.title] ? '<span class="finished-badge">✔ Done</span>' : '';
        btn.innerHTML = `${item.title} ${isDone}`;
        btn.onclick = () => {
            currentGroup = item;
            if (item.type === 'trace') startTracing();
            if (item.type === 'sort') startSorting();
        };
        grid.appendChild(btn);
    });
}

function showMenu() {
    tracingScreen.classList.remove('active-screen');
    sortingScreen.classList.remove('active-screen');
    menuScreen.classList.add('active-screen');
    buildMenu();
}

function resetSection() {
    if (currentGroup) {
        completedSections[currentGroup.title] = false;
        localStorage.setItem('completed', JSON.stringify(completedSections));
        if (currentGroup.type === 'trace') {
            startTracing();
        } else if (currentGroup.type === 'sort') {
            startSorting();
        }
    }
}

// --- AUDIO & EFFECTS ---
function playSuccess() {
    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
}
function speak(text) {
    let utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.8;
    speechSynthesis.speak(utterance);
}

// --- TRACING LOGIC ---
function startTracing() {
    menuScreen.classList.remove('active-screen');
    tracingScreen.classList.add('active-screen');
    document.getElementById('tracing-title').innerText = currentGroup.title;
    
    canvas.width = window.innerWidth * 0.9;
    canvas.height = window.innerHeight * 0.5;
    
    currentItemIndex = 0;
    loadLetter();
}

function loadLetter() {
    currentStrokeIndex = 0;
    currentWaypointIndex = 0;
    drawnPaths = [];
    document.getElementById('tracing-msg').innerText = "Trace the letter!";
    renderCanvas();
}

function renderCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const char = currentGroup.items[currentItemIndex];
    
    // 1. Draw Background Letter
    ctx.font = `bold ${canvas.height * 0.7}px 'Comic Sans MS'`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineWidth = 30;
    ctx.strokeStyle = "#e0e0e0";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeText(char, canvas.width/2, canvas.height/2);

    let strokes = traceData[char];
    if (!strokes) {
        ctx.fillStyle = "red";
        ctx.fillText("Data Missing", canvas.width/2, canvas.height/2);
        return;
    }

    // 2. Draw Already Completed Strokes
    ctx.strokeStyle = "#087E8B";
    ctx.lineWidth = 20;
    drawnPaths.forEach(path => {
        ctx.beginPath();
        ctx.moveTo(path[0].x + canvas.width/2, path[0].y + canvas.height/2);
        for(let i=1; i<path.length; i++) ctx.lineTo(path[i].x + canvas.width/2, path[i].y + canvas.height/2);
        ctx.stroke();
    });

    // 3. Draw Active Waypoints for Current Stroke
    if (currentStrokeIndex < strokes.length) {
        let activeStroke = strokes[currentStrokeIndex];
        let targetWP = activeStroke[currentWaypointIndex];
        
        // Draw the target dot (where the kid needs to touch/drag to next)
        ctx.beginPath();
        ctx.arc(targetWP.x + canvas.width/2, targetWP.y + canvas.height/2, 25, 0, Math.PI*2);
        ctx.fillStyle = "#FF5A5F";
        ctx.fill();
        ctx.fillStyle = "white";
        ctx.font = "20px Arial";
        ctx.fillText(currentWaypointIndex + 1, targetWP.x + canvas.width/2, targetWP.y + canvas.height/2);
    }
}

// Touch handling for Tracing
let isDragging = false;

canvas.addEventListener('touchstart', (e) => {
    isDragging = true;
    checkWaypoint(e.touches[0]);
});
canvas.addEventListener('touchmove', (e) => {
    if(!isDragging) return;
    e.preventDefault();
    checkWaypoint(e.touches[0]);
});
canvas.addEventListener('touchend', () => isDragging = false);

function checkWaypoint(touch) {
    const char = currentGroup.items[currentItemIndex];
    const strokes = traceData[char];
    if (!strokes || currentStrokeIndex >= strokes.length) return;

    let rect = canvas.getBoundingClientRect();
    let touchX = touch.clientX - rect.left - canvas.width/2;
    let touchY = touch.clientY - rect.top - canvas.height/2;

    let targetWP = strokes[currentStrokeIndex][currentWaypointIndex];
    
    // Calculate distance to the target dot
    let dist = Math.sqrt(Math.pow(touchX - targetWP.x, 2) + Math.pow(touchY - targetWP.y, 2));
    
    if (dist < 40) { // If finger is close enough to dot
        currentWaypointIndex++;
        
        // If stroke finished
        if (currentWaypointIndex >= strokes[currentStrokeIndex].length) {
            drawnPaths.push(strokes[currentStrokeIndex]);
            currentStrokeIndex++;
            currentWaypointIndex = 0;
            
            // If ALL strokes finished
            if (currentStrokeIndex >= strokes.length) {
                letterCompleted(char);
            }
        }
        renderCanvas();
    }
}

function letterCompleted(char) {
    playSuccess();
    speak(char);
    document.getElementById('tracing-msg').innerText = "Amazing! 🎉";
    
    setTimeout(() => {
        currentItemIndex++;
        if (currentItemIndex < currentGroup.items.length) {
            loadLetter();
        } else {
            document.getElementById('tracing-msg').innerText = "Section Complete! 🏆";
            completedSections[currentGroup.title] = true;
            localStorage.setItem('completed', JSON.stringify(completedSections));
            setTimeout(showMenu, 3000);
        }
    }, 2000);
}


// --- SORTING PUZZLE LOGIC ---
const sortingItems = [
    { emoji: '🍎', type: 'fruit' }, { emoji: '🍌', type: 'fruit' },
    { emoji: '🐶', type: 'animal' }, { emoji: '🐱', type: 'animal' }
];

let itemsPlaced = 0;
let draggedItem = null;

function startSorting() {
    menuScreen.classList.remove('active-screen');
    sortingScreen.classList.add('active-screen');
    document.getElementById('sorting-msg').innerText = "Drag items to correct boxes!";
    
    const area = document.getElementById('sorting-area');
    // Clear old draggables
    document.querySelectorAll('.draggable').forEach(el => el.remove());
    itemsPlaced = 0;

    sortingItems.forEach((item, index) => {
        let el = document.createElement('div');
        el.className = 'draggable';
        el.innerText = item.emoji;
        el.dataset.type = item.type;
        // Random start position in bottom half
        el.style.left = (Math.random() * 70 + 10) + '%';
        el.style.top = (Math.random() * 30 + 50) + '%';
        
        // Touch events
        el.addEventListener('touchstart', (e) => {
            draggedItem = el;
            el.style.transform = "scale(1.2)";
        });
        el.addEventListener('touchmove', (e) => {
            e.preventDefault();
            let touch = e.touches[0];
            el.style.left = (touch.clientX - 25) + 'px';
            el.style.top = (touch.clientY - 100) + 'px'; // Offset for header
        });
        el.addEventListener('touchend', (e) => {
            el.style.transform = "scale(1)";
            checkDrop(el, e.changedTouches[0]);
        });
        
        area.appendChild(el);
    });
}

function checkDrop(el, touch) {
    let fruitsZone = document.getElementById('zone-fruits').getBoundingClientRect();
    let animalsZone = document.getElementById('zone-animals').getBoundingClientRect();
    
    let targetType = el.dataset.type;
    let droppedInFruits = touch.clientY > fruitsZone.top && touch.clientY < fruitsZone.bottom && touch.clientX < window.innerWidth/2;
    let droppedInAnimals = touch.clientY > animalsZone.top && touch.clientY < animalsZone.bottom && touch.clientX > window.innerWidth/2;

    if ((targetType === 'fruit' && droppedInFruits) || (targetType === 'animal' && droppedInAnimals)) {
        speak(targetType === 'fruit' ? 'Yummy!' : 'Woof!');
        el.style.pointerEvents = 'none'; // Lock in place
        el.style.opacity = '0.5';
        itemsPlaced++;
        
        if (itemsPlaced === sortingItems.length) {
            playSuccess();
            speak('Puzzle Completed!');
            document.getElementById('sorting-msg').innerText = "You are a genius! 🌟";
            completedSections[currentGroup.title] = true;
            localStorage.setItem('completed', JSON.stringify(completedSections));
            setTimeout(showMenu, 3000);
        }
    } else {
        // Wrong drop, reset position slightly
        el.style.top = '70%';
        speak('Try again!');
    }
}

// Init
buildMenu();
