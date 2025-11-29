import { useState, useRef, useEffect, useCallback } from 'react'
import { GameCanvas } from './components/GameCanvas'
import { MobileControls } from './components/MobileControls'
import { MainMenu } from './components/MainMenu'
import { GameOverMenu } from './components/GameOverMenu'
import { useGameLoop } from './hooks/useGameLoop'
import { useKeyboardInput } from './hooks/useKeyboardInput'
import { soundManager } from './game/SoundManager'
import type { GameState, Entity } from './game/GameState'
import { INITIAL_STATE } from './game/GameState'

// Dynamic Level Stats Generator
const getLevelStats = (level: number) => {
  const cappedLevel = Math.min(level, 30);

  // Base stats (Level 1 baseline)
  let stats = {
    enemySpeed: 0.1,
    fireRate: 150,
    spawnRate: 2500,
    enemyHealth: 1,
    bulletSpeed: 1.0,
    playerSpeed: 0.4,
    shotCount: 1,
    spread: 0
  };

  if (cappedLevel <= 5) {
    // Phase 1: Training (1-5) - Very Slow Start
    const progress = (cappedLevel - 1) / 4; // 0 to 1
    stats.spawnRate = 2500 - (500 * progress); // 2500 -> 2000
    stats.enemySpeed = 0.1 + (0.05 * progress); // 0.1 -> 0.15
    stats.enemyHealth = 1;
    stats.shotCount = 1;
  } else if (cappedLevel <= 10) {
    // Phase 2: Skirmish (6-10) - Heating Up
    const progress = (cappedLevel - 6) / 4;
    stats.spawnRate = 1900 - (400 * progress); // 1900 -> 1500
    stats.enemySpeed = 0.16 + (0.04 * progress); // 0.16 -> 0.2
    stats.enemyHealth = 2;
    stats.shotCount = 2; // Double Shot
    stats.spread = 5;
    stats.bulletSpeed = 1.2;
  } else if (cappedLevel <= 20) {
    // Phase 3: Warfare (11-20) - Fast Paced
    const progress = (cappedLevel - 11) / 9;
    stats.spawnRate = 1400 - (600 * progress); // 1400 -> 800
    stats.enemySpeed = 0.21 + (0.09 * progress); // 0.21 -> 0.3
    stats.enemyHealth = 3 + Math.floor(progress * 1.5); // 3 -> 4
    stats.shotCount = cappedLevel >= 16 ? 4 : 3; // Triple -> Quad Shot
    stats.spread = 10;
    stats.bulletSpeed = 1.5;
    stats.playerSpeed = 0.45;
  } else {
    // Phase 4: Chaos (21-30) - Bullet Hell
    const progress = (cappedLevel - 21) / 9;
    stats.spawnRate = 750 - (450 * progress); // 750 -> 300
    stats.enemySpeed = 0.35 + (0.15 * progress); // 0.35 -> 0.5
    stats.enemyHealth = 5 + Math.floor(progress * 3); // 5 -> 8
    stats.shotCount = 5; // Penta Shot
    stats.spread = 15;
    stats.bulletSpeed = 1.8;
    stats.playerSpeed = 0.5;
    stats.fireRate = 100; // Faster fire rate
  }

  return stats;
};

function App() {
  const [gameState, setGameState] = useState<GameState>(INITIAL_STATE);
  const [inputVector, setInputVector] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('quantum-tank-highscore');
    return saved ? parseInt(saved, 10) : 0;
  });

  // Keyboard & Mouse Input
  const { movement: keyboardMovement, mousePos, isMouseDown } = useKeyboardInput();

  const lastSpawnTimeRef = useRef(0);
  const lastPowerUpTimeRef = useRef(0);

  // Handle resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };

    window.addEventListener('resize', updateDimensions);
    updateDimensions();

    setGameState(prev => ({
      ...prev,
      player: {
        ...prev.player,
        position: {
          x: window.innerWidth / 2,
          y: window.innerHeight / 2
        }
      }
    }));

    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Save High Score
  useEffect(() => {
    if (gameState.score > highScore) {
      setHighScore(gameState.score);
      localStorage.setItem('quantum-tank-highscore', gameState.score.toString());
    }
  }, [gameState.score, highScore]);

  // Dash Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setGameState(prev => {
          if (prev.player.dashCooldown > 0 || !prev.gameStarted || prev.gameOver) return prev;

          // Dash Logic
          const dashSpeed = 15; // Instant burst
          const angle = prev.player.rotation;
          const dashVelocity = {
            x: Math.cos(angle) * dashSpeed,
            y: Math.sin(angle) * dashSpeed
          };

          // Add particles for dash
          const newParticles = [...prev.particles];
          for (let i = 0; i < 10; i++) {
            newParticles.push({
              id: `dash-${Date.now()}-${i}`,
              position: { ...prev.player.position },
              velocity: { x: (Math.random() - 0.5) * 2, y: (Math.random() - 0.5) * 2 },
              life: 0.5,
              maxLife: 0.5,
              color: '#00ffff',
              size: 3
            });
          }

          return {
            ...prev,
            player: {
              ...prev.player,
              position: {
                x: prev.player.position.x + dashVelocity.x * 5, // Instant teleport-like move
                y: prev.player.position.y + dashVelocity.y * 5
              },
              dashCooldown: 2000 // 2s cooldown
            },
            particles: newParticles,
            screenShake: { x: dashVelocity.x, y: dashVelocity.y }
          };
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleShoot = useCallback(() => {
    setGameState(prev => {
      if (!prev.gameStarted || prev.gameOver) return prev;

      const stats = getLevelStats(prev.level);
      const now = Date.now();

      // Fire Rate Logic (Overcharge halves the delay)
      const fireRateDelay = prev.player.overchargeTime > 0 ? stats.fireRate / 2 : stats.fireRate;

      if (now - prev.player.lastShotTime < fireRateDelay) return prev;

      const baseAngle = prev.player.turretRotation;
      const newBullets: Entity[] = [];
      const count = stats.shotCount;
      const spread = stats.spread;

      const perpX = Math.cos(baseAngle + Math.PI / 2);
      const perpY = Math.sin(baseAngle + Math.PI / 2);

      for (let i = 0; i < count; i++) {
        let offsetX = 0;
        let offsetY = 0;
        let angle = baseAngle;

        if (prev.level >= 25) { // Chaos Mode Spread
          angle = baseAngle + (Math.random() - 0.5) * 0.2;
        } else if (count > 1) {
          const offsetScalar = (i - (count - 1) / 2) * spread;
          offsetX = perpX * offsetScalar;
          offsetY = perpY * offsetScalar;
        }

        const velocity = {
          x: Math.cos(angle) * stats.bulletSpeed,
          y: Math.sin(angle) * stats.bulletSpeed
        };

        newBullets.push({
          id: `bullet-${now}-${i}`,
          type: 'bullet',
          position: {
            x: prev.player.position.x + offsetX,
            y: prev.player.position.y + offsetY
          },
          velocity,
          rotation: angle,
          radius: 4,
          active: true,
          color: prev.player.overchargeTime > 0 ? '#00ffff' : '#ffff00', // Blue bullets when overcharged
          health: 1
        });
      }

      soundManager.playShoot();

      return {
        ...prev,
        player: {
          ...prev.player,
          lastShotTime: now,
          recoil: 5 // Set recoil amount
        },
        bullets: [...prev.bullets, ...newBullets],
        screenShake: { x: (Math.random() - 0.5) * 2, y: (Math.random() - 0.5) * 2 }
      };
    });
  }, []);

  // Auto-shoot
  useEffect(() => {
    if (isMouseDown && !gameState.gameOver && gameState.gameStarted) {
      const stats = getLevelStats(gameState.level);
      const fireRate = gameState.player.overchargeTime > 0 ? stats.fireRate / 2 : stats.fireRate;
      const interval = setInterval(handleShoot, fireRate);
      handleShoot();
      return () => clearInterval(interval);
    }
  }, [isMouseDown, gameState.gameOver, gameState.gameStarted, gameState.level, gameState.player.overchargeTime, handleShoot]);

  const handleMobileAim = useCallback((angle: number) => {
    setGameState(prev => ({
      ...prev,
      player: { ...prev.player, turretRotation: angle }
    }));
  }, []);

  const updateGame = (deltaTime: number) => {
    if (gameState.gameOver || !gameState.gameStarted) return;

    const combinedInput = {
      x: inputVector.x || keyboardMovement.x,
      y: inputVector.y || keyboardMovement.y
    };

    const inputMagnitude = Math.sqrt(combinedInput.x ** 2 + combinedInput.y ** 2);
    const timeScale = 1.0;
    const scaledDelta = deltaTime * timeScale;

    setGameState(prev => {
      // Level Calculation: Level up every 500 points
      let newLevel = Math.floor(prev.score / 500) + 1;
      if (newLevel > 30) newLevel = 30; // Cap at 30

      if (newLevel > prev.level) soundManager.playLevelUp();

      const stats = getLevelStats(newLevel);

      // 1. Update Player
      const newPlayerX = prev.player.position.x + combinedInput.x * stats.playerSpeed * scaledDelta;
      const newPlayerY = prev.player.position.y + combinedInput.y * stats.playerSpeed * scaledDelta;

      let playerRotation = prev.player.rotation;
      if (inputMagnitude > 0.1) {
        playerRotation = Math.atan2(combinedInput.y, combinedInput.x);
      }

      let turretRotation = prev.player.turretRotation;
      if (mousePos.x !== 0 || mousePos.y !== 0) {
        turretRotation = Math.atan2(mousePos.y - newPlayerY, mousePos.x - newPlayerX);
      }

      const clampedX = Math.max(20, Math.min(dimensions.width - 20, newPlayerX));
      const clampedY = Math.max(20, Math.min(dimensions.height - 20, newPlayerY));

      // 2. Spawn Enemies
      let newEnemies = [...prev.enemies];
      lastSpawnTimeRef.current += scaledDelta;
      if (lastSpawnTimeRef.current > stats.spawnRate) {
        lastSpawnTimeRef.current = 0;
        const edge = Math.floor(Math.random() * 4);
        let ex = 0, ey = 0;
        switch (edge) {
          case 0: ex = Math.random() * dimensions.width; ey = -50; break;
          case 1: ex = dimensions.width + 50; ey = Math.random() * dimensions.height; break;
          case 2: ex = Math.random() * dimensions.width; ey = dimensions.height + 50; break;
          case 3: ex = -50; ey = Math.random() * dimensions.height; break;
        }

        // Dasher Spawn Chance (Increases with level)
        // Level 1-5: 5%
        // Level 6-15: 10%
        // Level 16+: 20%
        let dasherChance = 0.05;
        if (newLevel > 15) dasherChance = 0.2;
        else if (newLevel > 5) dasherChance = 0.1;

        const isDasher = Math.random() < dasherChance;

        newEnemies.push({
          id: `enemy-${Date.now()}-${Math.random()}`,
          type: 'enemy',
          subtype: isDasher ? 'dasher' : 'normal',
          position: { x: ex, y: ey },
          velocity: { x: 0, y: 0 },
          rotation: 0,
          radius: isDasher ? 12 : 15,
          active: true,
          color: isDasher ? '#ffaa00' : (newLevel >= 10 ? '#ff00ff' : '#ff0000'),
          health: isDasher ? 1 : stats.enemyHealth,
          maxHealth: isDasher ? 1 : stats.enemyHealth,
          hitFlashTime: 0
        });
      }

      // 3. Spawn Powerups (Rare)
      let newPowerUps = [...prev.powerUps];
      lastPowerUpTimeRef.current += scaledDelta;
      if (lastPowerUpTimeRef.current > 10000) { // Every 10s check
        if (Math.random() < 0.3) { // 30% chance
          lastPowerUpTimeRef.current = 0;
          const type = Math.random() < 0.5 ? 'health' : 'overcharge';
          newPowerUps.push({
            id: `pu-${Date.now()}`,
            type: 'powerup',
            subtype: type,
            position: { x: Math.random() * dimensions.width, y: Math.random() * dimensions.height },
            velocity: { x: 0, y: 0 },
            rotation: 0,
            radius: 10,
            active: true,
            color: type === 'health' ? '#00ff00' : '#00ffff',
            health: 1
          });
        } else {
          lastPowerUpTimeRef.current = 5000; // Retry sooner
        }
      }

      // 4. Update Enemies (AI)
      newEnemies = newEnemies.map(enemy => {
        const dx = clampedX - enemy.position.x;
        const dy = clampedY - enemy.position.y;
        const angle = Math.atan2(dy, dx);
        let speed = stats.enemySpeed;

        if (enemy.subtype === 'dasher') {
          // Dasher Logic: Burst movement (Rebalanced)
          const time = Date.now();
          // 2s Cycle: 0.5s Dash, 1.5s Rest
          const cycle = time % 2000;
          if (cycle < 500) {
            speed = stats.enemySpeed * 2.5; // Dash!
          } else {
            speed = stats.enemySpeed * 0.1; // Rest
          }
        }

        return {
          ...enemy,
          position: {
            x: enemy.position.x + Math.cos(angle) * speed * scaledDelta,
            y: enemy.position.y + Math.sin(angle) * speed * scaledDelta
          },
          rotation: angle,
          hitFlashTime: Math.max(0, (enemy.hitFlashTime || 0) - scaledDelta)
        };
      });

      // 5. Update Bullets
      let newBullets = prev.bullets.map(bullet => ({
        ...bullet,
        position: {
          x: bullet.position.x + bullet.velocity.x * scaledDelta,
          y: bullet.position.y + bullet.velocity.y * scaledDelta
        }
      })).filter(b =>
        b.position.x > 0 && b.position.x < dimensions.width &&
        b.position.y > 0 && b.position.y < dimensions.height
      );

      // 6. Update Particles & Text
      let newParticles = prev.particles.map(p => ({
        ...p,
        position: {
          x: p.position.x + p.velocity.x * scaledDelta,
          y: p.position.y + p.velocity.y * scaledDelta
        },
        life: p.life - 0.02
      })).filter(p => p.life > 0);

      let newDamageTexts = prev.damageTexts.map(t => ({
        ...t,
        position: {
          x: t.position.x + t.velocity.x * scaledDelta,
          y: t.position.y + t.velocity.y * scaledDelta
        },
        life: t.life - 0.02
      })).filter(t => t.life > 0);

      // 7. Collision Detection
      let score = prev.score;
      let gameOver = false;
      let screenShake = { ...prev.screenShake };
      let newDebris = [...prev.debris];

      screenShake.x *= 0.9;
      screenShake.y *= 0.9;
      if (Math.abs(screenShake.x) < 0.1) screenShake.x = 0;
      if (Math.abs(screenShake.y) < 0.1) screenShake.y = 0;

      // Bullet vs Enemy
      newBullets.forEach(bullet => {
        if (!bullet.active) return;
        newEnemies.forEach(enemy => {
          if (!enemy.active) return;
          const dx = bullet.position.x - enemy.position.x;
          const dy = bullet.position.y - enemy.position.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < bullet.radius + enemy.radius) {
            bullet.active = false;

            // Damage Logic
            const damage = 1;
            enemy.health -= damage;
            enemy.hitFlashTime = 100; // Flash white

            // Damage Text
            newDamageTexts.push({
              id: `dt-${Date.now()}-${Math.random()}`,
              position: { ...enemy.position },
              text: damage.toString(),
              life: 1.0,
              velocity: { x: (Math.random() - 0.5) * 2, y: -2 },
              color: '#fff'
            });

            if (enemy.health <= 0) {
              enemy.active = false;
              score += 100;
              soundManager.playExplosion();

              // Scorch Mark
              newDebris.push({
                id: `scorch-${Date.now()}`,
                position: { ...enemy.position },
                rotation: Math.random() * Math.PI * 2,
                color: '#333',
                type: 'scorch'
              });

              // Explosion Particles
              for (let i = 0; i < 8; i++) {
                const pAngle = Math.random() * Math.PI * 2;
                const speed = Math.random() * 2 + 1;
                newParticles.push({
                  id: `p-${Date.now()}-${i}`,
                  position: { ...enemy.position },
                  velocity: { x: Math.cos(pAngle) * speed, y: Math.sin(pAngle) * speed },
                  life: 1.0,
                  maxLife: 1.0,
                  color: enemy.color,
                  size: Math.random() * 4 + 2
                });
              }

              screenShake.x = (Math.random() - 0.5) * 10;
              screenShake.y = (Math.random() - 0.5) * 10;
            } else {
              soundManager.playHit();
            }
          }
        });
      });

      // Player vs Powerup
      newPowerUps = newPowerUps.filter(pu => {
        const dx = pu.position.x - clampedX;
        const dy = pu.position.y - clampedY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < pu.radius + prev.player.radius) {
          soundManager.playLevelUp(); // Reuse sound for now
          if (pu.subtype === 'health') {
            // Heal
            // We need to update player health in state, but it's nested.
            // Handled in return block implicitly by not modifying it here, 
            // but we need to signal it.
            // Actually, let's just add a flag or modify a local var.
            // Since we reconstruct state at the end, we can't easily modify 'prev' in place here.
            // We'll handle it in the return object.
            return false; // Remove powerup
          } else if (pu.subtype === 'overcharge') {
            return false;
          }
        }
        return true;
      });

      // Check for powerup pickup effects (Logic duplication fix)
      let playerHealth = prev.player.health;
      let overchargeTime = Math.max(0, prev.player.overchargeTime - scaledDelta);

      prev.powerUps.forEach(pu => {
        const dx = pu.position.x - clampedX;
        const dy = pu.position.y - clampedY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < pu.radius + prev.player.radius) {
          if (pu.subtype === 'health') {
            playerHealth = Math.min(100, playerHealth + 25);
            newDamageTexts.push({
              id: `heal-${Date.now()}`,
              position: { x: clampedX, y: clampedY - 20 },
              text: "+25 HP",
              life: 1.0,
              velocity: { x: 0, y: -2 },
              color: '#00ff00'
            });
          } else if (pu.subtype === 'overcharge') {
            overchargeTime = 5000; // 5 seconds
            newDamageTexts.push({
              id: `oc-${Date.now()}`,
              position: { x: clampedX, y: clampedY - 20 },
              text: "OVERCHARGE!",
              life: 1.0,
              velocity: { x: 0, y: -2 },
              color: '#00ffff'
            });
          }
        }
      });

      // Enemy vs Player
      newEnemies.forEach(enemy => {
        if (!enemy.active) return;
        const dx = enemy.position.x - clampedX;
        const dy = enemy.position.y - clampedY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < enemy.radius + prev.player.radius) {
          gameOver = true;
          soundManager.playGameOver();
          screenShake.x = (Math.random() - 0.5) * 20;
          screenShake.y = (Math.random() - 0.5) * 20;
        }
      });

      newEnemies = newEnemies.filter(e => e.active);
      newBullets = newBullets.filter(b => b.active);

      // Recoil Decay
      const newRecoil = Math.max(0, prev.player.recoil - 0.5);

      return {
        ...prev,
        player: {
          ...prev.player,
          position: { x: clampedX, y: clampedY },
          rotation: playerRotation,
          turretRotation,
          dashCooldown: Math.max(0, prev.player.dashCooldown - scaledDelta),
          overchargeTime,
          recoil: newRecoil,
          health: playerHealth
        },
        enemies: newEnemies,
        bullets: newBullets,
        particles: newParticles,
        damageTexts: newDamageTexts,
        powerUps: newPowerUps,
        debris: newDebris,
        screenShake,
        score,
        level: newLevel,
        gameOver
      };
    });
  };

  useGameLoop(updateGame);

  const startGame = () => {
    soundManager.init();
    setGameState(prev => ({ ...prev, gameStarted: true }));
  };

  const restartGame = () => {
    setGameState({
      ...INITIAL_STATE,
      gameStarted: true,
      player: {
        ...INITIAL_STATE.player,
        position: { x: dimensions.width / 2, y: dimensions.height / 2 }
      }
    });
  };

  return (
    <div className="w-full h-screen bg-black overflow-hidden flex flex-col relative">
      {/* Game Layer */}
      <div ref={containerRef} className="absolute inset-0 z-0">
        <GameCanvas
          gameState={gameState}
          width={dimensions.width}
          height={dimensions.height}
        />
      </div>

      {/* UI Layer */}
      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-6">
        {/* HUD */}
        {gameState.gameStarted && !gameState.gameOver && (
          <div className="flex justify-between items-start animate-fade-in w-full">
            <div className="flex flex-col gap-2">
              <div className="bg-black/50 p-4 rounded border border-green-500/30 backdrop-blur-sm">
                <h1 className="text-green-500 font-mono text-xl font-bold">QUANTUM TANK</h1>
                <div className="w-48 h-4 bg-gray-800 rounded mt-2 overflow-hidden border border-gray-600">
                  <div
                    className="h-full bg-green-500 transition-all duration-300"
                    style={{ width: `${gameState.player.health}%` }}
                  />
                </div>
                <p className="text-green-400/70 text-xs font-mono mt-1">HULL INTEGRITY</p>
              </div>
              {gameState.player.dashCooldown > 0 && (
                <div className="bg-black/50 p-2 rounded border border-blue-500/30 backdrop-blur-sm">
                  <p className="text-blue-400 text-xs font-mono">DASH RECHARGING...</p>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 items-end">
              <div className="bg-black/50 p-4 rounded border border-green-500/30 backdrop-blur-sm">
                <p className="text-green-500 font-mono text-xl">SCORE: {gameState.score}</p>
              </div>
              <div className="bg-black/50 p-2 rounded border border-yellow-500/30 backdrop-blur-sm">
                <p className="text-yellow-500 font-mono text-lg">LEVEL {gameState.level}</p>
              </div>
            </div>
          </div>
        )}

        {/* Menus */}
        {!gameState.gameStarted && (
          <MainMenu onStart={startGame} highScore={highScore} />
        )}

        {gameState.gameOver && (
          <GameOverMenu
            score={gameState.score}
            highScore={highScore}
            onRestart={restartGame}
          />
        )}

        {/* Controls */}
        {gameState.gameStarted && !gameState.gameOver && (
          <MobileControls
            onMove={setInputVector}
            onAim={handleMobileAim}
            onShoot={handleShoot}
          />
        )}
      </div>
    </div>
  )
}

export default App
