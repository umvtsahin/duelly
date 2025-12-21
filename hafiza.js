let mC = [], mF = [], mS = {m:0, o:0}, mT = false;
function initHafiza() { mT=isHost; if(isHost) { let icons=["🍎","🍎","🚀","🚀","💎","💎","👻","👻","🔥","🔥","⚡","⚡"].sort(()=>Math.random()-0.5); sendData({type:'h_i', c:icons}); setupH(icons); } }
function setupH(c) { mC=c; mS={m:0, o:0}; renderH(); }
function renderH() {
    document.getElementById('game-hafiza').innerHTML = `<div class="top-nav"><div>SİZ: ${mS.m}</div><div>${mT?'SIRA SENDE':'RAKİPTE'}</div><div>RAKİP: ${mS.o}</div></div><div class="mem-grid">${mC.map((v,i)=>`<div class="mem-card" id="h-${i}" onclick="flipH(${i})">?</div>`).join('')}</div>`;
}
function flipH(i) {
    if(!mT || mF.length>=2 || document.getElementById('h-'+i).innerText!=="?") return;
    document.getElementById('h-'+i).innerText=mC[i]; mF.push(i); sendData({type:'h_f', i:i});
    if(mF.length===2) {
        if(mC[mF[0]]===mC[mF[1]]) { mS.m++; mF=[]; if(mS.m+mS.o===6) { alert("KAZANDIN!"); location.reload(); } }
        else { mT=false; setTimeout(()=>{ renderH(); mF=[]; }, 1000); }
    }
}
function handleHafiza(m) {
    if(m.type==='h_i') setupH(m.c);
    if(m.type==='h_f') {
        document.getElementById('h-'+m.i).innerText=mC[m.i]; mF.push(m.i);
        if(mF.length===2) {
            if(mC[mF[0]]===mC[mF[1]]){ mS.o++; mF=[]; if(mS.m+mS.o===6) { alert("KAYBETTİN!"); location.reload(); } }
            else { setTimeout(()=>{ mF=[]; mT=true; renderH(); }, 1000); }
        }
    }
}
