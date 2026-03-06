// --- STATE & SETTINGS ---
const menuScreen = document.getElementById('menu-screen');
const tracingScreen = document.getElementById('tracing-screen');
const sortingScreen = document.getElementById('sorting-screen');
const jigsawScreen = document.getElementById('jigsaw-screen');
const worksheetScreen = document.getElementById('worksheet-screen');
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
    gainNode.gain.setValueAtTime(vol, audioCtx.currentTime); gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    osc.connect(gainNode); gainNode.connect(audioCtx.destination); osc.start(); osc.stop(audioCtx.currentTime + duration);
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
    drawingOsc = audioCtx.createOscillator(); drawingGain = audioCtx.createGain(); drawingOsc.type = 'triangle'; 
    drawingOsc.frequency.setValueAtTime(300, audioCtx.currentTime); drawingGain.gain.setValueAtTime(0, audioCtx.currentTime); 
    drawingGain.gain.linearRampToValueAtTime(0.05, audioCtx.currentTime + 0.1);
    drawingOsc.connect(drawingGain); drawingGain.connect(audioCtx.destination); drawingOsc.start();
}
function stopDrawingSound() {
    if (drawingOsc && drawingGain) { drawingGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.1); setTimeout(() => { if(drawingOsc){ drawingOsc.stop(); drawingOsc = null; } }, 100); }
}
function playSuccessAnim() { if(isSoundEnabled) playSuccessChime(); confetti({ particleCount: 250, spread: 100, origin: { y: 0.5 } }); }
function speak(text) { if (!isSoundEnabled) return; let u = new SpeechSynthesisUtterance(text); u.rate = 0.85; u.pitch = 1.1; speechSynthesis.speak(u); }

// --- TRACING DATA ---
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

// 🌟 MASSIVE APP STRUCTURE
const appStructure = [
    {
        category: "Colorful Worksheets (Count!)",
        games: [
            { type: 'worksheet', title: 'Count 1', count: 1, icon: '1️⃣', emoji: '🍓' },
            { type: 'worksheet', title: 'Count 2', count: 2, icon: '2️⃣', emoji: '🦋' },
            { type: 'worksheet', title: 'Count 3', count: 3, icon: '3️⃣', emoji: '🍎' },
            { type: 'worksheet', title: 'Count 4', count: 4, icon: '4️⃣', emoji: '🚗' },
            { type: 'worksheet', title: 'Count 5', count: 5, icon: '5️⃣', emoji: '⭐' },
            { type: 'worksheet', title: 'Count 6', count: 6, icon: '6️⃣', emoji: '🎈' },
            { type: 'worksheet', title: 'Count 7', count: 7, icon: '7️⃣', emoji: '🐸' },
            { type: 'worksheet', title: 'Count 8', count: 8, icon: '8️⃣', emoji: '🍩' },
            { type: 'worksheet', title: 'Count 9', count: 9, icon: '9️⃣', emoji: '⚽' },
            { type: 'worksheet', title: 'Count 10', count: 10, icon: '🔟', emoji: '💎' }
        ]
    },
    {
        category: "Trace Numbers (1 by 1)",
        games: [
            { type: 'trace', title: 'Draw 1', items: ['1'], icon: '1️⃣' },
            { type: 'trace', title: 'Draw 2', items: ['2'], icon: '2️⃣' },
            { type: 'trace', title: 'Draw 3', items: ['3'], icon: '3️⃣' },
            { type: 'trace', title: 'Draw 4', items: ['4'], icon: '4️⃣' },
            { type: 'trace', title: 'Draw 5', items: ['5'], icon: '5️⃣' },
            { type: 'trace', title: 'Draw 6', items: ['6'], icon: '6️⃣' },
            { type: 'trace', title: 'Draw 7', items: ['7'], icon: '7️⃣' },
            { type: 'trace', title: 'Draw 8', items: ['8'], icon: '8️⃣' },
            { type: 'trace', title: 'Draw 9', items: ['9'], icon: '9️⃣' },
            { type: 'trace', title: 'Draw 10', items: ['10'], icon: '🔟' }
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
            { type: 'sort', title: 'Fruits vs Animals', icon: '🍎', z1:{ id:'fruit', label:'🍎 Fruits', bg:'linear-gradient(135deg, #ff9a9e, #fecfef)' }, z2:{ id:'animal', label:'🐶 Animals', bg:'linear-gradient(135deg, #4facfe, #00f2fe)' }, pool: [{e:'🍌',t:'fruit'},{e:'🍉',t:'fruit'},{e:'🍒',t:'fruit'},{e:'🐱',t:'animal'},{e:'🦁',t:'animal'},{e:'🐸',t:'animal'}] },
            { type: 'sort', title: 'Sea vs Sky', icon: '🌊', z1:{ id:'sea', label:'🐟 Sea', bg:'linear-gradient(135deg, #89f7fe, #66a6ff)' }, z2:{ id:'sky', label:'🦅 Sky', bg:'linear-gradient(135deg, #e0c3fc, #8ec5fc)' }, pool: [{e:'🐬',t:'sea'},{e:'🐳',t:'sea'},{e:'🐙',t:'sea'},{e:'🦅',t:'sky'},{e:'🦉',t:'sky'},{e:'🦇',t:'sky'}] },
            { type: 'sort', title: 'Vehicles vs Food', icon: '🚗', z1:{ id:'veh', label:'🚗 Vehicles', bg:'linear-gradient(135deg, #f6d365, #fda085)' }, z2:{ id:'food', label:'🍔 Food', bg:'linear-gradient(135deg, #ff0844, #ffb199)' }, pool: [{e:'🚕',t:'veh'},{e:'🚓',t:'veh'},{e:'✈️',t:'veh'},{e:'🍕',t:'food'},{e:'🍟',t:'food'},{e:'🌭',t:'food'}] },
            { type: 'sort', title: 'Bugs vs Flowers', icon: '🐛', z1:{ id:'bug', label:'🐛 Bugs', bg:'linear-gradient(135deg, #d4fc79, #96e6a1)' }, z2:{ id:'flow', label:'🌸 Flowers', bg:'linear-gradient(135deg, #fccb90, #d57eeb)' }, pool: [{e:'🦋',t:'bug'},{e:'🐞',t:'bug'},{e:'🐝',t:'bug'},{e:'🌻',t:'flow'},{e:'🌹',t:'flow'},{e:'🌷',t:'flow'}] },
            { type: 'sort', title: 'Space vs Earth', icon: '🚀', z1:{ id:'space', label:'🚀 Space', bg:'linear-gradient(135deg, #30cfd0, #330867)' }, z2:{ id:'earth', label:'🌍 Earth', bg:'linear-gradient(135deg, #43e97b, #38f9d7)' }, pool: [{e:'👽',t:'space'},{e:'🛸',t:'space'},{e:'⭐',t:'space'},{e:'🌲',t:'earth'},{e:'⛰️',t:'earth'},{e:'🏠',t:'earth'}] }
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
            { type: 'jigsaw', title: 'Puppy', url: 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop', icon: '🐶' },
            { type: 'jigsaw', title: 'Kitten', url: 'https://images.pexels.com/photos/104827/cat-pet-animal-domestic-104827.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop', icon: '🐱' }
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
                if (game.type === 'trace') startTracing(); if (game.type === 'sort') startSorting(); 
                if (game.type === 'jigsaw') startJigsaw(); if (game.type === 'worksheet') startWorksheet();
            }; grid.appendChild(btn);
        }); container.appendChild(grid);
    });
}

function showMenu() {
    cancelAnimationFrame(animationFrameId); stopDrawingSound();
    tracingScreen.classList.remove('active-screen'); sortingScreen.classList.remove('active-screen'); 
    jigsawScreen.classList.remove('active-screen'); worksheetScreen.classList.remove('active-screen');
    menuScreen.classList.add('active-screen'); buildMenu();
}
function resetSection() { 
    if (currentGroup) { 
        playPop(); 
        if (currentGroup.type === 'trace') startTracing(); else if (currentGroup.type === 'sort') startSorting(); 
        else if (currentGroup.type === 'jigsaw') startJigsaw(); else if (currentGroup.type === 'worksheet') startWorksheet();
    } 
}

// ==========================================
// 📝 NEW: COLORFUL WORKSHEET ENGINE
// ==========================================
function startWorksheet() {
    menuScreen.classList.remove('active-screen'); worksheetScreen.classList.add('active-screen');
    document.getElementById('worksheet-title').innerText = currentGroup.title;
    document.getElementById('worksheet-msg').innerText = "How many?";
    
    // 1. Render the Emojis on the "Paper"
    const paper = document.getElementById('worksheet-paper');
    paper.innerHTML = '';
    for(let i=0; i<currentGroup.count; i++) {
        let span = document.createElement('span');
        span.className = 'worksheet-emoji';
        span.innerText = currentGroup.emoji;
        span.style.animationDelay = `${i * 0.1}s`; // Stagger pop-in
        paper.appendChild(span);
    }
    
    // 2. Generate the Multiple Choice Answers
    const answersContainer = document.getElementById('worksheet-answers');
    answersContainer.innerHTML = '';
    
    let options = [currentGroup.count];
    while(options.length < 3) {
        let wrongAnswer = Math.floor(Math.random() * 10) + 1;
        if(!options.includes(wrongAnswer)) options.push(wrongAnswer);
    }
    // Shuffle the options
    options.sort(() => Math.random() - 0.5);
    
    // Create Buttons
    const btnColors = ['#FF5A5F', '#087E8B', '#FFCA3A'];
    options.forEach((opt, index) => {
        let btn = document.createElement('button');
        btn.className = 'answer-btn';
        btn.innerText = opt;
        btn.style.backgroundColor = btnColors[index];
        btn.style.boxShadow = `0 8px 0 ${shadeColor(btnColors[index], -20)}, 0 15px 20px rgba(0,0,0,0.2)`;
        
        btn.onclick = () => {
            if (opt === currentGroup.count) {
                playSuccessAnim();
                speak(`Correct! ${opt}`);
                document.getElementById('worksheet-msg').innerText = "Great Job! 🌟";
                completedSections[currentGroup.title] = true; 
                localStorage.setItem('completed', JSON.stringify(completedSections));
                
                // Disable all buttons
                document.querySelectorAll('.answer-btn').forEach(b => b.style.pointerEvents = 'none');
                
                setTimeout(showMenu, 3500);
            } else {
                playError();
                speak("Try again!");
                btn.style.transform = "scale(0.9)";
                setTimeout(() => btn.style.transform = "scale(1)", 200);
            }
        };
        answersContainer.appendChild(btn);
    });
}

// Utility to make button shadows darker based on their main color
function shadeColor(color, percent) {
    let R = parseInt(color.substring(1,3),16), G = parseInt(color.substring(3,5),16), B = parseInt(color.substring(5,7),16);
    R = parseInt(R * (100 + percent) / 100); G = parseInt(G * (100 + percent) / 100); B = parseInt(B * (100 + percent) / 100);
    R = (R<255)?R:255; G = (G<255)?G:255; B = (B<255)?B:255; R = Math.round(R); G = Math.round(G); B = Math.round(B);
    let RR = ((R.toString(16).length==1)?"0"+R.toString(16):R.toString(16));
    let GG = ((G.toString(16).length==1)?"0"+G.toString(16):G.toString(16));
    let BB = ((B.toString(16).length==1)?"0"+B.toString(16):B.toString(16));
    return "#"+RR+GG+BB;
}

// ==========================================
// 🧺 DYNAMIC SORTING ENGINE
// ==========================================
function startSorting() {
    menuScreen.classList.remove('active-screen'); sortingScreen.classList.add('active-screen'); 
    document.getElementById('sorting-msg').innerText = "Sort the items!";
    const dzContainer = document.getElementById('dynamic-drop-zones'); dzContainer.innerHTML = '';
    let z1 = document.createElement('div'); z1.className = 'zone'; z1.innerHTML = currentGroup.z1.label; z1.style.background = currentGroup.z1.bg;
    let z2 = document.createElement('div'); z2.className = 'zone'; z2.innerHTML = currentGroup.z2.label; z2.style.background = currentGroup.z2.bg;
    dzContainer.appendChild(z1); dzContainer.appendChild(z2);
    const area = document.getElementById('sorting-area'); document.querySelectorAll('.sort-item').forEach(el => el.remove()); 
    let placed = 0; let activeItems = [...currentGroup.pool, ...currentGroup.pool].sort(() => 0.5 - Math.random());
    activeItems.forEach((item) => {
        let el = document.createElement('div'); el.className = 'sort-item'; el.innerText = item.e; el.dataset.type = item.t;
        el.style.left = (Math.random()*75+5)+'%'; el.style.top = (Math.random()*40+45)+'%';
        let floatSpeed = (Math.random() * 2 + 2).toFixed(1); el.style.animation = `popIn 0.5s forwards, float ${floatSpeed}s ease-in-out ${Math.random()}s infinite`;
        el.addEventListener('touchstart', (e) => { playTone(300, 'sine', 0.1); el.style.transform="scale(1.4)"; el.style.animation="none"; el.style.zIndex="100"; });
        el.addEventListener('touchmove', (e) => { e.preventDefault(); el.style.left=(e.touches[0].clientX-40)+'px'; el.style.top=(e.touches[0].clientY-100)+'px'; });
        el.addEventListener('touchend', (e) => {
            el.style.transform="scale(1)"; el.style.zIndex="1";
            let r1 = z1.getBoundingClientRect(), r2 = z2.getBoundingClientRect(), touch = e.changedTouches[0];
            let in1 = touch.clientX>r1.left && touch.clientX<r1.right && touch.clientY>r1.top && touch.clientY<r1.bottom;
            let in2 = touch.clientX>r2.left && touch.clientX<r2.right && touch.clientY>r2.top && touch.clientY<r2.bottom;
            if ((item.t===currentGroup.z1.id && in1) || (item.t===currentGroup.z2.id && in2)) {
                playSnap(); el.style.pointerEvents='none'; el.style.left = (item.t===currentGroup.z1.id ? r1.left : r2.left) + 20 + (Math.random()*40) + 'px'; 
                el.style.top = r1.top + 20 + (Math.random()*40) + 'px'; placed++;
                if(placed===12){ playSuccessAnim(); speak('Incredible!'); document.getElementById('sorting-msg').innerText = "You did it! 🌟"; completedSections[currentGroup.title] = true; localStorage.setItem('completed', JSON.stringify(completedSections)); setTimeout(showMenu,3500); }
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
    const board = document.getElementById('jigsaw-board'); const area = document.getElementById('jigsaw-area'); board.style.backgroundImage = `url('${currentGroup.url}')`;
    document.querySelectorAll('.jigsaw-piece').forEach(el => el.remove());
    let placed = 0; const positions = [ { id: 0, x: 0, y: 0 }, { id: 1, x: 160, y: 0 }, { id: 2, x: 0, y: 160 }, { id: 3, x: 160, y: 160 } ];
    positions.forEach((pos, index) => {
        let piece = document.createElement('div'); piece.className = 'jigsaw-piece'; piece.style.backgroundImage = `url('${currentGroup.url}')`; piece.style.backgroundPosition = `-${pos.x}px -${pos.y}px`;
        piece.style.left = (Math.random() * 50 + 10) + '%'; piece.style.top = (Math.random() * 20 + 60) + '%'; piece.style.animation = `popIn 0.5s ${index*0.1}s forwards`; piece.dataset.tx = pos.x; piece.dataset.ty = pos.y;
        piece.addEventListener('touchstart', () => { playTone(300, 'sine', 0.1); piece.style.transform = "scale(1.1)"; piece.style.zIndex = "100"; });
        piece.addEventListener('touchmove', (e) => { e.preventDefault(); piece.style.left = (e.touches[0].clientX - 80) + 'px'; piece.style.top = (e.touches[0].clientY - 80) + 'px'; });
        piece.addEventListener('touchend', (e) => {
            piece.style.transform = "scale(1)"; piece.style.zIndex = "5"; let bR = board.getBoundingClientRect(), pR = piece.getBoundingClientRect();
            if (Math.abs((pR.left - bR.left) - pos.x) < 60 && Math.abs((pR.top - bR.top) - pos.y) < 60) {
                playSnap(); piece.style.left = (bR.left + pos.x) + 'px'; piece.style.top = (bR.top + pos.y) + 'px'; piece.style.pointerEvents = 'none'; piece.style.border = "none"; piece.style.boxShadow = "none"; placed++; 
                if (placed === 4) { playSuccessAnim(); speak(currentGroup.title); document.getElementById('jigsaw-msg').innerText = "Beautiful! 🌟"; completedSections[currentGroup.title] = true; localStorage.setItem('completed', JSON.stringify(completedSections)); setTimeout(showMenu, 3500); }
            } else { playError(); piece.style.top = '70%'; }
        }); area.appendChild(piece);
    });
}

// ==========================================
// ✍️ TRACING ENGINE
// ==========================================
let smoothStrokes=[], currStroke=0, currWP=0, drawn=[], isFinished=false;
function startTracing() { menuScreen.classList.remove('active-screen'); tracingScreen.classList.add('active-screen'); currentItemIndex = 0; document.getElementById('tracing-title').innerText = currentGroup.title; canvas.width=canvas.parentElement.clientWidth; canvas.height=canvas.parentElement.clientHeight; loadLetter(); }
function loadLetter() { currStroke=0; currWP=0; drawn=[]; isFinished=false; stopDrawingSound(); document.getElementById('tracing-msg').innerText="Follow the dot!"; let char = currentGroup.items[currentItemIndex]; if(traceData[char]) smoothStrokes = interpolateStrokes(traceData[char]); animateCanvas(); }
function interpolateStrokes(rs) { let g=[]; rs.forEach(s=>{ let ns=[]; for(let i=0;i<s.length-1;i++){ let p1=s[i],p2=s[i+1], dist=Math.hypot(p2.x-p1.x,p2.y-p1.y), steps=Math.max(Math.floor(dist/10), 1); for(let j=0;j<steps;j++) ns.push({x:p1.x+(p2.x-p1.x)*(j/steps), y:p1.y+(p2.y-p1.y)*(j/steps)}); } ns.push(s[s.length-1]); g.push(ns); }); return g; }
function animateCanvas() {
    if(isFinished) return; ctx.clearRect(0,0,canvas.width,canvas.height); let char = currentGroup.items[currentItemIndex];
    ctx.font=`bold ${canvas.height*0.75}px 'Nunito', 'Comic Sans MS'`; ctx.textAlign="center"; ctx.textBaseline="middle"; ctx.lineCap="round"; ctx.lineJoin="round"; ctx.lineWidth=50; ctx.strokeStyle="#EAEAEA"; ctx.strokeText(char,canvas.width/2,canvas.height/2);
    if(smoothStrokes.length===0) return; ctx.strokeStyle="#087E8B"; ctx.lineWidth=60;
    drawn.forEach(p=>{ ctx.beginPath(); ctx.moveTo(p[0].x+canvas.width/2,p[0].y+canvas.height/2); for(let i=1;i<p.length;i++) ctx.lineTo(p[i].x+canvas.width/2,p[i].y+canvas.height/2); ctx.stroke(); });
    if(currStroke < smoothStrokes.length){
        let aS = smoothStrokes[currStroke]; 
        for(let i=currWP;i<aS.length;i++){ ctx.beginPath(); ctx.arc(aS[i].x+canvas.width/2,aS[i].y+canvas.height/2,8,0,Math.PI*2); ctx.fillStyle="#FFCA3A"; ctx.fill(); }
        let tWP = aS[currWP]; ctx.beginPath(); ctx.arc(tWP.x+canvas.width/2,tWP.y+canvas.height/2,20+(Math.sin(Date.now()/150)*5),0,Math.PI*2); ctx.fillStyle="#FF5A5F"; ctx.fill(); ctx.lineWidth=4; ctx.strokeStyle="white"; ctx.stroke();
        let rem = aS.length - currWP;
        if (rem > 5) { let p = (Date.now() % 1500) / 1500; let aI = currWP + Math.floor(p * rem); if (aI < aS.length) { ctx.beginPath(); ctx.arc(aS[aI].x + canvas.width/2, aS[aI].y + canvas.height/2, 10, 0, Math.PI*2); ctx.fillStyle = "rgba(255, 255, 255, 0.9)"; ctx.shadowColor = "white"; ctx.shadowBlur = 15; ctx.fill(); ctx.shadowBlur = 0; } }
    } animationFrameId = requestAnimationFrame(animateCanvas);
}
canvas.addEventListener('touchstart', () => { startDrawingSound(); }); canvas.addEventListener('touchend', () => { stopDrawingSound(); });
canvas.addEventListener('touchmove', (e) => {
    if(currStroke>=smoothStrokes.length||isFinished) return; e.preventDefault(); let t=e.touches[0], r=canvas.getBoundingClientRect(), d=Math.sqrt(Math.pow((t.clientX-r.left-canvas.width/2)-smoothStrokes[currStroke][currWP].x,2) + Math.pow((t.clientY-r.top-canvas.height/2)-smoothStrokes[currStroke][currWP].y,2));
    if (drawingOsc) drawingOsc.frequency.setValueAtTime(300 + (currWP * 2), audioCtx.currentTime);
    if(d<60){ 
        currWP++; if(currWP>=smoothStrokes[currStroke].length){ 
            drawn.push(smoothStrokes[currStroke]); currStroke++; currWP=0; stopDrawingSound(); playSnap();
            if(currStroke>=smoothStrokes.length){
                isFinished=true; cancelAnimationFrame(animationFrameId); ctx.clearRect(0,0,canvas.width,canvas.height); ctx.fillStyle="#087E8B"; ctx.fillText(currentGroup.items[currentItemIndex],canvas.width/2,canvas.height/2);
                playSuccessAnim(); speak(currentGroup.items[currentItemIndex]); document.getElementById('tracing-msg').innerText="Perfect! 🎉"; 
                setTimeout(()=>{ currentItemIndex++; if(currentItemIndex<currentGroup.items.length) loadLetter(); else { completedSections[currentGroup.title] = true; localStorage.setItem('completed', JSON.stringify(completedSections)); showMenu(); } }, 2500);
            }
        }
    }
});

buildMenu(); updateSettingsUI();
