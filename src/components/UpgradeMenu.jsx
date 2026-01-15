import React from 'react';

export const UpgradeMenu = ({
  upgradePoints,
  speedUpgrades,
  doubleClickUpgrades,
  explosionUpgrades,
  trackingUpgrades,
  availableUpgrades,
  onUpgradeSelect,
  onClose
}) => {
  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'common': return 'border-gray-400';
      case 'uncommon': return 'border-green-500';
      case 'rare': return 'border-purple-600';
      default: return 'border-gray-400';
    }
  };

  const getRarityBgColor = (rarity) => {
    switch (rarity) {
      case 'common': return 'bg-blue-500 hover:bg-blue-600';
      case 'uncommon': return 'bg-green-500 hover:bg-green-600';
      case 'rare': return 'bg-purple-600 hover:bg-purple-700';
      default: return 'bg-blue-500 hover:bg-blue-600';
    }
  };

  const getUpgradeDescription = (upgrade) => {
    switch (upgrade.id) {
      case 'speed':
        return `(Current: +${speedUpgrades * 10}%)`;
      case 'multiShot':
        return `${doubleClickUpgrades + 1}x blast${doubleClickUpgrades > 0 ? 's' : ''} per click (1s cooldown)`;
      case 'explosion':
        return `(Current: +${explosionUpgrades * 50}%)`;
      case 'tracking':
        return trackingUpgrades > 0 ? '✓ OWNED' : '(Costs 2 Points)';
      default:
        return '';
    }
  };

  const canAfford = (upgrade) => {
    if (upgrade.id === 'tracking') {
      return upgradePoints >= 2 && trackingUpgrades === 0;
    }
    return upgradePoints > 0;
  };

  return (
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 p-6 bg-white border-4 border-purple-500 rounded-lg shadow-2xl z-20 min-w-96">
      <h2 className="text-3xl font-bold text-purple-700 mb-4 text-center">Choose Upgrade!</h2>
      <p className="text-center mb-4 text-gray-600">Upgrade Points: {upgradePoints}</p>

      <div className="space-y-3">
        {availableUpgrades.map((upgrade, index) => {
          const affordable = canAfford(upgrade);
          return (
            <button
              key={index}
              onClick={() => affordable && onUpgradeSelect(upgrade.id)}
              disabled={!affordable}
              className={`w-full p-4 rounded-lg transition-colors font-semibold text-lg border-2 ${
                affordable
                  ? `${getRarityBgColor(upgrade.rarity)} text-white ${getRarityColor(upgrade.rarity)}`
                  : 'bg-gray-400 cursor-not-allowed text-gray-200 border-gray-300'
              }`}
            >
              <div className="flex flex-col">
                <span className="text-sm uppercase tracking-wide opacity-75">{upgrade.rarity}</span>
                <span>{upgrade.name} {getUpgradeDescription(upgrade)}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
