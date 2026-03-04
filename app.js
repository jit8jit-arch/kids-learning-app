// --- STATE & SETTINGS ---
const menuScreen = document.getElementById('menu-screen');
const tracingScreen = document.getElementById('tracing-screen');
const sortingScreen = document.getElementById('sorting-screen');
const jigsawScreen = document.getElementById('jigsaw-screen');
const canvas = document.getElementById('drawingCanvas');
const ctx = canvas.getContext('2d');

let completedSections = JSON.parse(localStorage.getItem('completed')) || {};
let animationFrameId;

// Sound Settings
let isSoundEnabled = localStorage.getItem('soundEnabled') !== 'false';

function updateSettingsUI() {
    const btn = document.getElementById('sound-toggle-btn');
    btn.innerText = isSoundEnabled ? '🔊 Sound: ON' : '🔇 Sound: OFF';
    btn.style.backgroundColor = isSoundEnabled ? '#087E8B' : '#95a5a6';
}

function toggleSound() {
    isSoundEnabled = !isSoundEnabled;
    localStorage.setItem('soundEnabled', isSoundEnabled);
    updateSettingsUI();
    if(isSoundEnabled) initAudio(); // Initialize on user interaction
}

function openSettings() { document.getElementById('settings-modal').style.display = 'flex'; updateSettingsUI(); }
function closeSettings() { document.getElementById('settings-modal').style.display = 'none'; }

// --- PROCEDURAL AUDIO ENGINE (International Standard) ---
let audioCtx;
let drawingOsc = null;
let drawingGain = null;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
}

// Plays a short UI pop/snap
function playTone(freq, type, duration, vol=0.1) {
    if (!isSoundEnabled) return;
    initAudio();
    let osc = audioCtx.createOscillator();
    let gainNode = audioCtx.createGain();
    osc.type = type; osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gainNode.gain.setValueAtTime(vol, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    osc.connect(gainNode); gainNode.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + duration);
}

function playPop() { playTone(600, 'sine', 0.1, 0.2); }
function playSnap() { playTone(800, 'triangle', 0.15, 0.2); playTone(1200, 'sine', 0.1, 0.1); }
function playSuccessChime() {
    if(!isSoundEnabled) return;
    setTimeout(()=>playTone(440, 'sine', 0.3, 0.2), 0);
    setTimeout(()=>playTone(554, 'sine', 0.3, 0.2), 150);
    setTimeout(()=>playTone(659, 'sine', 0.4, 0.2), 300);
    setTimeout(()=>playTone(880, 'sine', 0.6, 0.2), 450);
}

// Continuous Drawing Sound
function startDrawingSound() {
    if (!isSoundEnabled || drawingOsc) return;
    initAudio();
    drawingOsc = audioCtx.createOscillator();
    drawingGain = audioCtx.createGain();
    drawingOsc.type = 'triangle';
    drawingOsc.frequency.setValueAtTime(300, audioCtx.currentTime);
    drawingGain.gain.setValueAtTime(0, audioCtx.currentTime);
    drawingGain.gain.linearRampToValueAtTime(0.05, audioCtx.currentTime + 0.1); // Soft hum
    drawingOsc.connect(drawingGain); drawingGain.connect(audioCtx.destination);
    drawingOsc.start();
}
function stopDrawingSound() {
    if (drawingOsc && drawingGain) {
        drawingGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.1);
        setTimeout(() => { if(drawingOsc){ drawingOsc.stop(); drawingOsc = null; } }, 100);
    }
}

function playSuccessAnim() {
    if(isSoundEnabled) playSuccessChime();
    confetti({ particleCount: 250, spread: 100, origin: { y: 0.5 }, colors: ['#FF5A5F', '#FFCA3A', '#087E8B', '#ffffff'] });
}
function speak(text) {
    if (!isSoundEnabled) return;
    let utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.85; utterance.pitch = 1.1;
    speechSynthesis.speak(utterance);
}

// --- DATA ---
const traceData = {
    '1': [ [ {x: 0, y: -90}, {x: 0, y: 90} ] ],
    '2': [ [ {x: -35, y: -60}, {x: -15, y: -90}, {x: 15, y: -90}, {x: 35, y: -60}, {x: 35, y: -20}, {x: -35, y: 90}, {x: 40, y: 90} ] ],
    '3': [ [ {x: -35, y: -70}, {x: -15, y: -90}, {x: 15, y: -90}, {x: 35, y: -60}, {x: 15, y: -10}, {x: 0, y: 0} ], [ {x: 0, y: 0}, {x: 25, y: 15}, {x: 35, y: 50}, {x: 15, y: 90}, {x: -15, y: 90}, {x: -35, y: 70} ] ],
    'A': [ [ {x: 0, y: -90}, {x: -50, y: 90} ], [ {x: 0, y: -90}, {x: 50, y: 90} ], [ {x: -25, y: 20}, {x: 25, y: 20} ] ],
    'B': [ [ {x: -35, y: -90}, {x: -35, y: 90} ], [ {x: -35, y: -90}, {x: 15, y: -90}, {x: 35, y: -50}, {x: 15, y: -10}, {x: -35, y: -10} ], [ {x: -35, y: -10}, {x: 25, y: -10}, {x: 45, y: 40}, {x: 25, y: 90}, {x: -35, y: 90} ] ]
};

const jigsawImages = [
    { title: 'Tiger', url: 'https://images.pexels.com/photos/2541239/pexels-photo-2541239.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop' },
    { title: 'Panda', url: 'https://images.pexels.com/photos/1661535/pexels-photo-1661535.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop' }
];

const appStructure = [
    { category: "Trace Numbers", games: [ { type: 'trace', title: 'Numbers 1-3', items: ['1', '2', '3'], icon: '🔢' } ] },
    { category: "Trace Letters", games: [ { type: 'trace', title: 'Letters A & B', items: ['A', 'B'], icon: '🅰️' } ] },
    { category: "Sort & Match", games: [ { type: 'sort', title: 'Mega Sorting', icon: '🧺' } ] },
    { category: "Picture Puzzles", games: [ { type: 'jigsaw', title: 'Tiger', imgIndex: 0, icon: '🐯' }, { type: 'jigsaw', title: 'Panda', imgIndex: 1, icon: '🐼' } ] }
];

let currentGroup = null;

// --- MENU LOGIC ---
function buildMenu() {
    const container = document.getElementById('menu-container');
    container.innerHTML = '';
    appStructure.forEach(section => {
        let title = document.createElement('div'); title.className = 'category-title'; title.innerText = section.category; container.appendChild(title);
        let grid = document.createElement('div'); grid.className = 'grid';
        section.games.forEach((game) => {
            let btn = document.createElement('button'); btn.className = 'menu-btn';
            btn.innerHTML = `<span class="menu-icon">${game.icon}</span><span>${game.title}</span>`;
            btn.onclick = () => {
                initAudio(); // Initialize audio engine on first real click
                playPop();
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
    cancelAnimationFrame(animationFrameId); stopDrawingSound();
    tracingScreen.classList.remove('active-screen'); sortingScreen.classList.remove('active-screen'); jigsawScreen.classList.remove('active-screen');
    menuScreen.classList.add('active-screen'); buildMenu();
}

function resetSection() {
    if (currentGroup) {
        playPop();
        if (currentGroup.type === 'trace') startTracing(); else if (currentGroup.type === 'sort') startSorting(); else if (currentGroup.type === 'jigsaw') startJigsaw();
    }
}

// ==========================================
// 🧺 MEGA SORTING GAME (12 Items!)
// ==========================================
const fullSortPool = [
    {e:'🍎',t:'fruit'}, {e:'🍌',t:'fruit'}, {e:'🍇',t:'fruit'}, {e:'🍓',t:'fruit'}, {e:'🍉',t:'fruit'}, {e:'🍒',t:'fruit'}, {e:'🥝',t:'fruit'}, {e:'🍍',t:'fruit'},
    {e:'🐶',t:'animal'}, {e:'🐱',t:'animal'}, {e:'🐸',t:'animal'}, {e:'🦁',t:'animal'}, {e:'🐼',t:'animal'}, {e:'🐷',t:'animal'}, {e:'🐙',t:'animal'}, {e:'🦊',t:'animal'}
];

function startSorting() {
    menuScreen.classList.remove('active-screen'); sortingScreen.classList.add('active-screen'); 
    document.getElementById('sorting-msg').innerText = "Match 12 Items!";
    const area = document.getElementById('sorting-area'); document.querySelectorAll('.sort-item').forEach(el => el.remove()); 
    
    let placed = 0;
    // Pick exactly 12 items for a crowded, fun screen
    let activeItems = fullSortPool.sort(() => 0.5 - Math.random()).slice(0, 12);

    activeItems.forEach((item, i) => {
        let el = document.createElement('div'); el.className = 'sort-item'; el.innerText = item.e; el.dataset.type = item.t;
        
        // Spread across the entire bottom half
        el.style.left = (Math.random()*75+5)+'%'; el.style.top = (Math.random()*45+45)+'%';
        
        // Dynamic floating physics
        let floatSpeed = (Math.random() * 2 + 2).toFixed(1);
        el.style.animation = `popIn 0.5s forwards, float ${floatSpeed}s ease-in-out ${Math.random()}s infinite`;

        el.addEventListener('touchstart', (e) => { 
            playTone(300, 'sine', 0.1); // Pick up sound
            el.style.transform="scale(1.4)"; el.style.animation="none"; el.style.zIndex="100"; 
        });
        el.addEventListener('touchmove', (e) => { 
            e.preventDefault(); 
            el.style.left=(e.touches[0].clientX-40)+'px'; el.style.top=(e.touches[0].clientY-100)+'px'; 
        });
        el.addEventListener('touchend', (e) => {
            el.style.transform="scale(1)"; el.style.zIndex="1";
            let fZ = document.getElementById('zone-fruits').getBoundingClientRect(), aZ = document.getElementById('zone-animals').getBoundingClientRect();
            let touch = e.changedTouches[0], inF = touch.clientX>fZ.left && touch.clientX<fZ.right && touch.clientY>fZ.top && touch.clientY<fZ.bottom;
            let inA = touch.clientX>aZ.left && touch.clientX<aZ.right && touch.clientY>aZ.top && touch.clientY<aZ.bottom;
            
            if ((item.t==='fruit'&&inF) || (item.t==='animal'&&inA)) {
                playSnap(); // Drop sound
                el.style.pointerEvents='none'; 
                el.style.left = (item.t==='fruit'?fZ.left:aZ.left) + 20 + (Math.random()*40) + 'px'; 
                el.style.top = fZ.top + 20 + (Math.random()*40) + 'px'; 
                placed++;
                if(placed===12){ 
                    playSuccessAnim(); speak('Incredible!'); 
                    document.getElementById('sorting-msg').innerText = "You did it! 🌟";
                    setTimeout(showMenu,3500); 
                }
            } else { 
                playTone(200, 'sawtooth', 0.2); // Error bump sound
                el.style.animation=`float ${floatSpeed}s infinite`; 
            }
        }); 
        area.appendChild(el);
    });
}

// ==========================================
// 🧩 JIGSAW PUZZLE ENGINE
// ==========================================
function startJigsaw() {
    menuScreen.classList.remove('active-screen'); jigsawScreen.classList.add('active-screen');
    document.getElementById('jigsaw-title').innerText = currentGroup.title; document.getElementById('jigsaw-msg').innerText = "Make the picture!";
    const board = document.getElementById('jigsaw-board'); const area = document.getElementById('jigsaw-area');
    const imgObj = jigsawImages[currentGroup.imgIndex];
    board.style.backgroundImage = `url('${imgObj.url}')`;
    document.querySelectorAll('.jigsaw-piece').forEach(el => el.remove());
    let placed = 0; const positions = [ { id: 0, x: 0, y: 0 }, { id: 1, x: 160, y: 0 }, { id: 2, x: 0, y: 160 }, { id: 3, x: 160, y: 160 } ];

    positions.forEach((pos, index) => {
        let piece = document.createElement('div'); piece.className = 'jigsaw-piece';
        piece.style.backgroundImage = `url('${imgObj.url}')`; piece.style.backgroundPosition = `-${pos.x}px -${pos.y}px`;
        piece.style.left = (Math.random() * 50 + 10) + '%'; piece.style.top = (Math.random() * 20 + 60) + '%';
        piece.style.animation = `popIn 0.5s ${index*0.1}s forwards`; piece.dataset.tx = pos.x; piece.dataset.ty = pos.y;
        
        piece.addEventListener('touchstart', () => { playTone(300, 'sine', 0.1); piece.style.transform = "scale(1.1)"; piece.style.zIndex = "100"; });
        piece.addEventListener('touchmove', (e) => { e.preventDefault(); piece.style.left = (e.touches[0].clientX - 80) + 'px'; piece.style.top = (e.touches[0].clientY - 80) + 'px'; });
        piece.addEventListener('touchend', (e) => {
            piece.style.transform = "scale(1)"; piece.style.zIndex = "5";
            let bR = board.getBoundingClientRect(), pR = piece.getBoundingClientRect();
            if (Math.abs((pR.left - bR.left) - pos.x) < 60 && Math.abs((pR.top - bR.top) - pos.y) < 60) {
                playSnap(); piece.style.left = (bR.left + pos.x) + 'px'; piece.style.top = (bR.top + pos.y) + 'px';
                piece.style.pointerEvents = 'none'; piece.style.border = "none"; piece.style.boxShadow = "none";
                placed++; if (placed === 4) { playSuccessAnim(); speak(currentGroup.title); document.getElementById('jigsaw-msg').innerText = "Beautiful! 🌟"; setTimeout(showMenu, 3500); }
            } else { playTone(200, 'sawtooth', 0.2); piece.style.top = '70%'; }
        }); area.appendChild(piece);
    });
}

// ==========================================
// ✍️ TRACING ENGINE (With Audio integration)
// ==========================================
let smoothStrokes=[], currStroke=0, currWP=0, drawn=[], isFinished=false;

function startTracing() { 
    menuScreen.classList.remove('active-screen'); tracingScreen.classList.add('active-screen'); 
    currentItemIndex = 0; document.getElementById('tracing-title').innerText = currentGroup.title; 
    canvas.width=canvas.parentElement.clientWidth; canvas.height=canvas.parentElement.clientHeight; 
    loadLetter(); 
}

function loadLetter() { 
    currStroke=0; currWP=0; drawn=[]; isFinished=false; stopDrawingSound();
    document.getElementById('tracing-msg').innerText="Follow the dot!"; 
    let char = currentGroup.items[currentItemIndex]; 
    if(traceData[char]) smoothStrokes = interpolateStrokes(traceData[char]); 
    animateCanvas(); 
}

function interpolateStrokes(rs) { 
    let g=[]; rs.forEach(s=>{ let ns=[]; 
        for(let i=0;i<s.length-1;i++){ 
            let p1=s[i],p2=s[i+1], dist=Math.hypot(p2.x-p1.x,p2.y-p1.y), steps=Math.max(Math.floor(dist/10), 1); 
            for(let j=0;j<steps;j++) ns.push({x:p1.x+(p2.x-p1.x)*(j/steps), y:p1.y+(p2.y-p1.y)*(j/steps)}); 
        } ns.push(s[s.length-1]); g.push(ns); 
    }); return g; 
}

function animateCanvas() {
    if(isFinished) return; 
    ctx.clearRect(0,0,canvas.width,canvas.height); let char = currentGroup.items[currentItemIndex];
    ctx.font=`bold ${canvas.height*0.75}px 'Nunito', 'Comic Sans MS'`; ctx.textAlign="center"; ctx.textBaseline="middle"; 
    ctx.lineCap="round"; ctx.lineJoin="round"; ctx.lineWidth=50; ctx.strokeStyle="#EAEAEA"; ctx.strokeText(char,canvas.width/2,canvas.height/2);
    if(smoothStrokes.length===0) return; 
    
    ctx.strokeStyle="#087E8B"; ctx.lineWidth=60;
    drawn.forEach(p=>{ ctx.beginPath(); ctx.moveTo(p[0].x+canvas.width/2,p[0].y+canvas.height/2); for(let i=1;i<p.length;i++) ctx.lineTo(p[i].x+canvas.width/2,p[i].y+canvas.height/2); ctx.stroke(); });
    
    if(currStroke < smoothStrokes.length){
        let aS = smoothStrokes[currStroke]; 
        for(let i=currWP;i<aS.length;i++){ ctx.beginPath(); ctx.arc(aS[i].x+canvas.width/2,aS[i].y+canvas.height/2,8,0,Math.PI*2); ctx.fillStyle="#FFCA3A"; ctx.fill(); }
        let tWP = aS[currWP]; ctx.beginPath(); ctx.arc(tWP.x+canvas.width/2,tWP.y+canvas.height/2,20+(Math.sin(Date.now()/150)*5),0,Math.PI*2); ctx.fillStyle="#FF5A5F"; ctx.fill(); ctx.lineWidth=4; ctx.strokeStyle="white"; ctx.stroke();
    } animationFrameId = requestAnimationFrame(animateCanvas);
}

canvas.addEventListener('touchstart', () => { startDrawingSound(); });
canvas.addEventListener('touchend', () => { stopDrawingSound(); });

canvas.addEventListener('touchmove', (e) => {
    if(currStroke>=smoothStrokes.length||isFinished) return; e.preventDefault(); 
    let t=e.touches[0], r=canvas.getBoundingClientRect();
    let d=Math.sqrt(Math.pow((t.clientX-r.left-canvas.width/2)-smoothStrokes[currStroke][currWP].x,2) + Math.pow((t.clientY-r.top-canvas.height/2)-smoothStrokes[currStroke][currWP].y,2));
    
    // Slight modulation of sound for fun
    if (drawingOsc) drawingOsc.frequency.setValueAtTime(300 + (currWP * 2), audioCtx.currentTime);

    if(d<60){ 
        currWP++; 
        if(currWP>=smoothStrokes[currStroke].length){ 
            drawn.push(smoothStrokes[currStroke]); currStroke++; currWP=0; stopDrawingSound(); playSnap();
            if(currStroke>=smoothStrokes.length){
                isFinished=true; cancelAnimationFrame(animationFrameId); 
                ctx.clearRect(0,0,canvas.width,canvas.height); ctx.fillStyle="#087E8B"; ctx.fillText(currentGroup.items[currentItemIndex],canvas.width/2,canvas.height/2);
                playSuccessAnim(); speak(currentGroup.items[currentItemIndex]); document.getElementById('tracing-msg').innerText="Perfect! 🎉"; 
                setTimeout(()=>{ currentItemIndex++; if(currentItemIndex<currentGroup.items.length) loadLetter(); else showMenu(); }, 2500);
            }
        }
    }
});

buildMenu(); updateSettingsUI();
