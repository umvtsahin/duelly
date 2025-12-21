let peer, conn, myID, isHost = false, selectedMode = '', selectedCat = 'genelkultur';

window.onload = () => {
    myID = Math.floor(100000 + Math.random() * 900000).toString();
    peer = new Peer(myID);
    peer.on('open', id => document.getElementById('display-id').innerText = id);
    peer.on('connection', c => { 
        conn = c; 
        isHost = true; 
        listen(); 
    });
};

function openLobby(m) {
    selectedMode = m;
    document.getElementById('quiz-options').style.display = (m === 'quiz' ? 'block' : 'none');
    if(m === 'quiz') renderCats();
    showScreen('lobby-screen');
}

function renderCats() {
    const cats = ['genelkultur','tarih','matematik','bilim','sinema','spor'];
    document.getElementById('cat-grid').innerHTML = cats.map(c => 
        `<button onclick="selectedCat='${c}';renderCats()" class="cat-btn ${selectedCat===c?'active':''}">${c.toUpperCase()}</button>`
    ).join('');
}

function connectToFriend() {
    const rid = document.getElementById('peer-id').value;
    if(!rid) return alert("Kod yaz!");
    conn = peer.connect(rid);
    isHost = false;
    listen();
}

function listen() {
    conn.on('open', () => {
        // Bağlantı kurulduğu an Host başlatma komutunu gönderir
        if(isHost) {
            setTimeout(() => sendData({type:'start', m:selectedMode, c:selectedCat}), 800);
        }
    });
    conn.on('data', d => {
        let msg = JSON.parse(d);
        if(msg.type === 'start') { 
            selectedMode = msg.m; 
            selectedCat = msg.c; 
            startGame(); 
        }
        if(selectedMode === 'quiz') handleQuiz(msg);
        if(selectedMode === 'tictactoe') handleTTT(msg);
        if(selectedMode === 'hafiza') handleHafiza(msg);
    });
}

function startGame() {
    showScreen('game-' + selectedMode);
    if(selectedMode === 'quiz') initQuiz();
    if(selectedMode === 'tictactoe') initTTT();
    if(selectedMode === 'hafiza') initHafiza();
}

function sendData(o) { if(conn && conn.open) conn.send(JSON.stringify(o)); }
function showScreen(id) { 
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}
function copyID() { navigator.clipboard.writeText(myID); alert("Kod Kopyalandı!"); }
