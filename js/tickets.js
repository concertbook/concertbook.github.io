/* 演唱會票夾 — 票面與背面的畫法（12 種票型） */
/* ---------- 範例票面：程式畫的舞台燈 ---------- */
const art={};
function stageArt(h){
  if(art[h])return art[h];
  const c=document.createElement('canvas');c.width=640;c.height=420;const x=c.getContext('2d');
  const g=x.createLinearGradient(0,0,0,420);g.addColorStop(0,`hsl(${h} 45% 16%)`);g.addColorStop(.7,`hsl(${h} 55% 36%)`);g.addColorStop(1,`hsl(${h} 40% 12%)`);
  x.fillStyle=g;x.fillRect(0,0,640,420);
  for(let i=0;i<5;i++){const cx=80+i*120,rg=x.createRadialGradient(cx,50,4,cx,50,150);rg.addColorStop(0,`hsla(${h+30} 90% 85% /.9)`);rg.addColorStop(1,'transparent');x.fillStyle=rg;x.fillRect(0,0,640,420)}
  x.fillStyle=`hsl(${h} 30% 9%)`;x.fillRect(150,220,340,26);
  let seed=h*7+3;const r=()=>((seed=(seed*9301+49297)%233280)/233280);
  for(let i=0;i<80;i++){const px=r()*640,py=320+r()*70,rr=13+r()*13;x.beginPath();x.arc(px,py,rr,0,7);x.fill();x.fillRect(px-rr*.9,py,rr*1.8,110)}
  for(let i=0;i<10;i++){const px=40+r()*560,py=250+r()*50;x.fillStyle=`hsl(${h} 30% 9%)`;x.fillRect(px,py,5,70);x.fillStyle=`hsla(${h+40} 100% 85% /.95)`;x.fillRect(px-2,py-8,9,9)}
  return art[h]=c.toDataURL('image/jpeg',.85);
}
function mediaHTML(t,live){
  const cv=t.cover;let inner;
  if(!cv)inner='<div class="empty">放上你的照片<br>或 15 秒影片</div>';
  else if(cv.kind==='sample')inner=`<div class="sample" style="background-image:url(${stageArt(cv.hue)})"></div><div class="beam"></div><div class="beam b2"></div>`;
  else if(cv.kind==='image')inner=`<img alt="" src="${blobURL(t.id+'c',cv.blob)}">`;
  else if(cv.kind==='video'&&(!live||SAFE))inner=t.poster?`<img alt="" src="${blobURL(t.id+'p',t.poster)}"><span class="vbadge">▶</span>`:'<div class="empty">▶ 影片</div>';
  else if(cv.kind==='video')inner=`<video data-loop15 data-s="${t.clip?t.clip.start:0}" data-e="${t.clip?t.clip.end:15}" src="${blobURL(t.id+'c',cv.blob)}" muted playsinline loop ${live?'autoplay':'preload="metadata"'}></video>`;
  return `<div class="m">${inner||''}</div>`;
}
const clipHTML=(t,detail)=>t.audio?(detail?'<button class="clip" data-act="play" aria-label="播放錄音"></button>':'<span class="clip" aria-hidden="true"></span>'):'';
const stubAttr=detail=>detail?'role="button" tabindex="0" aria-label="撕下票根" data-act="tear"':'';
const markHTML='<div class="mark">已入場</div>';
const sInfo=t=>{const d=(t.date||'').split('-');return `<span class="s-info"><span class="s-ok">ADMITTED</span><span><small>日期 DATE</small><b>${d[1]||'--'}.${d[2]||'--'}</b></span><span><small>時間 TIME</small><b>${esc(t.time)||'--:--'}</b></span><span class="seat"><small>座位 SEAT</small><b>${esc(t.seat)||'—'}</b></span></span>`};

/* 各票型的內容 */
function bodyHTML(t,live,detail){
  const v=venue(t.venueId),d=(t.date||'').split('-'),A=esc(t.artist)||'明星／樂團',T=esc(t.tour)||'演唱會名稱',M=mediaHTML(t,live),N=ticketNo(t);
  const day=d[2]||'--',mon=MON[(+d[1]||1)-1],yr=d[0]||'----';
  switch(styleOf(t).id){
  case 'tear':return `<div class="main"><div class="txt"><div><div class="big${cj(t.artist)}">${A}</div><div class="sub" style="margin-top:1.4cqw">${T}</div></div><span class="pill">${esc(v.name)} · ${esc(v.en)}</span></div><div class="sbox"><div class="win">${M}</div></div>${markHTML}</div>
    <div class="stub" ${stubAttr(detail)}>${sInfo(t)}<span class="s-front"><div class="admit2">Admit One</div><div class="kv"><small>座位 SEAT</small><b>${esc(t.seat)||'—'}</b></div><div class="kv"><small>日期 DATE</small><b>${fmt(t.date)}</b></div><div class="barcode"></div><div class="kv"><small>No.${N}</small></div></span></div>`;
  case 'poster':return `<div class="head"><div class="big${cj(t.artist)}">${A}</div><div class="sub">${T} · ${esc(v.en)} · ${yr}</div></div><div class="win">${M}</div><div class="foot"><span class="pill">${esc(v.name)}</span><span class="pill">${fmt(t.date)}</span></div>`;
  case 'vintage':return `<div class="main"><div class="frame"><div class="fin"><div class="l1">${A}</div><div class="win">${M}${markHTML}</div><div class="l2">${T} · ${esc(v.city)}</div></div></div></div>
    <div class="stub" ${stubAttr(detail)}>${sInfo(t)}<span class="s-front"><span class="vt">TICKET</span><span class="dt">${yr}<br>${d[1]||'--'}.${day}</span></span></div>`;
  case 'polaroid':return `<div class="tape"></div><div class="win">${M}</div><div class="cap"><div class="hand">${A}</div><div class="meta">${fmt(t.date)} · ${esc(v.city)}</div></div>`;
  case 'pass':return `<div class="top"><div class="acc">ALL ACCESS</div><div class="vip">${T} · No.${N}</div></div><div class="win">${M}</div><div class="bot"><b class="${cj(t.artist)}">${A}</b><span>${fmt(t.date)} · ${esc(t.seat)||esc(v.city)}</span></div>`;
  case 'stamp':return `<div class="in"><div class="win">${M}</div><div class="ov c1">${esc(v.en)}</div><div class="ov c2">${yr}</div><div class="ov c3">${A} · ${T}</div></div>`;
  case 'sframe':return `<div class="in"><div class="win">${M}</div><div class="den"><b>${day}</b><small>${mon}</small></div><div class="ttl${cj(t.artist)}">${A}</div><div class="scr">${T}</div></div>`;
  case 'scolor':return `<div class="in"><div class="win">${M}</div><div class="side"><span>${T}</span></div><div class="den"><b>${day}</b><small>${mon}</small></div></div>`;
  case 'snotch':return `<div class="in"><div class="win">${M}</div><div class="row"><b>${day}<small style="font-family:var(--f-script);font-size:.5em">${mon}</small></b><span class="${cj(t.artist)}">${A}</span></div></div>`;
  case 'sside':return `<div class="in"><div class="win">${M}</div><div class="den"><b>${day}</b><small>${mon} ${yr}</small></div><div class="side"><span>${T}</span><em class="${cj(t.artist)}">${A}</em></div></div>`;
  case 'scancel':return `<div class="in"><div class="win">${M}</div>
    <svg class="pm" viewBox="0 0 240 100" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="2.4"><circle cx="70" cy="48" r="34"/><circle cx="70" cy="48" r="26" stroke-width="1.2"/><path d="M112 22 q12 -8 24 0 t24 0 t24 0 t24 0 t24 0 M112 38 q12 -8 24 0 t24 0 t24 0 t24 0 t24 0 M112 54 q12 -8 24 0 t24 0 t24 0 t24 0 t24 0 M112 70 q12 -8 24 0 t24 0 t24 0 t24 0 t24 0"/></g>
      <text x="70" y="44" text-anchor="middle" font-family="Rubik,sans-serif" font-weight="900" font-size="11" fill="currentColor">${esc(v.en).slice(0,10)}</text><text x="70" y="60" text-anchor="middle" font-family="Courier Prime,monospace" font-size="10" fill="currentColor">${fmt(t.date)}</text></svg>
    <div class="lab"><span class="pill${cj(t.artist)}">${A}</span></div></div>`;
  }
  return '';
}
function ticketHTML(t,{live=false,detail=false,width='100%'}={}){
  const st=styleOf(t),sh=shape(t),fl=`f-${t.filter||'none'}`,torn=t.torn&&st.stub?'torn':'';
  if(st.id==='classic'){
    const v=venue(t.venueId),d=(t.date||'').split('-');
    return `<div class="tw" style="width:${width}"><div class="ticket ${sh.land?'land':'port'} ${fl} ${torn}" style="${tv(t)};--ratio:${sh.ratio.toFixed(4)};--cut:${sh.cut.toFixed(2)}%">
      <div class="t-main">
        <div class="t-head"><div class="t-artist${cj(t.artist)}">${esc(t.artist)||'明星／樂團'}</div><div class="t-tour">${esc(t.tour||'演唱會名稱')} · ${esc(v.city)}</div></div>
        <div class="t-win">${mediaHTML(t,live)}${markHTML}</div>
      </div>
      <div class="t-stub" ${stubAttr(detail)}>${sInfo(t)}<span class="s-front"><span class="t-admit">ADMIT ONE</span><span class="t-num"><b>${d[2]||'--'}.${d[1]||'--'}</b>${d[0]||'----'}<br>No.${ticketNo(t)}</span></span></div>
      ${clipHTML(t,detail)}
    </div></div>`;
  }
  const perf=st.grp==='郵票'&&st.id!=='snotch'?'perf':'';
  return `<div class="tw" style="width:${width}"><div class="tk st-${st.id} ${perf} ${fl} ${torn}" style="${tv(t)};--ratio:${sh.ratio.toFixed(4)}">${bodyHTML(t,live,detail)}${clipHTML(t,detail)}</div></div>`;
}
function backHTML(t,width){
  const v=venue(t.venueId),sh=shape(t),st=styleOf(t),tall=sh.ratio<1.05,N=ticketNo(t);
  const bkp=`<div class="bkp ${tall?'tall':''}">
    <div class="bthumb">${mediaHTML(t,false)}</div>
    <div class="binfo"><div class="bhead${cj(t.artist)}">${esc(t.artist)}</div>
      <dl><dt>場次</dt><dd>${esc(t.tour)||'—'}</dd><dt>日期</dt><dd>${fmt(t.date)}${t.time?' '+esc(t.time):''}</dd><dt>場館</dt><dd>${esc(v.name)}</dd><dt>座位</dt><dd>${esc(t.seat)||'—'}</dd></dl>
      ${t.note?`<p class="bnote">${esc(t.note)}</p>`:''}</div>
    <div class="postmark"><span><b>${esc(v.city)}</b>${Math.abs(v.lat).toFixed(2)}°${v.lat>=0?'N':'S'}<br>${Math.abs(v.lng).toFixed(2)}°${v.lng>=0?'E':'W'}<br>${fmt(t.date)}</span></div>
  </div>`;
  const vars=`${tv(t)};--ratio:${sh.ratio.toFixed(4)}`;
  if(st.id==='classic')return `<div class="tw" style="width:${width}"><div class="ticket backside ${sh.land?'land':'port'}" style="${vars};--cut:${sh.cut.toFixed(2)}%">
    <div class="t-main">${bkp}</div><div class="t-stub"><span class="s-front"><span class="t-admit">ADMIT ONE</span><span class="t-num">No.${N}</span></span></div></div></div>`;
  let body;
  switch(st.id){
    case 'tear':body=`<div class="main bmain">${bkp}</div><div class="stub"><div class="admit2">Admit One</div><div class="barcode"></div><div class="kv"><small>No.${N}</small></div></div>`;break;
    case 'vintage':body=`<div class="main"><div class="frame"><div class="fin">${bkp}</div></div></div><div class="stub"><span class="vt">TICKET</span><span class="dt">No.<br>${N}</span></div>`;break;
    case 'pass':body=`<div class="top"><div class="acc">BACKSTAGE</div><div class="vip">No.${N}</div></div>${bkp}`;break;
    case 'polaroid':body=`<div class="tape"></div>${bkp}`;break;
    case 'poster':body=bkp;break;
    default:body=`<div class="in">${bkp}</div>`;
  }
  const perf=st.grp==='郵票'&&st.id!=='snotch'?'perf':'';
  return `<div class="tw" style="width:${width}"><div class="tk isback st-${st.id} ${perf}" style="${vars}">${body}</div></div>`;
}
/* 影片只播選定的片段（預設前 15 秒），播完回到片段開頭 */
function wire15(root){root.querySelectorAll('video[data-loop15]').forEach(v=>{const a=+v.dataset.s||0,b=+v.dataset.e||15;
  v.addEventListener('loadedmetadata',()=>{if(a>0)v.currentTime=a});
  v.addEventListener('timeupdate',()=>{if(v.currentTime>=b||v.currentTime<a-.25)v.currentTime=a});
  if(v.autoplay)v.play().catch(()=>{})})}
