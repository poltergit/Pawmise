const webpush=require('web-push'),mongoose=require('mongoose');
const Sub=mongoose.model('Sub',new mongoose.Schema({endpoint:{type:String,unique:true},keys:{p256dh:String,auth:String},slot:Number}));
const on=!!(process.env.VAPID_PUBLIC&&process.env.VAPID_PRIVATE);
if(on)webpush.setVapidDetails(process.env.VAPID_SUBJECT||'mailto:admin@example.com',process.env.VAPID_PUBLIC,process.env.VAPID_PRIVATE);
// tells the OTHER partner; never throws, prunes dead subscriptions
async function notify(fromSlot,body){
  if(!on)return;
  for(const s of await Sub.find({slot:1-fromSlot})){
    try{await webpush.sendNotification({endpoint:s.endpoint,keys:s.keys},JSON.stringify({title:'Pawmise',body}))}
    catch(e){if([404,410].includes(e.statusCode))await Sub.deleteOne({_id:s._id})}
  }
}
const save=(slot,sub)=>Sub.updateOne({endpoint:sub.endpoint},{endpoint:sub.endpoint,keys:sub.keys,slot},{upsert:true});
module.exports={notify,save,publicKey:process.env.VAPID_PUBLIC||''};
