let memCards = [];
let flipped = [];
let memScores = { me: 0, opp: 0 };
let memTurn = false;

function initHafiza() {
    memScores = { me: 0, opp: 0 };
    memTurn = isHost;
    if(isHost) {
        let icons = ["⚡","⚡","🔥","🔥","☀️","☀️","❄️","❄️","💧","💧","🍀","🍀"];
        icons = icons.sort(() => Math.random() - 0.5);
        sendData({ type: 'mem_init', cards: icons });
        setupMem(icons);
    }
}

function setupMem(cards) {
    memCards = cards;
    renderMem();
}

function renderMem() {
    const area = document.getElementById('game-hafiza');
    area.innerHTML = `
        <div class="top-nav">
            <div class="score-box">SİZ: ${memScores.me}</div>
            <div class="status-msg">${memTurn ? 'SENİN SIRAN' : 'RAKİPTE...'}</div>
            <div class="score-box">RAKİP: ${memScores.opp}</div>
        </div>
        <div class="mem-grid">
            ${memCards.map((c, i) => `<div class="mem-card" id="mc-${i}" onclick="flipMem(${i})">?</div>`).join('')}
        </div>
    `;
}

function flipMem(i) {
    if(!memTurn || flipped.length >= 2 || document.getElementById('mc-'+i).innerText !== "?") return;
    
    document.getElementById('mc-'+i).innerText = memCards[i];
    document.getElementById('mc-'+i).classList.add('flipped');
    flipped.push(i);
    sendData({ type: 'mem_flip', idx: i });
    
    if(flipped.length === 2) {
        if(memCards[flipped[0]] === memCards[flipped[1]]) {
            memScores.me++;
            flipped = [];
            if(memScores.me + memScores.opp === 6) showFinish("OYUN BİTTİ!");
            renderMem();
        } else {
            memTurn = false;
            setTimeout(() => {
                document.getElementById('mc-'+flipped[0]).innerText = "?";
                document.getElementById('mc-'+flipped[1]).innerText = "?";
                document.getElementById('mc-'+flipped[0]).classList.remove('flipped');
                document.getElementById('mc-'+flipped[1]).classList.remove('flipped');
                flipped = [];
                renderMem();
            }, 1000);
        }
    }
}

function handleHafiza(msg) {
    if(msg.type === 'mem_init') setupMem(msg.cards);
    if(msg.type === 'mem_flip') {
        const card = document.getElementById('mc-'+msg.idx);
        card.innerText = memCards[msg.idx];
        card.classList.add('flipped');
        flipped.push(msg.idx);
        if(flipped.length === 2) {
            if(memCards[flipped[0]] === memCards[flipped[1]]) {
                memScores.opp++;
                flipped = [];
                renderMem();
            } else {
                setTimeout(() => {
                    document.getElementById('mc-'+flipped[0]).innerText = "?";
                    document.getElementById('mc-'+flipped[1]).innerText = "?";
                    flipped = [];
                    memTurn = true;
                    renderMem();
                }, 1000);
            }
        }
    }
}
