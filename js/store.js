/* 演唱會票夾 — 本機資料庫（IndexedDB）、共用狀態與小工具 */
/* ---------- 本機儲存：只存在這支手機的瀏覽器 ---------- */
let db=null;
function openDB(){return new Promise(res=>{try{const r=indexedDB.open('ticketbook',1);r.onupgradeneeded=()=>r.result.createObjectStore('tickets',{keyPath:'id'});r.onsuccess=()=>{db=r.result;res()};r.onerror=()=>res()}catch(e){res()}})}
function dbAll(){return new Promise(res=>{if(!db)return res([]);try{const q=db.transaction('tickets').objectStore('tickets').getAll();q.onsuccess=()=>res(q.result||[]);q.onerror=()=>res([])}catch(e){res([])}})}
function dbPut(t){return new Promise(res=>{if(t.sample)return res(true);if(!db)return res(false);try{const tx=db.transaction('tickets','readwrite');tx.objectStore('tickets').put(t);tx.oncomplete=()=>res(true);tx.onerror=()=>res(false)}catch(e){res(false)}})}
function dbDel(id){return new Promise(res=>{if(!db)return res();try{const tx=db.transaction('tickets','readwrite');tx.objectStore('tickets').delete(id);tx.oncomplete=()=>res();tx.onerror=()=>res()}catch(e){res()}})}

const S={tickets:[],sel:null,flipped:false,panel:null,confirmDel:false,draft:null,allYear:'all'};
const urls={};
const blobURL=(k,b)=>b?(urls[k]||(urls[k]=URL.createObjectURL(b))):'';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=d=>d?d.replace(/-/g,'.'):'';
const isCJK=s=>/[㐀-鿿぀-ヿ가-힯]/.test(s||'');
const cj=s=>isCJK(s)?' cjk':'';
const theme=t=>t.theme||PALETTES[0];
const tv=t=>`--t-bg:${theme(t).bg};--t-fg:${theme(t).fg};--t-ink:${theme(t).ink||'initial'}`;
/* 字色沒設定時，自動用畫布色加深 */
const autoInk=bg=>{const h=bg.replace('#',''),c=[0,2,4].map(i=>parseInt(h.substr(i,2),16)),k=[0x14,0x10,0x1E];return '#'+c.map((v,i)=>Math.round(v*.4+k[i]*.6).toString(16).padStart(2,'0')).join('')};
const inkOf=th=>th.ink||autoInk(th.bg);
const byDate=()=>[...S.tickets].sort((a,b)=>b.date.localeCompare(a.date));
const cur=()=>S.tickets.find(t=>t.id===S.sel);
const ticketNo=t=>{let h=0;for(const c of t.id)h=(h*31+c.charCodeAt(0))>>>0;return String(h%1000000).padStart(6,'0')};
const MON=['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

/* 票的形狀：比例跟著照片／影片走 */
function shape(t){
  const a=Math.min(16/9,Math.max(9/16,t.ar||16/9)),st=styleOf(t);
  if(st.id==='classic'){
    if(a>=1){const ratio=1/(.19+.73/a);return{land:true,ratio,cut:80}}
    const ratio=1/(.47+.9/a);return{land:false,ratio,cut:(1-.2*ratio)*100};
  }
  const r=Math.min(st.hi,Math.max(st.lo,1/(st.mw/a+st.eh)));
  return{ratio:r,land:r>=1};
}
