let qS = { me:0, opp:0, r:1, myD:false, oppD:false, f:null };

function initQuiz() {
    qS = { me:0, opp:0, r:1, myD:false, oppD:false, f:null };
    if(isHost) setTimeout(nextQ, 1000); 
}

function nextQ() {
    // Dinamik olarak window[genelkulturData] gibi değişkenleri okur
    const dataName = selectedCat + "Data";
    if(!window[dataName]) {
        console.error(dataName + " bulunamadı! Dosya adını ve içindeki değişkeni kontrol et.");
        return;
    }
    
    let pool = window[dataName];
    let diff = qS.r <= 3 ? "easy" : (qS.r <= 7 ? "medium" : "hard");
    let questions = pool[diff];
    let q = questions[Math.floor(Math.random() * questions.length)];
    
    let payload = {type:'q_q', q:q, r:qS.r};
    sendData(payload);
    handleQuiz(payload);
}

function handleQuiz(m) {
    if(m.type === 'q_q') {
        qS.myD = false; qS.oppD = false; qS.f = null;
        renderQ(m.q, m.r);
    }
    if(m.type === 'q_p') {
        qS.opp += m.p;
        if(m.f) qS.f = 'o';
        qS.oppD = true;
        updateQScore();
        checkEnd();
    }
}

function renderQ(q, r) {
    const area = document.getElementById('game-quiz');
    area.innerHTML = `
        <div class="top-nav">
            <div>SİZ: <span id="qm">${qS.me}</span></div>
            <div>TUR ${r}/10</div>
            <div>RAKİP: <span id="qo">${qS.opp}</span></div>
        </div>
        <div class="q-area">
            <h2 class="q-text">${q.q}</h2>
            <div class="opt-container">
                ${q.options.map(o => `<button class="opt-btn" onclick="ans('${o}','${q.a}',this)">${o}</button>`).join('')}
            </div>
        </div>
    `;
}

function ans(o, a, b) {
    if(qS.myD) return;
    qS.myD = true;
    if(o === a) {
        let p = (qS.f === null) ? 15 : 5;
        qS.me += p;
        if(qS.f === null) qS.f = 'm';
        sendData({type:'q_p', p:p, f:true});
        b.style.background = "var(--p)";
        b.style.color = "black";
    } else {
        sendData({type:'q_p', p:0, f:false});
        b.style.background = "var(--s)";
    }
    updateQScore();
    checkEnd();
}

function updateQScore() {
    if(document.getElementById('qm')) document.getElementById('qm').innerText = qS.me;
    if(document.getElementById('qo')) document.getElementById('qo').innerText = qS.opp;
}

function checkEnd() {
    if(qS.myD && qS.oppD) {
        setTimeout(() => {
            if(isHost) {
                qS.r++;
                if(qS.r > 10) {
                    alert(qS.me > qS.opp ? "KAZANDIN!" : "KAYBETTİN");
                    location.reload();
                } else {
                    nextQ();
                }
            }
        }, 2000);
    }
}
