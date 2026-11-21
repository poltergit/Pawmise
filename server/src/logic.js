const TZ=()=>process.env.APP_TZ||'Asia/Manila';
const fmt=t=>new Date(t).toLocaleDateString('en-CA',{timeZone:TZ()});
const day=(now=Date.now())=>fmt(now),yd=(now=Date.now())=>fmt(now-864e5);
const thr=l=>80+l*40,expOf=v=>Math.min(100,Math.max(5,Math.round(+v)||15));
module.exports={fmt,day,yd,thr,expOf};
