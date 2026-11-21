const crypto=require('crypto');

const SETS=[
  ['Everyday Paws','#74A9D8','A'],
  ['Adventure Club','#D69A58','B'],
  ['Seasons','#75AFA2','C'],
  ['Golden Style','#C58CBF','D'],
  ['Pawmise Memories','#6C91C9','E'],
  ['Golden Legends','#D8B45B','L']
];

const NAMES={
  A:['Puppy Paws','Morning Cuddle','Cozy Nap','Supper Helper','Sofa Patrol','Toy Finder','Good Boy Smile','Homecoming','Blanket Burrito','Favorite Human'],
  B:['Park Hero','Fetch Champion','Trail Scout','Beach Runner','Mountain Friend','Picnic Pal','Ball Catcher','Lake Splash','City Explorer','Sunset Journey'],
  C:['Spring Bloom','Summer Breeze','Rainy Snuggler','Golden Autumn','Snowy Nose','Poolside Pup','Leaf Jumper','Winter Mittens','Starry Night','Four Seasons'],
  D:['Blue Bandana','Rose Bow','Red Collar','Scout Scarf','Party Pup','Sunday Best','Cozy Sweater','Captain Cap','Golden Crown','Midnight Cape'],
  E:['First Streak','Task Partner','Blind-Answer Buddies','Anniversary Pup','Memory Keeper','Date-Night Dog','Long-Distance Paw','Weekend Together','A Million Little Moments','Soulmate Silhouette'],
  L:['Golden Guardian','Forever Loyal','Pawmise Champion','Pawmise Soulmate','Moonlit Reunion','The Golden Standard','Heartbeat Hero','Mythic Morning','Ten of Ten','Paw of Eternity']
};

const RATING_BY_INDEX=[1,1,1,1,1,2,2,2,3,4];
const RARITY=['Common','Common','Common','Uncommon','Uncommon','Rare','Rare','Epic','Epic','Legendary'];
const CARDS=[];
for(let setIndex=0;setIndex<SETS.length;setIndex++){
  const[set,color,code]=SETS[setIndex];
  const names=NAMES[code];
  names.forEach((name,i)=>{
    const legendarySet=setIndex===5;
    const rating=legendarySet?[7,7,8,8,8,9,9,9,10,10][i]:RATING_BY_INDEX[i];
    const rarity=legendarySet?['Epic','Epic','Epic','Legendary','Legendary','Legendary','Legendary','Legendary','Mythic','Mythic'][i]:RARITY[rating];
    CARDS.push({id:`${code.toLowerCase()}-${i+1}`,name,rating,rarity,set,color,description:flavor(set,name),art:`${code}-${i+1}`});
  });
}
function flavor(set,name){
  const lines={
    'Everyday Paws':'The sweetest little moment of an ordinary day.',
    'Adventure Club':'Always ready for the next shared adventure.',
    'Seasons':'A little piece of the year worth keeping.',
    'Golden Style':'Looking handsome is practically a love language.',
    'Pawmise Memories':'One more memory to keep close.',
    'Golden Legends':'A once-in-a-lifetime companion moment.'
  };
  return `${name}. ${lines[set]}`;
}

const WEIGHTS={Common:35,Uncommon:28,Rare:19,Epic:10,Legendary:6,Mythic:2};
const randomInt=limit=>crypto.randomInt(limit);

function chooseRarity(){
  const total=Object.values(WEIGHTS).reduce((a,b)=>a+b,0);
  let roll=randomInt(total);
  for(const[rarity,weight]of Object.entries(WEIGHTS)){roll-=weight;if(roll<0)return rarity}
  return 'Common';
}

function drawCard(collection=[],pity=0){
  let rarity;
  if(pity>=19)rarity='Rare';
  else rarity=chooseRarity();
  let pool=CARDS.filter(c=>c.rarity===rarity);
  if(!pool.length)pool=CARDS.filter(c=>c.rarity==='Common');
  if(collection.length){
    const newCards=pool.filter(c=>!collection.includes(c.id));
    if(newCards.length)pool=newCards;
  }
  const card=pool[randomInt(pool.length)];
  return card;
}

module.exports={CARDS,WEIGHTS,drawCard};
