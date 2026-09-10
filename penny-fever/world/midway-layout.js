// Scene layout only. Keep Aura's service point separate from the physical building.
export const PAPER_STALL_STEP=12;
export const PAPER_STALL_START=22;
export const AURA_SERVICE={x:-1.5,z:10.7};
// The guest stands in the reachable aisle, with Aura outside the nearby booth.
export const AURA_APPROACH={x:-.78,z:11.1,minSide:.58,halfDepth:1.3};
export function atTicketCounter(position){
 return position.x<=-AURA_APPROACH.minSide&&position.x>=-1.62&&Math.abs(position.z-AURA_APPROACH.z)<AURA_APPROACH.halfDepth;
}
export function ticketInspectionTarget(position){
 return atTicketCounter(position)?{id:'aura-ticket-booth',name:'Aura’s ticket booth',kind:'ticket',atCounter:true,side:-1,
  worldX:AURA_APPROACH.x,worldZ:AURA_APPROACH.z,stallX:TICKET_BUILDING.x,stallZ:TICKET_BUILDING.z}:null;
}
export const TICKET_BUILDING={x:-3.2,z:13,yaw:Math.PI*.70,scale:.82,radius:1.15};
export const PAPER_LOOP_START={x:0,z:7.8};
// A little after the opposing vendor, leaving clear space before the next one.
export const AMUSEMENT_BAY_OFFSET=.35;
export function amusementFacing(x){return Math.atan2(-x,-4.2);}
