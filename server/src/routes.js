const router=require('express').Router(),rate=require('express-rate-limit');
const{Couple,Task,Question,Coupon,Redemption,Completion,Memory,CardOwnership,CardState}=require('./models'),{generateQuestion}=require('./ai'),push=require('./push');
const{CARDS,drawCard}=require('./cards');
const{day,yd,thr,expOf,week,weekday}=require('./logic');
const w=f=>(q,s,n)=>f(q,s,n).catch(n);
const couple=()=>Couple.findOneAndUpdate({key:'main'},{$setOnInsert:{key:'main'}},{upsert:true,new:true});
// every EXP earned also goes into a spendable wallet; spending never lowers the pet's level
const gain=async n=>{ // fully atomic: two phones completing tasks at once can't lose EXP
  let c=await Couple.findOneAndUpdate({key:'main'},{$inc:{'pet.exp':n,wallet:n}},{new:true,upsert:true});
  while(c.pet.exp>=thr(c.pet.level)){
    const l=c.pet.level;
    c=await Couple.findOneAndUpdate({key:'main','pet.level':l,'pet.exp':{$gte:thr(l)}},{$inc:{'pet.exp':-thr(l),'pet.level':1}},{new:true})||await couple();
  }
};
const recent=async()=>(await Question.find().sort({createdAt:-1}).limit(8)).map(x=>x.prompt);
const first=async()=>{const d=day(),c=await couple();return(await Question.findOne({day:d,seq:0}))||Question.findOneAndUpdate({day:d,seq:0},{$setOnInsert:{prompt:await generateQuestion(await recent(),c.questionCategory)}},{upsert:true,new:true}).catch(()=>Question.findOne({day:d,seq:0}))};
const fresh=async()=>{const d=day(),c=await couple();try{return await Question.create({day:d,seq:await Question.countDocuments({day:d}),prompt:await generateQuestion(await recent(),c.questionCategory)})}catch(e){return Question.findOne({day:d}).sort({createdAt:-1})}};
const question=async()=>(await Question.findOne({day:day()}).sort({createdAt:-1}))||first();
const ping=(slot,msg,type=0)=>couple().then(c=>{
  if(!c.notificationPrefs[type])return;
  push.notify(slot,c.names[slot]+' '+msg);
}).catch(()=>{});
async function pullCards(count=1,source='level'){
  const state=await CardState.findOneAndUpdate({key:'cards'},{$setOnInsert:{key:'cards'}},{upsert:true,new:true});
  const owned=await CardOwnership.find();
  const ownedIds=owned.map(x=>x.cardId);
  const cards=[];
  for(let i=0;i<count;i++){
    let card=drawCard(ownedIds,state.pity);
    if(source==='golden'&&['Common','Uncommon'].includes(card.rarity))card=CARDS.find(c=>c.rarity==='Rare')||card;
    if(source==='champion'&&['Common','Uncommon','Rare'].includes(card.rarity))card=CARDS.find(c=>c.rarity==='Epic')||card;
    const existing=await CardOwnership.findOne({cardId:card.id});
    if(existing){
      existing.quantity++;await existing.save();
      state.pawdust+=(card.rating||1);
    }else{
      await CardOwnership.create({cardId:card.id,quantity:1,obtainedAt:day(),source});
    }
    state.pulls++;
    state.pity=['Rare','Epic','Legendary','Mythic'].includes(card.rarity)?0:state.pity+1;
    ownedIds.push(card.id);
    cards.push({...card,owned:existing?existing.quantity+1:1,duplicate:!!existing});
  }
  await state.save();
  return cards;
}
const COUPONS=[['Movie night: your pick',150],['Breakfast in bed',200],['Skip one chore',120],['Mystery stash',300]];
const DEFAULTS=[['Clean together',20],['Win a duo match',30],['Evening walk',15],['Cook dinner together',25]];

async function state(me){
  const c=await couple(),d=day();
  c.happiness=Math.max(0,Math.min(100,c.happiness||70));
  c.hunger=Math.max(0,Math.min(100,c.hunger||70));
  if((await Couple.updateOne({key:'main',seeded:{$ne:true}},{seeded:true})).modifiedCount&&!await Task.countDocuments())await Task.insertMany(DEFAULTS.map(([label,exp])=>({label,exp})));
  if(c.streak&&c.lastActive!==d&&c.lastActive!==yd()){
    if(c.freezeTokens>0&&c.freezeUsedWeek!==week()){
      c.freezeTokens--;c.freezeUsedWeek=week();c.lastActive=yd();await c.save();
    }else{c.streak=0;await c.save()}
  }
  if(!await Coupon.countDocuments())await Coupon.insertMany(COUPONS.map(([label,cost])=>({label,cost})));
  const q=await question(),tasks=await Task.find().sort({_id:1}),o=c.toObject(),coupons=await Coupon.find().sort({cost:1}),stash=await Redemption.find().sort({createdAt:-1}).limit(20);
  const currentWeekday=weekday(),weekly=await Completion.find({day:{$gte:week()}}),memories=await Memory.find().sort({createdAt:-1}).limit(20);
  const dueTasks=tasks.filter(t=>t.schedule==='daily'||(t.schedule==='weekdays'&&currentWeekday!==0&&currentWeekday!==6)||(t.schedule==='weekends'&&(currentWeekday===0||currentWeekday===6))||(t.schedule==='custom'&&t.dueDays.includes(currentWeekday)));
  const cardState=await CardState.findOne({key:'cards'})||await CardState.create({key:'cards'});
  const ownership=await CardOwnership.find();
  const collection=ownership.map(x=>{
    const card=CARDS.find(c=>c.id===x.cardId);
    return card?{...card,quantity:x.quantity,obtainedAt:x.obtainedAt,source:x.source}:null;
  }).filter(Boolean);
  return{
    me,pet:{...o.pet,next:thr(o.pet.level)},wallet:o.wallet||0,
    coupons:coupons.map(x=>({id:x.id,label:x.label,cost:x.cost,custom:x.custom})),
    stash:stash.map(x=>({id:x.id,label:x.label,used:!!x.usedAt})),names:o.names,streak:o.streak,
    tasks:dueTasks.map(t=>({id:t.id,label:t.label,exp:t.exp,custom:t.custom,done:t.doneDay===d,by:t.doneBy,category:t.category,schedule:t.schedule,dueDays:t.dueDays,approval:t.approval,approvedBy:t.approvedBy})),
    freezeTokens:o.freezeTokens||0,freezeUsedWeek:o.freezeUsedWeek,petCare:{happiness:o.happiness||70,hunger:o.hunger||70},
    anniversary:o.anniversary||'',theme:o.theme||'ocean',accessory:o.accessory||'none',questionCategory:o.questionCategory||'balanced',notificationPrefs:o.notificationPrefs||[true,true,true],
    weekly:{target:5,progress:Math.min(5,new Set(weekly.map(x=>x.day)).size),completions:weekly.length},
    memories:memories.map(m=>({id:m.id,day:m.day,prompt:m.prompt,mood:m.mood,photo:m.photo,note:m.note,slot:m.slot})),
    cards:{collection,total:CARDS.length,pulls:cardState.pulls,pity:cardState.pity,pawdust:cardState.pawdust,packs:[
      {id:'paw',name:'Paw Pack',cost:150,count:1,guarantee:'A new adventure'},
      {id:'golden',name:'Golden Pack',cost:400,count:3,guarantee:'Rare or better'},
      {id:'champion',name:'Champion Pack',cost:800,count:5,guarantee:'Epic or better'}
    ]},
    // answers are only sent once revealed: the blind reveal is enforced server-side
    q:{prompt:q.prompt,l:q.answers.map(a=>!!a.sealed),rev:q.revealed,s:q.revealed?q.answers.map(a=>a.text):['','']}
  };
}
const send=async s=>s.json(await state(s.req.slot));

router.get('/state',w(async(_,s)=>send(s)));
router.post('/tasks',w(async(q,s)=>{
  const label=String(q.body.label||'').trim().slice(0,32);
  if(!label)return s.status(400).json({error:'label'});
  const categories=['chores','affection','health','adventure','cooking','everyday'];
  const schedules=['daily','weekdays','weekends','custom'];
  await Task.create({
    label,exp:expOf(q.body.exp),custom:true,
    category:categories.includes(q.body.category)?q.body.category:'everyday',
    schedule:schedules.includes(q.body.schedule)?q.body.schedule:'daily',
    dueDays:Array.isArray(q.body.dueDays)?q.body.dueDays.map(Number).filter(n=>n>=0&&n<=6).slice(0,7):[0,1,2,3,4,5,6],
    approval:q.body.approval===true
  });send(s);
}));
router.delete('/tasks/:id',w(async(q,s)=>{
  await Task.deleteOne({_id:q.params.id,doneDay:{$ne:day()}});
  send(s);
}));
router.post('/tasks/:id/complete',w(async(q,s)=>{
  const d=day(),by=q.slot,
    t=await Task.findOneAndUpdate({_id:q.params.id,doneDay:{$ne:d}},{$set:{doneDay:d,doneBy:by,approvedBy:q.body.approve?by:-1}});
  if(t){
    if(t.approval){
      send(s);return;
    }
    await couple();
    await Completion.create({day:d,task:t.label,exp:t.exp,slot:by});
    await Couple.updateOne({key:'main'},{$inc:{happiness:2,hunger:-1}});
    await Couple.updateOne({key:'main','petCare.happiness':{$exists:false}},{$set:{happiness:70,hunger:70}});
    // atomic streak bump: only the first completion of the day matches
    await Couple.updateOne({key:'main',lastActive:{$ne:d}},[{$set:{streak:{$cond:[{$eq:['$lastActive',yd()]},{$add:['$streak',1]},1]},lastActive:d}}]);
    const before=(await couple()).pet.level;
    await gain(t.exp);
    if((await couple()).pet.level>before)await pullCards(1,'level');
    ping(q.slot,'finished "'+t.label+'"',0);
  }
  send(s);
}));
router.post('/tasks/:id/approve',w(async(q,s)=>{
  const d=day();
  const t=await Task.findOne({_id:q.params.id,doneDay:d,approval:true,approvedBy:-1,doneBy:{$ne:q.slot}});
  if(t){
    t.approvedBy=q.slot;await t.save();
    await Completion.create({day:d,task:t.label,exp:t.exp,slot:t.doneBy});
    const before=(await couple()).pet.level;
    await gain(t.exp);
    if((await couple()).pet.level>before)await pullCards(1,'level');
    await Couple.updateOne({key:'main'},{$inc:{happiness:3}});
    ping(q.slot,'approved "'+t.label+'"',0);
  }
  send(s);
}));
router.post('/question/answer',w(async(q,s)=>{
  const i=q.slot,text=String(q.body.text||'').trim().slice(0,280);
  if(![0,1].includes(i)||!text)return s.status(400).json({error:'bad'});
  const qq=await question();
  const result=await Question.updateOne({_id:qq._id,revealed:false,['answers.'+i+'.sealed']:{$ne:true}},{$set:{['answers.'+i]:{text,sealed:true}}});
  if(result.modifiedCount)ping(q.slot,'sealed an answer',1);
  send(s);
}));
router.post('/question/reveal',w(async(_,s)=>{
  const qq=await question();
  if(!qq.revealed&&qq.answers.every(a=>a.sealed)){
    qq.revealed=true;await qq.save();
    if((await Couple.updateOne({key:'main',bonusDay:{$ne:day()}},{bonusDay:day()})).modifiedCount){
      const before=(await couple()).pet.level;await gain(25);
      if((await couple()).pet.level>before)await pullCards(1,'level');
    }
    ping(_.slot,'broke the seals, go read',2);
  }
  send(s);
}));
// AI call lives here; capped at 10/hour so a leaked passcode can't run up the bill
router.post('/question/next',rate({windowMs:36e5,limit:10}),w(async(_,s)=>{if((await question()).revealed)await fresh();send(s)}));
router.post('/profile',w(async(q,s)=>{
  const c=await couple(),b=q.body;
  if(typeof b.petName==='string'&&b.petName.trim())c.pet.name=b.petName.trim().slice(0,14);
  if(b.reroll)c.pet.seed=Math.random()*1e9|0;
  if(typeof b.name==='string'&&b.name.trim())c.names.set(q.slot,b.name.trim().slice(0,14));
  if(typeof b.anniversary==='string')c.anniversary=b.anniversary.slice(0,10);
  if(['ocean','valentine','halloween','winter'].includes(b.theme))c.theme=b.theme;
  if(['none','bow','collar','crown'].includes(b.accessory))c.accessory=b.accessory;
  if(['funny','deep/serious','romantic','intellectual','everyday life','balanced'].includes(b.questionCategory))c.questionCategory=b.questionCategory;
  if(Array.isArray(b.notificationPrefs)&&b.notificationPrefs.length===3)c.notificationPrefs=b.notificationPrefs.map(Boolean);
  await c.save();send(s);
}));
router.post('/streak/freeze',w(async(q,s)=>{
  const c=await couple();
  if(c.freezeTokens>0&&c.freezeUsedWeek!==week()){c.freezeTokens--;c.freezeUsedWeek=week();await c.save()}
  send(s);
}));
router.post('/memory',w(async(q,s)=>{
  const body=q.body||{};
  await Memory.create({
    day:day(),prompt:String(body.prompt||'A private Pawmise memory').slice(0,200),
    mood:String(body.mood||'happy').slice(0,20),
    photo:String(body.photo||'').slice(0,500),
    note:String(body.note||'').slice(0,280),slot:q.slot
  });
  send(s);
}));
router.post('/coupons',w(async(q,s)=>{
  const label=String(q.body.label||'').trim().slice(0,40),cost=Math.round(+q.body.cost);
  if(!label||!(cost>=10&&cost<=1000))return s.status(400).json({error:'bad'});
  await Coupon.create({label,cost,custom:true});send(s);
}));
router.delete('/coupons/:id',w(async(q,s)=>{await Coupon.deleteOne({_id:q.params.id,custom:true});send(s)}));
router.post('/coupons/:id/redeem',w(async(q,s)=>{
  const cp=await Coupon.findById(q.params.id);
  if(!cp)return s.status(404).json({error:'gone'});
  // atomic spend: only succeeds if the wallet covers the cost, so double-taps can't overdraw
  const c=await Couple.findOneAndUpdate({key:'main',wallet:{$gte:cp.cost}},{$inc:{wallet:-cp.cost}});
  if(!c)return s.status(402).json({error:'not enough exp'});
  await Redemption.create({label:cp.label,cost:cp.cost});send(s);
}));
router.post('/cards/packs/:id/open',w(async(q,s)=>{
  const packs={
    paw:{cost:150,count:1,source:'pack'},
    golden:{cost:400,count:3,source:'golden'},
    champion:{cost:800,count:5,source:'champion'}
  };
  const pack=packs[q.params.id];
  if(!pack)return s.status(404).json({error:'pack'});
  const c=await Couple.findOneAndUpdate({key:'main',wallet:{$gte:pack.cost}},{$inc:{wallet:-pack.cost}});
  if(!c)return s.status(402).json({error:'not enough exp'});
  const pulled=await pullCards(pack.count,pack.source);
  const response=await state(q.slot);
  response.cardPull=pulled;
  s.json(response);
}));
router.post('/stash/:id/use',w(async(q,s)=>{await Redemption.updateOne({_id:q.params.id,usedAt:null},{usedAt:new Date()});send(s)}));
router.patch('/tasks/:id',w(async(q,s)=>{
  const u={},label=String(q.body.label||'').trim().slice(0,32);
  if(label)u.label=label;if(q.body.exp!=null)u.exp=expOf(q.body.exp);
  if(['chores','affection','health','adventure','cooking','everyday'].includes(q.body.category))u.category=q.body.category;
  if(['daily','weekdays','weekends','custom'].includes(q.body.schedule))u.schedule=q.body.schedule;
  if(Array.isArray(q.body.dueDays))u.dueDays=q.body.dueDays.map(Number).filter(n=>n>=0&&n<=6).slice(0,7);
  if(typeof q.body.approval==='boolean')u.approval=q.body.approval,u.approvedBy=-1;
  if(!Object.keys(u).length)return s.status(400).json({error:'bad'});
  await Task.updateOne({_id:q.params.id,doneDay:{$ne:day()}},u);send(s); // finished tasks are locked so EXP can't be gamed
}));
router.get('/push/key',(_,s)=>s.json({key:push.publicKey}));
router.post('/push/subscribe',w(async(q,s)=>{const b=q.body.sub;if(!b||!b.endpoint||!b.keys)return s.status(400).json({error:'bad'});await push.save(q.slot,b);s.json({ok:1})}));
// memory book: every revealed question with both answers
router.get('/history',w(async(_,s)=>s.json((await Question.find({revealed:true}).sort({createdAt:-1}).limit(30)).map(x=>({day:x.day,prompt:x.prompt,a:x.answers.map(a=>a.text)})))));
module.exports=router;
