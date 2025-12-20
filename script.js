const myCode = Math.floor(100000 + Math.random() * 900000).toString();
const peer = new Peer(myCode);
let conn;
let isHost = false;
let game = {
    scoreMe: 0, scoreOpp: 0, round: 1, max: 10,
    currentQ: null, hintUsed: false, locked: false
};

peer.on('open', id => document.getElementById('display-id').innerText = id);

// ODA SAHİBİ (HOST)
peer.on('connection', c => {
    conn = c; isHost = true;
    setupBattle();
});

// KATILAN (GUEST)
function connectToFriend() {
    const target = document.getElementById('peer-id').value;
    if(target.length !== 6) return alert("6 haneli kodu gir!");
    conn = peer.connect(target);
    conn.on('open', setupBattle);
}

function setupBattle() {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('game-area').classList.add('active');

    conn.on('data', data => {
        // Gelen veriyi her zaman dinle
        if(data.type === 'next_question') {
            game.round = data.round; // Sayacı senkronize et
            renderQuestion(data.val);
        }
        if(data.type === 'opponent_scored') {
            game.scoreOpp += data.pts;
            updateUI();
            flash("RAKİP BİLDİ!", "#ff007f");
            lockInput();
            // Rakip bildiğinde Host yeni soruyu tetikler
            if(isHost) {
                game.round++;
                setTimeout(sendQuestionToBoth, 2000);
            }
        }
        if(data.type === 'game_over') finishGame();
    });

    // İlk soruyu sadece Host başlatır
    if(isHost) setTimeout(sendQuestionToBoth, 1000);
}

function sendQuestionToBoth() {
    if(game.round > game.max) {
        conn.send({ type: 'game_over' });
        finishGame();
        return;
    }

    // Zorluk belirleme
    let diff = game.round <= 3 ? "easy" : (game.round <= 7 ? "medium" : "hard");
    const pool = questionBank[diff];
    const q = pool[Math.floor(Math.random() * pool.length)];
    
    // Kendine çiz ve karşıya gönder
    renderQuestion(q);
    conn.send({ 
        type: 'next_question', 
        val: q, 
        round: game.round 
    });
}

function renderQuestion(q) {
    game.currentQ = q;
    game.hintUsed = false;
    game.locked = false;
    
    document.getElementById('question-text').innerText = q.q;
    document.getElementById('round-info').innerText = `${game.round} / ${game.max}`;
    document.getElementById('hint-display').innerText = "";
    document.getElementById('msg-box').innerText = "";
    
    // Rozet rengini güncelle
    const badge = document.getElementById('diff-badge');
    badge.innerText = game.round <= 3 ? "KOLAY" : (game.round <= 7 ? "ORTA" : "ZOR");
    badge.style.background = game.round <= 3 ? "#238636" : (game.round <= 7 ? "#f1c40f" : "#e74c3c");

    const inp = document.getElementById('answer-input');
    inp.value = "";
    inp.disabled = false;
    inp.style.opacity = "1";
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
            
            // Puan bilgisini karşıya gönder
            conn.send({ type: 'opponent_scored', pts: pts });
            
            // Eğer ben bildiysem ve Host isem yeni soruyu getiririm
            if(isHost) {
                game.round++;
                setTimeout(sendQuestionToBoth, 2000);
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
    inp.disabled = true;
    inp.style.opacity = "0.3";
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

function finishGame() {
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