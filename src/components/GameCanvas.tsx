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
        ctx.fillStyle = '#050505'; // Very dark background
        ctx.fillRect(0, 0, width, height);

        ctx.save(); // Start Screen Shake Transform
        if (gameState.screenShake) {
            ctx.translate(gameState.screenShake.x, gameState.screenShake.y);
        }

        // Draw Grid (Animated & Glowing)
        const time = Date.now() / 1000;
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.15;
        ctx.shadowBlur = 5;
        ctx.shadowColor = '#00ff00';

        const gridSize = 50;
        const offset = (time * 20) % gridSize;

        // Vertical lines
        for (let x = 0; x < width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
        // Horizontal lines (Moving down)
        for (let y = offset - gridSize; y < height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }

        ctx.globalAlpha = 1.0; // Reset alpha

        // Draw Debris (Scorch marks)
        gameState.debris.forEach(d => {
            ctx.save();
            ctx.translate(d.position.x, d.position.y);
            ctx.rotate(d.rotation);
            ctx.fillStyle = d.color;
            ctx.globalAlpha = 0.5;
            if (d.type === 'scorch') {
                ctx.beginPath();
                ctx.arc(0, 0, 15, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        });

        // Draw Particles
        gameState.particles.forEach(p => {
            ctx.save();
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.shadowBlur = 10;
            ctx.shadowColor = p.color;
            ctx.beginPath();
            ctx.arc(p.position.x, p.position.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });

        // Draw Powerups
        gameState.powerUps.forEach(pu => {
            if (!pu.active) return;
            ctx.save();
            ctx.translate(pu.position.x, pu.position.y);

            // Pulse Effect
            const scale = 1 + Math.sin(time * 5) * 0.2;
            ctx.scale(scale, scale);

            ctx.fillStyle = pu.color;
            ctx.shadowBlur = 15;
            ctx.shadowColor = pu.color;

            if (pu.subtype === 'health') {
                // Cross
                ctx.fillRect(-4, -10, 8, 20);
                ctx.fillRect(-10, -4, 20, 8);
            } else {
                // Bolt
                ctx.beginPath();
                ctx.moveTo(5, -10);
                ctx.lineTo(-5, 0);
                ctx.lineTo(0, 0);
                ctx.lineTo(-5, 10);
                ctx.lineTo(5, 0);
                ctx.lineTo(0, 0);
                ctx.closePath();
                ctx.fill();
            }
            ctx.restore();
        });

        // Draw Player
        const { player, level } = gameState;

        ctx.save();
        ctx.translate(player.position.x, player.position.y);
        ctx.rotate(player.rotation);

        // Metallic Gradient for Body
        const bodyGrad = ctx.createLinearGradient(-15, -15, 15, 15);
        bodyGrad.addColorStop(0, '#00ff00');
        bodyGrad.addColorStop(0.5, '#55ff55');
        bodyGrad.addColorStop(1, '#004400');

        ctx.fillStyle = bodyGrad;
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#00ff00';

        // Level-dependent Body Shape
        if (level === 1) {
            ctx.fillRect(-15, -15, 30, 30);
        } else if (level === 2) {
            ctx.beginPath();
            ctx.moveTo(15, -5);
            ctx.lineTo(15, 5);
            ctx.lineTo(5, 15);
            ctx.lineTo(-5, 15);
            ctx.lineTo(-15, 5);
            ctx.lineTo(-15, -5);
            ctx.lineTo(-5, -15);
            ctx.lineTo(5, -15);
            ctx.closePath();
            ctx.fill();
        } else if (level >= 3) {
            ctx.fillRect(-18, -18, 36, 36);
            ctx.fillStyle = '#003300';
            ctx.fillRect(-12, -22, 24, 44);
        }
        ctx.restore();

        // Draw Turret (Rotated by aim + Recoil)
        ctx.save();
        ctx.translate(player.position.x, player.position.y);
        ctx.rotate(player.turretRotation);

        // Recoil kickback
        if (player.recoil > 0) {
            ctx.translate(-player.recoil, 0);
        }

        ctx.fillStyle = '#fff';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#fff';

        if (level < 3) {
            ctx.fillRect(0, -5, 25, 10);
        } else {
            ctx.fillRect(0, -8, 30, 6);
            ctx.fillRect(0, 2, 30, 6);
        }

        // Muzzle Flash
        if (player.recoil > 3) {
            ctx.fillStyle = '#ffff00';
            ctx.beginPath();
            ctx.arc(30, 0, 10 + Math.random() * 5, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();

        // Draw Enemies
        gameState.enemies.forEach(enemy => {
            if (!enemy.active) return;
            ctx.save();
            ctx.translate(enemy.position.x, enemy.position.y);
            ctx.rotate(enemy.rotation); // Rotate to face movement

            // Hit Flash
            if (enemy.hitFlashTime && enemy.hitFlashTime > 0) {
                ctx.fillStyle = '#ffffff';
                ctx.shadowColor = '#ffffff';
            } else {
                const enemyGrad = ctx.createLinearGradient(-15, -15, 15, 15);
                enemyGrad.addColorStop(0, enemy.color);
                enemyGrad.addColorStop(1, '#000');
                ctx.fillStyle = enemyGrad;
                ctx.shadowColor = enemy.color;
            }

            ctx.shadowBlur = 15;
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;

            ctx.beginPath();
            if (enemy.subtype === 'dasher') {
                // Dasher (Arrow shape)
                ctx.moveTo(15, 0);
                ctx.lineTo(-10, 10);
                ctx.lineTo(-5, 0);
                ctx.lineTo(-10, -10);
            } else if (enemy.health > 2) {
                // Tanky Enemy (Diamond)
                ctx.moveTo(15, 0);
                ctx.lineTo(0, 15);
                ctx.lineTo(-15, 0);
                ctx.lineTo(0, -15);
            } else {
                // Standard Enemy (Triangle)
                ctx.moveTo(15, 0);
                ctx.lineTo(-10, 10);
                ctx.lineTo(-10, -10);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        });

        // Draw Bullets
        gameState.bullets.forEach(bullet => {
            if (!bullet.active) return;
            ctx.save();
            ctx.translate(bullet.position.x, bullet.position.y);
            ctx.fillStyle = bullet.color;
            ctx.shadowBlur = 15;
            ctx.shadowColor = bullet.color;
            ctx.beginPath();
            ctx.arc(0, 0, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });

        // Draw Damage Text
        gameState.damageTexts.forEach(t => {
            ctx.save();
            ctx.translate(t.position.x, t.position.y);
            ctx.fillStyle = t.color;
            ctx.font = 'bold 16px monospace';
            ctx.shadowBlur = 0;
            ctx.globalAlpha = t.life;
            ctx.fillText(t.text, 0, 0);
            ctx.restore();
        });

        ctx.restore(); // End Screen Shake Transform

        // CRT Scanline Effect (Overlay)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        for (let y = 0; y < height; y += 4) {
            ctx.fillRect(0, y, width, 1);
        }

        // Vignette
        const grad = ctx.createRadialGradient(width / 2, height / 2, height / 3, width / 2, height / 2, height);
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(1, 'rgba(0,0,0,0.6)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

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
