import React, { useRef, useState } from 'react';

interface MobileControlsProps {
    onMove: (vector: { x: number; y: number }) => void;
    onAim: (angle: number) => void;
    onShoot: () => void;
}

export const MobileControls: React.FC<MobileControlsProps> = ({ onMove, onAim, onShoot }) => {
    // Movement Joystick (Left)
    const [moveActive, setMoveActive] = useState(false);
    const [movePos, setMovePos] = useState({ x: 0, y: 0 });
    const moveStart = useRef({ x: 0, y: 0 });
    const maxRadius = 50;

    // Aiming Pad (Right)
    const [aimActive, setAimActive] = useState(false);
    const aimStart = useRef({ x: 0, y: 0 });

    // Movement Logic
    const handleMoveStart = (e: React.TouchEvent) => {
        const touch = e.changedTouches[0];
        setMoveActive(true);
        moveStart.current = { x: touch.clientX, y: touch.clientY };
        setMovePos({ x: 0, y: 0 });
    };

    const handleMove = (e: React.TouchEvent) => {
        if (!moveActive) return;
        const touch = Array.from(e.changedTouches).find(t => t.identifier === (e.targetTouches[0]?.identifier || 0));
        if (!touch) return;

        const dx = touch.clientX - moveStart.current.x;
        const dy = touch.clientY - moveStart.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        let x = dx;
        let y = dy;

        if (dist > maxRadius) {
            const angle = Math.atan2(dy, dx);
            x = Math.cos(angle) * maxRadius;
            y = Math.sin(angle) * maxRadius;
        }

        setMovePos({ x, y });
        onMove({ x: x / maxRadius, y: y / maxRadius });
    };

    const handleMoveEnd = () => {
        setMoveActive(false);
        setMovePos({ x: 0, y: 0 });
        onMove({ x: 0, y: 0 });
    };

    // Aiming Logic
    const handleAimStart = (e: React.TouchEvent) => {
        const touch = e.changedTouches[0];
        setAimActive(true);
        aimStart.current = { x: touch.clientX, y: touch.clientY };
    };

    const handleAimMove = (e: React.TouchEvent) => {
        if (!aimActive) return;
        const touch = e.changedTouches[0];

        // Calculate angle from center of right pad area (approx) or relative to start
        // Better: Relative to start of touch to act like a joystick, OR absolute center of pad
        // Let's do relative drag for precision
        const dx = touch.clientX - aimStart.current.x;
        const dy = touch.clientY - aimStart.current.y;

        if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
            const angle = Math.atan2(dy, dx);
            onAim(angle);
        }
    };

    const handleAimEnd = (e: React.TouchEvent) => {
        setAimActive(false);
        // Detect tap for shooting
        const touch = e.changedTouches[0];
        const dx = touch.clientX - aimStart.current.x;
        const dy = touch.clientY - aimStart.current.y;

        if (Math.sqrt(dx * dx + dy * dy) < 10) {
            onShoot();
        }
    };

    return (
        <div className="absolute inset-0 pointer-events-none flex">
            {/* Left Zone - Movement */}
            <div
                className="w-1/2 h-full pointer-events-auto relative touch-none"
                onTouchStart={handleMoveStart}
                onTouchMove={handleMove}
                onTouchEnd={handleMoveEnd}
            >
                {moveActive && (
                    <div
                        className="absolute w-24 h-24 rounded-full bg-white/10 border border-white/30 -translate-x-1/2 -translate-y-1/2"
                        style={{
                            left: moveStart.current.x,
                            top: moveStart.current.y
                        }}
                    >
                        <div
                            className="absolute w-10 h-10 rounded-full bg-green-500/50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                            style={{
                                transform: `translate(${movePos.x}px, ${movePos.y}px)`
                            }}
                        />
                    </div>
                )}
                <div className="absolute bottom-8 left-8 text-white/30 font-mono text-sm pointer-events-none">
                    DRAG TO MOVE
                </div>
            </div>

            {/* Right Zone - Aiming */}
            <div
                className="w-1/2 h-full pointer-events-auto relative touch-none"
                onTouchStart={handleAimStart}
                onTouchMove={handleAimMove}
                onTouchEnd={handleAimEnd}
            >
                <div className="absolute bottom-8 right-8 text-white/30 font-mono text-sm pointer-events-none text-right">
                    DRAG TO AIM<br />TAP TO SHOOT
                </div>

                {/* Visual Crosshair for center of right zone */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-red-500/20 rounded-full" />
            </div>
        </div>
    );
};
