const{Schema,model}=require('mongoose');
// One document per couple (the app is private to two people): pet, partner names, streak.
const Couple=model('Couple',new Schema({
  key:{type:String,unique:true,default:'main'},
  pet:{name:{type:String,default:'Otto'},level:{type:Number,default:1},exp:{type:Number,default:0},seed:{type:Number,default:7}},
  names:{type:[String],default:['A','B']},
  streak:{type:Number,default:0},wallet:{type:Number,default:0},seeded:{type:Boolean,default:false},lastActive:{type:String,default:''},bonusDay:{type:String,default:''},
  freezeTokens:{type:Number,default:1},freezeUsedWeek:{type:String,default:''},
  happiness:{type:Number,default:70},hunger:{type:Number,default:70},
  anniversary:{type:String,default:''},theme:{type:String,default:'ocean',enum:['ocean','valentine','halloween','winter']},
  accessory:{type:String,default:'none',enum:['none','bow','collar','crown']},
  questionCategory:{type:String,default:'balanced'},notificationPrefs:{type:[Boolean],default:()=>[true,true,true]}
},{timestamps:true}));
// doneDay === today means done; tasks reset daily with no cron.
const Task=model('Task',new Schema({
  label:String,exp:{type:Number,default:15},custom:{type:Boolean,default:false},doneDay:{type:String,default:''},doneBy:{type:Number,default:-1},
  category:{type:String,default:'everyday'},schedule:{type:String,default:'daily',enum:['daily','weekdays','weekends','custom']},
  dueDays:{type:[Number],default:()=>[0,1,2,3,4,5,6]},approval:{type:Boolean,default:false},approvedBy:{type:Number,default:-1}
}));
const QS=new Schema({
  day:String,seq:Number,prompt:String,revealed:{type:Boolean,default:false},
  answers:{type:[{text:String,sealed:Boolean,_id:false}],default:()=>[{text:'',sealed:false},{text:'',sealed:false}]}
},{timestamps:true});
// first question of a day is seq 0: the unique index stops two phones creating two at midnight
QS.index({day:1,seq:1},{unique:true,partialFilterExpression:{seq:{$exists:true}}});
const Question=model('Question',QS);
// Secret Stash: a catalog of coupons, and redemptions (what you bought, and whether it has been used).
const Coupon=model('Coupon',new Schema({label:String,cost:Number,custom:{type:Boolean,default:false}}));
const Redemption=model('Redemption',new Schema({label:String,cost:Number,usedAt:{type:Date,default:null}},{timestamps:true}));
const Completion=model('Completion',new Schema({day:String,task:String,exp:Number,slot:Number},{timestamps:true}));
const Memory=model('Memory',new Schema({day:String,prompt:String,mood:String,photo:String,note:String,slot:Number},{timestamps:true}));
const CardOwnershipSchema=new Schema({
  cardId:{type:String,required:true},
  quantity:{type:Number,default:1},
  obtainedAt:{type:String,default:''},
  source:{type:String,enum:['level','pack','golden','champion','weekly','anniversary'],default:'level'}
},{timestamps:true});
CardOwnershipSchema.index({cardId:1},{unique:true});
const CardOwnership=model('CardOwnership',CardOwnershipSchema);
const CardState=model('CardState',new Schema({
  key:{type:String,unique:true,default:'cards'},pulls:{type:Number,default:0},pity:{type:Number,default:0},
  pawdust:{type:Number,default:0},lastLevelPull:{type:Number,default:0}
},{timestamps:true}));
module.exports={Couple,Task,Question,Coupon,Redemption,Completion,Memory,CardOwnership,CardState};
