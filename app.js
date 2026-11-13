const TYPES = [
  {key:'fill', icon:'✎', label:'Điền từ', count:'5 câu', title:'Chọn từ thật chuẩn', hint:'Chọn từ phù hợp cho 5 chỗ trống. Có từ gây nhiễu.'},
  {key:'order', icon:'▦', label:'Xếp câu', count:'3 câu', title:'Ghép câu đời sống', hint:'Xếp 3 câu thực tế theo đúng thứ tự. Không có nghĩa tiếng Việt.'},
  {key:'picture', icon:'◈', label:'Xem tranh', count:'3 tranh', title:'Nhìn kỹ rồi diễn đạt', hint:'Mỗi tranh là một tình huống để trả lời hoặc đặt câu bằng tiếng Trung.'},
  {key:'scenario', icon:'↗', label:'Tình huống', count:'2 câu', title:'Nếu là bạn, sẽ nói gì?', hint:'Viết 2 lời đáp bằng tiếng Trung cho những hoàn cảnh thường gặp.'},
  {key:'read', icon:'▤', label:'Đọc hiểu', count:'3 câu', title:'Đọc để tìm thông tin', hint:'Đọc đoạn văn mới rồi trả lời 3 câu hỏi.'}
];
const STORAGE_KEY = 'hsk3-q4-practice-v2';
let saved = {};
try { saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') || {}; } catch (_) {}
if(saved.contentRevision!==3){
  for(const key of Object.keys(saved.records||{})) if(key==='l1-fill'||key.endsWith('-order')||key.endsWith('-read')) delete saved.records[key];
  for(const key of Object.keys(saved.answers||{})) if(key==='l1-fill'||key.endsWith('-order')||key.endsWith('-read')) delete saved.answers[key];
}
const state = {lesson: Number.isInteger(saved.lesson) && saved.lesson >= 0 && saved.lesson < LESSONS.length ? saved.lesson : 0,
  task: Number.isInteger(saved.task) && saved.task >= 0 && saved.task < TYPES.length ? saved.task : 0,
  records: saved.records || {}, answers: saved.answers || {}, revealed: saved.revealed || {}, contentRevision: 3};
const $ = id => document.getElementById(id);
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const currentId = () => `l${state.lesson + 1}-${TYPES[state.task].key}`;
const save = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
const done = (lesson) => TYPES.filter(t => state.records[`l${lesson + 1}-${t.key}`] === 'correct').length;
function announce(message){ $('announce').textContent = message; }

function renderNav(){
  $('lessonNav').innerHTML = LESSONS.map((l,i) => `<button class="lesson-link ${i===state.lesson?'active':''}" data-lesson="${i}" type="button" ${i===state.lesson?'aria-current="step"':''}><span class="num">${String(i+1).padStart(2,'0')}</span><span class="nav-copy"><strong>${esc(l.title)}</strong><small>${done(i)} / 5 nhiệm vụ</small></span>${done(i)===5?'<span class="nav-check" aria-label="Đã hoàn thành">✓</span>':''}</button>`).join('');
  const count = LESSONS.reduce((n,_,i)=>n+done(i),0);
  $('totalDone').textContent = `${count} / ${LESSONS.length*TYPES.length}`;
  $('totalBar').style.width = `${count/(LESSONS.length*TYPES.length)*100}%`;
}
function renderTabs(){
  $('missionTabs').innerHTML = TYPES.map((t,i)=>`<button class="mission-tab ${i===state.task?'active':''} ${state.records[`l${state.lesson+1}-${t.key}`]==='correct'?'done':''}" data-task="${i}" type="button" role="tab" aria-selected="${i===state.task}"><span class="tab-step">0${i+1} · ${t.icon}</span>${t.label}<small class="tab-count">${t.count}</small></button>`).join('');
}
function render(){
  const l = LESSONS[state.lesson], t = TYPES[state.task];
  document.documentElement.style.setProperty('--accent',l.color);
  $('lessonNumber').textContent = String(state.lesson+1).padStart(2,'0');
  $('lessonTitle').textContent = l.title; $('lessonSub').textContent = l.vi;
  $('lessonDone').textContent = `${done(state.lesson)} / 5`;
  $('taskPosition').textContent = `${String(state.task+1).padStart(2,'0')} / 05`;
  $('prevTask').disabled = state.lesson===0 && state.task===0;
  $('nextTask').innerHTML = state.task===4 && state.lesson<9 ? 'Sang bài tiếp <span>→</span>' : 'Tiếp tục <span>→</span>';
  $('nextTask').disabled = state.lesson===9 && state.task===4;
  renderNav(); renderTabs(); renderExercise(l,t);
  save();
}
function renderExercise(l,t){
  const id = currentId(), status = state.records[id];
  const header = `<div class="exercise-top"><div><span class="type-tag">${t.icon} &nbsp; ${t.label.toUpperCase()}</span><h3>${t.title}</h3><p>${t.hint}</p></div><span class="task-ordinal">0${state.task+1}</span></div>`;
  let body = '';
  if(t.key==='fill') body=fillMarkup(l.fill,id);
  if(t.key==='order') body=orderMarkup(l.orders,id);
  if(t.key==='picture') body=pictureMarkup(l,id);
  if(t.key==='scenario') body=scenarioMarkup(l,id);
  if(t.key==='read') body=readMarkup(l,id);
  const feedback = status && ['fill','order','read'].includes(t.key) ? `<div class="feedback show ${status==='correct'?'good':'bad'}">${status==='correct'?'Chính xác! Bạn có thể chuyển sang nhiệm vụ tiếp theo.':`Bạn đúng ${scoreForTask(l,t.key,state.answers[id])}/${t.key==='fill'?5:3} câu. Xem lại và thử tiếp nhé.`}</div>` : '';
  $('exerciseCard').innerHTML = header + `<div class="exercise-body">${body}${feedback}</div>`;
}
function fillMarkup(data,id){
  const answers = state.answers[id] || [];
  const sentences = data.items.map(([sentence],i)=>{
    const select=`<select class="blank-select" data-fill="${i}" aria-label="Chọn từ cho câu ${i+1}"><option value="">Chọn từ</option>${data.bank.map(w=>`<option value="${esc(w)}" ${answers[i]===w?'selected':''}>${esc(w)}</option>`).join('')}</select>`;
    return `<div class="sentence-item"><b>${String(i+1).padStart(2,'0')}.</b> ${sentence.replace('____',select)}</div>`;
  }).join('');
  return `<div class="word-bank"><span class="word-bank-label">NGÂN HÀNG TỪ</span>${data.bank.map(w=>`<span>${esc(w)}</span>`).join('')}</div><div class="sentence-list">${sentences}</div><div class="action-row"><button class="primary-btn" type="button" data-action="check">Kiểm tra đáp án →</button></div>`;
}
function shuffleIndexes(length,seed){
  const a=Array.from({length},(_,i)=>i);let n=seed+73;
  for(let i=a.length-1;i>0;i--){n=(n*1664525+1013904223)>>>0;const j=n%(i+1);[a[i],a[j]]=[a[j],a[i]];}
  if(a.every((v,i)=>v===i) && a.length>1)[a[0],a[1]]=[a[1],a[0]];
  return a;
}
function orderMarkup(orders,id){
  const answers=Array.isArray(state.answers[id])?state.answers[id]:[];
  return `<p class="body-note">Chạm vào từng mảnh để xếp câu; chạm mảnh bên dưới để bỏ chọn.</p>${orders.map((tokens,row)=>{
    const placed=Array.isArray(answers[row])?answers[row]:[];
    const pool=shuffleIndexes(tokens.length,state.lesson*23+row*7).filter(i=>!placed.includes(i));
    return `<section class="order-group"><div class="question-number">CÂU 0${row+1}</div><div class="token-pool" aria-label="Mảnh câu ${row+1} chưa dùng">${pool.map(i=>`<button class="token" data-order-row="${row}" data-token="${i}" type="button">${esc(tokens[i])}</button>`).join('')}</div><div class="answer-line" aria-label="Câu ${row+1} đã ghép">${placed.map(i=>`<button class="token placed" data-order-row="${row}" data-remove-token="${i}" type="button" title="Chạm để bỏ mảnh này">${esc(tokens[i])}</button>`).join('')}</div></section>`;
  }).join('')}<div class="action-row"><button class="primary-btn" type="button" data-action="check">Kiểm tra 3 câu →</button><button class="secondary-btn" type="button" data-action="clear-order">Xếp lại từ đầu</button></div>`;
}
function pictureMarkup(l,id){
  const answers=Array.isArray(state.answers[id])?state.answers[id]:[];
  return `<div class="picture-grid">${l.pictures.map((p,i)=>`<section class="picture-card"><div class="picture-frame"><img src="assets/${esc(p.image)}" alt="Tranh ${i+1} cho bài ${esc(l.title)}"><span>TRANH 0${i+1}</span></div><div class="picture-question"><label class="prompt-label" for="pic-${i}">${esc(p.prompt)}</label><textarea class="writing-area" id="pic-${i}" data-writing="${i}" lang="zh-CN" placeholder="Viết bằng tiếng Trung...">${esc(answers[i]||'')}</textarea></div></section>`).join('')}</div>${openActions(id,l.pictures.map(p=>p.sample))}`;
}
function scenarioMarkup(l,id){
  const answers=Array.isArray(state.answers[id])?state.answers[id]:[];
  return `<div class="scenario-list">${l.scenarios.map((s,i)=>`<section><div class="scenario-box"><span>0${i+1}</span>${esc(s[0])}</div><label class="prompt-label" for="scenario-${i}">Câu trả lời của bạn</label><textarea class="writing-area" id="scenario-${i}" data-writing="${i}" lang="zh-CN" placeholder="Viết lời đáp bằng tiếng Trung...">${esc(answers[i]||'')}</textarea></section>`).join('')}</div>${openActions(id,l.scenarios.map(s=>s[1]))}`;
}
function openActions(id,samples){
  const reveal=state.revealed[id];
  return `<div class="action-row"><button class="primary-btn" type="button" data-action="reveal">${reveal?'Đã mở đáp án gợi ý':'Xem đáp án gợi ý →'}</button></div><div class="sample ${reveal?'show':''}"><strong>GỢI Ý · CÓ THỂ CÓ CÁCH NÓI KHÁC</strong>${samples.map(s=>`<p>${esc(s)}</p>`).join('')}<div class="self-actions"><button class="self-btn yes" type="button" data-action="self-good">✓ Mình làm được</button><button class="self-btn no" type="button" data-action="self-review">↺ Cần luyện lại</button></div></div>`;
}
function readMarkup(l,id){
  const answers=Array.isArray(state.answers[id])?state.answers[id]:[];
  return `<div class="read-text" lang="zh-CN">${esc(l.read[0])}</div><div class="action-row"><button class="secondary-btn" type="button" data-action="speak">🔊 Đọc đoạn văn</button></div>${l.questions.map(([q,options],row)=>`<section class="reading-block"><div class="question-number">CÂU 0${row+1}</div><div class="reading-question" lang="zh-CN">${esc(q)}</div><div class="choices" role="radiogroup" aria-label="Chọn đáp án câu ${row+1}">${options.map((o,i)=>`<button class="choice ${answers[row]===i?'selected':''}" data-question="${row}" data-choice="${i}" type="button" role="radio" aria-checked="${answers[row]===i}"><i>${'ABC'[i]}</i><span>${esc(o)}</span></button>`).join('')}</div></section>`).join('')}<div class="action-row"><button class="primary-btn" type="button" data-action="check">Kiểm tra 3 câu →</button></div>`;
}
function clearRetry(){if(state.records[currentId()]==='retry') delete state.records[currentId()];}
function scoreForTask(l,key,answer){
  if(key==='fill') return l.fill.items.filter((item,i)=>Array.isArray(answer)&&answer[i]===item[1]).length;
  if(key==='order') return l.orders.filter((tokens,row)=>Array.isArray(answer)&&Array.isArray(answer[row])&&answer[row].length===tokens.length&&answer[row].every((v,i)=>v===i)).length;
  if(key==='read') return l.questions.filter((q,i)=>Array.isArray(answer)&&answer[i]===q[2]).length;
  return 0;
}
function handleCheck(){
  const l=LESSONS[state.lesson],key=TYPES[state.task].key,id=currentId(),answer=state.answers[id];let correct=false;
  if(key==='fill') correct=scoreForTask(l,key,answer)===5;
  if(key==='order'||key==='read') correct=scoreForTask(l,key,answer)===3;
  state.records[id]=correct?'correct':'retry';
  announce(correct?'Chính xác!':'Chưa đúng, hãy thử lại.');render();
}
document.addEventListener('click',event=>{
  const lesson=event.target.closest('[data-lesson]');if(lesson){state.lesson=Number(lesson.dataset.lesson);state.task=0;$('lessonNav').closest('.sidebar').classList.remove('open');render();window.scrollTo({top:0,behavior:'smooth'});return;}
  const task=event.target.closest('[data-task]');if(task){state.task=Number(task.dataset.task);render();return;}
  const token=event.target.closest('[data-token]');if(token){const id=currentId(),row=Number(token.dataset.orderRow),answers=state.answers[id]||[];answers[row]=[...(answers[row]||[]),Number(token.dataset.token)];state.answers[id]=answers;clearRetry();render();return;}
  const remove=event.target.closest('[data-remove-token]');if(remove){const id=currentId(),row=Number(remove.dataset.orderRow),answers=state.answers[id]||[];answers[row]=(answers[row]||[]).filter(v=>v!==Number(remove.dataset.removeToken));state.answers[id]=answers;clearRetry();render();return;}
  const choice=event.target.closest('[data-choice]');if(choice){const id=currentId(),answers=state.answers[id]||[];answers[Number(choice.dataset.question)]=Number(choice.dataset.choice);state.answers[id]=answers;clearRetry();render();return;}
  const action=event.target.closest('[data-action]');if(!action)return;
  const id=currentId();switch(action.dataset.action){
    case 'check':handleCheck();break;
    case 'clear-order':state.answers[id]=[[],[],[]];clearRetry();render();break;
    case 'reveal':state.revealed[id]=true;render();break;
    case 'self-good':state.records[id]='correct';announce('Đã đánh dấu hoàn thành.');render();break;
    case 'self-review':state.records[id]='review';announce('Đã đánh dấu để luyện lại.');render();break;
    case 'speak':if('speechSynthesis' in window){speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(LESSONS[state.lesson].read[0]);u.lang='zh-CN';u.rate=.88;speechSynthesis.speak(u);}else announce('Trình duyệt này chưa hỗ trợ đọc tiếng Trung.');break;
  }
});
document.addEventListener('change',event=>{
  const select=event.target.closest('[data-fill]');if(!select)return;
  const id=currentId(),answers=state.answers[id]||[];answers[Number(select.dataset.fill)]=select.value;state.answers[id]=answers;clearRetry();save();
});
document.addEventListener('input',event=>{
  const input=event.target.closest('[data-writing]');if(!input)return;
  const id=currentId(),a=state.answers[id]||[];a[Number(input.dataset.writing)]=input.value;state.answers[id]=a;save();
});
$('prevTask').addEventListener('click',()=>{if(state.task>0)state.task--;else if(state.lesson>0){state.lesson--;state.task=4;}render();});
$('nextTask').addEventListener('click',()=>{if(state.task<4)state.task++;else if(state.lesson<9){state.lesson++;state.task=0;}render();});
$('mobileLessons').addEventListener('click',()=>$('lessonNav').closest('.sidebar').classList.toggle('open'));
$('resetBtn').addEventListener('click',()=>{if(confirm('Đặt lại toàn bộ tiến độ và câu trả lời đã lưu trên trình duyệt này?')){state.records={};state.answers={};state.revealed={};state.lesson=0;state.task=0;render();}});
render();
