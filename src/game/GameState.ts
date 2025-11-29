export type Vector2 = { x: number; y: number };

export type EntityType = 'player' | 'enemy' | 'bullet' | 'wall' | 'powerup';

export interface Entity {
    id: string;
    type: EntityType;
    subtype?: 'normal' | 'dasher' | 'health' | 'overcharge'; // For enemies and powerups
    position: Vector2;
    velocity: Vector2;
    rotation: number;
    radius: number;
    active: boolean;
    color: string;
    health: number;
    maxHealth?: number;
    hitFlashTime?: number; // For visual feedback
}

export interface Player extends Entity {
    lastShotTime: number;
    turretRotation: number;
    dashCooldown: number;
    overchargeTime: number; // Time remaining for double fire rate
    recoil: number; // Visual recoil distance
}

export interface Particle {
    id: string;
    position: Vector2;
    velocity: Vector2;
    life: number; // 0 to 1
    maxLife: number;
    color: string;
    size: number;
}

export interface DamageText {
    id: string;
    position: Vector2;
    text: string;
    life: number;
    velocity: Vector2;
    color: string;
}

export interface Debris {
    id: string;
    position: Vector2;
    rotation: number;
    color: string;
    type: 'scorch' | 'part';
}

export interface GameState {
    player: Player;
    enemies: Entity[];
    bullets: Entity[];
    walls: Entity[];
    particles: Particle[];
    damageTexts: DamageText[];
    powerUps: Entity[];
    debris: Debris[];
    screenShake: Vector2;
    isMoving: boolean;
    score: number;
    highScore: number;
    level: number;
    gameOver: boolean;
    gameStarted: boolean;
}

export const INITIAL_STATE: GameState = {
    player: {
        id: 'player',
        type: 'player',
        position: { x: 0, y: 0 },
        velocity: { x: 0, y: 0 },
        rotation: 0,
        turretRotation: 0,
        radius: 15, // Reduced from 20 for easier dodging
        active: true,
        color: '#00ff00',
        health: 100,
        maxHealth: 100,
        lastShotTime: 0,
        dashCooldown: 0,
        overchargeTime: 0,
        recoil: 0,
    },
    enemies: [],
    bullets: [],
    walls: [],
    particles: [],
    damageTexts: [],
    powerUps: [],
    debris: [],
    screenShake: { x: 0, y: 0 },
    isMoving: false,
    score: 0,
    highScore: 0,
    level: 1,
    gameOver: false,
    gameStarted: false,
};
