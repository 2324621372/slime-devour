export const STAGES = [
  {name:'微尘', min:0, ref:.45}, {name:'小宠', min:1, ref:1.2},
  {name:'桌宠', min:3, ref:3.5}, {name:'房间', min:8, ref:9},
  {name:'街区', min:20, ref:22}, {name:'城市', min:50, ref:55}
];
export const canEat = (player, prey) => prey <= player * .95;
export const grow = (r, prey, absorb=.85) => Math.cbrt(r**3 + prey**3 * absorb);
export const multiplier = combo => 1 + Math.min(combo,50)*.08;
export function scoreFor(player,prey,combo,stage=0,base=12){
  const ratio=prey/player;
  const danger=ratio>=.8?1.2+Math.min(1,(ratio-.8)/.15)*.8:1;
  const perfect=ratio>.9;
  return {points:Math.max(1,Math.floor((base+4/3*Math.PI*prey**3*10)*multiplier(combo)*danger*(1+stage*.15)*(perfect?1.5:1))),perfect};
}
export function objective(level,s){
  switch(level.id){
    case 1:return {value:s.eaten,target:20,label:'吞噬小果冻',done:s.eaten>=20};
    case 2:case 6:return {value:s.radius,target:level.target,label:'成长体型',done:s.radius>=level.target};
    case 3:return {value:Math.min(s.elapsed/60,s.eaten/30),target:1,label:`存活 ${Math.floor(s.elapsed)}/60秒 · 吞噬 ${s.eaten}/30`,done:s.elapsed>=60&&s.eaten>=30};
    case 4:case 10:return {value:s.bossTotal-s.bossHP,target:s.bossTotal,label:s.bossHP?`击败${level.id===4?'面包屑王':'熔岩领主'} · 虚弱时碰撞反击`:'Boss 已击败',done:s.bossHP<=0};
    case 5:return {value:s.eaten,target:45,label:'限时吞噬',done:s.eaten>=45};
    case 7:return {value:s.eaten,target:40,label:'无伤吞噬 · 避开激光',done:s.eaten>=40&&s.hits===0};
    case 8:return {value:s.maxCombo,target:25,label:'最高连击',done:s.maxCombo>=25};
    case 9:return {value:s.radius,target:6,label:`冰面成长 · 存活 ${Math.floor(s.elapsed)}/90秒`,done:s.radius>=6&&s.elapsed>=90};
    case 11:return {value:s.eaten,target:60,label:'零重力限时吞噬',done:s.eaten>=60};
    case 12:return {value:Math.min(s.radius/8,s.eaten/80,s.elapsed/120,s.bossHP<=0?1:0),target:1,label:`体型 ${s.radius.toFixed(1)}/8 · 吞 ${s.eaten}/80 · ${Math.floor(s.elapsed)}/120秒 · 精英 ${s.bossHP<=0?'已击败':'存活'}`,done:s.radius>=8&&s.eaten>=80&&s.elapsed>=120&&s.bossHP<=0};
    default:throw new Error('Unknown level');
  }
}
export function starsFor(level,s){
  if(!objective(level,s).done)return 0;
  if(s.score<level.starScore)return 1;
  const third=level.starType==='无伤'?s.hits===0:level.starType==='连击'?s.maxCombo>=level.starValue:s.elapsed<=level.starValue;
  return third?3:2;
}