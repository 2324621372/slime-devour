import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

// Keep the original bounds: render detail must not change collision footprints.
export function detailedBox(width=1,height=1,depth=1){
 const radius=Math.min(width,height,depth)*.12;
 return new RoundedBoxGeometry(width,height,depth,1,radius);
}