// --- STATE MANAGEMENT ---
const menuScreen = document.getElementById('menu-screen');
const tracingScreen = document.getElementById('tracing-screen');
const sortingScreen = document.getElementById('sorting-screen');
const jigsawScreen = document.getElementById('jigsaw-screen');
const canvas = document.getElementById('drawingCanvas');
const ctx = canvas.getContext('2d');

let completedSections = JSON.parse(localStorage.getItem('completed')) || {};
let animationFrameId;

// --- HIGH-FIDELITY TRACING DATA ---
// Added many more waypoints to curved numbers/letters to ensure perfectly smooth, round tracing paths.
const traceData = {
    '1': [ [ {x: 0, y: -90}, {x: 0, y: 90} ] ],
    '2': [ [ {x: -35, y: -60}, {x: -15, y: -90}, {x: 15, y: -90}, {x: 35, y: -60}, {x: 35, y: -20}, {x: -35, y: 90}, {x: 40, y: 90} ] ],
    '3': [ [ {x: -35, y: -70}, {x: -15, y: -90}, {x: 15, y: -90}, {x: 35, y: -60}, {x: 15, y: -10}, {x: 0, y: 0} ], [ {x: 0, y: 0}, {x: 25, y: 15}, {x: 35, y: 50}, {x: 15, y: 90}, {x: -15, y: 90}, {x: -35, y: 70} ] ],
    '4': [ [ {x: -10, y: -90}, {x: -40, y: 20}, {x: 40, y: 20} ], [ {x: 20, y: -40}, {x: 20, y: 90} ] ],
    '5': [ [ {x: -20, y: -90}, {x: -20, y: -10}, {x: 15, y: -10}, {x: 35, y: 20}, {x: 35, y: 60}, {x: 15, y: 90}, {x: -15, y: 90}, {x: -35, y: 70} ], [ {x: -20, y: -90}, {x: 35, y: -90} ] ],
    '6': [ [ {x: 30, y: -80}, {x: -10, y: -30}, {x: -35, y: 20}, {x: -35, y: 60}, {x: -15, y: 90}, {x: 15, y: 90}, {x: 35, y: 60}, {x: 35, y: 20}, {x: 15, y: -10}, {x: -15, y: -10} ] ],
    '7': [ [ {x: -35, y: -90}, {x: 35, y: -90}, {x: -15, y: 90} ] ],
    '8': [ [ {x: 0, y: -90}, {x: -30, y: -60}, {x: -30, y: -30}, {x: 0, y: 0}, {x: 30, y: 30}, {x: 30, y: 60}, {x: 0, y: 90}, {x: -30, y: 60}, {x: -30, y: 30}, {x: 0, y: 0}, {x: 30, y: -30}, {x: 30, y: -60}, {x: 0, y: -90} ] ],
    '9': [ [ {x: 30, y: 20}, {x: 30, y: -30}, {x: 15, y: -80}, {x: -15, y: -80}, {x: -30, y: -40}, {x: -15, y: 0}, {x: 15, y: 0}, {x: 30, y: -30}, {x: 30, y: 90} ] ],
    '10': [ [ {x: -40, y: -90}, {x: -40, y: 90} ], [ {x: 35, y: -90}, {x: 15, y: -90}, {x: -5, y: -40}, {x: -5, y: 40}, {x: 15, y: 90}, {x: 35, y: 90}, {x: 55, y: 40}, {x: 55, y: -40}, {x: 35, y: -90} ] ],
    'A': [ [ {x: 0, y: -90}, {x: -50, y: 90} ], [ {x: 0, y: -90}, {x: 50, y: 90} ], [ {x: -25, y: 20}, {x: 25, y: 20} ] ],
    'B': [ [ {x: -35, y: -90}, {x: -35, y: 90} ], [ {x: -35, y: -90}, {x: 15, y: -90}, {x: 35, y: -50}, {x: 15, y: -10}, {x: -35, y: -10} ], [ {x: -35, y: -10}, {x: 25, y: -10}, {x: 45, y: 40}, {x: 25, y: 90}, {x: -35, y: 90} ] ],
    'C': [ [ {x: 35, y: -70}, {x: 15, y: -90}, {x: -15, y: -90}, {x: -35, y: -50}, {x: -35, y: 50}, {x: -15, y: 90}, {x: 15, y: 90}, {x: 35, y: 70} ] ],
    'D': [ [ {x: -35, y: -90}, {x: -35, y: 90} ], [ {x: -35, y: -90}, {x: 15, y: -90}, {x: 45, y: -40}, {x: 45, y: 40}, {x: 15, y: 90}, {x: -35, y: 90} ] ],
    'E': [ [ {x: -35, y: -90}, {x: -35, y: 90} ], [ {x: -35, y: -90}, {x: 30, y: -90} ], [ {x: -35, y: 0}, {x: 20, y: 0} ], [ {x: -35, y: 90}, {x: 30, y: 90} ] ],
    'F': [ [ {x: -35, y: -90}, {x: -35, y: 90} ], [ {x: -35, y: -90}, {x: 30, y: -90} ], [ {x: -35, y: 0}, {x: 20, y: 0} ] ],
    'G': [ [ {x: 35, y: -70}, {x: 15, y: -90}, {x: -15, y: -90}, {x: -35, y: -50}, {x: -35, y: 50}, {x: -15, y: 90}, {x: 15, y: 90}, {x: 35, y: 70}, {x: 35, y: 10} ], [ {x: 35, y: 10}, {x: 0, y: 10} ] ]
};

// 🌟 EXPANDED & FIXED JIGSAW IMAGES 
const jigsawImages = [
    { title: 'Tiger', url: 'https://images.unsplash.com/photo-1549366021-9f761d450615?w=400&h=400&fit=crop' },
    { title: 'Panda', url: 'https://images.unsplash.com/photo-1564349683136-5c66584e19b2?w=400&h=400&fit=crop' },
    { title: 'Rabbit', url: 'https://images.unsplash.com/photo-1585110396000-c9fd4e4e5030?w=400&h=400&fit=crop' },
    { title: 'Elephant', url: 'https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?w=400&h=400&fit=crop' },
    { title: 'Lion', url: 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=400&h=400&fit=crop' },
    { title: 'Monkey', url: 'https://images.unsplash.com/photo-1540573133985-87b6da6d54a9?w=400&h=400&fit=crop' }
];

const appStructure = [
    {
        category: "Trace Numbers",
        games: [
            { type: 'trace', title: 'Numbers 1-5', items: ['1', '2', '3', '4', '5'], icon: '1️⃣' },
            { type: 'trace', title: 'Numbers 6-10', items: ['6', '7', '8', '9', '10'], icon: '🔟' }
        ]
    },
    {
        category: "Trace Letters",
        games: [
            { type: 'trace', title: 'Letters A-D', items: ['A', 'B', 'C', 'D'], icon: '🅰️' },
            { type: 'trace', title: 'Letters E-G', items: ['E', 'F', 'G'], icon: '🆎' }
        ]
    },
    {
        category: "Sort & Match",
        games: [
            { type: 'sort', title: 'Sort Animals', icon: '🧺' }
        ]
    },
    {
        category: "Picture Puzzles",
        games: [
            { type: 'jigsaw', title: 'Tiger', imgIndex: 0, icon: '🐯' },
            { type: 'jigsaw', title: 'Panda', imgIndex: 1, icon: '🐼' },
            { type: 'jigsaw', title: 'Rabbit', imgIndex: 2, icon: '🐰' },
            { type: 'jigsaw', title: 'Elephant', imgIndex: 3, icon: '🐘' },
            { type: 'jigsaw', title: 'Lion', imgIndex: 4, icon: '🦁' },
            { type: 'jigsaw', title: 'Monkey', imgIndex: 5, icon: '🐵' }
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
// 🧩 TODDLER JIGSAW PUZZLE ENGINE
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
    
    board.style.backgroundImage = `url('${imgObj.url}')`;
    document.querySelectorAll('.jigsaw-piece').forEach(el => el.remove());
    jigsawPiecesPlaced = 0;

    const positions = [ { id: 0, x: 0, y: 0 }, { id: 1, x: 150, y: 0 }, { id: 2, x: 0, y: 150 }, { id: 3, x: 150, y: 150 } ];

    positions.forEach((pos, index) => {
        let piece = document.createElement('div');
        piece.className = 'jigsaw-piece';
        piece.style.backgroundImage = `url('${imgObj.url}')`;
        piece.style.backgroundPosition = `-${pos.x}px -${pos.y}px`;
        piece.style.left = (Math.random() * 50 + 10) + '%';
        piece.style.top = (Math.random() * 20 + 60) + '%';
        piece.style.animationDelay = `0.${index * 2}s`;
        piece.dataset.targetX = pos.x;
        piece.dataset.targetY = pos.y;
        
        piece.addEventListener('touchstart', (e) => { piece.style.transform = "scale(1.1)"; piece.style.zIndex = "100"; });
        piece.addEventListener('touchmove', (e) => {
            e.preventDefault();
            let touch = e.touches[0];
            piece.style.left = (touch.clientX - 75) + 'px';
            piece.style.top = (touch.clientY - 75) + 'px';
        });
        piece.addEventListener('touchend', (e) => {
            piece.style.transform = "scale(1)"; piece.style.zIndex = "5";
            checkJigsawSnap(piece);
        });
        area.appendChild(piece);
    });
}

function checkJigsawSnap(piece) {
    const board = document.getElementById('jigsaw-board');
    const boardRect = board.getBoundingClientRect();
    const pieceRect = piece.getBoundingClientRect();
    
    let relativeX = pieceRect.left - boardRect.left;
    let relativeY = pieceRect.top - boardRect.top;
    let targetX = parseInt(piece.dataset.targetX);
    let targetY = parseInt(piece.dataset.targetY);
    
    if (Math.abs(relativeX - targetX) < 60 && Math.abs(relativeY - targetY) < 60) {
        speak('Snap!');
        piece.style.left = (boardRect.left + targetX) + 'px';
        piece.style.top = (boardRect.top + targetY) + 'px';
        piece.style.pointerEvents = 'none'; 
        piece.style.border = "none"; 
        piece.classList.add('success-pulse');
        jigsawPiecesPlaced++;
        
        if (jigsawPiecesPlaced === 4) {
            playSuccess();
            speak(currentGroup.title);
            document.getElementById('jigsaw-msg').innerText = "Beautiful! 🌟";
            setTimeout(showMenu, 3500);
        }
    } else { piece.style.top = '70%'; }
}

// ==========================================
// ✍️ TRACING ENGINE & GHOST ANIMATION
// ==========================================
let smoothStrokes=[], currStroke=0, currWP=0, drawn=[], isFinished=false;

function startTracing() { 
    menuScreen.classList.remove('active-screen'); 
    tracingScreen.classList.add('active-screen'); 
    currentItemIndex = 0; 
    document.getElementById('tracing-title').innerText = currentGroup.title; 
    canvas.width=canvas.parentElement.clientWidth; 
    canvas.height=canvas.parentElement.clientHeight; 
    loadLetter(); 
}

function loadLetter() { 
    currStroke=0; currWP=0; drawn=[]; isFinished=false; 
    document.getElementById('tracing-msg').innerText="Follow the glowing dot!"; 
    let char = currentGroup.items[currentItemIndex]; 
    if(traceData[char]) smoothStrokes = interpolateStrokes(traceData[char]); 
    animateCanvas(); 
}

function interpolateStrokes(rs) { 
    let g=[]; 
    rs.forEach(s=>{ 
        let ns=[]; 
        for(let i=0;i<s.length-1;i++){ 
            let p1=s[i],p2=s[i+1], dist=Math.hypot(p2.x-p1.x,p2.y-p1.y);
            // Increased dot density for perfectly smooth curves
            let steps=Math.max(Math.floor(dist/10), 1); 
            for(let j=0;j<steps;j++) ns.push({x:p1.x+(p2.x-p1.x)*(j/steps), y:p1.y+(p2.y-p1.y)*(j/steps)}); 
        } 
        ns.push(s[s.length-1]); 
        g.push(ns); 
    }); 
    return g; 
}

function animateCanvas() {
    if(isFinished) return; 
    ctx.clearRect(0,0,canvas.width,canvas.height); 
    let char = currentGroup.items[currentItemIndex];
    
    // Background Guide Letter
    ctx.font=`bold ${canvas.height*0.75}px 'Comic Sans MS'`; 
    ctx.textAlign="center"; ctx.textBaseline="middle"; 
    ctx.lineCap="round"; ctx.lineJoin="round"; 
    ctx.lineWidth=45; ctx.strokeStyle="#EAEAEA"; 
    ctx.strokeText(char,canvas.width/2,canvas.height/2);
    
    if(smoothStrokes.length===0) return; 
    
    // Filled Paths
    ctx.strokeStyle="#087E8B"; ctx.lineWidth=55;
    drawn.forEach(p=>{ 
        ctx.beginPath(); ctx.moveTo(p[0].x+canvas.width/2,p[0].y+canvas.height/2); 
        for(let i=1;i<p.length;i++) ctx.lineTo(p[i].x+canvas.width/2,p[i].y+canvas.height/2); 
        ctx.stroke(); 
    });
    
    if(currStroke < smoothStrokes.length){
        let aS = smoothStrokes[currStroke]; 
        
        // Draw the remaining small breadcrumb dots
        for(let i=currWP;i<aS.length;i++){ 
            ctx.beginPath(); ctx.arc(aS[i].x+canvas.width/2,aS[i].y+canvas.height/2,6,0,Math.PI*2); 
            ctx.fillStyle="#FFCA3A"; ctx.fill(); 
        }
        
        // Draw the Target "Touch Here" Dot
        let tWP = aS[currWP]; 
        ctx.beginPath(); ctx.arc(tWP.x+canvas.width/2,tWP.y+canvas.height/2,18+(Math.sin(Date.now()/150)*5),0,Math.PI*2); 
        ctx.fillStyle="#FF5A5F"; ctx.fill(); 
        ctx.lineWidth=3; ctx.strokeStyle="white"; ctx.stroke();

        // 🌟 NEW: Draw the "Ghost Guide" Animation
        // This calculates a white dot that flies from the current finger position to the end of the stroke
        let remainingDots = aS.length - currWP;
        if (remainingDots > 5) { // Only show if there is enough line left to draw
            let progress = (Date.now() % 1500) / 1500; // Loops every 1.5 seconds
            let animIndex = currWP + Math.floor(progress * remainingDots);
            if (animIndex < aS.length) {
                let guideWP = aS[animIndex];
                ctx.beginPath();
                ctx.arc(guideWP.x + canvas.width/2, guideWP.y + canvas.height/2, 10, 0, Math.PI*2);
                ctx.fillStyle = "rgba(255, 255, 255, 0.9)"; // Glowing white
                ctx.shadowColor = "rgba(255, 255, 255, 1)";
                ctx.shadowBlur = 15;
                ctx.fill();
                ctx.shadowBlur = 0; // Reset shadow so it doesn't affect other drawings
            }
        }
    } 
    animationFrameId = requestAnimationFrame(animateCanvas);
}

canvas.addEventListener('touchmove', (e) => {
    if(currStroke>=smoothStrokes.length||isFinished) return; 
    e.preventDefault(); 
    let t=e.touches[0], r=canvas.getBoundingClientRect();
    let d=Math.sqrt(Math.pow((t.clientX-r.left-canvas.width/2)-smoothStrokes[currStroke][currWP].x,2) + Math.pow((t.clientY-r.top-canvas.height/2)-smoothStrokes[currStroke][currWP].y,2));
    
    // Smooth Hitbox
    if(d<55){ 
        currWP++; 
        if(currWP>=smoothStrokes[currStroke].length){ 
            drawn.push(smoothStrokes[currStroke]); 
            currStroke++; 
            currWP=0; 
            if(currStroke>=smoothStrokes.length){
                isFinished=true; 
                cancelAnimationFrame(animationFrameId); 
                ctx.clearRect(0,0,canvas.width,canvas.height); 
                ctx.fillStyle="#087E8B"; 
                ctx.fillText(currentGroup.items[currentItemIndex],canvas.width/2,canvas.height/2);
                playSuccess(); speak(currentGroup.items[currentItemIndex]); 
                document.getElementById('tracing-msg').innerText="Perfect! 🎉"; 
                setTimeout(()=>{ 
                    currentItemIndex++; 
                    if(currentItemIndex<currentGroup.items.length) loadLetter(); 
                    else showMenu(); 
                }, 2500);
            }
        }
    }
});

// Sorting Game Logic (Kept compact)
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

buildMenu();
