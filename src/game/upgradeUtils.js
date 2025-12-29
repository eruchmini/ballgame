import { GAME_CONFIG } from './constants';

/**
 * Selects random upgrades based on rarity weights
 * @param {number} count - Number of upgrades to select (default: 2)
 * @param {Object} currentUpgrades - Current upgrade counts to filter out maxed upgrades
 * @returns {Array} Array of selected upgrade objects
 */
export function selectRandomUpgrades(count = 2, currentUpgrades = {}) {
  const upgradeTypes = GAME_CONFIG.UPGRADE.TYPES;
  const availableUpgrades = [];

  // Build pool of available upgrades
  for (const [key, upgrade] of Object.entries(upgradeTypes)) {
    // Skip tracking if already owned
    if (upgrade.id === 'tracking' && currentUpgrades.tracking > 0) {
      continue;
    }
    availableUpgrades.push(upgrade);
  }

  // If we don't have enough upgrades, return what we have
  if (availableUpgrades.length <= count) {
    return availableUpgrades;
  }

  // Weighted random selection
  const selected = [];
  const pool = [...availableUpgrades];

  for (let i = 0; i < count && pool.length > 0; i++) {
    // Calculate total weight
    const totalWeight = pool.reduce((sum, upgrade) => sum + upgrade.weight, 0);

    // Random selection based on weight
    let random = Math.random() * totalWeight;
    let selectedIndex = 0;

    for (let j = 0; j < pool.length; j++) {
      random -= pool[j].weight;
      if (random <= 0) {
        selectedIndex = j;
        break;
      }
    }

    // Add selected upgrade and remove from pool
    selected.push(pool[selectedIndex]);
    pool.splice(selectedIndex, 1);
  }

  return selected;
}
