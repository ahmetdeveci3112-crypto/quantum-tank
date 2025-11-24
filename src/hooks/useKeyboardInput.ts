import { useState, useEffect } from 'react';

export const useKeyboardInput = () => {
    const [movement, setMovement] = useState({ x: 0, y: 0 });
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [isMouseDown, setIsMouseDown] = useState(false);

    useEffect(() => {
        const keys = new Set<string>();

        const handleKeyDown = (e: KeyboardEvent) => {
            keys.add(e.code);
            updateMovement();
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            keys.delete(e.code);
            updateMovement();
        };

        const updateMovement = () => {
            let x = 0;
            let y = 0;

            if (keys.has('KeyW') || keys.has('ArrowUp')) y -= 1;
            if (keys.has('KeyS') || keys.has('ArrowDown')) y += 1;
            if (keys.has('KeyA') || keys.has('ArrowLeft')) x -= 1;
            if (keys.has('KeyD') || keys.has('ArrowRight')) x += 1;

            // Normalize vector
            const magnitude = Math.sqrt(x * x + y * y);
            if (magnitude > 0) {
                x /= magnitude;
                y /= magnitude;
            }

            setMovement({ x, y });
        };

        const handleMouseMove = (e: MouseEvent) => {
            setMousePos({ x: e.clientX, y: e.clientY });
        };

        const handleMouseDown = () => setIsMouseDown(true);
        const handleMouseUp = () => setIsMouseDown(false);

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    return { movement, mousePos, isMouseDown };
};
