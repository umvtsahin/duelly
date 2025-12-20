// Oda ve Peer Kurulumu
let myCode = Math.floor(100000 + Math.random() * 900000).toString();
let peer = new Peer(myCode);
let conn;
let isHost = false;
let gameStarted = false;
let currentBank = null;

let game = {
    scoreMe: 0,
    scoreOpp: 0,
    round: 1,
    max: 10,
    currentQ: null,
    jokerUsed: false,
    locked: false
};

peer.on('open', id => {
    document.getElementById('display-id').innerText = id;
});

// Ekran Yönetimi
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

// Kategori Seçimi (Host için)
function selectCategory(catKey) {
    // Veriye window üzerinden erişiyoruz
    const dataName = catKey + "Data";
    currentBank = window[dataName];

    if (!currentBank) {
        alert("Hata: " + catKey + " dosyası yüklenemedi!");
        return;
    }

    document.getElementById('cat-label').innerText = catKey.toUpperCase();
    document.getElementById('host-panel').style.display = 'block';
    isHost = true;

    peer.on('connection', c => {
        if (gameStarted) return;
        conn = c;
        setupBattle();
    });
}

// Rakibe Bağlanma (Guest için)
function connectToFriend() {
    const target = document.getElementById('peer-id').value;
    if (target.length !== 6) return alert("6 haneli kodu girin!");
    
    conn = peer.connect(target);
    conn.on('open', () => setupBattle());
}

// Savaş Başlatma
function setupBattle() {
    gameStarted = true;
    showScreen('game-area');

    conn.on('data', data => {
        if (data.type === 'init_cat') {
            currentBank = window[data.cat.toLowerCase() + "Data"];
            document.getElementById('cat-label').innerText = data.cat;
        }
        if (data.type === 'next_question') {
            game.round = data.round;
            renderQuestion(data.val);
        }
        if (data.type === 'point') {
            game.scoreOpp += data.pts;
            updateUI();
            lockInput();
            if (isHost) {
                game.round++;
                setTimeout(hostNextRound, 2000);
            }
        }
        if (data.type === 'end') showResults();
    });

    if (isHost) {
        const activeCat = document.getElementById('cat-label').innerText;
        conn.send({ type: 'init_cat', cat: activeCat });
        setTimeout(hostNextRound, 1500);
    }
}

// Host Soru Dağıtımı
function hostNextRound() {
    if (game.round > game.max) {
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

// Soruyu Ekrana Basma
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

// Cevap Kontrolü
function checkAnswer(selected, btn) {
    if (game.locked) return;

    if (selected === game.currentQ.a) {
        lockInput();
        btn.style.background = "#238636";
        game.scoreMe += 10;
        updateUI();
        conn.send({ type: 'point', pts: 10 });
        if (isHost) {
            game.round++;
            setTimeout(hostNextRound, 2000);
        }
    } else {
        btn.style.background = "#ff007f";
        btn.disabled = true;
        if (navigator.vibrate) navigator.vibrate(100);
    }
}

function lockInput() {
    game.locked = true;
    document.querySelectorAll('.opt-btn').forEach(b => b.disabled = true);
}

function updateUI() {
    document.getElementById('my-score').innerText = game.scoreMe;
    document.getElementById('opp-score').innerText = game.scoreOpp;
}

function useJoker() {
    if (game.jokerUsed || game.locked) return;
    const btns = Array.from(document.querySelectorAll('.opt-btn'));
    const wrongOnes = btns.filter(b => b.innerText !== game.currentQ.a);
    
    // Rastgele 2 yanlışı gizle
    for (let i = 0; i < 2; i++) {
        if (wrongOnes.length > 0) {
            const index = Math.floor(Math.random() * wrongOnes.length);
            wrongOnes[index].classList.add('hidden');
            wrongOnes.splice(index, 1);
        }
    }
    game.jokerUsed = true;
    document.getElementById('joker-btn').disabled = true;
    document.getElementById('joker-btn').innerText = "JOKER KULLANILDI";
}

function showResults() {
    showScreen('result-screen');
    document.getElementById('res-me').innerText = game.scoreMe;
    document.getElementById('res-opp').innerText = game.scoreOpp;
    const winTxt = document.getElementById('winner-text');
    if (game.scoreMe > game.scoreOpp) winTxt.innerText = "ZAFER SENİN!";
    else if (game.scoreMe < game.scoreOpp) winTxt.innerText = "RAKİP KAZANDI!";
    else winTxt.innerText = "BERABERE!";
}

// --- PWA VE MOBİL REHBER MANTIĞI ---
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    document.getElementById('pwa-prompt').style.display = 'block';
    document.getElementById('pwa-install-btn').style.display = 'block';
});

const isIos = () => /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
const isStandalone = () => ('standalone' in window.navigator) && (window.navigator.standalone);

window.addEventListener('load', () => {
    if (isIos() && !isStandalone()) {
        document.getElementById('pwa-prompt').style.display = 'block';
        document.getElementById('pwa-instructions').innerHTML = 'iPhone: <b>Paylaş</b> butonuna bas ve <b>Ana Ekrana Ekle</b> seçeneğine dokun. ✨';
    }
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').catch(() => {});
    }
});

function closePwa() { document.getElementById('pwa-prompt').style.display = 'none'; }
function copyID() {
    navigator.clipboard.writeText(myCode);
    alert("Kod kopyalandı!");
}

document.getElementById('pwa-install-btn')?.addEventListener('click', async () => {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt = null;
        closePwa();
    }
});
