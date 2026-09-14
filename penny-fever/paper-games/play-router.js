const params = new URLSearchParams(location.search);
if (params.get('stall') === 'fortune') {
  location.replace('../experiments/iris-tent-1/play.html?' + params);
} else {
  await import('./runtime.js?v=phone-layout-1');
}
