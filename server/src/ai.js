const FALLBACK=["What did I do this week that made you feel most loved?","Which memory of us do you replay the most?","What's something small you wish we did more often?","Where should we be, together, a year from now?","What's the best part of an ordinary day with me?","What's something new we should try together?"];
// The Anthropic key only ever exists here, server-side.
async function generateQuestion(avoid=[]){
  const key=process.env.ANTHROPIC_API_KEY;
  if(key){
    try{
      const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',signal:AbortSignal.timeout(10000),
        headers:{'content-type':'application/json','x-api-key':key,'anthropic-version':'2023-06-01'},
        body:JSON.stringify({model:process.env.ANTHROPIC_MODEL||'claude-haiku-4-5',max_tokens:100,
          system:'Write one warm, specific question a couple answers separately to get to know each other better. Max 20 words. Output only the question.',
          messages:[{role:'user',content:'Avoid repeating: '+(avoid.join(' | ')||'none')}]})});
      if(!r.ok)throw new Error('anthropic '+r.status);
      const t=(await r.json()).content?.find(b=>b.type==='text')?.text?.trim();
      if(t)return t.slice(0,200);
    }catch(e){console.error('ai fallback:',e.message)}
  }
  const left=FALLBACK.filter(f=>!avoid.includes(f));
  return (left.length?left:FALLBACK)[Math.random()*(left.length||FALLBACK.length)|0];
}
module.exports={generateQuestion};
