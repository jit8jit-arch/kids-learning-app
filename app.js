// --- STATE & SETTINGS ---
const menuScreen = document.getElementById('menu-screen');
const tracingScreen = document.getElementById('tracing-screen');
const sortingScreen = document.getElementById('sorting-screen');
const jigsawScreen = document.getElementById('jigsaw-screen');
const canvas = document.getElementById('drawingCanvas');
const ctx = canvas.getContext('2d');

let completedSections = JSON.parse(localStorage.getItem('completed')) || {};
let animationFrameId;
let isSoundEnabled = localStorage.getItem('soundEnabled') !== 'false';

function updateSettingsUI() {
    const btn = document.getElementById('sound-toggle-btn');
    btn.innerText = isSoundEnabled ? '🔊 Sound: ON' : '🔇 Sound: OFF';
    btn.style.backgroundColor = isSoundEnabled ? '#087E8B' : '#95a5a6';
}
function toggleSound() { isSoundEnabled = !isSoundEnabled; localStorage.setItem('soundEnabled', isSoundEnabled); updateSettingsUI(); if(isSoundEnabled) initAudio(); }
function openSettings() { document.getElementById('settings-modal').style.display = 'flex'; updateSettingsUI(); }
function closeSettings() { document.getElementById('settings-modal').style.display = 'none'; }

// --- PROCEDURAL AUDIO ENGINE ---
let audioCtx, drawingOsc = null, drawingGain = null;
function initAudio() { if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); if (audioCtx.state === 'suspended') audioCtx.resume(); }
function playTone(freq, type, duration, vol=0.1) {
    if (!isSoundEnabled) return; initAudio();
    let osc = audioCtx.createOscillator(), gainNode = audioCtx.createGain();
    osc.type = type; osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gainNode.gain.setValueAtTime(vol, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    osc.connect(gainNode); gainNode.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + duration);
}
function playPop() { playTone(600, 'sine', 0.1, 0.2); }
function playSnap() { playTone(800, 'triangle', 0.15, 0.2); playTone(1200, 'sine', 0.1, 0.1); }
function playError() { playTone(200, 'sawtooth', 0.2, 0.1); }
function playSuccessChime() {
    if(!isSoundEnabled) return;
    setTimeout(()=>playTone(440, 'sine', 0.3, 0.2), 0); setTimeout(()=>playTone(554, 'sine', 0.3, 0.2), 150);
    setTimeout(()=>playTone(659, 'sine', 0.4, 0.2), 300); setTimeout(()=>playTone(880, 'sine', 0.6, 0.2), 450);
}
function startDrawingSound() {
    if (!isSoundEnabled || drawingOsc) return; initAudio();
    drawingOsc = audioCtx.createOscillator(); drawingGain = audioCtx.createGain();
    drawingOsc.type = 'triangle'; drawingOsc.frequency.setValueAtTime(300, audioCtx.currentTime);
    drawingGain.gain.setValueAtTime(0, audioCtx.currentTime); drawingGain.gain.linearRampToValueAtTime(0.05, audioCtx.currentTime + 0.1);
    drawingOsc.connect(drawingGain); drawingGain.connect(audioCtx.destination); drawingOsc.start();
}
function stopDrawingSound() {
    if (drawingOsc && drawingGain) {
        drawingGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.1);
        setTimeout(() => { if(drawingOsc){ drawingOsc.stop(); drawingOsc = null; } }, 100);
    }
}
function playSuccessAnim() { if(isSoundEnabled) playSuccessChime(); confetti({ particleCount: 250, spread: 100, origin: { y: 0.5 } }); }
function speak(text) { if (!isSoundEnabled) return; let u = new SpeechSynthesisUtterance(text); u.rate = 0.85; u.pitch = 1.1; speechSynthesis.speak(u); }

// --- THE MASSIVE TRACING DATA COMPENDIUM ---
const traceData = {
    '1': [[{x:0,y:-90},{x:0,y:90}]], '2': [[{x:-35,y:-60},{x:0,y:-90},{x:35,y:-60},{x:-35,y:90},{x:40,y:90}]], '3': [[{x:-35,y:-70},{x:0,y:-90},{x:35,y:-60},{x:0,y:0}], [{x:0,y:0},{x:35,y:40},{x:0,y:90},{x:-35,y:70}]], '4': [[{x:20,y:90},{x:20,y:-90},{x:-40,y:20},{x:40,y:20}]], '5': [[{x:35,y:-90},{x:-20,y:-90},{x:-20,y:0},{x:35,y:20},{x:15,y:90},{x:-35,y:70}]],
    '6': [[{x:30,y:-80},{x:-35,y:20},{x:-15,y:90},{x:35,y:60},{x:-15,y:-10}]], '7': [[{x:-35,y:-90},{x:35,y:-90},{x:-15,y:90}]], '8': [[{x:0,y:-90},{x:-30,y:-45},{x:30,y:45},{x:0,y:90},{x:-30,y:45},{x:30,y:-45},{x:0,y:-90}]], '9': [[{x:30,y:90},{x:30,y:-30},{x:-30,y:-30},{x:30,y:-30}]], '10': [[{x:-40,y:-90},{x:-40,y:90}], [{x:35,y:-90},{x:-5,y:-40},{x:-5,y:40},{x:35,y:90},{x:55,y:40},{x:55,y:-40},{x:35,y:-90}]],
    'A': [[{x:0,y:-90},{x:-50,y:90}], [{x:0,y:-90},{x:50,y:90}], [{x:-25,y:20},{x:25,y:20}]], 'B': [[{x:-35,y:-90},{x:-35,y:90}], [{x:-35,y:-90},{x:35,y:-50},{x:-35,y:-10}], [{x:-35,y:-10},{x:45,y:40},{x:-35,y:90}]], 'C': [[{x:35,y:-70},{x:-35,y:-50},{x:-35,y:50},{x:35,y:70}]], 'D': [[{x:-35,y:-90},{x:-35,y:90}], [{x:-35,y:-90},{x:45,y:-40},{x:45,y:40},{x:-35,y:90}]],
    'E': [[{x:-35,y:-90},{x:-35,y:90}], [{x:-35,y:-90},{x:30,y:-90}], [{x:-35,y:0},{x:20,y:0}], [{x:-35,y:90},{x:30,y:90}]], 'F': [[{x:-35,y:-90},{x:-35,y:90}], [{x:-35,y:-90},{x:30,y:-90}], [{x:-35,y:0},{x:20,y:0}]], 'G': [[{x:35,y:-70},{x:-35,y:-50},{x:-35,y:50},{x:35,y:70},{x:35,y:10}], [{x:35,y:10},{x:0,y:10}]],
    'H': [[{x:-30,y:-90},{x:-30,y:90}], [{x:30,y:-90},{x:30,y:90}], [{x:-30,y:0},{x:30,y:0}]], 'I': [[{x:0,y:-90},{x:0,y:90}], [{x:-20,y:-90},{x:20,y:-90}], [{x:-20,y:90},{x:20,y:90}]], 'J': [[{x:20,y:-90},{x:20,y:50},{x:-20,y:90},{x:-40,y:50}], [{x:-10,y:-90},{x:50,y:-90}]], 'K': [[{x:-30,y:-90},{x:-30,y:90}], [{x:30,y:-90},{x:-30,y:10}], [{x:-10,y:-10},{x:40,y:90}]],
    'L': [[{x:-30,y:-90},{x:-30,y:90}], [{x:-30,y:90},{x:40,y:90}]], 'M': [[{x:-40,y:90},{x:-40,y:-90}], [{x:-40,y:-90},{x:0,y:20}], [{x:0,y:20},{x:40,y:-90}], [{x:40,y:-90},{x:40,y:90}]], 'N': [[{x:-30,y:90},{x:-30,y:-90}], [{x:-30,y:-90},{x:30,y:90}], [{x:30,y:90},{x:30,y:-90}]], 'O': [[{x:0,y:-90},{x:-40,y:-40},{x:-40,y:40},{x:0,y:90},{x:40,y:40},{x:40,y:-40},{x:0,y:-90}]],
    'P': [[{x:-30,y:-90},{x:-30,y:90}], [{x:-30,y:-90},{x:30,y:-50},{x:-30,y:-10}]], 'Q': [[{x:0,y:-90},{x:-40,y:-40},{x:-40,y:40},{x:0,y:90},{x:40,y:40},{x:40,y:-40},{x:0,y:-90}], [{x:10,y:40},{x:40,y:90}]], 'R': [[{x:-30,y:-90},{x:-30,y:90}], [{x:-30,y:-90},{x:30,y:-50},{x:-30,y:-10}], [{x:-10,y:-10},{x:30,y:90}]],
    'S': [[{x:30,y:-60},{x:0,y:-90},{x:-30,y:-50},{x:0,y:0},{x:30,y:50},{x:0,y:90},{x:-30,y:60}]], 'T': [[{x:0,y:-90},{x:0,y:90}], [{x:-40,y:-90},{x:40,y:-90}]], 'U': [[{x:-35,y:-90},{x:-35,y:40},{x:0,y:90},{x:35,y:40},{x:35,y:-90}]], 'V': [[{x:-40,y:-90},{x:0,y:90}], [{x:40,y:-90},{x:0,y:90}]],
    'W': [[{x:-45,y:-90},{x:-25,y:90}], [{x:-25,y:90},{x:0,y:0}], [{x:0,y:0},{x:25,y:90}], [{x:25,y:90},{x:45,y:-90}]], 'X': [[{x:-35,y:-90},{x:35,y:90}], [{x:35,y:-90},{x:-35,y:90}]], 'Y': [[{x:-40,y:-90},{x:0,y:10}], [{x:40,y:-90},{x:0,y:10}], [{x:0,y:10},{x:0,y:90}]], 'Z': [[{x:-35,y:-90},{x:35,y:-90}], [{x:35,y:-90},{x:-35,y:90}], [{x:-35,y:90},{x:35,y:90}]]
};

// 🌟 THE MASSIVE APP STRUCTURE (10+ Sections per Game!)
const appStructure = [
    {
        category: "Trace Numbers",
        games: [
            { type: 'trace', title: 'Numbers 1-2', items: ['1','2'], icon: '1️⃣' },
            { type: 'trace', title: 'Numbers 3-4', items: ['3','4'], icon: '3️⃣' },
            { type: 'trace', title: 'Numbers 5-6', items: ['5','6'], icon: '5️⃣' },
            { type: 'trace', title: 'Numbers 7-8', items: ['7','8'], icon: '7️⃣' },
            { type: 'trace', title: 'Numbers 9-10', items: ['9','10'], icon: '🔟' }
        ]
    },
    {
        category: "Trace Letters",
        games: [
            { type: 'trace', title: 'Letters A-D', items: ['A','B','C','D'], icon: '🅰️' },
            { type: 'trace', title: 'Letters E-H', items: ['E','F','G','H'], icon: '🅴' },
            { type: 'trace', title: 'Letters I-L', items: ['I','J','K','L'], icon: '🅸' },
            { type: 'trace', title: 'Letters M-P', items: ['M','N','O','P'], icon: '🅼' },
            { type: 'trace', title: 'Letters Q-T', items: ['Q','R','S','T'], icon: '🆀' },
            { type: 'trace', title: 'Letters U-X', items: ['U','V','W','X'], icon: '🆄' },
            { type: 'trace', title: 'Letters Y-Z', items: ['Y','Z'], icon: '🆈' }
        ]
    },
    {
        category: "Dynamic Sorting",
        games: [
            { type: 'sort', title: 'Fruits vs Animals', icon: '🍎', 
              z1:{ id:'fruit', label:'🍎 Fruits', bg:'linear-gradient(135deg, #ff9a9e, #fecfef)' }, 
              z2:{ id:'animal', label:'🐶 Animals', bg:'linear-gradient(135deg, #4facfe, #00f2fe)' },
              pool: [{e:'🍌',t:'fruit'},{e:'🍉',t:'fruit'},{e:'🍒',t:'fruit'},{e:'🐱',t:'animal'},{e:'🦁',t:'animal'},{e:'🐸',t:'animal'}] },
            { type: 'sort', title: 'Sea vs Sky', icon: '🌊', 
              z1:{ id:'sea', label:'🐟 Sea', bg:'linear-gradient(135deg, #89f7fe, #66a6ff)' }, 
              z2:{ id:'sky', label:'🦅 Sky', bg:'linear-gradient(135deg, #e0c3fc, #8ec5fc)' },
              pool: [{e:'🐬',t:'sea'},{e:'🐳',t:'sea'},{e:'🐙',t:'sea'},{e:'🦅',t:'sky'},{e:'🦉',t:'sky'},{e:'🦇',t:'sky'}] },
            { type: 'sort', title: 'Vehicles vs Food', icon: '🚗', 
              z1:{ id:'veh', label:'🚗 Vehicles', bg:'linear-gradient(135deg, #f6d365, #fda085)' }, 
              z2:{ id:'food', label:'🍔 Food', bg:'linear-gradient(135deg, #ff0844, #ffb199)' },
              pool: [{e:'🚕',t:'veh'},{e:'🚓',t:'veh'},{e:'✈️',t:'veh'},{e:'🍕',t:'food'},{e:'🍟',t:'food'},{e:'🌭',t:'food'}] },
            { type: 'sort', title: 'Bugs vs Flowers', icon: '🐛', 
              z1:{ id:'bug', label:'🐛 Bugs', bg:'linear-gradient(135deg, #d4fc79, #96e6a1)' }, 
              z2:{ id:'flow', label:'🌸 Flowers', bg:'linear-gradient(135deg, #fccb90, #d57eeb)' },
              pool: [{e:'🦋',t:'bug'},{e:'🐞',t:'bug'},{e:'🐝',t:'bug'},{e:'🌻',t:'flow'},{e:'🌹',t:'flow'},{e:'🌷',t:'flow'}] },
            { type: 'sort', title: 'Space vs Earth', icon: '🚀', 
              z1:{ id:'space', label:'🚀 Space', bg:'linear-gradient(135deg, #30cfd0, #330867)' }, 
              z2:{ id:'earth', label:'🌍 Earth', bg:'linear-gradient(135deg, #43e97b, #38f9d7)' },
              pool: [{e:'👽',t:'space'},{e:'🛸',t:'space'},{e:'⭐',t:'space'},{e:'🌲',t:'earth'},{e:'⛰️',t:'earth'},{e:'🏠',t:'earth'}] },
            { type: 'sort', title: 'Hot vs Cold', icon: '🔥', 
              z1:{ id:'hot', label:'🔥 Hot', bg:'linear-gradient(135deg, #f83600, #f9d423)' }, 
              z2:{ id:'cold', label:'❄️ Cold', bg:'linear-gradient(135deg, #00c6ff, #0072ff)' },
              pool: [{e:'☀️',t:'hot'},{e:'☕',t:'hot'},{e:'🌶️',t:'hot'},{e:'⛄',t:'cold'},{e:'🧊',t:'cold'},{e:'🍦',t:'cold'}] }
        ]
    },
    {
        category: "Picture Puzzles",
        games: [
            { type: 'jigsaw', title: 'Tiger', url: 'https://images.pexels.com/photos/2541239/pexels-photo-2541239.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop', icon: '🐯' },
            { type: 'jigsaw', title: 'Panda', url: 'https://images.pexels.com/photos/1661535/pexels-photo-1661535.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop', icon: '🐼' },
            { type: 'jigsaw', title: 'Rabbit', url: 'https://images.pexels.com/photos/326012/pexels-photo-326012.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop', icon: '🐰' },
            { type: 'jigsaw', title: 'Elephant', url: 'https://images.pexels.com/photos/1054655/pexels-photo-1054655.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop', icon: '🐘' },
            { type: 'jigsaw', title: 'Lion', url: 'https://images.pexels.com/photos/247502/pexels-photo-247502.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop', icon: '🦁' },
            { type: 'jigsaw', title: 'Monkey', url: 'https://images.pexels.com/photos/1207875/pexels-photo-1207875.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop', icon: '🐵' },
            { type: 'jigsaw', title: 'Puppy', url: 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop', icon: '🐶' },
            { type: 'jigsaw', title: 'Kitten', url: 'https://images.pexels.com/photos/104827/cat-pet-animal-domestic-104827.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop', icon: '🐱' },
            { type: 'jigsaw', title: 'Dolphin', url: 'https://images.pexels.com/photos/64219/dolphin-marine-mammals-water-sea-64219.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop', icon: '🐬' },
            { type: 'jigsaw', title: 'Penguin', url: 'https://images.pexels.com/photos/689784/pexels-photo-689784.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop', icon: '🐧' },
            { type: 'jigsaw', title: 'Turtle', url: 'https://images.pexels.com/photos/1618606/pexels-photo-1618606.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop', icon: '🐢' }
        ]
    }
];

let currentGroup = null;

// --- MENU LOGIC ---
function buildMenu() {
    const container = document.getElementById('menu-container'); container.innerHTML = '';
    appStructure.forEach(section => {
        let title = document.createElement('div'); title.className = 'category-title'; title.innerText = section.category; container.appendChild(title);
        let grid = document.createElement('div'); grid.className = 'grid';
        section.games.forEach((game) => {
            let btn = document.createElement('button'); btn.className = 'menu-btn';
            let badge = completedSections[game.title] ? '<span class="finished-badge">✔ Done</span>' : '';
            btn.innerHTML = `<span class="menu-icon">${game.icon}</span><span>${game.title}</span>${badge}`;
            btn.onclick = () => { initAudio(); playPop(); currentGroup = game;
                if (game.type === 'trace') startTracing(); if (game.type === 'sort') startSorting(); if (game.type === 'jigsaw') startJigsaw();
            }; grid.appendChild(btn);
        }); container.appendChild(grid);
    });
}

function showMenu() {
    cancelAnimationFrame(animationFrameId); stopDrawingSound();
    tracingScreen.classList.remove('active-screen'); sortingScreen.classList.remove('active-screen'); jigsawScreen.classList.remove('active-screen');
    menuScreen.classList.add('active-screen'); buildMenu();
}
function resetSection() { if (currentGroup) { playPop(); if (currentGroup.type === 'trace') startTracing(); else if (currentGroup.type === 'sort') startSorting(); else if (currentGroup.type === 'jigsaw') startJigsaw(); } }

// ==========================================
// 🧺 DYNAMIC SORTING ENGINE
// ==========================================
function startSorting() {
    menuScreen.classList.remove('active-screen'); sortingScreen.classList.add('active-screen'); 
    document.getElementById('sorting-msg').innerText = "Sort the items!";
    
    // Dynamically build the Drop Zones
    const dzContainer = document.getElementById('dynamic-drop-zones');
    dzContainer.innerHTML = '';
    
    let z1 = document.createElement('div'); z1.className = 'zone'; z1.id = 'zone-1'; z1.innerHTML = currentGroup.z1.label; z1.style.background = currentGroup.z1.bg;
    let z2 = document.createElement('div'); z2.className = 'zone'; z2.id = 'zone-2'; z2.innerHTML = currentGroup.z2.label; z2.style.background = currentGroup.z2.bg;
    dzContainer.appendChild(z1); dzContainer.appendChild(z2);

    const area = document.getElementById('sorting-area'); document.querySelectorAll('.sort-item').forEach(el => el.remove()); 
    let placed = 0;
    
    // Duplicate pool to ensure a crowded 12-item screen
    let activeItems = [...currentGroup.pool, ...currentGroup.pool].sort(() => 0.5 - Math.random());

    activeItems.forEach((item, i) => {
        let el = document.createElement('div'); el.className = 'sort-item'; el.innerText = item.e; el.dataset.type = item.t;
        el.style.left = (Math.random()*75+5)+'%'; el.style.top = (Math.random()*40+45)+'%';
        let floatSpeed = (Math.random() * 2 + 2).toFixed(1);
        el.style.animation = `popIn 0.5s forwards, float ${floatSpeed}s ease-in-out ${Math.random()}s infinite`;

        el.addEventListener('touchstart', (e) => { playTone(300, 'sine', 0.1); el.style.transform="scale(1.4)"; el.style.animation="none"; el.style.zIndex="100"; });
        el.addEventListener('touchmove', (e) => { e.preventDefault(); el.style.left=(e.touches[0].clientX-40)+'px'; el.style.top=(e.touches[0].clientY-100)+'px'; });
        el.addEventListener('touchend', (e) => {
            el.style.transform="scale(1)"; el.style.zIndex="1";
            let r1 = z1.getBoundingClientRect(), r2 = z2.getBoundingClientRect();
            let touch = e.changedTouches[0];
            let in1 = touch.clientX>r1.left && touch.clientX<r1.right && touch.clientY>r1.top && touch.clientY<r1.bottom;
            let in2 = touch.clientX>r2.left && touch.clientX<r2.right && touch.clientY>r2.top && touch.clientY<r2.bottom;
            
            if ((item.t===currentGroup.z1.id && in1) || (item.t===currentGroup.z2.id && in2)) {
                playSnap(); el.style.pointerEvents='none'; 
                el.style.left = (item.t===currentGroup.z1.id ? r1.left : r2.left) + 20 + (Math.random()*40) + 'px'; 
                el.style.top = r1.top + 20 + (Math.random()*40) + 'px'; 
                placed++;
                if(placed===12){ 
                    playSuccessAnim(); speak('Incredible!'); document.getElementById('sorting-msg').innerText = "You did it! 🌟";
                    completedSections[currentGroup.title] = true; localStorage.setItem('completed', JSON.stringify(completedSections));
                    setTimeout(showMenu,3500); 
                }
            } else { playError(); el.style.animation=`float ${floatSpeed}s infinite`; }
        }); area.appendChild(el);
    });
}

// ==========================================
// 🧩 JIGSAW PUZZLE ENGINE
// ==========================================
function startJigsaw() {
    menuScreen.classList.remove('active-screen'); jigsawScreen.classList.add('active-screen');
    document.getElementById('jigsaw-title').innerText = currentGroup.title; document.getElementById('jigsaw-msg').innerText = "Make the picture!";
    const board = document.getElementById('jigsaw-board'); const area = document.getElementById('jigsaw-area');
    board.style.backgroundImage = `url('${currentGroup.url}')`;
    document.querySelectorAll('.jigsaw-piece').forEach(el => el.remove());
    let placed = 0; const positions = [ { id: 0, x: 0, y: 0 }, { id: 1, x: 160, y: 0 }, { id: 2, x: 0, y: 160 }, { id: 3, x: 160, y: 160 } ];

    positions.forEach((pos, index) => {
        let piece = document.createElement('div'); piece.className = 'jigsaw-piece';
        piece.style.backgroundImage = `url('${currentGroup.url}')`; piece.style.backgroundPosition = `-${pos.x}px -${pos.y}px`;
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
                placed++; if (placed === 4) { 
                    playSuccessAnim(); speak(currentGroup.title); document.getElementById('jigsaw-msg').innerText = "Beautiful! 🌟"; 
                    completedSections[currentGroup.title] = true; localStorage.setItem('completed', JSON.stringify(completedSections));
                    setTimeout(showMenu, 3500); 
                }
            } else { playError(); piece.style.top = '70%'; }
        }); area.appendChild(piece);
    });
}

// ==========================================
// ✍️ TRACING ENGINE
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
        
        let rem = aS.length - currWP;
        if (rem > 5) { 
            let p = (Date.now() % 1500) / 1500; let aI = currWP + Math.floor(p * rem);
            if (aI < aS.length) {
                ctx.beginPath(); ctx.arc(aS[aI].x + canvas.width/2, aS[aI].y + canvas.height/2, 10, 0, Math.PI*2);
                ctx.fillStyle = "rgba(255, 255, 255, 0.9)"; ctx.shadowColor = "white"; ctx.shadowBlur = 15; ctx.fill(); ctx.shadowBlur = 0; 
            }
        }
    } animationFrameId = requestAnimationFrame(animateCanvas);
}

canvas.addEventListener('touchstart', () => { startDrawingSound(); });
canvas.addEventListener('touchend', () => { stopDrawingSound(); });

canvas.addEventListener('touchmove', (e) => {
    if(currStroke>=smoothStrokes.length||isFinished) return; e.preventDefault(); 
    let t=e.touches[0], r=canvas.getBoundingClientRect();
    let d=Math.sqrt(Math.pow((t.clientX-r.left-canvas.width/2)-smoothStrokes[currStroke][currWP].x,2) + Math.pow((t.clientY-r.top-canvas.height/2)-smoothStrokes[currStroke][currWP].y,2));
    
    if (drawingOsc) drawingOsc.frequency.setValueAtTime(300 + (currWP * 2), audioCtx.currentTime);

    if(d<60){ 
        currWP++; 
        if(currWP>=smoothStrokes[currStroke].length){ 
            drawn.push(smoothStrokes[currStroke]); currStroke++; currWP=0; stopDrawingSound(); playSnap();
            if(currStroke>=smoothStrokes.length){
                isFinished=true; cancelAnimationFrame(animationFrameId); 
                ctx.clearRect(0,0,canvas.width,canvas.height); ctx.fillStyle="#087E8B"; ctx.fillText(currentGroup.items[currentItemIndex],canvas.width/2,canvas.height/2);
                playSuccessAnim(); speak(currentGroup.items[currentItemIndex]); document.getElementById('tracing-msg').innerText="Perfect! 🎉"; 
                setTimeout(()=>{ 
                    currentItemIndex++; 
                    if(currentItemIndex<currentGroup.items.length) loadLetter(); 
                    else {
                        completedSections[currentGroup.title] = true; localStorage.setItem('completed', JSON.stringify(completedSections));
                        showMenu(); 
                    }
                }, 2500);
            }
        }
    }
});

buildMenu(); updateSettingsUI();
