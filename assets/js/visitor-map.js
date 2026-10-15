/* Current visitor only: coarse IP location on a local pixel world map.
   No visit counts, shared database, GPS prompt, or stored IP addresses. */
(() => {
  'use strict';
  const section=document.querySelector('[data-visitor-map]');
  if(!section)return;
  const status=section.querySelector('[data-visitor-status]');
  const location=section.querySelector('[data-visitor-location]');
  const caption=section.querySelector('[data-visitor-caption]');
  const marker=section.querySelector('[data-visitor-marker]');
  const cacheKey='qiangma.visitor-location.v1';
  const providers=[
    {name:'GeoJS',url:'https://get.geojs.io/v1/ip/geo.json'},
    {name:'IPWho',url:'https://ipwho.is/'}
  ];
  const coord=value=>typeof value==='number'?value:typeof value==='string'&&value.trim()!==''?Number(value):NaN;
  const label=value=>typeof value==='string'?value.trim().slice(0,100):'';
  function normalize(data,provider){
    const latitude=coord(data.latitude),longitude=coord(data.longitude);
    if(data.success===false||data.error||!Number.isFinite(latitude)||!Number.isFinite(longitude)||Math.abs(latitude)>90||Math.abs(longitude)>180)return null;
    const country=label(data.country),city=label(data.city);
    if(!country)return null;
    // Explicitly select fields: IP and network metadata are neither retained nor shown.
    return {latitude,longitude,country,city,provider};
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
    marker.setAttribute('aria-label',`Your approximate location: ${place}`);
    marker.hidden=false;section.classList.add('visitor-connected');
    location.textContent=place;status.textContent='Current visit';
    caption.textContent=`Approximate IP location · ${data.provider}`;
  }
  async function locate(){
    const saved=cached();if(saved){show(saved);return;}
    status.textContent='Locating';location.textContent='Finding your region…';
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
    status.textContent='Location unavailable';location.textContent='Unable to locate this visit';
    caption.textContent='The location service could not be reached.';
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
