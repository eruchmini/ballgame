import React from 'react';

export const GameOver = ({ score }) => {
  return (
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 p-6 bg-red-100 border-4 border-red-400 rounded-lg text-center shadow-2xl z-20">
      <h2 className="text-3xl font-bold text-red-700 mb-2">Game Over!</h2>
      <p className="text-xl text-gray-700">Final Score: {score}</p>
      <p className="text-sm text-gray-600 mt-2">Click "New Game" to try again</p>
    </div>
  );
};
