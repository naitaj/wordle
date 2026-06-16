/**
 * Selector Abstraction Layer for NYT Wordle and Wordle.name DOM.
 * When either site changes their DOM structure, only this file needs updating.
 * 
 * Strategy: Use data attributes and custom elements (stable) over CSS class names (hashed/unstable).
 */

export const SELECTORS = {
  // Primary: data-attribute based (most stable for NYT)
  tileByState: '[data-state]',
  keyButton: 'button[data-key]',
  
  // Structural: role-based  
  row: '[role="group"][aria-label*="Row"]',
  
  // Fallback: partial class match (may break on NYT rebuilds)
  boardFallback: '[class*="Board-module"]',
  rowFallback: '[class*="Row-module"]',
  tileFallback: '[class*="Tile-module"]',
} as const;

export const DATA_ATTRS = {
  tileState: 'data-state',
  tileLetter: 'data-letter',
  keyData: 'data-key',
} as const;

export const TILE_STATES = {
  empty: 'empty',
  tbd: 'tbd',
  correct: 'correct',
  present: 'present',
  absent: 'absent',
} as const;

export type NytTileState = typeof TILE_STATES[keyof typeof TILE_STATES];

/**
 * Detect if we are currently running on www.wordle.name.
 */
export function isWordleName(): boolean {
  return window.location.hostname.includes('wordle.name');
}

/**
 * Find all game tiles in the DOM.
 * Returns them in order: row 0 tile 0, row 0 tile 1, ..., row 5 tile 4 (30 total).
 */
export function findAllTiles(): Element[] {
  // Support for wordle.name (unofficial unlimited game)
  if (isWordleName()) {
    const gameApp = document.querySelector('game-app');
    if (!gameApp || !gameApp.shadowRoot) return [];
    
    const gameRows = Array.from(gameApp.shadowRoot.querySelectorAll('game-row'));
    const tiles: Element[] = [];
    for (const row of gameRows) {
      if (row.shadowRoot) {
        const rowTiles = Array.from(row.shadowRoot.querySelectorAll('game-tile'));
        tiles.push(...rowTiles);
      }
    }
    // We expect exactly 30 tiles (6 rows × 5 tiles)
    return tiles;
  }

  // Strategy 1 for NYT: Find all elements with data-state (most reliable)
  let tiles = Array.from(document.querySelectorAll(SELECTORS.tileByState));
  
  // Filter to only game tiles (exclude keyboard keys which also have data-state)
  tiles = tiles.filter(el => el.tagName !== 'BUTTON');
  
  // We expect exactly 30 tiles (6 rows × 5 tiles)
  if (tiles.length === 30) return tiles;
  
  // Strategy 2 for NYT: Fallback to class-based selectors
  tiles = Array.from(document.querySelectorAll(SELECTORS.tileFallback));
  if (tiles.length === 30) return tiles;
  
  // Strategy 3 for NYT: Find by structure - look for container with 6 children each having 5 children
  const allDivs = document.querySelectorAll('div');
  for (const div of allDivs) {
    if (div.children.length === 6) {
      let isBoard = true;
      for (const child of div.children) {
        if (child.children.length !== 5) { isBoard = false; break; }
      }
      if (isBoard) {
        return Array.from(div.querySelectorAll(':scope > * > *'));
      }
    }
  }
  
  return tiles;
}

/**
 * Get tile state from a DOM element.
 */
export function getTileState(tile: Element): NytTileState {
  if (isWordleName()) {
    const evaluation = tile.getAttribute('evaluation');
    if (evaluation) {
      return evaluation as NytTileState;
    }
    const letter = tile.getAttribute('letter');
    if (letter && letter !== 'null' && letter !== '') {
      return TILE_STATES.tbd;
    }
    return TILE_STATES.empty;
  }

  return (tile.getAttribute(DATA_ATTRS.tileState) as NytTileState) || TILE_STATES.empty;
}

/**
 * Get tile letter from a DOM element.
 */
export function getTileLetter(tile: Element): string {
  if (isWordleName()) {
    const letter = tile.getAttribute('letter');
    return (letter && letter !== 'null' ? letter : '').toUpperCase();
  }

  return (
    tile.getAttribute(DATA_ATTRS.tileLetter) ||
    tile.textContent?.trim() ||
    ''
  ).toUpperCase();
}
