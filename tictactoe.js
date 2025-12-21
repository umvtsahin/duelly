let tttB = Array(9).fill(null), tttT = false, myS = 'X';
function initTTT() { tttB = Array(9).fill(null); tttT = isHost; myS = isHost ? 'X' : 'O'; drawT(); }
function drawT() {
    document.getElementById('game-tictactoe').innerHTML = `<h3>${tttT?'SIRA SENDE':'RAKİPTE'} (${myS})</h3><div class="ttt-grid">${tttB.map((v,i)=>`<div class="cell" onclick="moveT(${i})">${v||''}</div>`).join('')}</div>`;
}
function moveT(i) {
    if(!tttT || tttB[i]) return;
    tttB[i] = myS; tttT = false; drawT();
    sendData({type:'ttt_m', i:i}); checkT();
}
function handleTTT(m) { if(m.type==='ttt_m'){ tttB[m.i]=(myS==='X'?'O':'X'); tttT=true; drawT(); checkT(); } }
function checkT() {
    const w = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    for(let l of w) if(tttB[l[0]] && tttB[l[0]]===tttB[l[1]] && tttB[l[0]]===tttB[l[2]]) { alert(tttB[l[0]]===myS?"KAZANDIN":"KAYBETTİN"); location.reload(); }
}
