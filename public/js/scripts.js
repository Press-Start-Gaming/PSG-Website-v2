document.addEventListener('DOMContentLoaded', () => {
  console.log('Website loaded successfully!');

  // Clone the tiles to create a seamless loop
  const container = document.querySelector('.game-tile-container');
  const tiles = Array.from(container.children);
  tiles.forEach((tile) => {
    const clone = tile.cloneNode(true);
    container.appendChild(clone);
  });
});
