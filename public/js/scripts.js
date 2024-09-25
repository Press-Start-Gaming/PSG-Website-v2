document.addEventListener('DOMContentLoaded', () => {
  console.log('Website loaded successfully!');

  // Clone the tiles to create a seamless loop
  const container = document.querySelector('.game-tile-container');
  const tiles = Array.from(container.children);
  tiles.forEach((tile) => {
    const clone = tile.cloneNode(true);
    container.appendChild(clone);
  });

  // Ensure the container is wide enough to hold all tiles
  container.style.width = `calc(250px * ${tiles.length * 2} + 20px * ${
    tiles.length * 2 - 1
  })`;
});
