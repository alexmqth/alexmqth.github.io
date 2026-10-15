/* Animated pixel city: low-resolution scenery, rain, billboards and reflections.
   Cached architecture keeps animation light; all assets are local. */
(() => {
  'use strict';
  const canvas = document.getElementById('city-canvas');
  const ctx = canvas && canvas.getContext('2d');
  if (!ctx) return;
  const button = document.querySelector('.motion-toggle');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  // Render real low-resolution pixels; CSS enlarges them without interpolation.
  const W = 800, H = 460, resolution = 1;
  const scene = document.createElement('canvas'); scene.width = W * resolution; scene.height = H * resolution;
  const s = scene.getContext('2d');
  s.scale(resolution, resolution);
  let seed = 98121;
  const rand = () => ((seed = seed * 16807 % 2147483647) - 1) / 2147483646;
  function rect(c, x, y, w, h, color) { c.fillStyle = color; c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
  function line(c, x1, y1, x2, y2, color, thickness = 1) {
    c.strokeStyle = color; c.lineWidth = thickness; c.beginPath(); c.moveTo(Math.round(x1), Math.round(y1)); c.lineTo(Math.round(x2), Math.round(y2)); c.stroke();
  }
  function haze(c,x,y,r,color) {
    const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'#00000000');
    c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);
  }
  function text(c, word, x, y, color, size=9) { c.font=`bold ${size}px monospace`;c.fillStyle=color;c.fillText(word,x,y); }
  const sky = s.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#15172c');sky.addColorStop(.55,'#37304d');sky.addColorStop(1,'#101a2e');s.fillStyle=sky;s.fillRect(0,0,W,H);
  haze(s,460,120,230,'#74617e60');haze(s,180,160,160,'#2b8fa443');
  const neonEdges = [];
  // Three city depths, with mechanical rooflines and uneven illuminated windows.
  for(let layer=0;layer<3;layer++) {
    let x=-25;
    while(x<W) {
      const width=23+Math.floor(rand()*53), top=18+layer*37+rand()*93, bottom=355+layer*29;
      const color=['#292b47','#20253f','#141e34'][layer];
      rect(s,x,top,width,bottom-top,color);
      // Recessed side walls and stacked floor edges add depth to the skyline.
      s.fillStyle=layer===2?'#101a30':'#1c223b';s.beginPath();s.moveTo(x+width,top);s.lineTo(x+width+8,top+6);s.lineTo(x+width+8,bottom);s.lineTo(x+width,bottom);s.fill();
      for(let floor=top+18;floor<bottom;floor+=21)line(s,x+2,floor,x+width-2,floor,layer===2?'#29374b70':'#45475b60');
      rect(s,x+4,top-4,width-9,4,color);rect(s,x+width*.6,top-13,2,13,color);
      if(rand()>.45)line(s,x,top,x+width,top,['#56536d','#405b73','#324b63'][layer]);
      for(let wy=top+9;wy<bottom;wy+=5+layer)for(let wx=x+4;wx<x+width-3;wx+=5){
        const lit=rand();
        if(lit>.6)rect(s,wx,wy,rand()>.7?3:2,1.5,lit>.95?'#be9d8b':lit>.88?'#5f9aab':lit>.75?'#485a7b':'#2c374f');
      }
      rect(s,x+width-5,top+3,2,bottom-top-4,'#090e204d');
      if(layer===2&&rand()>.45){rect(s,x+width-11,top+14,7,12,'#344254');line(s,x+width-9,top+17,x+width-6,top+17,'#69718b');}
      if(layer===2){
        neonEdges.push({x:x+width-3,top:top+6,bottom:bottom-6,color:rand()>.5?'#60d9ef':'#d67bbb',offset:rand()*20});
        for(let vent=0;vent<3;vent++){rect(s,x+4,top+26+vent*4,8,2,'#101728');line(s,x+4,top+27+vent*4,x+11,top+27+vent*4,'#43516b');}
        line(s,x+width-5,top+9,x+width-5,bottom-4,'#50607940');
        // Layered mechanical floors, projecting balconies and luminous facade strips.
        const tint=rand()>.5?'#46d4e5':'#ed63ac';
        for(let deck=0;deck<3;deck++){
          const yy=top+35+deck*67;
          rect(s,x-3,yy,width+6,5,'#0b1425');
          line(s,x-3,yy,x+width+3,yy,tint+'90');
          line(s,x,yy+6,x+width,yy+6,'#53617b60');
          for(let j=0;j<width-9;j+=9){rect(s,x+j+4,yy+10,5,2,tint+'55');}
        }
        rect(s,x+width-9,top+7,2,55,tint+'90');
        for(let pipe=0;pipe<2;pipe++){
          const px=x+6+pipe*3;
          line(s,px,top+58,px,bottom-13,'#3b4e6970');
          for(let joint=top+62;joint<bottom-12;joint+=28)rect(s,px-1,joint,3,2,'#64718b60');
        }
        // Sparse yellow service windows interrupt the repeated blue window grid.
        for(let block=0;block<4;block++){
          const bx=x+9+rand()*Math.max(1,width-22),by=top+20+rand()*(bottom-top-40);
          rect(s,bx,by,7,3,block%2?'#d2a58080':'#6dabc58a');rect(s,bx+3,by,1,3,'#161b30');
        }
      }
      x+=width+2+rand()*8;
    }
  }
  // Rooftop aerials and overhead utility wires.
  for(const x of [79,252,585,712]){line(s,x,28,x,62,'#72718b');line(s,x-7,34,x+8,34,'#72718b');line(s,x-4,39,x+5,39,'#72718b');}
  s.strokeStyle='#11152be6';s.lineWidth=1;
  for(let i=0;i<4;i++){s.beginPath();s.moveTo(0,50+i*6);s.quadraticCurveTo(190,125+i*5,322,52+i*4);s.stroke();}
  for(let i=0;i<2;i++){s.beginPath();s.moveTo(543,35+i*4);s.quadraticCurveTo(702,100+i*5,800,49+i*5);s.stroke();}
  // Signs are fictional scenery, not affiliations or publication claims.
  const signs=[
    {x:40,y:56,w:77,h:27,c:'#50daf1',words:['NEON','ネオン','霓虹都市']},
    {x:142,y:112,w:56,h:25,c:'#be81df',words:['ORBIT','軌道','オービット']},
    {x:214,y:35,w:34,h:70,c:'#ed679e',words:['未来','電脳','夜光']},
    {x:282,y:81,w:65,h:27,c:'#68d9e4',words:['VISION','未来視','ビジョン']},
    {x:531,y:54,w:39,h:84,c:'#e46cab',words:['夜行','光影','東京']},
    {x:587,y:122,w:71,h:27,c:'#68bfe2',words:['METRO','地下鉄','都市回路']},
    {x:683,y:37,w:75,h:27,c:'#9586f3',words:['NEXUS','接続中','LINK_01']},
    {x:691,y:165,w:58,h:26,c:'#ecb579',words:['24 / 7','終夜営業','夜間通信']},
    {x:70,y:192,w:68,h:28,c:'#ec85c2',words:['MEMORY','記憶','メモリー']},
    {x:173,y:235,w:35,h:76,c:'#63d3e4',words:['深空','夢境','探索']},
    {x:573,y:236,w:73,h:28,c:'#a890f0',words:['NO SIGNAL','信号受信','再接続']},
    {x:704,y:272,w:35,h:74,c:'#df8bc0',words:['光年','通信','電波']}
  ];
  const glyphs = Array.from('01ABCDEFアイウエカキクケコサシスセソ光夜夢電脳<>/_');
  function decodedText(item,index,time){
    const clock=time+index*1.73, cycle=Math.floor(clock/8), phase=clock%8;
    const target=Array.from(item.words[cycle%item.words.length]);
    if(phase>1.65)return target.join('');
    const progress=phase/1.65, tick=Math.floor(clock*9);
    return target.map((ch,i)=>i/target.length<progress?ch:glyphs[(tick*7+i*11+index*3)%glyphs.length]).join('');
  }
  function sign(c,item,index,time){
    const {x,y,w,h}=item,word=decodedText(item,index,time);c.save();
    haze(c,x+w/2,y+h/2,w*.8,item.c+'25');rect(c,x-2,y-2,w+4,h+4,'#141b32');
    line(c,x,y,x+w,y,item.c+'b0');line(c,x,y+h,x+w,y+h,item.c+'70');
    line(c,x,y,x,y+h,item.c+'65');line(c,x+w,y,x+w,y+h,item.c+'65');
    c.beginPath();c.rect(x+2,y+2,w-4,h-4);c.clip();
    c.shadowColor=item.c;c.shadowBlur=5;
    if(h>w){
      c.font='bold 20px "Yu Gothic", "Microsoft YaHei", sans-serif';c.fillStyle=item.c;
      Array.from(word).slice(0,3).forEach((ch,i)=>c.fillText(ch,x+7,y+25+i*23));
    }else{
      const size=Math.min(12,(w-10)/Math.max(Array.from(word).length,.1));
      c.font=`bold ${size}px "Consolas", "Yu Gothic", "Microsoft YaHei", monospace`;c.fillStyle=item.c;c.fillText(word,x+5,y+16);
      c.shadowBlur=0;text(c,`// ${Math.floor(time*.8+index*13).toString(16).toUpperCase().padStart(4,'0')} : RX`,x+5,y+h-3,item.c+'9a',4);
    }
    rect(c,x+2,y+2+(time*10+index*7)%(h-4),w-4,1,item.c+'24');
    c.restore();
  }
  // Smaller projected signs form a second layer of light behind the walkway.
  const smallSigns=[['OPEN',72,151,'#e77ca9'],['夜行',175,160,'#66bacd'],['HORIZON',482,154,'#db8bb2'],['RELAY',571,173,'#95c5e6'],['光',661,101,'#c78dc6'],['MIDNIGHT',720,182,'#6b91d2']];
  smallSigns.forEach(([word,x,y,color])=>{haze(s,x+20,y-3,37,color+'25');text(s,word,x,y,color,7);line(s,x,y+3,x+word.length*5,y+3,color+'80');});
  // Lighted windows and pipework in the foreground.
  rect(s,18,319,136,81,'#11192c');rect(s,657,320,143,90,'#0d1729');
  for(let i=0;i<13;i++){rect(s,24+i*10,332,5,13,i%3===0?'#4e8298':'#23384d');rect(s,665+i*10,342,6,18,i%4===0?'#9a6f9e':'#263348');}
  line(s,16,314,157,314,'#4c6087');line(s,669,314,800,314,'#2d7890');
  // Wet elevated walkway and converging neon railings.
  s.fillStyle='#10182a';s.beginPath();s.moveTo(95,460);s.lineTo(380,333);s.lineTo(488,333);s.lineTo(800,460);s.fill();
  for(let i=0;i<38;i++){const y=359+rand()*100,x=150+rand()*580;rect(s,x,y,2+rand()*16,1,i%3?'#305f774d':'#b569aa3d');}
  for(const rail of [[65,399,388,304],[388,304,780,400],[65,428,388,331],[388,331,780,430]]){
    line(s,...rail,'#111a2d',4);line(s,rail[0],rail[1]-2,rail[2],rail[3]-2,'#54a6c6',1);
  }
  for(const [x,y] of [[103,388],[192,362],[285,335],[388,305],[488,329],[604,356],[725,388]]){
    line(s,x,y,x,y+51,'#10162a',5);line(s,x-1,y,x-1,y+49,'#39708a',1);
  }
  // Static dither and horizontal pixel grain keep the visual closer to pixel art.
  for(let i=0;i<15000;i++){rect(s,rand()*W,rand()*H,1,1,rand()>.5?'#b7c1d40b':'#03071c1b');}
  const drops=Array.from({length:150},()=>({x:rand()*W,y:rand()*H,speed:18+rand()*33,length:2+rand()*4,alpha:.12+rand()*.19}));
  const grain=document.createElement('canvas');grain.width=W;grain.height=H;
  const grainContext=grain.getContext('2d');
  // Cached ordered speckle adds discrete pixel texture to the light and holograms too.
  for(let gy=0;gy<H;gy+=2)for(let gx=0;gx<W;gx+=2){
    if(rand()>.58)rect(grainContext,gx,gy,1,1,rand()>.5?'#c3d5ef0d':'#02071d23');
  }
  let elapsed=0,frame=0,last=0,paused=reduced.matches,visible=true;
  function neonLighting(time) {
    ctx.save();ctx.globalCompositeOperation='screen';
    for(const edge of neonEdges) {
      const length=edge.bottom-edge.top, pulse=(time*13+edge.offset*12)%length;
      line(ctx,edge.x,edge.top,edge.x,edge.bottom,edge.color+'35');
      ctx.shadowColor=edge.color;ctx.shadowBlur=5;
      line(ctx,edge.x,edge.top+pulse,edge.x,Math.min(edge.bottom,edge.top+pulse+19),edge.color+'b0');
    }
    ctx.shadowBlur=0;
    for(let i=0;i<5;i++){
      const x=92+i*151, y=240+(i%2)*40, brightness=.09+.05*Math.sin(time*.55+i);
      haze(ctx,x,y,115,`rgba(${i%2?'198,80,163':'56,177,222'},${brightness})`);
    }
    // Light trails travelling through distant skybridges.
    for(let i=0;i<3;i++){
      const x=(time*(13+i*4)+i*210)%(W+90)-45,y=210+i*41;
      line(ctx,x,y,x+20,y,i%2?'#e297d88a':'#88dfef9a',1);
      haze(ctx,x+20,y,10,i%2?'#e297d845':'#88dfef45');
    }
    ctx.restore();
  }
  function angelBillboard(time){
    const x=374,y=29,w=137,h=167,cx=x+w/2,cy=y+53;
    const breath=.8+.2*Math.sin(time*.55);
    // Overlapping diffuse light volumes, rather than triangular light beams.
    ctx.save();ctx.globalCompositeOperation='screen';
    haze(ctx,cx,cy+15,310,`rgba(255,202,105,${.34*breath})`);
    haze(ctx,cx,cy-2,145,`rgba(255,221,145,${.36*breath})`);
    for(let i=0;i<8;i++){
      const a=i*Math.PI/4+Math.sin(time*.13)*.08;
      haze(ctx,cx+Math.cos(a)*82,cy+35+Math.sin(a)*48,90+i%3*25,`rgba(255,213,134,${.085*breath})`);
    }
    // Warm light suspended in drifting haze extends beyond the display's frame.
    for(let i=0;i<16;i++){
      const a=i*2.399+time*.025,r=35+(i%5)*26;
      haze(ctx,cx+Math.cos(a)*r,cy+Math.sin(a)*r*.7,24+i%4*13,`rgba(255,228,168,${.045*breath})`);
    }
    // Warm reflections on adjacent facades and the wet lower city.
    for(const [rx,ry,rw,rh] of [[350,76,2,150],[526,82,2,135],[345,201,190,1],[385,349,110,1]]){
      rect(ctx,rx,ry,rw,rh,`rgba(255,214,138,${.22*breath})`);
    }
    ctx.restore();
    rect(ctx,x-3,y-3,w+6,h+6,'#364052');rect(ctx,x,y,w,h,'#202d3dd9');
    line(ctx,x,y,x+w,y,'#e4c88aa0');line(ctx,x,y,x,y+h,'#9ce1dd88');line(ctx,x+w,y,x+w,y+h,'#9ce1dd88');
    haze(ctx,cx,cy+8,78,`rgba(255,204,110,${.26*breath})`);
    ctx.save();ctx.translate(cx,cy+Math.sin(time*.6)*1.1);
    // Nested gold aureoles behind the head and feathered wings.
    ctx.shadowColor='#ffe2a1';ctx.shadowBlur=12;
    ctx.strokeStyle='#ffd681';ctx.lineWidth=3;
    ctx.beginPath();ctx.arc(0,-3,37,0,Math.PI*2);ctx.stroke();
    ctx.lineWidth=1;ctx.strokeStyle='#fff0bdc9';ctx.beginPath();ctx.arc(0,-3,43,0,Math.PI*2);ctx.stroke();
    ctx.strokeStyle='#ffdb92b0';ctx.beginPath();ctx.arc(0,-3,31,0,Math.PI*2);ctx.stroke();
    ctx.shadowBlur=0;
    for(let i=0;i<20;i++){const a=i*Math.PI/10+time*.018;rect(ctx,Math.cos(a)*41,Math.sin(a)*41-3,1,2,'#ffe6a8bb');}
    // Layered tapered feathers, attached to a human silhouette at the shoulders.
    for(const side of [-1,1]){
      ctx.save();ctx.scale(side*(1+Math.sin(time*.75)*.025),1);
      ctx.shadowColor='#fff2bd';ctx.shadowBlur=8;
      ctx.fillStyle='#e3e6cd';ctx.beginPath();ctx.moveTo(7,15);ctx.bezierCurveTo(22,-1,41,-18,60,-41);ctx.bezierCurveTo(63,-5,51,33,20,58);ctx.lineTo(8,34);ctx.closePath();ctx.fill();
      ctx.shadowBlur=0;
      for(let f=0;f<12;f++){
        const tipX=60-f*2.55,tipY=-40+f*8.1,rootX=10+f*.65,rootY=14+f*2;
        ctx.fillStyle=f%3===0?'#fffce1':f%3===1?'#f4f3d9':'#e5e9d2';
        ctx.beginPath();ctx.moveTo(rootX,rootY);ctx.lineTo(tipX,tipY);
        ctx.lineTo(tipX-1,tipY+9);ctx.lineTo(rootX+5,rootY+8);ctx.closePath();ctx.fill();
        line(ctx,rootX+2,rootY+5,tipX-2,tipY+6,'#a9bbae55',.55);
      }
      ctx.restore();
    }
    // Head, hair, outstretched arms and a luminous flowing gown.
    ctx.shadowColor='#fff0bf';ctx.shadowBlur=5;
    ctx.fillStyle='#f1d4a6';ctx.beginPath();ctx.moveTo(-4,-9);ctx.lineTo(4,-9);ctx.lineTo(5,-4);ctx.lineTo(4,3);ctx.lineTo(0,6);ctx.lineTo(-4,3);ctx.lineTo(-5,-4);ctx.closePath();ctx.fill();
    rect(ctx,-5,-11,10,3,'#ddbb74');rect(ctx,-6,-8,2,15,'#e2c47f');rect(ctx,5,-8,2,16,'#e8cd91');
    rect(ctx,-7,3,2,8,'#dfc38a');rect(ctx,6,4,2,7,'#f0d99e');
    rect(ctx,-2,5,4,7,'#efd7a6');rect(ctx,-3,-3,1,1,'#8d7954');rect(ctx,2,-3,1,1,'#8d7954');line(ctx,-1,1,1,1,'#c89a7b',.6);
    ctx.strokeStyle='#fff4ca';ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(0,-17,9,2.5,0,0,Math.PI*2);ctx.stroke();
    for(const side of [-1,1]){
      ctx.save();ctx.scale(side,1);ctx.fillStyle='#f4e6bd';ctx.beginPath();
      ctx.moveTo(7,12);ctx.lineTo(14,16);ctx.lineTo(22,9);ctx.lineTo(25,11);ctx.lineTo(16,24);ctx.lineTo(6,21);ctx.closePath();ctx.fill();
      rect(ctx,22,6,3,6,'#f6ddb1');ctx.restore();
    }
    ctx.fillStyle='#fff5d6';ctx.beginPath();ctx.moveTo(-8,11);ctx.lineTo(8,11);ctx.lineTo(9,24);
    ctx.lineTo(4,34);ctx.lineTo(16+Math.sin(time*.6),70);ctx.lineTo(9,76);ctx.lineTo(0,73);ctx.lineTo(-10,77);ctx.lineTo(-15,69);ctx.lineTo(-4,34);ctx.lineTo(-9,24);ctx.closePath();ctx.fill();
    ctx.shadowBlur=0;
    line(ctx,-7,23,7,23,'#d4ad5f',2);line(ctx,-4,33,4,33,'#d4ad5f',2);
    line(ctx,-2,37,-9,70,'#d4c39c');line(ctx,2,37,8,71,'#e3c780');line(ctx,0,42,1,70,'#ffffffc9');
    rect(ctx,-6,75,4,5,'#f8dfac');rect(ctx,3,74,4,5,'#f8dfac');
    ctx.restore();
    // Floating luminous particles and holographic scan lines.
    ctx.save();ctx.globalCompositeOperation='screen';
    haze(ctx,cx,cy-8,74,`rgba(255,235,180,${.16*breath})`);
    line(ctx,x,y+6,x,y+h-6,'#ffe6a14a',2);line(ctx,x+w,y+6,x+w,y+h-6,'#ffe6a14a',2);
    for(let i=0;i<24;i++){
      const px=cx+Math.sin(i*11.3)*65,py=y+((i*17-time*6)%(h-10)+(h-10))%(h-10);
      const alpha=.25+.3*(Math.sin(time*.7+i)+1)/2;
      rect(ctx,px,py,i%5===0?2:1,1,`rgba(255,234,170,${alpha})`);
      if(i%6===0)haze(ctx,px,py,5,'#ffeab533');
    }
    ctx.restore();
    rect(ctx,x+1,y+2+(time*8)%(h-4),w-2,1,'#fff4c320');
    for(let scan=1;scan<h;scan+=3)rect(ctx,x+1,y+scan,w-2,1,'#0b143210');
    text(ctx,'S E R A P H',x+35,y+h-10,'#f9dfaa',8);
  }
  function figure(time){
    const x=302,y=323+Math.round(Math.sin(time*.7)*.7);
    rect(ctx,x+1,y-28,8,9,'#44516b');rect(ctx,x,y-29,8,3,'#182439');
    rect(ctx,x+7,y-25,2,5,'#ad9b9b');rect(ctx,x+2,y-19,5,3,'#718292');
    rect(ctx,x-2,y-19,13,23,'#263b51');rect(ctx,x-3,y-19,3,18,'#547687');
    rect(ctx,x-1,y-2,13,9,'#2d3b53');line(ctx,x+3,y-14,x+4,y+6,'#4d6980');
    rect(ctx,x+1,y+4,4,27,'#182b40');rect(ctx,x+7,y+3,4,26,'#30405b');
    const lift=(Math.sin(time*.45)+1)*2;
    line(ctx,x+10,y-15,x+19,y-10,'#618794',3);line(ctx,x+18,y-10,x+25-lift,y-15-lift,'#8098a6',2);
    rect(ctx,x+23-lift,y-19-lift,4,5,'#8cbac7');
    line(ctx,x+2,y+31,x+7,y+31,'#5c8098',2);line(ctx,x+7,y+29,x+13,y+29,'#6985a5',2);
    for(let i=0;i<9;i++){const age=(time*.23+i/9)%1;const sx=x+25-lift+Math.sin(age*6+time*.4)*5,sy=y-21-lift-age*24;haze(ctx,sx,sy,2+age*5,`rgba(164,203,217,${(1-age)*.16})`);}
  }
  // Commercial megascreens: distinct silhouettes, illuminated frames and animated feeds.
  function megascreens(time){
    const panels=[
      {x:49,y:42,w:148,h:92,c:'#57e6ed',kind:0,words:['夢の続き','BEYOND / REAL','接続された未来']},
      {x:598,y:66,w:160,h:91,c:'#ff74b9',kind:1,words:['新世界通信','SYNTH / 夢','ニューワールド']},
      {x:25,y:229,w:128,h:78,c:'#9e91ff',kind:2,words:['記憶を辿る','MEMORY BANK','記憶再生中']},
      {x:610,y:218,w:157,h:91,c:'#56d6f5',kind:3,words:['夜間急行','NIGHT NETWORK','東京 // 02:40']}
    ];
    for(const [i,p] of panels.entries()){
      const {x,y,w,h,c}=p;
      ctx.save();
      haze(ctx,x+w/2,y+h/2,w*.85,c+'38');
      // Physical mounting, stepped housings and a bright strip reflected on the wall.
      rect(ctx,x-6,y-5,w+12,h+12,'#080f20');rect(ctx,x-3,y-2,w+6,h+4,'#35435b');
      rect(ctx,x,y,w,h,'#11172c');rect(ctx,x-5,y+9,2,h-18,c);
      line(ctx,x,y+h+3,x+w,y+h+3,c,2);
      for(let j=0;j<4;j++){rect(ctx,x+12+j*(w/4),y+h+8,3,14,'#334257');rect(ctx,x+9+j*(w/4),y+h+8,1,19,c+'60');}
      ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();
      const g=ctx.createLinearGradient(x,y,x+w,y+h);g.addColorStop(0,c+'28');g.addColorStop(.6,'#10172c');g.addColorStop(1,c+'48');ctx.fillStyle=g;ctx.fillRect(x,y,w,h);
      if(p.kind===0){
        // A glowing orbital emblem, with a giant typographic advertisement.
        ctx.save();ctx.translate(x+42,y+38);ctx.rotate(-.35);
        ctx.strokeStyle=c;ctx.lineWidth=2;ctx.shadowColor=c;ctx.shadowBlur=5;
        for(let j=0;j<3;j++){ctx.beginPath();ctx.ellipse(0,0,27-j*5,12+j*4,time*.12+j*.7,0,Math.PI*2);ctx.stroke();}
        rect(ctx,-3,-3,6,6,'#e4ffff');ctx.restore();
        text(ctx,'夢',x+81,y+43,'#c9ffff',34);text(ctx,'DREAM / OS',x+78,y+56,c,7);
        text(ctx,decodedText(p,i+20,time),x+9,y+h-12,c,12);
      }else if(p.kind===1){
        // A pixel android portrait on a violet-pink giant advertising wall.
        ctx.save();ctx.translate(x+39,y+8);
        const rows=['   111111   ','  12222221  ',' 1223333221 ',' 1233333321 ',' 1234444321 ',' 1233333321 ','  23355332  ','   233332   ','    2332    ','   112211   ','  11122111  ',' 1111221111 '];
        const colors=['', '#513974','#c17ab8','#e6acd4','#6df9ff','#71466d'];
        rows.forEach((row,ry)=>Array.from(row).forEach((v,rx)=>{if(v!==' ')rect(ctx,(rx-6)*4,ry*5,4,5,colors[+v]);}));
        line(ctx,-22,24,24,24,'#a0ffff',2);ctx.restore();
        text(ctx,'新世界',x+80,y+30,'#ffd5ed',21);text(ctx,'S Y N T H',x+80,y+45,c,9);
        text(ctx,decodedText(p,i+20,time),x+78,y+62,'#bdadff',7);
        text(ctx,'YOUR NEXT REALITY',x+9,y+h-6,c,7);
      }else if(p.kind===2){
        // Isometric data crystal, rendered as stepped pixel bands.
        for(let j=0;j<19;j++){
          const span=j<9?j+2:21-j;
          rect(ctx,x+34-span,y+8+j*2,span*2,2,j%3===0?'#d4c9ff':j%2?'#a397f3':'#5b5fb5');
          rect(ctx,x+34,y+8+j*2,span,2,'#4af1ed88');
        }
        text(ctx,'記憶',x+67,y+32,'#e5dcff',22);text(ctx,'ARCHIVE',x+68,y+46,c,8);
        text(ctx,decodedText(p,i+20,time),x+9,y+h-12,c,10);
      }else{
        text(ctx,decodedText(p,i+20,time),x+10,y+20,'#cdf7ff',16);
        // Schematic train lines with moving packets, not a static text rectangle.
        for(let j=0;j<3;j++){
          const yy=y+34+j*14;line(ctx,x+12,yy,x+w-12,yy,j%2?'#f177c3':c,2);
          for(let k=0;k<5;k++){rect(ctx,x+17+k*27,yy-2,4,5,'#d3faff');}
          rect(ctx,x+12+(time*(17+j*7)+j*37)%(w-30),yy-2,9,4,'#ffffff');
        }
        text(ctx,'CONNECTED / 24H',x+10,y+h-5,c,6);
      }
      // CRT scan rows, slowly moving refresh bands and tiny broken pixels.
      for(let row=0;row<h;row+=3)rect(ctx,x,y+row,w,1,'#070b243e');
      rect(ctx,x,y+(time*12+i*20)%h,w,2,c+'28');
      for(let j=0;j<20;j++)rect(ctx,x+(j*43+i*7)%w,y+(j*19+Math.floor(time*2))%h,1,1,c+'70');
      ctx.restore();
    }
  }
  function symbolBillboard(time){
    const x=374,y=29,w=137,h=167,cx=x+w/2,cy=y+76;
    ctx.save();ctx.globalCompositeOperation='screen';
    haze(ctx,cx,cy,235,'#38dfff39');haze(ctx,cx,cy,105,'#6cf5ff55');ctx.restore();
    rect(ctx,x-3,y-3,w+6,h+6,'#364052');rect(ctx,x,y,w,h,'#122637ed');
    line(ctx,x,y,x+w,y,'#9cffffa0');line(ctx,x,y,x,y+h,'#6ce4ef88');line(ctx,x+w,y,x+w,y+h,'#6ce4ef88');
    ctx.save();ctx.translate(cx,cy);ctx.shadowColor='#4df3ff';ctx.shadowBlur=9;
    // An original interlocking ribbon sigil. Angular and deliberately pixel-stepped.
    for(const side of [-1,1]){
      ctx.save();ctx.scale(side,side);ctx.fillStyle='#74f4ff';ctx.beginPath();
      [[-45,-49],[-29,-49],[31,11],[31,25],[16,40],[2,40],[-15,23],[-15,9],[-2,-4],[9,7],[-1,17],[10,28],[19,19],[19,16],[-45,-48]].forEach(([a,b],i)=>i?ctx.lineTo(a,b):ctx.moveTo(a,b));
      ctx.closePath();ctx.fill();ctx.restore();
    }
    ctx.strokeStyle='#dcffff';ctx.lineWidth=2;ctx.strokeRect(-5,-5,10,10);
    ctx.shadowBlur=0;
    for(let i=0;i<8;i++){const a=i*Math.PI/4+time*.18;rect(ctx,Math.cos(a)*59,Math.sin(a)*60,2,2,'#9dfaff');}
    ctx.restore();
    text(ctx,'N E X U S',x+39,y+h-19,'#b7faff',9);text(ctx,'接 続 / LINK ESTABLISHED',x+19,y+h-8,'#6be8ed',6);
    for(let scan=1;scan<h;scan+=3)rect(ctx,x+1,y+scan,w-2,1,'#07192b40');
    rect(ctx,x+1,y+2+(time*12)%(h-4),w-2,2,'#b9ffff25');
  }
  function billboard(time){
    const phase=time%18;
    const angel=phase<7?0:phase<9?(phase-7)/2:phase<16?1:1-(phase-16)/2;
    canvas.dataset.billboard=angel===0?'symbol':angel===1?'angel':'transition';
    if(angel<1){ctx.save();ctx.globalAlpha=1-angel;symbolBillboard(time);ctx.restore();}
    if(angel>0){ctx.save();ctx.globalAlpha=angel;angelBillboard(time);ctx.restore();}
  }

  // A viewport-sized code layer continues below the skyline for the entire document.
  const codeCanvas=document.getElementById('code-canvas');
  const code=codeCanvas&&codeCanvas.getContext('2d');
  const codeBackdrop=document.querySelector('.code-backdrop');
  const cityBackdrop=document.querySelector('.city-backdrop');
  const header=document.querySelector('.site-header');
  let codeWidth=0,codeHeight=0;
  const hash=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};
  function codeMask(){
    if(!codeBackdrop)return;
    const city=cityBackdrop.getBoundingClientRect();
    codeBackdrop.style.setProperty('--code-start',`${Math.max(0,city.top+city.height*.65)}px`);
    codeBackdrop.style.setProperty('--code-end',`${Math.max(1,city.bottom)}px`);
  }
  function resizeCode(){
    if(!code)return;
    document.body.style.setProperty('--city-top',`${header.getBoundingClientRect().height}px`);
    // Match glyph scale to the reading UI, and keep 4K/5K canvas work bounded.
    const scale=Math.max(2,parseFloat(getComputedStyle(document.documentElement).fontSize)/8);
    codeWidth=Math.ceil(document.documentElement.clientWidth/scale);codeHeight=Math.ceil(innerHeight/scale);
    codeCanvas.width=codeWidth;codeCanvas.height=codeHeight;
    code.imageSmoothingEnabled=false;codeMask();drawCode();
  }
  function drawCode(){
    if(!code)return;
    code.clearRect(0,0,codeWidth,codeHeight);
    code.font='8px Consolas, "Yu Gothic", monospace';
    const rowHeight=11,rows=Math.ceil(codeHeight/rowHeight);
    for(let col=0;col<Math.ceil(codeWidth/10);col++){
      const speed=1.8+hash(col+5)*3,tail=8+Math.floor(hash(col+90)*24),period=rows+tail+18;
      const head=(elapsed*speed+hash(col+33)*period)%period;
      for(let r=0;r<rows;r++){
        const age=(head-r+period)%period;
        if(age>tail)continue;
        const fade=1-age/tail;
        code.fillStyle=age<1.2?'#c6ffff':col%9===0?`rgba(198,104,210,${fade*.55})`:`rgba(63,199,212,${fade*.62})`;
        const g=Math.floor(hash(col*191+r*7+Math.floor(elapsed*(age<3?6:.65)))*glyphs.length);
        code.fillText(glyphs[g],col*10,r*rowHeight+9);
      }
    }
  }
  function draw(){
    ctx.drawImage(scene,0,0,W,H);
    neonLighting(elapsed);
    signs.forEach((item,i)=>sign(ctx,item,i,elapsed));
    megascreens(elapsed);
    billboard(elapsed);figure(elapsed);
    haze(ctx,280+Math.sin(elapsed*.11)*60,334,190,'#669aaa13');
    for(const drop of drops){const y=(drop.y+elapsed*drop.speed)%H,x=(drop.x-elapsed*7%W+W)%W;line(ctx,x,y,x-1,y+drop.length,`rgba(151,190,220,${drop.alpha})`);}
    for(let i=0;i<6;i++){const x=250+i*55+Math.sin(elapsed*.13+i)*15;haze(ctx,x,353+i%2*25,55,'#6a8da70a');}
    ctx.drawImage(grain,0,0);
  }
  function tick(time){
    frame=0;if(paused||document.hidden){last=0;return;}
    if(!last)last=time;const delta=time-last;
    if(delta>=1000/24){elapsed+=Math.min(delta,100)/1000;last=time;if(visible)draw();drawCode();}
    frame=requestAnimationFrame(tick);
  }
  function sync(){
    cancelAnimationFrame(frame);last=0;button.hidden=document.hidden;
    button.textContent=paused?'Play animation':'Pause animation';button.setAttribute('aria-pressed',String(paused));
    if(!paused&&!document.hidden)frame=requestAnimationFrame(tick);
  }
  canvas.width=W*resolution;canvas.height=H*resolution;ctx.scale(resolution,resolution);ctx.imageSmoothingEnabled=false;
  button.addEventListener('click',()=>{paused=!paused;sync();});
  reduced.addEventListener('change',e=>{paused=e.matches;sync();});
  document.addEventListener('visibilitychange',sync);
  if('IntersectionObserver'in window)new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();}).observe(canvas);
  window.addEventListener('resize',resizeCode,{passive:true});
  if('ResizeObserver'in window)new ResizeObserver(resizeCode).observe(header);
  window.addEventListener('scroll',codeMask,{passive:true});
  resizeCode();draw();sync();
})();
