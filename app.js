const canvas = document.getElementById('drawingCanvas');
const ctx = canvas.getContext('2d');
const currentLetterElement = document.getElementById('currentLetter');

// Size canvas for mobile screens
canvas.width = window.innerWidth * 0.9;
canvas.height = window.innerHeight * 0.7;

let isDrawing = false;
let currentLetter = 'A';

// Draw the large background letter outline
function drawGuideLetter() {
    ctx.font = `bold ${canvas.height * 0.8}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineWidth = 15;
    ctx.strokeStyle = "rgba(200, 200, 200, 0.4)"; // Light gray outline
    
    // Draw in the exact center of the canvas
    ctx.strokeText(currentLetter, canvas.width / 2, canvas.height / 2);
}

// Setup drawing styles
ctx.lineCap = 'round';
ctx.lineJoin = 'round';
ctx.lineWidth = 40; // Thick line for easy coloring
ctx.strokeStyle = '#FF3B30'; // Red drawing color

// Mobile Touch Events
canvas.addEventListener('touchstart', startPosition);
canvas.addEventListener('touchend', endPosition);
canvas.addEventListener('touchmove', draw);

// Desktop Mouse Events (for testing)
canvas.addEventListener('mousedown', startPosition);
canvas.addEventListener('mouseup', endPosition);
canvas.addEventListener('mousemove', draw);

function startPosition(e) {
    isDrawing = true;
    draw(e);
}

function endPosition() {
    isDrawing = false;
    ctx.beginPath(); // Reset path so next stroke doesn't connect
    checkCompletion();
}

function draw(e) {
    if (!isDrawing) return;
    e.preventDefault(); // Prevent scrolling

    // Handle both touch and mouse coordinates
    let clientX = e.touches ? e.touches[0].clientX : e.clientX;
    let clientY = e.touches ? e.touches[0].clientY : e.clientY;

    let rect = canvas.getBoundingClientRect();
    let x = clientX - rect.left;
    let y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
}

function checkCompletion() {
    // Logic to check if letter is filled would go here.
    // For now, we'll simulate a completion trigger.
    console.log("Stroke finished. Checking coverage...");
}

// Initialize
drawGuideLetter();