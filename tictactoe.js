let tttBoard = Array(9).fill(null);
let tttMyTurn = false;
let mySymbol = 'X';

function initTTT() {
    tttBoard = Array(9).fill(null);
    tttMyTurn = isHost;
    mySymbol = isHost ? 'X' : 'O';
    renderTTT();
}

function renderTTT() {
    const area = document.getElementById('game-tictactoe');
    area.innerHTML = `
        <div class="ttt-header">${tttMyTurn ? 'SENİN SIRAN' : 'RAKİPTE...'}</div>
        <div class="ttt-grid">
            ${tttBoard.map((v, i) => `<div class="cell" onclick="clickTTT(${i})">${v || ''}</div>`).join('')}
        </div>
    `;
}

function clickTTT(i) {
    if(!tttMyTurn || tttBoard[i]) return;
    tttBoard[i] = mySymbol;
    tttMyTurn = false;
    renderTTT();
    sendData({ type: 'ttt_move', index: i });
    checkTTTWin();
}

function handleTTT(msg) {
    if(msg.type === 'ttt_move') {
        tttBoard[msg.index] = (mySymbol === 'X' ? 'O' : 'X');
        tttMyTurn = true;
        renderTTT();
        checkTTTWin();
    }
}

function checkTTTWin() {
    const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    for(let l of lines) {
        if(tttBoard[l[0]] && tttBoard[l[0]] === tttBoard[l[1]] && tttBoard[l[0]] === tttBoard[l[2]]) {
            finishGame(tttBoard[l[0]] === mySymbol ? "KAZANDIN!" : "KAYBETTİN");
            return;
        }
    }
    if(!tttBoard.includes(null)) finishGame("BERABERE!");
}

function finishGame(txt) {
    document.getElementById('winner-text').innerText = txt;
    showScreen('result-screen');
}
