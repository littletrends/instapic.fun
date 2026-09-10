// Catalogue ids used as play pieces and chapter prizes. Paths match the
// transparent turnaround pack. Workshop play never writes the pocket.
export const items = {
  'everyday-penny': {collection:'pennies', name:'Everyday penny'},
  'moon-penny': {collection:'pennies', name:'Moon penny'},
  'rose-penny': {collection:'pennies', name:'Rose penny'},
  'star-token': {collection:'pennies', name:'Star token'},
  'crown-token': {collection:'pennies', name:'Crown token'},
  'penny-purse': {collection:'pennies', name:'Penny purse'},
  'coin-sleeve': {collection:'gift-wrapping', name:'Coin sleeve'},
  'copper-cascade': {collection:'game-prizes', name:'Copper cascade'},
  'penny-tree': {collection:'game-prizes', name:'Penny tree'},
  'trade-envelope': {collection:'gift-wrapping', name:'Trade envelope'},
  'sealed-secret': {collection:'alley-curios', name:'Sealed secret'},
  'return-postcard': {collection:'tickets', name:'Return postcard'},
  'message-bottle': {collection:'future-curios', name:'Message bottle'},
  'charm-pouch': {collection:'gift-wrapping', name:'Charm pouch'},
  'whisper-charm': {collection:'alley-curios', name:'Whisper charm'},
  'secret-keeper': {collection:'parlour-prizes', name:'Secret keeper'},
  'ticket-satchel': {collection:'wearables', name:'Ticket satchel'},
  'lucky-match': {collection:'alley-curios', name:'Lucky match'},
  'pressed-heart': {collection:'alley-curios', name:'Pressed heart'},
  'pocket-observatory': {collection:'parlour-prizes', name:'Pocket observatory'},
  'penny-collector-book': {collection:'collector-books', name:'Penny collector book'},
  'night-suitcase': {collection:'garden-prizes', name:'Night suitcase'},
  'heart-biscuit': {collection:'sweet-treats', name:'Heart biscuit'},
  'rose-hair-bow': {collection:'wearables', name:'Rose hair bow'},
  'rose-press': {collection:'parlour-prizes', name:'Rose press'},
  'rose-lockbox': {collection:'parlour-prizes', name:'Rose lockbox'},
  'clockwork-key': {collection:'machine-curios', name:'Clockwork key'},
  'cabinet-key': {collection:'parlour-prizes', name:'Cabinet key'},
  'heart-gear': {collection:'machine-curios', name:'Heart gear'},
  'display-dome': {collection:'gift-wrapping', name:'Display dome'},
  'clockwork-butterfly': {collection:'future-curios', name:'Clockwork butterfly'},
  'crowned-duck': {collection:'garden-prizes', name:'Crowned duck'},
  'brave-try-ribbon': {collection:'awards', name:'Brave-try ribbon'},
  'lucky-dish': {collection:'garden-prizes', name:'Lucky dish'},
};

export const spriteKey = id => {
  const item = items[id];
  return item ? item.collection+'/'+id : id;
};
export const itemName = id => items[id]?.name || id;
export const kits = {
  'coin-pusher': {
    sprites: ['everyday-penny','moon-penny','rose-penny','star-token','crown-token'],
    prizes: ['coin-sleeve','copper-cascade','penny-tree'],
  },
  whisper: {
    sprites: ['trade-envelope','sealed-secret','return-postcard','message-bottle','charm-pouch'],
    prizes: ['whisper-charm','charm-pouch','secret-keeper'],
  },
  pack: {
    sprites: ['night-suitcase','ticket-satchel','penny-purse','coin-sleeve','lucky-match','whisper-charm','pocket-observatory'],
    prizes: ['pressed-heart','penny-purse','penny-collector-book'],
  },
  love: {
    sprites: ['pressed-heart','heart-biscuit','rose-penny','rose-lockbox'],
    prizes: ['rose-hair-bow','rose-press','rose-lockbox'],
  },
  curios: {
    sprites: ['clockwork-key','cabinet-key','heart-gear','display-dome','clockwork-butterfly'],
    prizes: ['clockwork-key','display-dome','clockwork-butterfly'],
  },
  'duck-pond': {
    sprites: ['crowned-duck'],
    prizes: ['brave-try-ribbon','lucky-dish','crowned-duck'],
  },
};
