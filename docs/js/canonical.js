(() => {
  const expectedProtocol = 'https:';
  const expectedHost = 'drawdowngame.com';
  if (location.protocol !== expectedProtocol || location.host !== expectedHost) {
    const newUrl = `${expectedProtocol}//${expectedHost}${location.pathname}${location.search}${location.hash}`;
    location.replace(newUrl);
  }
})();
