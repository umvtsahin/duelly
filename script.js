let peer, conn, myID, isHost = false;
let selectedMode = '', selectedCat = 'genelkultur';

window.onload = () => {
    myID = Math.floor(100000 + Math.random() * 900000).toString();
    peer = new Peer(myID);
    peer.on('open', id => document.getElementById('display-id').innerText = id);
    peer.on('connection', c => { conn = c; isHost = true; listen(); });
};

function openLobby(mode) {
    selectedMode = mode;
    document.getElementById('lobby-title').innerText = mode.toUpperCase();
    document.getElementById('quiz-options').style.display = (mode === 'quiz') ? 'block' : 'none';
    if(mode === 'quiz') setupCatIcons();
    showScreen('lobby-screen');
}

function setupCatIcons() {
    const cats = ['genelkultur','tarih','matematik','bilim','sinema','spor'];
    const grid = document.getElementById('cat-grid');
    grid.innerHTML = cats.map(c => `<button onclick="setCat('${c}')" class="${selectedCat===c?'active':''}">${c.toUpperCase()}</button>`).join('');
}

function setCat(c) { selectedCat = c; setupCatIcons(); }

function connectToFriend() {
    const target = document.getElementById('peer-id').value;
    conn = peer.connect(target);
    isHost = false;
    listen();
}

function listen() {
    conn.on('open', () => {
        if(isHost) sendData({ type: 'start', mode: selectedMode, cat: selectedCat });
    });
    conn.on('data', data => {
        const msg = JSON.parse(data);
        if(msg.type === 'start') {
            selectedMode = msg.mode;
            selectedCat = msg.cat;
            initSelectedGame();
        }
        // Gelen veriyi ilgili oyun modülüne gönder
        if(selectedMode === 'quiz') handleQuiz(msg);
        if(selectedMode === 'tictactoe') handleTTT(msg);
        if(selectedMode === 'hafiza') handleHafiza(msg);
    });
}

function initSelectedGame() {
    showScreen('game-' + selectedMode);
    if(selectedMode === 'quiz') initQuiz();
    if(selectedMode === 'tictactoe') initTTT();
    if(selectedMode === 'hafiza') initHafiza();
}

function sendData(obj) { if(conn) conn.send(JSON.stringify(obj)); }
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}
function copyID() {
    navigator.clipboard.writeText(myID);
    document.getElementById('display-id').innerText = "KOPYALANDI";
    setTimeout(()=> document.getElementById('display-id').innerText = myID, 1000);
}
