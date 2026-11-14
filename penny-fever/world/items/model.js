/* Shared inventory rules. Existing currency, ticket and curio saves stay authoritative. */
(() => {
  'use strict';
  const rows = [
    ['everyday-penny','Everyday penny','Essentials','currency',null,'Aura’s ticket booth','Loose pennies in your pocket. Pack five into a 5-pack to keep them out of Copper’s machine. Open a pack here when you want them back.',.07,'pennies'],
    ['ticket-roll','Ticket roll','Essentials','scrip',null,'Aura’s ticket booth','Booth tickets torn from Aura’s brass roll. One ticket enters a stall. Cash one at Copper Falls or Pip’s tables for five pennies.',.08,'tickets'],
    ['admission-ticket','Admission ticket','Essentials','ticket',null,'Aura’s ticket booth','Take a ticket from Aura. Its punched heart remembers your entry.',.025,'tickets'],
    ['showman-pass','Showman pass','Essentials','pass',null,'Backstage · Bea','The demo Showman pass lasts until midnight in Darwin.',.06,'tickets'],
    ['ticket-stub','Ticket stub','Alley Ephemera','curio','ticket_stub','Mystic · Iris','Gaze into Iris’s crystal at the Mystic Tent.',.035,'alley-curios'],
    ['pressed-heart','Pressed heart','Alley Ephemera','curio','pressed_heart','Night Kit · Kit','Mint a pressed penny pack.',.08,'alley-curios'],
    ['lucky-match','Lucky match','Workshop prizes','prize','lucky_match','Spiral Slide · Tilly','Chapter 3 of Spiral Slide.',.07,'alley-curios'],
    ['whisper-charm','Whisper charm','Alley Ephemera','curio','whisper_charm','Whisper · Willa','Seal a kind word at the Whisper booth.',.09,'alley-curios'],
    ['mirror-shard','Mirror shard','Alley Ephemera','curio','mirror_shard','Mystic · Iris','A cream-ticket fortune catches the light.',.06,'alley-curios'],
    ['showman-ribbon','Showman ribbon','Alley Ephemera','curio','showman_ribbon','Backstage · Bea','Complete a backstage stage, or try the demo Showman pass.',.065,'alley-curios'],
    ['mercury-bead','Mercury bead','Workshop prizes','prize','mercury_bead','Spiral Slide · Tilly','Chapter 5 of Spiral Slide.',.17,'machine-curios'],
    ['gyro-ghost','Gyro ghost','Machine Guts','curio','gyro_ghost','Star-Gazing · Celeste','Look up, darling.',.16,'machine-curios'],
    ['shutter-click','Shutter click','Machine Guts','curio','shutter_click','Flash Booth · Felix','Catch a moment at SNAP.',.09,'machine-curios'],
    ['sweet-heat','Sweet heat','Machine Guts','curio','sweet_heat','Love Tester · Rosalie','Reach depth three or take home a Love Tester souvenir.',.15,'machine-curios'],
    ['coin-slot','Coin slot','Machine Guts','curio','coin_slot','Backstage · Bea','Complete a backstage stage, or try the demo Showman pass.',.085,'machine-curios'],
    ['marquee-bulb','Marquee bulb','Machine Guts','curio','marquee_bulb','Boardwalk Lights · Lumi','Light the marquee, or find an olive-lamp fortune.',.14,'machine-curios'],
    ['night-suitcase','Night suitcase','Workshop prizes','prize',null,'The Impossible Suitcase · Kit','Chapter 6 of The Impossible Suitcase.',.24,'garden-prizes'],
    ['moonlight-wardrobe','Moonlight wardrobe','Collection rewards','reward',null,'Alley collection','Collect all six Alley Ephemera to receive this costume keepsake book.',.12,'paper-doll-books'],
    ['coin-sleeve','Coin sleeve','Workshop prizes','prize',null,'Copper Falls · Copper','Catch pennies at Copper Falls.',.08,'gift-wrapping'],
    ['copper-cascade','Copper cascade','Workshop prizes','prize',null,'Copper Falls · Copper','Finish the moon mint at Copper Falls.',.12,'game-prizes'],
    ['penny-tree','Penny tree','Workshop prizes','prize',null,'Copper Falls · Copper','Settle the crowded mint at Copper Falls.',.14,'game-prizes'],
    ['charm-pouch','Charm pouch','Workshop prizes','prize',null,'Whisper Run · Willa','Chapter 2 of Whisper Run.',.08,'gift-wrapping'],
    ['secret-keeper','Secret keeper','Workshop prizes','prize',null,'Whisper Run · Willa','Chapter 3 of Whisper Run.',.12,'parlour-prizes'],
    ['penny-purse','Penny purse','Workshop prizes','prize',null,'Copper Falls · Copper','Win the purse off Copper’s trays. Spendable pennies live here. After it is yours, five-penny stacks back up inside it.',.1,'pennies'],
    ['penny-collector-book','Penny collector book','Workshop prizes','prize',null,'Aura’s VIP tradeshow','Claim with 5 star tokens, 3 moon pennies, 1 rose penny and 1 crown token.',.12,'collector-books'],
    ['aura-treasures-collector-book','Aura treasures collector book','Workshop prizes','prize',null,'Aura’s VIP tradeshow','Special addition · 5 XRP. You can collect the charms without this book.',.12,'aura-limited'],
    ['alley-backgrounds-collector-book','Alley backgrounds collector book','Workshop prizes','prize',null,'Aura’s VIP tradeshow','Special addition · 5 XRP. You can collect the alley plates without this book.',.12,'aura-limited'],
    ['aura-and-carnival-collector-book','Aura and carnival collector book','Workshop prizes','prize',null,'Aura’s VIP tradeshow','Special addition · 5 XRP. You can collect the carnival figures without this book.',.12,'aura-limited'],
    ['rose-hair-bow','Rose hair bow','Workshop prizes','prize',null,'Love Tester · Rosalie','Chapter 1 of Love Tester.',.08,'wearables'],
    ['rose-press','Rose press','Workshop prizes','prize',null,'Love Tester · Rosalie','Chapter 5 of Love Tester.',.1,'parlour-prizes'],
    ['rose-lockbox','Rose lockbox','Workshop prizes','prize',null,'Love Tester · Rosalie','Chapter 6 of Love Tester.',.12,'parlour-prizes'],
    ['clockwork-key','Clockwork key','Workshop prizes','prize',null,'The Cabinet That Lies · Digby','Chapter 1 of The Cabinet That Lies.',.1,'machine-curios'],
    ['heart-gear','Heart gear','Workshop prizes','prize',null,'Peggy’s Marble Mill · Peggy','Chapter 3 of Peggy’s Marble Mill.',.1,'machine-curios'],
    ['display-dome','Display dome','Workshop prizes','prize',null,'The Cabinet That Lies · Digby','Chapter 2 of The Cabinet That Lies.',.12,'gift-wrapping'],
    ['clockwork-butterfly','Clockwork butterfly','Workshop prizes','prize',null,'The Cabinet That Lies · Digby','Chapter 3 of The Cabinet That Lies.',.16,'future-curios'],
    ['brave-try-ribbon','Brave-try ribbon','Workshop prizes','prize',null,'Duckling Parade · Dottie','Bring the first little wanderers home.',.07,'awards'],
    ['lucky-dish','Lucky dish','Workshop prizes','prize',null,'The Topsy Dairy · Mabel','Clear both parlour stacks.',.1,'garden-prizes'],
    ['crowned-duck','Crowned duck','Workshop prizes','prize',null,'Duckling Parade · Dottie','Finish the grand duck parade.',.12,'garden-prizes'],
    ['coin-album','Coin album','Workshop prizes','prize',null,'Copper Falls · Copper','Chapter 4 of Copper Falls.',.1,'pennies'],
    ['treasure-tin','Treasure tin','Workshop prizes','prize',null,'Copper Falls · Copper','Chapter 5 of Copper Falls.',.1,'gift-wrapping'],
    ['five-penny-stack','Five-penny stack','Essentials','currency',null,'Aura’s till · Copper Falls','Five pennies packed away. They stay out of a full-purse drop. Pack or open them here, at Copper Falls, or in the alley menu.',.1,'pennies'],
    ['mint-press','Mint press','Workshop prizes','prize',null,'Copper Falls · Copper','Chapter 6 of Copper Falls. The little press that mints the tide.',.1,'game-prizes'],
    ['surprise-parcel','Surprise parcel','Workshop prizes','prize',null,'Whisper Run · Willa','Chapter 4 of Whisper Run.',.1,'gift-wrapping'],
    ['stamp-passport','Stamp passport','Workshop prizes','prize',null,'Whisper Run · Willa','Chapter 5 of Whisper Run.',.1,'tickets'],
    ['lost-and-found-tag','Lost-and-found tag','Workshop prizes','prize',null,'Whisper Run · Willa','Chapter 6 of Whisper Run.',.1,'working-midway'],
    ['midnight-invitation','Midnight invitation','Workshop prizes','prize',null,'The Impossible Suitcase · Kit','Chapter 5 of The Impossible Suitcase.',.1,'future-curios'],
    ['ticket-satchel','Ticket satchel','Workshop prizes','prize',null,'The Impossible Suitcase · Kit','Chapter 6 of The Impossible Suitcase.',.1,'wearables'],
    ['kindness-heart','Kindness heart','Workshop prizes','prize',null,'Love Tester · Rosalie','Chapter 2 of Love Tester.',.1,'awards'],
    ['friendship-pins','Friendship pins','Workshop prizes','prize',null,'Love Tester · Rosalie','Chapter 4 of Love Tester.',.1,'wearables'],
    ['ribbon-gift-box','Ribbon gift box','Workshop prizes','prize',null,'Love Tester · Rosalie','Chapter 3 of Love Tester.',.1,'gift-wrapping'],
    ['tin-style-robot','Tin-style robot','Workshop prizes','prize',null,'The Cabinet That Lies · Digby','Chapter 4 of The Cabinet That Lies.',.1,'toy-shelf'],
    ['crystal-cradle','Crystal cradle','Workshop prizes','prize',null,'The Cabinet That Lies · Digby','Chapter 5 of The Cabinet That Lies.',.1,'parlour-prizes'],
    ['curio-cabinet-album','Curio cabinet album','Workshop prizes','prize',null,'The Cabinet That Lies · Digby','Chapter 6 of The Cabinet That Lies.',.1,'collector-books'],
    ['sleepy-dragon','Sleepy dragon','Workshop prizes','prize',null,'Spiral Slide · Tilly','Chapter 2 of Spiral Slide.',.1,'toy-shelf'],
    ['spooky-pumpkin-friend','Spooky pumpkin friend','Workshop prizes','prize',null,'Duckling Parade · Dottie','Chapter 5 of Duckling Parade.',.1,'seasonal-treasures'],
    ['crown-turtle','Crown turtle','Workshop prizes','prize',null,'Duckling Parade · Dottie','Chapter 6 of Duckling Parade.',.1,'toy-shelf'],
    ['fortune-slip','Fortune slip','Workshop prizes','prize',null,'Iris’s Reading · Iris','Chapter 1 of Iris’s Reading.',.1,'alley-curios'],
    ['moon-penny','Moon penny','Workshop prizes','prize',null,'Copper Falls · Copper','A moon-pressed penny from the cash-drop trays.',.1,'pennies'],
    ['rose-penny','Rose penny','Workshop prizes','prize',null,'Copper Falls · Copper','A rose-pressed penny from the cash-drop trays.',.1,'pennies'],
    ['crown-token','Crown token','Workshop prizes','prize',null,'Copper Falls · Copper','A scalloped crown token from the cash-drop trays.',.1,'pennies'],
    ['moon-brooch','Moon brooch','Workshop prizes','prize',null,'Iris’s Reading · Iris','Chapter 3 of Iris’s Reading.',.1,'wearables'],
    ['fortune-journal','Fortune journal','Workshop prizes','prize',null,'Iris’s Reading · Iris','Chapter 4 of Iris’s Reading.',.1,'collector-books'],
    ['moon-festival-fan','Moon-festival fan','Workshop prizes','prize',null,'Iris’s Reading · Iris','Chapter 5 of Iris’s Reading.',.1,'seasonal-treasures'],
    ['paper-crown','Paper crown','Workshop prizes','prize',null,'Iris’s Reading · Iris','Chapter 6 of Iris’s Reading.',.1,'wearables'],
    ['juggling-bird','Juggling bird','Workshop prizes','prize',null,'Lantern Toss · Bess','Chapter 1 of Lantern Toss.',.1,'game-prizes'],
    ['patchwork-bear','Patchwork bear','Workshop prizes','prize',null,'Lantern Toss · Bess','Chapter 2 of Lantern Toss.',.1,'game-prizes'],
    ['prize-bag','Prize bag','Workshop prizes','prize',null,'Paper worlds','Won in a paper-world chapter.',.1,'gift-wrapping'],
    ['button-elephant','Button elephant','Workshop prizes','prize',null,'The Topsy Dairy · Mabel','Clear the grand pyramid.',.1,'toy-shelf'],
    ['prize-claim','Prize claim','Workshop prizes','prize',null,'Lantern Toss · Bess','Chapter 5 of Lantern Toss.',.1,'tickets'],
    ['midway-scarf','Midway scarf','Workshop prizes','prize',null,'Lantern Toss · Bess','Chapter 6 of Lantern Toss.',.1,'wearables'],
    ['photo-accordion','Photo accordion','Workshop prizes','prize',null,'Laughing Doorway · Juno','Chapter 2 of Laughing Doorway.',.1,'collector-books'],
    ['memory-camera','Memory camera','Workshop prizes','prize',null,'Paper Safari · Felix','Chapter 3 of Paper Safari.',.1,'parlour-prizes'],
    ['ride-stamp-book','Ride stamp book','Workshop prizes','prize',null,'Paper worlds','Won in a paper-world chapter.',.1,'collector-books'],
    ['first-visit-badge','First-visit badge','Workshop prizes','prize',null,'Paper Safari · Felix','Chapter 5 of Paper Safari.',.1,'awards'],
    ['pocket-theatre','Pocket theatre','Workshop prizes','prize',null,'The Missing Frames · Milo','Chapter 6 of The Missing Frames.',.1,'toy-shelf'],
    ['lightning-pin','Lightning pin','Workshop prizes','prize',null,'Thunder Garden · Pip','Chapter 1 of Thunder Garden.',.1,'game-prizes'],
    ['star-token','Star token','Workshop prizes','prize',null,'Paper worlds','Won in a paper-world chapter.',.1,'pennies'],
    ['pegboard-star','Pegboard star','Workshop prizes','prize',null,'Moonbow Alley · Skip','Chapter 3 of Moonbow Alley.',.1,'wonder-prizes'],
    ['summer-sun-pin','Summer sun pin','Workshop prizes','prize',null,'Moonbow Alley · Skip','Chapter 6 of Moonbow Alley.',.1,'seasonal-treasures'],
    ['bullseye-clock','Bullseye clock','Workshop prizes','prize',null,'Thunder Garden · Pip','Chapter 5 of Thunder Garden.',.1,'garden-prizes'],
    ['new-year-star-cracker','New-year star cracker','Workshop prizes','prize',null,'Light the Night · Lumi','Chapter 5 of Light the Night.',.1,'seasonal-treasures'],
    ['dairy-calf','Dairy calf','Workshop prizes','prize',null,'The Topsy Dairy · Mabel','Clear the full dairy pyramid.',.1,'game-prizes'],
    ['alley-collector-cup','Alley collector cup','Workshop prizes','prize',null,'The Topsy Dairy · Mabel','Clear Mabel’s high shelf.',.1,'awards'],
    ['cocoa-cup','Cocoa cup','Workshop prizes','prize',null,'The Topsy Dairy · Mabel','Clear the three little dairies.',.1,'sweet-treats'],
    ['crown-hatbox','Crown hatbox','Workshop prizes','prize',null,'The Topsy Dairy · Mabel','Clear the tall and the tiny stacks.',.1,'doll-accessories'],
    ['perfect-circle','Perfect circle','Workshop prizes','prize',null,'Patchwork Moon · Dot','Chapter 1 of Patchwork Moon.',.1,'game-prizes'],
    ['pressed-flower-book','Pressed flower book','Workshop prizes','prize',null,'Patchwork Moon · Dot','Chapter 2 of Patchwork Moon.',.1,'collector-books'],
    ['spring-seed-packet','Spring seed packet','Workshop prizes','prize',null,'Patchwork Moon · Dot','Chapter 4 of Patchwork Moon.',.1,'seasonal-treasures'],
    ['garden-party-book','Garden-party book','Workshop prizes','prize',null,'Patchwork Moon · Dot','Chapter 5 of Patchwork Moon.',.1,'paper-doll-books'],
    ['charm-display-case','Charm display case','Workshop prizes','prize',null,'Patchwork Moon · Dot','Chapter 6 of Patchwork Moon.',.1,'collector-books'],
    ['flicker-book','Flicker book','Workshop prizes','prize',null,'The Missing Frames · Milo','Chapter 1 of The Missing Frames.',.1,'wonder-prizes'],
    ['pocket-peepshow','Pocket peepshow','Workshop prizes','prize',null,'The Missing Frames · Milo','Chapter 2 of The Missing Frames.',.1,'wonder-prizes'],
    ['memory-scrapbook','Memory scrapbook','Workshop prizes','prize',null,'The Missing Frames · Milo','Chapter 3 of The Missing Frames.',.1,'collector-books'],
    ['mighty-mallet','Mighty mallet','Workshop prizes','prize',null,'Bellfoundry · Magnus','Chapter 1 of Bellfoundry.',.1,'wonder-prizes'],
    ['bell-bracelet','Bell bracelet','Workshop prizes','prize',null,'Bellfoundry · Magnus','Chapter 2 of Bellfoundry.',.1,'wearables'],
    ['bell-of-bravery','Bell of bravery','Workshop prizes','prize',null,'Bellfoundry · Magnus','Chapter 3 of Bellfoundry.',.1,'wonder-prizes'],
    ['perfect-play-medal','Perfect-play medal','Workshop prizes','prize',null,'Bellfoundry · Magnus','Chapter 4 of Bellfoundry.',.1,'awards'],
    ['midway-master-crown','Midway-master crown','Workshop prizes','prize',null,'Bellfoundry · Magnus','Chapter 5 of Bellfoundry.',.1,'awards'],
    ['ride-explorer-pennant','Ride-explorer pennant','Workshop prizes','prize',null,'Spiral Slide · Tilly','Chapter 1 of Spiral Slide.',.1,'awards'],
    ['looking-glass-locket','Looking-glass locket','Workshop prizes','prize',null,'Looking-Glass Garden · Opal','Chapter 1 of Looking-Glass Garden.',.1,'wonder-prizes'],
    ['star-fragment','Star fragment','Workshop prizes','prize',null,'A Little Starlight · Celeste','Chapter 1 of A Little Starlight.',.1,'future-curios'],
    ['winter-snow-globe','Winter snow globe','Workshop prizes','prize',null,'Looking-Glass Garden · Opal','Chapter 4 of Looking-Glass Garden.',.1,'seasonal-treasures'],
    ['winter-lantern-book','Winter-lantern book','Workshop prizes','prize',null,'Looking-Glass Garden · Opal','Chapter 5 of Looking-Glass Garden.',.1,'paper-doll-books'],
    ['sleepy-compass','Sleepy compass','Workshop prizes','prize',null,'A Little Starlight · Celeste','Chapter 4 of A Little Starlight.',.1,'future-curios'],
    ['lucky-ring-trio','Lucky ring trio','Workshop prizes','prize',null,'The Ring Orchard · Ringo','Chapter 1 of The Ring Orchard.',.1,'wonder-prizes'],
    ['splash-ring','Splash ring','Workshop prizes','prize',null,'The Ring Orchard · Ringo','Chapter 2 of The Ring Orchard.',.1,'garden-prizes'],
    ['wishing-acorn','Wishing acorn','Workshop prizes','prize',null,'The Ring Orchard · Ringo','Chapter 3 of The Ring Orchard.',.1,'future-curios'],
    ['ticket-punch','Ticket punch','Workshop prizes','prize',null,'Peggy’s Marble Mill · Peggy','Chapter 4 of Peggy’s Marble Mill.',.1,'working-midway'],
    ['stamp-and-inkpad','Stamp and inkpad','Workshop prizes','prize',null,'Peggy’s Marble Mill · Peggy','Chapter 5 of Peggy’s Marble Mill.',.1,'working-midway'],
    ['fairy-floss','Fairy floss','Workshop prizes','prize',null,'Cloud Atelier · Flossie','Chapter 1 of Cloud Atelier.',.1,'sweet-treats'],
    ['pocket-cloud','Pocket cloud','Workshop prizes','prize',null,'Cloud Atelier · Flossie','Chapter 2 of Cloud Atelier.',.1,'future-curios'],
    ['cloud-jar','Cloud jar','Workshop prizes','prize',null,'Cloud Atelier · Flossie','Chapter 3 of Cloud Atelier.',.1,'wonder-prizes'],
    ['toffee-apple','Toffee apple','Workshop prizes','prize',null,'Cloud Atelier · Flossie','Chapter 4 of Cloud Atelier.',.1,'sweet-treats'],
    ['birthday-crown-box','Birthday crown box','Workshop prizes','prize',null,'Cloud Atelier · Flossie','Chapter 6 of Cloud Atelier.',.1,'seasonal-treasures'],
    ['popcorn-carton','Popcorn carton','Workshop prizes','prize',null,'Popcorn Symphony · Poppy','Chapter 1 of Popcorn Symphony.',.1,'sweet-treats'],
    ['tiny-kettle','Tiny kettle','Workshop prizes','prize',null,'Popcorn Symphony · Poppy','Chapter 2 of Popcorn Symphony.',.1,'garden-prizes'],
    ['picnic-parcel','Picnic parcel','Workshop prizes','prize',null,'Paper Harbour · Marina','Chapter 5 of Paper Harbour.',.1,'sweet-treats'],
    ['lemon-fizz','Lemon fizz','Workshop prizes','prize',null,'Popcorn Symphony · Poppy','Chapter 5 of Popcorn Symphony.',.1,'sweet-treats'],
    ['ride-ticket','Ride ticket','Workshop prizes','prize',null,'Paper worlds','Won in a paper-world chapter.',.1,'tickets'],
    ['laughing-doorway','Laughing doorway','Workshop prizes','prize',null,'Laughing Doorway · Juno','Chapter 6 of Laughing Doorway.',.1,'ride-keepsakes'],
    ['seaside-day-book','Seaside-day book','Workshop prizes','prize',null,'Paper Harbour · Marina','Chapter 4 of Paper Harbour.',.1,'paper-doll-books'],
    ['pocket-marquee','Pocket marquee','Workshop prizes','prize',null,'Light the Night · Lumi','Chapter 2 of Light the Night.',.1,'garden-prizes'],
    ['lantern-lighter','Lantern lighter','Workshop prizes','prize',null,'Light the Night · Lumi','Chapter 3 of Light the Night.',.1,'working-midway'],
    ['midway-map','Sideshow alley map','Workshop prizes','prize',null,'Laughing Doorway · Juno','Chapter 5 of Laughing Doorway.',.1,'tickets'],
    ['aura-keepsake','Aura keepsake','Workshop prizes','prize',null,'Aura’s VIP tradeshow','Claim with 55 everyday pennies.',.1,'awards'],
    ['velvet-mask','Velvet mask','Workshop prizes','prize',null,'Backstage Run · Bea','Chapter 2 of Backstage Run.',.1,'garden-prizes'],
    ['secret-door-key','Secret door key','Workshop prizes','prize',null,'Laughing Doorway · Juno','Chapter 4 of Laughing Doorway.',.1,'future-curios'],
    ['pocket-observatory','Pocket observatory','Workshop prizes','prize',null,'A Little Starlight · Celeste','Chapter 2 of A Little Starlight.',.1,'parlour-prizes'],
    ['star-spectacles','Star spectacles','Workshop prizes','prize',null,'A Little Starlight · Celeste','Chapter 3 of A Little Starlight.',.1,'wearables'],
    ['little-sailboat','Little sailboat','Workshop prizes','prize',null,'Paper Harbour · Marina','Chapter 1 of Paper Harbour.',.1,'game-prizes'],
    ['message-bottle','Message bottle','Workshop prizes','prize',null,'Paper Harbour · Marina','Chapter 2 of Paper Harbour.',.1,'future-curios'],
    ['music-carousel','Music carousel','Workshop prizes','prize',null,'Paper worlds','Won in a paper-world chapter.',.1,'ride-keepsakes'],
    ['organ-music-box','Organ music box','Workshop prizes','prize',null,'Paper worlds','Won in a paper-world chapter.',.1,'ride-keepsakes'],
    ['pocket-wheel','Pocket wheel','Workshop prizes','prize',null,'Paper worlds','Won in a paper-world chapter.',.1,'ride-keepsakes'],
    ['balloon-bouquet','Balloon bouquet','Workshop prizes','prize',null,'Paper worlds','Won in a paper-world chapter.',.1,'ride-keepsakes'],
    ['swing-spinner','Swing spinner','Workshop prizes','prize',null,'Paper worlds','Won in a paper-world chapter.',.1,'ride-keepsakes'],
    ['spiral-tower','Spiral tower','Workshop prizes','prize',null,'Spiral Slide · Tilly','Chapter 6 of Spiral Slide.',.1,'ride-keepsakes'],
    ['painted-bay','Painted bay','Workshop prizes','prize',null,'Painted Bay · Arlo','Won in a paper-world chapter.',.1,'ride-keepsakes'],
    ['moon-lantern','Moon lantern','Workshop prizes','prize',null,'Iris’s Reading · Iris','Chapter 2 of Iris’s Reading.',.1,'parlour-prizes'],
    ['moon-rabbit','Moon rabbit','Workshop prizes','prize',null,'A Little Starlight · Celeste','Chapter 6 of A Little Starlight.',.1,'toy-shelf'],
    ['safari-frame','Mini Skee-Ball Lane','Workshop prizes','prize',null,'Paper Safari · Felix','Chapter 4 of Paper Safari.',.1,'parlour-prizes'],
    ['paper-negative','Ferris Wheel Cabin','Workshop prizes','prize',null,'Paper Safari · Felix','Chapter 6 of Paper Safari.',.1,'parlour-prizes'],
    ['autumn-leaf-lantern','Autumn-leaf lantern','Workshop prizes','prize',null,'Lantern Toss · Bess','Chapter 3 of Lantern Toss.',.1,'seasonal-treasures'],
    ['thunder-marble','Thunder marble','Workshop prizes','prize',null,'Thunder Garden · Pip','Chapter 2 of Thunder Garden.',.1,'game-prizes'],
    ['glass-kicker','Glass kicker','Workshop prizes','prize',null,'Thunder Garden · Pip','Chapter 3 of Thunder Garden.',.1,'game-prizes'],
    ['flipper-badge','Flipper badge','Workshop prizes','prize',null,'Thunder Garden · Pip','Chapter 4 of Thunder Garden.',.1,'game-prizes'],
    ['cabinet-spark','Cabinet spark','Workshop prizes','prize',null,'Thunder Garden · Pip','Chapter 6 of Thunder Garden.',.1,'game-prizes'],
    ['harbour-washer','Harbour washer','Workshop prizes','prize',null,'Paper Harbour · Marina','Chapter 3 of Paper Harbour.',.1,'garden-prizes'],
    ['return-postcard','Return postcard','Workshop prizes','prize',null,'Paper Harbour · Marina','Chapter 6 of Paper Harbour.',.1,'tickets'],
    ['cream-churn','Cream churn','Workshop prizes','prize',null,'The Topsy Dairy · Mabel','Chapter 6 of The Topsy Dairy.',.1,'garden-prizes'],
    ['felt-moon-disc','Felt moon disc','Workshop prizes','prize',null,'Patchwork Moon · Dot','Chapter 3 of Patchwork Moon.',.1,'garden-prizes'],
    ['dapper-fox','Dapper fox','Workshop prizes','prize',null,'The Missing Frames · Milo','Chapter 5 of The Missing Frames.',.1,'toy-shelf'],
    ['foundry-spark','Foundry spark','Workshop prizes','prize',null,'Bellfoundry · Magnus','Chapter 6 of Bellfoundry.',.1,'wonder-prizes'],
    ['folding-mirror','Folding mirror','Workshop prizes','prize',null,'Looking-Glass Garden · Opal','Chapter 3 of Looking-Glass Garden.',.1,'wonder-prizes'],
    ['glass-garden-key','Glass garden key','Workshop prizes','prize',null,'Looking-Glass Garden · Opal','Chapter 6 of Looking-Glass Garden.',.1,'wonder-prizes'],
    ['twig-ring','Twig ring','Workshop prizes','prize',null,'The Ring Orchard · Ringo','Chapter 4 of The Ring Orchard.',.1,'wonder-prizes'],
    ['orchard-circlet','Orchard circlet','Workshop prizes','prize',null,'The Ring Orchard · Ringo','Chapter 5 of The Ring Orchard.',.1,'wearables'],
    ['ring-toss-ribbon','Ring-toss ribbon','Workshop prizes','prize',null,'The Ring Orchard · Ringo','Chapter 6 of The Ring Orchard.',.1,'awards'],
    ['mill-marble','Mill marble','Workshop prizes','prize',null,'Peggy’s Marble Mill · Peggy','Chapter 1 of Peggy’s Marble Mill.',.1,'game-prizes'],
    ['gate-token','Gate token','Workshop prizes','prize',null,'Peggy’s Marble Mill · Peggy','Chapter 2 of Peggy’s Marble Mill.',.1,'working-midway'],
    ['marble-tin','Marble tin','Workshop prizes','prize',null,'Peggy’s Marble Mill · Peggy','Chapter 6 of Peggy’s Marble Mill.',.1,'gift-wrapping'],
    ['swirl-lolly','Swirl lolly','Workshop prizes','prize',null,'Cloud Atelier · Flossie','Chapter 5 of Cloud Atelier.',.1,'sweet-treats'],
    ['kettle-corn-bag','Kettle-corn bag','Workshop prizes','prize',null,'Popcorn Symphony · Poppy','Chapter 4 of Popcorn Symphony.',.1,'sweet-treats'],
    ['butter-kernel','Butter kernel','Workshop prizes','prize',null,'Popcorn Symphony · Poppy','Chapter 6 of Popcorn Symphony.',.1,'sweet-treats'],
    ['pond-lily-dish','Pond lily dish','Workshop prizes','prize',null,'Duckling Parade · Dottie','Chapter 2 of Duckling Parade.',.1,'garden-prizes'],
    ['silver-cup-chip','Silver cup chip','Workshop prizes','prize',null,'Moonbow Alley · Skip','Chapter 1 of Moonbow Alley.',.1,'awards'],
    ['lane-wax','Lane wax','Workshop prizes','prize',null,'Moonbow Alley · Skip','Chapter 2 of Moonbow Alley.',.1,'working-midway'],
    ['moonbow-stub','Skee-Ball Scoring Rings','Workshop prizes','prize',null,'Moonbow Alley · Skip','Chapter 4 of Moonbow Alley.',.1,'tickets'],
    ['score-card','Score card','Workshop prizes','prize',null,'Moonbow Alley · Skip','Chapter 5 of Moonbow Alley.',.1,'tickets'],
    ['well-wish-penny','Well-wish penny','Workshop prizes','prize',null,'Wishing Wells · Penelope','Chapter 1 of Wishing Wells.',.1,'pennies'],
    ['skipping-stone','Skipping Penny','Workshop prizes','prize',null,'Wishing Wells · Penelope','Chapter 2 of Wishing Wells.',.1,'garden-prizes'],
    ['well-coin','Well coin','Workshop prizes','prize',null,'Wishing Wells · Penelope','Chapter 3 of Wishing Wells.',.1,'pennies'],
    ['three-well-plaque','Three-well plaque','Workshop prizes','prize',null,'Wishing Wells · Penelope','Chapter 4 of Wishing Wells.',.1,'garden-prizes'],
    ['wish-ribbon','Wish ribbon','Workshop prizes','prize',null,'Wishing Wells · Penelope','Chapter 5 of Wishing Wells.',.1,'awards'],
    ['well-claim','Well claim','Workshop prizes','prize',null,'Wishing Wells · Penelope','Chapter 6 of Wishing Wells.',.1,'tickets'],
    ['dunk-plate','Dunk plate','Workshop prizes','prize',null,'Splashworks · Duncan','Chapter 1 of Splashworks.',.1,'game-prizes'],
    ['barker-hat','Barker hat','Workshop prizes','prize',null,'Splashworks · Duncan','Chapter 2 of Splashworks.',.1,'wearables'],
    ['splash-bead','Splash bead','Workshop prizes','prize',null,'Splashworks · Duncan','Chapter 3 of Splashworks.',.1,'garden-prizes'],
    ['wet-bell','Wet bell','Workshop prizes','prize',null,'Splashworks · Duncan','Chapter 4 of Splashworks.',.1,'wonder-prizes'],
    ['towel-flag','Ribbon-Tied Towel','Workshop prizes','prize',null,'Splashworks · Duncan','Chapter 5 of Splashworks.',.1,'wearables'],
    ['seltzer-bottle','Seltzer bottle','Workshop prizes','prize',null,'Splashworks · Duncan','Chapter 6 of Splashworks.',.1,'sweet-treats'],
    ['marquee-stub','Marquee stub','Workshop prizes','prize',null,'Light the Night · Lumi','Chapter 6 of Light the Night.',.1,'tickets'],
    ['sealed-secret','Sealed secret','Workshop prizes','prize',null,'The Impossible Suitcase · Kit','Chapter 4 of The Impossible Suitcase.',.1,'alley-curios'],
    ['cue-script','Cue script','Workshop prizes','prize',null,'Backstage Run · Bea','Chapter 1 of Backstage Run.',.1,'alley-curios'],
    ['cue-card','Cue card','Workshop prizes','prize',null,'Backstage Run · Bea','Chapter 5 of Backstage Run.',.1,'tickets'],
    ['stage-door-pass','Stage-door pass','Workshop prizes','prize',null,'Backstage Run · Bea','Chapter 6 of Backstage Run.',.1,'tickets'],
    ['midway-uniforms','Midway uniforms','Costume books','prize',null,'Edit character · costumes','Buy at the paper-doll collection, or win it on the boards.',.1,'paper-doll-books'],
    ['felix-vendor-portrait-book','Instapic Photo Booth — Penny Fever Vendors','Photo Booth Collection','prize',null,'Aura’s VIP tradeshow','Claim with 5 star tokens and 1 moon penny. Portraits still unlock at Felix’s photo booth.',.1,'collector-books'],
    ['backstage-costume-book','Backstage costume book','Costume books','prize',null,'Edit character · costumes','Harlequin tunic, theatre cape and bowler — sold at Edit character.',.1,'paper-doll-books'],
    ['blank-designer-book','Blank designer book','Costume books','prize',null,'Edit character · costumes','Uncoloured outlines and a tiny pencil for outfits still to come.',.1,'paper-doll-books'],
    ['wardrobe-trunk','Wardrobe trunk','Costume extras','prize',null,'Edit character · costumes','Olive hinged trunk with a clothes rail for paper outfits.',.1,'doll-accessories'],
    ['doll-display-stand','Doll display stand','Costume extras','prize',null,'Edit character · costumes','Gold scalloped stand with a back-support slot.',.1,'doll-accessories'],
    ['tab-repair-kit','Tab repair kit','Costume extras','prize',null,'Edit character · costumes','Fold-over tabs and brass-style paper fasteners.',.1,'doll-accessories'],
    ['mini-shoe-box','Mini shoe box','Costume extras','prize',null,'Edit character · costumes','Burgundy shoe box with tiny paper Mary Janes.',.1,'doll-accessories'],
    ['accessory-envelope','Accessory envelope','Costume extras','prize',null,'Edit character · costumes','Little paper bags, glasses and hair bows.',.1,'doll-accessories'],
    ['fold-out-bedroom','Fold-out bedroom','Workshop prizes','prize',null,'Laughing Doorway · Juno','Chapter 3 of Laughing Doorway.',.1,'doll-accessories'],
    ['travel-stage','Travel stage','Costume extras','prize',null,'Edit character · costumes','A suitcase that unfolds into a tiny paper-doll theatre.',.1,'doll-accessories'],
  ];
  // Chapter designer treasures with preserved, stable item IDs.
  rows.push(
    ["film-reel", "Film Reel", "Workshop prizes", "prize", null, "Penny Fever chapter", "Find this treasure in its assigned chapter.", 0.1, "parlour-prizes"],
    ["film-frame", "Film Frame", "Workshop prizes", "prize", null, "Spiral Slide · Tilly", "Chapter 4 of Spiral Slide.", 0.1, "parlour-prizes"],
    ["curtained-stage", "Curtained Stage", "Workshop prizes", "prize", null, "Penny Fever chapter", "Find this treasure in its assigned chapter.", 0.1, "toy-shelf"],
    ["alley-panel-kit", "Alley Panel Kit", "Workshop prizes", "prize", null, "Penny Fever chapter", "Find this treasure in its assigned chapter.", 0.1, "ride-keepsakes"],
    ["cabinet-key", "Cabinet Key", "Workshop prizes", "prize", null, "Penny Fever chapter", "Find this treasure in its assigned chapter.", 0.1, "parlour-prizes"],
    ["flight-bell", "Flight Bell", "Workshop prizes", "prize", null, "Penny Fever chapter", "Find this treasure in its assigned chapter.", 0.1, "ride-keepsakes"],
    ["heart-biscuit", "Heart Biscuit", "Workshop prizes", "prize", null, "Penny Fever chapter", "Find this treasure in its assigned chapter.", 0.1, "sweet-treats"],
    ["heart-ribbon-rosette", "Heart Ribbon Rosette", "Workshop prizes", "prize", null, "Penny Fever chapter", "Find this treasure in its assigned chapter.", 0.1, "parlour-prizes"],
    ["original-crew-book", "Original Crew Book", "Workshop prizes", "prize", null, "Penny Fever chapter", "Find this treasure in its assigned chapter.", 0.1, "paper-doll-books"],
    ["paper-offcuts", "Paper Offcuts", "Workshop prizes", "prize", null, "Penny Fever chapter", "Find this treasure in its assigned chapter.", 0.1, "working-midway"],
    ["perforated-paper-roll", "Perforated Paper Roll", "Workshop prizes", "prize", null, "Penny Fever chapter", "Find this treasure in its assigned chapter.", 0.1, "machine-curios"],
    ["repair-toolbox", "Repair Toolbox", "Workshop prizes", "prize", null, "Penny Fever chapter", "Find this treasure in its assigned chapter.", 0.1, "working-midway"],
    ["rose-heart-basket", "Rose Heart Basket", "Workshop prizes", "prize", null, "Penny Fever chapter", "Find this treasure in its assigned chapter.", 0.1, "garden-prizes"],
    ["singing-bird", "Singing Bird", "Workshop prizes", "prize", null, "Penny Fever chapter", "Find this treasure in its assigned chapter.", 0.1, "toy-shelf"],
    ["till-drawer", "Till Drawer", "Workshop prizes", "prize", null, "Penny Fever chapter", "Find this treasure in its assigned chapter.", 0.1, "working-midway"],
    ["trade-envelope", "Trade Envelope", "Workshop prizes", "prize", null, "Penny Fever chapter", "Find this treasure in its assigned chapter.", 0.1, "gift-wrapping"],
    ["vendor-ledger", "Vendor Ledger", "Workshop prizes", "prize", null, "Laughing Doorway · Juno", "Chapter 1 of Laughing Doorway.", 0.1, "working-midway"],
  );
    // Aura Limited tradeshow sets. Not chapter prizes.
    rows.push(
      ["aura-booth-snow-globe", "Aura booth snow globe", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition charm \u00b7 2 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["aura-star-compass", "Aura star compass", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition charm \u00b7 2 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["aura-wishing-teapot", "Aura wishing teapot", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition charm \u00b7 2 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["carnival-moon-music-box", "Carnival moon music box", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition charm \u00b7 2 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["instapic-camera-charm", "Instapic camera charm", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition charm \u00b7 2 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["little-trends-carousel-horse", "Little Trends carousel horse", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition charm \u00b7 2 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["little-trends-sewing-carriage", "Little Trends sewing carriage", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition charm \u00b7 2 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["memory-ticket-clock", "Memory ticket clock", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition charm \u00b7 2 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["penny-fever-crown", "Penny Fever crown", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition charm \u00b7 2 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["penny-fever-royal-key", "Penny Fever royal key", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition charm \u00b7 2 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["rose-penny-locket", "Rose penny locket", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition charm \u00b7 2 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["starlight-parasol", "Starlight parasol", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition charm \u00b7 2 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-alley-alley-wall-bay", "Alley \u00b7 Painted Bay", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition alley plate \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-alley-aura-ticket-booth", "Alley \u00b7 Aura\u2019s ticket booth", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition alley plate \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-alley-ball-toss", "Alley \u00b7 Impossible Plates", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition alley plate \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-alley-balloon-tree", "Alley \u00b7 Balloon Garden", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition alley plate \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-alley-bent-rings", "Alley \u00b7 Ring Raiders", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition alley plate \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-alley-catoptromancy", "Alley \u00b7 Shattered Fate", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition alley plate \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-alley-chair-swings", "Alley \u00b7 Flying Chairs", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition alley plate \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-alley-coin-pusher", "Alley \u00b7 Copper Falls", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition alley plate \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-alley-cover-the-spot", "Alley \u00b7 Vanishing Spot", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition alley plate \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-alley-curios", "Alley \u00b7 Digger\u2019s Vault", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition alley plate \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-alley-duck-pond", "Alley \u00b7 Duckling Parade", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition alley plate \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-alley-dunk-tank", "Alley \u00b7 Pressure Drop", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition alley plate \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-alley-end-curtain", "Alley \u00b7 Alley end curtain", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition alley plate \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-alley-fairground-organ", "Alley \u00b7 Fairground Organ", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition alley plate \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-alley-fairy-floss", "Alley \u00b7 Sugar Cyclone", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition alley plate \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-alley-ferris-wheel", "Alley \u00b7 Pocket Wheel", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition alley plate \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-alley-fortune", "Alley \u00b7 Catch the Fortune", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition alley plate \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-alley-foyer", "Alley \u00b7 Alley foyer", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition alley plate \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-alley-funhouse", "Alley \u00b7 Laughing Doorway", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition alley plate \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-alley-helter-skelter", "Alley \u00b7 Spiral Slide", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition alley plate \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-alley-high-striker", "Alley \u00b7 Perfect Strike", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition alley plate \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-alley-horse-carousel", "Alley \u00b7 Carousel Waltz", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition alley plate \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-alley-lookup", "Alley \u00b7 A Little Starlight", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition alley plate \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-alley-love", "Alley \u00b7 Love Tester", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition alley plate \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-alley-marquee", "Alley \u00b7 Marquee Glowball", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition alley plate \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-alley-milk-bottles", "Alley \u00b7 Milky Splash!", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition alley plate \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-alley-mutoscope", "Alley \u00b7 Flicker Reel", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition alley plate \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-alley-pack", "Alley \u00b7 The Impossible Suitcase", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition alley plate \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-alley-pass", "Alley \u00b7 Opening Night", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition alley plate \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-alley-penny-fever-arch", "Alley \u00b7 Penny Fever arch", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition alley plate \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-alley-penny-pitch", "Alley \u00b7 Dish Garden", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition alley plate \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-alley-pinball", "Alley \u00b7 Pinball Alley", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition alley plate \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-alley-plinko", "Alley \u00b7 Marble Mill", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition alley plate \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-alley-popcorn", "Alley \u00b7 Kernel Run", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition alley plate \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-alley-skee-ball", "Alley \u00b7 Moonbow Skee-Ball", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition alley plate \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-alley-snap", "Alley \u00b7 Instapic Photo Booth", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition alley plate \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-alley-water-gun", "Alley \u00b7 Water-Gun Fleet", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition alley plate \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-alley-whisper", "Alley \u00b7 Whisper Run", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition alley plate \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-carnival-aura-ticket-booth", "Aura\u2019s ticket booth", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition carnival figure \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-carnival-aura", "Aura", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition carnival figure \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-carnival-arlo", "Arlo \u00b7 carnival figure", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition carnival figure \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-carnival-bea", "Bea \u00b7 carnival figure", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition carnival figure \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-carnival-bess", "Bess \u00b7 carnival figure", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition carnival figure \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-carnival-celeste", "Celeste \u00b7 carnival figure", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition carnival figure \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-carnival-copper", "Copper \u00b7 carnival figure", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition carnival figure \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-carnival-digby", "Digby \u00b7 carnival figure", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition carnival figure \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-carnival-dot", "Dot \u00b7 carnival figure", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition carnival figure \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-carnival-dottie", "Dottie \u00b7 carnival figure", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition carnival figure \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-carnival-duncan", "Duncan \u00b7 carnival figure", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition carnival figure \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-carnival-felix", "Felix \u00b7 carnival figure", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition carnival figure \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-carnival-florence", "Florence \u00b7 carnival figure", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition carnival figure \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-carnival-flossie", "Flossie \u00b7 carnival figure", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition carnival figure \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-carnival-hugo", "Hugo \u00b7 carnival figure", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition carnival figure \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-carnival-iris", "Iris \u00b7 carnival figure", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition carnival figure \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-carnival-jasper", "Jasper \u00b7 carnival figure", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition carnival figure \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-carnival-juno", "Juno \u00b7 carnival figure", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition carnival figure \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-carnival-kit", "Kit \u00b7 carnival figure", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition carnival figure \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-carnival-lumi", "Lumi \u00b7 carnival figure", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition carnival figure \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-carnival-mabel", "Mabel \u00b7 carnival figure", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition carnival figure \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-carnival-magnus", "Magnus \u00b7 carnival figure", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition carnival figure \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-carnival-milo", "Milo \u00b7 carnival figure", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition carnival figure \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-carnival-nell", "Nell \u00b7 carnival figure", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition carnival figure \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-carnival-opal", "Opal \u00b7 carnival figure", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition carnival figure \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-carnival-otto", "Otto \u00b7 carnival figure", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition carnival figure \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-carnival-peggy", "Peggy \u00b7 carnival figure", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition carnival figure \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-carnival-penelope", "Penelope \u00b7 carnival figure", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition carnival figure \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-carnival-pip", "Pip \u00b7 carnival figure", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition carnival figure \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-carnival-poppy", "Poppy \u00b7 carnival figure", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition carnival figure \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-carnival-ringo", "Ringo \u00b7 carnival figure", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition carnival figure \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-carnival-rosalie", "Rosalie \u00b7 carnival figure", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition carnival figure \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-carnival-skip", "Skip \u00b7 carnival figure", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition carnival figure \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-carnival-tilly", "Tilly \u00b7 carnival figure", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition carnival figure \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-carnival-willa", "Willa \u00b7 carnival figure", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition carnival figure \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-carnival-bluebell", "Bluebell \u00b7 playable crew", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition carnival figure \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-carnival-oliver", "Oliver \u00b7 playable crew", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition carnival figure \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-carnival-rowan", "Rowan \u00b7 playable crew", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition carnival figure \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-carnival-ruby", "Ruby \u00b7 playable crew", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition carnival figure \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-carnival-sunny", "Sunny \u00b7 playable crew", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition carnival figure \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-carnival-violet", "Violet \u00b7 playable crew", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition carnival figure \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-carnival-alley-wall-bay", "Painted Bay \u00b7 ride", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition carnival figure \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-carnival-balloon-tree", "Balloon Garden \u00b7 ride", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition carnival figure \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-carnival-chair-swings", "Flying Chairs \u00b7 ride", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition carnival figure \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-carnival-fairground-organ", "Fairground Organ \u00b7 ride", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition carnival figure \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-carnival-ferris-wheel", "Pocket Wheel \u00b7 ride", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition carnival figure \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-carnival-funhouse", "Laughing Doorway \u00b7 ride", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition carnival figure \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-carnival-helter-skelter", "Spiral Slide \u00b7 ride", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition carnival figure \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-carnival-horse-carousel", "Carousel Waltz \u00b7 ride", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition carnival figure \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-carnival-ball-toss", "Impossible Plates \u00b7 stall", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition carnival figure \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-carnival-bent-rings", "Ring Raiders \u00b7 stall", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition carnival figure \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-carnival-catoptromancy", "Shattered Fate \u00b7 stall", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition carnival figure \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-carnival-coin-pusher", "Copper Falls \u00b7 stall", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition carnival figure \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-carnival-cover-the-spot", "Vanishing Spot \u00b7 stall", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition carnival figure \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-carnival-curios", "Digger\u2019s Vault \u00b7 stall", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition carnival figure \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-carnival-duck-pond", "Duckling Parade \u00b7 stall", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition carnival figure \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-carnival-dunk-tank", "Pressure Drop \u00b7 stall", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition carnival figure \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-carnival-fairy-floss", "Sugar Cyclone \u00b7 stall", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition carnival figure \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-carnival-fortune", "Catch the Fortune \u00b7 stall", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition carnival figure \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-carnival-high-striker", "Perfect Strike \u00b7 stall", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition carnival figure \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-carnival-lookup", "A Little Starlight \u00b7 stall", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition carnival figure \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-carnival-love", "Love Tester \u00b7 stall", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition carnival figure \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-carnival-marquee", "Marquee Glowball \u00b7 stall", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition carnival figure \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-carnival-milk-bottles", "Milky Splash! \u00b7 stall", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition carnival figure \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-carnival-mutoscope", "Flicker Reel \u00b7 stall", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition carnival figure \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-carnival-pack", "The Impossible Suitcase \u00b7 stall", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition carnival figure \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-carnival-pass", "Opening Night \u00b7 stall", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition carnival figure \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-carnival-penny-pitch", "Dish Garden \u00b7 stall", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition carnival figure \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-carnival-pinball", "Pinball Alley \u00b7 stall", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition carnival figure \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-carnival-plinko", "Marble Mill \u00b7 stall", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition carnival figure \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-carnival-popcorn", "Kernel Run \u00b7 stall", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition carnival figure \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-carnival-skee-ball", "Moonbow Skee-Ball \u00b7 stall", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition carnival figure \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-carnival-snap", "Instapic Photo Booth \u00b7 stall", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition carnival figure \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-carnival-water-gun", "Water-Gun Fleet \u00b7 stall", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition carnival figure \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"],
      ["le-carnival-whisper", "Whisper Run \u00b7 stall", "Aura Limited", "prize", null, "Aura\u2019s VIP tradeshow", "Limited edition carnival figure \u00b7 0.55555 XRP \u00b7 one per wallet.", 0.1, "aura-limited"]
    );
  const photoVendorRows = [
    ['iris','Iris','pf-fortune'], ['rosalie','Rosalie','pf-love'], ['digby','Digby','pf-curios'], ['celeste','Celeste','pf-lookup'],
    ['felix','Felix','pf-felix'], ['willa','Willa','pf-whisper'], ['bess','Bess','pf-ball-toss'], ['copper','Copper','pf-coin-pusher'],
    ['pip','Pip','pf-pinball'], ['marina','Marina','pf-water-gun'], ['mabel','Mabel','pf-milk-bottles'], ['dot','Dot','pf-cover-the-spot'],
    ['milo','Milo','pf-mutoscope'], ['magnus','Magnus','pf-high-striker'], ['opal','Opal','pf-catoptromancy'], ['ringo','Ringo','pf-bent-rings'],
    ['peggy','Peggy','pf-plinko'], ['flossie','Flossie','pf-fairy-floss'], ['poppy','Poppy','pf-popcorn'], ['dottie','Dottie','pf-duck-pond'],
    ['skip','Skip','pf-skee-ball'], ['penelope','Penelope','pf-penny-pitch'], ['duncan','Duncan','pf-dunk-tank'], ['lumi','Lumi','pf-marquee'],
    ['kit','Kit','pf-pack'], ['bea','Bea','pf-pass'],
    ['florence','Florence','pf-carousel','attendants'], ['nell','Nell','pf-balloons','attendants'],
    ['jasper','Jasper','pf-ferris','attendants'], ['tilly','Tilly','pf-helter','attendants'],
    ['hugo','Hugo','pf-swings','attendants'], ['juno','Juno','pf-funhouse','attendants'],
    ['otto','Otto','pf-organ','attendants'], ['arlo','Arlo','pf-mural','attendants'],
  ];
  const albumMeta = {
    essentials: ['On your person', 'Pennies, a ticket, a pass — what you carry onto the boards.'],
    ephemera: ['Alley ephemera', 'Six little finds from the tents. Complete the set for a costume book.'],
    guts: ['Machine guts', 'Brass, mercury and a ghost in the works.'],
    pennies: ['Pennies & tokens', 'Pressed copper, moon metal and a little album to keep them.'],
    tickets: ['Tickets & claims', 'Paper that gets you in, and paper that claims a prize.'],
    wearables: ['Things to wear', 'Bows, pins, spectacles, a crown, a scarf.'],
    awards: ['Awards & ribbons', 'What the midway pins on you when you have been brave.'],
    'game-prizes': ['Won at the games', 'Birds, calves, boats, lightning and other trophies.'],
    'garden-prizes': ['Garden prizes', 'Dishes, kettles, marquees and a looking-glass garden.'],
    'parlour-prizes': ['Parlour prizes', 'Lockboxes, cameras, keys and a crystal cradle.'],
    'wonder-prizes': ['Wonder prizes', 'Mallets, bells, lockets, peepshows and stars.'],
    'toy-shelf': ['The toy shelf', 'A rabbit, a dragon, a theatre, and friends with buttons.'],
    'sweet-treats': ['Sweet treats', 'Floss, fizz, cocoa, toffee and a picnic parcel.'],
    'seasonal-treasures': ['Seasonal treasures', 'Fans, globes, seeds, crackers and a pumpkin friend.'],
    'ride-keepsakes': ['Ride keepsakes', 'Carousels, wheels, a spiral slide, balloons, a laughing doorway and a painted bay.'],
    'collector-books': ['Books & albums', 'Journals, scrapbooks, stamp books and paper-doll wardrobes.'],
    'aura-limited': ['Aura Limited', 'Illustrated collector books for Aura’s limited edition charms, alley grounds, and carnival figures.'],
    'penny-fever-vendors': ['Penny Fever vendors', 'Miniature turnarounds of the 26 vendors and eight ride attendants, collected through Felix’s matching photo sets.'],
    'gift-wrapping': ['Wrapping & parcels', 'Sleeves, tins, pouches and surprises still tied up.'],
    'future-curios': ['Future curios', 'Compasses, invitations, bottles, clouds and secret keys.'],
    'working-midway': ['Working midway', 'Punches, pads, tags and the lantern lighter’s kit.'],
    rewards: ['Keepsake rewards', 'Gifts for arriving, and for finishing a collection.'],
  };
  const albumOrder = Object.keys(albumMeta);
  function albumOf(category, collection) {
    if (category === 'Essentials') return 'essentials';
    if (category === 'Alley Ephemera' || collection === 'alley-curios') return 'ephemera';
    if (category === 'Machine Guts' || collection === 'machine-curios') return 'guts';
    if (category === 'Collection rewards') return 'rewards';
    if (collection === 'doll-accessories') return 'toy-shelf';
    if (collection === 'paper-doll-books') return 'collector-books';
    if (collection && albumMeta[collection]) return collection;
    return 'rewards';
  }
  const bookMeta = [
    {id:'penny-collector-book', title:'Penny collector book', kicker:'The whole midway', blurb:'Every keepsake in Penny Fever. Pages wait in silhouette until you bring each one home.', kind:'book', master:true, cover:'assets/restyle/game-sprites/collector-books/penny-collector-book/front.webp'},
    {id:'aura-treasures-collector-book', title:'Aura treasures collector book', kicker:'Aura Limited · charms', blurb:'A burgundy clasp book for Aura’s limited charm turnarounds. Special addition · 5 XRP. You can collect the charms without this book.', kind:'book', tradeshow:true, cover:'assets/restyle/game-sprites/aura-limited/aura-treasures-collector-book/front.webp'},
    {id:'alley-backgrounds-collector-book', title:'Alley backgrounds collector book', kicker:'Aura Limited · grounds', blurb:'A lantern-arch book for the painted alley and every stall wall. Special addition · 5 XRP. You can collect the plates without this book.', kind:'book', tradeshow:true, cover:'assets/restyle/game-sprites/aura-limited/alley-backgrounds-collector-book/front.webp'},
    {id:'aura-and-carnival-collector-book', title:'Aura and carnival collector book', kicker:'Aura Limited · carnival', blurb:'A carousel book for Aura, the crew, stalls and rides. Special addition · 5 XRP. You can collect the figures without this book.', kind:'book', tradeshow:true, cover:'assets/restyle/game-sprites/aura-limited/aura-and-carnival-collector-book/front.webp'},
    {id:'curio-cabinet-album', title:'Curio cabinet album', kicker:'Cabinet of curios', blurb:'Little labelled niches for alley finds and machine guts.', kind:'album', cover:'assets/restyle/game-sprites/collector-books/curio-cabinet-album/front.webp'},
    {id:'fortune-journal', title:'Fortune journal', kicker:'Future curios', blurb:'Moon-clasp pages for compasses, keys, bottles and secrets still on their way.', kind:'book', cover:'assets/restyle/game-sprites/collector-books/fortune-journal/front.webp'},
    {id:'photo-accordion', title:'Photo accordion', kicker:'Wonders in frames', blurb:'Fold-out frames for peepshows, flickers, lockets and other sights worth keeping.', kind:'album', cover:'assets/restyle/game-sprites/collector-books/photo-accordion/front.webp'},
    {id:'felix-vendor-portrait-book', title:'Instapic Photo Booth — Penny Fever Vendors', kicker:'34 midway portraits', blurb:'A little turnaround portrait for each Penny Fever vendor and ride attendant. Each saved photo session on a matching set collects its portrait. The folder is planned for Aura’s booth.', kind:'album', cover:'assets/restyle/game-sprites/collector-books/felix-vendor-portrait-book/front.webp'},
    {id:'pressed-flower-book', title:'Pressed flower book', kicker:'Parlour keepsakes', blurb:'Vellum pockets for roses, lockboxes, cameras and other tender prizes.', kind:'book', cover:'assets/restyle/game-sprites/collector-books/pressed-flower-book/front.webp'},
    {id:'ride-stamp-book', title:'Ride stamp book', kicker:'Ride keepsakes', blurb:'A cream passport waiting for every amusement’s coloured stamp.', kind:'book', cover:'assets/restyle/game-sprites/collector-books/ride-stamp-book/front.webp'},
    {id:'charm-display-case', title:'Charm display case', kicker:'Things to wear', blurb:'Hooks and velvet paper for bows, pins, spectacles and hanging charms.', kind:'album', cover:'assets/restyle/game-sprites/collector-books/charm-display-case/front.webp'},
    {id:'memory-scrapbook', title:'Memory scrapbook', kicker:'Tickets & awards', blurb:'Pockets for tickets, maps, ribbons and the night you first walked in.', kind:'book', cover:'assets/restyle/game-sprites/collector-books/memory-scrapbook/front.webp'},
    {id:'garden-party-book', title:'Garden party book', kicker:'Garden prizes', blurb:'A costume book that also keeps dishes, clocks, ducks and garden souvenirs.', kind:'book', cover:'assets/restyle/game-sprites/paper-doll-books/garden-party-book/front.webp'},
    {id:'winter-lantern-book', title:'Winter lantern book', kicker:'Seasonal treasures', blurb:'Scarves, seeds, globes, fans and the little pumpkin who waits for autumn.', kind:'book', cover:'assets/restyle/game-sprites/paper-doll-books/winter-lantern-book/front.webp'},
    {id:'seaside-day-book', title:'Seaside day book', kicker:'Sweet treats', blurb:'A sailor’s album of floss, fizz, cocoa, toffee and picnic parcels.', kind:'book', cover:'assets/restyle/game-sprites/paper-doll-books/seaside-day-book/front.webp'},
    {id:'moonlight-wardrobe', title:'Moonlight wardrobe', kicker:'Costume book', blurb:'Crescent cloak pages. Outfit cutouts will settle here as they are found.', kind:'book', cover:'assets/restyle/game-sprites/paper-doll-books/moonlight-wardrobe/front.webp'},
    {id:'night-suitcase', title:'Night suitcase', kicker:'Parcels & tools', blurb:'A paper-lined case for wrapping, punches, tags and the kit that keeps the midway working.', kind:'case', cover:'assets/restyle/game-sprites/garden-prizes/night-suitcase/front.webp'},
    {id:'pocket-theatre', title:'Pocket theatre', kicker:'Toys & game prizes', blurb:'A tiny stage for prize-shelf friends, birds, boats and other trophies.', kind:'album', cover:'assets/restyle/game-sprites/toy-shelf/pocket-theatre/front.webp'},
  ];
  const bookIds = new Set(bookMeta.map(b => b.id));
  const albumBook = {
    pennies:'penny-collector-book',
    ephemera:'curio-cabinet-album',
    guts:'curio-cabinet-album',
    'future-curios':'fortune-journal',
    'wonder-prizes':'photo-accordion',
    'penny-fever-vendors':'felix-vendor-portrait-book',
    'parlour-prizes':'pressed-flower-book',
    'ride-keepsakes':'ride-stamp-book',
    wearables:'charm-display-case',
    tickets:'memory-scrapbook',
    awards:'memory-scrapbook',
    essentials:'memory-scrapbook',
    'garden-prizes':'garden-party-book',
    'seasonal-treasures':'winter-lantern-book',
    'sweet-treats':'seaside-day-book',
    'gift-wrapping':'night-suitcase',
    'working-midway':'night-suitcase',
    rewards:'night-suitcase',
    'toy-shelf':'pocket-theatre',
    'game-prizes':'pocket-theatre',
  };
  function bookOf(id, album, collection) {
    if (id === 'everyday-penny' || id === 'five-penny-stack') return 'penny-collector-book';
    if (id === 'ticket-roll') return 'memory-scrapbook';
    if (collection === 'aura-limited') {
      if (bookIds.has(id)) return id;
      if (id.startsWith('le-alley-')) return 'alley-backgrounds-collector-book';
      if (id.startsWith('le-carnival-')) return 'aura-and-carnival-collector-book';
      return 'aura-treasures-collector-book';
    }
    if (collection === 'paper-doll-books') return bookIds.has(id) ? id : 'moonlight-wardrobe';
    if (id === 'moonlight-wardrobe' || collection === 'doll-accessories') return 'moonlight-wardrobe';
    if (id === 'night-suitcase') return 'night-suitcase';
    if (bookIds.has(id)) return id;
    return albumBook[album] || 'memory-scrapbook';
  }
  const definitions = Object.freeze(rows.map(([id,name,category,kind,key,source,hint,depth,collection]) => {
    const album = albumOf(category, collection);
    const book = bookOf(id, album, collection);
    return Object.freeze({
      id,name,category,kind,key,source,hint,depth,collection,album,book,
      alpha: true,
      asset: id === 'felix-vendor-portrait-book'
        ? 'assets/restyle/game-sprites/collector-books/felix-vendor-portrait-book/front.webp?v=nft-art-1'
        : `assets/restyle/game-sprites/${collection}/${id}/front.webp?v=${collection === 'aura-limited' ? 'limited-2' : 'nft-art-1'}`,
      columns: 1,
      rows: 1,
      hinged: false,
      turnaround: true,
    });
  }).concat(photoVendorRows.map(([slug,name,photoSetId,group]) => Object.freeze({
    id: `vendor-portrait-${slug}`,
    name: `${name} · mini turnaround`,
    category: 'Photo Booth Collection',
    kind: 'prize',
    key: null,
    source: `Felix’s photo booth · ${name}`,
    hint: `Complete a paid photo session with ${name}’s matching set. The portrait is added after the session video saves.`,
    depth: .1,
    collection: 'penny-fever-vendors',
    album: 'penny-fever-vendors',
    book: 'felix-vendor-portrait-book',
    photoSetId,
    alpha: true,
    asset: `assets/restyle/scene-turnarounds-2026-09-09/${group || "vendors"}/${slug}/front.webp`,
    columns: 1,
    rows: 1,
    hinged: false,
    turnaround: true,
  }))));
  const albums = Object.freeze(albumOrder.map(id => Object.freeze({id, title: albumMeta[id][0], blurb: albumMeta[id][1]})));
  const books = Object.freeze(bookMeta.map(b => Object.freeze({...b})));
  const object = value => value && typeof value === 'object' && !Array.isArray(value);
  const count = value => Number.isFinite(Number(value)) ? Math.max(0,Math.floor(Number(value))) : 0;
  const day = () => new Intl.DateTimeFormat('en-CA',{timeZone:'Australia/Darwin',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  function reconcile(state, now=Date.now()) {
    if (!object(state)) return false;
    let changed=false;
    if (!object(state.paperInventory)) { state.paperInventory={version:1,items:{}}; changed=true; }
    if (!object(state.paperInventory.items)) { state.paperInventory.items={}; changed=true; }
    if (state.paperInventory.version==null) { state.paperInventory.version=1; changed=true; }
    const give=(id,source)=>{
      if (state.paperInventory.items[id]) return;
      state.paperInventory.items[id]={at:now,source};changed=true;
    };
    const welcomeCase = state.paperInventory.items['night-suitcase'];
    if (welcomeCase && welcomeCase.source === 'admission') {
      delete state.paperInventory.items['night-suitcase'];
      changed = true;
    }
    if (definitions.filter(d=>d.category==='Alley Ephemera').every(d=>!!state.curios?.[d.key])) give('moonlight-wardrobe','alley-complete');
    return changed;
  }
  function entries(state={},today=day()) {
    return definitions.map(d=>{
      let owned=false,quantity=0,status='Not collected yet',at=null;
      if (d.kind==='currency' && d.id==='five-penny-stack') {
        owned=true; quantity=count(state.pennyPacks);
        status=quantity?`${quantity} ${quantity===1?'pack':'packs'} · 5 pennies each, out of play`:'No 5-packs parked. Pack five loose pennies to keep them out of the machine.';
      } else if (d.kind==='currency') { owned=true; quantity=count(state.demoCoins); status=`${quantity} ${quantity===1?'penny':'pennies'} in your pocket`; }
      if (d.kind==='scrip') { owned=true; quantity=count(state.playTickets); status=`${quantity} booth ${quantity===1?'ticket':'tickets'} on the roll`; }
      if (d.kind==='ticket') { owned=!!(state.admitTicket||state.admitPassed||state.alleyLaps); quantity=owned?1:0; status=state.admitPassed?'Punched · this lap':state.admitTicket?'Ready to show Aura':state.alleyLaps?'Used · first walk':'Take a ticket at the door'; }
      if (d.kind==='pass') { owned=!!state.showmanPass && state.passDay===today; quantity=owned?1:0; status=owned?'Active until midnight Darwin':'No active Showman pass'; }
      if (d.kind==='curio') { owned=!!state.curios?.[d.key];quantity=owned?1:0;at=state.curios?.[d.key]?.at||null;status=owned?'Collected':status; }
      if (d.kind==='reward') { owned=!!state.paperInventory?.items?.[d.id];quantity=owned?1:0;at=state.paperInventory?.items?.[d.id]?.at||null;status=owned?'Collection keepsake':status; }
      if (d.kind==='prize') {
        const row=state.paperInventory?.items?.[d.id];
        owned=!!row;quantity=owned?count(row.qty)||1:0;at=row?.at||null;
        const src=row?.source;
        status=owned
          ? (quantity>1
            ? `${quantity} in your collection`
            : (src==='coin-pusher'||src==='cash-drop'?'Won at Copper Falls':src==='felix-photo-booth'?'Collected in Felix’s photo booth':'Won in a paper world'))
          : status;
      }
      return {...d,owned,quantity,status,at,punched:d.kind==='ticket'&&!!state.admitPassed};
    });
  }
  function resolve(id) { return definitions.find(d=>d.id===id||d.key===id)?.id||null; }
  function recordResult(state,result) {
    if(!object(state)||!object(result))return [];
    const reason=String(result.deathReason||'');
    if(['leave','abandon','cancel','unknown'].includes(reason))return [];
    const depth=count(result.depth),score=count(result.score);
    if(!result.cashedOut&&!(depth>0&&score>0))return [];
    const game=result.gameId||result.game,keys=[];
    if(game==='fortune'){
      keys.push('ticket_stub');
      const extra={'oxblood':'pressed_heart','kraft gold':'lucky_match','olive lamp':'marquee_bulb','cream ticket':'mirror_shard','lantern rose':'pressed_heart'}[result.meta?.colour];
      if(extra)keys.push(extra);
    }
    if(game==='love'){keys.push('mercury_bead');if(depth>=3||result.cashedOut)keys.push('sweet_heat');}
    const fixed={lookup:['gyro_ghost'],snap:['shutter_click'],whisper:['whisper_charm'],pack:['pressed_heart'],pass:['showman_ribbon','coin_slot'],marquee:['marquee_bulb']}[game];
    if(fixed)keys.push(...fixed);
    if(!keys.length)return [];
    if(!object(state.curios))state.curios={};
    const earned=[];
    for(const key of keys){
      if(state.curios[key])continue;
      const d=definitions.find(i=>i.key===key);
      state.curios[key]={shelf:d.category==='Alley Ephemera'?'alley':'guts',at:result.at||Date.now(),source:game};earned.push(d.id);
    }
    reconcile(state);return earned;
  }
  function recordPaperPrize(state, result) {
    if (!object(state) || !object(result)) return [];
    const id = result.item;
    const d = definitions.find(i => i.id === id);
    if (!d) return [];
    reconcile(state);
    const now = result.at || Date.now();
    if (d.kind === 'curio') {
      if (!object(state.curios)) state.curios = {};
      if (state.curios[d.key]) return [];
      state.curios[d.key] = {shelf: d.category === 'Alley Ephemera' ? 'alley' : 'guts', at: now, source: result.stall || 'paper-world'};
      reconcile(state);
      return [d.id];
    }
    if (d.id === 'five-penny-stack' && !state.paperInventory.items['penny-purse']) return [];
    if (state.paperInventory.items[d.id]) {
      if (['moon-penny','rose-penny','star-token','crown-token','five-penny-stack'].includes(d.id)) {
        const row = state.paperInventory.items[d.id];
        row.qty = (count(row.qty) || 1) + 1;
        row.at = now;
        return [d.id];
      }
      return [];
    }
    state.paperInventory.items[d.id] = {at: now, source: result.stall || 'paper-world', chapter: result.chapter, qty: 1};
    return [d.id];
  }
  function stampKeepsake(state, id, source, now=Date.now()) {
    if (!object(state) || !id) return false;
    reconcile(state);
    const d = definitions.find(i => i.id === id);
    if (!d || d.kind === 'currency' || d.kind === 'scrip' || d.kind === 'ticket' || d.kind === 'pass') return false;
    if (id === 'five-penny-stack' && !state.paperInventory.items['penny-purse']) return false;
    if (state.paperInventory.items[id]) {
      if (id === 'five-penny-stack') {
        const row = state.paperInventory.items[id];
        row.qty = (count(row.qty) || 1) + 1;
        row.at = now;
        return true;
      }
      return false;
    }
    state.paperInventory.items[id] = {at: now, source: source || 'pocket', qty: 1};
    return true;
  }
  function recordFelixPhotoSession(state, photoSetId, now=Date.now()) {
    if (!object(state) || !photoSetId) return [];
    const portrait = definitions.find(item => item.photoSetId === photoSetId);
    if (!portrait) return [];
    const earned = [];
    earned.push(...recordPaperPrize(state, {item:portrait.id, stall:'felix-photo-booth', at:now}));
    return earned;
  }
  globalThis.PennyFeverInventoryModel=Object.freeze({definitions,albums,books,reconcile,entries,resolve,day,recordResult,recordPaperPrize,stampKeepsake,recordFelixPhotoSession});
})();
