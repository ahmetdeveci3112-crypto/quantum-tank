import { useState, useRef, useEffect, useCallback } from 'react'
import { GameCanvas } from './components/GameCanvas'
import { Joystick } from './components/Joystick'
import { ShootButton } from './components/ShootButton'
import { MainMenu } from './components/MainMenu'
import { GameOverMenu } from './components/GameOverMenu'
import { useGameLoop } from './hooks/useGameLoop'
import { useKeyboardInput } from './hooks/useKeyboardInput'
import type { GameState, Entity } from './game/GameState'
import { INITIAL_STATE } from './game/GameState'

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

  // Game Constants
  const PLAYER_SPEED = 0.4;
  const ENEMY_SPEED = 0.2;
  const BULLET_SPEED = 1.0;
  const FIRE_RATE = 150;
  const SPAWN_RATE = 1500;
  const lastSpawnTimeRef = useRef(0);

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

    // Center player initially
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

  const handleShoot = useCallback(() => {
    setGameState(prev => {
      if (!prev.gameStarted || prev.gameOver) return prev;

      const now = Date.now();
      if (now - prev.player.lastShotTime < FIRE_RATE) return prev;

      const angle = prev.player.rotation;
      const velocity = {
        x: Math.cos(angle) * BULLET_SPEED,
        y: Math.sin(angle) * BULLET_SPEED
      };

      const newBullet: Entity = {
        id: `bullet-${now}`,
        type: 'bullet',
        position: { ...prev.player.position },
        velocity,
        rotation: angle,
        radius: 4,
        active: true,
        color: '#ffff00',
        health: 1
      };

      return {
        ...prev,
        player: { ...prev.player, lastShotTime: now },
        bullets: [...prev.bullets, newBullet],
        screenShake: { x: (Math.random() - 0.5) * 5, y: (Math.random() - 0.5) * 5 }
      };
    });
  }, []);

  // Auto-shoot with mouse
  useEffect(() => {
    if (isMouseDown && !gameState.gameOver && gameState.gameStarted) {
      const interval = setInterval(handleShoot, FIRE_RATE);
      handleShoot();
      return () => clearInterval(interval);
    }
  }, [isMouseDown, gameState.gameOver, gameState.gameStarted, handleShoot]);

  const updateGame = (deltaTime: number) => {
    if (gameState.gameOver || !gameState.gameStarted) return;

    // Combine inputs
    const combinedInput = {
      x: inputVector.x || keyboardMovement.x,
      y: inputVector.y || keyboardMovement.y
    };

    const inputMagnitude = Math.sqrt(combinedInput.x ** 2 + combinedInput.y ** 2);

    // "Superhot" mechanic
    const isActive = inputMagnitude > 0.1 || isMouseDown || gameState.bullets.length > 0;
    const timeScale = isActive ? 1 : 0.05;

    const scaledDelta = deltaTime * timeScale;

    setGameState(prev => {
      // 1. Update Player
      const newPlayerX = prev.player.position.x + combinedInput.x * PLAYER_SPEED * scaledDelta;
      const newPlayerY = prev.player.position.y + combinedInput.y * PLAYER_SPEED * scaledDelta;

      // Calculate rotation
      let playerRotation = prev.player.rotation;

      if (mousePos.x !== 0 || mousePos.y !== 0) {
        playerRotation = Math.atan2(mousePos.y - newPlayerY, mousePos.x - newPlayerX);
      } else if (inputMagnitude > 0.1) {
        playerRotation = Math.atan2(combinedInput.y, combinedInput.x);
      }

      // Keep player in bounds
      const clampedX = Math.max(20, Math.min(dimensions.width - 20, newPlayerX));
      const clampedY = Math.max(20, Math.min(dimensions.height - 20, newPlayerY));

      // 2. Spawn Enemies
      let newEnemies = [...prev.enemies];
      lastSpawnTimeRef.current += scaledDelta;
      if (lastSpawnTimeRef.current > SPAWN_RATE) {
        lastSpawnTimeRef.current = 0;
        const edge = Math.floor(Math.random() * 4);
        let ex = 0, ey = 0;
        switch (edge) {
          case 0: ex = Math.random() * dimensions.width; ey = -50; break;
          case 1: ex = dimensions.width + 50; ey = Math.random() * dimensions.height; break;
          case 2: ex = Math.random() * dimensions.width; ey = dimensions.height + 50; break;
          case 3: ex = -50; ey = Math.random() * dimensions.height; break;
        }

        newEnemies.push({
          id: `enemy-${Date.now()}-${Math.random()}`,
          type: 'enemy',
          position: { x: ex, y: ey },
          velocity: { x: 0, y: 0 },
          rotation: 0,
          radius: 15,
          active: true,
          color: '#ff0000',
          health: 1
        });
      }

      // 3. Update Enemies
      newEnemies = newEnemies.map(enemy => {
        const dx = clampedX - enemy.position.x;
        const dy = clampedY - enemy.position.y;
        const angle = Math.atan2(dy, dx);

        return {
          ...enemy,
          position: {
            x: enemy.position.x + Math.cos(angle) * ENEMY_SPEED * scaledDelta,
            y: enemy.position.y + Math.sin(angle) * ENEMY_SPEED * scaledDelta
          },
          rotation: angle
        };
      });

      // 4. Update Bullets
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

      // 5. Update Particles
      let newParticles = prev.particles.map(p => ({
        ...p,
        position: {
          x: p.position.x + p.velocity.x * scaledDelta,
          y: p.position.y + p.velocity.y * scaledDelta
        },
        life: p.life - (0.02 * timeScale)
      })).filter(p => p.life > 0);

      // 6. Collision Detection
      let score = prev.score;
      let gameOver = false;
      let screenShake = { ...prev.screenShake };

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
            enemy.active = false;
            score += 100;

            for (let i = 0; i < 8; i++) {
              const pAngle = Math.random() * Math.PI * 2;
              const speed = Math.random() * 2 + 1;
              newParticles.push({
                id: `p-${Date.now()}-${i}`,
                position: { ...enemy.position },
                velocity: { x: Math.cos(pAngle) * speed, y: Math.sin(pAngle) * speed },
                life: 1.0,
                maxLife: 1.0,
                color: '#ff4400',
                size: Math.random() * 4 + 2
              });
            }

            screenShake.x = (Math.random() - 0.5) * 10;
            screenShake.y = (Math.random() - 0.5) * 10;
          }
        });
      });

      // Enemy vs Player
      newEnemies.forEach(enemy => {
        if (!enemy.active) return;
        const dx = enemy.position.x - clampedX;
        const dy = enemy.position.y - clampedY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < enemy.radius + prev.player.radius) {
          gameOver = true;
          screenShake.x = (Math.random() - 0.5) * 20;
          screenShake.y = (Math.random() - 0.5) * 20;
        }
      });

      newEnemies = newEnemies.filter(e => e.active);
      newBullets = newBullets.filter(b => b.active);

      return {
        ...prev,
        player: {
          ...prev.player,
          position: { x: clampedX, y: clampedY },
          rotation: playerRotation
        },
        enemies: newEnemies,
        bullets: newBullets,
        particles: newParticles,
        screenShake,
        score,
        gameOver
      };
    });
  };

  useGameLoop(updateGame);

  const startGame = () => {
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
        {/* HUD - Only show when game started and not over */}
        {gameState.gameStarted && !gameState.gameOver && (
          <div className="flex justify-between items-start animate-fade-in">
            <div className="bg-black/50 p-4 rounded border border-green-500/30 backdrop-blur-sm">
              <h1 className="text-green-500 font-mono text-xl font-bold">QUANTUM TANK</h1>
              <p className="text-green-400/70 text-sm font-mono">SYSTEM: ONLINE</p>
            </div>
            <div className="bg-black/50 p-4 rounded border border-green-500/30 backdrop-blur-sm">
              <p className="text-green-500 font-mono text-xl">SCORE: {gameState.score}</p>
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

        {/* Controls - Only show when game started and not over */}
        {gameState.gameStarted && !gameState.gameOver && (
          <div className="flex justify-between items-end pb-8 pointer-events-auto">
            <Joystick
              onMove={setInputVector}
              onStop={() => setInputVector({ x: 0, y: 0 })}
            />
            <ShootButton onShoot={handleShoot} disabled={gameState.gameOver} />
          </div>
        )}
      </div>
    </div>
  )
}

export default App
