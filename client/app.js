const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const API=(window.PAWMISE_API||'').replace(/\/$/,'');
let S,hold=0,ME=localStorage.getItem('pm_me')===null?null:+localStorage.getItem('pm_me'),KEY=localStorage.getItem('pm_key')||prompt('Pawmise passcode')||'';localStorage.setItem('pm_key',KEY);
function rng(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function petSVG(){
const{level,seed}=S.pet,R=rng(seed),st=level<3?0:level<6?1:level<10?2:3,dn=S.tasks.filter(t=>t.done).length,m=dn?dn===S.tasks.length?2:1:0;
const h=200+R()*40|0,c=`hsl(${h} 75% 64%)`,d=`hsl(${h} 70% 44%)`,l=`hsl(${h} 90% 85%)`,k='stroke="#0B1A33" stroke-width="3" stroke-linejoin="round"';
let o='';
if(!st){o=`<ellipse cx="0" cy="8" rx="46" ry="58" fill="${l}" ${k}/>`;for(let i=0;i<6;i++)o+=`<circle cx="${R()*52-26|0}" cy="${R()*60-22|0}" r="${4+R()*5|0}" fill="${c}" opacity=".75"/>`;o+=`<path d="M-30 18l12-10 10 12 10-12 12 10 12-10" fill="none" ${k}/>`}
else{const n=9,r0=50+st*4,P=[...Array(n)].map((_,i)=>{const a=i/n*6.283,r=r0*(.86+R()*.28);return[Math.cos(a)*r,Math.sin(a)*r*.92]});
let p='M'+P[0];for(let i=0;i<n;i++){const a=P[(i+n-1)%n],b=P[i],e=P[(i+1)%n],f=P[(i+2)%n];p+=`C${b[0]+(e[0]-a[0])/6},${b[1]+(e[1]-a[1])/6} ${e[0]-(f[0]-b[0])/6},${e[1]-(f[1]-b[1])/6} ${e[0]},${e[1]}`}
if(st>1)o+=`<path d="M-36 -30L-46 -66L-14 -46z" fill="${d}" ${k}/><path d="M36 -30L46 -66L14 -46z" fill="${d}" ${k}/>`;
o+=`<ellipse cx="-22" cy="${r0-4}" rx="14" ry="9" fill="${d}" ${k}/><ellipse cx="22" cy="${r0-4}" rx="14" ry="9" fill="${d}" ${k}/>`;
o+=`<path d="${p}Z" fill="${c}" ${k}/><ellipse cx="0" cy="26" rx="22" ry="15" fill="${l}" opacity=".6"/>`;
o+=[-18,18].map(x=>`<g class="eye"><circle cx="${x}" cy="-8" r="8" fill="#fff" ${k}/><circle cx="${x+2}" cy="-7" r="4" fill="#0B1A33"/></g>`).join('')+`<circle cx="-31" cy="8" r="6" fill="#fff" opacity=".4"/><circle cx="31" cy="8" r="6" fill="#fff" opacity=".4"/>`;
o+=m===0?`<path d="M-6 16h12" fill="none" ${k}/>`:m===1?`<path d="M-9 14q9 9 18 0" fill="none" ${k}/>`:`<path d="M-11 12q11 16 22 0z" fill="#0B1A33" ${k}/>`;
if(st>2)o+=`<ellipse cx="0" cy="-70" rx="26" ry="7" fill="none" stroke="#fff" stroke-width="4"/>`+[[-60,-40],[62,-10],[52,50]].map(([x,y])=>`<path class="tw" d="M0-9L2-2 9 0 2 2 0 9-2 2-9 0-2-2z" transform="translate(${x} ${y})" fill="#fff"/>`).join('')}
return `<svg viewBox="-80 -90 160 175" class="w-52 drop-shadow-[0_14px_10px_rgba(0,0,0,.35)]">${o}</svg>`}

function fl(t,x,y){const e=document.createElement('span');e.className='fl';e.textContent=t;e.style.cssText=`left:${x}px;top:${y}px;color:#9CCBFF;font-size:22px`;document.body.appendChild(e);setTimeout(()=>e.remove(),1000)}
function burst(){const r=$('#pet').getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;for(let i=0;i<26;i++){const e=document.createElement('i');e.className='cf';e.style.cssText=`left:${cx}px;top:${cy}px;background:hsl(${195+Math.random()*50} 85% ${55+Math.random()*30}%);--dx:${Math.random()*300-150}px;--dy:${-20-Math.random()*260}px;--r:${Math.random()*720}deg`;document.body.appendChild(e);setTimeout(()=>e.remove(),1300)}}
function say(t){$('#say').textContent=t;hold=Date.now()+3000}
function toast(t){const e=$('#toast');e.textContent=t;e.classList.add('show');setTimeout(()=>e.classList.remove('show'),2200)}

async function call(path,method='POST',body){
  const r=await fetch(API+'/api'+path,{method,headers:{'content-type':'application/json','x-pawmise-key':KEY},body:body?JSON.stringify(body):undefined});
  if(r.status===401){localStorage.removeItem('pm_key');return location.reload()}
  if(r.status===402){toast('not enough exp yet');throw 0}
  if(!r.ok){toast('server hiccup');throw 0}
  return r.json();
}
let busy=0;
async function act(path,method,body){
  busy=1;
  try{
    const lv=S?.pet.level;S=await call(path,method,body);render();
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
$('#xp').textContent=`${p.exp} / ${p.next}`;$('#fill').style.width=p.exp/p.next*100+'%';$('#streak').textContent=S.streak;
if(Date.now()>hold)$('#say').textContent=['psst… feed me tasks','okay, we are getting somewhere','that is the good stuff'][dn?dn===S.tasks.length?2:1:0];
$('#cnt').textContent=`${dn}/${S.tasks.length}`;
$('#tasks').innerHTML=S.tasks.map((t,i)=>`<div data-i="${i}" class="card relative px-4 py-3 flex items-center gap-3 cursor-pointer ${i%2?'tilt-a':'tilt-b'} ${t.done?'opacity-75':''}"><span class="w-6 h-6 rounded-full border-[3px] border-ink grid place-items-center text-sm ${t.done?'bg-ocean text-paper':''}">${t.done?'✓':''}</span><span class="font-semibold flex-1 ${t.done?'line-through':''}">${esc(t.label)}</span>${t.done?'':`<span data-edit="${i}" class="px-1 opacity-50">✎</span><span data-del="${i}" class="px-1 font-bold opacity-50">×</span>`}${t.done&&t.by>=0?`<span class="hand text-base opacity-60">${esc(S.names[t.by][0])}</span>`:''}<span class="hand text-xl text-ocean">+${t.exp}</span>${t.done?'<span class="stamp">DONE</span>':''}</div>`).join('');
rs();
rq()}


$('#tasks').onclick=e=>{const ed=e.target.closest('[data-edit]');if(ed){const t=S.tasks[+ed.dataset.edit],l=prompt('task',t.label);if(!l)return;const x=prompt('exp (5-100)',t.exp);return act('/tasks/'+t.id,'PATCH',{label:l,exp:x})}const d=e.target.closest('[data-del]');if(d)return act('/tasks/'+S.tasks[+d.dataset.del].id,'DELETE');const c=e.target.closest('[data-i]');if(!c)return;const t=S.tasks[+c.dataset.i];if(t.done)return;const r=c.getBoundingClientRect();fl('+'+t.exp+' exp',r.right-90,r.top);navigator.vibrate?.(12);act('/tasks/'+t.id+'/complete','POST',{slot:ME})};
$('#addf').onsubmit=e=>{e.preventDefault();const v=$('#ni').value.trim();if(!v)return;$('#ni').value='';act('/tasks','POST',{label:v,exp:+$('#ne').value})};
$('#slots').onclick=e=>{const s=e.target.dataset.seal,r=e.target.dataset.ren;if(s!=null){const v=$('#ta'+s).value.trim();if(!v)return $('#ta'+s).focus();navigator.vibrate?.(20);act('/question/answer','POST',{slot:+s,text:v})}if(r!=null&&+r===ME){const n=prompt('name',S.names[r]);if(n&&n.trim())act('/profile','POST',{slot:+r,name:n.trim()})}};
$('#brk').onclick=e=>{const r=e.target.getBoundingClientRect();fl('+25 exp',r.left+r.width/2-40,r.top);act('/question/reveal')};
$('#nxt').onclick=()=>act('/question/next');
$('#nm').onclick=()=>{const n=prompt('name your pet',S.pet.name);if(n&&n.trim())act('/profile','POST',{petName:n.trim()})};
$('#rr').onclick=()=>{act('/profile','POST',{reroll:true});say('fresh look.')};
$('#pet').onclick=e=>{const p=$('#pet');p.classList.remove('sq');void p.offsetWidth;p.classList.add('sq');fl('♥',e.clientX-8,e.clientY-20);say(['boop!','hehe','again. again.','you two are cute'][Math.random()*4|0]);navigator.vibrate?.(10)};
$$('[data-t]').forEach(b=>b.onclick=()=>{$$('[data-t]').forEach(x=>x.classList.toggle('on',x===b));$$('.pn').forEach(p=>p.classList.toggle('hidden',p.id!=='p-'+b.dataset.t))});
for(let i=0;i<12;i++){const b=document.createElement('i'),s=6+Math.random()*16;b.className='bub';b.style.cssText=`left:${Math.random()*100}%;width:${s}px;height:${s}px;animation-duration:${5+Math.random()*7}s;animation-delay:-${Math.random()*8}s`;$('#port').prepend(b)}
function rs(){
  $('#wal').textContent=S.wallet;
  $('#rw').innerHTML=S.coupons.map((c,i)=>{const ok=S.wallet>=c.cost;return `<div class="card px-4 py-3 flex items-center gap-3 ${i%2?'tilt-a':'tilt-b'}" style="border-left:6px dashed #2F80ED"><b class="flex-1">${esc(c.label)}</b>${c.custom?`<span data-cdel="${c.id}" class="px-1 font-bold opacity-50">×</span>`:''}<button data-buy="${c.id}" ${ok?'':'disabled'} class="hand text-xl px-3 rounded-lg ${ok?'bg-ocean text-paper':'bg-ink/10 text-ink/40'}">${c.cost} exp</button></div>`}).join('');
  $('#st').innerHTML=S.stash.length?S.stash.map(s=>`<div class="card px-4 py-3 flex items-center gap-3 ${s.used?'opacity-50':''}"><b class="flex-1 ${s.used?'line-through':''}">${esc(s.label)}</b>${s.used?'<span class="hand text-lg">used</span>':`<button data-use="${s.id}" class="hand text-xl text-ocean">use it →</button>`}</div>`).join(''):'<p class="hand text-xl text-sky">nothing yet. earn, then spend.</p>';
}
$('#rw').onclick=e=>{const b=e.target.closest('[data-buy]'),d=e.target.closest('[data-cdel]');if(d)return act('/coupons/'+d.dataset.cdel,'DELETE');if(b&&!b.disabled){burst();toast('stashed!');navigator.vibrate?.(20);act('/coupons/'+b.dataset.buy+'/redeem')}};
$('#st').onclick=e=>{const b=e.target.closest('[data-use]');if(b)act('/stash/'+b.dataset.use+'/use')};
$('#cf').onsubmit=e=>{e.preventDefault();const l=$('#cl').value.trim();if(!l)return;$('#cl').value='';act('/coupons','POST',{label:l,cost:+$('#cc').value})};
call('/state','GET').then(s=>{S=s;ME=s.me;render()}).catch(()=>{$('#say').textContent='cannot reach the server'});

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
