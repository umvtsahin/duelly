const myCode = Math.floor(100000 + Math.random() * 900000).toString();
const peer = new Peer(myCode);
let conn;
let isHost = false;
let gameStarted = false;

let game = {
    scoreMe: 0,
    scoreOpp: 0,
    round: 1,
    max: 10,
    currentQ: null,
    hintsOpened: 0, // Kaç harf açıldığını takip eder
    locked: false
};

peer.on('open', id => {
    document.getElementById('display-id').innerText = id;
});

// HOST TARAFINDA: Rakip bağlandığında
peer.on('connection', c => {
    if (gameStarted) return;
    conn = c;
    isHost = true;
    setupBattle();
});

// KATILAN TARAFINDA
function connectToFriend() {
    const target = document.getElementById('peer-id').value;
    
    if (target === myCode) {
        alert("Kendi kodunla tek başına oynayamazsın kanka, rakip bul!");
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
    game.hintsOpened = 0; 
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
        if(val === game.currentQ.a.toLowerCase()) {
            lockInput();
            
            // PUANLAMA: 10 - (İpucu Sayısı * 2). Minimum 2 puan.
            let earnedPts = 10 - (game.hintsOpened * 2);
            if (earnedPts < 2) earnedPts = 2;

            game.scoreMe += earnedPts;
            updateUI();
            flash(`+${earnedPts} PUAN!`, "#00f2ff");
            conn.send({ type: 'point', pts: earnedPts });
            
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

// SINIRSIZ İPUCU FONKSİYONU
function getHint() {
    if(game.locked || !game.currentQ) return;
    
    const answer = game.currentQ.a.replace(/\s/g, ''); // Boşlukları sayma
    
    // Eğer hala açılacak harf varsa
    if(game.hintsOpened < answer.length) {
        game.hintsOpened++;
        
        let displayStr = "";
        for(let i = 0; i < answer.length; i++) {
            if(i < game.hintsOpened) {
                displayStr += answer[i].toUpperCase() + " ";
            } else {
                displayStr += "_ ";
            }
        }
        
        document.getElementById('hint-display').innerText = displayStr;
        
        // Ceza hesapla ve göster
        let penaltyScore = 10 - (game.hintsOpened * 2);
        if(penaltyScore < 2) penaltyScore = 2;
        flash(`İPUCU! ŞU AN: ${penaltyScore} PUAN`, "#f1c40f");
    }
}

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
