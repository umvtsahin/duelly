let qS = { me:0, opp:0, r:1, myD:false, oppD:false, f:null };
function initQuiz() { qS={me:0, opp:0, r:1, myD:false, oppD:false, f:null}; if(isHost) nextQ(); }
function nextQ() {
    let pool = window[selectedCat+"Data"];
    let q = pool["easy"][Math.floor(Math.random()*pool["easy"].length)];
    sendData({type:'q_q', q:q, r:qS.r}); handleQuiz({type:'q_q', q:q, r:qS.r});
}
function handleQuiz(m) {
    if(m.type==='q_q') { qS.myD=false; qS.oppD=false; qS.f=null; renderQ(m.q, m.r); }
    if(m.type==='q_p') { qS.opp+=m.p; if(m.f) qS.f='o'; qS.oppD=true; checkEnd(); }
}
function renderQ(q, r) {
    document.getElementById('game-quiz').innerHTML = `<div>${qS.me} - ${qS.opp} (TUR ${r})</div><h2>${q.q}</h2>${q.options.map(o=>`<button class="opt-btn" onclick="ans('${o}','${q.a}',this)">${o}</button>`).join('')}`;
}
function ans(o, a, b) {
    if(qS.myD) return; qS.myD=true;
    if(o===a) { let p=qS.f?5:15; qS.me+=p; if(!qS.f) qS.f='m'; sendData({type:'q_p', p:p, f:true}); b.style.background="green"; }
    else { sendData({type:'q_p', p:0, f:false}); b.style.background="red"; }
    checkEnd();
}
function checkEnd() { if(qS.myD && qS.oppD) setTimeout(()=> { if(isHost){ qS.r++; if(qS.r>10) location.reload(); else nextQ(); }}, 2000); }
