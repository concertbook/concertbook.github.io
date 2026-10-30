/* 演唱會票夾 — 主畫面：大字、座標、浮動票卡 */
/* ---------- 畫布：大字、座標、票卡 ---------- */
const $=id=>document.getElementById(id);
const stage=$('stage'),track=$('track');
stage.addEventListener('scroll',()=>{if(stage.scrollTop||stage.scrollLeft){stage.scrollTop=0;stage.scrollLeft=0}});
function applyTheme(th){stage.style.setProperty('--t-bg',th.bg);stage.style.setProperty('--t-fg',th.fg);paintMap()}
function renderHeader(){
  const all=S.tickets;$('count').textContent=`${all.length} 場 · ${new Set(all.map(t=>venue(t.venueId).city)).size} 城市`;
  const t=cur(),D=$('display');
  if(!t){D.innerHTML='<h1>我的票夾</h1><p>按右上角新增第一張票</p>';$('coords').textContent='';return}
  const v=venue(t.venueId);
  D.innerHTML=`<div class="swap"><h1 class="${isCJK(t.artist)?'cjk':''}">${esc(t.artist)}</h1><p>${esc(t.tour)}${t.tour?' · ':''}${fmt(t.date)}${t.time?' '+esc(t.time):''}${t.sample?' · 範例':''}</p></div>`;
  $('coords').textContent=`${v.name} — ${Math.abs(v.lat).toFixed(4)}°${v.lat>=0?'N':'S'}  ${Math.abs(v.lng).toFixed(4)}°${v.lng>=0?'E':'W'}`;
}
function cardHTML(t){return `<button class="card ${t.id===S.sel?'on':''}" data-card="${t.id}" style="--tilt:${t.tilt||0}deg;width:calc(var(--card-h) * ${shape(t).ratio.toFixed(4)})" aria-label="${esc(t.artist)}，${t.date}">${ticketHTML(t)}</button>`}
function renderDeck(){
  track.innerHTML=byDate().map(cardHTML).join('')+`<button class="card new" data-act="openadd"><div><span>＋</span>新增一張票</div></button>`;
  liveId=null;wire15(track);syncVideos();
  requestAnimationFrame(()=>stage.style.setProperty('--deck-h',$('deck').offsetHeight+'px'));
}
function rerenderCard(t){const c=track.querySelector(`[data-card="${t.id}"]`);if(!c)return;const w=document.createElement('div');w.innerHTML=cardHTML(t);c.replaceWith(w.firstElementChild);wire15(track);syncVideos()}
/* 一次只讓一張票播影片：被選中的票換成影片，其他票只放截圖，避免手機記憶體不夠 */
let liveId=null;
function setLive(id,on){const c=track.querySelector(`[data-card="${id}"]`),t=S.tickets.find(x=>x.id===id);if(!c||!t||!t.cover||t.cover.kind!=='video')return;
  const m=c.querySelector('.m');if(!m)return;const w=document.createElement('div');w.innerHTML=mediaHTML(t,on);const n=w.firstElementChild;
  const old=m.querySelector('video');if(old){old.pause();old.removeAttribute('src');old.load()}m.replaceWith(n);wire15(c)}
function syncVideos(){const id=S.sel;if(liveId&&liveId!==id)setLive(liveId,false);if(id&&liveId!==id){setLive(id,true)}liveId=id}
function select(id,{scroll=false,fly=true}={}){
  if(!id)return;const changed=S.sel!==id;S.sel=id;const t=cur();if(!t)return;
  track.querySelectorAll('.card[data-card]').forEach(c=>c.classList.toggle('on',c.dataset.card===id));syncVideos();
  if(scroll){const c=track.querySelector(`[data-card="${id}"]`);if(c){lockUntil=Date.now()+900;track.scrollTo({left:c.offsetLeft-(track.clientWidth-c.offsetWidth)/2,behavior:'smooth'})}}
  if(changed)renderHeader();
  applyTheme(theme(t));
  if(fly){const v=venue(t.venueId);flyTo([v.lng,v.lat],Math.max(curZoom(),5.5))}
}
let scrollT,lockUntil=0;
track.addEventListener('scroll',()=>{clearTimeout(scrollT);scrollT=setTimeout(()=>{if(Date.now()<lockUntil)return;
  const mid=track.scrollLeft+track.clientWidth/2;let best=null,bd=1e9;
  track.querySelectorAll('.card[data-card]').forEach(c=>{const d=Math.abs(c.offsetLeft+c.offsetWidth/2-mid);if(d<bd){bd=d;best=c}});
  if(best&&best.dataset.card!==S.sel)select(best.dataset.card);
},110)},{passive:true});

/* 票卡往上拉 → 全部票根 */
(()=>{const deck=$('deck');let y0=null,x0=0;
  const start=(x,y)=>{if(layer.innerHTML)return;x0=x;y0=y};
  const move=(x,y)=>{if(y0==null)return;const dy=y0-y,dx=Math.abs(x-x0);if(dy>46&&dy>dx*1.2){y0=null;openAll()}else if(dx>30)y0=null};
  deck.addEventListener('touchstart',e=>start(e.touches[0].clientX,e.touches[0].clientY),{passive:true});
  deck.addEventListener('touchmove',e=>move(e.touches[0].clientX,e.touches[0].clientY),{passive:true});
  deck.addEventListener('touchend',()=>y0=null);
  const g=$('grab');g.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'){start(e.clientX,e.clientY);g.setPointerCapture(e.pointerId)}});
  g.addEventListener('pointermove',e=>{if(e.pointerType==='mouse')move(e.clientX,e.clientY)});
  g.addEventListener('pointerup',()=>y0=null);
})();
