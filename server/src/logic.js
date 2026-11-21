const TZ=()=>process.env.APP_TZ||'Asia/Manila';
const fmt=t=>{
  const parts=new Intl.DateTimeFormat('en-US',{timeZone:TZ(),year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(t));
  const value=Object.fromEntries(parts.filter(p=>p.type!=='literal').map(p=>[p.type,p.value]));
  return `${value.year}-${value.month}-${value.day}`;
};
const day=(now=Date.now())=>fmt(now),yd=(now=Date.now())=>fmt(now-864e5);
const thr=l=>80+l*40,expOf=v=>Math.min(100,Math.max(5,Math.round(+v)||15));
module.exports={fmt,day,yd,thr,expOf};
