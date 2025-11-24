import { useEffect, useRef } from 'react';

export const useGameLoop = (
    callback: (deltaTime: number) => void,
    isRunning: boolean = true
) => {
    const requestRef = useRef<number | null>(null);
    const previousTimeRef = useRef<number | undefined>(undefined);

    const animate = (time: number) => {
        if (previousTimeRef.current !== undefined) {
            const deltaTime = time - previousTimeRef.current;
            callback(deltaTime);
        }
        previousTimeRef.current = time;
        requestRef.current = requestAnimationFrame(animate);
    };

    useEffect(() => {
        if (isRunning) {
            requestRef.current = requestAnimationFrame(animate);
        } else {
            if (requestRef.current !== null) {
                cancelAnimationFrame(requestRef.current);
            }
            previousTimeRef.current = undefined;
        }

        return () => {
            if (requestRef.current !== null) {
                cancelAnimationFrame(requestRef.current);
            }
        };
    }, [isRunning, callback]);
};
