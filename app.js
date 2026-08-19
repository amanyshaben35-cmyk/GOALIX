const matches=[
 {id:1,league:'Premier League',home:'Liverpool',away:'Arsenal',time:'20:00',stats:'ليفربول يمتلك أفضلية هجومية على أرضه، بينما أرسنال قوي في الاستحواذ.'},
 {id:2,league:'La Liga',home:'Barcelona',away:'Sevilla',time:'21:30',stats:'برشلونة يدخل المباراة بمتوسط فرص أعلى، مع أفضلية واضحة في صناعة الفرص.'},
 {id:3,league:'Serie A',home:'Inter',away:'Roma',time:'22:00',stats:'إنتر أكثر استقرارًا دفاعيًا، وروما يعتمد على التحولات السريعة.'}
];
const grid=document.getElementById('matchGrid');
function renderMatches(){
 grid.innerHTML=matches.map(m=>`<article class="match">
  <div class="league">${m.league} · ${m.time}</div>
  <div class="teams"><div class="team">${m.home}</div><div class="vs">VS</div><div class="team">${m.away}</div></div>
  <div class="choices">
   <button class="choice" onclick="predict(${m.id},'فوز ${m.home}')">فوز ${m.home}</button>
   <button class="choice" onclick="predict(${m.id},'تعادل')">تعادل</button>
   <button class="choice" onclick="predict(${m.id},'فوز '+ '${m.away}')">فوز ${m.away}</button>
  </div>
 </article>`).join('');
}
function predict(id,label){
 const m=matches.find(x=>x.id===id);
 document.getElementById('analysis').innerHTML=`<div class="analysis-box"><b>${m.home} × ${m.away}</b><p>توقعك: <strong>${label}</strong></p><p>${m.stats}</p><p>سيتم احتساب النقاط بعد اعتماد النتيجة الرسمية.</p></div>`;
 showToast('تم تسجيل توقعك بنجاح');
}
function showToast(t){const x=document.getElementById('toast');x.textContent=t;x.classList.add('show');setTimeout(()=>x.classList.remove('show'),2200)}
function scrollToMatches(){document.getElementById('matches').scrollIntoView({behavior:'smooth'})}
renderMatches();
