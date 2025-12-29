import React from 'react';

export const UpgradeMenu = ({
  upgradePoints,
  speedUpgrades,
  doubleClickUpgrades,
  explosionUpgrades,
  trackingUpgrades,
  buySpeedUpgrade,
  buyDoubleClickUpgrade,
  buyExplosionUpgrade,
  buyTrackingUpgrade,
  onClose
}) => {
  return (
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 p-6 bg-white border-4 border-purple-500 rounded-lg shadow-2xl z-20 min-w-96">
      <h2 className="text-3xl font-bold text-purple-700 mb-4 text-center">Choose Upgrade!</h2>
      <p className="text-center mb-4 text-gray-600">Upgrade Points: {upgradePoints}</p>

      <div className="space-y-3">
        <button
          onClick={buySpeedUpgrade}
          className="w-full p-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold text-lg"
        >
          🚀 Speed +10% (Current: +{speedUpgrades * 10}%)
        </button>

        <button
          onClick={buyDoubleClickUpgrade}
          className="w-full p-4 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors font-semibold text-lg"
        >
          💥 Multi-Shot: {doubleClickUpgrades + 1}x blast{doubleClickUpgrades > 0 ? 's' : ''} per click (1s cooldown)
        </button>

        <button
          onClick={buyExplosionUpgrade}
          className="w-full p-4 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-semibold text-lg"
        >
          💣 Bigger Explosions +50% (Current: +{explosionUpgrades * 50}%)
        </button>

        <button
          onClick={buyTrackingUpgrade}
          disabled={upgradePoints < 2 || trackingUpgrades > 0}
          className={`w-full p-4 rounded-lg transition-colors font-semibold text-lg ${
            trackingUpgrades > 0
              ? 'bg-gray-400 cursor-not-allowed text-gray-200'
              : upgradePoints >= 2
                ? 'bg-purple-500 hover:bg-purple-600 text-white'
                : 'bg-gray-400 cursor-not-allowed text-gray-200'
          }`}
        >
          🎯 Bullet Tracking 0.5s {trackingUpgrades > 0 ? '✓ OWNED' : '(Costs 2 Points)'}
        </button>
      </div>
    </div>
  );
};
