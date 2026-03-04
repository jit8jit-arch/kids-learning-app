// --- STATE MANAGEMENT ---
const menuScreen = document.getElementById('menu-screen');
const tracingScreen = document.getElementById('tracing-screen');
const sortingScreen = document.getElementById('sorting-screen');
const jigsawScreen = document.getElementById('jigsaw-screen');
const canvas = document.getElementById('drawingCanvas');
const ctx = canvas.getContext('2d');

let completedSections = JSON.parse(localStorage.getItem('completed')) || {};
let animationFrameId;

// --- GAME DATA ---
const traceData = {
    '1': [ [ {x: 0, y: -100}, {x: 0, y: 100} ] ],
    '2': [ [ {x: -40, y: -80}, {x: 0, y: -100}, {x: 40, y: -80}, {x: 40, y: -20}, {x: -40, y: 100}, {x: 40, y: 100} ] ],
    '3': [ [ {x: -40, y: -80}, {x: 0, y: -100}, {x: 40, y: -80}, {x: 40, y: -20}, {x: 0, y: 0} ], [ {x: 0, y: 0}, {x: 40, y: 20}, {x: 40, y: 80}, {x: 0, y: 100}, {x: -40, y: 80} ] ],
    'A': [ [ {x: 0, y: -100}, {x: -60, y: 100} ], [ {x: 0, y: -100}, {x: 60, y: 100} ], [ {x: -30, y: 20}, {x: 30, y: 20} ] ],
    'B': [ [ {x: -40, y: -100}, {x: -40, y: 100} ], [ {x: -40, y: -100}, {x: 20, y: -100}, {x: 40, y: -50}, {x: 20, y: 0}, {x: -40, y: 0} ], [ {x: -40, y: 0}, {x: 30, y: 0}, {x: 50, y: 50}, {x: 30, y: 100}, {x: -40, y: 100} ] ]
};

// 🌟 NEW: The Jigsaw Images! 
// These are safe, high-quality cartoon images for the demo.
const jigsawImages = [
    { title: 'Tiger Puzzle', url: 'https://images.unsplash.com/photo-1549366021-9f761d450615?w=400&h=400&fit=crop' },
    { title: 'Panda Puzzle', url: 'https://images.unsplash.com/photo-1564349683136-5c66584e19b2?w=400&h=400&fit=crop' },
    { title: 'Rabbit Puzzle', url: 'https://images.unsplash.com/photo-1585110396000-c9fd4e4e5030?w=400&h=400&fit=crop' }
];

const appStructure = [
    {
        category: "Draw Numbers",
        games: [
            { type: 'trace', title: 'Numbers 1-3', items: ['1', '2', '3'], icon: '🔢' }
        ]
    },
    {
        category: "Draw Letters",
        games: [
            { type: 'trace', title: 'Letters A & B', items: ['A', 'B'], icon: '✍️' }
        ]
    },
    {
        category: "Sorting Games",
        games: [
            { type: 'sort', title: 'Sort Animals', icon: '🧺' }
        ]
    },
    {
        category: "Picture Puzzles (New!)",
        games: [
            { type: 'jigsaw', title: 'Tiger', imgIndex: 0, icon: '🐯' },
            { type: 'jigsaw', title: 'Panda', imgIndex: 1, icon: '🐼' },
            { type: 'jigsaw', title: 'Rabbit', imgIndex: 2, icon: '🐰' }
        ]
    }
];

let currentGroup = null;

// --- MENU LOGIC ---
function buildMenu() {
    const container = document.getElementById('menu-container');
    container.innerHTML = '';
    
    appStructure.forEach(section => {
        let title = document.createElement('div');
        title.className = 'category-title';
        title.innerText = section.category;
        container.appendChild(title);
        
        let grid = document.createElement('div');
        grid.className = 'grid';
        
        section.games.forEach((game) => {
            let btn = document.createElement('button');
            btn.className = 'menu-btn';
            btn.innerHTML = `<span class="menu-icon">${game.icon}</span><span>${game.title}</span>`;
            
            btn.onclick = () => {
                currentGroup = game;
                if (game.type === 'trace') startTracing();
                if (game.type === 'sort') startSorting();
                if (game.type === 'jigsaw') startJigsaw();
            };
            grid.appendChild(btn);
        });
        container.appendChild(grid);
    });
}

function showMenu() {
    cancelAnimationFrame(animationFrameId);
    tracingScreen.classList.remove('active-screen');
    sortingScreen.classList.remove('active-screen');
    jigsawScreen.classList.remove('active-screen');
    menuScreen.classList.add('active-screen');
    buildMenu();
}

function resetSection() {
    if (currentGroup) {
        if (currentGroup.type === 'trace') startTracing();
        else if (currentGroup.type === 'sort') startSorting();
        else if (currentGroup.type === 'jigsaw') startJigsaw();
    }
}

function playSuccess() { confetti({ particleCount: 200, spread: 90, origin: { y: 0.5 } }); }
function speak(text) {
    let utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.8;
    speechSynthesis.speak(utterance);
}

// ==========================================
// 🧩 NEW: TODDLER JIGSAW PUZZLE ENGINE
// ==========================================
let jigsawPiecesPlaced = 0;

function startJigsaw() {
    menuScreen.classList.remove('active-screen');
    jigsawScreen.classList.add('active-screen');
    document.getElementById('jigsaw-title').innerText = currentGroup.title;
    document.getElementById('jigsaw-msg').innerText = "Make the picture!";
    
    const board = document.getElementById('jigsaw-board');
    const area = document.getElementById('jigsaw-area');
    const imgObj = jigsawImages[currentGroup.imgIndex];
    
    // Set the faded background hint
    board.style.backgroundImage = `url('${imgObj.url}')`;
    
    // Clear old pieces
    document.querySelectorAll('.jigsaw-piece').forEach(el => el.remove());
    jigsawPiecesPlaced = 0;

    // Create a 2x2 Grid (4 pieces total)
    // Board is 300x300. Pieces are 150x150.
    const positions = [
        { id: 0, x: 0, y: 0 },         // Top Left
        { id: 1, x: 150, y: 0 },       // Top Right
        { id: 2, x: 0, y: 150 },       // Bottom Left
        { id: 3, x: 150, y: 150 }      // Bottom Right
    ];

    positions.forEach((pos, index) => {
        let piece = document.createElement('div');
        piece.className = 'jigsaw-piece';
        piece.style.backgroundImage = `url('${imgObj.url}')`;
        
        // Offset the background so each piece shows a different corner of the image
        piece.style.backgroundPosition = `-${pos.x}px -${pos.y}px`;
        
        // Randomly scatter the pieces at the bottom of the screen
        piece.style.left = (Math.random() * 50 + 10) + '%';
        piece.style.top = (Math.random() * 20 + 60) + '%';
        piece.style.animationDelay = `0.${index * 2}s`;
        
        // Store the target "snap" coordinates inside the board
        piece.dataset.targetX = pos.x;
        piece.dataset.targetY = pos.y;
        
        // Touch Drag Logic
        piece.addEventListener('touchstart', (e) => { 
            piece.style.transform = "scale(1.1)"; 
            piece.style.zIndex = "100"; 
        });
        
        piece.addEventListener('touchmove', (e) => {
            e.preventDefault();
            let touch = e.touches[0];
            // Center the piece on their finger
            piece.style.left = (touch.clientX - 75) + 'px';
            piece.style.top = (touch.clientY - 75) + 'px';
        });
        
        piece.addEventListener('touchend', (e) => {
            piece.style.transform = "scale(1)";
            piece.style.zIndex = "5";
            checkJigsawSnap(piece);
        });
        
        area.appendChild(piece);
    });
}

function checkJigsawSnap(piece) {
    const board = document.getElementById('jigsaw-board');
    const boardRect = board.getBoundingClientRect();
    const pieceRect = piece.getBoundingClientRect();
    
    // Calculate the piece's position *relative* to the top-left corner of the board
    let relativeX = pieceRect.left - boardRect.left;
    let relativeY = pieceRect.top - boardRect.top;
    
    let targetX = parseInt(piece.dataset.targetX);
    let targetY = parseInt(piece.dataset.targetY);
    
    // HUGE Hitbox: If they get within 60 pixels, SNAP it into place!
    if (Math.abs(relativeX - targetX) < 60 && Math.abs(relativeY - targetY) < 60) {
        speak('Snap!');
        piece.style.left = (boardRect.left + targetX) + 'px';
        piece.style.top = (boardRect.top + targetY) + 'px';
        piece.style.pointerEvents = 'none'; // Lock it so they can't drag it again
        piece.style.border = "none"; // Remove border to make it look seamless
        piece.classList.add('success-pulse');
        
        jigsawPiecesPlaced++;
        
        if (jigsawPiecesPlaced === 4) {
            playSuccess();
            speak(currentGroup.title);
            document.getElementById('jigsaw-msg').innerText = "Beautiful! 🌟";
            
            setTimeout(() => {
                showMenu();
            }, 4000);
        }
    } else {
        // If they missed, slightly pop it down
        piece.style.top = '70%';
    }
}

// --- KEEPING THE OTHER ENGINES SAFE (Minimified for space) ---
// Sorting Engine
function startSorting() {
    menuScreen.classList.remove('active-screen'); sortingScreen.classList.add('active-screen'); document.getElementById('sorting-msg').innerText = "Match them!";
    const area = document.getElementById('sorting-area'); document.querySelectorAll('.sort-item').forEach(el => el.remove()); let placed = 0;
    const pool = [{e:'🍎',t:'fruit'}, {e:'🐶',t:'animal'}, {e:'🍌',t:'fruit'}, {e:'🐱',t:'animal'}, {e:'🍉',t:'fruit'}, {e:'🦁',t:'animal'}];
    pool.forEach((item, i) => {
        let el = document.createElement('div'); el.className = 'sort-item'; el.innerText = item.e; el.dataset.type = item.t;
        el.style.left = (Math.random()*60+10)+'%'; el.style.top = (Math.random()*30+50)+'%';
        el.addEventListener('touchstart', () => { el.style.transform="scale(1.4)"; el.style.animation="none"; el.style.zIndex="100"; });
        el.addEventListener('touchmove', (e) => { e.preventDefault(); el.style.left=(e.touches[0].clientX-40)+'px'; el.style.top=(e.touches[0].clientY-100)+'px'; });
        el.addEventListener('touchend', (e) => {
            el.style.transform="scale(1)"; el.style.zIndex="1";
            let fZ = document.getElementById('zone-fruits').getBoundingClientRect(), aZ = document.getElementById('zone-animals').getBoundingClientRect();
            let touch = e.changedTouches[0], inF = touch.clientX>fZ.left && touch.clientX<fZ.right && touch.clientY>fZ.top && touch.clientY<fZ.bottom;
            let inA = touch.clientX>aZ.left && touch.clientX<aZ.right && touch.clientY>aZ.top && touch.clientY<aZ.bottom;
            if ((item.t==='fruit'&&inF) || (item.t==='animal'&&inA)) {
                speak('Yay!'); el.style.pointerEvents='none'; el.style.left = (item.t==='fruit'?fZ.left:aZ.left)+40+'px'; el.style.top = fZ.top+40+'px'; placed++;
                if(placed===pool.length){ playSuccess(); speak('Awesome!'); setTimeout(showMenu,3000); }
            } else { el.style.animation="float 3s infinite"; }
        }); area.appendChild(el);
    });
}
// Tracing Engine (Uses the thick paintbrush updates from before!)
let smoothStrokes=[], currStroke=0, currWP=0, drawn=[], isFinished=false;
function startTracing() { menuScreen.classList.remove('active-screen'); tracingScreen.classList.add('active-screen'); currentItemIndex = 0; document.getElementById('tracing-title').innerText = currentGroup.title; canvas.width=canvas.parentElement.clientWidth; canvas.height=canvas.parentElement.clientHeight; loadLetter(); }
function loadLetter() { currStroke=0; currWP=0; drawn=[]; isFinished=false; document.getElementById('tracing-msg').innerText="Trace it!"; let char = currentGroup.items[currentItemIndex]; if(traceData[char]) smoothStrokes = interpolateStrokes(traceData[char]); animateCanvas(); }
function interpolateStrokes(rs) { let g=[]; rs.forEach(s=>{ let ns=[]; for(let i=0;i<s.length-1;i++){ let p1=s[i],p2=s[i+1], dist=Math.hypot(p2.x-p1.x,p2.y-p1.y), steps=Math.max(Math.floor(dist/12),1); for(let j=0;j<steps;j++) ns.push({x:p1.x+(p2.x-p1.x)*(j/steps), y:p1.y+(p2.y-p1.y)*(j/steps)}); } ns.push(s[s.length-1]); g.push(ns); }); return g; }
function animateCanvas() {
    if(isFinished) return; ctx.clearRect(0,0,canvas.width,canvas.height); let char = currentGroup.items[currentItemIndex];
    ctx.font=`bold ${canvas.height*0.7}px 'Comic Sans MS'`; ctx.textAlign="center"; ctx.textBaseline="middle"; ctx.lineCap="round"; ctx.lineJoin="round"; ctx.lineWidth=45; ctx.strokeStyle="#EAEAEA"; ctx.strokeText(char,canvas.width/2,canvas.height/2);
    if(smoothStrokes.length===0) return; ctx.strokeStyle="#087E8B"; ctx.lineWidth=55;
    drawn.forEach(p=>{ ctx.beginPath(); ctx.moveTo(p[0].x+canvas.width/2,p[0].y+canvas.height/2); for(let i=1;i<p.length;i++) ctx.lineTo(p[i].x+canvas.width/2,p[i].y+canvas.height/2); ctx.stroke(); });
    if(currStroke<smoothStrokes.length){
        let aS=smoothStrokes[currStroke]; for(let i=currWP;i<aS.length;i++){ ctx.beginPath(); ctx.arc(aS[i].x+canvas.width/2,aS[i].y+canvas.height/2,6,0,Math.PI*2); ctx.fillStyle="#FFCA3A"; ctx.fill(); }
        let tWP=aS[currWP]; ctx.beginPath(); ctx.arc(tWP.x+canvas.width/2,tWP.y+canvas.height/2,18+(Math.sin(Date.now()/150)*5),0,Math.PI*2); ctx.fillStyle="#FF5A5F"; ctx.fill(); ctx.lineWidth=3; ctx.strokeStyle="white"; ctx.stroke();
    } animationFrameId = requestAnimationFrame(animateCanvas);
}
canvas.addEventListener('touchmove', (e) => {
    if(currStroke>=smoothStrokes.length||isFinished) return; e.preventDefault(); let t=e.touches[0], r=canvas.getBoundingClientRect();
    let d=Math.sqrt(Math.pow((t.clientX-r.left-canvas.width/2)-smoothStrokes[currStroke][currWP].x,2) + Math.pow((t.clientY-r.top-canvas.height/2)-smoothStrokes[currStroke][currWP].y,2));
    if(d<55){ currWP++; if(currWP>=smoothStrokes[currStroke].length){ drawn.push(smoothStrokes[currStroke]); currStroke++; currWP=0; if(currStroke>=smoothStrokes.length){
        isFinished=true; cancelAnimationFrame(animationFrameId); ctx.clearRect(0,0,canvas.width,canvas.height); ctx.fillStyle="#087E8B"; ctx.fillText(char,canvas.width/2,canvas.height/2);
        playSuccess(); speak(char); document.getElementById('tracing-msg').innerText="Perfect! 🎉"; setTimeout(()=>{ currentItemIndex++; if(currentItemIndex<currentGroup.items.length) loadLetter(); else showMenu(); }, 2500);
    }}}
});

buildMenu();
