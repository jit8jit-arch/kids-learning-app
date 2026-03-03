// --- STATE MANAGEMENT ---
const menuScreen = document.getElementById('menu-screen');
const tracingScreen = document.getElementById('tracing-screen');
const sortingScreen = document.getElementById('sorting-screen');
const canvas = document.getElementById('drawingCanvas');
const ctx = canvas.getContext('2d');

let completedSections = JSON.parse(localStorage.getItem('completed')) || {};
let animationFrameId;

// --- TRACING DATA ---
const traceData = {
    '1': [ [ {x: 0, y: -100}, {x: 0, y: 100} ] ],
    '2': [ [ {x: -40, y: -80}, {x: 0, y: -100}, {x: 40, y: -80}, {x: 40, y: -20}, {x: -40, y: 100}, {x: 40, y: 100} ] ],
    '3': [ [ {x: -40, y: -80}, {x: 0, y: -100}, {x: 40, y: -80}, {x: 40, y: -20}, {x: 0, y: 0} ], [ {x: 0, y: 0}, {x: 40, y: 20}, {x: 40, y: 80}, {x: 0, y: 100}, {x: -40, y: 80} ] ],
    '4': [ [ {x: -20, y: -100}, {x: -40, y: 20}, {x: 40, y: 20} ], [ {x: 20, y: -50}, {x: 20, y: 100} ] ],
    '5': [ [ {x: -20, y: -100}, {x: -20, y: 0}, {x: 30, y: 0}, {x: 40, y: 40}, {x: 0, y: 100}, {x: -40, y: 80} ], [ {x: -20, y: -100}, {x: 40, y: -100} ] ],
    '6': [ [ {x: 40, y: -100}, {x: -40, y: 0}, {x: -40, y: 60}, {x: 0, y: 100}, {x: 40, y: 50}, {x: 0, y: 0}, {x: -40, y: 30} ] ],
    '7': [ [ {x: -40, y: -100}, {x: 40, y: -100}, {x: -20, y: 100} ] ],
    '8': [ [ {x: 0, y: -100}, {x: -40, y: -50}, {x: 0, y: 0}, {x: 40, y: 50}, {x: 0, y: 100}, {x: -40, y: 50}, {x: 0, y: 0}, {x: 40, y: -50}, {x: 0, y: -100} ] ],
    '9': [ [ {x: 40, y: -50}, {x: 0, y: -100}, {x: -40, y: -50}, {x: 0, y: 0}, {x: 40, y: -50}, {x: 40, y: 100} ] ],
    '10': [ [ {x: -40, y: -100}, {x: -40, y: 100} ], [ {x: 40, y: -100}, {x: 10, y: -50}, {x: 10, y: 50}, {x: 40, y: 100}, {x: 70, y: 50}, {x: 70, y: -50}, {x: 40, y: -100} ] ],
    'A': [ [ {x: 0, y: -100}, {x: -60, y: 100} ], [ {x: 0, y: -100}, {x: 60, y: 100} ], [ {x: -30, y: 20}, {x: 30, y: 20} ] ],
    'B': [ [ {x: -40, y: -100}, {x: -40, y: 100} ], [ {x: -40, y: -100}, {x: 20, y: -100}, {x: 40, y: -50}, {x: 20, y: 0}, {x: -40, y: 0} ], [ {x: -40, y: 0}, {x: 30, y: 0}, {x: 50, y: 50}, {x: 30, y: 100}, {x: -40, y: 100} ] ],
    'C': [ [ {x: 40, y: -80}, {x: 0, y: -100}, {x: -40, y: -50}, {x: -40, y: 50}, {x: 0, y: 100}, {x: 40, y: 80} ] ],
    'D': [ [ {x: -40, y: -100}, {x: -40, y: 100} ], [ {x: -40, y: -100}, {x: 20, y: -100}, {x: 50, y: -50}, {x: 50, y: 50}, {x: 20, y: 100}, {x: -40, y: 100} ] ],
    'E': [ [ {x: -40, y: -100}, {x: -40, y: 100} ], [ {x: -40, y: -100}, {x: 30, y: -100} ], [ {x: -40, y: 0}, {x: 20, y: 0} ], [ {x: -40, y: 100}, {x: 30, y: 100} ] ],
    'F': [ [ {x: -40, y: -100}, {x: -40, y: 100} ], [ {x: -40, y: -100}, {x: 30, y: -100} ], [ {x: -40, y: 0}, {x: 20, y: 0} ] ],
    'G': [ [ {x: 40, y: -80}, {x: 0, y: -100}, {x: -40, y: -50}, {x: -40, y: 50}, {x: 0, y: 100}, {x: 40, y: 50}, {x: 40, y: 0} ], [ {x: 40, y: 0}, {x: 10, y: 0} ] ]
};

const menuItems = [
    { type: 'trace', title: 'Numbers 1 - 5', items: ['1', '2', '3', '4', '5'] },
    { type: 'trace', title: 'Numbers 6 - 10', items: ['6', '7', '8', '9', '10'] },
    { type: 'trace', title: 'Letters A - E', items: ['A', 'B', 'C', 'D', 'E'] },
    { type: 'trace', title: 'Letters F - G', items: ['F', 'G'] },
    { type: 'sort', title: 'Fun Puzzle: Animals & Fruits' }
];

let currentGroup = null;
let currentItemIndex = 0;
let smoothStrokes = []; 
let currentStrokeIndex = 0;
let currentWaypointIndex = 0;
let drawnPaths = []; 
let isLetterFinished = false;

// --- MENU LOGIC ---
function buildMenu() {
    const grid = document.getElementById('menu-grid');
    grid.innerHTML = '';
    menuItems.forEach((item) => {
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
    cancelAnimationFrame(animationFrameId);
    tracingScreen.classList.remove('active-screen');
    sortingScreen.classList.remove('active-screen');
    menuScreen.classList.add('active-screen');
    buildMenu();
}

function resetSection() {
    if (currentGroup) {
        completedSections[currentGroup.title] = false;
        localStorage.setItem('completed', JSON.stringify(completedSections));
        if (currentGroup.type === 'trace') startTracing();
        else if (currentGroup.type === 'sort') startSorting();
    }
}

function playSuccess() { confetti({ particleCount: 200, spread: 90, origin: { y: 0.5 } }); }
function speak(text) {
    let utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.8;
    speechSynthesis.speak(utterance);
}

// --- WAYPOINT INTERPOLATOR (Tracing) ---
function interpolateStrokes(rawStrokes) {
    let generated = [];
    rawStrokes.forEach(stroke => {
        let newStroke = [];
        for(let i = 0; i < stroke.length - 1; i++) {
            let p1 = stroke[i];
            let p2 = stroke[i+1];
            let dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
            let steps = Math.max(Math.floor(dist / 25), 1); 
            for(let j = 0; j < steps; j++) {
                newStroke.push({ x: p1.x + (p2.x - p1.x) * (j/steps), y: p1.y + (p2.y - p1.y) * (j/steps) });
            }
        }
        newStroke.push(stroke[stroke.length - 1]); 
        generated.push(newStroke);
    });
    return generated;
}

// --- TRACING ENGINE ---
function startTracing() {
    menuScreen.classList.remove('active-screen');
    tracingScreen.classList.add('active-screen');
    document.getElementById('tracing-title').innerText = currentGroup.title;
    
    let container = document.querySelector('.canvas-container');
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    
    currentItemIndex = 0;
    loadLetter();
}

function loadLetter() {
    currentStrokeIndex = 0;
    currentWaypointIndex = 0;
    drawnPaths = [];
    isLetterFinished = false;
    document.getElementById('tracing-msg').innerText = "Trace the line!";
    
    const char = currentGroup.items[currentItemIndex];
    if (traceData[char]) smoothStrokes = interpolateStrokes(traceData[char]);
    animateCanvas(); 
}

function animateCanvas() {
    if (isLetterFinished) return; 

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const char = currentGroup.items[currentItemIndex];
    
    ctx.font = `bold ${canvas.height * 0.7}px 'Comic Sans MS'`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineWidth = 40;
    ctx.strokeStyle = "#EAEAEA";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeText(char, canvas.width/2, canvas.height/2);

    if (smoothStrokes.length === 0) return;

    ctx.strokeStyle = "#087E8B";
    ctx.lineWidth = 30;
    drawnPaths.forEach(path => {
        ctx.beginPath();
        ctx.moveTo(path[0].x + canvas.width/2, path[0].y + canvas.height/2);
        for(let i=1; i<path.length; i++) ctx.lineTo(path[i].x + canvas.width/2, path[i].y + canvas.height/2);
        ctx.stroke();
    });

    if (currentStrokeIndex < smoothStrokes.length) {
        let activeStroke = smoothStrokes[currentStrokeIndex];
        
        for(let i = currentWaypointIndex; i < activeStroke.length; i++) {
            ctx.beginPath();
            ctx.arc(activeStroke[i].x + canvas.width/2, activeStroke[i].y + canvas.height/2, 8, 0, Math.PI*2);
            ctx.fillStyle = "#FFCA3A"; 
            ctx.fill();
        }

        let targetWP = activeStroke[currentWaypointIndex];
        let pulse = Math.sin(Date.now() / 150) * 5; 
        
        ctx.beginPath();
        ctx.arc(targetWP.x + canvas.width/2, targetWP.y + canvas.height/2, 20 + pulse, 0, Math.PI*2);
        ctx.fillStyle = "#FF5A5F";
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = "white";
        ctx.stroke();
    }
    animationFrameId = requestAnimationFrame(animateCanvas);
}

// Touch Handling (Tracing)
let isDragging = false;
canvas.addEventListener('touchstart', (e) => { isDragging = true; checkWaypoint(e.touches[0]); });
canvas.addEventListener('touchmove', (e) => { if(!isDragging) return; e.preventDefault(); checkWaypoint(e.touches[0]); });
canvas.addEventListener('touchend', () => isDragging = false);

function checkWaypoint(touch) {
    if (currentStrokeIndex >= smoothStrokes.length || isLetterFinished) return;
    let rect = canvas.getBoundingClientRect();
    let touchX = touch.clientX - rect.left - canvas.width/2;
    let touchY = touch.clientY - rect.top - canvas.height/2;

    let targetWP = smoothStrokes[currentStrokeIndex][currentWaypointIndex];
    let dist = Math.sqrt(Math.pow(touchX - targetWP.x, 2) + Math.pow(touchY - targetWP.y, 2));
    
    if (dist < 45) { 
        currentWaypointIndex++;
        if (currentWaypointIndex >= smoothStrokes[currentStrokeIndex].length) {
            drawnPaths.push(smoothStrokes[currentStrokeIndex]);
            currentStrokeIndex++;
            currentWaypointIndex = 0;
            if (currentStrokeIndex >= smoothStrokes.length) letterCompleted(currentGroup.items[currentItemIndex]);
        }
    }
}

function letterCompleted(char) {
    isLetterFinished = true; 
    cancelAnimationFrame(animationFrameId); 
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = `bold ${canvas.height * 0.7}px 'Comic Sans MS'`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#087E8B"; 
    ctx.fillText(char, canvas.width/2, canvas.height/2);

    playSuccess();
    speak(char);
    document.getElementById('tracing-msg').innerText = "Perfect! 🎉";
    
    setTimeout(() => {
        currentItemIndex++;
        if (currentItemIndex < currentGroup.items.length) loadLetter();
        else {
            document.getElementById('tracing-msg').innerText = "Section Complete! 🏆";
            completedSections[currentGroup.title] = true;
            localStorage.setItem('completed', JSON.stringify(completedSections));
            setTimeout(showMenu, 3000);
        }
    }, 2000);
}

// --- MEGA PUZZLE LOGIC ---
// Expanded Master Pool of Items
const fullPuzzlePool = [
    { emoji: '🍎', type: 'fruit' }, { emoji: '🍌', type: 'fruit' }, { emoji: '🍇', type: 'fruit' },
    { emoji: '🍓', type: 'fruit' }, { emoji: '🍉', type: 'fruit' }, { emoji: '🍒', type: 'fruit' },
    { emoji: '🍍', type: 'fruit' }, { emoji: '🥭', type: 'fruit' }, { emoji: '🥝', type: 'fruit' },
    { emoji: '🐶', type: 'animal' }, { emoji: '🐱', type: 'animal' }, { emoji: '🐸', type: 'animal' },
    { emoji: '🦁', type: 'animal' }, { emoji: '🐼', type: 'animal' }, { emoji: '🐷', type: 'animal' },
    { emoji: '🐯', type: 'animal' }, { emoji: '🦊', type: 'animal' }, { emoji: '🐵', type: 'animal' }
];

let itemsPlaced = 0;
let totalItemsThisRound = 8; // We will randomly pick 8 items each game

function startSorting() {
    menuScreen.classList.remove('active-screen');
    sortingScreen.classList.add('active-screen');
    document.getElementById('sorting-msg').innerText = "Match them!";
    
    const area = document.getElementById('sorting-area');
    document.querySelectorAll('.draggable').forEach(el => el.remove());
    itemsPlaced = 0;

    // Shuffle the master pool and pick the first 8
    let shuffledPool = fullPuzzlePool.sort(() => 0.5 - Math.random());
    let activeItems = shuffledPool.slice(0, totalItemsThisRound);

    activeItems.forEach((item, index) => {
        let el = document.createElement('div');
        el.className = 'draggable';
        el.innerText = item.emoji;
        el.dataset.type = item.type;
        
        // Spread them out randomly in the lower section
        el.style.left = (Math.random() * 70 + 10) + '%';
        el.style.top = (Math.random() * 40 + 45) + '%';
        // Stagger the pop-in animation slightly for each item
        el.style.animationDelay = `0.${index}s, ${Math.random()}s`; 
        
        el.addEventListener('touchstart', (e) => { 
            el.style.transform = "scale(1.4)"; 
            el.style.animation = "none"; // Stop floating when grabbed
            el.style.zIndex = "100"; // Bring to front
        });
        
        el.addEventListener('touchmove', (e) => {
            e.preventDefault();
            let touch = e.touches[0];
            el.style.left = (touch.clientX - 40) + 'px';
            el.style.top = (touch.clientY - 120) + 'px';
        });
        
        el.addEventListener('touchend', (e) => {
            el.style.transform = "scale(1)";
            el.style.zIndex = "1";
            checkDrop(el, e.changedTouches[0]);
        });
        
        area.appendChild(el);
    });
}

function checkDrop(el, touch) {
    let fruitsZone = document.getElementById('zone-fruits').getBoundingClientRect();
    let animalsZone = document.getElementById('zone-animals').getBoundingClientRect();
    
    let targetType = el.dataset.type;
    let droppedInFruits = touch.clientX > fruitsZone.left && touch.clientX < fruitsZone.right && touch.clientY > fruitsZone.top && touch.clientY < fruitsZone.bottom;
    let droppedInAnimals = touch.clientX > animalsZone.left && touch.clientX < animalsZone.right && touch.clientY > animalsZone.top && touch.clientY < animalsZone.bottom;

    if ((targetType === 'fruit' && droppedInFruits) || (targetType === 'animal' && droppedInAnimals)) {
        speak(targetType === 'fruit' ? 'Yummy!' : 'Wow!');
        el.style.pointerEvents = 'none'; // Lock it
        
        // Add the golden pulse success animation!
        el.classList.add('success-pulse');
        
        // Snap near center of the basket randomly so they pile up nicely
        let targetZone = targetType === 'fruit' ? fruitsZone : animalsZone;
        el.style.left = (targetZone.left + targetZone.width/2 - 30 + (Math.random()*20-10)) + 'px';
        el.style.top = (targetZone.top + targetZone.height/2 - 30 + (Math.random()*20-10)) + 'px';
        
        itemsPlaced++;
        if (itemsPlaced === totalItemsThisRound) {
            playSuccess();
            speak('Awesome job!');
            document.getElementById('sorting-msg').innerText = "You are so smart! 🌟";
            completedSections[currentGroup.title] = true;
            localStorage.setItem('completed', JSON.stringify(completedSections));
            setTimeout(showMenu, 3500);
        }
    } else {
        speak('Try again!');
        // Restart the floating animation if they miss
        el.style.animation = "float 3s ease-in-out infinite"; 
    }
}

buildMenu();
