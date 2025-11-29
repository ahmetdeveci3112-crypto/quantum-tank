import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { PerspectiveCamera, Stars } from '@react-three/drei';
import * as THREE from 'three';
import type { GameState, Entity } from '../game/GameState';

interface GameSceneProps {
    gameState: GameState;
    width: number;
    height: number;
}

// --- 3D Components ---

const Player3D: React.FC<{ player: GameState['player'], level: number }> = ({ player, level }) => {
    // Smooth rotation interpolation could go here, but direct mapping is snappier for arcade feel

    return (
        <group position={[player.position.x, 0, player.position.y]} rotation={[0, -player.rotation, 0]}>
            {/* Body */}
            <mesh castShadow receiveShadow>
                {level === 1 ? (
                    <boxGeometry args={[30, 10, 30]} />
                ) : level === 2 ? (
                    <cylinderGeometry args={[15, 20, 10, 8]} />
                ) : (
                    <boxGeometry args={[36, 15, 36]} />
                )}
                <meshStandardMaterial
                    color={player.color}
                    emissive={player.color}
                    emissiveIntensity={0.5}
                    roughness={0.2}
                    metalness={0.8}
                />
            </mesh>

            {/* Turret */}
            <group rotation={[0, -player.turretRotation + player.rotation, 0]} position={[0, 5, 0]}>
                <mesh position={[10, 0, 0]} castShadow>
                    {level < 3 ? (
                        <boxGeometry args={[25, 6, 6]} />
                    ) : (
                        <group>
                            <mesh position={[0, 0, -4]}>
                                <boxGeometry args={[30, 6, 4]} />
                                <meshStandardMaterial color="#fff" />
                            </mesh>
                            <mesh position={[0, 0, 4]}>
                                <boxGeometry args={[30, 6, 4]} />
                                <meshStandardMaterial color="#fff" />
                            </mesh>
                        </group>
                    )}
                    <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={0.2} />
                </mesh>
            </group>

            {/* Point Light for Player */}
            <pointLight position={[0, 10, 0]} intensity={2} distance={100} color={player.color} />
        </group>
    );
};

const Enemy3D: React.FC<{ enemy: Entity }> = ({ enemy }) => {
    return (
        <group position={[enemy.position.x, 0, enemy.position.y]} rotation={[0, -enemy.rotation, 0]}>
            <mesh castShadow receiveShadow>
                {enemy.health > 1 ? (
                    <octahedronGeometry args={[15]} /> // Tanky
                ) : (
                    <coneGeometry args={[10, 20, 4]} /> // Fast
                )}
                <meshStandardMaterial
                    color={enemy.color}
                    emissive={enemy.color}
                    emissiveIntensity={0.8}
                    roughness={0.1}
                    metalness={0.9}
                />
            </mesh>
        </group>
    );
};

const Bullet3D: React.FC<{ bullet: Entity }> = ({ bullet }) => {
    return (
        <group position={[bullet.position.x, 0, bullet.position.y]}>
            <mesh>
                <sphereGeometry args={[4, 8, 8]} />
                <meshBasicMaterial color="#ffff00" />
            </mesh>
            <pointLight intensity={1} distance={50} color="#ffff00" />
        </group>
    );
};

const Particle3D: React.FC<{ particle: any }> = ({ particle }) => {
    return (
        <mesh position={[particle.position.x, 0, particle.position.y]}>
            <sphereGeometry args={[particle.size, 4, 4]} />
            <meshBasicMaterial
                color={particle.color}
                transparent
                opacity={particle.life}
            />
        </mesh>
    );
};

const Floor: React.FC<{ width: number, height: number }> = ({ width, height }) => {
    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[width / 2, -10, height / 2]} receiveShadow>
            <planeGeometry args={[width * 2, height * 2]} />
            <meshStandardMaterial
                color="#111"
                roughness={0.1}
                metalness={0.5}
            />
            <gridHelper args={[Math.max(width, height) * 2, 50, '#222', '#111']} rotation={[-Math.PI / 2, 0, 0]} />
        </mesh>
    );
};

const CameraController: React.FC<{ playerPos: { x: number, y: number }, screenShake: { x: number, y: number } }> = ({ playerPos, screenShake }) => {
    const cameraRef = useRef<THREE.PerspectiveCamera>(null);

    useFrame(() => {
        if (cameraRef.current) {
            // Follow player with offset
            const targetX = playerPos.x + screenShake.x;
            const targetZ = playerPos.y + screenShake.y; // Y in 2D is Z in 3D

            // Smooth follow
            cameraRef.current.position.x += (targetX - cameraRef.current.position.x) * 0.1;
            cameraRef.current.position.z += (targetZ + 400 - cameraRef.current.position.z) * 0.1; // +400 for isometric view
            cameraRef.current.lookAt(targetX, 0, targetZ);
        }
    });

    return (
        <PerspectiveCamera
            makeDefault
            ref={cameraRef}
            position={[playerPos.x, 500, playerPos.y + 400]}
            fov={60}
        />
    );
};

// --- Main Scene ---

export const GameScene3D: React.FC<GameSceneProps> = ({ gameState, width, height }) => {
    return (
        <Canvas shadows dpr={[1, 2]}>
            <color attach="background" args={['#050505']} />

            <CameraController
                playerPos={gameState.player.position}
                screenShake={gameState.screenShake || { x: 0, y: 0 }}
            />

            <ambientLight intensity={0.2} />
            <directionalLight
                position={[100, 200, 100]}
                intensity={0.5}
                castShadow
            />

            <Player3D player={gameState.player} level={gameState.level} />

            {gameState.enemies.map(enemy => (
                <Enemy3D key={enemy.id} enemy={enemy} />
            ))}

            {gameState.bullets.map(bullet => (
                <Bullet3D key={bullet.id} bullet={bullet} />
            ))}

            {gameState.particles.map(p => (
                <Particle3D key={p.id} particle={p} />
            ))}

            <Floor width={width} height={height} />
            <Stars radius={300} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

            <EffectComposer>
                <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} height={300} intensity={1.5} />
                <Vignette eskil={false} offset={0.1} darkness={1.1} />
            </EffectComposer>
        </Canvas>
    );
};
