let mC = [], mF = [], mS = {m:0, o:0}, mT = false;
function initHafiza() { mT=isHost; if(isHost) { let i=["A","A","B","B","C","C","D","D","E","E","F","F"].sort(()=>Math.random()-0.5); sendData({type:'h_i', c:i}); setupH(i); } }
function setupH(c) { mC=c; mS={m:0, o:0}; renderH(); }
function renderH() {
    document.getElementById('game-hafiza').innerHTML = `<div>${mS.m}-${mS.o}</div><div class="mem-grid">${mC.map((v,i)=>`<div class="mem-card" id="h-${i}" onclick="flipH(${i})">?</div>`).join('')}</div>`;
}
function flipH(i) {
    if(!mT || mF.length>=2 || document.getElementById('h-'+i).innerText!=="?") return;
    document.getElementById('h-'+i).innerText=mC[i]; mF.push(i); sendData({type:'h_f', i:i});
    if(mF.length===2) {
        if(mC[mF[0]]===mC[mF[1]]) { mS.m++; mF=[]; if(mS.m+mS.o===6) alert("BİTTİ"); }
        else { mT=false; setTimeout(()=>{ document.getElementById('h-'+mF[0]).innerText="?"; document.getElementById('h-'+mF[1]).innerText="?"; mF=[]; renderH(); }, 1000); }
    }
}
function handleHafiza(m) {
    if(m.type==='h_i') setupH(m.c);
    if(m.type==='h_f') { document.getElementById('h-'+m.i).innerText=mC[m.i]; mF.push(m.i); if(mF.length===2) { if(mC[mF[0]]===mC[mF[1]]){ mS.o++; mF=[]; } else { setTimeout(()=>{ document.getElementById('h-'+mF[0]).innerText="?"; document.getElementById('h-'+mF[1]).innerText="?"; mF=[]; mT=true; renderH(); },1000); } } }
}
