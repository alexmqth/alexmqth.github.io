/* Fresh current location plus a persistent, city-level visitor heatmap. */
(() => {
  'use strict';
  const section=document.querySelector('[data-visitor-map]');
  if(!section)return;
  const status=section.querySelector('[data-visitor-status]');
  const location=section.querySelector('[data-visitor-location]');
  const marker=section.querySelector('[data-visitor-marker]');
  const ip=section.querySelector('[data-visitor-ip]');
  const pinLabel=section.querySelector('[data-visitor-pin-label]');
  const api=section.dataset.visitorApi;
  const insight=section.querySelector('[data-visitor-insight]');
  let defaultInsight='',busy=false,lastAttempt=0,revealed=false;
  let currentLocation=null;
  const providers=[
    {name:'GeoJS',url:'https://get.geojs.io/v1/ip/geo.json'},
    {name:'IPWho',url:'https://ipwho.is/'}
  ];
  const coord=value=>typeof value==='number'?value:typeof value==='string'&&value.trim()!==''?Number(value):NaN;
  const label=value=>typeof value==='string'?value.trim().slice(0,100):'';
  function normalize(data,provider){
    const latitude=coord(data.latitude),longitude=coord(data.longitude);
    if(data.success===false||data.error||!Number.isFinite(latitude)||!Number.isFinite(longitude)||Math.abs(latitude)>90||Math.abs(longitude)>180)return null;
    const country=label(data.country),city=label(data.city),address=label(data.ip);
    if(!country||!(/^[0-9a-f:.]{3,45}$/i.test(address)))return null;
    return {latitude,longitude,country,city,ip:address,provider};
  }
  function position(element,latitude,longitude){
    element.style.left=`${Math.max(1.5,Math.min(98.5,(12+(longitude+180)/360*936)/960*100))}%`;
    element.style.top=`${Math.max(4,Math.min(96,(16+(85-latitude)/150*394)/432*100))}%`;
  }
  function show(data){
    // Same equirectangular projection and geographic bounds as visitor-world.svg.
    position(marker,data.latitude,data.longitude);
    const place=data.city&&data.city!==data.country?`${data.city}, ${data.country}`:data.country;
    marker.setAttribute('aria-label',`Visitor IP ${data.ip}, location: ${place}`);
    pinLabel.textContent=place;
    marker.hidden=false;section.classList.add('visitor-connected');
    ip.textContent=data.ip;location.textContent=place;status.textContent='Signal located';
  }
  function showHistory(summary){
    if(!summary||!Number.isSafeInteger(summary.signals)||summary.signals<0||!Array.isArray(summary.points))return;
    const history=section.querySelector('[data-visitor-history]');
    history.replaceChildren();
    for(const point of summary.points.slice(0,1000).sort((a,b)=>a.count-b.count)){
      if(!Number.isFinite(point.latitude)||!Number.isFinite(point.longitude)||Math.abs(point.latitude)>90||Math.abs(point.longitude)>180||!Number.isSafeInteger(point.count)||point.count<1)continue;
      const dot=document.createElement('button');
      dot.type='button';dot.className='visitor-hotspot';
      const level=point.count>=25?3:point.count>=10?2:point.count>=3?1:0;
      dot.dataset.level=level;
      dot.style.setProperty('--heat-size',`${.375+level*.125}`);
      position(dot,point.latitude,point.longitude);
      const country=label(point.country),city=label(point.city);
      const place=city&&city!==country?`${city}, ${country}`:country||'Recorded location';
      const detail=`${place} · ${point.count.toLocaleString('en-US')} ${point.count===1?'visit':'visits'} / 90D`;
      dot.title=detail;dot.setAttribute('aria-label',detail);
      const select=()=>{insight.textContent=detail;};
      dot.addEventListener('pointerenter',select);dot.addEventListener('focus',select);dot.addEventListener('click',select);
      dot.addEventListener('pointerleave',()=>{if(document.activeElement!==dot)insight.textContent=defaultInsight;});
      dot.addEventListener('blur',()=>{insight.textContent=defaultInsight;});
      history.append(dot);
    }
    const total=section.querySelector('[data-visitor-total]');
    const count=Number.isSafeInteger(summary.visits)?summary.visits:summary.signals;
    total.textContent=`90D / ${count.toLocaleString('en-US')} ${count===1?'visit':'visits'}`;
    total.title='Visits by network address; repeat activity within 30 minutes counts once (UTC day boundary resets)';
    total.hidden=false;
    const countries=Array.isArray(summary.countries)?summary.countries.filter(p=>label(p.country)&&Number.isSafeInteger(p.count)&&p.count>0):[];
    defaultInsight=countries.length?`Top origins · ${countries.slice(0,3).map(p=>`${label(p.country)} ${p.count}`).join(' / ')}`:'Hover or tap a hotspot to explore';
    insight.textContent=defaultInsight;insight.hidden=false;
  }
  async function refreshHistory(){
    if(!api)return;
    try{
      const response=await fetch(`${api}/summary`,{credentials:'omit',cache:'no-store',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(5000)});
      if(response.ok)showHistory(await response.json());
    }catch{/* Keep the last visible history during temporary outages. */}
  }
  async function collect(){
    if(!api)return null;
    const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),9000);
    try{
      const response=await fetch(`${api}/visit`,{method:'POST',credentials:'omit',cache:'no-store',referrerPolicy:'no-referrer',signal:controller.signal});
      if(!response.ok)return null;
      const result=await response.json();
      showHistory(result.summary);
      return normalize(result.location||{},'AWS');
    }catch{return null;}finally{clearTimeout(timeout);}
  }
  async function fallback(){
    status.textContent='Tracing signal';location.textContent='Locating…';
    for(const provider of providers){
      const controller=new AbortController();
      const timeout=setTimeout(()=>controller.abort(),5000);
      try{
        const response=await fetch(provider.url,{signal:controller.signal,credentials:'omit',referrerPolicy:'no-referrer'});
        if(!response.ok)continue;
        const data=normalize(await response.json(),provider.name);
        if(data){
          show(data);return;
        }
      }catch{
        // Network blocks, timeouts and provider errors fall through to the next provider.
      }finally{clearTimeout(timeout);}
    }
    status.textContent='Signal unavailable';location.textContent='Unavailable';ip.textContent='—';marker.hidden=true;section.classList.remove('visitor-connected');
  }
  async function update(refresh=true){
    if(busy)return;
    busy=true;lastAttempt=Date.now();
    try{
      currentLocation=await collect();
      if(currentLocation){if(revealed)show(currentLocation);}
      else {await refreshHistory();if(revealed&&refresh)await fallback();}
    }finally{busy=false;}
  }
  // Re-check the network on every load, including reloads after switching VPNs.
  const initial=update(false);
  async function reveal(){revealed=true;await initial;if(currentLocation)show(currentLocation);else if(!busy)await fallback();}
  const resume=()=>{if(!document.hidden&&Date.now()-lastAttempt>15000)update();};
  window.addEventListener('focus',resume);
  window.addEventListener('online',resume);
  document.addEventListener('visibilitychange',resume);
  // Refresh other visitors' history without manufacturing visits from idle tabs.
  setInterval(()=>{if(!document.hidden&&!busy)refreshHistory();},60000);
  const motionButton=document.querySelector('.motion-toggle');
  function syncMotion(){section.classList.toggle('visitor-motion-paused',motionButton?.getAttribute('aria-pressed')==='true');}
  if(motionButton)new MutationObserver(syncMotion).observe(motionButton,{attributes:true,attributeFilter:['aria-pressed']});
  syncMotion();
  if('IntersectionObserver'in window){
    const observer=new IntersectionObserver(entries=>{
      if(entries.some(entry=>entry.isIntersecting)){observer.disconnect();reveal();}
    },{rootMargin:'180px'});
    observer.observe(section);
  }else reveal();
})();
