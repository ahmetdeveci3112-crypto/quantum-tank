import React, { useEffect, useRef, useState } from 'react';

interface JoystickProps {
    onMove: (vector: { x: number; y: number }) => void;
    onStop: () => void;
}

export const Joystick: React.FC<JoystickProps> = ({ onMove, onStop }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const knobRef = useRef<HTMLDivElement>(null);
    const [active, setActive] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const startPos = useRef({ x: 0, y: 0 });
    const maxRadius = 50; // Maximum distance the knob can move

    const handleStart = (clientX: number, clientY: number) => {
        setActive(true);
        startPos.current = { x: clientX, y: clientY };
        setPosition({ x: 0, y: 0 });
    };

    const handleMove = (clientX: number, clientY: number) => {
        if (!active) return;

        const dx = clientX - startPos.current.x;
        const dy = clientY - startPos.current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        let x = dx;
        let y = dy;

        if (distance > maxRadius) {
            const angle = Math.atan2(dy, dx);
            x = Math.cos(angle) * maxRadius;
            y = Math.sin(angle) * maxRadius;
        }

        setPosition({ x, y });

        // Normalize output between -1 and 1
        onMove({ x: x / maxRadius, y: y / maxRadius });
    };

    const handleEnd = () => {
        setActive(false);
        setPosition({ x: 0, y: 0 });
        onStop();
    };

    // Touch events
    const onTouchStart = (e: React.TouchEvent) => handleStart(e.touches[0].clientX, e.touches[0].clientY);
    const onTouchMove = (e: React.TouchEvent) => handleMove(e.touches[0].clientX, e.touches[0].clientY);

    // Mouse events for testing on desktop
    const onMouseDown = (e: React.MouseEvent) => handleStart(e.clientX, e.clientY);

    useEffect(() => {
        const onMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
        const onMouseUp = () => handleEnd();

        if (active) {
            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
            window.addEventListener('touchend', handleEnd);
        }

        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
            window.removeEventListener('touchend', handleEnd);
        };
    }, [active]);

    return (
        <div
            ref={containerRef}
            className="relative w-32 h-32 rounded-full bg-gray-800/50 border-2 border-gray-600 touch-none select-none"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onMouseDown={onMouseDown}
        >
            <div
                ref={knobRef}
                className="absolute w-12 h-12 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-transform duration-75 ease-out"
                style={{ transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px))` }}
            />
        </div>
    );
};
