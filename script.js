// DUELLY v2.1 - Enhanced Competitive Scoring
let myCode, peer, conn, isHost = false, currentBank = null;
let game = { scoreMe: 0, scoreOpp: 0, round: 1, max: 10, currentQ: null, jokerUsed: false, locked: true };
let usedQuestions = [], myAttempted = false, oppAttempted = false;
let firstSolver = null;

const sfxCorrect = new Audio('dogru.mp3'); 
const sfxWrong = new Audio('yanlis.mp3');

window.onload = () => {
    if (typeof Peer === 'undefined') {
        setTimeout(() => location.reload(), 1000);
        return;
    }
    initGame();
};

function initGame() {
    myCode = Math.floor(100000 + Math.random() * 900000).toString();
    peer = new Peer(myCode);
    peer.on('open', id => { document.getElementById('display-id').innerText = id; });
    peer.on('connection', c => { conn = c; isHost = true; handleConnection(); });
}

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

function selectCategory(catKey) {
    currentBank = window[catKey + "Data"];
    document.getElementById('cat-label').innerText = catKey.toUpperCase();
    document.getElementById('host-panel').style.display = 'block';
}

function connectToFriend() {
    const target = document.getElementById('peer-id').value;
    if(target.length < 6) return;
    conn = peer.connect(target, { serialization: 'none' }); 
    isHost = false;
    handleConnection();
}

function handleConnection() {
    conn.on('open', () => {
        showScreen('game-area');
        if(isHost) {
            safeSend({ type: 'init_cat', cat: document.getElementById('cat-label').innerText });
            setTimeout(hostNextRound, 1000);
        }
    });
    conn.on('data', rawData => {
        let data;
        try { data = (typeof rawData === 'string') ? JSON.parse(rawData) : rawData; } catch (e) { return; }
        
        if(data.type === 'init_cat') currentBank = window[data.cat.toLowerCase() + "Data"];
        if(data.type === 'next_question') { resetRoundState(); game.round = data.round; renderQuestion(data.val); }
        if(data.type === 'point') {
            game.scoreOpp += data.pts;
            if(data.isFirst) firstSolver = 'opp';
            updateUI();
            oppAttempted = true;
            checkRoundEnd();
        }
        if(data.type === 'wrong_attempt') {
            oppAttempted = true;
            checkRoundEnd();
        }
        if(data.type === 'emoji') showEmoji(data.val);
        if(data.type === 'end') showResults();
    });
}

function safeSend(obj) { if(conn && conn.open) conn.send(JSON.stringify(obj)); }

function hostNextRound() {
    if(!isHost) return;
    if(game.round > game.max) { safeSend({ type: 'end' }); showResults(); return; }
    let diff = game.round <= 3 ? "easy" : (game.round <= 7 ? "medium" : "hard");
    let pool = currentBank[diff].filter(q => !usedQuestions.includes(q.q));
    if(pool.length === 0) pool = currentBank[diff];
    const q = pool[Math.floor(Math.random() * pool.length)];
    usedQuestions.push(q.q);
    resetRoundState(); renderQuestion(q);
    safeSend({ type: 'next_question', val: q, round: game.round });
}

function resetRoundState() {
    myAttempted = false; oppAttempted = false; game.locked = true; firstSolver = null;
    document.getElementById('msg-box').innerText = ""; 
    document.getElementById('msg-box').style.color = "white";
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
                sfxCorrect.play().catch(()=>{});
                btn.style.background = "#238636";
                myAttempted = true;
                let earned = (firstSolver === null) ? 15 : 5;
                game.scoreMe += earned;
                if(firstSolver === null) firstSolver = 'me';
                updateUI();
                safeSend({ type: 'point', pts: earned, isFirst: (firstSolver === 'me') });
                checkRoundEnd();
            } else {
                sfxWrong.play().catch(()=>{});
                btn.style.background = "#ff007f";
                myAttempted = true;
                safeSend({ type: 'wrong_attempt' });
                checkRoundEnd();
            }
        };
        grid.appendChild(btn);
    });
    setTimeout(() => { document.querySelectorAll('.opt-btn').forEach(b => b.classList.add('show')); game.locked = false; }, 1500);
}

function checkRoundEnd() {
    if(myAttempted && oppAttempted) {
        game.locked = true;
        highlightCorrect();
        if(isHost) { game.round++; setTimeout(hostNextRound, 3000); }
    }
}

function highlightCorrect() {
    document.querySelectorAll('.opt-btn').forEach(btn => {
        if(btn.innerText === game.currentQ.a) {
            btn.style.border = "3px solid #00ffcc";
            btn.style.boxShadow = "0 0 15px #00ffcc";
        }
    });
    if(firstSolver === null) {
        document.getElementById('msg-box').innerText = "DOĞRU CEVAP: " + game.currentQ.a;
        document.getElementById('msg-box').style.color = "#00ffcc";
    }
}

function updateUI() {
    document.getElementById('my-score').innerText = game.scoreMe;
    document.getElementById('opp-score').innerText = game.scoreOpp;
}

function sendEmoji(e) { showEmoji(e); safeSend({ type: 'emoji', val: e }); }
function showEmoji(e) {
    const el = document.getElementById('emoji-display');
    el.innerText = e; el.style.display = 'block'; setTimeout(() => el.style.display = 'none', 1000);
}

function useJoker() {
    if (game.jokerUsed || game.locked || myAttempted) return;
    const btns = Array.from(document.querySelectorAll('.opt-btn'));
    const wrong = btns.filter(b => b.innerText !== game.currentQ.a);
    for (let i = 0; i < 2; i++) {
        if(wrong.length > 0) {
            const idx = Math.floor(Math.random() * wrong.length);
            wrong[idx].classList.add('hidden'); wrong.splice(idx, 1);
        }
    }
    game.jokerUsed = true; document.getElementById('joker-btn').disabled = true;
}

function showResults() {
    showScreen('result-screen');
    document.getElementById('res-me').innerText = game.scoreMe;
    document.getElementById('res-opp').innerText = game.scoreOpp;
}

function copyID() {
    const t = document.getElementById('display-id').innerText;
    navigator.clipboard.writeText(t);
    document.getElementById('display-id').innerText = "KOPYALANDI!";
    setTimeout(() => document.getElementById('display-id').innerText = t, 2000);
}
