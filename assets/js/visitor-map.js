/* AWS stores daily deduplicated signals; external geolocation remains a fallback. */
(() => {
  'use strict';
  const section=document.querySelector('[data-visitor-map]');
  if(!section)return;
  const status=section.querySelector('[data-visitor-status]');
  const location=section.querySelector('[data-visitor-location]');
  const marker=section.querySelector('[data-visitor-marker]');
  const ip=section.querySelector('[data-visitor-ip]');
  const pinLabel=section.querySelector('[data-visitor-pin-label]');
  const cacheKey='qiangma.visitor-location.v2';
  const api=section.dataset.visitorApi;
  const recordKey='qiangma.visitor-record.v1';
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
  function cached(){
    try{
      const saved=JSON.parse(sessionStorage.getItem(cacheKey));
      if(!saved||!Number.isFinite(saved.time)||Date.now()-saved.time>30*60*1000)return null;
      if(saved.location?.provider!=='AWS'&&!providers.some(p=>p.name===saved.location?.provider))return null;
      return normalize(saved.location,saved.location.provider);
    }catch{return null;}
  }
  function show(data){
    // Same equirectangular projection and geographic bounds as visitor-world.svg.
    const x=12+(data.longitude+180)/360*936;
    const y=16+(85-data.latitude)/150*394;
    marker.style.left=`${Math.max(1.5,Math.min(98.5,x/960*100))}%`;
    marker.style.top=`${Math.max(4,Math.min(96,y/432*100))}%`;
    const place=data.city&&data.city!==data.country?`${data.city}, ${data.country}`:data.country;
    marker.setAttribute('aria-label',`Visitor IP ${data.ip}, location: ${place}`);
    marker.classList.toggle('visitor-marker-left',x>600);
    marker.classList.toggle('visitor-marker-low',y<70);
    pinLabel.textContent=place;
    marker.hidden=false;section.classList.add('visitor-connected');
    ip.textContent=data.ip;location.textContent=place;status.textContent='Signal located';
  }
  function showHistory(summary){
    if(!summary||!Number.isSafeInteger(summary.signals)||summary.signals<0||!Array.isArray(summary.points))return;
    const history=section.querySelector('[data-visitor-history]');
    history.replaceChildren();
    for(const point of summary.points.slice(0,1000)){
      if(!Number.isFinite(point.latitude)||!Number.isFinite(point.longitude)||Math.abs(point.latitude)>90||Math.abs(point.longitude)>180)continue;
      const dot=document.createElement('i');
      dot.style.left=`${Math.max(1.5,Math.min(98.5,(12+(point.longitude+180)/360*936)/960*100))}%`;
      dot.style.top=`${Math.max(4,Math.min(96,(16+(85-point.latitude)/150*394)/432*100))}%`;
      history.append(dot);
    }
    const total=section.querySelector('[data-visitor-total]');
    total.textContent=`90D / ${summary.signals.toLocaleString('en-US')} network signals`;
    total.title='Distinct IP addresses per UTC day, over the last 90 days';
    total.hidden=false;
  }
  async function collect(){
    if(!api)return null;
    try{
      const saved=JSON.parse(sessionStorage.getItem(recordKey));
      if(saved&&Date.now()-saved.time<30*60*1000){showHistory(saved.summary);return normalize(saved.location||{},'AWS');}
    }catch{}
    const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),9000);
    try{
      const response=await fetch(`${api}/visit`,{method:'POST',credentials:'omit',referrerPolicy:'no-referrer',signal:controller.signal});
      if(!response.ok)return null;
      const result=await response.json();
      showHistory(result.summary);
      const data=normalize(result.location||{},'AWS');
      // Only cache successful locations so provider outages can recover on reload.
      if(data){try{sessionStorage.setItem(recordKey,JSON.stringify({time:Date.now(),location:data,summary:result.summary}));}catch{}}
      return data;
    }catch{return null;}finally{clearTimeout(timeout);}
  }
  // Count a page visit even if the reader never scrolls down to the map.
  const collected=collect();
  async function locate(){
    const stored=await collected;
    if(stored){show(stored);return;}
    const saved=cached();if(saved){show(saved);return;}
    status.textContent='Tracing signal';location.textContent='Locating…';
    for(const provider of providers){
      const controller=new AbortController();
      const timeout=setTimeout(()=>controller.abort(),5000);
      try{
        const response=await fetch(provider.url,{signal:controller.signal,credentials:'omit',referrerPolicy:'no-referrer'});
        if(!response.ok)continue;
        const data=normalize(await response.json(),provider.name);
        if(data){
          try{sessionStorage.setItem(cacheKey,JSON.stringify({time:Date.now(),location:data}));}catch{}
          show(data);return;
        }
      }catch{
        // Network blocks, timeouts and provider errors fall through to the next provider.
      }finally{clearTimeout(timeout);}
    }
    status.textContent='Signal unavailable';location.textContent='Unavailable';ip.textContent='—';
  }
  const motionButton=document.querySelector('.motion-toggle');
  function syncMotion(){section.classList.toggle('visitor-motion-paused',motionButton?.getAttribute('aria-pressed')==='true');}
  if(motionButton)new MutationObserver(syncMotion).observe(motionButton,{attributes:true,attributeFilter:['aria-pressed']});
  syncMotion();
  if('IntersectionObserver'in window){
    const observer=new IntersectionObserver(entries=>{
      if(entries.some(entry=>entry.isIntersecting)){observer.disconnect();locate();}
    },{rootMargin:'180px'});
    observer.observe(section);
  }else locate();
})();
