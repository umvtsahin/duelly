let tttBoard = Array(9).fill(null);
let tttTurn = false;
let mySym = 'X';

function initTTT() {
    tttBoard = Array(9).fill(null);
    tttTurn = isHost;
    mySym = isHost ? 'X' : 'O';
    drawTTT();
}

function drawTTT() {
    const area = document.getElementById('game-tictactoe');
    area.innerHTML = `
        <h3 class="status-text">${tttTurn ? 'SENİN SIRAN' : 'RAKİPTE...'} (${mySym})</h3>
        <div class="ttt-grid">
            ${tttBoard.map((v, i) => `<div class="cell" onclick="makeMove(${i})">${v||''}</div>`).join('')}
        </div>
    `;
}

function makeMove(i) {
    if(!tttTurn || tttBoard[i]) return;
    tttBoard[i] = mySym;
    tttTurn = false;
    drawTTT();
    sendData({ type: 'ttt_move', idx: i });
    checkWin();
}

function handleTTT(msg) {
    if(msg.type === 'ttt_move') {
        tttBoard[msg.idx] = (mySym === 'X' ? 'O' : 'X');
        tttTurn = true;
        drawTTT();
        checkWin();
    }
}

function checkWin() {
    const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    for(let w of wins) {
        if(tttBoard[w[0]] && tttBoard[w[0]] === tttBoard[w[1]] && tttBoard[w[0]] === tttBoard[w[2]]) {
            alert(tttBoard[w[0]] === mySym ? "KAZANDIN!" : "KAYBETTİN!");
            location.reload();
            return;
        }
    }
    if(!tttBoard.includes(null)) { alert("BERABERE!"); location.reload(); }
}
