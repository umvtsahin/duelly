let quizData = { scoreMe: 0, scoreOpp: 0, round: 1, myAttempted: false, oppAttempted: false, firstSolver: null };

function initQuiz() {
    quizData = { scoreMe: 0, scoreOpp: 0, round: 1, myAttempted: false, oppAttempted: false, firstSolver: null };
    if(isHost) startQuizRound();
}

function startQuizRound() {
    let pool = window[selectedCat + "Data"] || genelkulturData;
    let diff = quizData.round <= 3 ? "easy" : (quizData.round <= 7 ? "medium" : "hard");
    let questions = pool[diff];
    let q = questions[Math.floor(Math.random() * questions.length)];
    
    const payload = { type: 'quiz_q', val: q, r: quizData.round };
    sendData(payload);
    handleQuiz(payload);
}

function handleQuiz(msg) {
    if(msg.type === 'quiz_q') {
        quizData.myAttempted = false;
        quizData.oppAttempted = false;
        quizData.firstSolver = null;
        renderQuiz(msg.val, msg.r);
    }
    if(msg.type === 'quiz_p') {
        quizData.scoreOpp += msg.pts;
        if(msg.isFirst) quizData.firstSolver = 'opp';
        quizData.oppAttempted = true;
        updateQuizUI();
        checkQuizEnd();
    }
}

function renderQuiz(q, r) {
    const area = document.getElementById('game-quiz');
    area.innerHTML = `
        <div class="top-nav">
            <div class="score-box">SİZ: <span id="qs-me">${quizData.scoreMe}</span></div>
            <div class="round-indicator">TUR ${r}/10</div>
            <div class="score-box">RAKİP: <span id="qs-opp">${quizData.scoreOpp}</span></div>
        </div>
        <div class="q-container">
            <h2 class="question-text">${q.q}</h2>
            <div class="options-grid">
                ${q.options.map(opt => `<button class="opt-btn" onclick="answerQuiz('${opt}', '${q.a}', this)">${opt}</button>`).join('')}
            </div>
        </div>
    `;
}

function answerQuiz(choice, correct, btn) {
    if(quizData.myAttempted) return;
    quizData.myAttempted = true;

    if(choice === correct) {
        btn.classList.add('correct');
        let pts = (quizData.firstSolver === null) ? 15 : 5;
        quizData.scoreMe += pts;
        if(quizData.firstSolver === null) quizData.firstSolver = 'me';
        sendData({ type: 'quiz_p', pts: pts, isFirst: (quizData.firstSolver === 'me') });
    } else {
        btn.classList.add('wrong');
        sendData({ type: 'quiz_p', pts: 0, isFirst: false });
    }
    updateQuizUI();
    checkQuizEnd();
}

function updateQuizUI() {
    if(document.getElementById('qs-me')) document.getElementById('qs-me').innerText = quizData.scoreMe;
    if(document.getElementById('qs-opp')) document.getElementById('qs-opp').innerText = quizData.scoreOpp;
}

function checkQuizEnd() {
    if(quizData.myAttempted && quizData.oppAttempted) {
        setTimeout(() => {
            if(isHost) {
                quizData.round++;
                if(quizData.round > 10) {
                    let winTxt = quizData.scoreMe > quizData.scoreOpp ? "KAZANDIN!" : (quizData.scoreMe < quizData.scoreOpp ? "KAYBETTİN" : "BERABERE");
                    sendData({type: 'finish', txt: winTxt});
                    showFinish(winTxt);
                } else {
                    startQuizRound();
                }
            }
        }, 2000);
    }
}
