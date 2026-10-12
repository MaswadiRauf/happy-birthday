const CODE="1310"; // ganti kode di sini
/* ===== Musik latar ===== */
const BGM_SRC="musik/lagu.m4a";   // ganti dengan nama file lagu kamu
const BGM_VOL=.6;                 // volume akhir, 0 sampai 1
const BGM_FADE=3000;              // lama fade-in (ms)
const BGM=(()=>{
  const a=new Audio(BGM_SRC);a.loop=true;a.preload="auto";a.muted=true;a.volume=0;a.setAttribute("playsinline","");
  let primed=false,started=false,audible=false;
  function fade(){
    const t0=performance.now();
    (function f(n){const u=Math.max(0,Math.min(1,(n-t0)/BGM_FADE));
      try{a.volume=BGM_VOL*u}catch(e){}
      if(u<1)requestAnimationFrame(f);else try{a.volume=BGM_VOL}catch(e){}})(t0);
  }
  function unmute(){
    if(audible)return;audible=true;
    a.currentTime=0;a.volume=0;a.muted=false;
    if(a.paused)a.play().catch(()=>{});
    fade();
  }
  // kalau browser masih memblokir, coba lagi pada interaksi sah berikutnya (klik/sentuh lepas/keyboard)
  function retry(){
    const go=()=>{
      removeEventListener("pointerup",go,true);removeEventListener("click",go,true);
      removeEventListener("touchend",go,true);removeEventListener("keydown",go,true);
      a.muted=false;a.volume=0;a.currentTime=0;
      a.play().then(()=>{audible=true;fade()}).catch(()=>{});
    };
    ["pointerup","click","touchend","keydown"].forEach(e=>addEventListener(e,go,true));
  }
  return{
    // dipanggil saat tombol PIN ditekan: audio mulai jalan dalam keadaan MUTE (tidak terdengar),
    // dan tidak di-pause lagi, jadi browser tidak memblokirnya nanti di Layer 2
    prime(){
      if(primed)return;primed=true;
      a.play().catch(()=>{primed=false});
    },
    // dipanggil saat Layer 2 mulai: unmute + fade-in
    play(){
      started=true;
      if(!a.paused){unmute();return}
      a.muted=false;a.volume=0;a.currentTime=0;
      a.play().then(()=>{audible=true;fade()}).catch(retry);
    }
  };
})();
let val="";
const pad=document.getElementById("pad"),dots=[...document.querySelectorAll("#dots i")],msg=document.getElementById("msg");
[1,2,3,4,5,6,7,8,9,0,"⌫"].forEach(k=>{
  const b=document.createElement("button");b.textContent=k;b.type="button";
  if(k===0)b.className="z";
  b.setAttribute("aria-label",k==="⌫"?"hapus":k);
  b.onclick=()=>press(k);pad.appendChild(b);
});
/* ===== Suara (Web Audio, tanpa file audio) ===== */
const SFX=(()=>{
  let ac,out,nb;
  const P=[523.25,587.33,659.25,783.99,880,1046.5,1174.66,1318.51,1567.98,1760];   // nada pentatonik: tiap angka punya nadanya sendiri
  function ctx(){
    if(!ac){const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;
      ac=new C();out=ac.createGain();out.gain.value=.5;
      const cp=ac.createDynamicsCompressor();out.connect(cp);cp.connect(ac.destination)}
    if(ac.state==="suspended")ac.resume();
    return ac}
  function tone(f,t,o={}){
    const a=ctx();if(!a)return;
    const {dur=.5,type="sine",vol=.2,att=.005,glide=0,harm=0}=o,t0=a.currentTime+t;
    const osc=a.createOscillator(),g=a.createGain();osc.type=type;osc.frequency.setValueAtTime(f,t0);
    if(glide)osc.frequency.exponentialRampToValueAtTime(f*glide,t0+dur);
    g.gain.setValueAtTime(0,t0);g.gain.linearRampToValueAtTime(vol,t0+att);g.gain.exponentialRampToValueAtTime(.0001,t0+dur);
    osc.connect(g);g.connect(out);osc.start(t0);osc.stop(t0+dur+.05);
    if(harm){const o2=a.createOscillator(),g2=a.createGain();o2.frequency.setValueAtTime(f*harm,t0);
      g2.gain.setValueAtTime(0,t0);g2.gain.linearRampToValueAtTime(vol*.35,t0+att);g2.gain.exponentialRampToValueAtTime(.0001,t0+dur*.45);
      o2.connect(g2);g2.connect(out);o2.start(t0);o2.stop(t0+dur)}}
  function click(t,vol,f,dur){
    const a=ctx();if(!a)return;
    if(!nb){nb=a.createBuffer(1,a.sampleRate*.2,a.sampleRate);const d=nb.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1}
    const t0=a.currentTime+t,s=a.createBufferSource(),b=a.createBiquadFilter(),g=a.createGain();
    s.buffer=nb;b.type="bandpass";b.frequency.value=f;b.Q.value=1.2;
    g.gain.setValueAtTime(vol,t0);g.gain.exponentialRampToValueAtTime(.0001,t0+dur);
    s.connect(b);b.connect(g);g.connect(out);s.start(t0);s.stop(t0+dur+.02)}
  return{
    key(k){const f=P[(+k+9)%10];click(0,.12,3200,.025);tone(f,0,{dur:.6,vol:.22,harm:4})},          // ting kotak musik
    del(){tone(330,0,{dur:.14,type:"triangle",vol:.12,glide:.7})},
    wish(){[1046.5,1318.5,1568,2093].forEach((f,i)=>tone(f,i*.09,{dur:1.2,vol:.1,harm:3}));[523.25,659.25,783.99].forEach(f=>tone(f,.3,{dur:1.8,vol:.07,att:.06}))},   // pilih wish: kilau lembut                                     // tok lembut
    wrong(){tone(392,0,{dur:.25,type:"triangle",vol:.15});tone(311,.15,{dur:.45,type:"triangle",vol:.15})},
    keyFly(){for(let i=0;i<8;i++)tone(P[i+1]*(i%2?1:.5),i*.17,{dur:.45,vol:.07,harm:3})},              // kunci terbang: tinkle naik
    open(){                                                                                            // gembok terbuka
      click(0,.5,1400,.06);tone(150,0,{dur:.2,type:"triangle",vol:.3,glide:.5});                       // klik-klak logam
      click(.1,.4,2600,.05);
      [1046.5,1318.5,1568,2093,2637,3136].forEach((f,i)=>tone(f,.2+i*.07,{dur:.9,vol:.11,harm:3}));    // kilau harpa
      [523.25,659.25,783.99,1046.5].forEach(f=>tone(f,.6,{dur:2,vol:.08,att:.08}))}                    // akor hangat
  }
})();
/* ===== Layer 4: pilih satu wish ===== */
const WISHES=["Makin Bahagia","Makin Sehat","Makin Sukses","Makin betah sama aku"];   // ganti pilihan wish di sini
const TAGIMG="assets/img/tag-wish.png";
function showL4(){
  const l4=$("l4");
  l4.innerHTML='<div class="l4w"><div class="eyebrow">Satu permohonan</div><h2>Sekarang… pilih satu wish untuk tahun barumu.</h2><div class="l4msg"><div class="bx"></div></div><div class="tags"></div></div>';
  const box=l4.querySelector(".tags");
  WISHES.forEach((w,i)=>{
    const b=document.createElement("button");b.type="button";b.className="tag";b.style.setProperty("--i",i);b.setAttribute("aria-label",w);
    const card=document.createElement("div");card.className="tc";
    const im=new Image();im.alt="";im.draggable=false;im.src=TAGIMG;
    const sp=document.createElement("span");sp.textContent=w;
    card.append(im,sp);b.append(card);
    b.onclick=()=>{if(box.classList.contains("picked"))return;pickWish(i,b,box);
      /* TODO: lanjutan setelah memilih wish (Layer 5) */};
    box.append(b)});
  l4.classList.add("on");
  const tags=[...box.children];
  setTimeout(()=>tags.forEach(t=>t.classList.add("in")),1100);
  setTimeout(()=>tags.forEach(t=>t.classList.add("rdy")),1100+1200+WISHES.length*180+200);
}

/* balasan untuk tiap wish (urutannya sama dengan WISHES) — ganti kalimat di sini */
const REPLIES=[
  "Permohonanmu kuterima. Semoga pelan-pelan jadi nyata.",
  "Doa untuk sehatmu sudah terbang ke langit. Jaga dirimu terus, ya.",
  "Wish suksesmu sudah kutitipkan. Semoga setiap langkahmu dimudahkan.",
  "Yang ini kuaminkan paling kencang. Aku juga makin betah sama kamu 💗"
];
const PETAL4=["assets/img/kelopak-jatuh-1.png", "assets/img/kelopak-jatuh-2.png", "assets/img/kelopak-jatuh-3.png"];   // 3 kelopak: pink, putih, putih
/* efek Layer 4: kelopak jatuh dari atas sampai bawah + kilau bintang + percikan dari tag */
const FX4=(()=>{
  const rr=(a,b)=>a+Math.random()*(b-a),rm=matchMedia("(prefers-reduced-motion: reduce)").matches;
  const imgs=PETAL4.map(u=>{const i=new Image();i.src=u;return i});
  const gs=document.createElement("canvas");gs.width=gs.height=64;
  {const g=gs.getContext("2d"),gr=g.createRadialGradient(32,32,0,32,32,32);
    gr.addColorStop(0,"rgba(255,249,228,1)");gr.addColorStop(.18,"rgba(255,228,175,.85)");gr.addColorStop(.5,"rgba(255,200,140,.22)");gr.addColorStop(1,"rgba(255,190,130,0)");
    g.fillStyle=gr;g.fillRect(0,0,64,64)}
  let cv,x,W=0,H=0,dpr=1,raf=0,live=false,t0=0,last=0,spawn=0;
  const petals=[],sparks=[],stars=[];
  function size(){const st=document.getElementById("l3stage");W=st.clientWidth;H=st.clientHeight;dpr=Math.min(devicePixelRatio||1,2);
    cv.width=W*dpr;cv.height=H*dpr;x.setTransform(dpr,0,0,dpr,0,0)}
  function mkStars(){stars.length=0;const n=Math.round(Math.max(34,Math.min(70,W*H/21000)));
    for(let i=0;i<n;i++)stars.push({x:rr(0,W),y:rr(0,H),r:rr(.8,2.2),big:Math.random()<.14,per:rr(1.6,4.2),ph:rr(0,6.28),vy:-rr(2,7),a:rr(.5,1)})}
  function newPetal(initial){
    const k=Math.random()<.4?0:1+((Math.random()*2)|0),base=Math.max(26,Math.min(54,W*.05)),w=base*rr(.75,1.4);
    petals.push({im:imgs[k],w,x0:rr(-.03,1.03)*W,y:initial?-w-rr(0,H*.6):-w,vy:rr(55,100)*Math.sqrt(w/base),amp:rr(14,34),f:rr(.45,.85),ph:rr(0,6.28),base:rr(-.45,.45),swing:rr(.25,.5),
      vx:rr(-6,6),age:0,x:0});
  }
  function burst(px,py,n,sp){for(let i=0;i<n;i++){const an=rr(0,6.283),v=rr(20,sp);
    sparks.push({x:px,y:py,vx:Math.cos(an)*v,vy:Math.sin(an)*v-rr(0,25),life:rr(.9,1.9),age:0,s:rr(1.2,3.4),ph:rr(0,6.28)})}}
  function frame(now){
    if(!live)return;raf=requestAnimationFrame(frame);
    const dt=Math.min(.05,(now-(last||now))/1000);last=now;const t=(now-t0)/1000,gA=Math.min(1,t/1.8);
    x.clearRect(0,0,W,H);
    // kelopak: jatuh terus sampai lewat batas bawah layar, tidak memudar di tengah
    spawn-=dt;if(spawn<=0){spawn=rr(1.6,2.8)*(rm?2:1);if(petals.length<(rm?3:7))newPetal(false)}
    for(let i=petals.length-1;i>=0;i--){const p=petals[i];p.age+=dt;const sw=p.age*p.f+p.ph;
      p.y+=p.vy*(1+.18*Math.cos(sw*2))*dt;p.x0+=p.vx*dt;   // melambat sedikit di ujung ayunan
      p.x=p.x0+Math.sin(sw)*p.amp;p.rot=p.base+Math.cos(sw)*p.swing;   // mengayun kiri-kanan, miring mengikuti ayunan (tanpa berputar/membalik)
      if(p.y-p.w>H){petals.splice(i,1);continue}
      const ar=(p.im.naturalHeight/p.im.naturalWidth)||.88,h=p.w*ar;
      x.save();x.translate(p.x,p.y);x.rotate(p.rot);x.globalAlpha=.95;
      x.drawImage(p.im,-p.w/2,-h/2,p.w,h);x.restore()}
    // bintang & bercak cahaya (berkelip)
    x.globalCompositeOperation="lighter";
    for(const s of stars){s.y+=s.vy*dt;if(s.y<-8){s.y=H+8;s.x=rr(0,W)}
      const tw=rm?.7:.5+.5*Math.sin(t/s.per*6.283+s.ph),a=s.a*tw*tw*gA,g=s.r*4.5;
      x.globalAlpha=a;x.drawImage(gs,s.x-g,s.y-g,g*2,g*2);
      if(s.big){const L=s.r*5.5;x.globalAlpha=a*.9;x.fillStyle="#fff3d2";x.fillRect(s.x-L,s.y-.5,L*2,1);x.fillRect(s.x-.5,s.y-L,1,L*2)}}
    // percikan dari tag
    for(let i=sparks.length-1;i>=0;i--){const q=sparks[i];q.age+=dt;if(q.age>q.life){sparks.splice(i,1);continue}
      q.x+=q.vx*dt;q.y+=q.vy*dt;q.vx*=.985;q.vy*=.985;
      const u=q.age/q.life,a=(1-u)*(.65+.35*Math.sin(q.age*14+q.ph)),g=q.s*4;
      x.globalAlpha=Math.max(0,a);x.drawImage(gs,q.x-g,q.y-g,g*2,g*2)}
    x.globalAlpha=1;x.globalCompositeOperation="source-over";
  }
  return{
    start(){if(live)return;
      if(!cv){cv=document.createElement("canvas");cv.className="l4fx";document.getElementById("l3stage").appendChild(cv);x=cv.getContext("2d");
        size();addEventListener("resize",()=>{size();mkStars()})}
      mkStars();for(let i=0;i<(rm?2:4);i++)newPetal(true);spawn=1.2;live=true;t0=performance.now();last=0;raf=requestAnimationFrame(frame)},
    stop(){live=false;cancelAnimationFrame(raf);if(cv)x.clearRect(0,0,W,H)},
    burst
  };
})();
/* klik wish: tag menyala -> terbang ke atas & hilang -> balasan muncul; kelopak & bintang mulai */
function pickWish(i,b,box){
  box.classList.add("picked");b.classList.add("sel");SFX.wish();FX4.start();
  const c=()=>{const r=b.getBoundingClientRect();return[r.left+r.width/2,r.top+r.height/2]};
  {const[px,py]=c();FX4.burst(px,py,26,140)}
  setTimeout(()=>{
    const r=b.getBoundingClientRect(),d=r.bottom+70,tilt=(Math.random()<.5?-1:1)*(4+Math.random()*4);
    const a=b.animate([
      {transform:"translateY(0) scale(1.14) rotate(0deg)",opacity:1,easing:"cubic-bezier(.45,0,.85,.55)"},
      {transform:`translateY(${-d}px) scale(1.02) rotate(${tilt}deg)`,opacity:1,offset:.9},
      {transform:`translateY(${-d-50}px) scale(.9) rotate(${tilt*1.2}deg)`,opacity:0}
    ],{duration:1500,fill:"forwards"});
    const tr=setInterval(()=>{const[px,py]=c();FX4.burst(px,py+r.height*.25,2,45)},45);
    a.onfinish=()=>{clearInterval(tr);b.style.visibility="hidden"};
  },550);
  const m=document.querySelector("#l4 .l4msg");m.querySelector(".bx").textContent=REPLIES[i]||"";
  setTimeout(()=>m.classList.add("on"),1000);
  setTimeout(showL5,L5_DELAY);
}

/* ===== Layer 5: cerita foto (geser ke bawah) -> ditutup surat ===== */
/* Isi tiap kenangan di sini. photo = data URI ("data:image/jpeg;base64,...") atau path file ("foto/1.jpeg").
   Kalau photo dikosongkan, dipakai gambar placeholder. Jumlah slide mengikuti jumlah item (hitungan "01 · 06" otomatis). */
const MEMORIES=[
  {photo:"foto/1.jpeg",label:"Manyun andalanmu",text:"Bibir manyun begini aja bisa bikin aku senyum sendiri. Lucunya nggak dibuat-buat."},
  {photo:"foto/2.jpeg",label:"Senyumnya yang bikin tenang",text:"Senyum tipis kamu di foto ini, entah kenapa bikin semuanya terasa adem."},
  {photo:"foto/3.jpeg",label:"Bangga banget sama kamu",text:"Pakai almamater itu, kamu keliatan lagi berjuang buat sesuatu. Aku bangga lihat kamu sejauh ini."},
  {photo:"foto/4.jpeg",label:"Cerah kayak langitnya",text:"Di bawah langit seterang ini, kamu tetap yang paling bikin aku betah ngelihat."},
  {photo:"foto/5.jpeg",label:"Anggun seperti ratu",text:"Dengan pakaian adat dan mahkota emas ini kamu keliatan megah banget. Tapi senyumnya tetap kamu yang aku kenal."},
  {photo:"foto/6.jpeg",label:"Tenang dan anggun",text:"Gaun biru ini cocok banget sama kamu. Tenang, anggun, dan bikin susah berpaling."}
];
const L5_INTRO={eyebrow:"Sebuah cerita untuk kamu",text:"Aku kumpulin beberapa hal tentang kamu di sini — foto, cerita, semuanya. Geser pelan, ya.",cue:"Geser untuk mulai"};
const L5_LETTER={head:"Yang mau aku bilang",paras:[
  "Tiap ketemu kamu, kata-kataku selalu hilang entah ke mana, jadi aku tulis aja di sini.",
  "Makasih ya, Baby, udah hadir dan bikin hari-hariku terasa tenang. Aku bangga banget sama kamu, dan kalau kamu capek, kamu boleh bersandar. Kamu nggak harus kuat sendirian.",
  "Apa pun yang terjadi besok, aku masih mau jatuh sayang sama kamu lagi dan lagi."]};
const L5_END={title:"Itu semua tentang kamu.",sub:"Selamat ulang tahun, Sayangku 💗",again:"Baca dari awal ↑"};
const L5_TILT=40;   // sudut miring (derajat) saat foto masuk/keluar layar; 0 = tidak miring
const L5_DELAY=6500;   // jeda (ms) dari klik wish sampai pindah ke Layer 5
function l5ph(i){
  const P=[["#f6c6c0","#e9948f"],["#fbe3cf","#f0b9a0"],["#e8c9e0","#c993b8"],["#fce9d9","#f3c9a5"],["#f2d0d8","#d9899f"],["#f7e4e0","#e5aaa6"]][i%6];
  const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 240"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="'+P[0]+'"/><stop offset="1" stop-color="'+P[1]+'"/></linearGradient></defs><rect width="200" height="240" fill="url(#g)"/><path d="M100 170C40 128 52 82 84 86C94 88 100 96 100 102C100 96 106 88 116 86C148 82 160 128 100 170Z" fill="rgba(255,255,255,.55)"/></svg>';
  return "data:image/svg+xml,"+encodeURIComponent(svg);
}
function showL5(){
  const st=document.getElementById("l3stage"),l4=document.getElementById("l4");
  l4.classList.remove("on");setTimeout(()=>{l4.style.display="none"},1800);
  const n=MEMORIES.length,pad=v=>String(v).padStart(2,"0"),esc=s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;");
  const l5=document.createElement("div");l5.className="l5";l5.id="l5";l5.tabIndex=0;
  const slides=MEMORIES.map((m,k)=>'<section class="sl"><div class="fw"><div class="fr" data-rz="'+(k%2?1.6:-1.6)+'"><div class="pic"><img src="'+(m.photo||l5ph(k))+'" alt="" draggable="false"></div></div></div>'+
    '<div class="cnt">'+pad(k+1)+' · '+pad(n)+'</div><i class="ln"></i><div class="lb">'+esc(m.label)+'</div><p class="tx">'+esc(m.text)+'</p></section>').join("");
  l5.innerHTML='<div class="l5w">'+
    '<header class="intro"><i class="cn l"></i><i class="cn r"></i><div class="eb rv">'+esc(L5_INTRO.eyebrow)+'</div><i class="dv rv"></i><p class="it rv">'+esc(L5_INTRO.text)+'</p><span class="gs rv">'+esc(L5_INTRO.cue)+' <b>↓</b></span></header>'+
    slides+
    '<article class="ltr"><div class="paper"><h4>'+esc(L5_LETTER.head)+'</h4>'+L5_LETTER.paras.map(t=>'<p>'+esc(t)+'</p>').join("")+'</div></article>'+
    '<footer class="fin"><div class="bq"></div><h2>'+esc(L5_END.title)+'</h2><p>'+esc(L5_END.sub)+'</p><button type="button" class="again">'+esc(L5_END.again)+'</button></footer></div>';
  st.appendChild(l5);
  // foto miring 3D mengikuti posisi saat digeser (masuk dari bawah / keluar ke atas)
  const frs=[...l5.querySelectorAll(".fr")],rm=matchMedia("(prefers-reduced-motion: reduce)").matches;let tk=0;
  function upd(){tk=0;const b=l5.getBoundingClientRect(),vh=b.height,mid=b.top+vh/2;
    frs.forEach(f=>{const w=f.parentElement,r=w.getBoundingClientRect(),d=Math.max(-1.3,Math.min(1.3,((r.top+r.height/2)-mid)/(vh*.55))),a=Math.min(1,Math.abs(d)),e=a*a*(3-2*a);
      const rz=parseFloat(f.dataset.rz)*(1+e*4.5),ty=rm?0:d*vh*.07,sc=1-e*.16,op=1-Math.max(0,Math.min(1,(a-.55)/.6))*.75;
      f.style.transform='translateY('+ty.toFixed(1)+'px) perspective(900px) rotateZ('+rz.toFixed(2)+'deg) rotateX('+(rm?0:d*L5_TILT).toFixed(2)+'deg) scale('+sc.toFixed(3)+')';
      f.style.opacity=op.toFixed(3);w.style.setProperty("--g",(1-e).toFixed(3));
      const im=f.firstChild.firstChild;if(im&&!rm)im.style.transform='translateY('+(d*-5).toFixed(2)+'%) scale(1.14)'});
    l5.classList.toggle("sc",l5.scrollTop>40)}
  l5.addEventListener("scroll",()=>{if(!tk)tk=requestAnimationFrame(upd)},{passive:true});
  addEventListener("resize",upd);upd();
  // teks, surat, dan penutup muncul saat masuk layar
  const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target)}}),{root:l5,threshold:.2,rootMargin:"0px 0px -6% 0px"});
  l5.querySelectorAll(".sl,.ltr,.fin").forEach(el=>io.observe(el));
  l5.querySelector(".again").onclick=()=>l5.scrollTo({top:0,behavior:rm?"auto":"smooth"});
  void l5.offsetWidth;setTimeout(()=>{l5.classList.add("on");l5.focus({preventScroll:true})},1400);
}
function render(){dots.forEach((d,i)=>d.classList.toggle("on",i<val.length))}
function press(k){BGM.prime();if(busy)return;
  if(k==="⌫"){val=val.slice(0,-1);render();SFX.del();return}
  if(val.length>=4)return;
  val+=k;render();SFX.key(k);
  if(val.length===4){
    setTimeout(()=>{
      if(val===CODE){unlock()}
      else{const d=document.getElementById("dots");SFX.wrong();d.classList.add("shake");msg.textContent="yah, belum tepat. kodenya 1310";
        setTimeout(()=>{d.classList.remove("shake");val="";render()},450)}
    },200);
  }
}
let busy=false;
const $=id=>document.getElementById(id),fx=$("fx");
const R=(a,b)=>a+Math.random()*(b-a);
const COL=["#e8798f","#d94a62","#f4a5b4","#fbd3da","#b3263a","#fff0e8"];
function petal(c){return `<svg viewBox="0 0 20 32" width="100%" height="100%"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c}"/><stop offset="1" stop-color="#fff" stop-opacity=".55"/></linearGradient></defs><path d="M10 0C19 7 21 20 10 31 -1 20 1 7 10 0Z" fill="${c}"/><path d="M10 3C14 10 14 20 10 28" stroke="#fff" stroke-opacity=".35" fill="none"/></svg>`}
function bloom(c){let s='';for(let i=0;i<5;i++)s+=`<g transform="rotate(${i*72} 30 30)"><path d="M30 30C20 22 22 6 30 3 38 6 40 22 30 30Z" fill="${c}" stroke="#fff" stroke-opacity=".4"/></g>`;return `<svg viewBox="0 0 60 60" width="100%" height="100%">${s}<circle cx="30" cy="30" r="4.5" fill="#f2c14e"/></svg>`}
function add(cls,css,html){const e=document.createElement("div");if(cls)e.className=cls;Object.assign(e.style,css);if(html)e.innerHTML=html;fx.appendChild(e);return e}
function unlock(){
  if(busy)return;busy=true;SFX.keyFly();$("card").classList.add("done");
  const lock=$("lock"),kw=$("kw"),key=$("key");
  const lr=lock.getBoundingClientRect(),kr=kw.getBoundingClientRect();
  const hx=lr.left+lr.width*.45,hy=lr.top+lr.height*.54;
  const kcx=kr.left+kr.width/2,kcy=kr.top+kr.height/2;
  const dx=hx+kr.height*.3-kcx,dy=hy-kcy;
  key.style.animation="none";
  const a=kw.animate([{transform:"none"},{transform:`translate(${dx*.4}px,${dy-30}px) rotate(40deg)`,offset:.45},{transform:`translate(${dx}px,${dy}px) rotate(90deg) scale(.85)`,offset:.8},{transform:`translate(${dx}px,${dy}px) rotate(150deg) scale(.85)`}],{duration:1500,easing:"ease-in-out",fill:"forwards"});
  a.onfinish=()=>{kw.animate([{opacity:1},{opacity:0}],{duration:200,fill:"forwards"});boom(hx,hy,lr)};
}
function boom(x,y,lr){SFX.open();
  lock.animate([{transform:"translateX(-50%) scale(1)"},{transform:"translateX(-50%) scale(1.1) rotate(-3deg)",offset:.3},{transform:"translateX(-50%) scale(1)"}],{duration:600,easing:"ease-out"});
  add("glow",{left:x-120+"px",top:y-120+"px",width:"240px",height:"240px"}).animate([{transform:"scale(.2)",opacity:1},{transform:"scale(2.4)",opacity:0}],{duration:900,easing:"ease-out",fill:"forwards"});
  [0,160].forEach(d=>add("ring",{left:x-30+"px",top:y-30+"px",width:"60px",height:"60px"}).animate([{transform:"scale(.2)",opacity:1},{transform:"scale(5)",opacity:0}],{duration:900,delay:d,easing:"ease-out",fill:"both"}));
  for(let i=0;i<18;i++){const ang=Math.random()*6.28,d=R(70,190);
    add("",{left:x+"px",top:y+"px",width:"7px",height:"7px",borderRadius:"50%",background:"#ffd98a",boxShadow:"0 0 8px #ffc65a"}).animate([{transform:"translate(0,0) scale(1)",opacity:1},{transform:`translate(${Math.cos(ang)*d}px,${Math.sin(ang)*d}px) scale(0)`,opacity:0}],{duration:R(600,1000),easing:"ease-out",fill:"forwards"})}
  for(let i=0;i<14;i++){
    const sz=R(18,32),ang=R(-3.14,0)+R(-.6,.6),d=R(80,240),px=Math.cos(ang)*d,py=Math.sin(ang)*d*.8;
    const e=add("",{left:x-sz/2+"px",top:y-sz/2+"px",width:sz+"px",height:sz*.95+"px"});
    const m=new Image();m.src=PT[i%2];m.style.cssText="display:block;width:100%;height:100%";e.appendChild(m);
    const rot=R(-220,220),fall=R(100,260);
    e.animate([{transform:"translate(0,0) scale(.3) rotate(0)",opacity:0},
      {transform:`translate(${px}px,${py}px) scale(1) rotate(${rot*.4}deg)`,opacity:.8,offset:.3},
      {transform:`translate(${px*1.2+R(-30,30)}px,${py+fall}px) scale(.95) rotate(${rot}deg)`,opacity:.6,offset:.8},
      {transform:`translate(${px*1.3}px,${py+fall+30}px) rotate(${rot}deg)`,opacity:0}],{duration:R(3000,4200),easing:"cubic-bezier(.25,.6,.3,1)",fill:"forwards"})}
  setTimeout(bloomSeq,1300);
}

/* ===== Layer 2: teka-teki ===== */
const ANSWERS=["cinta","kasih sayang","kebahagiaan","bahagia"]; // ganti jawaban benar di sini (huruf kecil)
const HINT="petunjuk: perasaan yang ada di antara kita 💭"; // ganti petunjuk di sini
const ans=$("ans"),l2box=$("l2box"),hint=$("hint");
function check(){
  const v=ans.value.trim().toLowerCase();
  if(ANSWERS.includes(v)){l2box.style.display="none";$("l3").style.display="block";return}
  l2box.classList.add("shake");hint.textContent="hmm, belum tepat. coba lagi yaa";
  setTimeout(()=>l2box.classList.remove("shake"),450);
}
$("go").onclick=check;
ans.addEventListener("keydown",e=>{if(e.key==="Enter")check()});
$("hbtn").onclick=()=>{hint.textContent=HINT};

/* ===== Bunga & efek bloom sebelum Layer 2 ===== */
const FL={daisy:"assets/img/bunga-daisy.webp",anemone:"assets/img/bunga-anemone.webp",dahlia:"assets/img/bunga-dahlia.webp",ranun:"assets/img/bunga-ranun.webp"};
const PICK=["daisy","ranun","daisy","dahlia","anemone","ranun","daisy","dahlia","anemone","ranun"];
const PT=["assets/img/kelopak-lepas-1.png","assets/img/kelopak-lepas-2.png"];
const PTI=PT.map(u=>{const i=new Image();i.src=u;return i});
/* kelopak rontok tertiup angin dari bunga o (animasi awal) */
function shed(o,ux,uy){
  const r=o.getBoundingClientRect();if(r.right<0||r.left>innerWidth||r.bottom<0||r.top>innerHeight)return;
  const sz=r.width*R(.17,.27),e=add("",{left:r.left+r.width/2-sz/2+R(-.2,.2)*r.width+"px",top:r.top+r.height/2-sz/2+R(-.2,.2)*r.height+"px",width:sz+"px",height:sz*.95+"px",opacity:"0"});
  const m=new Image();m.src=PT[(Math.random()*2)|0];m.style.cssText="display:block;width:100%;height:100%";e.appendChild(m);
  // jatuh terus sampai lewat batas bawah layar (tidak memudar di tengah), mengayun kiri-kanan seperti kelopak sungguhan
  const top0=e.getBoundingClientRect().top,dy=innerHeight-top0+sz*2,dx=R(-70,170),amp=R(18,40),sw=R(1.6,2.8),ph=R(0,6.28),rot=R(-200,200),dur=Math.max(3200,dy/R(170,240)*1000),N=14,kf=[];
  for(let k=0;k<=N;k++){const t=k/N,y=dy*Math.pow(t,1.12),x=dx*t+Math.sin(ph+t*sw*Math.PI*2)*amp*Math.min(1,t*4);
    kf.push({transform:`translate(${x.toFixed(1)}px,${y.toFixed(1)}px) rotate(${(rot*t+Math.cos(ph+t*sw*Math.PI*2)*22).toFixed(1)}deg)`,opacity:t<.06?t/.06:1,offset:t})}
  e.animate(kf,{duration:dur,easing:"linear",fill:"forwards"});
  setTimeout(()=>e.remove(),dur+80)}
function mk(i){const m=new Image();m.src=FL[PICK[i%PICK.length]];m.draggable=false;m.style.cssText="display:block;width:100%;height:100%";return m}
function bloomSeq(){
  const W=innerWidth,H=innerHeight,base=Math.max(135,Math.min(290,Math.min(W,H)*.37)),s=base*.5;
  const cols=Math.ceil(W/s)+1,rows=Math.ceil(H/s)+1,list=[];
  for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
    const cx=c/(cols-1)*(W+.2*s)-.1*s+R(-.25,.25)*s,cy=r/(rows-1)*(H+.2*s)-.1*s+R(-.25,.25)*s;
    list.push({cx,cy,size:base*R(1.05,1.35),p:.6*cx/W+.4*(1-cy/H)});
  }
  const lo=Math.min(...list.map(f=>f.p)),hi=Math.max(...list.map(f=>f.p));
  list.forEach(f=>f.p=(f.p-lo)/(hi-lo));
  list.sort(()=>Math.random()-.5);
  const ENTER=1300,DUR=1100,HOLD=1700,SPREAD=1400,OUT=1200,diag=Math.hypot(W,H),ux=W/diag,uy=-H/diag;
  list.forEach((f,i)=>{
    const o=add("",{left:f.cx-f.size/2+"px",top:f.cy-f.size/2+"px",width:f.size+"px",height:f.size+"px",opacity:"0"});
    const img=mk(i),rot=R(-25,25);o.appendChild(img);
    if(Math.random()<.2)setTimeout(()=>shed(o,ux,uy),f.p*ENTER+DUR*.55);
    // mengambang pelan
    img.animate([{transform:`translate(${R(-6,6)}px,${R(4,10)}px) rotate(${-R(6,10)}deg) scale(.98)`},{transform:`translate(${R(-18,18)}px,${-R(14,26)}px) rotate(${R(6,10)}deg) scale(1.04)`}],{duration:R(1500,2500),direction:"alternate",iterations:Infinity,easing:"ease-in-out",delay:-R(0,2500)});
    // masuk: ditiup angin dari pojok kiri bawah ke posisinya, yang dekat pojok kiri bawah tiba duluan
    const din=diag+f.size*1.5+R(0,100),sx=-ux*din,sy=-uy*din,wi=R(30,80)*(Math.random()<.5?-1:1);
    o.animate([{transform:`translate(${sx}px,${sy}px) scale(.9) rotate(${rot-R(250,420)}deg)`,opacity:1},
      {transform:`translate(${sx*.45-uy*wi}px,${sy*.45+ux*wi}px) scale(.95) rotate(${rot-R(80,160)}deg)`,opacity:1,offset:.5},
      {transform:`translate(0,0) scale(1) rotate(${rot}deg)`,opacity:1}],
      {duration:DUR+R(0,300),delay:f.p*ENTER+R(0,150),easing:"cubic-bezier(.2,.65,.25,1)",fill:"both"});
    // keluar: ditiup angin ke pojok kanan atas, yang paling kanan atas duluan
    setTimeout(()=>{
      const dist=diag+f.size*1.5+R(0,100),px=ux*dist,py=uy*dist,wob=R(30,80)*(Math.random()<.5?-1:1);
      o.animate([{transform:`translate(0,0) scale(1) rotate(${rot}deg)`,opacity:1},
        {transform:`translate(${px*.45-uy*wob}px,${py*.45+ux*wob}px) scale(.95) rotate(${rot+R(80,160)}deg)`,opacity:1,offset:.5},
        {transform:`translate(${px}px,${py}px) scale(.8) rotate(${rot+R(220,420)}deg)`,opacity:1}],
        {duration:OUT+R(0,300),delay:(1-f.p)*SPREAD+R(0,150),easing:"cubic-bezier(.5,0,.85,.5)",fill:"forwards"});
    },ENTER+DUR+HOLD);
  });
  setTimeout(()=>$("l2").classList.add("show"),ENTER+DUR+550);setTimeout(l2Intro,ENTER+DUR+HOLD+SPREAD+OUT*.5);   // Layer 2 sudah siap di balik bunga
  setTimeout(()=>fx.replaceChildren(),ENTER+DUR+HOLD+SPREAD+OUT+2600);   // diberi jeda lebih lama supaya kelopak yang jatuh pelan tidak terpotong
}

/* ===== Layer 2 baru: buku -> cahaya -> bunga -> tirai -> Layer 3 ===== */
let l2ready=false,l2opened=false;
function l2Intro(){BGM.play();
  const W=Math.min(innerWidth*.64,300);
  $("l2fit").style.setProperty("--fit",Math.min(1,innerWidth*.94/(W*1.9)).toFixed(3));
  // 1) background polos sudah tampil -> 2) cahaya lembut dari tengah
  $("sglow").animate([{opacity:0,transform:"scale(.4)"},{opacity:1,transform:"scale(1)"}],{duration:1600,delay:500,easing:"ease-out",fill:"forwards"});
  // 3) buku muncul dari tengah
  $("l2enter").animate([{opacity:0,transform:"scale(.12)"},{opacity:1,transform:"scale(1)"}],{duration:1400,delay:1100,easing:"cubic-bezier(.2,.8,.25,1)",fill:"forwards"});
  // 4) teks di bawah buku
  $("l2hint").animate([{opacity:0},{opacity:1}],{duration:900,delay:2400,fill:"forwards"}).onfinish=()=>{$("l2hint").classList.add("pulse");l2ready=true};
}
function openBook(){
  if(!l2ready||l2opened)return;l2opened=true;
  $("l2fit").classList.add("open");$("l2float").classList.add("stop");
  $("l2hint").animate([{opacity:1},{opacity:0}],{duration:400,fill:"forwards"});
  // cahaya putih dari tengah, bersamaan dengan buku terbuka
  $("sflash").animate([
    {opacity:0,transform:"scale(0)",offset:0},
    {opacity:1,transform:"scale(2)",offset:.2},
    {opacity:1,transform:"scale(6)",offset:.45},
    {opacity:1,transform:"scale(6.5)",offset:.55},
    {opacity:0,transform:"scale(7)",offset:1}],{duration:3000,easing:"ease-in-out",fill:"forwards"});
  setTimeout(()=>{$("sglow").style.opacity=0},1450);
  setTimeout(l2Flowers,1500);
}
{const en=$("l2enter"),ht=$("l2hint");
  en.addEventListener("click",openBook);ht.addEventListener("click",openBook);
  en.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();openBook()}});}
const SEC=12,RB=[0,.34,.66,1.02],SN=256;
const ez=x=>x<=0?0:x>=1?1:1-Math.pow(1-x,3);
async function loadSprites(){
  const T={};
  for(const k in FL){
    const im=new Image();im.src=FL[k];await im.decode();
    const pcs=[];
    for(let r=0;r<3;r++)for(let j=0;j<SEC;j++){
      const c=document.createElement("canvas");c.width=c.height=SN;const x=c.getContext("2d"),h=SN/2;
      const a0=j/SEC*6.2832-.03,a1=(j+1)/SEC*6.2832+.03;
      x.beginPath();x.arc(h,h,RB[r+1]*h,a0,a1);x.arc(h,h,Math.max(0,RB[r]*h-1.5),a1,a0,true);x.closePath();x.clip();
      x.drawImage(im,0,0,SN,SN);pcs.push(c);
    }
    T[k]={im,pcs};
  }
  return T;
}
// gambar satu bunga; p = 0 (kuncup) .. 1 (mekar penuh). Kelopak per-irisan & per-lapisan membuka bergiliran dari tengah.
function drawFlower(x,T,cx,cy,size,p,rot,al){
  const sc=size/SN;x.save();x.translate(cx,cy);x.rotate(rot);x.scale(sc,sc);
  if(p>=1){x.globalAlpha=al;x.drawImage(T.im,-SN/2,-SN/2,SN,SN);x.restore();return}
  for(let r=2;r>=0;r--)for(let j=0;j<SEC;j++){
    const o=ez((p-[0,.22,.42][r]-(j%3)*.04)/.5);if(o<=0&&r>0)continue;
    const th=(j+.5)/SEC*6.2832,k=.1+.9*o;
    x.save();x.globalAlpha=al*(.3+.7*Math.min(1,o*2.2));
    x.rotate(-(1-o)*.7*r);                 // kelopak luar berputar saat membuka
    x.rotate(th);x.scale(k,1+.08*(1-o));x.rotate(-th);
    x.drawImage(T.pcs[r*SEC+j],-SN/2,-SN/2);x.restore();
  }
  x.restore();
}
/* buku "kedut" ke dalam tiap bunga menyembur keluar: terdorong masuk (mengecil & menggelap), lalu membal pelan. Detak terakhir paling kuat (gelombang besar) */
function bookPop(KED){
  if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;
  const b=$("l2float"),r=b.getBoundingClientRect();
  b.style.transformOrigin=(innerWidth/2-r.left)+"px "+(innerHeight/2-r.top)+"px";   // berporos di tengah buku yang terbuka
  KED.forEach((d,k)=>{const last=k===KED.length-1,sc=last?.89:.935+k*.008;
    b.animate([
      {transform:"scale(1)",filter:"brightness(1)"},
      {transform:`scale(${sc})`,filter:`brightness(${last?.72:.8})`,offset:.2,easing:"ease-out"},
      {transform:`scale(${(1+(1-sc)*.4).toFixed(3)})`,filter:"brightness(1.22)",offset:.52,easing:"ease-in-out"},
      {transform:"scale(1)",filter:"brightness(1)"}],{duration:last?950:560,delay:d,easing:"ease-in-out"})});
}
async function l2Flowers(){
  const field=$("field"),W=innerWidth,H=innerHeight,dpr=Math.min(devicePixelRatio||1,2);
  const cv=document.createElement("canvas");cv.width=W*dpr;cv.height=H*dpr;field.append(cv);
  const x=cv.getContext("2d");x.scale(dpr,dpr);
  const T=await loadSprites(),names=Object.keys(FL),cx=W/2,cy=H/2;
  const D=Math.min(W*.92,H*.98),Rc=D/2,NB=34,L=[];
  const FS=2800,FW=1900,FD=1500,KED=[250,700,1150,1600,FS];   // FS/FW/FD: awal, rentang, durasi gelombang bunga latar; KED: detak "kedut" buku
  const bk=u=>{const c1=2.2,c3=c1+1,v=u-1;return u<=0?0:u>=1?1:1+c3*v*v*v+c1*v*v};   // melampaui lalu mengendap (easeOutBack)
  for(let i=0;i<NB;i++){const r=Rc*.88*Math.sqrt((i+.5)/NB),an=i*2.4;
    L.push({T:T[names[i%4]],bq:1,px:cx+Math.cos(an)*r,py:cy+Math.sin(an)*r*.92,size:Rc*R(.44,.6),rot:R(-.6,.6),spin:R(-2.8,2.8),a:250+i*45})}
  const base=Math.max(135,Math.min(265,Math.min(W,H)*.37)),sp=base*.6,cols=Math.ceil(W/sp)+1,rows=Math.ceil(H/sp)+1,md=Math.hypot(W/2,H/2);
  for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
    const px=c/(cols-1)*(W+.2*sp)-.1*sp+R(-.25,.25)*sp,py=r/(rows-1)*(H+.2*sp)-.1*sp+R(-.25,.25)*sp,d=Math.hypot(px-cx,py-cy);
    L.push({T:T[names[(Math.random()*4)|0]],bq:0,px,py,size:base*R(.95,1.25),rot:R(-.5,.5),spin:R(-1.6,1.6),a:FS+d/md*FW});
  }
  L.sort((p,q)=>(p.a-(p.bq?1e5:0))-(q.a-(q.bq?1e5:0)));
  const pet=[...Array(7)].map((_,i)=>({an:i*.9+R(0,.5),d:Rc*R(.95,1.2),s:R(20,30),ph:R(0,6),k:i%2}));
  const gs=document.createElement("canvas");gs.width=gs.height=64;
  {const g=gs.getContext("2d"),gr=g.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,"rgba(255,251,238,1)");gr.addColorStop(.25,"rgba(255,216,172,.8)");gr.addColorStop(.6,"rgba(255,170,160,.22)");gr.addColorStop(1,"rgba(255,170,160,0)");g.fillStyle=gr;g.fillRect(0,0,64,64)}
  const t0=performance.now(),END=FS+FW+FD+500,OPEN=3600,sparks=[];let sw=0,pets=[],ki=0;bookPop(KED);
  (function frame(now){
    const t=now-t0;x.clearRect(0,0,W,H);
    // tiap detak kedut: cahaya hangat dari buku + percikan menyembur ke segala arah
    while(ki<KED.length&&t>=KED[ki]){const big=ki===KED.length-1,n=big?44:20;
      for(let i=0;i<n;i++){const an=R(0,6.283),v=R(.25,big?1.1:.75)*Math.max(.6,Math.min(W,H)/700);sparks.push({vx:Math.cos(an)*v,vy:Math.sin(an)*v*.9,t:t,life:R(900,1700),s:R(9,big?30:22)})}ki++}
    {let gl=0;for(const k of KED)if(t>=k)gl+=Math.exp(-(t-k)/380);gl=Math.min(1.3,gl);
      if(gl>.02){const R0=Rc*(.5+.28*gl);x.save();x.globalCompositeOperation="lighter";x.globalAlpha=Math.min(.75,gl*.5);x.drawImage(gs,cx-R0,cy-R0,R0*2,R0*2);x.restore()}}
    if(t>END&&!sw){sw=1;const l2=$("l2"),L=$("l3s");L.style.setProperty("background",getComputedStyle(l2).background,"important");document.querySelector("#l2 .stage").style.display="none";$("sglow").style.display=$("sflash").style.display="none";L.classList.add("show");l2.style.background="transparent"}
    for(const f of L){
      let p,sz,px,py,al=1;
      if(f.bq){if(t<f.a)continue;const u=Math.min(1,(t-f.a)/1250),e1=ez(u),eb=bk(u);   // menyembur dari buku: melesat melampaui tujuan, berputar, lalu mengendap
        p=e1;sz=f.size*(.12+.88*eb);px=cx+(f.px-cx)*eb;py=cy+(f.py-cy)*eb;al=Math.min(1,u*6)}
      else{const u=(t-f.a)/FD;if(u<=0)continue;const e=ez(u),eb=bk(u);   // gelombang kejut: bunga latar menyebar dari tengah ke tepi layar
        p=Math.min(1,e*1.25);sz=f.size*(.2+.8*eb);px=cx+(f.px-cx)*(.08+.92*eb);py=cy+(f.py-cy)*(.08+.92*eb);al=Math.min(1,u*5)}
      let rt=f.rot+f.spin*(1-ez((t-f.a)/(f.bq?1250:FD)));
      // mengambang halus: amplitudo naik pelan-pelan (tanpa lompatan) sejak bunga mulai muncul, lanjut sampai bunga bergeser keluar
      if(f.ph===undefined){f.ph=R(0,6.283);f.ph2=R(0,6.283);f.per=R(2600,4200);f.amp=f.size*R(.035,.06)}
      {const u0=Math.min(1,Math.max(0,(t-f.a)/((f.bq?1250:FD)+900))),g=u0*u0*(3-2*u0);
        px+=Math.sin(t/f.per+f.ph)*f.amp*g;py+=Math.cos(t/(f.per*1.3)+f.ph2)*f.amp*1.2*g;rt+=Math.sin(t/(f.per*1.1)+f.ph)*.05*g}
      if(t>END){ // pembukaan: tiap bunga tetap utuh, bergeser dari tengah ke samping
        const dx=f.px-cx,dir=f.dir||(f.dir=dx<0?-1:dx>0?1:(Math.random()<.5?-1:1)),u=(t-END-Math.abs(dx)/(W/2)*500)/1900,e=u<=0?0:u>=1?1:u*u*(3-2*u);
        if(e>=1)continue;
        px+=dir*(dir>0?W-px+sz:px+sz)*e;py+=Math.sin(f.rot*9)*40*e;rt+=dir*e*1.4;
        if(f.sh===undefined)f.sh=Math.random()<.25?END+Math.abs(dx)/(W/2)*500+R(250,1000):0;
        if(f.sh&&t>=f.sh){f.sh=0;pets.push({x:px,y:py,vx:dir*R(.1,.24),vy:R(-.04,.02),r:R(0,6),vr:R(-.0012,.0012),s:sz*R(.2,.3),i:(Math.random()*2)|0,t:t,ph:R(0,6),life:R(2800,3600)})}}
      drawFlower(x,f.T,px,py,sz,p,rt,al);
    }
    // percikan cahaya + cincin gelombang
    x.save();x.globalCompositeOperation="lighter";
    for(let k=sparks.length-1;k>=0;k--){const q=sparks[k],a=t-q.t;if(a>q.life){sparks.splice(k,1);continue}
      const d=450*(1-Math.exp(-a/480)),u=a/q.life,al2=Math.pow(1-u,1.4)*(.7+.3*Math.sin(a/70+k)),g=q.s*(1-u*.4);
      x.globalAlpha=Math.max(0,al2);x.drawImage(gs,cx+q.vx*d-g,cy+q.vy*d-g,g*2,g*2)}
    for(let k=0;k<KED.length;k++){const a=t-KED[k],big=k===KED.length-1,dur=big?FW:800;if(a<0||a>dur)continue;
      const u=a/dur,rad=big?Math.hypot(W/2,H/2)*u:Rc*(.25+.75*ez(u));
      x.globalAlpha=(big?.8:.5)*(1-u);x.lineWidth=(big?7:4)*(1-u)+1;x.strokeStyle="rgba(255,226,196,1)";x.beginPath();x.arc(cx,cy,rad,0,6.2832);x.stroke()}
    x.restore();
    for(let k=pets.length-1;k>=0;k--){const q=pets[k],a=t-q.t;if(a>q.life){pets.splice(k,1);continue}
      x.save();x.globalAlpha=.7*Math.min(1,a/400)*(1-(a/q.life)**2);
      x.translate(q.x+q.vx*a,q.y+q.vy*a+.00002*a*a+Math.sin(a/420+q.ph)*8);x.rotate(q.r+q.vr*a+Math.sin(a/500+q.ph)*.25);
      x.drawImage(PTI[q.i],-q.s/2,-q.s/2,q.s,q.s*.95);x.restore()}
    // kelopak lepas melayang (seperti Gambar 1), memudar saat bunga mekar
    const pa=ez((t-700)/600)*(1-ez((t-2400)/700));
    if(pa>.01)for(const q of pet){const a=q.an+Math.sin(t/1800+q.ph)*.05,dy=Math.sin(t/1200+q.ph)*10;
      x.save();x.globalAlpha=pa*.85;x.translate(cx+Math.cos(a)*q.d*1.05,cy+Math.sin(a)*q.d*.95+dy);x.rotate(a+t/2500);
      x.drawImage(PTI[q.k],-q.s*1.1,-q.s*1.05,q.s*2.2,q.s*2.1);x.restore()}
    if(t<END+OPEN)requestAnimationFrame(frame);else{field.replaceChildren();$("l2").classList.remove("show")}
  })(t0);
}
function curtain(){
  const field=$("field"),cur=$("curtain"),L=$("l3s");
  ["l","r"].forEach(side=>{
    const h=document.createElement("div");h.className="half "+side;
    const src=field.querySelector("canvas"),c=document.createElement("canvas");c.width=src.width;c.height=src.height;c.style.cssText="position:absolute;inset:0;width:100%;height:100%";c.getContext("2d").drawImage(src,0,0);
    h.append(c);
    const fo=document.createElement("div");fo.className="fold";h.append(fo);
    const ed=document.createElement("div");ed.className="edge";h.append(ed);
    cur.append(h);
  });
  L.classList.add("show");                          // Layer 3 sudah siap di balik tirai
  $("l2").classList.remove("show");
  const hs=[...cur.children];
  hs.forEach((h,i)=>h.animate([{transform:"translateX(0)"},{transform:`translateX(${i?56:-56}%)`}],{duration:2000,delay:i*60,easing:"cubic-bezier(.65,0,.25,1)",fill:"forwards"}));
  setTimeout(()=>{cur.replaceChildren();field.replaceChildren()},2300);
}

/* ===== Layer 3: kue + lilin ===== */
{
  const L=$("l3s"),st=$("l3stage"),cw=$("cakewrap"),cf=$("cflame"),mt=$("mt"),mf=$("mflame"),
        glow=$("cglow"),warm=$("l3warm"),ring=$("ring"),rpg=$("rpg"),hit=$("chit"),smoke=$("smoke");
  const T=[$("l3t1"),$("l3t2"),$("l3t3")],HOLD=3000,dim=$("l3dim"),endEl=$("l3end"),END_LINES=["Apinya padam…","Tapi rasaku ke kamu tak ikut padam","Selamat ulang tahun, sayangku Dhini"];  // ganti kata penutup di END_LINES   // HOLD = lama menahan (ms)
  let started=false,armed=false,done=false,hold=false,p=0,raf=0,last=0;
  const show=(el,ms)=>setTimeout(()=>el.classList.add("in"),ms);
  function sequence(){
    const w=cw.offsetWidth;
    mt.animate([{opacity:0,transform:`translate(${-.55*w}px,${-.14*w}px)`},{opacity:1,transform:"translate(0,0)"}],{duration:1000,easing:"cubic-bezier(.2,.7,.2,1)",fill:"forwards"});
    setTimeout(()=>mf.classList.add("on"),950);                         // korek menyala
    setTimeout(()=>{cf.classList.add("on");glow.classList.add("on");warm.classList.add("on");st.classList.add("lit")},1750);   // lilin menyala -> layar terang bertahap   // lilin menyala
    setTimeout(()=>{
      mf.classList.remove("on");
      mt.animate([{opacity:1,transform:"translate(0,0)"},{opacity:0,transform:`translate(${-.45*w}px,${-.2*w}px)`}],{duration:900,easing:"ease-in",fill:"forwards"});
    },2300);
    show(T[0],2600);show(T[1],3200);show(T[2],3900);
    setTimeout(()=>{ring.classList.add("on");hit.classList.add("on");armed=true},3600);
  }
  function setP(v){const e=Math.pow(v,2.4);   // cincin: lambat di awal, makin cepat di akhir
    cw.style.setProperty("--p",v.toFixed(3));rpg.style.strokeDashoffset=(100*(1-e)).toFixed(2);rpg.style.opacity=v>.005?1:0;st.style.setProperty("--z",v.toFixed(3));   // kue membesar bertahap
    
    if(!done)dim.style.opacity=(.62*Math.pow(v,1.5)).toFixed(3)}   // makin mau padam, makin gelap
  function tick(now){
    const dt=Math.min(50,now-(last||now));last=now;
    p=hold?Math.min(1,p+dt/HOLD):Math.max(0,p-dt/500);
    setP(p);
    if(p>=1&&!done){extinguish();return}
    if(hold||p>0)raf=requestAnimationFrame(tick);else{raf=0;last=0}
  }
  // pemberitahuan lucu kalau dilepas sebelum lilin padam (urutan diacak, tidak ada yang berulang sampai semuanya keluar)
  const MSGS=["Yah, nafasnya kurang panjang 😮‍💨","Hampir! Tahan sedikit lebih lama 🥺","Jangan dilepas dulu, apinya bandel 🔥","Tarik napas dalam-dalam, coba lagi 🌬️","Tahan terus, lilinnya masih nyala 🕯️","Sabar ya, tiup pelan tapi pasti 😚"];
  const toast=$("l3toast");let bag=[],lastMsg=-1,toastTm=0;
  function nextMsg(){
    if(!bag.length){bag=MSGS.map((_,i)=>i).sort(()=>Math.random()-.5);if(bag[bag.length-1]===lastMsg)bag.unshift(bag.pop())}  // yang diambil berikutnya (ujung array) tidak boleh sama dengan yang terakhir tampil
    lastMsg=bag.pop();return MSGS[lastMsg];
  }
  function showToast(){
    clearTimeout(toastTm);toast.classList.remove("on");void toast.offsetWidth;
    toast.textContent=nextMsg();toast.classList.add("on");
    toastTm=setTimeout(()=>toast.classList.remove("on"),2600);
  }
  function start(){if(!armed||done)return;hold=true;st.classList.add("hold");cw.classList.add("zoom");if(!raf){last=0;raf=requestAnimationFrame(tick)}}
  function stop(){if(done)return;if(hold&&armed)showToast();hold=false;st.classList.remove("hold");cw.classList.remove("zoom")}
  hit.addEventListener("pointerdown",e=>{e.preventDefault();try{hit.setPointerCapture(e.pointerId)}catch(_){}start()});
  ["pointerup","pointercancel","lostpointercapture"].forEach(ev=>hit.addEventListener(ev,stop));
  hit.addEventListener("keydown",e=>{if(e.key===" "||e.key==="Enter"){e.preventDefault();start()}});
  hit.addEventListener("keyup",e=>{if(e.key===" "||e.key==="Enter")stop()});
  hit.addEventListener("contextmenu",e=>e.preventDefault());
  function extinguish(){
    done=true;hold=false;cancelAnimationFrame(raf);clearTimeout(toastTm);toast.classList.remove("on");
    cf.classList.remove("on");cf.classList.add("out");glow.classList.remove("on");warm.classList.remove("on");
    ring.classList.remove("on");hit.classList.remove("on");
    for(let i=0;i<4;i++){const s=document.createElement("i");s.style.animationDelay=(i*.22)+"s";s.style.setProperty("--sx",(Math.random()*30-10)+"px");smoke.appendChild(s)}
    setTimeout(()=>smoke.replaceChildren(),4000);
    T.forEach(t=>t.classList.remove("in"));
    dim.style.transition="opacity .8s ease";dim.style.opacity=".5";   // agak gelap, asap terlihat
    setTimeout(()=>{dim.style.transition="opacity 2.6s ease-in-out";dim.style.opacity=".97"},2800);   // lalu gelap banget
    endEl.innerHTML=END_LINES.map((t,i)=>`<div class="e e${i+1}">${t}</div>`).join("");
    [...endEl.children].forEach((el,i)=>{const t0=4300+i*4200;setTimeout(()=>el.classList.add("in"),t0);   // masuk dari bawah, satu per satu
      if(i<END_LINES.length-1)setTimeout(()=>{el.classList.remove("in");el.classList.add("out")},t0+3300)});
    const tLast=4300+(END_LINES.length-1)*4200;   // kalimat terakhir tampil, lalu pudar -> Layer 4
    setTimeout(()=>{const el=endEl.lastElementChild;el.classList.remove("in");el.classList.add("out")},tLast+3500);
    setTimeout(showL4,tLast+4600);
  }
  new MutationObserver(()=>{
    if(started||!L.classList.contains("show"))return;started=true;
    setTimeout(()=>st.classList.add("in"),400);          // latar & hiasan muncul setelah bunga bergeser
    setTimeout(()=>cw.classList.add("in"),1500);
    setTimeout(sequence,3700);                            // setelah lapisan bunga selesai (dan tidak lagi menutupi layar)
  }).observe(L,{attributes:true,attributeFilter:["class"]});
}
addEventListener("keydown",e=>{if(/^\d$/.test(e.key))press(+e.key);else if(e.key==="Backspace")press("⌫")});
