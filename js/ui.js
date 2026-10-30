/* 演唱會票夾 — 彈出大票、全部票根、新增／編輯、修剪 */
/* ---------- 選單元件 ---------- */
const layer=$('layer');
function paletteHTML(th,target){
  return `<div class="palette" role="group" aria-label="票夾配色">${PALETTES.map(p=>`<button type="button" class="sw" style="--a:${p.bg};--b:${p.fg}" data-pal="${target}" data-bg="${p.bg}" data-fg="${p.fg}" aria-label="${p.name}" aria-pressed="${p.bg===th.bg&&p.fg===th.fg}"></button>`).join('')}</div>
  <div class="custom"><label>畫布色 <input type="color" id="${target}-bg" value="${th.bg}"></label><label>票色 <input type="color" id="${target}-fg" value="${th.fg}"></label><label>字色 <input type="color" id="${target}-ink" value="${inkOf(th)}"></label><button type="button" class="linkbtn" data-act="inkauto" data-target="${target}" id="${target}-inkauto" ${th.ink?'':'hidden'}>字色改回自動</button></div>
  <p class="note" style="margin-top:6px">字色＝票上的文字和線條顏色；沒改的話會自動配合畫布色。</p>`;
}
function stylesHTML(cur,target){
  return `<div class="styles">${['票券','郵票'].map(g=>`<div class="grp">${g}</div><div class="chips" role="group" aria-label="${g}">${STYLES.filter(s=>s.grp===g).map(s=>`<button type="button" class="chip" data-style="${s.id}" data-target="${target}" aria-pressed="${s.id===cur}">${s.name}</button>`).join('')}</div>`).join('')}</div>`;
}

/* ---------- 跳出的大票卡 ---------- */
const popW=t=>`min(100%, calc(50vh * ${shape(t).ratio.toFixed(4)}))`;
function openView(){
  const t=cur();if(!t)return;if(liveId){setLive(liveId,false);liveId=null}const v=venue(t.venueId),w=popW(t),st=styleOf(t);
  layer.innerHTML=`<div class="overlay" data-act="closebg" role="dialog" aria-modal="true" aria-label="${esc(t.artist)}">
    <button class="closer" data-act="close" aria-label="關閉">×</button>
    <div class="pop">
      <div class="flip ${S.flipped?'on':''}" id="flip"><div class="flip-in">
        <div class="face" data-act="flip">${ticketHTML(t,{live:true,detail:true,width:w})}</div>
        <div class="face back-face" data-act="flip">${backHTML(t,w)}</div>
      </div></div>
      <p class="hint">點票面翻面${t.audio?' · 點迴紋針聽錄音':''}${st.stub?' · 點票根撕下，票根會顯示日期、時間、座位':''}</p>
      <div class="panel">
        <div class="who">${esc(v.name)}</div>
        <div class="sub">${esc(v.city)}，${esc(v.country)}${t.seat?' · '+esc(t.seat):''} · ${st.name}</div>
        ${t.note?`<div class="sub" style="color:var(--sheet-ink);margin-top:8px">${esc(t.note)}</div>`:''}
        <div class="actions">
          <button class="btn solid" data-act="edit">編輯</button>
          <button class="btn ${S.panel==='pal'?'solid':''}" data-act="pal">調色</button>
          <button class="btn ${S.panel==='sty'?'solid':''}" data-act="sty">換票型</button>
          ${t.audio?'<button class="btn" data-act="play" id="playBtn">播放錄音</button>':''}
          <button class="btn warn" data-act="askdel">刪除這張票</button>
        </div>
        ${S.panel==='pal'?`<div style="margin-top:12px">${paletteHTML(theme(t),'v')}</div>`:''}
        ${S.panel==='sty'?`<div style="margin-top:12px">${stylesHTML(st.id,'v')}</div>`:''}
        ${S.panel&&t.sample?'<p class="note" style="margin-top:8px">範例票的修改重新整理後會還原</p>':''}
        ${S.confirmDel?`<div class="confirm" role="alert">${t.sample?'範例票刪除後不會再出現。':'照片、影片和錄音會一起刪掉，無法復原。'}<button class="btn warn" data-act="del">確定刪除</button><button class="btn" data-act="canceldel">取消</button></div>`:''}
      </div>
    </div></div>`;
  wire15(layer);
}
function closeLayer(){S.selMode=false;S.askBulk=false;stopAudio();layer.querySelectorAll('video').forEach(v=>{v.pause();v.removeAttribute('src');v.load()});layer.innerHTML='';if(typeof liveId!=='undefined')syncVideos();S.flipped=false;S.panel=null;S.confirmDel=false}
function paintVars(el,th){el.style.setProperty('--t-bg',th.bg);el.style.setProperty('--t-fg',th.fg);el.style.setProperty('--t-ink',th.ink||'initial')}
function syncInkUI(target,th){const i=$(target+'-ink');if(i)i.value=inkOf(th);const b=$(target+'-inkauto');if(b)b.hidden=!th.ink}
function setTicketTheme(t,th){t.theme=th;dbPut(t);applyTheme(th);
  layer.querySelectorAll('.ticket,.tk').forEach(el=>paintVars(el,th));
  const c=track.querySelector(`[data-card="${t.id}"] .ticket, [data-card="${t.id}"] .tk`);if(c)paintVars(c,th);syncInkUI('v',th);
  markSw(th);
}

/* ---------- 全部票根 ---------- */
function openAll(){
  const keepSel=S.selMode,keepAsk=S.askBulk;closeLayer();S.selMode=keepSel;S.askBulk=keepAsk;if(!S.picked)S.picked=new Set();const all=byDate(),years=[...new Set(all.map(t=>t.date.slice(0,4)))];
  const list=S.allYear==='all'?all:all.filter(t=>t.date.startsWith(S.allYear));
  let html='',last='';
  for(const t of list){const y=t.date.slice(0,4);if(y!==last){html+=`<div class="yr">${y}</div>`;last=y}
    html+=`<button class="gitem ${S.selMode&&S.picked.has(t.id)?'picked':''}" data-pick="${t.id}" ${S.selMode?`aria-pressed="${S.picked.has(t.id)}"`:''}>${S.selMode?'<span class="tick" aria-hidden="true">✓</span>':''}${ticketHTML(t,{live:false})}<div class="cap"><b>${esc(t.artist)}</b><span>${fmt(t.date).slice(5)}</span></div></button>`}
  layer.innerHTML=`<div class="sheet-wrap dim" data-act="closebg"><div class="sheet tall" id="allSheet" role="dialog" aria-modal="true" aria-label="全部票根">
    <span class="handle" aria-hidden="true"></span>
    <div class="sheet-head" id="allHead"><h2>全部票根<small>${all.length} 張</small></h2><div class="hbtns"><button class="btn ${S.selMode?'solid':''}" data-act="selmode">${S.selMode?'完成':'選取'}</button>${S.selMode?'':'<button class="btn" data-act="close">收起</button>'}</div></div>
    ${S.selMode?`<div class="bulk">${S.askBulk?`<span>確定刪除 ${S.picked.size} 張？照片影片會一起刪掉。</span><button class="btn warn" data-act="bulkdel">刪除</button><button class="btn" data-act="bulkno">取消</button>`:`<span>${S.picked.size?`已選 ${S.picked.size} 張`:'點票選取要刪除的票'}</span><button class="btn warn" data-act="bulkask" ${S.picked.size?'':'disabled'}>刪除</button>`}</div>`:''}
    <div class="chips" role="group" aria-label="年份" style="margin-bottom:14px"><button class="chip" data-year="all" aria-pressed="${S.allYear==='all'}">全部</button>${years.map(y=>`<button class="chip" data-year="${y}" aria-pressed="${S.allYear===y}">${y}</button>`).join('')}</div>
    <div class="grid">${html||'<p class="note">這一年還沒有票。</p>'}</div>
  </div></div>`;
  const sh=$('allSheet');let y0=null;
  sh.addEventListener('touchstart',e=>{if(sh.scrollTop<=0)y0=e.touches[0].clientY},{passive:true});
  sh.addEventListener('touchmove',e=>{if(y0!=null&&e.touches[0].clientY-y0>70){y0=null;closeLayer()}},{passive:true});
  sh.addEventListener('touchend',()=>y0=null);
}

/* ---------- 新增 ---------- */
function newDraft(){const p=PALETTES[S.tickets.length%PALETTES.length];return{id:'u'+Date.now().toString(36),artist:'',tour:'',date:new Date().toISOString().slice(0,10),venueId:'kh-nst',seat:'',note:'',filter:'none',cover:null,ar:16/9,audio:null,keepSound:false,time:'19:30',vmode:'list',cv:{name:'',city:'',country:'',lat:null,lng:null},tilt:+(Math.random()*4-2).toFixed(1),style:'classic',theme:{bg:p.bg,fg:p.fg}}}
function openAdd(){
  closeLayer();const d=S.draft||(S.draft=newDraft());
  layer.innerHTML=`<div class="sheet-wrap" data-act="closebg"><div class="sheet" role="dialog" aria-modal="true" aria-label="新增一張票">
    <span class="handle" aria-hidden="true"></span>
    <div class="sheet-head"><h2>${S.editId?'編輯這張票':'新增一張票'}</h2><button class="btn" data-act="close">取消</button></div>
    <div class="preview" id="preview" style="${tv(d)}"></div>
    <form id="f" novalidate>
      <div class="field"><span class="lab">票型</span>${stylesHTML(d.style,'d')}</div>
      <div class="field"><span class="lab">票夾配色</span>${paletteHTML(d.theme,'d')}</div>
      <div class="field"><span class="lab">票面照片／影片</span>
        <label class="file" for="cover"><span style="font-size:20px">▣</span><span><span id="coverName">${d.cover?'已選擇，點這裡更換':'選擇照片或影片'}</span><small>票的比例會跟著照片或影片；影片只播前 15 秒</small></span><input type="file" id="cover" accept="image/*,video/*"></label><div class="err" id="e-cover"></div>
        <div class="trimrow" id="trimRow" ${d.cover&&d.cover.kind==='video'?'':'hidden'}><span id="trimTxt">${clipText(d)}</span><button type="button" class="btn" data-act="trim">修剪片段</button></div>
        <p class="note pickhint" id="pickHint" hidden>選好影片後，iPhone 會先處理影片（轉檔、壓縮），影片越長要等越久，請稍候；處理完會自動回到這裡。</p>
        <label class="check" id="ksWrap" ${d.cover&&d.cover.kind==='video'?'':'hidden'}><input type="checkbox" id="keepSound" ${d.keepSound?'checked':''}> 保留影片聲音（點迴紋針會播影片原音）</label></div>
      <div class="field"><label class="lab" for="artist">明星／樂團</label><input type="text" id="artist" value="${esc(d.artist)}" placeholder="海岸線樂團" maxlength="40" autocomplete="off"><div class="err" id="e-artist"></div></div>
      <div class="field"><label class="lab" for="tour">演唱會名稱</label><input type="text" id="tour" value="${esc(d.tour)}" placeholder="夏夜巡迴" maxlength="40" autocomplete="off"></div>
      <div class="row2">
        <div class="field"><label class="lab" for="date">日期</label><input type="date" id="date" value="${d.date}"><div class="err" id="e-date"></div></div>
        <div class="field"><label class="lab" for="time">開演時間</label><input type="time" id="time" value="${esc(d.time)}"></div>
      </div>
      <div class="field"><label class="lab" for="seat">座位</label><input type="text" id="seat" value="${esc(d.seat)}" placeholder="B2 區 14 排 8 號" maxlength="30"></div>
      <div class="field"><label class="lab" for="vq">場館</label>
        <div class="vsel" id="vsel">${vselHTML(d)}</div>
        <input type="search" id="vq" placeholder="搜尋場館、城市或國家，例如 東京、Wembley" autocomplete="off" ${d.vmode==='custom'?'hidden':''}>
        <div class="vres" id="vres"></div>
        <button type="button" class="linkbtn" data-act="vmode">${d.vmode==='custom'?'改用場館清單搜尋':'找不到場館？自行輸入'}</button>
        <div class="vcustom" id="vcustom" ${d.vmode==='custom'?'':'hidden'}>
          <input type="text" id="cvName" placeholder="場館名稱" maxlength="40" value="${esc(d.cv.name)}">
          <div class="row2"><input type="text" id="cvCity" placeholder="城市" maxlength="20" value="${esc(d.cv.city)}"><input type="text" id="cvCountry" placeholder="國家／地區" maxlength="20" value="${esc(d.cv.country)}"></div>
          <div class="row2"><input type="text" inputmode="decimal" id="cvLat" placeholder="緯度 25.05" value="${d.cv.lat??''}"><input type="text" inputmode="decimal" id="cvLng" placeholder="經度 121.55" value="${d.cv.lng??''}"></div>
          <button type="button" class="btn" data-act="pickmap">在地圖上點選位置</button>
        </div>
        <div class="err" id="e-venue"></div></div>
      <div class="field"><span class="lab">票面濾鏡</span><div class="chips" role="group" aria-label="濾鏡">
        ${[['none','原色'],['tint','配色印刷'],['retro','復古褐'],['mono','單色']].map(([k,n])=>`<button type="button" class="chip" data-filter="${k}" aria-pressed="${d.filter===k}">${n}</button>`).join('')}</div></div>
      <div class="field"><span class="lab">演唱會錄音</span>
        <label class="file" for="audio" id="audioBox"><span style="font-size:20px">♪</span><span><span id="audioName"></span><small id="audioSub">播放最長 15 秒</small></span><input type="file" id="audio" accept="audio/*,video/*"></label>
        <div class="trimrow" id="aTrimRow" hidden><span id="aTrimTxt"></span><button type="button" class="btn" data-act="atrim">修剪錄音</button></div><div class="err" id="e-audio"></div></div>
      <div class="field"><label class="lab" for="note">心得</label><textarea id="note" maxlength="300" placeholder="安可唱了三首">${esc(d.note)}</textarea></div>
      <p class="note">照片匯入時會移除 GPS 位置和拍攝裝置資訊。檔案會複製一份存進票夾，只存在這支手機的瀏覽器裡。</p>
      <div class="actions"><button class="btn solid" type="submit">${S.editId?'儲存修改':'存進票夾'}</button>${S.editId?'':'<button class="btn" type="button" data-act="reset">清空</button>'}</div>
    </form></div></div>`;
  refreshPreview();syncAudioUI();
  const f=$('f');
  const upd=()=>{d.artist=f.artist.value.trim();d.tour=f.tour.value.trim();d.date=f.date.value;d.time=f.time.value;d.seat=f.seat.value.trim();d.note=f.note.value.trim();
    d.cv={name:$('cvName').value.trim(),city:$('cvCity').value.trim(),country:$('cvCountry').value.trim(),lat:numOr($('cvLat').value),lng:numOr($('cvLng').value)};refreshPreview()};
  f.addEventListener('input',e=>{const el=$('e-'+e.target.id);if(el)el.textContent='';if(e.target.id==='vq'){searchVenues(e.target.value);return}if(e.target.id.startsWith('cv'))$('e-venue').textContent='';
    if(e.target.type==='color'){const th={bg:$('d-bg').value,fg:$('d-fg').value};if(e.target.id==='d-ink')th.ink=$('d-ink').value;else if(d.theme.ink)th.ink=d.theme.ink;d.theme=th;syncInkUI('d',th);markSw(th);refreshPreview();return}if(e.target.type!=='file'&&e.target.type!=='checkbox')upd()});
  const cov=$('cover');let waitT;
  cov.addEventListener('click',()=>{setBusy(true,'等待選擇的照片／影片…');$('pickHint').hidden=false;clearTimeout(waitT);waitT=setTimeout(()=>clearWait(),120000)});
  const clearWait=()=>{clearTimeout(waitT);$('pickHint')&&($('pickHint').hidden=true);if(!cov.files||!cov.files.length){setBusy(false);$('coverName').textContent=d.cover?'已選擇，點這裡更換':'選擇照片或影片'}};
  cov.addEventListener('cancel',clearWait);
  f.addEventListener('change',e=>{if(e.target.id==='cover'){clearTimeout(waitT);$('pickHint').hidden=true;if(!e.target.files.length){clearWait();return}pickCover(e.target.files[0]);return}else if(e.target.id==='audio')pickAudio(e.target.files[0]);
    else if(e.target.id==='keepSound'){d.keepSound=e.target.checked;if(d.keepSound)d.audio={kind:'video'};else if(d.audio&&d.audio.kind==='video')d.audio=null;syncAudioUI();refreshPreview()}
    else if(e.target.type!=='color'&&e.target.id!=='vq')upd()});
  f.addEventListener('submit',async e=>{e.preventDefault();upd();let ok=true;
    if(!d.artist){$('e-artist').textContent='請輸入明星或樂團名稱';ok=false}
    if(!d.date){$('e-date').textContent='請選擇演出日期';ok=false}
    if(d.vmode==='custom'){const c=d.cv;if(!c.name){$('e-venue').textContent='請輸入場館名稱';ok=false}else if(c.lat==null||c.lng==null||Math.abs(c.lat)>90||Math.abs(c.lng)>180){$('e-venue').textContent='請在地圖上點選位置，或輸入正確的經緯度';ok=false}}
    if(!ok){(d.artist?(d.date?$('vq').hidden?$('cvName'):$('vq'):f.date):f.artist).focus();return}
    if(d.vmode==='custom'){const c=d.cv,v={id:'c-'+d.id,name:c.name,city:c.city||c.name,en:(c.city||'').toUpperCase(),country:c.country||'',lat:c.lat,lng:c.lng,custom:true};addVenue(v);d.venueId=v.id;d.cvv=v}
    const editing=S.editId;const t={...d,createdAt:d.createdAt||Date.now()};delete t.cv;delete t.vmode;if(d.vmode!=='custom')delete t.cvv;
    const saved=await dbPut(t);
    if(editing){const i=S.tickets.findIndex(x=>x.id===editing);if(i>=0)S.tickets[i]=t;else S.tickets.push(t)}else S.tickets.push(t);
    S.draft=null;S.editId=null;closeLayer();
    renderDeck();S.sel=null;select(t.id,{scroll:true});renderHeader();paintMap();toast(editing?'已儲存修改':(saved?'已存進票夾':'已加入（這個瀏覽器無法長期保存）'));
  });
}
const numOr=v=>{const n=parseFloat(String(v).trim());return isFinite(n)?n:null};
function addVenue(v){const o=VENUES.find(x=>x.id===v.id);if(o)Object.assign(o,v);else VENUES.push(v)}
/* 編輯：把票複製一份當草稿，存檔時覆蓋原本那張 */
function openEdit(t){S.editId=t.id;S.draft={...t,cv:t.cvv?{name:t.cvv.name,city:t.cvv.city,country:t.cvv.country,lat:t.cvv.lat,lng:t.cvv.lng}:{name:'',city:'',country:'',lat:null,lng:null},vmode:t.cvv?'custom':'list',keepSound:!!(t.audio&&t.audio.kind==='video')};openAdd()}
function vselHTML(d){if(d.vmode==='custom')return '<span class="vsel-k">自行輸入的場館</span>';const v=venue(d.venueId);return `<span class="vsel-k">已選</span><b>${esc(v.name)}</b><span>${esc(v.city)}，${esc(v.country)}</span>`}
const norm=s=>String(s||'').toLowerCase().replace(/\s+/g,'');
function searchVenues(q){const box=$('vres');const k=norm(q);if(!k){box.innerHTML='';return}
  const hits=VENUES.filter(v=>!v.custom||true).map(v=>{const hay=[v.name,v.alias,v.city,v.en,v.country].map(norm);let sc=0;hay.forEach((h,i)=>{if(h.startsWith(k))sc=Math.max(sc,10-i);else if(h.includes(k))sc=Math.max(sc,5-i*.5)});return{v,sc}}).filter(x=>x.sc>0).sort((a,b)=>b.sc-a.sc).slice(0,8);
  box.innerHTML=hits.length?hits.map(({v})=>`<button type="button" class="vitem" data-venue="${v.id}"><b>${esc(v.name)}</b><span>${esc(v.alias||'')}${v.alias?' · ':''}${esc(v.city)}，${esc(v.country)}</span></button>`).join(''):'<p class="note" style="padding:8px 2px">清單裡找不到，可以按「自行輸入」</p>'}
function chooseVenue(id){const d=S.draft;d.venueId=id;d.vmode='list';$('vsel').innerHTML=vselHTML(d);$('vres').innerHTML='';$('vq').value='';$('e-venue').textContent='';refreshPreview();const v=venue(id);flyTo([v.lng,v.lat],Math.max(curZoom(),6))}
function syncAudioUI(){const d=S.draft,inp=$('audio');if(!inp)return;const ks=!!d.keepSound;
  $('ksWrap').hidden=!(d.cover&&d.cover.kind==='video');const kc=$('keepSound');if(kc)kc.checked=ks;inp.disabled=ks;$('audioBox').classList.toggle('off',ks);
  $('audioName').textContent=ks?'已使用影片原音，不能再匯入音檔':(d.audio&&d.audio.kind==='file'?'已加入錄音（票上會出現迴紋針）':'選擇錄音檔（選用）');
  $('audioSub').textContent=ks?'取消勾選「保留影片聲音」才能改用音檔':'播放最長 15 秒，太長可以修剪';
  const hasA=!ks&&d.audio&&d.audio.kind==='file';$('aTrimRow').hidden=!hasA;
  if(hasA){const c=d.audio.clip||{start:0,end:Math.min(15,d.audio.dur||15)};$('aTrimTxt').textContent=`片段 ${fmtT(c.start)} – ${fmtT(c.end)}（${(c.end-c.start).toFixed(1)} 秒）${d.audio.dur?` · 全長 ${fmtT(d.audio.dur)}`:''}`}}
/* 在地圖上點選位置 */
function startPick(){if(!chart){toast('地圖還沒載入，請直接輸入經緯度');return}
  S.pick=true;layer.innerHTML='';stage.classList.add('picking');$('pickBar').hidden=false;flyTo([110,25],2.4)}
function endPick(lat,lng){S.pick=false;stage.classList.remove('picking');$('pickBar').hidden=true;
  if(lat!=null){S.draft.vmode='custom';S.draft.cv={...S.draft.cv,lat:+lat.toFixed(4),lng:+lng.toFixed(4)}}openAdd()}
function markSw(th){layer.querySelectorAll('.sw').forEach(s=>s.setAttribute('aria-pressed',s.dataset.bg===th.bg&&s.dataset.fg===th.fg))}
function refreshPreview(){const p=$('preview');if(!p)return;const d=S.draft,r=shape(d).ratio;p.setAttribute('style',tv(d));p.innerHTML=ticketHTML(d,{live:true,width:`min(100%, calc(210px * ${r.toFixed(4)}))`});wire15(p)}
const fmtT=x=>{x=Math.max(0,x||0);const m=Math.floor(x/60),s=x-m*60;return `${m}:${s<10?'0':''}${s.toFixed(1)}`};
function clipText(d){if(!d.cover||d.cover.kind!=='video')return '';const c=d.clip||{start:0,end:Math.min(15,d.dur||15)};return `片段 ${fmtT(c.start)} – ${fmtT(c.end)}（${(c.end-c.start).toFixed(1)} 秒）${d.dur?` · 影片全長 ${fmtT(d.dur)}`:''}`}
/* 匯入中：檔案框轉圈、預覽上蓋一層「正在匯入」 */
function setBusy(on,msg){const box=document.querySelector('label[for="cover"]'),pv=$('preview');if(box)box.classList.toggle('busy',on);
  if(on){$('coverName').textContent=msg;if(pv&&!pv.querySelector('.importing')){const o=document.createElement('div');o.className='importing';o.innerHTML=`<span class="spinner"></span><span>${msg}</span>`;pv.appendChild(o)}else if(pv)pv.querySelector('.importing span:last-child').textContent=msg}
  else if(pv){const o=pv.querySelector('.importing');if(o)o.remove()}
  const sb=document.querySelector('#f button[type=submit]');if(sb)sb.disabled=on}
async function pickCover(file){
  const err=$('e-cover');err.textContent='';if(!file)return;const d=S.draft;
  if(file.type.startsWith('image/')){
    if(file.size>25e6){err.textContent='照片超過 25 MB，請選小一點的檔案';return}
    setBusy(true,'正在匯入照片…');await new Promise(r=>setTimeout(r,30));
    try{const r=await cleanImage(file);d.clip=null;d.dur=0;d.cover={kind:'image',blob:r.blob};d.ar=r.ar;if(d.keepSound){d.keepSound=false;d.audio=null;$('keepSound').checked=false}}catch(e){setBusy(false);err.textContent='這張照片讀不出來，請換一張 JPG 或 PNG';$('coverName').textContent='選擇照片或影片';return}
  }else if(file.type.startsWith('video/')){
    if(file.size>200e6){err.textContent='影片超過 200 MB，請先選短一點的影片';return}
    setBusy(true,'正在匯入影片…');
    const meta=await videoMeta(file);
    if(!meta.ok){setBusy(false);err.textContent='這部影片讀不出來，請換一部 MP4 或 MOV';$('coverName').textContent='選擇照片或影片';return}
    d.cover={kind:'video',blob:file};d.ar=meta.ar;d.dur=meta.dur;d.clip={start:0,end:Math.min(15,meta.dur||15)};
    d.poster=null;delete urls[d.id+'p'];grabFrame(file,0).then(b=>{if(b&&S.draft===d&&d.cover&&d.cover.blob===file){d.poster=b;delete urls[d.id+'p'];if(!trim)refreshPreview()}});
    if(!d.audio||d.audio.kind==='video'){d.keepSound=true;d.audio={kind:'video'}}
    if(file.size>60e6)toast('影片檔案較大，建議修剪成短片段');
  }else{err.textContent='只支援照片或影片';return}
  delete urls[d.id+'c'];setBusy(false);$('coverName').textContent=(d.ar<1?'已匯入（直拍）':'已匯入（橫拍）')+'，點這裡更換';
  $('trimRow').hidden=d.cover.kind!=='video';$('trimTxt').textContent=clipText(d);refreshPreview();syncAudioUI();
  if(d.cover.kind==='video'&&d.dur>15.2){toast('影片超過 15 秒，請選一段');openTrim()}
}
/* 截一張影片畫面當縮圖（480px 寬 JPG） */
function grabFrame(blob,at){return new Promise(res=>{const v=document.createElement('video'),u=URL.createObjectURL(blob);v.muted=true;v.playsInline=true;v.preload='auto';let done=false;
  const fin=r=>{if(done)return;done=true;try{v.removeAttribute('src');v.load()}catch(e){}URL.revokeObjectURL(u);res(r)};
  v.onloadeddata=()=>{v.currentTime=Math.max(.05,at||0)};
  v.onseeked=()=>{try{const w=480,h=Math.round(w/((v.videoWidth/v.videoHeight)||16/9)),c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(v,0,0,w,h);c.toBlob(b=>fin(b),'image/jpeg',.8)}catch(e){fin(null)}};
  v.onerror=()=>fin(null);setTimeout(()=>fin(null),8000);v.src=u})}
function videoMeta(file){return new Promise(res=>{const v=document.createElement('video'),u=URL.createObjectURL(file);v.preload='metadata';v.muted=true;let done=false;
  const fin=r=>{if(done)return;done=true;URL.revokeObjectURL(u);res(r)};
  v.onloadedmetadata=()=>fin({ok:true,ar:v.videoWidth&&v.videoHeight?v.videoWidth/v.videoHeight:16/9,dur:isFinite(v.duration)?v.duration:0});
  v.onerror=()=>fin({ok:false});setTimeout(()=>fin({ok:true,ar:16/9,dur:0}),8000);v.src=u})}

/* ---------- 修剪片段 ---------- */
let trim=null;
function openTrim(kind='video'){
  const d=S.draft,isA=kind==='audio';
  if(isA?!(d.audio&&d.audio.kind==='file'):!(d.cover&&d.cover.kind==='video'))return;
  const dur=(isA?d.audio.dur:d.dur)||15,c=(isA?d.audio.clip:d.clip)||{start:0,end:Math.min(15,dur)};trim={kind,dur,start:c.start,end:Math.min(c.end,dur),drag:null};
  const media=isA?`<div class="taud"><div class="disc" aria-hidden="true"></div><div class="tname"><b>${esc(d.audio.name||'演唱會錄音')}</b><span>全長 ${fmtT(dur)}</span></div><audio id="tv" src="${blobURL(d.id+'a',d.audio.blob)}" preload="auto"></audio><div class="tload" id="tload"><span class="spinner light"></span><span>錄音載入中…</span></div><button type="button" class="tplay" id="tplay" data-act="tplay" aria-label="播放片段">▶</button></div>`
    :`<div class="tvid"><video id="tv" src="${blobURL(d.id+'c',d.cover.blob)}" ${d.poster?`poster="${blobURL(d.id+'p',d.poster)}"`:''} playsinline preload="auto"></video><div class="tload" id="tload"><span class="spinner light"></span><span>影片載入中…</span></div><button type="button" class="tplay" id="tplay" data-act="tplay" aria-label="播放片段">▶</button></div>`;
  layer.innerHTML=`<div class="sheet-wrap"><div class="sheet trim" role="dialog" aria-modal="true" aria-label="${isA?'修剪錄音':'修剪影片片段'}">
    <span class="handle" aria-hidden="true"></span>
    <div class="sheet-head"><h2>${isA?'修剪錄音':'修剪片段'}</h2><button class="btn" data-act="trimcancel">取消</button></div>
    ${media}
    <div class="tl ${isA?'wave':''}" id="tl" aria-label="拖曳框選要用的片段">
      <div class="thumbs" id="thumbs"><span class="tl-load"><span class="spinner sm"></span>${isA?'正在畫出聲波…':'正在產生縮圖…'}</span></div>
      <div class="shade l" id="shL"></div><div class="shade r" id="shR"></div>
      <div class="twin" id="twin"><span class="th l" data-h="l"></span><span class="th r" data-h="r"></span></div>
      <div class="phead" id="phead"></div>
    </div>
    <div class="tinfo"><span id="tStart"></span><b id="tLen"></b><span id="tEnd"></span></div>
    <p class="note">拖曳框框選擇片段，拉兩側把手可調整長度（1～15 秒）。點時間軸任何地方，片段會跳到那裡。</p>
    <div class="actions"><button class="btn solid" data-act="trimok">使用這段</button><button class="btn" data-act="tsound" id="tSound">關閉聲音</button></div>
    <p class="note" style="margin-top:10px">${isA?'按「使用這段」後只會留下這一段錄音（25 MB 以下的檔案），其餘會丟掉，比較省空間。':'目前會記住片段位置、播放時只播這一段，原始影片仍會完整存著；之後的版本會把影片真的裁成這一段再存起來，比較省空間。'}</p>
  </div></div>`;
  drawTrim();
  const tl=$('tl'),tv=$('tv');
  tv.addEventListener('timeupdate',()=>{if(!trim)return;const p=$('phead');if(p)p.style.left=(tv.currentTime/trim.dur*100)+'%';if(tv.currentTime>=trim.end){tv.pause();tv.currentTime=trim.start;$('tplay')&&($('tplay').textContent='▶')}});
  let thumbsStarted=false;
  const ready=()=>{const l=$('tload');if(l)l.remove();if(!thumbsStarted){thumbsStarted=true;setTimeout(isA?makeWave:makeThumbs,150)}};
  ['loadeddata','canplay','seeked','suspend'].forEach(ev=>tv.addEventListener(ev,ready));
  tv.addEventListener('loadedmetadata',()=>setTimeout(ready,400));setTimeout(ready,3000);
  try{tv.load()}catch(e){}
  tv.addEventListener('loadedmetadata',()=>{if(trim)tv.currentTime=trim.start});
  const tAt=x=>{const r=tl.getBoundingClientRect();return Math.min(1,Math.max(0,(x-r.left)/r.width))*trim.dur};
  tl.addEventListener('pointerdown',e=>{e.preventDefault();tl.setPointerCapture(e.pointerId);const t=tAt(e.clientX),h=e.target.dataset.h;
    if(h)trim.drag={mode:h};else if(t>=trim.start&&t<=trim.end)trim.drag={mode:'move',off:t-trim.start};
    else{const len=trim.end-trim.start;trim.start=Math.min(Math.max(0,t-len/2),trim.dur-len);trim.end=trim.start+len;trim.drag={mode:'move',off:len/2};drawTrim(true)}});
  tl.addEventListener('pointermove',e=>{if(!trim.drag)return;const t=tAt(e.clientX),m=trim.drag.mode,max=Math.min(15,trim.dur);
    if(m==='move'){const len=trim.end-trim.start;trim.start=Math.min(Math.max(0,t-trim.drag.off),trim.dur-len);trim.end=trim.start+len}
    else if(m==='l'){trim.start=Math.min(Math.max(0,t,trim.end-max),trim.end-1)}
    else{trim.end=Math.max(Math.min(trim.dur,t,trim.start+max),trim.start+1)}
    drawTrim(true)});
  const up=()=>{trim.drag=null};tl.addEventListener('pointerup',up);tl.addEventListener('pointercancel',up);
}
function drawTrim(seek){const L=trim.start/trim.dur*100,W=(trim.end-trim.start)/trim.dur*100;
  $('twin').style.left=L+'%';$('twin').style.width=W+'%';$('shL').style.width=L+'%';$('shR').style.left=(L+W)+'%';
  $('tStart').textContent=fmtT(trim.start);$('tEnd').textContent=fmtT(trim.end);$('tLen').textContent=(trim.end-trim.start).toFixed(1)+' 秒';
  if(seek){const tv=$('tv');try{tv.pause();tv.currentTime=trim.start}catch(e){}$('tplay').textContent='▶'}}
/* 縮圖：另開一個隱藏的影片，跳到 8 個時間點各截一張 */
async function makeThumbs(){const d=S.draft,box=$('thumbs'),n=6,v=document.createElement('video');v.muted=true;v.playsInline=true;v.preload='auto';v.src=blobURL(d.id+'c',d.cover.blob);
  const once=(ev,ms)=>new Promise(r=>{let t;const f=()=>{clearTimeout(t);v.removeEventListener(ev,f);r(true)};v.addEventListener(ev,f);t=setTimeout(()=>{v.removeEventListener(ev,f);r(false)},ms)});
  if(v.readyState<1&&!(await once('loadedmetadata',6000))){box.innerHTML='';return}
  const cw=96,ch=Math.round(cw/(v.videoWidth/v.videoHeight||16/9)),imgs=[];
  for(let i=0;i<n;i++){if(!$('thumbs')||!trim)return;v.currentTime=Math.min(trim.dur-.05,(i+.5)*trim.dur/n);await once('seeked',3000);
    try{const c=document.createElement('canvas');c.width=cw;c.height=ch;c.getContext('2d').drawImage(v,0,0,cw,ch);imgs.push(c.toDataURL('image/jpeg',.6))}catch(e){imgs.push('')}
    box.innerHTML=imgs.map(u=>`<span style="background-image:url(${u})"></span>`).join('')+'<span></span>'.repeat(n-imgs.length)}
  v.removeAttribute('src');v.load()}
/* 聲波：把錄音解碼後取每一小段的音量，畫成直條（太大的檔案不解碼，避免手機記憶體不夠） */
const WAVE_MAX=25e6;
/* 把選好的片段真的剪下來，存成小的 WAV 檔 */
function cutWav(ab,a,b){const sr=ab.sampleRate,nc=Math.min(2,ab.numberOfChannels),s0=Math.floor(a*sr),s1=Math.min(ab.length,Math.floor(b*sr)),n=s1-s0;
  const out=new DataView(new ArrayBuffer(44+n*nc*2)),w=(o,str)=>{for(let i=0;i<str.length;i++)out.setUint8(o+i,str.charCodeAt(i))};
  w(0,'RIFF');out.setUint32(4,36+n*nc*2,true);w(8,'WAVE');w(12,'fmt ');out.setUint32(16,16,true);out.setUint16(20,1,true);out.setUint16(22,nc,true);
  out.setUint32(24,sr,true);out.setUint32(28,sr*nc*2,true);out.setUint16(32,nc*2,true);out.setUint16(34,16,true);w(36,'data');out.setUint32(40,n*nc*2,true);
  const chs=[...Array(nc)].map((_,c)=>ab.getChannelData(c));let o=44;
  for(let i=s0;i<s1;i++)for(let c=0;c<nc;c++){const v=Math.max(-1,Math.min(1,chs[c][i]));out.setInt16(o,v<0?v*0x8000:v*0x7FFF,true);o+=2}
  return new Blob([out],{type:'audio/wav'})}
async function makeWave(){const d=S.draft,box=$('thumbs');if(!box||!d.audio)return;
  if(d.audio.blob.size>WAVE_MAX){box.innerHTML='<span class="tl-load">檔案較大，不畫聲波；一樣可以拖曳選段</span>';return}
  try{const buf=await d.audio.blob.arrayBuffer();const AC=window.AudioContext||window.webkitAudioContext;const ac=new AC();
    const ab=await new Promise((res,rej)=>{const p=ac.decodeAudioData(buf,res,rej);if(p&&p.then)p.then(res,rej)});ac.close&&ac.close();
    if(!$('thumbs')||!trim)return;trim.ab=ab;const ch=ab.getChannelData(0),N=90,step=Math.floor(ch.length/N)||1,peaks=[];
    for(let i=0;i<N;i++){let m=0;for(let j=i*step,e=Math.min(ch.length,(i+1)*step);j<e;j+=16){const v=Math.abs(ch[j]);if(v>m)m=v}peaks.push(m)}
    const mx=Math.max(...peaks)||1;box.innerHTML=`<div class="bars">${peaks.map(p=>`<i style="height:${Math.max(6,p/mx*92).toFixed(0)}%"></i>`).join('')}</div>`}
  catch(e){box.innerHTML='<span class="tl-load">（這個檔案畫不出聲波，仍可以拖曳選段）</span>'}}
function closeTrim(save){const d=S.draft,tv=$('tv');if(tv){tv.pause();tv.removeAttribute('src')}
  if(save&&trim&&trim.kind==='audio'){const a=+trim.start.toFixed(2),b=+trim.end.toFixed(2);
    if(trim.ab){try{const blob=cutWav(trim.ab,a,b),len=+(b-a).toFixed(2);d.audio={...d.audio,blob,clip:{start:0,end:len},dur:len,cutFrom:[a,b]};delete urls[d.id+'a'];toast(`已剪下 ${fmtT(a)} – ${fmtT(b)}，只存這一段`)}
      catch(e){d.audio.clip={start:a,end:b};toast(`已選錄音片段 ${fmtT(a)} – ${fmtT(b)}`)}}
    else{d.audio.clip={start:a,end:b};toast(`已選錄音片段 ${fmtT(a)} – ${fmtT(b)}（檔案較大，原檔會一起存）`)}
    trim=null;openAdd();return}
  if(save&&trim){d.clip={start:+trim.start.toFixed(2),end:+trim.end.toFixed(2)};grabFrame(d.cover.blob,d.clip.start).then(b=>{if(b){d.poster=b;delete urls[d.id+'p'];refreshPreview()}});toast(`已選片段 ${fmtT(d.clip.start)} – ${fmtT(d.clip.end)}`)}trim=null;openAdd()}
function videoRatio_unused(file){return new Promise(res=>{const v=document.createElement('video'),u=URL.createObjectURL(file);v.preload='metadata';v.muted=true;let done=false;
  const fin=r=>{if(done)return;done=true;URL.revokeObjectURL(u);res(r)};v.onloadedmetadata=()=>fin(v.videoWidth&&v.videoHeight?v.videoWidth/v.videoHeight:16/9);v.onerror=()=>fin(16/9);setTimeout(()=>fin(16/9),4000);v.src=u})}
function pickAudio(file){
  const err=$('e-audio');err.textContent='';if(!file)return;
  if(file.size>200e6){err.textContent='錄音超過 200 MB，太大了，請先在手機上剪短一點再匯入';return}
  if(S.draft.keepSound){err.textContent='已保留影片聲音，不能再匯入音檔';return}
  $('audioName').textContent='正在讀取錄音…';$('audioBox').classList.add('busy');
  audioMeta(file).then(dur=>{$('audioBox').classList.remove('busy');
    S.draft.audio={kind:'file',blob:file,name:file.name,dur,clip:{start:0,end:Math.min(15,dur||15)}};delete urls[S.draft.id+'a'];syncAudioUI();refreshPreview();
    if(dur>15.2){toast('錄音超過 15 秒，請選一段');openTrim('audio')}});
}
function audioMeta(file){return new Promise(res=>{const a=document.createElement('audio'),u=URL.createObjectURL(file);a.preload='metadata';let done=false;
  const fin=d=>{if(done)return;done=true;URL.revokeObjectURL(u);res(d)};a.onloadedmetadata=()=>fin(isFinite(a.duration)?a.duration:0);a.onerror=()=>fin(0);setTimeout(()=>fin(0),8000);a.src=u})}
/* 用 canvas 重畫：縮小尺寸，同時去掉 EXIF（GPS、裝置型號） */
function cleanImage(file){return new Promise((res,rej)=>{const img=new Image(),u=URL.createObjectURL(file);
  img.onload=()=>{const k=Math.min(1,1600/Math.max(img.width,img.height)),c=document.createElement('canvas');c.width=Math.round(img.width*k);c.height=Math.round(img.height*k);
    c.getContext('2d').drawImage(img,0,0,c.width,c.height);URL.revokeObjectURL(u);c.toBlob(b=>b?res({blob:b,ar:c.width/c.height}):rej(),'image/jpeg',.86)};
  img.onerror=()=>{URL.revokeObjectURL(u);rej()};img.src=u})}
