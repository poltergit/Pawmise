require('dotenv').config();
const express=require('express'),cors=require('cors'),helmet=require('helmet'),rate=require('express-rate-limit'),crypto=require('crypto'),mongoose=require('mongoose');
const app=express();
app.set('trust proxy',1);
app.use(helmet(),express.json({limit:'10kb'}),cors({origin:(process.env.ALLOWED_ORIGIN||'').split(',').map(s=>s.trim()),allowedHeaders:['content-type','x-pawmise-key']}));
app.use('/api',rate({windowMs:6e4,limit:60}));
// per-partner passcodes, constant-time compare; the key decides who you are (req.slot). Fails closed if unset.
const same=(x,y)=>{const a=Buffer.from(x),b=Buffer.from(y);return b.length>0&&a.length===b.length&&crypto.timingSafeEqual(a,b)};
app.use('/api',(q,s,n)=>{
  const k=String(q.get('x-pawmise-key')||''),i=[process.env.PAWMISE_KEY_A||'',process.env.PAWMISE_KEY_B||''].findIndex(v=>same(k,v));
  if(i<0)return s.status(401).json({error:'unauthorized'});
  q.slot=i;n();
});
app.use('/api',require('./routes'));
app.use((e,q,s,n)=>{console.error(e.message);s.status(e.name==='CastError'?400:500).json({error:'error'})});
mongoose.connect(process.env.MONGODB_URI).then(()=>app.listen(process.env.PORT||8787,()=>console.log('pawmise api up'))).catch(e=>{console.error(e.message);process.exit(1)});
