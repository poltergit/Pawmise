const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const API=(window.PAWMISE_API||'').replace(/\/$/,'');
let S,hold=0,ME=localStorage.getItem('pm_me')===null?null:+localStorage.getItem('pm_me'),KEY=localStorage.getItem('pm_key')||'';
function rng(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const dogScenes=new WeakMap();

function petSVG(levelOverride){
  const level=levelOverride??S?.pet?.level??1;
  return `<canvas class="dog-canvas" data-dog-level="${level}" aria-label="3D Golden Retriever, level ${level}"></canvas>`;
}

function drawFallbackDog(canvas,level){
  canvas.width=220;canvas.height=220;
  const ctx=canvas.getContext('2d'),s=canvas.width/220;
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.scale(s,s);
  ctx.fillStyle='rgba(11,26,51,.16)';
  ctx.beginPath();ctx.ellipse(110,190,72,12,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#C98943';
  ctx.beginPath();ctx.ellipse(110,145,58,38,0,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.ellipse(110,92,48,45,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#E6B86A';
  ctx.beginPath();ctx.ellipse(110,112,29,20,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#A96A32';
  ctx.beginPath();ctx.ellipse(64,82,15,38,-0.42,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.ellipse(156,82,15,38,0.42,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#0B1A33';
  ctx.beginPath();ctx.arc(92,88,5,0,Math.PI*2);ctx.arc(128,88,5,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.ellipse(110,108,8,6,0,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#0B1A33';ctx.lineWidth=3;
  ctx.beginPath();ctx.arc(110,116,17,0.15*Math.PI,0.85*Math.PI);ctx.stroke();
  ctx.fillStyle='#C98943';
  ctx.fillRect(66,158,18,34);ctx.fillRect(136,158,18,34);
  ctx.save();ctx.translate(166,135);ctx.rotate(-0.65);ctx.fillRect(0,-6,55,12);ctx.restore();
  ctx.setTransform(1,0,0,1,0,0);
  if(level>=10){ctx.fillStyle='#FFE18A';ctx.beginPath();ctx.moveTo(76,42);ctx.lineTo(88,20);ctx.lineTo(102,38);ctx.lineTo(110,12);ctx.lineTo(118,38);ctx.lineTo(132,20);ctx.lineTo(144,42);ctx.closePath();ctx.fill();}
}

function createDogScene(canvas){
  if(!window.THREE||typeof window.THREE.Scene!=='function')return null;
  const level=+canvas.dataset.dogLevel||1;
  const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
  renderer.setSize(canvas.clientWidth||220,canvas.clientHeight||220,false);
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(28,1,0.1,100);camera.position.set(0,1.0,9.8);camera.lookAt(0,.05,0);
  scene.add(new THREE.HemisphereLight(0xE6F0FB,0x12305A,1.35));
  const key=new THREE.DirectionalLight(0xFFF1D2,1.8);key.position.set(-4,6,5);scene.add(key);
  const rim=new THREE.DirectionalLight(0x71B6FF,.8);rim.position.set(5,2,-3);scene.add(rim);
  const gold=0xC99045,lightGold=0xE0B66B,darkGold=0x9A602D,ink=0x0B1A33;
  const mat=(color,rough=.72)=>new THREE.MeshStandardMaterial({color,roughness:rough,metalness:0});
  const dog=new THREE.Group();scene.add(dog);
  const sph=(name,radius,color,x,y,z,sx=1,sy=1,sz=1)=>{
    const mesh=new THREE.Mesh(new THREE.SphereGeometry(radius,32,20),mat(color));
    mesh.name=name;mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);mesh.castShadow=true;mesh.receiveShadow=true;dog.add(mesh);return mesh;
  };
  const size=.82+(level>=3?0.05:0)+(level>=6?.08:0)+(level>=10?.12:0);
  dog.scale.setScalar(size);
  sph('body',1.55,gold,0,-.35,.15,1.15,.82,.7);
  sph('chest',.95,lightGold,-.05,-.65,1.05,.95,.85,.58);
  sph('head',1.02,gold,0,.72,.95,.9,.82,.82);
  sph('muzzle',.58,lightGold,0,.28,1.62,.95,.62,.75);
  sph('nose',.18,ink,0,.40,2.09,.95,.62,.55);
  const earGeo=new THREE.SphereGeometry(.62,24,16);
  [-1,1].forEach(side=>{
    const ear=new THREE.Mesh(earGeo,mat(darkGold));ear.position.set(side*.82,.55,1.05);ear.scale.set(.42,1.15,.38);ear.rotation.z=side*.13;ear.castShadow=true;dog.add(ear);
  });
  const eyes=[];
  [-1,1].forEach(side=>{
    eyes.push(sph('eye',.10,ink,side*.34,.84,1.79,.72,1,1));
    sph('brow',.23,lightGold,side*.34,1.24,1.58,.75,.25,.45);
  });
  sph('paw',.30,gold,-.78,-1.35,.95,.75,1.0,.75);sph('paw',.30,gold,.78,-1.35,.95,.75,1.0,.75);
  sph('paw',.28,gold,-.75,-1.48,-.35,.75,.65,.75);sph('paw',.28,gold,.75,-1.48,-.35,.75,.65,.75);
  const tail=new THREE.Mesh(new THREE.CylinderGeometry(.14,.21,1.35,16),mat(lightGold));tail.name='tail';tail.position.set(0,-.15,-1.45);tail.rotation.x=-.95;tail.rotation.z=.12;tail.castShadow=true;dog.add(tail);
  const accessory=S?.accessory||'none';
  if(accessory==='bow'){
    [-1,1].forEach(side=>{const b=new THREE.Mesh(new THREE.TorusGeometry(.28,.09,12,24),mat(0xFF86A8,.45));b.position.set(side*.28,.35,2.22);b.scale.set(1.1,.72,.35);b.rotation.y=side*.35;dog.add(b)});
  }
  if(accessory==='collar'){
    const collar=new THREE.Mesh(new THREE.TorusGeometry(.92,.09,16,32),mat(0xDFAF55,.5));collar.position.set(0,.05,1.15);collar.rotation.x=Math.PI/2;dog.add(collar);
  }
  if(accessory==='crown'){
    const crown=new THREE.Group();
    for(let i=-2;i<=2;i++){const spike=new THREE.Mesh(new THREE.ConeGeometry(.12,.55,12),mat(0xFFE18A,.35));spike.position.set(i*.24,.1,0);spike.rotation.z=i===0?0:i*.12;crown.add(spike)}
    crown.position.set(0,1.72,1.02);crown.rotation.x=.05;dog.add(crown);
  }
  const shadow=new THREE.Mesh(new THREE.CircleGeometry(1.7,32),new THREE.MeshBasicMaterial({color:0x06132A,transparent:true,opacity:.24,depthWrite:false}));
  shadow.rotation.x=-Math.PI/2;shadow.position.y=-1.68;shadow.scale.y=.42;scene.add(shadow);
  canvas.dataset.ready='true';
  dogScenes.set(canvas,{renderer,scene,camera,dog,tail,eyes,level,tiltX:0,tiltY:0,reaction:0});
  let started=false;
  const animate=(now)=>{
    if(!canvas.isConnected){dogScenes.delete(canvas);return;}
    const state=dogScenes.get(canvas);if(!state)return;
    const t=now*.001;
    state.dog.position.y=Math.sin(t*1.7)*.025;
    state.dog.rotation.y+=((state.tiltX||0)-state.dog.rotation.y)*.08;
    state.dog.rotation.x+=((state.tiltY||0)-state.dog.rotation.x)*.08;
    state.tail.rotation.z=.12+Math.sin(t*(level>=6?8:5))*((state.reaction||0)>0?.65:.28);
    const blinkPhase=t%4.8;
    const blink=blinkPhase>4.55&&blinkPhase<4.72?.12:1;
    state.eyes.forEach(eye=>eye.scale.y=blink);
    if(state.reaction>0)state.reaction--;
    state.renderer.render(state.scene,state.camera);
    requestAnimationFrame(animate);
  };
  if(!started){started=true;requestAnimationFrame(animate)}
  canvas.onpointermove=e=>{const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;const state=dogScenes.get(canvas);if(state){state.tiltX=x*.28;state.tiltY=-y*.12}};
  canvas.onpointerleave=()=>{const state=dogScenes.get(canvas);if(state){state.tiltX=0;state.tiltY=0}};
  canvas.onclick=()=>{const state=dogScenes.get(canvas);if(state)state.reaction=90};
  return {renderer,scene,camera,dog,tail};
}

function syncDogCanvases(){
  document.querySelectorAll('canvas.dog-canvas').forEach(canvas=>{
    if(canvas.dataset.ready)return;
    if(window.THREE){
      createDogScene(canvas);
    }else{
      drawFallbackDog(canvas,+canvas.dataset.dogLevel||1);
    }
  });
}

function fl(t,x,y){const e=document.createElement('span');e.className='fl';e.textContent=t;e.style.cssText=`left:${x}px;top:${y}px;color:#9CCBFF;font-size:22px`;document.body.appendChild(e);setTimeout(()=>e.remove(),1000)}
function burst(){const r=$('#pet').getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;for(let i=0;i<26;i++){const e=document.createElement('i');e.className='cf';e.style.cssText=`left:${cx}px;top:${cy}px;background:hsl(${195+Math.random()*50} 85% ${55+Math.random()*30}%);--dx:${Math.random()*300-150}px;--dy:${-20-Math.random()*260}px;--r:${Math.random()*720}deg`;document.body.appendChild(e);setTimeout(()=>e.remove(),1300)}}
function say(t){$('#say').textContent=t;hold=Date.now()+3000}
function toast(t){const e=$('#toast');e.textContent=t;e.classList.add('show');setTimeout(()=>e.classList.remove('show'),2200)}

async function call(path,method='POST',body){
  const r=await fetch(API+'/api'+path,{method,headers:{'content-type':'application/json','x-pawmise-key':KEY},body:body?JSON.stringify(body):undefined});
  if(r.status===401){localStorage.removeItem('pm_key');KEY='';showLock();throw 0}
  if(r.status===402){toast('not enough exp yet');throw 0}
  if(!r.ok){toast('server hiccup');throw 0}
  return r.json();
}
let busy=0;
async function act(path,method,body){
  busy=1;
  try{
    const lv=S?.pet.level;S=await call(path,method,body);render();
    if(S.cardPull?.length)showCardReveal(S.cardPull);
    if(S.pet.level>lv){burst();navigator.vibrate?.([30,40,30]);const ev=[3,6,10].includes(S.pet.level);toast(ev?`${S.pet.name} evolved!`:`level ${S.pet.level}`);say(ev?'whoa. new body.':'stronger. rounder.')}
  }catch(e){}finally{busy=0}
}
function rq(){const q=S.q;$('#qp').textContent=q.prompt;$('#sw').textContent=ME==null?'':'you: '+S.names[ME];
$('#slots').innerHTML=[0,1].map(k=>{let b;const mine=k===ME;
if(q.rev)b=`<p class="hand text-2xl leading-6 mt-2 flip">${esc(q.s[k])}</p>`;
else if(q.l[k])b=`<svg viewBox="0 0 120 70" class="w-24 mx-auto mt-2"><rect x="2" y="2" width="116" height="66" rx="6" fill="#BBD6F4" stroke="#0B1A33" stroke-width="3"/><path d="M4 6l56 36 56-36" fill="none" stroke="#0B1A33" stroke-width="3"/><circle cx="60" cy="42" r="12" fill="#2F80ED" stroke="#0B1A33" stroke-width="3"/><text x="60" y="47" text-anchor="middle" font-size="14" font-weight="800" fill="#E6F0FB">${esc(S.names[k][0]||'?')}</text></svg>`;
else if(mine)b=`<textarea id="ta${k}" rows="2" maxlength="280" placeholder="write it, then seal it" class="w-full mt-2 bg-white/60 border-2 border-ink rounded-xl p-2 text-sm outline-none"></textarea><button data-seal="${k}" class="hand text-xl text-ocean">seal it ↴</button>`;
else b=`<p class="hand text-xl text-ocean mt-2">still writing…</p>`;
return `<div class="card px-4 py-3 ${k?'tilt-a':'tilt-b'}"><span class="hand text-lg"><b data-ren="${k}" class="underline decoration-dotted decoration-ocean">${esc(S.names[k])}</b>${q.l[k]&&!q.rev?' · sealed':''}${mine?' (you)':''}</span>${b}</div>`}).join('');
$('#brk').classList.toggle('hidden',!(q.l[0]&&q.l[1])||!!q.rev);$('#nxt').classList.toggle('hidden',!q.rev)}
function render(){const p=S.pet,dn=S.tasks.filter(t=>t.done).length;
$('#pet').innerHTML=petSVG();$('#nm').textContent=p.name;$('#lv').textContent='lv '+p.level;
syncDogCanvases();
document.body.dataset.theme=S.theme||'ocean';
$('#xp').textContent=`${p.exp} / ${p.next}`;$('#fill').style.width=p.exp/p.next*100+'%';$('#streak').textContent=S.streak;
if(Date.now()>hold)$('#say').textContent=['psst… feed me tasks','okay, we are getting somewhere','that is the good stuff'][dn?dn===S.tasks.length?2:1:0];
$('#cnt').textContent=`${dn}/${S.tasks.length}`;
$('#tasks').innerHTML=S.tasks.map((t,i)=>`<div data-i="${i}" class="card relative px-4 py-3 flex items-center gap-3 cursor-pointer ${i%2?'tilt-a':'tilt-b'} ${t.done?'opacity-75':''}"><span class="w-6 h-6 rounded-full border-[3px] border-ink grid place-items-center text-sm ${t.done?'bg-ocean text-paper':''}">${t.done?'✓':''}</span><span class="flex-1"><b class="${t.done?'line-through':''}">${esc(t.label)}</b><span class="block hand text-base text-ocean">${esc(t.category)} · ${esc(t.schedule)}${t.approval?' · approval':''}</span></span>${t.done?t.approval&&t.approvedBy<0&&t.by!==ME?`<button data-approve="${i}" class="hand text-lg text-ocean">approve</button>`:'':`<span data-edit="${i}" class="px-1 opacity-50">✎</span><span data-del="${i}" class="px-1 font-bold opacity-50">×</span>`}${t.done&&t.by>=0?`<span class="hand text-base opacity-60">${esc(S.names[t.by][0])}</span>`:''}<span class="hand text-xl text-ocean">+${t.exp}</span>${t.done?'<span class="stamp">DONE</span>':''}</div>`).join('');
$('#weekly').innerHTML=`<div class="flex items-center justify-between"><span class="hand text-2xl">weekly goal</span><b class="hand text-2xl text-ocean">${S.weekly.progress}/${S.weekly.target}</b></div><div class="track mt-2"><div class="fill" style="width:${S.weekly.progress/S.weekly.target*100}%"></div></div><button id="freeze" class="hand text-lg text-ocean mt-2">${S.freezeTokens?'use a streak freeze':'freeze used'}</button>`;
renderMore();
rs();
rq()}


$('#tasks').onclick=e=>{const ap=e.target.closest('[data-approve]');if(ap){const t=S.tasks[+ap.dataset.approve];return act('/tasks/'+t.id+'/approve','POST')}const ed=e.target.closest('[data-edit]');if(ed){const t=S.tasks[+ed.dataset.edit],l=prompt('task',t.label);if(!l)return;const x=prompt('exp (5-100)',t.exp);return act('/tasks/'+t.id,'PATCH',{label:l,exp:x,category:t.category,schedule:t.schedule,dueDays:t.dueDays,approval:t.approval})}const d=e.target.closest('[data-del]');if(d)return act('/tasks/'+S.tasks[+d.dataset.del].id,'DELETE');const c=e.target.closest('[data-i]');if(!c)return;const t=S.tasks[+c.dataset.i];if(t.done)return;const r=c.getBoundingClientRect();fl('+'+t.exp+' exp',r.right-90,r.top);navigator.vibrate?.(12);act('/tasks/'+t.id+'/complete','POST',{slot:ME})};
$('#addf').onsubmit=e=>{e.preventDefault();const v=$('#ni').value.trim();if(!v)return;const due=[...$$('#customDays input:checked')].map(x=>+x.value);$('#ni').value='';act('/tasks','POST',{label:v,exp:+$('#ne').value,category:$('#nc').value,schedule:$('#ns').value,dueDays:due.length?due:[0,1,2,3,4,5,6],approval:$('#na').checked})};
$('#slots').onclick=e=>{const s=e.target.dataset.seal,r=e.target.dataset.ren;if(s!=null){const v=$('#ta'+s).value.trim();if(!v)return $('#ta'+s).focus();navigator.vibrate?.(20);act('/question/answer','POST',{slot:+s,text:v})}if(r!=null&&+r===ME){const n=prompt('name',S.names[r]);if(n&&n.trim())act('/profile','POST',{slot:+r,name:n.trim()})}};
$('#brk').onclick=e=>{const r=e.target.getBoundingClientRect();fl('+25 exp',r.left+r.width/2-40,r.top);act('/question/reveal')};
$('#nxt').onclick=()=>act('/question/next');
$('#nm').onclick=()=>{const n=prompt('name your pet',S.pet.name);if(n&&n.trim())act('/profile','POST',{petName:n.trim()})};
$('#rr').onclick=()=>{act('/profile','POST',{reroll:true});say('fresh look.')};
$('#pet').onclick=e=>{const p=$('#pet'),canvas=p.querySelector('canvas'),state=canvas&&dogScenes.get(canvas);if(state)state.reaction=120;p.classList.remove('sq');void p.offsetWidth;p.classList.add('sq');fl('♥',e.clientX-8,e.clientY-20);say(['boop!','good pup','wag wag','you two are cute'][Math.random()*4|0]);navigator.vibrate?.(10)};
$$('[data-t]').forEach(b=>b.onclick=()=>{$$('[data-t]').forEach(x=>x.classList.toggle('on',x===b));$$('.pn').forEach(p=>p.classList.toggle('hidden',p.id!=='p-'+b.dataset.t))});
for(let i=0;i<12;i++){const b=document.createElement('i'),s=6+Math.random()*16;b.className='bub';b.style.cssText=`left:${Math.random()*100}%;width:${s}px;height:${s}px;animation-duration:${5+Math.random()*7}s;animation-delay:-${Math.random()*8}s`;$('#port').prepend(b)}
function renderMore(){
  renderCards('all');
  $('#happy').textContent=S.petCare.happiness;$('#hungry').textContent=S.petCare.hunger;
  $('#happyFill').style.width=S.petCare.happiness+'%';$('#hungryFill').style.width=S.petCare.hunger+'%';
  $('#anni').value=S.anniversary||'';$('#theme').value=S.theme||'ocean';$('#accessory').value=S.accessory||'none';$('#qcat').value=S.questionCategory||'balanced';
  [0,1,2].forEach(i=>$('#pn'+i).checked=!!S.notificationPrefs[i]);
  $('#memories').innerHTML=(S.memories||[]).map(m=>`<div class="border-t-2 border-sky/40 pt-3">${m.photo?`<img src="${esc(m.photo)}" alt="Pawmise memory" class="w-full max-h-48 object-cover rounded-xl mb-2" onerror="this.remove()">`:''}<p class="hand text-lg">${esc(m.day)} · ${esc(m.mood)}</p>${m.note?`<p class="text-sm">${esc(m.note)}</p>`:''}</div>`).join('');
  syncDogCanvases();
}
function rs(){
  $('#wal').textContent=S.wallet;
  $('#packs').innerHTML=(S.cards?.packs||[]).map(p=>`<div class="card px-4 py-3 flex items-center gap-3"><div class="flex-1"><b class="hand text-2xl">${esc(p.name)}</b><span class="block text-sm opacity-70">${esc(p.guarantee)}</span></div><button data-pack="${p.id}" ${S.wallet>=p.cost?'':'disabled'} class="hand text-xl px-3 py-1 rounded-lg ${S.wallet>=p.cost?'bg-ocean text-paper':'bg-ink/10 text-ink/40'}">${p.cost} exp</button></div>`).join('');
  $('#rw').innerHTML=S.coupons.map((c,i)=>{const ok=S.wallet>=c.cost;return `<div class="card px-4 py-3 flex items-center gap-3 ${i%2?'tilt-a':'tilt-b'}" style="border-left:6px dashed #2F80ED"><b class="flex-1">${esc(c.label)}</b>${c.custom?`<span data-cdel="${c.id}" class="px-1 font-bold opacity-50">×</span>`:''}<button data-buy="${c.id}" ${ok?'':'disabled'} class="hand text-xl px-3 rounded-lg ${ok?'bg-ocean text-paper':'bg-ink/10 text-ink/40'}">${c.cost} exp</button></div>`}).join('');
  $('#st').innerHTML=S.stash.length?S.stash.map(s=>`<div class="card px-4 py-3 flex items-center gap-3 ${s.used?'opacity-50':''}"><b class="flex-1 ${s.used?'line-through':''}">${esc(s.label)}</b>${s.used?'<span class="hand text-lg">used</span>':`<button data-use="${s.id}" class="hand text-xl text-ocean">use it →</button>`}</div>`).join(''):'<p class="hand text-xl text-sky">nothing yet. earn, then spend.</p>';
}
const cardEmoji=set=>({'Everyday Paws':'🐾','Adventure Club':'🦮','Seasons':'🍂','Golden Style':'🎀','Pawmise Memories':'💙','Golden Legends':'👑'}[set]||'🐕');
const rarityRank={Common:1,Uncommon:2,Rare:3,Epic:4,Legendary:5,Mythic:6};
function cardMarkup(card,reveal=false){
  const rarity=card.rarity.toLowerCase();
  const stars='★'.repeat(card.rating);
  return `<article class="collect-card rarity-${rarity} ${reveal?'reveal-card':''}"><div class="paw-art">${cardEmoji(card.set)}</div><p class="hand text-lg leading-5">${esc(card.name)}</p><p class="text-xs opacity-70">${esc(card.rarity)} · ${stars}</p>${card.quantity?`<b class="absolute bottom-2 right-2 text-sm">×${card.quantity}</b>`:''}</article>`;
}
function renderCards(filter='all'){
  const all=S.cards?.collection||[];
  const rank={rare:3,epic:4,mythic:6}[filter];
  const visible=filter==='all'?all:rank?all.filter(c=>rarityRank[c.rarity]>=rank):all.filter(c=>c.rarity===filter);
  $('#cardCount').textContent=`${visible.length}/${S.cards?.total||60}`;
  $('#cards').innerHTML=visible.length?visible.map(c=>cardMarkup(c)).join(''):'<p class="hand text-xl text-sky col-span-2">cards are waiting to be drawn</p>';
}
function showCardReveal(cards){
  $('#revealTitle').textContent=cards.length>1?'new paw packs!':'new card!';
  $('#revealCards').innerHTML=cards.map(c=>cardMarkup(c,true)).join('');
  $('#cardReveal').classList.remove('hidden');$('#cardReveal').classList.add('grid');
}
$('#closeReveal').onclick=()=>{$('#cardReveal').classList.add('hidden');$('#cardReveal').classList.remove('grid')};
$('#packs').onclick=async e=>{
  const b=e.target.closest('[data-pack]');if(!b)return;
  if(S.wallet<({paw:150,golden:400,champion:800}[b.dataset.pack]))return;
  burst();await act('/cards/packs/'+b.dataset.pack+'/open','POST');
};
$('#collectionFilters').onclick=e=>{
  const b=e.target.closest('[data-filter]');if(!b)return;
  $$('[data-filter]').forEach(x=>x.classList.toggle('on',x===b));renderCards(b.dataset.filter);
};
$('#rw').onclick=e=>{const b=e.target.closest('[data-buy]'),d=e.target.closest('[data-cdel]');if(d)return act('/coupons/'+d.dataset.cdel,'DELETE');if(b&&!b.disabled){burst();toast('stashed!');navigator.vibrate?.(20);act('/coupons/'+b.dataset.buy+'/redeem')}};
$('#st').onclick=e=>{const b=e.target.closest('[data-use]');if(b)act('/stash/'+b.dataset.use+'/use')};
$('#cf').onsubmit=e=>{e.preventDefault();const l=$('#cl').value.trim();if(!l)return;$('#cl').value='';act('/coupons','POST',{label:l,cost:+$('#cc').value})};
const dayNames=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
$('#customDays').innerHTML=dayNames.map((n,i)=>`<label class="text-sm px-2 py-1 border border-sky rounded-lg"><input type="checkbox" value="${i}" checked> ${n}</label>`).join('');
$('#ns').onchange=()=>$('#customDays').classList.toggle('hidden',$('#ns').value!=='custom');
$('#evo').onclick=()=>{$$('[data-t]').forEach(x=>x.classList.toggle('on',x.dataset.t==='more'));$$('.pn').forEach(p=>p.classList.toggle('hidden',p.id!=='p-more'))};
$('#weekly').onclick=e=>{if(e.target.id==='freeze'&&S.freezeTokens)act('/streak/freeze','POST')};
$('#qcat').onchange=()=>act('/profile','POST',{questionCategory:$('#qcat').value});
$('#saveAnni').onclick=()=>act('/profile','POST',{anniversary:$('#anni').value});
$('#theme').onchange=()=>act('/profile','POST',{theme:$('#theme').value});
$('#accessory').onchange=()=>act('/profile','POST',{accessory:$('#accessory').value});
$('#savePrefs').onclick=()=>act('/profile','POST',{notificationPrefs:[$('#pn0').checked,$('#pn1').checked,$('#pn2').checked]});
$('#saveMem').onclick=()=>{const note=$('#memNote').value.trim();if(!note&&!$('#memPhoto').value.trim())return;act('/memory','POST',{prompt:S.q.prompt,mood:$('#memMood').value,photo:$('#memPhoto').value.trim(),note});$('#memNote').value='';$('#memPhoto').value=''};
function showLock(){
  $('#lock').classList.remove('hidden');$('#lock').classList.add('grid');
  setTimeout(()=>$('#lockkey').focus(),50);
}
function loadApp(){
  if(!KEY){showLock();return;}
  call('/state','GET').then(s=>{S=s;ME=s.me;$('#lock').classList.add('hidden');$('#lock').classList.remove('grid');render();who()}).catch(()=>{});
}
$('#lockf').onsubmit=e=>{e.preventDefault();const value=$('#lockkey').value.trim();if(!value)return $('#lockkey').focus();KEY=value;localStorage.setItem('pm_key',KEY);$('#lockkey').value='';loadApp()};
loadApp();

function who(){
  if(ME!==null||document.getElementById('who'))return;
  const o=document.createElement('div');o.id='who';o.className='fixed inset-0 z-[90] bg-ink/95 grid place-items-center p-6';
  o.innerHTML=`<div class="card tape px-6 py-6 text-center max-w-xs w-full"><p class="hand text-3xl mb-1">who's holding this phone?</p><p class="text-sm opacity-70 mb-4">answers stay sealed until you both open them.</p><div class="flex gap-3">${[0,1].map(k=>`<button data-me="${k}" class="flex-1 bg-ocean text-paper font-extrabold py-3 rounded-xl">${esc(S.names[k])}</button>`).join('')}</div></div>`;
  o.onclick=e=>{const k=e.target.dataset.me;if(k==null)return;ME=+k;localStorage.setItem('pm_me',k);o.remove();render()};
  document.body.appendChild(o);
}

$('#hb').onclick=async()=>{
  const b=$('#book');
  if(!b.classList.contains('hidden')){b.classList.add('hidden');b.classList.remove('flex');return}
  const h=await call('/history','GET');
  b.innerHTML=h.length?h.map((x,i)=>`<div class="card px-4 py-3 ${i%2?'tilt-a':'tilt-b'}"><p class="hand text-lg opacity-70">${esc(x.day)}</p><p class="font-semibold text-sm mb-2">${esc(x.prompt)}</p>${x.a.map((t,k)=>`<p class="hand text-xl leading-5"><b>${esc(S.names[k])}:</b> ${esc(t)}</p>`).join('')}</div>`).join(''):'<p class="hand text-xl text-sky">no memories yet. break some seals.</p>';
  b.classList.remove('hidden');b.classList.add('flex');
};
// live sync between your two phones; never re-render while someone is typing an answer
const sync=()=>{
  if(busy||document.hidden||!S)return;
  const ta=$('#slots textarea');if(ta&&(ta.value||document.activeElement===ta))return;
  call('/state','GET').then(s=>{S=s;ME=s.me;render()}).catch(()=>{});
};
setInterval(sync,15000);document.addEventListener('visibilitychange',sync);

const b64=s=>Uint8Array.from(atob((s+'='.repeat((4-s.length%4)%4)).replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
$('#bell').onclick=async()=>{try{
  if(!('serviceWorker'in navigator&&'PushManager'in window))return toast('add to home screen first');
  if(await Notification.requestPermission()!=='granted')return toast('notifications blocked');
  const{key}=await call('/push/key','GET');if(!key)return toast('push not set up on server');
  const reg=await navigator.serviceWorker.ready,sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:b64(key)});
  await call('/push/subscribe','POST',{sub:sub.toJSON()});toast('you will be pinged');
}catch(e){toast('could not enable')}};
