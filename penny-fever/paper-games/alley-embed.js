// Hide the iframe play header before it paints, when this room is opened from the alley.
try{if(new URLSearchParams(location.search).get('room')==='alley')document.documentElement.classList.add('is-alley-embed');}catch(e){}
