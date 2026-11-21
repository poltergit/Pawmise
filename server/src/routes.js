const router=require('express').Router(),rate=require('express-rate-limit');
const{Couple,Task,Question,Coupon,Redemption}=require('./models'),{generateQuestion}=require('./ai'),push=require('./push');
const{day,yd,thr,expOf}=require('./logic');
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
const first=async()=>{const d=day();return(await Question.findOne({day:d,seq:0}))||Question.findOneAndUpdate({day:d,seq:0},{$setOnInsert:{prompt:await generateQuestion(await recent())}},{upsert:true,new:true}).catch(()=>Question.findOne({day:d,seq:0}))};
const fresh=async()=>{const d=day();try{return await Question.create({day:d,seq:await Question.countDocuments({day:d}),prompt:await generateQuestion(await recent())})}catch(e){return Question.findOne({day:d}).sort({createdAt:-1})}};
const question=async()=>(await Question.findOne({day:day()}).sort({createdAt:-1}))||first();
const ping=(slot,msg)=>couple().then(c=>push.notify(slot,c.names[slot]+' '+msg)).catch(()=>{});
const COUPONS=[['Movie night: your pick',150],['Breakfast in bed',200],['Skip one chore',120],['Mystery stash',300]];
const DEFAULTS=[['Clean together',20],['Win a duo match',30],['Evening walk',15],['Cook dinner together',25]];

async function state(me){
  const c=await couple(),d=day();
  if((await Couple.updateOne({key:'main',seeded:{$ne:true}},{seeded:true})).modifiedCount&&!await Task.countDocuments())await Task.insertMany(DEFAULTS.map(([label,exp])=>({label,exp})));
  if(c.streak&&c.lastActive!==d&&c.lastActive!==yd()){c.streak=0;await c.save()}
  if(!await Coupon.countDocuments())await Coupon.insertMany(COUPONS.map(([label,cost])=>({label,cost})));
  const q=await question(),tasks=await Task.find().sort({_id:1}),o=c.toObject(),coupons=await Coupon.find().sort({cost:1}),stash=await Redemption.find().sort({createdAt:-1}).limit(20);
  return{
    me,pet:{...o.pet,next:thr(o.pet.level)},wallet:o.wallet||0,
    coupons:coupons.map(x=>({id:x.id,label:x.label,cost:x.cost,custom:x.custom})),
    stash:stash.map(x=>({id:x.id,label:x.label,used:!!x.usedAt})),names:o.names,streak:o.streak,
    tasks:tasks.map(t=>({id:t.id,label:t.label,exp:t.exp,custom:t.custom,done:t.doneDay===d,by:t.doneBy})),
    // answers are only sent once revealed: the blind reveal is enforced server-side
    q:{prompt:q.prompt,l:q.answers.map(a=>!!a.sealed),rev:q.revealed,s:q.revealed?q.answers.map(a=>a.text):['','']}
  };
}
const send=async s=>s.json(await state(s.req.slot));

router.get('/state',w(async(_,s)=>send(s)));
router.post('/tasks',w(async(q,s)=>{
  const label=String(q.body.label||'').trim().slice(0,32);
  if(!label)return s.status(400).json({error:'label'});
  await Task.create({label,exp:expOf(q.body.exp),custom:true});send(s);
}));
router.delete('/tasks/:id',w(async(q,s)=>{
  await Task.deleteOne({_id:q.params.id,doneDay:{$ne:day()}});
  send(s);
}));
router.post('/tasks/:id/complete',w(async(q,s)=>{
  const d=day(),by=q.slot,
    t=await Task.findOneAndUpdate({_id:q.params.id,doneDay:{$ne:d}},{doneDay:d,doneBy:by}); // atomic: no double EXP
  if(t){
    await couple();
    // atomic streak bump: only the first completion of the day matches
    await Couple.updateOne({key:'main',lastActive:{$ne:d}},[{$set:{streak:{$cond:[{$eq:['$lastActive',yd()]},{$add:['$streak',1]},1]},lastActive:d}}]);
    await gain(t.exp);
    ping(q.slot,'finished "'+t.label+'"');
  }
  send(s);
}));
router.post('/question/answer',w(async(q,s)=>{
  const i=q.slot,text=String(q.body.text||'').trim().slice(0,280);
  if(![0,1].includes(i)||!text)return s.status(400).json({error:'bad'});
  const qq=await question();
  const result=await Question.updateOne({_id:qq._id,revealed:false,['answers.'+i+'.sealed']:{$ne:true}},{$set:{['answers.'+i]:{text,sealed:true}}});
  if(result.modifiedCount)ping(q.slot,'sealed an answer');
  send(s);
}));
router.post('/question/reveal',w(async(_,s)=>{
  const qq=await question();
  if(!qq.revealed&&qq.answers.every(a=>a.sealed)){
    qq.revealed=true;await qq.save();
    if((await Couple.updateOne({key:'main',bonusDay:{$ne:day()}},{bonusDay:day()})).modifiedCount)await gain(25);
    ping(_.slot,'broke the seals, go read');
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
  await c.save();send(s);
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
router.post('/stash/:id/use',w(async(q,s)=>{await Redemption.updateOne({_id:q.params.id,usedAt:null},{usedAt:new Date()});send(s)}));
router.patch('/tasks/:id',w(async(q,s)=>{
  const u={},label=String(q.body.label||'').trim().slice(0,32);
  if(label)u.label=label;if(q.body.exp!=null)u.exp=expOf(q.body.exp);
  if(!Object.keys(u).length)return s.status(400).json({error:'bad'});
  await Task.updateOne({_id:q.params.id,doneDay:{$ne:day()}},u);send(s); // finished tasks are locked so EXP can't be gamed
}));
router.get('/push/key',(_,s)=>s.json({key:push.publicKey}));
router.post('/push/subscribe',w(async(q,s)=>{const b=q.body.sub;if(!b||!b.endpoint||!b.keys)return s.status(400).json({error:'bad'});await push.save(q.slot,b);s.json({ok:1})}));
// memory book: every revealed question with both answers
router.get('/history',w(async(_,s)=>s.json((await Question.find({revealed:true}).sort({createdAt:-1}).limit(30)).map(x=>({day:x.day,prompt:x.prompt,a:x.answers.map(a=>a.text)})))));
module.exports=router;
