/* Current visitor's IP and location, with a short-lived tab-session cache.
   No shared visitor database or GPS permission prompt. */
(() => {
  'use strict';
  const section=document.querySelector('[data-visitor-map]');
  if(!section)return;
  const status=section.querySelector('[data-visitor-status]');
  const location=section.querySelector('[data-visitor-location]');
  const caption=section.querySelector('[data-visitor-caption]');
  const marker=section.querySelector('[data-visitor-marker]');
  const ip=section.querySelector('[data-visitor-ip]');
  const pinLabel=section.querySelector('[data-visitor-pin-label]');
  const cacheKey='qiangma.visitor-location.v2';
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
      if(!providers.some(p=>p.name===saved.location?.provider))return null;
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
    caption.textContent=data.provider;
  }
  async function locate(){
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
    caption.textContent='Service unavailable';
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
