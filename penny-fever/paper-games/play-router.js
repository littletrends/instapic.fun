const id = new URLSearchParams(location.search).get('stall');
if (id === 'fortune' || id === 'coin-pusher') {
  const sheet = document.querySelector('link[href^="style.css"]');
  await new Promise((resolve, reject) => {
    sheet.onload = resolve;
    sheet.onerror = () => reject(new Error('The game cabinet style could not load.'));
    sheet.href = 'cabinet.css?v=dress-3f';
  });
  await import('./cabinet-runtime.js?v=dress-3f');
} else {
  await import('./runtime.js?v=dress-3f');
}
