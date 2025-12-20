const myCode = Math.floor(100000 + Math.random() * 900000).toString();
const peer = new Peer(myCode);
let conn;
let isHost = false;
let gameStarted = false; // Oyunun başlayıp başlamadığını kontrol eder

let game = {
    scoreMe: 0, scoreOpp: 0, round: 1, max: 10,
    currentQ: null, hintUsed: false, locked: false
};

peer.on('open', id => {
    document.getElementById('display-id').innerText = id;
});

// HOST TARAFINDA: Biri bağlandığında tetiklenir
peer.on('connection', c => {
    if (gameStarted) return; // Zaten oyun başladıysa başkasını alma
    conn = c;
    isHost = true;
    setupBattle();
});

// KATILAN TARAFINDA: Butona basınca tetiklenir
function connectToFriend() {
    const target = document.getElementById('peer-id').value;
    
    if (target === myCode) {
        alert("Kendi kodunla oyuna giremezsin!");
        return;
    }
    
    if (target.length !== 6) {
        alert("Geçerli bir 6 haneli kod gir!");
        return;
    }

    document.getElementById('join-btn').innerText = "BAĞLANILIYOR...";
    document.getElementById('join-btn').disabled = true;

    conn = peer.connect(target);
    
    conn.on('open', () => {
        setupBattle();
    });

    conn.on('error', err => {
        alert("Bağlantı hatası! Kodun doğruluğundan emin ol.");
        document.getElementById('join-btn').innerText = "SAVAŞA KATIL";
        document.getElementById('join-btn').disabled = false;
    });
}

function setupBattle() {
    gameStarted = true;
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('game-area').classList.add('active');

    conn.on('data', data => {
        if(data.type === 'next_question') {
            game.round = data.round;
            renderQuestion(data.val);
        }
        if(data.type === 'point') {
            game.scoreOpp += data.pts;
            updateUI();
            flash("RAKİP BİLDİ!", "#ff007f");
            lockInput();
            if(isHost) {
                game.round++;
                setTimeout(hostNextRound, 2000);
            }
        }
        if(data.type === 'end') showResults();
    });

    // Oyun sadece iki kişi varken (bağlantı kurulunca) Host tarafından başlatılır
    if(isHost) {
        setTimeout(hostNextRound, 1500);
    }
}

function hostNextRound() {
    if(game.round > game.max) {
        conn.send({ type: 'end' });
        showResults();
        return;
    }
    
    let diff = game.round <= 3 ? "easy" : (game.round <= 7 ? "medium" : "hard");
    const pool = questionBank[diff];
    const q = pool[Math.floor(Math.random() * pool.length)];
    
    renderQuestion(q);
    conn.send({ type: 'next_question', val: q, round: game.round });
}

function renderQuestion(q) {
    game.currentQ = q;
    game.hintUsed = false;
    game.locked = false;
    
    document.getElementById('question-text').innerText = q.q;
    document.getElementById('round-info').innerText = `${game.round} / ${game.max}`;
    document.getElementById('hint-display').innerText = "";
    document.getElementById('msg-box').innerText = "";
    
    const badge = document.getElementById('diff-badge');
    badge.innerText = game.round <= 3 ? "KOLAY" : (game.round <= 7 ? "ORTA" : "ZOR");
    badge.style.background = game.round <= 3 ? "#238636" : (game.round <= 7 ? "#f1c40f" : "#e74c3c");

    const inp = document.getElementById('answer-input');
    inp.value = ""; inp.disabled = false; inp.style.opacity = "1";
    inp.focus();
}

document.getElementById('answer-input').onkeypress = (e) => {
    if(e.key === 'Enter' && !game.locked) {
        const val = e.target.value.trim().toLowerCase();
        if(val === game.currentQ.a) {
            lockInput();
            const pts = game.hintUsed ? 5 : 10;
            game.scoreMe += pts;
            updateUI();
            flash(`+${pts} PUAN!`, "#00f2ff");
            conn.send({ type: 'point', pts: pts });
            
            if(isHost) {
                game.round++;
                setTimeout(hostNextRound, 2000);
            }
        } else {
            e.target.value = "";
            flash("YANLIŞ!", "#555");
        }
    }
};

function lockInput() {
    game.locked = true;
    const inp = document.getElementById('answer-input');
    inp.disabled = true; inp.style.opacity = "0.3";
}

function updateUI() {
    document.getElementById('my-score').innerText = game.scoreMe;
    document.getElementById('opp-score').innerText = game.scoreOpp;
}

function flash(txt, col) {
    const m = document.getElementById('msg-box');
    m.innerText = txt; m.style.color = col;
}

function getHint() {
    if(game.hintUsed || game.locked) return;
    game.hintUsed = true;
    const a = game.currentQ.a;
    document.getElementById('hint-display').innerText = a[0].toUpperCase() + " " + "_ ".repeat(a.length - 1);
}

function showResults() {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('result-screen').classList.add('active');
    document.getElementById('res-me').innerText = game.scoreMe;
    document.getElementById('res-opp').innerText = game.scoreOpp;
    const winTxt = document.getElementById('winner-text');
    if(game.scoreMe > game.scoreOpp) winTxt.innerText = "ZAFER SİZİN!";
    else if(game.scoreMe < game.scoreOpp) winTxt.innerText = "RAKİP KAZANDI!";
    else winTxt.innerText = "BERABERE!";
}

function copyID() {
    navigator.clipboard.writeText(myCode);
    alert("Kod kopyalandı!");
}
