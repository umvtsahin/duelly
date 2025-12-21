let myCode = Math.floor(100000 + Math.random() * 900000).toString();
const peer = new Peer(myCode);
let conn, isHost = false, currentBank = null;
let game = { scoreMe: 0, scoreOpp: 0, round: 1, max: 10, currentQ: null, jokerUsed: false, locked: true };

let usedQuestions = [];
let myAttempted = false;
let oppAttempted = false;

// SESLER - Sadece senin istediğin isimlerle
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
    peer.on('connection', c => {
        conn = c;
        handleConnection();
    });
}

function connectToFriend() {
    const target = document.getElementById('peer-id').value;
    if(target.length < 6) return;
    conn = peer.connect(target);
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
        try {
            data = (typeof rawData === 'string') ? JSON.parse(rawData) : rawData;
        } catch (e) { return; }

        if(data.type === 'init_cat') currentBank = window[data.cat.toLowerCase() + "Data"];
        if(data.type === 'next_question') {
            resetRoundState();
            game.round = data.round;
            renderQuestion(data.val);
        }
        if(data.type === 'point') {
            game.scoreOpp += data.pts;
            updateUI();
            game.locked = true;
            if(isHost) { game.round++; setTimeout(hostNextRound, 2000); }
        }
        if(data.type === 'wrong_attempt') {
            oppAttempted = true;
            checkBothWrong();
        }
        if(data.type === 'emoji') { showEmoji(data.val); }
        if(data.type === 'end') showResults();
    });
}

function safeSend(obj) {
    if(conn && conn.open) { conn.send(JSON.stringify(obj)); }
}

function hostNextRound() {
    if(!isHost) return;
    if(game.round > game.max) {
        safeSend({ type: 'end' });
        showResults();
        return;
    }
    let diff = game.round <= 3 ? "easy" : (game.round <= 7 ? "medium" : "hard");
    let pool = currentBank[diff].filter(q => !usedQuestions.includes(q.q));
    if(pool.length === 0) pool = currentBank[diff];
    const q = pool[Math.floor(Math.random() * pool.length)];
    usedQuestions.push(q.q);
    resetRoundState();
    renderQuestion(q);
    safeSend({ type: 'next_question', val: q, round: game.round });
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
                sfxCorrect.play().catch(()=>{});
                btn.style.background = "#238636";
                game.scoreMe += 10;
                updateUI();
                game.locked = true;
                safeSend({ type: 'point', pts: 10 });
                if(isHost) { game.round++; setTimeout(hostNextRound, 2000); }
            } else {
                sfxWrong.play().catch(()=>{});
                myAttempted = true;
                btn.style.background = "#ff007f";
                btn.disabled = true;
                safeSend({ type: 'wrong_attempt' });
                checkBothWrong();
            }
        };
        grid.appendChild(btn);
    });
    setTimeout(() => {
        document.querySelectorAll('.opt-btn').forEach(btn => btn.classList.add('show'));
        game.locked = false;
    }, 1500);
}

function checkBothWrong() {
    if(myAttempted && oppAttempted) {
        document.getElementById('msg-box').innerText = "KİMSE BİLEMEDİ!";
        game.locked = true;
        if(isHost) { game.round++; setTimeout(hostNextRound, 2000); }
    }
}

function updateUI() {
    document.getElementById('my-score').innerText = game.scoreMe;
    document.getElementById('opp-score').innerText = game.scoreOpp;
}

function sendEmoji(emoji) {
    showEmoji(emoji);
    safeSend({ type: 'emoji', val: emoji });
}

function showEmoji(emoji) {
    const el = document.getElementById('emoji-display');
    el.innerText = emoji;
    el.style.display = 'block';
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
}

function copyID() {
    navigator.clipboard.writeText(myCode);
    const btn = document.getElementById('display-id');
    btn.innerText = "KOPYALANDI!";
    setTimeout(() => btn.innerText = myCode, 2000);
}
