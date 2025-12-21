let peer, conn, myID, isHost = false;
let selectedMode = ''; // 'quiz' veya 'tictactoe'
let currentCat = 'genelkultur';

// Oyun Durumları
let quizState = { scoreMe: 0, scoreOpp: 0, round: 1, myDone: false, oppDone: false };
let tttState = { board: Array(9).fill(null), myTurn: false, mySymbol: 'X' };

window.onload = initPeer;

function initPeer() {
    myID = Math.floor(100000 + Math.random() * 900000).toString();
    peer = new Peer(myID);
    peer.on('open', id => document.getElementById('display-id').innerText = id);
    peer.on('connection', c => { conn = c; isHost = true; setupConn(); });
}

function openLobby(mode) {
    selectedMode = mode;
    document.getElementById('lobby-title').innerText = mode.toUpperCase() + " LOBİSİ";
    document.getElementById('quiz-options').style.display = (mode === 'quiz') ? 'block' : 'none';
    showScreen('lobby-screen');
}

function connectToFriend() {
    const target = document.getElementById('peer-id').value;
    conn = peer.connect(target);
    isHost = false;
    setupConn();
}

function setupConn() {
    conn.on('open', () => {
        if(isHost) {
            sendData({ type: 'start_game', mode: selectedMode, cat: currentCat });
            launchGame(selectedMode);
        }
    });
    conn.on('data', data => {
        const msg = JSON.parse(data);
        if(msg.type === 'start_game') { 
            selectedMode = msg.mode; 
            currentCat = msg.cat;
            launchGame(msg.mode); 
        }
        // MODÜLER VERİ İŞLEME
        if(selectedMode === 'quiz') handleQuizData(msg);
        if(selectedMode === 'tictactoe') handleTTTData(msg);
    });
}

function launchGame(mode) {
    showScreen('game-' + mode);
    if(mode === 'quiz' && isHost) startQuizRound();
    if(mode === 'tictactoe') {
        tttState.myTurn = isHost; // Host başlar
        tttState.mySymbol = isHost ? 'X' : 'O';
        updateTTTUI();
    }
}

// --- TIC TAC TOE MANTIĞI ---
function makeTTTMove(idx) {
    if(!tttState.myTurn || tttState.board[idx]) return;
    tttState.board[idx] = tttState.mySymbol;
    tttState.myTurn = false;
    updateTTTUI();
    sendData({ type: 'ttt_move', index: idx });
    checkTTTWin();
}

function handleTTTData(msg) {
    if(msg.type === 'ttt_move') {
        tttState.board[msg.index] = (tttState.mySymbol === 'X' ? 'O' : 'X');
        tttState.myTurn = true;
        updateTTTUI();
        checkTTTWin();
    }
}

function updateTTTUI() {
    const cells = document.querySelectorAll('.cell');
    tttState.board.forEach((val, i) => {
        cells[i].innerText = val || '';
        cells[i].style.color = val === 'X' ? '#00ffcc' : '#ff007f';
    });
    document.getElementById('turn-info').innerText = tttState.myTurn ? "SENİN SIRAN" : "RAKİPTE...";
}

function checkTTTWin() {
    const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    for(let w of wins) {
        if(tttState.board[w[0]] && tttState.board[w[0]] === tttState.board[w[1]] && tttState.board[w[0]] === tttState.board[w[2]]) {
            alert(tttState.board[w[0]] === tttState.mySymbol ? "KAZANDIN!" : "KAYBETTİN!");
            location.reload();
        }
    }
}

// --- YARDIMCI FONKSİYONLAR ---
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}
function sendData(obj) { if(conn) conn.send(JSON.stringify(obj)); }
function selectCat(c) { currentCat = c; alert(c + " Seçildi!"); }
