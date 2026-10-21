// Fixed catalog sizes. Neither the player's radius nor the stage changes an object.
export const CATALOG=[
 {kind:'dust',stage:0,sizes:[.12,.2,.32,.5]},
 {kind:'sugar',stage:0,sizes:[.16,.26,.42,.7]},
 {kind:'bug',stage:1,sizes:[1.05,1.45,2.1]},
 {kind:'cap',stage:1,sizes:[1.1,1.65,2.5]},
 {kind:'cup',stage:2,sizes:[3.1,4.2,6]},
 {kind:'fruit',stage:2,sizes:[3.2,4.6,6.5]},
 {kind:'chair',stage:3,sizes:[8.1,11,16]},
 {kind:'pet',stage:3,sizes:[8.3,12,17]},
 {kind:'car',stage:4,sizes:[20.5,28,39]},
 {kind:'streetlamp',stage:4,sizes:[21,30,42]},
 {kind:'building',stage:5,sizes:[50.5,66,85]},
 {kind:'tower',stage:5,sizes:[54,75,100]}
];
export const MAP_EDGE=680;
export function catalogItem(index,variant=0){const c=CATALOG[index%CATALOG.length];return {kind:c.kind,preyStage:c.stage,radius:c.sizes[variant%c.sizes.length]};}