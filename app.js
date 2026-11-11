(()=>{
const BASE=window.QUESTION_BANK||[];
const KEY='hn_exam_trainer_state_v2', OLDKEY='hn_exam_trainer_state_v1', CUSTOM='hn_exam_trainer_custom_v2';
const LETTERS='ABCDEF';
const localDate=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const today=()=>localDate(new Date());
const addDays=n=>{const d=new Date();d.setDate(d.getDate()+n);return localDate(d)};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const dl=(name,content,type='application/json')=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([content],{type}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)};
const ansArr=q=>Array.isArray(q.answer)?[...q.answer]:[q.answer];
const ansText=q=>ansArr(q).map(i=>LETTERS[i]).join('、');
const selectedArr=()=>Array.isArray(session?.selected)?session.selected:session?.selected===null?[]:[session.selected];
const sameSet=(a,b)=>{a=[...a].sort((x,y)=>x-y);b=[...b].sort((x,y)=>x-y);return a.length===b.length&&a.every((v,i)=>v===b[i])};
const isHistorical=q=>q.historical===true;
const baseHistorical=()=>bank.filter(isHistorical);

const defaultState=()=>({version:2.9,created:Date.now(),settings:{dailyGoal:20,sessionSize:10,examSize:50,examMinutes:60,examDate:'',theme:'light',defaultPool:'all',textScale:1},answers:{},sessions:[],daily:{},bookmarks:{},reasonCounts:{},notes:{},noteHtml:{},lastMode:null});
function normalizeState(raw){const v=raw&&typeof raw==='object'?raw:{};const s={...defaultState(),...v,version:2.9};s.notes={...(v.notes||{})};s.noteHtml={...(v.noteHtml||{})};for(const [id,item] of Object.entries(v.detailNeeds||{})){if(!s.notes[id]&&item?.note)s.notes[id]=String(item.note)}return s}
function loadState(){
  try{const v=JSON.parse(localStorage.getItem(KEY)||'null');if(v)return normalizeState(v);}catch{}
  // migrate v1 self-authored progress if present
  try{const old=JSON.parse(localStorage.getItem(OLDKEY)||'null');if(old){const s={...defaultState(),...old,version:2};const moved={};Object.entries(old.answers||{}).forEach(([k,v])=>moved[k.startsWith('Q')?'S'+k:k]=v);s.answers=moved;return normalizeState(s);}}catch{}
  return defaultState();
}
let state=loadState();
let custom=(()=>{try{return JSON.parse(localStorage.getItem(CUSTOM)||'[]')}catch{return []}})();
let bank=[...BASE,...custom];
let session=null;
let wrongbookFilter='pending';
const save=()=>{localStorage.setItem(KEY,JSON.stringify(state));localStorage.setItem(CUSTOM,JSON.stringify(custom))};

function rec(qid){return state.answers[qid]||{attempts:0,correct:0,wrong:0,streak:0,interval:0,ease:2.3,due:today(),last:null,lastConfidence:null,totalMs:0,reasons:{},history:[]}}
function wrongStage(r){
 if(!r||(r.wrong||0)===0)return null;
 if(['pending','consolidating','mastered'].includes(r.wrongStage))return r.wrongStage;
 const history=Array.isArray(r.history)?r.history:[];
 if(history.length){
  const last=history[history.length-1];
  if(last.correct===false)return 'pending';
  if(last.correct===true){
   const lastWrong=history.map(x=>x.correct).lastIndexOf(false);
   const corrects=history.slice(lastWrong+1).filter(x=>x.correct===true);
   if(lastWrong>=0&&corrects.length>=2&&corrects.some(x=>x.date>corrects[0].date))return 'mastered';
   return 'consolidating';
  }
 }
 return (r.streak||0)>0?'consolidating':'pending';
}
function activeBlind(q){const r=rec(q.id);return wrongStage(r)==='pending'&&r.lastConfidence===3}
function allWrongQs(pool=bank){return pool.filter(q=>rec(q.id).wrong>0)}
function setrec(qid,r){state.answers[qid]=r}
function mastery(q){const r=rec(q.id);if(!r.attempts)return 0;const acc=r.correct/r.attempts;const conf=(r.lastConfidence||1)/3;const duePenalty=r.due<today()?0.12:0;return Math.round(clamp((.72*acc+.18*conf+.10*Math.min(r.streak/4,1)-duePenalty)*100,0,100))}
function kpStats(){const map={};for(const q of bank){const k=q.domain+'｜'+q.kp;if(!map[k])map[k]={domain:q.domain,kp:q.kp,qs:[],attempts:0,correct:0,wrong:0,mastery:0};map[k].qs.push(q);const r=rec(q.id);map[k].attempts+=r.attempts;map[k].correct+=r.correct;map[k].wrong+=r.wrong;map[k].mastery+=mastery(q)}for(const k in map)map[k].mastery=Math.round(map[k].mastery/map[k].qs.length);return Object.values(map)}
function domainStats(){const m={};for(const q of bank){m[q.domain]??={domain:q.domain,qs:0,attempts:0,correct:0,mastery:0};const d=m[q.domain],r=rec(q.id);d.qs++;d.attempts+=r.attempts;d.correct+=r.correct;d.mastery+=mastery(q)}return Object.values(m).map(d=>({...d,mastery:Math.round(d.mastery/d.qs),accuracy:d.attempts?Math.round(d.correct/d.attempts*100):0}))}
function sourceStats(){const m={};for(const q of baseHistorical()){const k=`${q.year}｜${q.sourceCategory}`;m[k]??={year:q.year,source:q.sourceCategory,qs:0,attempts:0,correct:0};const x=m[k],r=rec(q.id);x.qs++;x.attempts+=r.attempts;x.correct+=r.correct}return Object.values(m).sort((a,b)=>b.year-a.year||a.source.localeCompare(b.source,'zh-Hant')).map(x=>({...x,accuracy:x.attempts?Math.round(x.correct/x.attempts*100):0}))}
function dueQs(pool=bank){return pool.filter(q=>rec(q.id).attempts&&rec(q.id).due<=today())}
function unseen(pool=bank){return pool.filter(q=>!rec(q.id).attempts)}
function wrongQs(pool=bank){return allWrongQs(pool).filter(q=>wrongStage(rec(q.id))==='pending').sort((a,b)=>(rec(a.id).lastWrongReviewAt||0)-(rec(b.id).lastWrongReviewAt||0)||Number(activeBlind(b))-Number(activeBlind(a))||rec(b.id).wrong-rec(a.id).wrong||mastery(a)-mastery(b))}
function totalStats(){let attempts=0,correct=0,ms=0;Object.values(state.answers).forEach(r=>{attempts+=r.attempts||0;correct+=r.correct||0;ms+=r.totalMs||0});return {attempts,correct,accuracy:attempts?Math.round(correct/attempts*100):0,mastered:bank.filter(q=>mastery(q)>=80).length,due:dueQs().length,unseen:unseen().length,blind:bank.filter(activeBlind).length,avgSec:attempts?Math.round(ms/attempts/1000):0}}
function dailyData(){return state.daily[today()]||{answered:0,correct:0}}
function examCountdown(){if(!state.settings.examDate)return null;return Math.ceil((new Date(state.settings.examDate+'T00:00:00')-new Date())/86400000)}
function poolByDefault(){if(state.settings.defaultPool==='historical')return baseHistorical();if(state.settings.defaultPool==='newtaipei')return bank.filter(q=>q.sourceCategory==='新北高中聯招');return bank}

function switchTab(id){document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id===id));document.querySelectorAll('#tabs button').forEach(b=>b.classList.toggle('active',b.dataset.tab===id));render(id)}
document.getElementById('tabs').addEventListener('click',e=>{if(e.target.dataset.tab)switchTab(e.target.dataset.tab)});
document.getElementById('btnQuick').onclick=()=>{switchTab('dashboard');document.querySelector('#dashboard [data-daily-count]')?.focus()};
document.getElementById('btnTheme').onclick=()=>{state.settings.theme=state.settings.theme==='dark'?'light':'dark';applyTheme();save()};
function applyTheme(){document.body.classList.toggle('dark',state.settings.theme==='dark');document.getElementById('btnTheme').textContent=state.settings.theme==='dark'?'淺色':'深色';document.documentElement.style.setProperty('--reader-scale',state.settings.textScale||1)}applyTheme();
function render(id){({dashboard:renderDashboard,practice:renderPracticeHome,wrongbook:renderWrongbook,knowledge:renderKnowledge,stats:renderStats,notes:renderNotes,settings:renderSettings}[id]||(()=>{}))()}

function bindDailyForms(root){
 root.querySelectorAll('[data-daily-form]').forEach(form=>form.onsubmit=e=>{
  e.preventDefault();
  const input=form.querySelector('[data-daily-count]');
  if(!input.reportValidity())return;
  const count=Number(input.value),limit=poolByDefault().length;
  if(!Number.isInteger(count)||count<1||count>limit){alert('本次題數請輸入 1 至 '+limit+' 的整數。');return}
  startMode('daily',count);
 });
}
function renderDashboard(){const t=totalStats(),d=dailyData(),goal=state.settings.dailyGoal,days=examCountdown();const ds=domainStats().sort((a,b)=>a.mastery-b.mastery), hist=baseHistorical().length, self=bank.filter(q=>!isHistorical(q)).length;document.getElementById('dashboard').innerHTML=`
<div class="grid cols4">
 <div class="card metric"><div class="label">今日進度</div><div class="value">${d.answered}/${goal}</div><div class="progress"><i style="width:${clamp(d.answered/goal*100,0,100)}%"></i></div></div>
 <div class="card metric"><div class="label">總正確率</div><div class="value">${t.accuracy}%</div><div class="small muted">累積 ${t.attempts} 次作答</div></div>
 <div class="card metric"><div class="label">今日待複習</div><div class="value">${t.due}</div><div class="small muted">高信心答錯 ${t.blind} 題</div></div>
 <div class="card metric"><div class="label">${days===null?'總題庫':'距考試'}</div><div class="value">${days===null?bank.length:Math.max(days,0)}</div><div class="small muted">${days===null?`真題 ${hist}｜自編 ${self}`:'天'}</div></div>
</div>
<div class="notice" style="margin-top:18px"><b>v2 題庫：</b>20份考卷解析後，納入 ${hist} 題可作答真題；題組前言不當成獨立題。含複選題 ${baseHistorical().filter(q=>q.multi).length} 題。</div>
<div class="section-title"><h2>今天怎麼刷</h2><span class="muted small">到期複習 → 高信心錯題 → 弱點 → 新題</span></div>
<div class="action-grid">
 <form class="daily-start-card" data-daily-form>
 <b>今日智慧練習</b><span class="small muted">到期複習優先，搭配弱點與新題。</span>
 <div class="daily-start-controls"><label>本次題數
 <input type="number" data-daily-count min="1" max="${poolByDefault().length}" inputmode="numeric" step="1" required value="${state.lastMode?.mode==='daily'&&Number.isInteger(state.lastMode.arg)?state.lastMode.arg:(state.settings.sessionSize||10)}"></label>
 <button type="submit" class="primary">開始練習</button></div>
 </form>
 <button class="action" data-mode="newtaipei"><b>新北歷屆真題</b><span>112～115，共 ${bank.filter(q=>q.sourceCategory==='新北高中聯招').length} 題</span></button>
 <button class="action" data-mode="historical"><b>全部高中健護真題</b><span>${hist} 題，109～115</span></button>
 <button class="action" data-mode="due"><b>間隔複習</b><span>${t.due} 題已到期</span></button>
 <button class="action" data-mode="weak"><b>弱點鏢靶</b><span>最低熟練知識點優先</span></button>
 <button class="action" data-mode="wrong"><b>錯題重刷</b><span>${wrongQs().length} 題待訂正</span></button>
 <button class="action" data-mode="sprint"><b>考前衝刺</b><span>盲點＋常錯＋低熟練</span></button>
 <button class="action" data-mode="mock"><b>模擬考</b><span>${state.settings.examSize}題／${state.settings.examMinutes}分鐘</span></button>
</div>
<div class="section-title"><h2>目前最弱領域</h2><button id="goKnowledge">看完整知識地圖</button></div>
<div class="grid cols3">${ds.slice(0,3).map(x=>`<div class="card domain-card"><h3>${esc(x.domain)}</h3><div class="meta"><span>熟練度</span><b>${x.mastery}%</b></div><div class="progress"><i style="width:${x.mastery}%"></i></div><div class="small muted" style="margin-top:8px">正確率 ${x.accuracy}%｜${x.qs}題</div></div>`).join('')}</div>`;
 document.querySelectorAll('#dashboard [data-mode]').forEach(b=>b.onclick=()=>startMode(b.dataset.mode));bindDailyForms(document.getElementById('dashboard'));document.getElementById('goKnowledge').onclick=()=>switchTab('knowledge');}

function renderPracticeHome(){const years=[...new Set(baseHistorical().map(q=>q.year))].sort((a,b)=>b-a), sources=[...new Set(baseHistorical().map(q=>q.sourceCategory))];document.getElementById('practice').innerHTML=`
<div class="section-title"><h2>選擇刷題模式</h2><span class="muted small">可依來源、年份或知識點練習</span></div>
<div class="action-grid">
<form class="daily-start-card" data-daily-form>
 <b>今日智慧練習</b><span class="small muted">自行輸入本次練習題數。</span>
 <div class="daily-start-controls"><label>本次題數
 <input type="number" data-daily-count min="1" max="${poolByDefault().length}" inputmode="numeric" step="1" required value="${state.lastMode?.mode==='daily'&&Number.isInteger(state.lastMode.arg)?state.lastMode.arg:(state.settings.sessionSize||10)}"></label>
 <button type="submit" class="primary">開始練習</button></div>
 </form>
<button class="action" data-mode="newtaipei"><b>新北112～115</b><span>${bank.filter(q=>q.sourceCategory==='新北高中聯招').length}題</span></button>
<button class="action" data-mode="historical"><b>全部歷屆真題</b><span>${baseHistorical().length}題</span></button>
<button class="action" data-mode="recent"><b>114～115真題</b><span>${bank.filter(q=>q.historical&&q.year>=114).length}題</span></button>
<button class="action" data-mode="due"><b>到期複習</b><span>依間隔記憶排程</span></button>
<button class="action" data-mode="weak"><b>弱點鏢靶</b><span>最低熟練知識點優先</span></button>
<button class="action" data-mode="wrong"><b>錯題重刷</b><span>只抽待訂正題目（目前 ${wrongQs().length} 題）</span></button>
<button class="action" data-mode="random"><b>隨機練習</b><span>依設定的預設題庫</span></button>
<button class="action" data-mode="mock"><b>模擬考</b><span>${state.settings.examSize}題／${state.settings.examMinutes}分鐘</span></button>
</div>
<div class="grid cols2" style="margin-top:16px"><div class="card"><h3>依年份</h3><div class="reason-buttons">${years.map(y=>`<button data-year="${y}">${y}年</button>`).join('')}</div></div><div class="card"><h3>依來源</h3><div class="reason-buttons">${sources.map(s=>`<button data-source="${esc(s)}">${esc(s)}</button>`).join('')}</div></div></div>
<div class="section-title"><h2>依領域練習</h2></div><div class="grid cols3">${domainStats().sort((a,b)=>a.domain.localeCompare(b.domain,'zh-Hant')).map(d=>`<button class="action domain-btn" data-domain="${esc(d.domain)}"><b>${esc(d.domain)}</b><span>${d.qs}題｜熟練 ${d.mastery}%</span></button>`).join('')}</div>`;
 document.querySelectorAll('#practice [data-mode]').forEach(b=>b.onclick=()=>startMode(b.dataset.mode));bindDailyForms(document.getElementById('practice'));document.querySelectorAll('.domain-btn').forEach(b=>b.onclick=()=>startMode('domain',b.dataset.domain));document.querySelectorAll('[data-year]').forEach(b=>b.onclick=()=>startMode('year',+b.dataset.year));document.querySelectorAll('[data-source]').forEach(b=>b.onclick=()=>startMode('source',b.dataset.source));}

function dailyQueue(n,pool=poolByDefault()){
 const rank=new Map(kpStats().map(k=>[k.domain+'｜'+k.kp,k.mastery]));
 const due=shuffle(dueQs(pool)).sort((a,b)=>Number(activeBlind(b))-Number(activeBlind(a))||Number(wrongStage(rec(b.id))==='pending')-Number(wrongStage(rec(a.id))==='pending')||mastery(a)-mastery(b));
 const fresh=shuffle(unseen(pool)).sort((a,b)=>(rank.get(a.domain+'｜'+a.kp)||0)-(rank.get(b.domain+'｜'+b.kp)||0));
 return [...due,...fresh].slice(0,n);
}
function startMode(mode,arg){let qs=[],n=state.settings.sessionSize||10,pool=poolByDefault();
 if(mode==='daily'){
  const requested=Number(arg);
  n=Number.isInteger(requested)&&requested>0?requested:n;
  n=Math.min(n,pool.length);
  qs=dailyQueue(n,pool);
  if(qs.length<n&&qs.length>0)alert('目前僅有 '+qs.length+' 題符合到期或未作答條件，為避免提前重複已答對的題目，本次將練習 '+qs.length+' 題。');
 }
 if(mode==='due')qs=shuffle(dueQs(pool)).slice(0,Math.max(n,dueQs(pool).length));
 if(mode==='weak'){const kps=kpStats().sort((a,b)=>a.mastery-b.mastery).slice(0,4);qs=shuffle(kps.flatMap(k=>k.qs)).slice(0,n)}
 if(mode==='wrong')qs=wrongQs(pool).slice(0,n);
 if(mode==='random')qs=shuffle(pool).slice(0,n);
 if(mode==='historical')qs=shuffle(baseHistorical()).slice(0,n);
 if(mode==='newtaipei')qs=shuffle(bank.filter(q=>q.sourceCategory==='新北高中聯招')).slice(0,n);
 if(mode==='recent')qs=shuffle(bank.filter(q=>q.historical&&q.year>=114)).slice(0,n);
 if(mode==='year')qs=shuffle(bank.filter(q=>q.historical&&q.year===arg)).slice(0,n);
 if(mode==='source')qs=shuffle(bank.filter(q=>q.historical&&q.sourceCategory===arg)).slice(0,n);
 if(mode==='sprint'){
  const eligible=pool.filter(q=>!rec(q.id).attempts||rec(q.id).due<=today());
  const blind=eligible.filter(activeBlind),pending=wrongQs(eligible),weak=eligible.filter(q=>rec(q.id).attempts).sort((a,b)=>mastery(a)-mastery(b)),fresh=shuffle(unseen(eligible));
  qs=[];const seen=new Set();const target=Math.max(20,n);
  outer:for(const group of [blind,pending,weak,fresh])for(const q of group){if(!seen.has(q.id)){qs.push(q);seen.add(q.id)}if(qs.length>=target)break outer}
 }
 if(mode==='domain')qs=shuffle(bank.filter(q=>q.domain===arg)).slice(0,n);
 if(mode==='target')qs=targetQueue(arg,n);
 if(mode==='mock')qs=shuffle(pool).slice(0,Math.min(state.settings.examSize,pool.length));
 if(!qs.length){alert('目前這個模式沒有待作答題目。');return}
 state.lastMode={mode,arg};save();session={mode,arg,qs,index:0,answers:[],started:Date.now(),qStarted:Date.now(),selected:[],confidence:2,submitted:false,reason:null,exam:mode==='mock',deadline:mode==='mock'?Date.now()+state.settings.examMinutes*60000:null};switchTab('practice');renderQuestion();}
function targetQueue(kp,n){const same=bank.filter(q=>q.kp===kp).sort((a,b)=>{const ra=rec(a.id),rb=rec(b.id);return (ra.attempts-rb.attempts)||mastery(a)-mastery(b)});const adjacent=bank.filter(q=>q.domain===same[0]?.domain&&q.kp!==kp).sort((a,b)=>mastery(a)-mastery(b));return [...same,...adjacent].slice(0,n)}
function contextHtml(q){if(!q.context&&!q.contextImages?.length&&!q.questionImages?.length)return '';const imgs=[...(q.contextImages||[]),...(q.questionImages||[])];return `<div class="context-box">${q.context?`<div>${esc(q.context)}</div>`:''}${imgs.map(src=>`<img class="q-image" src="${esc(src)}" loading="lazy" alt="題目附圖">`).join('')}</div>`}


function buildGptQuestionPrompt(q){
 const lines=[
  '請協助解析以下臺灣高中「健康與護理科教師甄試」選擇題。',
  '請先獨立判斷正確答案，再以繁體中文：',
  '1. 先教會解題所需的核心觀念、定義或機轉，不要只公布答案。',
  '2. 根據題幹逐步推理，清楚指出單選或複選的正確選項。',
  '3. 逐一分析每個選項為何正確或錯誤，說明容易混淆的關鍵。',
  '4. 最後整理一個可用來處理類題的記憶重點。',
  '若涉及法規、政策、醫學指引、篩檢資格或統計，請區分原題年度與現行規定；無法確認時請明說，不要猜測。',
  '',
  '【題號】'+q.id,
  '【來源】'+(q.source||q.sourceCategory||'未註明'),
  ...(q.year?['【年度】民國'+q.year+'年']:[]),
  '【題型】'+(q.multi?'複選題':'單選題'),
  ...(String(q.context||'').trim()?['【題組資料】',String(q.context).trim(),'']:[]),
  '【題目】',
  String(q.question||'').trim(),
  '',
  '【選項】',
  ...q.options.map((option,i)=>(LETTERS[i]||String(i+1))+'. '+String(option)),
  ...((q.questionImages?.length||q.contextImages?.length)?['','注意：原題含圖片，請提醒我另行上傳圖片後再判讀；不可猜測圖片內容。']:[])
 ];
 return lines.join('\n');
}
async function copyQuestionForGpt(q,button){
 const prompt=buildGptQuestionPrompt(q),status=document.getElementById('copyQuestionStatus');
 try{
  if(navigator.clipboard?.writeText){
   await navigator.clipboard.writeText(prompt);
  }else{
   const field=document.createElement('textarea');
   field.value=prompt;
   field.setAttribute('readonly','');
   field.style.cssText='position:fixed;left:-9999px;top:0;opacity:0';
   document.body.appendChild(field);
   field.select();
   let success=false;
   try{success=document.execCommand('copy')}finally{field.remove()}
   if(!success)throw new Error('Clipboard copy unavailable');
  }
  if(button?.isConnected)button.textContent='✓ 已複製題目與選項';
  if(status?.isConnected)status.textContent='已複製提問內容，可直接貼到 ChatGPT。';
 }catch(e){
  if(status?.isConnected)status.textContent='無法自動複製，請從彈出視窗手動選取文字。';
  window.prompt('請手動複製以下 GPT 提問內容：',prompt);
 }
}

function renderQuestion(){if(!session)return renderPracticeHome();if(session.index>=session.qs.length)return finishSession();const q=session.qs[session.index];session.qStarted=Date.now();session.selected=[];document.getElementById('practice').innerHTML=`<div class="q-wrap"><div class="card">
<div class="q-head"><div><div class="q-num">${session.index+1} / ${session.qs.length}　${esc(q.domain)}</div><div class="small muted">${esc(q.kp)} · 難度 ${esc(q.difficulty)} · 熟練度 ${mastery(q)}%</div><div class="source-line">${q.year?`<span class="tag">${q.year}年</span>`:''}<span class="tag">${esc(q.sourceCategory||q.source||'題庫')}</span>${q.multi?'<span class="tag pill-warn">複選題</span>':''}${q.timeSensitive?'<span class="tag pill-warn">時效題</span>':''}</div></div><div><button class="bookmark ${state.bookmarks[q.id]?'on':''}" id="bookmark">★</button>${session.exam?`<span class="timer" id="timer"></span>`:''}</div></div>
${q.timeSensitive?'<div class="notice">本題含法規、政策、篩檢資格、數值或指引等時效性資訊。練歷屆題時依原答案作答；考前需以最新官方規範複核。</div>':''}
${contextHtml(q)}<div class="qtext">${esc(q.question)}</div><div class="options">${q.options.map((o,i)=>`<button class="opt" data-i="${i}"><span class="letter">${LETTERS[i]}</span><span>${esc(o)}</span></button>`).join('')}</div><div class="gpt-copy-row"><button type="button" id="copyQuestionGPT" class="ghost gpt-copy-btn">複製題目詢問 GPT</button><span id="copyQuestionStatus" class="small muted">一鍵整理題目、選項與提問指令。</span></div>
<div class="controls" id="questionControls"><div class="confidence"><span class="small muted">作答信心</span>${[1,2,3].map(i=>`<button data-conf="${i}" class="${i===2?'active':''}">${['低','中','高'][i-1]}</button>`).join('')}</div><div class="spacer"></div><button class="primary" id="submitQ">${session.exam?'確認作答':'送出答案'}</button></div><div id="feedback"></div></div></div>`;
 document.querySelectorAll('.opt').forEach(b=>b.onclick=()=>{const i=+b.dataset.i;if(q.multi){const a=session.selected;const pos=a.indexOf(i);if(pos>=0)a.splice(pos,1);else a.push(i);b.classList.toggle('selected')}else{session.selected=[i];document.querySelectorAll('.opt').forEach(x=>x.classList.toggle('selected',x===b))}});document.querySelectorAll('[data-conf]').forEach(b=>b.onclick=()=>{session.confidence=+b.dataset.conf;document.querySelectorAll('[data-conf]').forEach(x=>x.classList.toggle('active',x===b))});document.getElementById('bookmark').onclick=()=>{state.bookmarks[q.id]=!state.bookmarks[q.id];save();document.getElementById('bookmark').classList.toggle('on',!!state.bookmarks[q.id])};document.getElementById('submitQ').onclick=submitQuestion;document.getElementById('copyQuestionGPT').onclick=e=>copyQuestionForGpt(q,e.currentTarget);if(session.exam)tickTimer();}
function tickTimer(){if(!session?.exam)return;const el=document.getElementById('timer');if(!el)return;const left=Math.max(0,session.deadline-Date.now()),m=Math.floor(left/60000),s=Math.floor(left%60000/1000);el.textContent=`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;if(left<=0)return finishSession();setTimeout(tickTimer,1000)}
function submitQuestion(){
 const selected=selectedArr();if(!selected.length){alert('請先選擇答案。');return}
 const q=session.qs[session.index],correct=sameSet(selected,ansArr(q)),ms=Date.now()-session.qStarted;
 session.answers.push({qid:q.id,selected:[...selected],correct,confidence:session.confidence,ms});
 updateRecord(q,correct,session.confidence,ms);
 if(session.exam){session.index++;session.selected=[];session.confidence=2;save();renderQuestion();return}
 session.submitted=true;const correctOptions=ansArr(q);
 document.querySelectorAll('#practice .opt').forEach((b,i)=>{
  const isCorrect=correctOptions.includes(i),picked=selected.includes(i);
  b.disabled=true;b.classList.remove('selected');
  if(isCorrect)b.classList.add('correct');
  else if(picked)b.classList.add('wrong');
  if(isCorrect||picked){
   const label=document.createElement('span');label.className='option-result';
   label.textContent=isCorrect?(picked?'✓ 你答對了':'✓ 正確答案'):'✕ 你的選擇錯誤';
   b.appendChild(label);
   b.setAttribute('aria-label',LETTERS[i]+'，'+label.textContent);
  }
 });
 const controls=document.getElementById('questionControls');if(controls)controls.hidden=true;
 const f=document.getElementById('feedback');
 f.innerHTML=`${noteEditorHtml(q,!correct&&Boolean(getNote(q.id).trim()))}
 <div class="controls answer-actions"><button id="targetNow">立即做鏢靶類題</button><div class="spacer"></div><button class="primary" id="nextQ">下一題</button></div>`;
 bindNoteEditors();
 document.getElementById('nextQ').onclick=()=>{session.index++;session.selected=[];session.confidence=2;session.submitted=false;session.reason=null;save();renderQuestion()};
 document.getElementById('targetNow').onclick=()=>startMode('target',q.kp);
 save();
}
function applyReason(qid,reason){const r=rec(qid);r.reasons??={};r.reasons[reason]=(r.reasons[reason]||0)+1;state.reasonCounts[reason]=(state.reasonCounts[reason]||0)+1;setrec(qid,r);save()}
function updateRecord(q,correct,confidence,ms){
 const r=rec(q.id),previousStage=wrongStage(r),previousDue=r.due;
 r.attempts++;r.totalMs=(r.totalMs||0)+ms;r.last=today();r.lastConfidence=confidence;
 if(correct){
  r.correct++;r.streak=(r.streak||0)+1;
  let iv=r.interval||0;
  if(confidence===1){iv=1;r.ease=clamp((r.ease||2.3)-.05,1.3,3)}
  else if(iv===0)iv=confidence===3?3:2;
  else iv=Math.max(2,Math.round(iv*(r.ease||2.3)*(confidence===2?.75:1)));
  r.interval=clamp(iv,1,90);r.due=addDays(r.interval);
  if(r.wrong>0){
   if(previousStage==='pending'){r.wrongStage='consolidating';r.consolidationSince=today()}
   else if(previousStage==='consolidating'){
    const afterFirst=!(r.consolidationSince)||today()>r.consolidationSince;
    r.wrongStage=afterFirst&&!!previousDue&&previousDue<=today()?'mastered':'consolidating';
    r.consolidationSince??=today();
   }else if(previousStage==='mastered')r.wrongStage='mastered';
  }
 }else{
  r.wrong++;if(confidence===3)r.blind=(r.blind||0)+1;
  r.wrongStage='pending';r.consolidationSince=null;
  r.streak=0;r.interval=1;
  r.ease=clamp((r.ease||2.3)-.18,1.3,3);r.due=addDays(1);
 }
 if(session?.mode==='wrong')r.lastWrongReviewAt=Date.now();
 r.history=(r.history||[]).slice(-29);
 r.history.push({date:today(),correct,confidence,ms});
 setrec(q.id,r);
 state.daily[today()]??={answered:0,correct:0};
 state.daily[today()].answered++;
 if(correct)state.daily[today()].correct++;
}
function finishSession(){if(!session)return;const total=session.answers.length,correct=session.answers.filter(x=>x.correct).length,dur=Date.now()-session.started;state.sessions.push({date:today(),mode:session.mode,arg:session.arg,total,correct,durationMs:dur});state.sessions=state.sessions.slice(-200);save();const exam=session.exam,ans=[...session.answers],qs=[...session.qs];session=null;document.getElementById('practice').innerHTML=`<div class="q-wrap"><div class="card"><h2>本次完成</h2><div class="grid cols3"><div class="metric"><div class="label">正確率</div><div class="value">${total?Math.round(correct/total*100):0}%</div></div><div class="metric"><div class="label">答對</div><div class="value">${correct}/${total}</div></div><div class="metric"><div class="label">耗時</div><div class="value">${Math.round(dur/60000)}分</div></div></div>${exam?`<div class="section-title"><h2>模擬考檢討</h2></div>${ans.map((a,i)=>{const q=qs.find(x=>x.id===a.qid);return `<div class="card" style="margin-top:10px"><b>${i+1}. ${esc(q.question)}</b><div class="small ${a.correct?'pill-good':'pill-bad'}">你的答案 ${a.selected.map(x=>LETTERS[x]).join('、')}｜正解 ${ansText(q)}</div>${noteEditorHtml(q,!a.correct&&Boolean(getNote(q.id).trim()))}</div>`}).join('')}`:''}<div class="controls"><button id="homeBtn">回總覽</button><button class="primary" id="again">再做一組</button></div></div></div>`;document.getElementById('homeBtn').onclick=()=>switchTab('dashboard');document.getElementById('again').onclick=()=>state.lastMode?startMode(state.lastMode.mode,state.lastMode.arg):startMode('daily');bindNoteEditors()}

function renderWrongbook(){
 const all=allWrongQs(),count=stage=>all.filter(q=>wrongStage(rec(q.id))===stage).length;
 const filters=[['pending','待訂正',count('pending')],['consolidating','待鞏固',count('consolidating')],['mastered','已掌握',count('mastered')],['all','全部紀錄',all.length]];
 const visible=wrongbookFilter==='all'?all:all.filter(q=>wrongStage(rec(q.id))===wrongbookFilter);
 document.getElementById('wrongbook').innerHTML=`<div class="section-title"><h2>錯題本</h2><span class="muted small">答對後離開待訂正，依間隔複習再次驗證</span></div>
 <div class="wrong-filter-row">${filters.map(([key,label,n])=>`<button type="button" data-wrong-filter="${key}" class="${wrongbookFilter===key?'active':''}">${label} ${n}</button>`).join('')}</div>
 ${all.length?'<input class="search" id="wrongSearch" placeholder="搜尋題目、知識點或個人筆記">':''}
 <div id="wrongList">${wrongRows(visible)}</div>`;
 document.querySelectorAll('[data-wrong-filter]').forEach(b=>b.onclick=()=>{wrongbookFilter=b.dataset.wrongFilter;renderWrongbook()});
 const search=document.getElementById('wrongSearch');
 if(search)search.oninput=()=>{const k=search.value.toLowerCase();document.getElementById('wrongList').innerHTML=wrongRows(visible.filter(q=>(q.id+q.question+q.domain+q.kp+(q.source||'')+getNote(q.id)).toLowerCase().includes(k)));bindWrongButtons()};
 bindWrongButtons();
}
function wrongRows(qs){
 if(!qs.length)return '<div class="card empty">此分類目前沒有題目。</div>';
 return qs.map(q=>{
  const r=rec(q.id),stage=wrongStage(r);
  const title=stage==='pending'?'待訂正':stage==='consolidating'?'待鞏固':'已掌握';
  const badge=stage==='pending'?'pill-bad':stage==='mastered'?'pill-good':'pill-warn';
  const next=stage==='pending'?'可立即重刷':stage==='consolidating'?'下次間隔複習 '+(r.due||'待排程'):'保留歷史紀錄';
  return `<div class="card" style="margin-top:12px">
   <div class="q-head"><div><b>${q.id}｜${esc(q.question)}</b><div class="small muted">${esc(q.domain)} · ${esc(q.kp)} · ${esc(q.sourceCategory||q.source)}</div></div><span class="${badge}">${title}｜累計錯 ${r.wrong} 次</span></div>
   <div class="small">正解：<b>${ansText(q)} ${ansArr(q).map(i=>esc(q.options[i])).join('；')}</b></div>
   ${noteEditorHtml(q)}
   <div class="controls"><button data-target="${esc(q.kp)}">鏢靶類題</button><button data-one="${q.id}">重做此題</button><div class="spacer"></div><span class="small muted">${esc(next)}</span></div></div>`;
 }).join('');
}
function bindWrongButtons(){document.querySelectorAll('[data-target]').forEach(b=>b.onclick=()=>startMode('target',b.dataset.target));document.querySelectorAll('[data-one]').forEach(b=>b.onclick=()=>{const q=bank.find(x=>x.id===b.dataset.one);session={mode:'single',qs:[q],index:0,answers:[],started:Date.now(),qStarted:Date.now(),selected:[],confidence:2,exam:false};switchTab('practice');renderQuestion()});bindNoteEditors()}



const NOTE_COLORS=[
 {label:'預設',color:null,swatch:'#778899'},
 {label:'紅色',color:'#b91c1c',swatch:'#b91c1c'},
 {label:'藍色',color:'#1d4ed8',swatch:'#1d4ed8'},
 {label:'綠色',color:'#15803d',swatch:'#15803d'},
 {label:'橘色',color:'#c2410c',swatch:'#c2410c'},
 {label:'紫色',color:'#7e22ce',swatch:'#7e22ce'}
];
function getNote(qid){return String(state.notes?.[qid]??'')}
function normalizedNoteColor(value){
 const s=String(value||'').trim().toLowerCase();
 if(/^#[\da-f]{6}$/.test(s))return s;
 if(/^#[\da-f]{3}$/.test(s))return '#'+[...s.slice(1)].map(x=>x+x).join('');
 const rgb=s.match(/^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/);
 if(rgb){const n=rgb.slice(1).map(Number);if(n.every(v=>v>=0&&v<=255))return '#'+n.map(v=>v.toString(16).padStart(2,'0')).join('')}
 return null;
}
function sanitizeNoteHtml(raw){
 const template=document.createElement('template');template.innerHTML=String(raw||'');
 const walk=node=>{
  if(node.nodeType===3)return esc(node.nodeValue);
  if(node.nodeType!==1)return '';
  const tag=node.tagName.toUpperCase();if(tag==='BR')return '<br>';
  const inner=Array.from(node.childNodes).map(walk).join('');
  if(tag==='B'||tag==='STRONG')return '<strong>'+inner+'</strong>';
  if(tag==='U')return '<u>'+inner+'</u>';
  if(tag==='SPAN'||tag==='FONT'){
   const c=normalizedNoteColor(node.getAttribute('color')||node.style.color);
   return c?'<span style="color:'+c+'">'+inner+'</span>':inner;
  }
  if(tag==='DIV'||tag==='P')return inner+'<br>';
  return inner;
 };
 return Array.from(template.content.childNodes).map(walk).join('').replace(/(?:<br>)+$/,'');
}
function noteEditorContent(id){
 const saved=state.noteHtml?.[id];
 return typeof saved==='string'?sanitizeNoteHtml(saved):esc(getNote(id)).replace(/\n/g,'<br>');
}
function saveRichNote(id,editor){
 state.notes??={};state.noteHtml??={};
 const plain=editor.innerText.replace(/\u00a0/g,' ').trim();
 if(plain){state.notes[id]=plain;state.noteHtml[id]=sanitizeNoteHtml(editor.innerHTML)}
 else{delete state.notes[id];delete state.noteHtml[id]}
 save();
}
function noteEditorHtml(q,remind=false){
 return `<section class="note-editor ${remind?'note-review':''}">
 <div class="note-heading"><label id="label_${esc(q.id)}">我的學習筆記</label>${remind?'<span class="note-review-tag">再次答錯・上次筆記已帶入</span>':''}</div>
 <div class="note-toolbar" role="toolbar" aria-label="筆記文字格式">
  <button type="button" class="note-format" data-note-cmd="bold" title="粗體"><strong>B</strong></button>
  <button type="button" class="note-format" data-note-cmd="underline" title="底線"><u>U</u></button>
  <span class="note-toolbar-label">字體顏色</span>
  ${NOTE_COLORS.map(c=>`<button type="button" class="note-color" data-note-color="${c.color||'default'}" title="${c.label}" aria-label="${c.label}"><span class="note-color-dot" style="background:${c.swatch}"></span></button>`).join('')}
 </div>
 <div class="note-content" contenteditable="true" data-note-id="${esc(q.id)}" role="textbox" aria-multiline="true" aria-labelledby="label_${esc(q.id)}" data-placeholder="記下觀念、錯因或考場口訣；選取文字即可設定粗體、底線或顏色。">${noteEditorContent(q.id)}</div>
 <div class="note-save-status small muted">筆記自動儲存，可在「學習筆記」分頁回顧；進度備份也會包含格式。</div>
 </section>`
}
function bindNoteEditors(){
 document.querySelectorAll('.note-editor').forEach(section=>{
  const editor=section.querySelector('[data-note-id]');if(!editor||editor.dataset.noteBound==='1')return;
  editor.dataset.noteBound='1';
  const status=section.querySelector('.note-save-status');
  let lastRange=null;
  const remember=()=>{
   const sel=window.getSelection();
   if(sel&&sel.rangeCount&&editor.contains(sel.anchorNode))lastRange=sel.getRangeAt(0).cloneRange();
  };
  const persist=()=>{saveRichNote(editor.dataset.noteId,editor);if(status)status.textContent='已自動儲存'};
  editor.addEventListener('input',persist);
  editor.addEventListener('keyup',remember);
  editor.addEventListener('mouseup',remember);
  editor.addEventListener('touchend',remember);
  editor.addEventListener('paste',e=>{
   e.preventDefault();
   document.execCommand('insertText',false,e.clipboardData?.getData('text/plain')||'');
   persist();
  });
  section.querySelectorAll('[data-note-cmd],[data-note-color]').forEach(btn=>{
   btn.addEventListener('mousedown',e=>e.preventDefault());
   btn.onclick=()=>{
    editor.focus();const sel=window.getSelection();
    if(lastRange&&sel){try{sel.removeAllRanges();sel.addRange(lastRange)}catch{}}
    const color=btn.dataset.noteColor;
    if(color){
     document.execCommand('foreColor',false,color==='default'?getComputedStyle(editor).color:color);
    }else document.execCommand(btn.dataset.noteCmd,false,null);
    remember();persist();
   };
  });
 });
}
function noteRows(qs){
 if(!qs.length)return '<div class="card empty">沒有符合的學習筆記。</div>';
 return qs.map(q=>`<div class="card note-work-card"><div class="q-head"><div><b>${esc(q.id)}｜${esc(q.question)}</b><div class="small muted">${esc(q.domain)} · ${esc(q.kp)}</div></div><span class="tag">${rec(q.id).wrong} 次答錯</span></div>${noteEditorHtml(q)}<div class="controls"><button data-note-one="${esc(q.id)}">重做此題</button></div></div>`).join('');
}
function startNoteQuestion(id){
 const q=bank.find(x=>x.id===id);if(!q)return;
 session={mode:'single',qs:[q],index:0,answers:[],started:Date.now(),qStarted:Date.now(),selected:[],confidence:2,exam:false};
 switchTab('practice');renderQuestion();
}
function bindNotePage(){bindNoteEditors();document.querySelectorAll('[data-note-one]').forEach(b=>b.onclick=()=>startNoteQuestion(b.dataset.noteOne))}
function renderNotes(){
 const qs=bank.filter(q=>getNote(q.id).trim());
 document.getElementById('notes').innerHTML=`<div class="section-title"><h2>學習筆記</h2><span class="muted small">${qs.length} 題已建立筆記</span></div>
 <div class="notice">選取文字即可設定粗體、底線與顏色。筆記自動儲存；再次答錯同一題會自動帶入之前的筆記。跨裝置使用請匯出進度 JSON。</div>
 ${qs.length?'<input class="search" id="noteSearch" placeholder="搜尋題號、題目、知識點或筆記內容">':''}
 <div id="noteList">${noteRows(qs)}</div>`;
 const search=document.getElementById('noteSearch');
 if(search)search.oninput=()=>{
  const key=search.value.toLowerCase();
  document.getElementById('noteList').innerHTML=noteRows(qs.filter(q=>(q.id+q.question+q.domain+q.kp+getNote(q.id)).toLowerCase().includes(key)));
  bindNotePage();
 };
 bindNotePage();
}

function renderKnowledge(){const k=kpStats().sort((a,b)=>a.domain.localeCompare(b.domain,'zh-Hant')||a.kp.localeCompare(b.kp,'zh-Hant'));document.getElementById('knowledge').innerHTML=`<div class="section-title"><h2>知識地圖</h2><span class="muted small">熟練度綜合正確率、信心、連勝與到期狀態。</span></div><div class="card">${k.map(x=>`<div class="kp-row"><div><b>${esc(x.kp)}</b><div class="small muted">${esc(x.domain)}｜${x.qs.length}題｜例：${x.qs.slice(0,4).map(q=>q.id).join('、')}${x.qs.length>4?'…':''}</div></div><div><div class="bar"><i style="width:${x.mastery}%"></i></div><div class="small muted">熟練 ${x.mastery}%</div></div><div class="small">${x.attempts?`正確 ${Math.round(x.correct/x.attempts*100)}%`:'尚未作答'}</div><button data-kp="${esc(x.kp)}">練這個</button></div>`).join('')}</div>`;document.querySelectorAll('[data-kp]').forEach(b=>b.onclick=()=>startMode('target',b.dataset.kp))}

function renderStats(){const t=totalStats(),ds=domainStats().sort((a,b)=>a.mastery-b.mastery),ss=sourceStats();const dates=Object.keys(state.daily).sort().slice(-14),max=Math.max(1,...dates.map(x=>state.daily[x].answered));const reasons=Object.entries(state.reasonCounts||{}).sort((a,b)=>b[1]-a[1]);document.getElementById('stats').innerHTML=`<div class="grid cols4"><div class="card metric"><div class="label">總作答</div><div class="value">${t.attempts}</div></div><div class="card metric"><div class="label">正確率</div><div class="value">${t.accuracy}%</div></div><div class="card metric"><div class="label">平均每題</div><div class="value">${t.avgSec}s</div></div><div class="card metric"><div class="label">已精熟</div><div class="value">${t.mastered}</div></div></div><div class="section-title"><h2>近14日刷題量</h2></div><div class="card"><div class="spark">${dates.length?dates.map(x=>`<i title="${x}: ${state.daily[x].answered}題" style="height:${Math.max(5,state.daily[x].answered/max*100)}%"></i>`).join(''):'<span class="muted">尚無紀錄</span>'}</div><div class="small muted">${dates.join('　')}</div></div><div class="section-title"><h2>領域表現</h2></div><div class="card table-scroll"><table class="table"><thead><tr><th>領域</th><th>題數</th><th>熟練度</th><th>正確率</th><th>作答</th></tr></thead><tbody>${ds.map(d=>`<tr><td>${esc(d.domain)}</td><td>${d.qs}</td><td>${d.mastery}%</td><td>${d.accuracy}%</td><td>${d.attempts}</td></tr>`).join('')}</tbody></table></div><div class="section-title"><h2>真題來源表現</h2></div><div class="card table-scroll"><table class="table"><thead><tr><th>年度</th><th>來源</th><th>題數</th><th>作答</th><th>正確率</th></tr></thead><tbody>${ss.map(s=>`<tr><td>${s.year}</td><td>${esc(s.source)}</td><td>${s.qs}</td><td>${s.attempts}</td><td>${s.accuracy}%</td></tr>`).join('')}</tbody></table></div><div class="section-title"><h2>錯因分布</h2></div><div class="card">${reasons.length?reasons.map(([r,n])=>`<div class="kp-row"><b>${r}</b><div class="bar"><i style="width:${Math.min(100,n/Math.max(...reasons.map(x=>x[1]))*100)}%"></i></div><span>${n}次</span><span></span></div>`).join(''):'<div class="empty">答錯後標記錯因，這裡會形成你的失分型態。</div>'}</div>`}

function renderSettings(){document.getElementById('settings').innerHTML=`<div class="section-title"><h2>練習設定</h2></div><div class="card"><div class="form-row"><label>每日目標題數</label><input id="dailyGoal" type="number" min="5" max="100" value="${state.settings.dailyGoal}"></div><div class="form-row"><label>一般練習每組</label><input id="sessionSize" type="number" min="5" max="50" value="${state.settings.sessionSize}"></div><div class="form-row"><label>模擬考題數</label><input id="examSize" type="number" min="10" max="100" value="${state.settings.examSize}"></div><div class="form-row"><label>模擬考分鐘</label><input id="examMinutes" type="number" min="10" max="180" value="${state.settings.examMinutes}"></div><div class="form-row"><label>預設智慧練習題庫</label><select id="defaultPool"><option value="all" ${state.settings.defaultPool==='all'?'selected':''}>全部題庫</option><option value="historical" ${state.settings.defaultPool==='historical'?'selected':''}>只刷真題</option><option value="newtaipei" ${state.settings.defaultPool==='newtaipei'?'selected':''}>只刷新北真題</option></select></div><div class="form-row"><label>閱讀字級</label><select id="textScale"><option value="0.95" ${(state.settings.textScale||1)===0.95?'selected':''}>緊湊</option><option value="1" ${(state.settings.textScale||1)===1?'selected':''}>舒適</option><option value="1.1" ${(state.settings.textScale||1)===1.1?'selected':''}>大字</option><option value="1.2" ${(state.settings.textScale||1)===1.2?'selected':''}>特大字</option></select></div><div class="form-row"><label>預定考試日期</label><input id="examDate" type="date" value="${state.settings.examDate||''}"></div><button class="primary" id="saveSettings">儲存設定</button></div>
<div class="section-title"><h2>資料備份與題庫擴充</h2></div><div class="grid cols2"><div class="card"><h3>進度備份</h3><p class="small muted">換裝置、清除瀏覽器或更新版本前請匯出。</p><button id="exportProgress">匯出進度 JSON</button> <button id="importProgressBtn">匯入進度 JSON</button><input id="importProgress" type="file" accept="application/json" hidden><button id="exportWrong">匯出錯題 CSV</button></div><div class="card"><h3>題庫資料</h3><p class="small muted">支援單選 answer:2 或複選 answer:[0,2]。</p><button id="importQuestionsBtn">匯入題庫 JSON</button><input id="importQuestions" type="file" accept="application/json" hidden> <button id="exportQuestions">匯出目前題庫</button><div class="small muted" style="margin-top:8px">內建 ${BASE.length} 題｜自訂 ${custom.length} 題｜合計 ${bank.length} 題</div></div></div>
<div class="section-title"><h2>題庫說明</h2></div><div class="card"><div class="notice">歷屆真題中的法規、篩檢年齡、政策、統計數字及急救指引可能已更新。系統會標示「時效題」，歷屆作答依原公布答案，現行備考另需複核。</div><div class="small muted" style="margin-top:12px">目前真題 ${baseHistorical().length} 題；自編仿真 ${bank.filter(q=>!q.historical).length} 題。v2.9 錯題分為待訂正、待鞏固及已掌握；答對後退出錯題重刷並保留在間隔複習。今日智慧練習可獨立輸入本次題數，不改變每日目標。</div><div style="margin-top:12px"><button id="reset" class="ghost">清除所有作答進度</button></div></div>`;
 document.getElementById('saveSettings').onclick=()=>{['dailyGoal','sessionSize','examSize','examMinutes'].forEach(k=>state.settings[k]=+document.getElementById(k).value);state.settings.examDate=document.getElementById('examDate').value;state.settings.defaultPool=document.getElementById('defaultPool').value;state.settings.textScale=+document.getElementById('textScale').value;applyTheme();save();alert('已儲存')};document.getElementById('exportProgress').onclick=()=>dl(`健護教甄進度_v2_${today()}.json`,JSON.stringify(state,null,2));document.getElementById('importProgressBtn').onclick=()=>document.getElementById('importProgress').click();document.getElementById('importProgress').onchange=e=>readJson(e.target.files[0],x=>{state=normalizeState(x);save();renderSettings();alert('進度已匯入')});document.getElementById('exportQuestions').onclick=()=>dl(`健護教甄題庫_v2_${today()}.json`,JSON.stringify(bank,null,2));document.getElementById('importQuestionsBtn').onclick=()=>document.getElementById('importQuestions').click();document.getElementById('importQuestions').onchange=e=>readJson(e.target.files[0],arr=>{if(!Array.isArray(arr))throw Error('題庫必須是陣列');const start=custom.length;const cleaned=arr.map((q,i)=>({...q,id:q.id&&!bank.some(x=>x.id===q.id)?q.id:`C${String(start+i+1).padStart(4,'0')}`,options:q.options||[],multi:Array.isArray(q.answer)})).filter(q=>q.question&&q.options.length>=2&&(Number.isInteger(q.answer)||(Array.isArray(q.answer)&&q.answer.length)));custom=[...custom,...cleaned];bank=[...BASE,...custom];save();renderSettings();alert(`已匯入 ${cleaned.length} 題`)});document.getElementById('exportWrong').onclick=()=>{const rows=[['id','年度','來源','領域','知識點','題目','正解','錯誤次數','我的筆記'],...allWrongQs().map(q=>[q.id,q.year||'',q.sourceCategory||q.source,q.domain,q.kp,q.question,ansText(q)+' '+ansArr(q).map(i=>q.options[i]).join('；'),rec(q.id).wrong,getNote(q.id)])];dl(`健護教甄錯題本_${today()}.csv`,rows.map(r=>r.map(x=>'"'+String(x).replaceAll('"','""')+'"').join(',')).join('\n'),'text/csv;charset=utf-8')};document.getElementById('reset').onclick=()=>{if(confirm('確定清除所有作答進度？自訂題庫不會刪除。')){state=defaultState();save();renderSettings()}}}
function readJson(file,cb){if(!file)return;const fr=new FileReader();fr.onload=()=>{try{cb(JSON.parse(fr.result))}catch(e){alert('匯入失敗：'+e.message)}};fr.readAsText(file)}

renderDashboard();
if('serviceWorker' in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('./service-worker.js?v=2.9.0').catch(()=>{});
})();
