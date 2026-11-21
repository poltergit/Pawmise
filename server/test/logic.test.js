const test=require('node:test'),assert=require('node:assert');
delete process.env.ANTHROPIC_API_KEY;
const{thr,expOf,day,yd}=require('../src/logic'),{generateQuestion}=require('../src/ai');
test('level threshold grows 40 per level',()=>{assert.equal(thr(1),120);assert.equal(thr(3),200)});
test('expOf clamps and defaults',()=>{assert.equal(expOf(1),5);assert.equal(expOf(999),100);assert.equal(expOf('x'),15);assert.equal(expOf(30.4),30)});
test('yesterday is the day before',()=>{process.env.APP_TZ='UTC';const t=Date.UTC(2026,0,1,12);assert.equal(day(t),'2026-01-01');assert.equal(yd(t),'2025-12-31')});
test('timezone decides the day boundary',()=>{const t=Date.UTC(2026,0,1,17);process.env.APP_TZ='Asia/Manila';assert.equal(day(t),'2026-01-02');process.env.APP_TZ='UTC';assert.equal(day(t),'2026-01-01')});
test('fallback question never repeats the last one',async()=>{const q=await generateQuestion([]);assert.ok(q.length>10);for(let i=0;i<20;i++)assert.notEqual(await generateQuestion([q]),q)});
