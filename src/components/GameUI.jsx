import React from 'react';

export const GameUI = ({
  score,
  resetGame,
  upgradePoints,
  setShowUpgradeMenu,
  musicEnabled,
  toggleMusic,
  otherPlayersCount,
  isGameMaster
}) => {
  return (
    <div className="absolute top-4 left-4 z-10 bg-white bg-opacity-90 rounded-lg shadow-lg p-4">
      <div className="flex items-center gap-4">
        <div className="text-xl font-semibold text-gray-700">
          Score: <span className="text-blue-600">{score}</span>
        </div>
        <button
          onClick={resetGame}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
        >
          New Game
        </button>
        {upgradePoints > 0 && (
          <button
            onClick={() => setShowUpgradeMenu(true)}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-semibold animate-pulse"
          >
            ⭐ {upgradePoints} Upgrade{upgradePoints !== 1 ? 's' : ''}
          </button>
        )}
        <button
          onClick={toggleMusic}
          className={`px-4 py-2 rounded-lg transition-colors ${
            musicEnabled ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-500 hover:bg-gray-600'
          } text-white`}
        >
          {musicEnabled ? '🔊' : '🔇'}
        </button>
      </div>
      <div className="mt-2 text-sm text-gray-600">
        Players: {otherPlayersCount + 1}
        {isGameMaster && <span className="ml-2 text-green-600 font-bold">★ Game Master</span>}
      </div>
    </div>
  );
};
