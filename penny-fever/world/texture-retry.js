import {Texture} from './lib/three.module.min.js';

// A brief connection change must not leave the entrance or a character blank.
export function loadTextureWithRetry(loader, url, {maxAttempts=3, retryDelay=1000}={}) {
  const texture = new Texture();
  let attempts=0, timer=null, disposed=false;
  texture.addEventListener('dispose', () => { disposed=true; clearTimeout(timer); });
  function load() {
    if (disposed) return;
    attempts++;
    let pending;
    pending=loader.load(url, loaded => {
      if (!disposed) { texture.image=loaded.image; texture.needsUpdate=true; }
      loaded.dispose();
    }, undefined, () => {
      pending?.dispose();
      if (disposed) return;
      if (attempts<maxAttempts) timer=setTimeout(load,retryDelay*attempts);
      else console.warn('Penny Fever artwork could not load:',url);
    });
  }
  load();
  return texture;
}
