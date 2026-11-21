const TZ=()=>process.env.APP_TZ||'Asia/Manila';
const fmt=t=>{
  const parts=new Intl.DateTimeFormat('en-US',{timeZone:TZ(),year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(t));
  const value=Object.fromEntries(parts.filter(p=>p.type!=='literal').map(p=>[p.type,p.value]));
  return `${value.year}-${value.month}-${value.day}`;
};
const day=(now=Date.now())=>fmt(now),yd=(now=Date.now())=>fmt(now-864e5);
const thr=l=>80+l*40,expOf=v=>Math.min(100,Math.max(5,Math.round(+v)||15));
const week=(now=Date.now())=>{
  const d=new Date(now);d.setHours(12,0,0,0);d.setDate(d.getDate()-d.getDay()+1);
  return fmt(d);
};
const weekday=(now=Date.now())=>{
  const parts=new Intl.DateTimeFormat('en-US',{timeZone:TZ(),weekday:'short'}).formatToParts(new Date(now));
  const value=parts.find(p=>p.type==='weekday')?.value;
  return ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].indexOf(value);
};
module.exports={fmt,day,yd,thr,expOf,week,weekday};
