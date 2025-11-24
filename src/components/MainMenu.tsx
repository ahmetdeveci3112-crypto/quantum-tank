import React from 'react';

interface MainMenuProps {
    onStart: () => void;
    highScore: number;
}

export const MainMenu: React.FC<MainMenuProps> = ({ onStart, highScore }) => {
    return (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-50 pointer-events-auto">
            <div className="text-center max-w-md w-full p-8 border border-green-500/30 rounded-lg bg-black/50 backdrop-blur-md shadow-[0_0_50px_rgba(0,255,0,0.1)]">
                <h1 className="text-6xl font-bold mb-2 font-mono text-transparent bg-clip-text bg-gradient-to-b from-green-400 to-green-600 tracking-tighter">
                    QUANTUM TANK
                </h1>
                <p className="text-green-400/60 mb-12 font-mono text-sm tracking-widest">
                    TACTICAL SIMULATION v2.0
                </p>

                <div className="space-y-6 mb-12">
                    <div className="bg-green-900/10 p-4 rounded border border-green-500/20">
                        <p className="text-green-400 font-mono text-sm mb-2">MISSION PROTOCOL</p>
                        <p className="text-white/80 font-mono text-xs">
                            TIME DILATION ACTIVE. TIME MOVES ONLY WHEN YOU MOVE OR ENGAGE WEAPONS.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs font-mono text-gray-400">
                        <div className="border border-white/10 p-2 rounded">
                            <span className="block text-green-500 mb-1">MOVEMENT</span>
                            WASD / ARROWS
                        </div>
                        <div className="border border-white/10 p-2 rounded">
                            <span className="block text-green-500 mb-1">COMBAT</span>
                            MOUSE / TAP
                        </div>
                    </div>
                </div>

                <button
                    onClick={onStart}
                    className="w-full py-4 bg-green-600 hover:bg-green-500 text-black font-bold text-xl rounded transition-all transform hover:scale-105 hover:shadow-[0_0_20px_rgba(0,255,0,0.4)] font-mono group relative overflow-hidden"
                >
                    <span className="relative z-10">INITIALIZE SYSTEM</span>
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                </button>

                {highScore > 0 && (
                    <p className="mt-8 text-green-500/50 font-mono text-sm">
                        HIGH SCORE RECORD: {highScore}
                    </p>
                )}
            </div>
        </div>
    );
};
