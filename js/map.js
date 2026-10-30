/* 演唱會票夾 — 世界地圖（ECharts） */
/* ---------- 地圖：從公開 CDN 載入 ECharts 與世界地圖資料，失敗就換下一個來源 ---------- */
const EC_SRC=['https://cdnjs.cloudflare.com/ajax/libs/echarts/4.9.0/echarts.min.js','https://cdn.jsdelivr.net/npm/echarts@4.9.0/dist/echarts.min.js','https://unpkg.com/echarts@4.9.0/dist/echarts.min.js'];
const WORLD_SRC=['https://cdn.jsdelivr.net/npm/echarts@4.9.0/map/js/world.js','https://unpkg.com/echarts@4.9.0/map/js/world.js'];
function loadScript(src,ms=10000){return new Promise((res,rej)=>{const s=document.createElement('script');s.src=src;s.async=true;const tm=setTimeout(()=>{s.remove();rej()},ms);s.onload=()=>{clearTimeout(tm);res()};s.onerror=()=>{clearTimeout(tm);s.remove();rej()};document.head.appendChild(s)})}
async function loadAny(list,ok){if(ok())return true;for(const u of list){try{await loadScript(u)}catch(e){}if(ok())return true}return false}
let chart=null;
const hasEC=()=>typeof echarts!=='undefined',hasWorld=()=>hasEC()&&echarts.getMap&&!!echarts.getMap('world');
async function bootMap(){
  const msg=$('mapMsg');msg.hidden=false;msg.textContent='地圖載入中…';
  const ok=await loadAny(EC_SRC,hasEC)&&await loadAny(WORLD_SRC,hasWorld);
  if(!ok){msg.innerHTML='地圖沒有載入成功，請確認手機有連上網路<br><button data-act="retrymap">重試</button>';return}
  msg.hidden=true;initMap();const t=cur();if(t){const v=venue(t.venueId);flyTo([v.lng,v.lat],5.5)}
}
function curZoom(){try{return chart.getOption().geo[0].zoom}catch(e){return 1.2}}
function mapSeries(){
  const t=cur(),g={};for(const x of S.tickets)(g[x.venueId]=g[x.venueId]||[]).push(x);
  const chrono=[...S.tickets].sort((a,b)=>a.date.localeCompare(b.date)),lines=[];
  for(let i=1;i<chrono.length;i++){const a=venue(chrono[i-1].venueId),b=venue(chrono[i].venueId);if(a.id!==b.id)lines.push({coords:[[a.lng,a.lat],[b.lng,b.lat]]})}
  const th=t?theme(t):PALETTES[0];
  const pts=Object.keys(g).map(id=>{const v=venue(id);return{name:id,value:[v.lng,v.lat,g[id].length]}});
  const selV=t?t.venueId:null;
  return [
    {type:'lines',coordinateSystem:'geo',silent:true,data:lines,lineStyle:{color:'#D8B668',width:2.2,type:'dashed',curveness:.28,opacity:.95},zlevel:1},
    {type:'scatter',coordinateSystem:'geo',data:pts.filter(p=>p.name!==selV),symbolSize:d=>9+d[2]*3,itemStyle:{color:'#F3EBDA',borderColor:th.bg,borderWidth:2},zlevel:2,
      label:{show:true,formatter:p=>venue(p.name).city,position:'right',color:'#F3EBDA',fontSize:11,fontFamily:'Noto Sans TC',fontWeight:500}},
    {type:'effectScatter',coordinateSystem:'geo',data:pts.filter(p=>p.name===selV),symbolSize:d=>14+d[2]*3,rippleEffect:{scale:3.2,brushType:'stroke'},itemStyle:{color:th.fg,borderColor:'#F3EBDA',borderWidth:2},zlevel:3,
      label:{show:true,formatter:p=>venue(p.name).city,position:'right',color:th.fg,fontSize:13,fontFamily:'Noto Sans TC',fontWeight:900}}
  ];
}
function initMap(){
  if(chart){chart.dispose();chart=null}
  chart=echarts.init($('map'),null,{renderer:'canvas'});
  chart.setOption({animationDurationUpdate:900,animationEasingUpdate:'cubicInOut',
    geo:{map:'world',roam:true,zoom:1.2,center:[100,25],scaleLimit:{min:1,max:60},silent:true,
      itemStyle:{areaColor:'rgba(243,235,218,.9)',borderColor:'rgba(0,0,0,.12)',borderWidth:.5},emphasis:{itemStyle:{areaColor:'rgba(243,235,218,.9)'},label:{show:false}}},
    series:mapSeries()});
  chart.getZr().on('click',e=>{if(!S.pick)return;const c=chart.convertFromPixel('geo',[e.offsetX,e.offsetY]);if(c&&isFinite(c[0]))endPick(c[1],c[0])});
  chart.on('click',p=>{if(S.pick)return;if(p.componentType==='series'&&p.name){const t=byDate().find(x=>x.venueId===p.name);if(t)select(t.id,{scroll:true})}});
}
window.addEventListener('resize',()=>chart&&chart.resize());
function paintMap(){if(chart)chart.setOption({series:mapSeries()})}
function flyTo(center,zoom){if(chart)chart.setOption({geo:{center,zoom}})}
