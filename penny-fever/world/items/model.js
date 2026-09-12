/* Shared inventory rules. Existing currency, ticket and curio saves stay authoritative. */
(() => {
  'use strict';
  const rows = [
    ['everyday-penny','Everyday penny','Essentials','currency',null,'Aura’s ticket booth','Spend these at Copper Falls and Pip’s pin tables. Cash a booth ticket at either for a five-penny stack.',.07,'pennies'],
    ['ticket-roll','Ticket roll','Essentials','scrip',null,'Aura’s ticket booth','Booth tickets torn from Aura’s brass roll. One ticket enters a stall. Cash one at Copper Falls or Pip’s tables for five pennies.',.08,'tickets'],
    ['admission-ticket','Admission ticket','Essentials','ticket',null,'Aura’s ticket booth','Take a ticket from Aura. Its punched heart remembers your entry.',.025,'tickets'],
    ['showman-pass','Showman pass','Essentials','pass',null,'Backstage Run · Bea','The demo Showman pass lasts until midnight in Darwin.',.06,'tickets'],
    ['ticket-stub','Ticket stub','Alley Ephemera','curio','ticket_stub','Iris’s Reading · Iris','Draw a fortune at Iris’s Reading.',.035,'alley-curios'],
    ['pressed-heart','Pressed heart','Alley Ephemera','curio','pressed_heart','The Impossible Suitcase · Kit','Mint a pressed penny pack.',.08,'alley-curios'],
    ['lucky-match','Lucky match','Alley Ephemera','curio','lucky_match','Iris’s Reading · Iris','A kraft-gold fortune leaves a little spark.',.07,'alley-curios'],
    ['whisper-charm','Whisper charm','Alley Ephemera','curio','whisper_charm','Lost Letter Express · Willa','Seal a kind word at Lost Letter Express.',.09,'alley-curios'],
    ['mirror-shard','Mirror shard','Alley Ephemera','curio','mirror_shard','Iris’s Reading · Iris','A cream-ticket fortune catches the light.',.06,'alley-curios'],
    ['showman-ribbon','Showman ribbon','Alley Ephemera','curio','showman_ribbon','Backstage Run · Bea','Complete a backstage stage, or try the demo Showman pass.',.065,'alley-curios'],
    ['mercury-bead','Mercury bead','Machine Guts','curio','mercury_bead','Love Tester · Rosalie','Find a little Sweet Heat.',.17,'machine-curios'],
    ['gyro-ghost','Gyro ghost','Machine Guts','curio','gyro_ghost','A Little Starlight · Celeste','Look up, darling.',.16,'machine-curios'],
    ['shutter-click','Shutter click','Machine Guts','curio','shutter_click','Paper Safari · Felix','Catch a moment at Paper Safari.',.09,'machine-curios'],
    ['sweet-heat','Sweet heat','Machine Guts','curio','sweet_heat','Love Tester · Rosalie','Reach depth three or take home a Love Tester souvenir.',.15,'machine-curios'],
    ['coin-slot','Coin slot','Machine Guts','curio','coin_slot','Backstage Run · Bea','Complete a backstage stage, or try the demo Showman pass.',.085,'machine-curios'],
    ['marquee-bulb','Marquee bulb','Machine Guts','curio','marquee_bulb','Light the Night · Lumi','Light the marquee, or find an olive-lamp fortune.',.14,'machine-curios'],
    ['night-suitcase','Night suitcase','Collection rewards','reward',null,'Aura’s welcome','Yours after handing Aura your admission ticket.',.24,'garden-prizes'],
    ['moonlight-wardrobe','Moonlight wardrobe','Collection rewards','reward',null,'Alley collection','Collect all six Alley Ephemera to receive this costume keepsake book.',.12,'paper-doll-books'],
    ['coin-sleeve','Coin sleeve','Workshop prizes','prize',null,'Copper Falls · Copper','Catch pennies at Copper Falls.',.08,'gift-wrapping'],
    ['copper-cascade','Copper cascade','Workshop prizes','prize',null,'Copper Falls · Copper','Finish the moon mint at Copper Falls.',.12,'game-prizes'],
    ['penny-tree','Penny tree','Workshop prizes','prize',null,'Copper Falls · Copper','Settle the crowded mint at Copper Falls.',.14,'game-prizes'],
    ['charm-pouch','Charm pouch','Workshop prizes','prize',null,'Lost Letter Express · Willa','Cross the winds at Lost Letter Express.',.08,'gift-wrapping'],
    ['secret-keeper','Secret keeper','Workshop prizes','prize',null,'Lost Letter Express · Willa','Finish the late-night express.',.12,'parlour-prizes'],
    ['penny-purse','Penny purse','Workshop prizes','prize',null,'Copper Falls · Copper','Win the purse off Copper’s trays. Spendable pennies live here. After it is yours, five-penny stacks back up inside it.',.1,'pennies'],
    ['penny-collector-book','Penny collector book','Workshop prizes','prize',null,'The Impossible Suitcase · Kit','Close the midnight expedition.',.12,'collector-books'],
    ['rose-hair-bow','Rose hair bow','Workshop prizes','prize',null,'Love Tester · Rosalie','Chapter 1 of Love Tester.',.08,'wearables'],
    ['rose-press','Rose press','Workshop prizes','prize',null,'Love Tester · Rosalie','Chapter 2 of Love Tester.',.1,'parlour-prizes'],
    ['rose-lockbox','Rose lockbox','Workshop prizes','prize',null,'Love Tester · Rosalie','Chapter 3 of Love Tester.',.12,'parlour-prizes'],
    ['clockwork-key','Clockwork key','Workshop prizes','prize',null,'Clockwork Menagerie · Digby','Reconnect the runaway beetle’s track.',.1,'machine-curios'],
    ['heart-gear','Heart gear','Workshop prizes','prize',null,'Copper Falls · Copper','A brass heart-gear from the cash-drop trays.',.1,'machine-curios'],
    ['display-dome','Display dome','Workshop prizes','prize',null,'Clockwork Menagerie · Digby','A curious detour, safely under glass.',.12,'gift-wrapping'],
    ['clockwork-butterfly','Clockwork butterfly','Workshop prizes','prize',null,'Clockwork Menagerie · Digby','Bring the butterfly home.',.16,'future-curios'],
    ['brave-try-ribbon','Brave-try ribbon','Workshop prizes','prize',null,'Duckling Parade · Dottie','Bring the first little wanderers home.',.07,'awards'],
    ['lucky-dish','Lucky dish','Workshop prizes','prize',null,'The Topsy Dairy · Mabel','Clear both parlour stacks.',.1,'garden-prizes'],
    ['crowned-duck','Crowned duck','Workshop prizes','prize',null,'Duckling Parade · Dottie','Finish the grand duck parade.',.12,'garden-prizes'],
    ['coin-album','Coin album','Workshop prizes','prize',null,'Copper Falls · Copper','Chapter 4 of Copper Falls.',.1,'pennies'],
    ['treasure-tin','Treasure tin','Workshop prizes','prize',null,'Copper Falls · Copper','Chapter 5 of Copper Falls.',.1,'gift-wrapping'],
    ['five-penny-stack','Five-penny stack','Workshop prizes','prize',null,'Aura’s till · Copper Falls','A shared pack of five pennies. Cash a ticket, or shove a stack off Copper’s flood table. Once you have the purse, stacks back up in it.',.1,'pennies'],
    ['mint-press','Mint press','Workshop prizes','prize',null,'Copper Falls · Copper','Chapter 6 of Copper Falls. The little press that mints the tide.',.1,'game-prizes'],
    ['surprise-parcel','Surprise parcel','Workshop prizes','prize',null,'Lost Letter Express · Willa','Chapter 4 of Lost Letter Express.',.1,'gift-wrapping'],
    ['stamp-passport','Stamp passport','Workshop prizes','prize',null,'Lost Letter Express · Willa','Chapter 5 of Lost Letter Express.',.1,'tickets'],
    ['lost-and-found-tag','Lost-and-found tag','Workshop prizes','prize',null,'Lost Letter Express · Willa','Chapter 6 of Lost Letter Express.',.1,'working-midway'],
    ['midnight-invitation','Midnight invitation','Workshop prizes','prize',null,'The Impossible Suitcase · Kit','Chapter 5 of The Impossible Suitcase.',.1,'future-curios'],
    ['ticket-satchel','Ticket satchel','Workshop prizes','prize',null,'The Impossible Suitcase · Kit','Chapter 6 of The Impossible Suitcase.',.1,'wearables'],
    ['kindness-heart','Kindness heart','Workshop prizes','prize',null,'Love Tester · Rosalie','Chapter 4 of Love Tester.',.1,'awards'],
    ['friendship-pins','Friendship pins','Workshop prizes','prize',null,'Love Tester · Rosalie','Chapter 5 of Love Tester.',.1,'wearables'],
    ['ribbon-gift-box','Ribbon gift box','Workshop prizes','prize',null,'Love Tester · Rosalie','Chapter 6 of Love Tester.',.1,'gift-wrapping'],
    ['tin-style-robot','Tin-style robot','Workshop prizes','prize',null,'Clockwork Menagerie · Digby','Chapter 4 of Clockwork Menagerie.',.1,'toy-shelf'],
    ['crystal-cradle','Crystal cradle','Workshop prizes','prize',null,'Clockwork Menagerie · Digby','Chapter 5 of Clockwork Menagerie.',.1,'parlour-prizes'],
    ['curio-cabinet-album','Curio cabinet album','Workshop prizes','prize',null,'Clockwork Menagerie · Digby','Chapter 6 of Clockwork Menagerie.',.1,'collector-books'],
    ['sleepy-dragon','Sleepy dragon','Workshop prizes','prize',null,'Duckling Parade · Dottie','Chapter 4 of Duckling Parade.',.1,'toy-shelf'],
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
    ['prize-bag','Prize bag','Workshop prizes','prize',null,'Balloon Garden · Nell','Chapter 2 of Balloon Garden.',.1,'gift-wrapping'],
    ['button-elephant','Button elephant','Workshop prizes','prize',null,'The Topsy Dairy · Mabel','Clear the grand pyramid.',.1,'toy-shelf'],
    ['prize-claim','Prize claim','Workshop prizes','prize',null,'Lantern Toss · Bess','Chapter 5 of Lantern Toss.',.1,'tickets'],
    ['midway-scarf','Midway scarf','Workshop prizes','prize',null,'Lantern Toss · Bess','Chapter 6 of Lantern Toss.',.1,'wearables'],
    ['photo-accordion','Photo accordion','Workshop prizes','prize',null,'Paper Safari · Felix','Chapter 2 of Paper Safari.',.1,'collector-books'],
    ['memory-camera','Memory camera','Workshop prizes','prize',null,'Paper Safari · Felix','Chapter 3 of Paper Safari.',.1,'parlour-prizes'],
    ['ride-stamp-book','Ride stamp book','Workshop prizes','prize',null,'Painted Bay · Arlo','Chapter 1 of Painted Bay.',.1,'collector-books'],
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
    ['ride-explorer-pennant','Ride-explorer pennant','Workshop prizes','prize',null,'Carousel Waltz · Florence','Chapter 5 of Carousel Waltz.',.1,'awards'],
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
    ['laughing-doorway','Laughing doorway','Workshop prizes','prize',null,'Laughing Doorway · Juno','Chapter 1 of Laughing Doorway.',.1,'ride-keepsakes'],
    ['seaside-day-book','Seaside-day book','Workshop prizes','prize',null,'Paper Harbour · Marina','Chapter 4 of Paper Harbour.',.1,'paper-doll-books'],
    ['pocket-marquee','Pocket marquee','Workshop prizes','prize',null,'Light the Night · Lumi','Chapter 2 of Light the Night.',.1,'garden-prizes'],
    ['lantern-lighter','Lantern lighter','Workshop prizes','prize',null,'Light the Night · Lumi','Chapter 3 of Light the Night.',.1,'working-midway'],
    ['midway-map','Sideshow alley map','Workshop prizes','prize',null,'Light the Night · Lumi','Chapter 4 of Light the Night.',.1,'tickets'],
    ['aura-keepsake','Aura keepsake','Workshop prizes','prize',null,'Balloon Garden · Nell','Chapter 4 of Balloon Garden.',.1,'awards'],
    ['velvet-mask','Velvet mask','Workshop prizes','prize',null,'Backstage Run · Bea','Chapter 2 of Backstage Run.',.1,'garden-prizes'],
    ['secret-door-key','Secret door key','Workshop prizes','prize',null,'Backstage Run · Bea','Chapter 3 of Backstage Run.',.1,'future-curios'],
    ['pocket-observatory','Pocket observatory','Workshop prizes','prize',null,'A Little Starlight · Celeste','Chapter 2 of A Little Starlight.',.1,'parlour-prizes'],
    ['star-spectacles','Star spectacles','Workshop prizes','prize',null,'A Little Starlight · Celeste','Chapter 3 of A Little Starlight.',.1,'wearables'],
    ['little-sailboat','Little sailboat','Workshop prizes','prize',null,'Paper Harbour · Marina','Chapter 1 of Paper Harbour.',.1,'game-prizes'],
    ['message-bottle','Message bottle','Workshop prizes','prize',null,'Paper Harbour · Marina','Chapter 2 of Paper Harbour.',.1,'future-curios'],
    ['music-carousel','Music carousel','Workshop prizes','prize',null,'Carousel Waltz · Florence','Chapter 1 of Carousel Waltz.',.1,'ride-keepsakes'],
    ['organ-music-box','Organ music box','Workshop prizes','prize',null,'Fairground Organ · Otto','Chapter 1 of Fairground Organ.',.1,'ride-keepsakes'],
    ['pocket-wheel','Pocket wheel','Workshop prizes','prize',null,'Pocket Wheel · Jasper','Chapter 1 of Pocket Wheel.',.1,'ride-keepsakes'],
    ['balloon-bouquet','Balloon bouquet','Workshop prizes','prize',null,'Balloon Garden · Nell','Chapter 1 of Balloon Garden.',.1,'ride-keepsakes'],
    ['swing-spinner','Swing spinner','Workshop prizes','prize',null,'Flying Chairs · Hugo','Chapter 1 of Flying Chairs.',.1,'ride-keepsakes'],
    ['moon-lantern','Moon lantern','Workshop prizes','prize',null,'Iris’s Reading · Iris','Chapter 2 of Iris’s Reading.',.1,'parlour-prizes'],
    ['moon-rabbit','Moon rabbit','Workshop prizes','prize',null,'A Little Starlight · Celeste','Chapter 6 of A Little Starlight.',.1,'toy-shelf'],
    ['safari-frame','Safari frame','Workshop prizes','prize',null,'Paper Safari · Felix','Chapter 4 of Paper Safari.',.1,'parlour-prizes'],
    ['paper-negative','Paper negative','Workshop prizes','prize',null,'Paper Safari · Felix','Chapter 6 of Paper Safari.',.1,'parlour-prizes'],
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
    ['moonbow-stub','Moonbow stub','Workshop prizes','prize',null,'Moonbow Alley · Skip','Chapter 4 of Moonbow Alley.',.1,'tickets'],
    ['score-card','Score card','Workshop prizes','prize',null,'Moonbow Alley · Skip','Chapter 5 of Moonbow Alley.',.1,'tickets'],
    ['well-wish-penny','Well-wish penny','Workshop prizes','prize',null,'Wishing Wells · Penelope','Chapter 1 of Wishing Wells.',.1,'pennies'],
    ['skipping-stone','Skipping stone','Workshop prizes','prize',null,'Wishing Wells · Penelope','Chapter 2 of Wishing Wells.',.1,'garden-prizes'],
    ['well-coin','Well coin','Workshop prizes','prize',null,'Wishing Wells · Penelope','Chapter 3 of Wishing Wells.',.1,'pennies'],
    ['three-well-plaque','Three-well plaque','Workshop prizes','prize',null,'Wishing Wells · Penelope','Chapter 4 of Wishing Wells.',.1,'garden-prizes'],
    ['wish-ribbon','Wish ribbon','Workshop prizes','prize',null,'Wishing Wells · Penelope','Chapter 5 of Wishing Wells.',.1,'awards'],
    ['well-claim','Well claim','Workshop prizes','prize',null,'Wishing Wells · Penelope','Chapter 6 of Wishing Wells.',.1,'tickets'],
    ['dunk-plate','Dunk plate','Workshop prizes','prize',null,'Splashworks · Duncan','Chapter 1 of Splashworks.',.1,'game-prizes'],
    ['barker-hat','Barker hat','Workshop prizes','prize',null,'Splashworks · Duncan','Chapter 2 of Splashworks.',.1,'wearables'],
    ['splash-bead','Splash bead','Workshop prizes','prize',null,'Splashworks · Duncan','Chapter 3 of Splashworks.',.1,'garden-prizes'],
    ['wet-bell','Wet bell','Workshop prizes','prize',null,'Splashworks · Duncan','Chapter 4 of Splashworks.',.1,'wonder-prizes'],
    ['towel-flag','Towel flag','Workshop prizes','prize',null,'Splashworks · Duncan','Chapter 5 of Splashworks.',.1,'wearables'],
    ['seltzer-bottle','Seltzer bottle','Workshop prizes','prize',null,'Splashworks · Duncan','Chapter 6 of Splashworks.',.1,'sweet-treats'],
    ['marquee-stub','Marquee stub','Workshop prizes','prize',null,'Light the Night · Lumi','Chapter 6 of Light the Night.',.1,'tickets'],
    ['sealed-secret','Sealed secret','Workshop prizes','prize',null,'The Impossible Suitcase · Kit','Chapter 4 of The Impossible Suitcase.',.1,'alley-curios'],
    ['cue-script','Cue script','Workshop prizes','prize',null,'Backstage Run · Bea','Chapter 1 of Backstage Run.',.1,'alley-curios'],
    ['cue-card','Cue card','Workshop prizes','prize',null,'Backstage Run · Bea','Chapter 5 of Backstage Run.',.1,'tickets'],
    ['stage-door-pass','Stage-door pass','Workshop prizes','prize',null,'Backstage Run · Bea','Chapter 6 of Backstage Run.',.1,'tickets'],
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
    'ride-keepsakes': ['Ride keepsakes', 'Carousels, wheels, balloons and a laughing doorway.'],
    'collector-books': ['Books & albums', 'Journals, scrapbooks, stamp books and paper-doll wardrobes.'],
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
    {id:'penny-collector-book', title:'Penny collector book', kicker:'The whole midway', blurb:'Every keepsake in Penny Fever. Pages wait in silhouette until you bring each one home.', kind:'book', master:true, cover:'assets/restyle/game-sprites/collector-books/penny-collector-book/front.png'},
    {id:'curio-cabinet-album', title:'Curio cabinet album', kicker:'Cabinet of curios', blurb:'Little labelled niches for alley finds and machine guts.', kind:'album', cover:'assets/restyle/game-sprites/collector-books/curio-cabinet-album/front.png'},
    {id:'fortune-journal', title:'Fortune journal', kicker:'Future curios', blurb:'Moon-clasp pages for compasses, keys, bottles and secrets still on their way.', kind:'book', cover:'assets/restyle/game-sprites/collector-books/fortune-journal/front.png'},
    {id:'photo-accordion', title:'Photo accordion', kicker:'Wonders in frames', blurb:'Fold-out frames for peepshows, flickers, lockets and other sights worth keeping.', kind:'album', cover:'assets/restyle/game-sprites/collector-books/photo-accordion/front.png'},
    {id:'pressed-flower-book', title:'Pressed flower book', kicker:'Parlour keepsakes', blurb:'Vellum pockets for roses, lockboxes, cameras and other tender prizes.', kind:'book', cover:'assets/restyle/game-sprites/collector-books/pressed-flower-book/front.png'},
    {id:'ride-stamp-book', title:'Ride stamp book', kicker:'Ride keepsakes', blurb:'A cream passport waiting for every amusement’s coloured stamp.', kind:'book', cover:'assets/restyle/game-sprites/collector-books/ride-stamp-book/front.png'},
    {id:'charm-display-case', title:'Charm display case', kicker:'Things to wear', blurb:'Hooks and velvet paper for bows, pins, spectacles and hanging charms.', kind:'album', cover:'assets/restyle/game-sprites/collector-books/charm-display-case/front.png'},
    {id:'memory-scrapbook', title:'Memory scrapbook', kicker:'Tickets & awards', blurb:'Pockets for tickets, maps, ribbons and the night you first walked in.', kind:'book', cover:'assets/restyle/game-sprites/collector-books/memory-scrapbook/front.png'},
    {id:'garden-party-book', title:'Garden party book', kicker:'Garden prizes', blurb:'A costume book that also keeps dishes, clocks, ducks and garden souvenirs.', kind:'book', cover:'assets/restyle/game-sprites/paper-doll-books/garden-party-book/front.png'},
    {id:'winter-lantern-book', title:'Winter lantern book', kicker:'Seasonal treasures', blurb:'Scarves, seeds, globes, fans and the little pumpkin who waits for autumn.', kind:'book', cover:'assets/restyle/game-sprites/paper-doll-books/winter-lantern-book/front.png'},
    {id:'seaside-day-book', title:'Seaside day book', kicker:'Sweet treats', blurb:'A sailor’s album of floss, fizz, cocoa, toffee and picnic parcels.', kind:'book', cover:'assets/restyle/game-sprites/paper-doll-books/seaside-day-book/front.png'},
    {id:'moonlight-wardrobe', title:'Moonlight wardrobe', kicker:'Costume book', blurb:'Crescent cloak pages. Outfit cutouts will settle here as they are found.', kind:'book', cover:'assets/restyle/game-sprites/paper-doll-books/moonlight-wardrobe/front.png'},
    {id:'night-suitcase', title:'Night suitcase', kicker:'Parcels & tools', blurb:'A paper-lined case for wrapping, punches, tags and the kit that keeps the midway working.', kind:'case', cover:'assets/restyle/game-sprites/garden-prizes/night-suitcase/front.png'},
    {id:'pocket-theatre', title:'Pocket theatre', kicker:'Toys & game prizes', blurb:'A tiny stage for prize-shelf friends, birds, boats and other trophies.', kind:'album', cover:'assets/restyle/game-sprites/toy-shelf/pocket-theatre/front.png'},
  ];
  const bookIds = new Set(bookMeta.map(b => b.id));
  const albumBook = {
    pennies:'penny-collector-book',
    ephemera:'curio-cabinet-album',
    guts:'curio-cabinet-album',
    'future-curios':'fortune-journal',
    'wonder-prizes':'photo-accordion',
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
      asset: `assets/restyle/game-sprites/${collection}/${id}/front.png`,
      columns: 1,
      rows: 1,
      hinged: false,
      turnaround: true,
    });
  }));
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
    if (state.admitPassed) give('night-suitcase','admission');
    if (definitions.filter(d=>d.category==='Alley Ephemera').every(d=>!!state.curios?.[d.key])) give('moonlight-wardrobe','alley-complete');
    return changed;
  }
  function entries(state={},today=day()) {
    return definitions.map(d=>{
      let owned=false,quantity=0,status='Not collected yet',at=null;
      if (d.kind==='currency') { owned=true; quantity=count(state.demoCoins); status=`${quantity} ${quantity===1?'penny':'pennies'} in your pocket`; }
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
            : (src==='coin-pusher'||src==='cash-drop'?'Won at Copper Falls':'Won in a paper world'))
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
  globalThis.PennyFeverInventoryModel=Object.freeze({definitions,albums,books,reconcile,entries,resolve,day,recordResult,recordPaperPrize,stampKeepsake});
})();
