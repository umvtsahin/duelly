const myCode = Math.floor(100000 + Math.random() * 900000).toString();
const peer = new Peer(myCode);
let conn;
let isHost = false;
let gameStarted = false;
let currentBank = null; // Seçilen kategori soruları buraya dolacak

let game = {
    scoreMe: 0, scoreOpp: 0, round: 1, max: 10,
    currentQ: null, jokerUsed: false, locked: false
};

peer.on('open', id => { document.getElementById('display-id').innerText = id; });

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

// HOST: Kategori seçtiğinde çalışır
function selectCategory(catKey) {
    // Örn: genelkulturData değişkenini window üzerinden bulur
    currentBank = window[catKey + "Data"];
    if(!currentBank) return alert("Bu kategori dosyası henüz yüklenmedi!");
    
    document.getElementById('cat-label').innerText = catKey;
    document.getElementById('host-panel').style.display = 'block';
    isHost = true;

    peer.on('connection', c => {
        if (gameStarted) return;
        conn = c;
        setupBattle();
    });
}

// GUEST: Koda basıp bağlanınca çalışır
function connectToFriend() {
    const target = document.getElementById('peer-id').value;
    if (target === myCode) return alert("Kendi kodunla tek başına oynayamazsın!");
    
    conn = peer.connect(target);
    conn.on('open', () => setupBattle());
}

function setupBattle() {
    gameStarted = true;
    showScreen('game-area');

    conn.on('data', data => {
        if(data.type === 'init_cat') {
            currentBank = window[data.cat + "Data"];
            document.getElementById('cat-label').innerText = data.cat;
        }
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

    if(isHost) {
        const activeCat = document.getElementById('cat-label').innerText;
        conn.send({ type: 'init_cat', cat: activeCat });
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
    const pool = currentBank[diff];
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
    
    const grid = document.getElementById('options-grid');
    grid.innerHTML = "";
    q.options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'opt-btn';
        btn.innerText = opt;
        btn.onclick = () => checkAnswer(opt, btn);
        grid.appendChild(btn);
    });
}

function checkAnswer(selected, btn) {
    if(game.locked) return;
    if(selected === game.currentQ.a) {
        lockInput();
        btn.style.background = "#238636";
        game.scoreMe += 10;
        updateUI();
        flash("DOĞRU!", "#00f2ff");
        conn.send({ type: 'point', pts: 10 });
        if(isHost) { game.round++; setTimeout(hostNextRound, 2000); }
    } else {
        btn.style.background = "#ff007f";
        btn.disabled = true;
    }
}

function useJoker() {
    if(game.jokerUsed || game.locked) return;
    const btns = Array.from(document.querySelectorAll('.opt-btn'));
    const wrongBtns = btns.filter(b => b.innerText !== game.currentQ.a);
    for(let i=0; i<2; i++){
        const rnd = Math.floor(Math.random()*wrongBtns.length);
        wrongBtns[rnd].classList.add('hidden');
        wrongBtns.splice(rnd, 1);
    }
    game.jokerUsed = true;
    document.getElementById('joker-btn').disabled = true;
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
    const m = document.getElementById('msg-box');
    m.innerText = txt; m.style.color = col;
}

function showResults() {
    showScreen('result-screen');
    document.getElementById('res-me').innerText = game.scoreMe;
    document.getElementById('res-opp').innerText = game.scoreOpp;
}

function copyID() {
    navigator.clipboard.writeText(myCode);
    alert("Kod kopyalandı!");
}
