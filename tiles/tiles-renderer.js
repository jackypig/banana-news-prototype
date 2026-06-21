// Render tile cards in the tiles banner
function renderTiles() {
  const tilesGrid = document.querySelector('.tiles-grid');
  tilesGrid.innerHTML = ''; // Clear existing tiles
  
  tilesData.forEach((tile, index) => {
    const tileCard = document.createElement('div');
    tileCard.className = 'tile-card';
    if (index === 0) {
      tileCard.classList.add('active');
    }
    tileCard.id = tile.id;
    tileCard.onclick = () => quickSelectTile(tile.category, tile.contentId);
    
    tileCard.innerHTML = `
      <span class="tile-tag">${tile.tag}</span>
      <h4 class="tile-headline">${tile.headline}</h4>
      <span class="tile-action">${tile.action}</span>
    `;
    
    tilesGrid.appendChild(tileCard);
  });
}