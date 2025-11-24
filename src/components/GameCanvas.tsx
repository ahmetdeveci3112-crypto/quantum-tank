import React, { useEffect, useRef } from 'react';
import type { GameState } from '../game/GameState';

interface GameCanvasProps {
    gameState: GameState;
    width: number;
    height: number;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ gameState, width, height }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.fillStyle = '#111'; // Dark background
        ctx.fillRect(0, 0, width, height);

        ctx.save(); // Start Screen Shake Transform
        if (gameState.screenShake) {
            ctx.translate(gameState.screenShake.x, gameState.screenShake.y);
        }

        // Draw Grid (Cyberpunk style)
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 1;
        const gridSize = 50;

        // Offset grid slightly to give depth feeling if we wanted, but static is fine
        for (let x = 0; x < width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
        for (let y = 0; y < height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }

        // Draw Particles
        gameState.particles.forEach(p => {
            ctx.save();
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.position.x, p.position.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });

        // Draw Player
        const { player } = gameState;
        ctx.save();
        ctx.translate(player.position.x, player.position.y);
        ctx.rotate(player.rotation);

        // Tank Body
        ctx.fillStyle = player.color;
        ctx.shadowBlur = 20;
        ctx.shadowColor = player.color;
        ctx.fillRect(-15, -15, 30, 30);

        // Tank Turret
        ctx.fillStyle = '#fff';
        ctx.shadowBlur = 0;
        ctx.fillRect(0, -5, 25, 10);

        ctx.restore();

        // Draw Enemies
        gameState.enemies.forEach(enemy => {
            if (!enemy.active) return;
            ctx.save();
            ctx.translate(enemy.position.x, enemy.position.y);
            ctx.fillStyle = '#ff0044'; // Cyberpunk Red
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#ff0044';
            ctx.beginPath();
            ctx.moveTo(15, 0);
            ctx.lineTo(-10, 10);
            ctx.lineTo(-10, -10);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        });

        // Draw Bullets
        gameState.bullets.forEach(bullet => {
            if (!bullet.active) return;
            ctx.save();
            ctx.translate(bullet.position.x, bullet.position.y);
            ctx.fillStyle = '#ffff00';
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#ffff00';
            ctx.beginPath();
            ctx.arc(0, 0, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });

        ctx.restore(); // End Screen Shake Transform

        // CRT Scanline Effect (Overlay)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        for (let y = 0; y < height; y += 4) {
            ctx.fillRect(0, y, width, 1);
        }

    }, [gameState, width, height]);

    return (
        <canvas
            ref={canvasRef}
            width={width}
            height={height}
            className="block mx-auto border border-gray-700 shadow-2xl"
        />
    );
};
