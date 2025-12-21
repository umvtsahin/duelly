let myCode = Math.floor(100000 + Math.random() * 900000).toString();
let peer = new Peer(myCode);
let conn, isHost = false, currentBank = null;
let game = { scoreMe: 0, scoreOpp: 0, round: 1, max: 10, currentQ: null, jokerUsed: false, locked: true };

let usedQuestions = [];
let myAttempted = false;
let oppAttempted = false;

// SESLER (Klasöründe dogru.mp3 ve yanlis.mp3 olmalı)
const sfxCorrect = new Audio('dogru.mp3');
const sfxWrong = new Audio('yanlis.mp3');

peer.on('open', id => { document.getElementById('display-id').innerText = id; });

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

function selectCategory(catKey) {
    currentBank = window[catKey + "Data"];
    document.getElementById('cat-label').innerText = catKey.toUpperCase();
    document.getElementById('host-panel').style.display = 'block';
    isHost = true;
    peer.on('connection', c => { conn = c; setupBattle(); });
}

function connectToFriend() {
    const target = document.getElementById('peer-id').value;
    conn = peer.connect(target);
    conn.on('open', () => setupBattle());
}

function setupBattle() {
    showScreen('game-area');
    conn.on('data', data => {
        if(data.type === 'init_cat') currentBank = window[data.cat.toLowerCase() + "Data"];
        if(data.type === 'next_question') { game.round = data.round; renderQuestion(data.val); }
        if(data.type === 'point') { 
            game.scoreOpp += data.pts; updateUI(); 
            game.locked = true; 
            if(isHost) { game.round++; setTimeout(hostNextRound, 2000); }
        }
        if(data.type === 'wrong_attempt') { oppAttempted = true; checkBothWrong(); }
        if(data.type === 'emoji') { showEmoji(data.val); }
        if(data.type === 'end') showResults();
    });
    if(isHost) {
        conn.send({ type: 'init_cat', cat: document.getElementById('cat-label').innerText });
        hostNextRound();
    }
}

function hostNextRound() {
    if(!isHost) return;
    if(game.round > game.max) { conn.send({ type: 'end' }); showResults(); return; }
    
    let diff = game.round <= 3 ? "easy" : (game.round <= 7 ? "medium" : "hard");
    let pool = currentBank[diff].filter(q => !usedQuestions.includes(q.q));
    if(pool.length === 0) pool = currentBank[diff]; 

    const q = pool[Math.floor(Math.random() * pool.length)];
    usedQuestions.push(q.q);
    
    resetRoundState();
    renderQuestion(q);
    conn.send({ type: 'next_question', val: q, round: game.round });
}

function resetRoundState() {
    myAttempted = false;
    oppAttempted = false;
    game.locked = true; 
    document.getElementById('msg-box').innerText = "";
}

function renderQuestion(q) {
    game.currentQ = q;
    document.getElementById('question-text').innerText = q.q;
    document.getElementById('round-info').innerText = `${game.round} / ${game.max}`;
    
    const grid = document.getElementById('options-grid');
    grid.innerHTML = "";

    q.options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'opt-btn'; 
        btn.innerText = opt;
        btn.onclick = () => {
            if(game.locked || myAttempted) return;
            if(opt === game.currentQ.a) {
                sfxCorrect.play().catch(e => {}); 
                btn.style.background = "#238636";
                game.scoreMe += 10; updateUI(); game.locked = true;
                conn.send({ type: 'point', pts: 10 });
                if(isHost) { game.round++; setTimeout(hostNextRound, 2000); }
            } else {
                sfxWrong.play().catch(e => {}); 
                myAttempted = true;
                btn.style.background = "#ff007f"; btn.disabled = true;
                conn.send({ type: 'wrong_attempt' });
                checkBothWrong();
            }
        };
        grid.appendChild(btn);
    });

    // 1.5 Saniye sonra şıkları göster ve kilidi aç
    setTimeout(() => {
        document.querySelectorAll('.opt-btn').forEach(btn => btn.classList.add('show'));
        game.locked = false;
    }, 1500);
}

function checkBothWrong() {
    if(myAttempted && oppAttempted) {
        document.getElementById('msg-box').innerText = "KİMSE BİLEMEDİ!";
        if(isHost) { game.round++; setTimeout(hostNextRound, 2000); }
    }
}

function updateUI() {
    document.getElementById('my-score').innerText = game.scoreMe;
    document.getElementById('opp-score').innerText = game.scoreOpp;
}

function sendEmoji(emoji) {
    showEmoji(emoji);
    conn.send({ type: 'emoji', val: emoji });
}

function showEmoji(emoji) {
    const el = document.getElementById('emoji-display');
    el.innerText = emoji; el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 1000);
}

function useJoker() {
    if (game.jokerUsed || game.locked || myAttempted) return;
    const btns = Array.from(document.querySelectorAll('.opt-btn'));
    const wrongOnes = btns.filter(b => b.innerText !== game.currentQ.a);
    for (let i = 0; i < 2; i++) {
        const index = Math.floor(Math.random() * wrongOnes.length);
        wrongOnes[index].classList.add('hidden');
        wrongOnes.splice(index, 1);
    }
    game.jokerUsed = true;
    document.getElementById('joker-btn').disabled = true;
}

function showResults() {
    showScreen('result-screen');
    document.getElementById('res-me').innerText = game.scoreMe;
    document.getElementById('res-opp').innerText = game.scoreOpp;
    document.getElementById('winner-text').innerText = game.scoreMe > game.scoreOpp ? "ZAFER SENİN!" : "RAKİP KAZANDI!";
}

function copyID() { 
    navigator.clipboard.writeText(myCode); 
    const btn = document.getElementById('display-id');
    const oldText = btn.innerText;
    btn.innerText = "KOPYALANDI!";
    setTimeout(() => btn.innerText = oldText, 2000);
}
function closePwa() { document.getElementById('pwa-prompt').style.display = 'none'; }
