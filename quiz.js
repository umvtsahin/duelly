let qS = { me:0, opp:0, r:1, myD:false, oppD:false, f:null };
function initQuiz() { qS={me:0, opp:0, r:1, myD:false, oppD:false, f:null}; if(isHost) nextQ(); }
function nextQ() {
    let pool = window[selectedCat+"Data"];
    let diff = qS.r <= 3 ? "easy" : (qS.r <= 7 ? "medium" : "hard");
    let q = pool[diff][Math.floor(Math.random()*pool[diff].length)];
    let payload = {type:'q_q', q:q, r:qS.r};
    sendData(payload); handleQuiz(payload);
}
function handleQuiz(m) {
    if(m.type==='q_q') { qS.myD=false; qS.oppD=false; qS.f=null; renderQ(m.q, m.r); }
    if(m.type==='q_p') { qS.opp+=m.p; if(m.f) qS.f='o'; qS.oppD=true; updateQScore(); checkEnd(); }
}
function renderQ(q, r) {
    document.getElementById('game-quiz').innerHTML = `<div class="top-nav"><div>SİZ: <span id="qm">${qS.me}</span></div><div>TUR ${r}/10</div><div>RAKİP: <span id="qo">${qS.opp}</span></div></div><h2 style="padding:20px; min-height:120px">${q.q}</h2><div style="width:100%">${q.options.map(o=>`<button class="opt-btn" onclick="ans('${o}','${q.a}',this)">${o}</button>`).join('')}</div>`;
}
function ans(o, a, b) {
    if(qS.myD) return; qS.myD=true;
    if(o===a) { let p=qS.f?5:15; qS.me+=p; if(!qS.f) qS.f='m'; sendData({type:'q_p', p:p, f:true}); b.style.background="var(--p)"; b.style.color="black"; }
    else { sendData({type:'q_p', p:0, f:false}); b.style.background="var(--s)"; }
    updateQScore(); checkEnd();
}
function updateQScore() { if(document.getElementById('qm')) { document.getElementById('qm').innerText=qS.me; document.getElementById('qo').innerText=qS.opp; } }
function checkEnd() { if(qS.myD && qS.oppD) setTimeout(()=> { if(isHost){ qS.r++; if(qS.r>10) { alert(qS.me>qS.opp?"KAZANDIN!":"KAYBETTİN"); location.reload(); } else nextQ(); }}, 2000); }
