const groups = [
    { title: "Numbers 1-5", items: ['1','2','3','4','5'] },
    { title: "Numbers 6-10", items: ['6','7','8','9','10'] },
    { title: "A - E", items: ['A','B','C','D','E'] },
    { title: "F - J", items: ['F','G','H','I','J'] },
    { title: "K - O", items: ['K','L','M','N','O'] },
    { title: "P - T", items: ['P','Q','R','S','T'] },
    { title: "U - Z", items: ['U','V','W','X','Y','Z'] }
];

const menuScreen = document.getElementById('menu-screen');
const gameScreen = document.getElementById('game-screen');
const categoryGrid = document.getElementById('category-grid');
const canvas = document.getElementById('drawingCanvas');
const ctx = canvas.getContext('2d');
const groupTitle = document.getElementById('group-title');
const messageEl = document.getElementById('message');

let currentItems = [];
let currentIndex = 0;
let isDrawing = false;
let startX = 0, startY = 0;
let dragDistance = 0;
let isCompleted = false;

// 1. Setup Menu
groups.forEach((group, index) => {
    let btn = document.createElement('button');
    btn.className = 'btn-group';
    btn.innerText = group.title;
    btn.onclick = () => startGame(index);
    categoryGrid.appendChild(btn);
});

// 2. Navigation
function showMenu() {
    gameScreen.style.display = 'none';
    menuScreen.style.display = 'flex';
    speechSynthesis.cancel(); // Stop speaking if they exit
}

function startGame(groupIndex) {
    currentItems = groups[groupIndex].items;
    groupTitle.innerText = groups[groupIndex].title;
    currentIndex = 0;
    menuScreen.style.display = 'none';
    gameScreen.style.display = 'flex';
    
    // Size canvas
    canvas.width = window.innerWidth * 0.85;
    canvas.height = window.innerHeight * 0.6;
    
    loadItem();
}

// 3. Render Letter & Start Point
function loadItem() {
    isCompleted = false;
    dragDistance = 0;
    messageEl.innerText = "";
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const char = currentItems[currentIndex];
    
    // Draw Outline
    ctx.font = `bold ${canvas.height * 0.7}px 'Comic Sans MS', sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineWidth = 8;
    ctx.strokeStyle = "#ccc";
    ctx.strokeText(char, canvas.width / 2, canvas.height / 2);

    // Draw Starting "Dot" hint
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height * 0.2, 15, 0, Math.PI * 2);
    ctx.fillStyle = "#2EC4B6";
    ctx.fill();
}

// 4. Touch / Draw Logic (Triggering the auto-fill)
canvas.addEventListener('touchstart', (e) => {
    if (isCompleted) return;
    isDrawing = true;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
});

canvas.addEventListener('touchmove', (e) => {
    if (!isDrawing || isCompleted) return;
    e.preventDefault(); 
    
    let currentX = e.touches[0].clientX;
    let currentY = e.touches[0].clientY;
    
    // Calculate how far the child dragged
    let diffX = currentX - startX;
    let diffY = currentY - startY;
    dragDistance = Math.sqrt(diffX * diffX + diffY * diffY);

    // Visual feedback line
    let rect = canvas.getBoundingClientRect();
    ctx.lineTo(currentX - rect.left, currentY - rect.top);
    ctx.lineWidth = 15;
    ctx.strokeStyle = "#FF9F1C";
    ctx.lineCap = "round";
    ctx.stroke();

    // If dragged enough, trigger auto-fill!
    if (dragDistance > 100) {
        completeItem();
    }
});

canvas.addEventListener('touchend', () => { isDrawing = false; ctx.beginPath(); });

// 5. Completion & Pronunciation
function completeItem() {
    isCompleted = true;
    isDrawing = false;
    const char = currentItems[currentIndex];

    // Auto-fill the letter
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = `bold ${canvas.height * 0.7}px 'Comic Sans MS', sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#E71D36"; // Solid color fill
    ctx.fillText(char, canvas.width / 2, canvas.height / 2);

    // Pronounce and Congratulate
    messageEl.innerText = "Great Job! 🎉";
    let speech = new SpeechSynthesisUtterance(char);
    speech.rate = 0.8;
    window.speechSynthesis.speak(speech);

    // Move to next after delay
    setTimeout(() => {
        currentIndex++;
        if (currentIndex < currentItems.length) {
            loadItem();
        } else {
            messageEl.innerText = "Group Finished! 🏆";
            setTimeout(showMenu, 2000);
        }
    }, 1500);
}
