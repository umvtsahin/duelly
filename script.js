const myCode = Math.floor(100000 + Math.random() * 900000).toString();
const peer = new Peer(myCode);
let conn;
let isHost = false;
let gameStarted = false;

let game = {
    scoreMe: 0, scoreOpp: 0, round: 1, max: 10,
    currentQ: null, jokerUsed: false, locked: false
};

peer.on('open', id => document.getElementById('display-id').innerText = id);

peer.on('connection', c => {
    if (gameStarted) return;
    conn = c; isHost = true;
    setupBattle();
});

function connectToFriend() {
    const target = document.getElementById('peer-id').value;
    if (target === myCode) return alert("Kendi kodunla tek başına oynayamazsın kanka, rakip bul!");
    conn = peer.connect(target);
    conn.on('open', setupBattle);
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
            if(isHost) { game.round++; setTimeout(hostNextRound, 2000); }
        }
        if(data.type === 'end') showResults();
    });

    if(isHost) setTimeout(hostNextRound, 1500);
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
    game.locked = false;
    document.getElementById('question-text').innerText = q.q;
    document.getElementById('round-info').innerText = `${game.round} / ${game.max}`;
    document.getElementById('msg-box').innerText = "";
    
    // Şıkları oluştur
    const grid = document.getElementById('options-grid');
    grid.innerHTML = "";
    q.options.forEach((opt, index) => {
        const btn = document.createElement('button');
        btn.className = 'opt-btn';
        btn.innerText = opt;
        btn.onclick = () => checkAnswer(opt, btn);
        grid.appendChild(btn);
    });

    const badge = document.getElementById('diff-badge');
    badge.innerText = game.round <= 3 ? "KOLAY" : (game.round <= 7 ? "ORTA" : "ZOR");
}

function checkAnswer(selected, btn) {
    if(game.locked) return;
    
    if(selected === game.currentQ.a) {
        lockInput();
        btn.style.background = "#238636";
        game.scoreMe += 10;
        updateUI();
        flash("+10 PUAN!", "#00f2ff");
        conn.send({ type: 'point', pts: 10 });
        if(isHost) { game.round++; setTimeout(hostNextRound, 2000); }
    } else {
        btn.style.background = "#ff007f";
        flash("YANLIŞ!", "#ff007f");
        btn.disabled = true;
    }
}

function useJoker() {
    if(game.jokerUsed || game.locked) return;
    
    const btns = Array.from(document.querySelectorAll('.opt-btn'));
    const wrongBtns = btns.filter(b => b.innerText !== game.currentQ.a);
    
    // Rastgele 2 tanesini sil
    for(let i = 0; i < 2; i++) {
        const randomIndex = Math.floor(Math.random() * wrongBtns.length);
        wrongBtns[randomIndex].classList.add('hidden');
        wrongBtns.splice(randomIndex, 1);
    }
    
    game.jokerUsed = true;
    document.getElementById('joker-btn').disabled = true;
    document.getElementById('joker-btn').innerText = "JOKER KULLANILDI";
}

function lockInput() {
    game.locked = true;
    document.querySelectorAll('.opt-btn').forEach(b => b.disabled = true);
}

function updateUI() {
    document.getElementById('my-score').innerText = game.scoreMe;
    document.getElementById('opp-score').innerText = game.scoreOpp;
}

function flash(txt, col) {
    document.getElementById('msg-box').innerText = txt;
    document.getElementById('msg-box').style.color = col;
}

function showResults() {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('result-screen').classList.add('active');
    document.getElementById('res-me').innerText = game.scoreMe;
    document.getElementById('res-opp').innerText = game.scoreOpp;
}

function copyID() {
    navigator.clipboard.writeText(myCode);
    alert("Kod kopyalandı!");
}
