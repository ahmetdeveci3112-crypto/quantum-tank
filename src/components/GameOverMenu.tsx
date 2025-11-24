import React from 'react';

interface GameOverMenuProps {
    score: number;
    highScore: number;
    onRestart: () => void;
}

export const GameOverMenu: React.FC<GameOverMenuProps> = ({ score, highScore, onRestart }) => {
    const isNewRecord = score > highScore;

    return (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-50 pointer-events-auto">
            <div className="text-center p-8 border border-red-500/30 rounded-lg bg-black/80 backdrop-blur-md max-w-md w-full">
                <h2 className="text-red-500 text-6xl font-bold mb-2 font-mono tracking-tighter animate-pulse">
                    CRITICAL FAILURE
                </h2>
                <p className="text-red-400/60 mb-8 font-mono text-sm">SYSTEM INTEGRITY COMPROMISED</p>

                <div className="mb-12 space-y-4">
                    <div className="bg-red-900/10 p-6 rounded border border-red-500/20">
                        <p className="text-gray-400 font-mono text-sm mb-1">FINAL SCORE</p>
                        <p className="text-4xl text-white font-mono font-bold">{score}</p>
                    </div>

                    {isNewRecord && (
                        <div className="text-yellow-400 font-mono text-sm animate-bounce">
                            NEW HIGH SCORE RECORD!
                        </div>
                    )}
                </div>

                <button
                    onClick={onRestart}
                    className="w-full py-4 bg-red-600 hover:bg-red-500 text-black font-bold text-xl rounded transition-all transform hover:scale-105 hover:shadow-[0_0_20px_rgba(255,0,0,0.4)] font-mono"
                >
                    REBOOT SYSTEM
                </button>
            </div>
        </div>
    );
};
