import React from 'react';
import { Crosshair } from 'lucide-react';

interface ShootButtonProps {
    onShoot: () => void;
    disabled?: boolean;
}

export const ShootButton: React.FC<ShootButtonProps> = ({ onShoot, disabled }) => {
    return (
        <button
            className={`
        w-24 h-24 rounded-full border-4 flex items-center justify-center
        transition-all duration-100 active:scale-95 touch-none select-none
        ${disabled
                    ? 'bg-gray-800 border-gray-600 opacity-50 cursor-not-allowed'
                    : 'bg-red-500/20 border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.4)] active:bg-red-500/40'}
      `}
            onPointerDown={(e) => {
                e.preventDefault(); // Prevent default touch actions
                if (!disabled) onShoot();
            }}
        >
            <Crosshair className={`w-10 h-10 ${disabled ? 'text-gray-500' : 'text-red-500'}`} />
        </button>
    );
};
