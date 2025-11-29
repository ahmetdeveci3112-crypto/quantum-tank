export type Vector2 = { x: number; y: number };

export type EntityType = 'player' | 'enemy' | 'bullet' | 'wall';

export interface Entity {
    id: string;
    type: EntityType;
    position: Vector2;
    velocity: Vector2;
    rotation: number;
    radius: number;
    active: boolean;
    color: string;
    health: number;
}

export interface Player extends Entity {
    lastShotTime: number;
    turretRotation: number;
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

export interface GameState {
    player: Player;
    enemies: Entity[];
    bullets: Entity[];
    walls: Entity[];
    particles: Particle[];
    screenShake: Vector2;
    isMoving: boolean;
    score: number;
    highScore: number;
    level: number;
    gameOver: boolean;
    gameStarted: boolean; // New field for Main Menu
}

export const INITIAL_STATE: GameState = {
    player: {
        id: 'player',
        type: 'player',
        position: { x: 0, y: 0 },
        velocity: { x: 0, y: 0 },
        rotation: 0,
        turretRotation: 0,
        radius: 20,
        active: true,
        color: '#00ff00',
        health: 100,
        lastShotTime: 0,
    },
    enemies: [],
    bullets: [],
    walls: [],
    particles: [],
    screenShake: { x: 0, y: 0 },
    isMoving: false,
    score: 0,
    highScore: 0,
    level: 1,
    gameOver: false,
    gameStarted: false,
};
