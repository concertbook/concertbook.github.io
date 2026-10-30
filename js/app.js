/* 演唱會票夾 — 錄音播放、刪除、所有按鈕事件、啟動 */
/* ---------- 錄音 ---------- */
const player=$('player');let synth=null,playing=false,vidAudio=null;
function setPlaying(on){playing=on;layer.querySelectorAll('.clip').forEach(c=>c.classList.toggle('playing',on));const b=$('playBtn');if(b)b.textContent=on?'停止錄音':'播放錄音'}
function stopAudio(){try{player.pause()}catch(e){}if(vidAudio){vidAudio.muted=true;vidAudio.ontimeupdate=null;vidAudio=null}if(synth){try{synth.close()}catch(e){}synth=null}setPlaying(false)}
function playAudio(t){
  if(playing){stopAudio();return}
  if(t.audio.kind==='video'){const v=layer.querySelector('.face:not(.back-face) video');if(!v){toast('找不到影片');return}
    const a=+v.dataset.s||0,b=+v.dataset.e||15;vidAudio=v;v.muted=false;v.currentTime=a;v.play().then(()=>setPlaying(true)).catch(()=>{v.muted=true;vidAudio=null;toast('這部影片無法播放聲音')});
    v.ontimeupdate=()=>{if(v.currentTime>=b-.05)stopAudio()};return}
  if(t.audio.kind==='synth'){
    try{const A=new (window.AudioContext||window.webkitAudioContext)();synth=A;const now=A.currentTime;
      const len=A.sampleRate*6,buf=A.createBuffer(1,len,A.sampleRate),dd=buf.getChannelData(0);for(let i=0;i<len;i++)dd[i]=(Math.random()*2-1)*(.4+.6*Math.sin(i/A.sampleRate*1.3)**2);
      const n=A.createBufferSource();n.buffer=buf;const bp=A.createBiquadFilter();bp.type='bandpass';bp.frequency.value=1100;bp.Q.value=.6;const ng=A.createGain();ng.gain.setValueAtTime(0,now);ng.gain.linearRampToValueAtTime(.35,now+.8);ng.gain.linearRampToValueAtTime(0,now+6);n.connect(bp).connect(ng).connect(A.destination);n.start();
      [261.6,329.6,392,523.3].forEach((f,i)=>{const o=A.createOscillator(),gg=A.createGain();o.type='triangle';o.frequency.value=f;gg.gain.setValueAtTime(0,now+.6+i*.35);gg.gain.linearRampToValueAtTime(.07,now+.7+i*.35);gg.gain.exponentialRampToValueAtTime(.0001,now+5.6);o.connect(gg).connect(A.destination);o.start(now+.6+i*.35);o.stop(now+6)});
      setPlaying(true);setTimeout(()=>{if(synth===A)stopAudio()},6100);toast('範例錄音（合成的現場歡呼聲）')}catch(e){toast('這個瀏覽器無法播放聲音')}
    return}
  const ca=t.audio.clip?t.audio.clip.start:0,cb=t.audio.clip?t.audio.clip.end:15;
  player.src=blobURL(t.id+'a',t.audio.blob);const seekA=()=>{try{player.currentTime=ca}catch(e){}};if(player.readyState>=1)seekA();else player.onloadedmetadata=seekA;
  player.ontimeupdate=()=>{if(player.currentTime>=cb-.05)stopAudio()};player.onended=()=>setPlaying(false);
  player.play().then(()=>setPlaying(true)).catch(()=>toast('這個錄音檔格式無法播放'));
}

/* ---------- 事件 ---------- */
/* 刪除：使用者的票從手機刪掉；範例票記在「已隱藏」清單 */
const HID='tb-hidden';
function hiddenIds(){try{return JSON.parse(localStorage.getItem(HID)||'[]')}catch(e){return []}}
function hideSample(id){try{const h=hiddenIds();if(!h.includes(id))h.push(id);localStorage.setItem(HID,JSON.stringify(h))}catch(e){}}
async function delTickets(ids){for(const id of ids){const t=S.tickets.find(x=>x.id===id);if(!t)continue;if(t.sample)hideSample(id);else await dbDel(id)}
  S.tickets=S.tickets.filter(x=>!ids.includes(x.id));const keep=S.tickets.find(x=>x.id===S.sel);S.sel=keep?keep.id:null;
  renderDeck();const next=keep||byDate()[0];if(next)select(next.id,{scroll:true});else renderHeader();paintMap();renderHeader();toast(`已刪除 ${ids.length} 張`)}
let toastT;function toast(m){const el=$('toast');el.textContent=m;el.hidden=false;clearTimeout(toastT);toastT=setTimeout(()=>el.hidden=true,2600)}
document.addEventListener('click',async e=>{
  const card=e.target.closest('[data-card]');
  if(card){const id=card.dataset.card;if(id===S.sel){S.flipped=false;S.panel=null;S.confirmDel=false;openView()}else select(id,{scroll:true});return}
  const vb=e.target.closest('[data-venue]');if(vb){chooseVenue(vb.dataset.venue);return}
  const pick=e.target.closest('[data-pick]');if(pick){const id=pick.dataset.pick;if(S.selMode){S.picked.has(id)?S.picked.delete(id):S.picked.add(id);S.askBulk=false;const sc=$('allSheet').scrollTop;openAll();$('allSheet').scrollTop=sc;return}closeLayer();select(id,{scroll:true});return}
  const yr=e.target.closest('[data-year]');if(yr){S.allYear=yr.dataset.year;openAll();return}
  const z=e.target.closest('[data-z]');if(z&&chart){flyTo(chart.getOption().geo[0].center,Math.max(1,Math.min(60,curZoom()*+z.dataset.z)));return}
  const sw=e.target.closest('[data-pal]');
  if(sw){const th={bg:sw.dataset.bg,fg:sw.dataset.fg};
    if(sw.dataset.pal==='d'){S.draft.theme=th;$('d-bg').value=th.bg;$('d-fg').value=th.fg;syncInkUI('d',th);markSw(th);refreshPreview()}
    else{setTicketTheme(cur(),th);$('v-bg').value=th.bg;$('v-fg').value=th.fg}return}
  const sy=e.target.closest('[data-style]');
  if(sy){if(sy.dataset.target==='d'){S.draft.style=sy.dataset.style;sy.closest('.styles').querySelectorAll('[data-style]').forEach(c=>c.setAttribute('aria-pressed',c===sy));refreshPreview()}
    else{const t=cur();t.style=sy.dataset.style;dbPut(t);rerenderCard(t);openView()}return}
  const fl=e.target.closest('[data-filter]');if(fl&&S.draft){S.draft.filter=fl.dataset.filter;fl.parentElement.querySelectorAll('.chip').forEach(c=>c.setAttribute('aria-pressed',c===fl));refreshPreview();return}
  const act=e.target.closest('[data-act]');if(!act)return;
  const a=act.dataset.act,t=cur();
  if(a==='closebg'&&e.target!==act)return;
  switch(a){
    case 'openadd':openAdd();break;
    case 'all':openAll();break;
    case 'close':case 'closebg':if(S.editId&&layer.querySelector('#f')){S.editId=null;S.draft=null}closeLayer();break;
    case 'edit':{const tt=cur();closeLayer();openEdit(tt);break}
    case 'world':flyTo([100,25],1.2);break;
    case 'retrymap':bootMap();break;
    case 'vmode':{const d=S.draft;d.vmode=d.vmode==='custom'?'list':'custom';openAdd();break}
    case 'pickmap':startPick();break;
    case 'inkauto':{if(act.dataset.target==='d'){const th={bg:S.draft.theme.bg,fg:S.draft.theme.fg};S.draft.theme=th;syncInkUI('d',th);refreshPreview()}else{const tt=cur();setTicketTheme(tt,{bg:theme(tt).bg,fg:theme(tt).fg})}break}
    case 'trim':openTrim();break;
    case 'trimok':closeTrim(true);break;
    case 'atrim':openTrim('audio');break;
    case 'trimcancel':closeTrim(false);break;
    case 'tplay':{const tv=$('tv');if(tv.paused){if(tv.currentTime<trim.start||tv.currentTime>=trim.end-.05)tv.currentTime=trim.start;tv.play().catch(()=>{});act.textContent='❚❚'}else{tv.pause();act.textContent='▶'}break}
    case 'tsound':{const tv=$('tv');tv.muted=!tv.muted;act.textContent=tv.muted?'開啟聲音':'關閉聲音';break}
    case 'pickcancel':endPick(null);break;
    case 'play':e.stopPropagation();if(t&&t.audio)playAudio(t);break;
    case 'tear':e.stopPropagation();if(t){t.torn=!t.torn;act.closest('.ticket,.tk').classList.toggle('torn',t.torn);dbPut(t);rerenderCard(t);toast(t.torn?'票根撕下了':'票根接回去了')}break;
    case 'flip':S.flipped=!S.flipped;$('flip').classList.toggle('on',S.flipped);break;
    case 'pal':S.panel=S.panel==='pal'?null:'pal';openView();break;
    case 'sty':S.panel=S.panel==='sty'?null:'sty';openView();break;
    case 'askdel':S.confirmDel=true;openView();break;
    case 'canceldel':S.confirmDel=false;openView();break;
    case 'del':{closeLayer();await delTickets([t.id]);break}
    case 'selmode':S.selMode=!S.selMode;S.picked=new Set();S.askBulk=false;openAll();break;
    case 'bulkask':if(S.picked&&S.picked.size){S.askBulk=true;openAll()}break;
    case 'bulkno':S.askBulk=false;openAll();break;
    case 'bulkdel':{const ids=[...S.picked];S.selMode=false;S.askBulk=false;S.picked=new Set();await delTickets(ids);openAll();break}
    case 'reset':S.draft=newDraft();openAdd();break;
  }
});
document.addEventListener('input',e=>{if(['v-bg','v-fg','v-ink'].includes(e.target.id)){const t=cur();if(!t)return;const th={bg:$('v-bg').value,fg:$('v-fg').value};if(e.target.id==='v-ink')th.ink=$('v-ink').value;else if(theme(t).ink)th.ink=theme(t).ink;setTicketTheme(t,th)}});
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&S.pick){endPick(null);return}
  if(e.key==='Escape'&&trim){closeTrim(false);return}
  if(e.key==='Escape'&&layer.innerHTML)closeLayer();
  if((e.key==='Enter'||e.key===' ')&&e.target.matches('[data-act="tear"]')){e.preventDefault();e.target.click()}
});

let SAFE=false;
try{SAFE=localStorage.getItem('tb-booting')==='1';localStorage.setItem('tb-booting','1')}catch(e){}
setTimeout(()=>{try{localStorage.removeItem('tb-booting')}catch(e){}},6000);
(async()=>{await openDB();const mine=await dbAll();
  mine.forEach(t=>{if(t.cvv)addVenue(t.cvv)});const hid=hiddenIds();S.tickets=[...SAMPLES.filter(x=>!hid.includes(x.id)),...mine];S.sel=byDate()[0]?.id||null;
  renderDeck();renderHeader();if(S.sel)select(S.sel,{scroll:false,fly:false});
  bootMap();
  if(SAFE)toast('上次沒有順利開啟，這次先暫停播放影片');
})();

/* ---------- PWA：離線快取、要求永久儲存 ---------- */
if('serviceWorker' in navigator){window.addEventListener('load',()=>{navigator.serviceWorker.register('./sw.js').catch(()=>{})})}
if(navigator.storage&&navigator.storage.persist){navigator.storage.persisted().then(p=>{if(!p)navigator.storage.persist().catch(()=>{})}).catch(()=>{})}
