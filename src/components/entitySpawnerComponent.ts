import {
    BaseComponent,
    BaseController,
    BasicPhysicsListener,
    GameObject,
    Sequence,
    TransformComponent,
    TransformWatcher
} from "@essentialskills/gameenginets";

type Bounds = { x: number; y: number; width: number; height: number; };
type Point = { x: number; y: number; };
type Range = { min: number; max: number; };
type Scale = number | Point | Range | { x: Range; y: Range; };
type SpawnMode = "manual" | "once" | "interval";
type DirectionMode = "random" | "fixed" | "towardOwner" | "awayFromOwner";

type EntitySpawnerOptions = {
    /** Entity name already loaded into the parent scene's entity map. */
    entity: string;

    /** Object groups to place each spawned object into. */
    groups?: string[];

    /** Optional prefix for generated runtime IDs. */
    idPrefix?: string;

    /** Spawn behavior. `manual` only spawns through commands. */
    spawnMode?: SpawnMode;

    /** Number of objects spawned by `once` mode. */
    count?: number;

    /** Number of objects spawned per interval or manual command. */
    burstCount?: number;

    /** Seconds between interval bursts. */
    interval?: number;

    /** Seconds before interval or once spawning begins. */
    startDelay?: number;

    /** Maximum number of live spawned objects tracked by this spawner. */
    maxAlive?: number;

    /** Optional maximum number of objects this spawner may create. */
    maxTotal?: number;

    /** Where objects may be spawned when using random placement. */
    bounds?: Bounds;

    /** Keeps random spawn positions this far inside the bounds. */
    edgePadding?: number;

    /** Fixed spawn point. If absent, random bounds or parent transform position is used. */
    position?: Point;

    /** Random positions must be at least this far from the spawner owner's Transform. */
    minDistanceFromTransform?: number;

    /** Backward-compatible alias for minDistanceFromTransform. */
    safeRadius?: number;

    /** Random positions must be at least minDistanceFromGroupEntities from objects in these groups. */
    avoidGroups?: string[];

    /** Minimum distance from objects in avoidGroups. */
    minDistanceFromGroupEntities?: number;

    /** Backward-compatible alias for minDistanceFromGroupEntities. */
    avoidRadius?: number;

    /** Number of attempts to find a valid random position before falling back. */
    maxPositionAttempts?: number;

    /** Optional initial rotation in radians. */
    rotation?: number;

    /** Random rotation range in radians. `true` means 0..2π. */
    randomRotation?: boolean | Range;

    /** Optional scale override. Supports uniform, x/y, uniform range, or x/y ranges. */
    scale?: Scale;

    /** Optional alias to apply after spawning. */
    alias?: string;

    /** Optional payload passed to a component with ID `Load` on the spawned object. */
    load?: any;

    /** Optional initial velocity configuration for a `BasicPhysicsListener` component. */
    velocity?: {
        speed?: number | Range;
        angle?: number;
        direction?: DirectionMode;
        componentID?: string;
    };

    /** Optional initial torque configuration for a `BasicPhysicsListener` component. */
    torque?: number | Range;

    /** Optional transform component ID on spawned objects. Defaults to `Transform`. */
    spawnedTransformID?: string;

    /** Optional sequence-like scene command that runs after each spawn. */
    onSpawn?: { commandName: string; properties?: any; };
};

/**
 * Creates runtime GameObjects from a loaded Entity.
 *
 * This component is intentionally generic. It knows how to spawn entities, place
 * them, assign groups, and optionally seed common transform/physics values. Game
 * rules such as scoring, damage, drops, and mission progress should remain in
 * entity trigger sequences, scene commands, or game-specific components.
 */
export class EntitySpawnerComponent extends BaseComponent {
    private readonly options: Required<Omit<EntitySpawnerOptions,
        "bounds" | "position" | "rotation" | "randomRotation" | "scale" | "alias" | "load" | "velocity" | "torque" | "onSpawn">> & {
            bounds?: Bounds;
            position?: Point;
            rotation?: number;
            randomRotation?: boolean | Range;
            scale?: Scale;
            alias?: string;
            load?: any;
            velocity?: EntitySpawnerOptions["velocity"];
            torque?: EntitySpawnerOptions["torque"];
            onSpawn?: EntitySpawnerOptions["onSpawn"];
        };

    protected transform: TransformWatcher | null = null;

    private elapsed = 0;
    private nextInterval = 0;
    private hasSpawnedOnce = false;
    private spawnIndex = 0;
    private totalSpawned = 0;
    private liveObjects = new Set<GameObject>();

    constructor(base: any, options: EntitySpawnerOptions) {
        super(base);
        this.options = {
            entity: options.entity,
            groups: options.groups ?? ["gameObjects"],
            idPrefix: options.idPrefix ?? options.entity,
            spawnMode: options.spawnMode ?? "once",
            count: options.count ?? 1,
            burstCount: options.burstCount ?? 1,
            interval: options.interval ?? 1,
            startDelay: options.startDelay ?? 0,
            maxAlive: options.maxAlive ?? Number.POSITIVE_INFINITY,
            maxTotal: options.maxTotal ?? Number.POSITIVE_INFINITY,
            bounds: options.bounds ? { ...options.bounds } : undefined,
            edgePadding: options.edgePadding ?? 0,
            position: options.position ? { ...options.position } : undefined,
            minDistanceFromTransform: options.minDistanceFromTransform ?? options.safeRadius ?? 0,
            safeRadius: options.safeRadius ?? 0,
            avoidGroups: options.avoidGroups ?? [],
            minDistanceFromGroupEntities: options.minDistanceFromGroupEntities ?? options.avoidRadius ?? 0,
            avoidRadius: options.avoidRadius ?? 0,
            maxPositionAttempts: options.maxPositionAttempts ?? 30,
            rotation: options.rotation,
            randomRotation: options.randomRotation,
            scale: options.scale,
            alias: options.alias,
            load: options.load,
            velocity: options.velocity,
            torque: options.torque,
            spawnedTransformID: options.spawnedTransformID ?? "Transform",
            onSpawn: options.onSpawn
        };
    }

    public requiredImport(importComponent: BaseComponent): void {
        if (importComponent instanceof TransformComponent)
            this.transform = importComponent.options;
    }

    public update(gt: { dt: number; currentTime: number; gameTime: number; }): void {
        if (!this.isEnabled || this.options.spawnMode === "manual") return;

        this.elapsed += gt.dt;
        if (this.elapsed < this.options.startDelay) return;

        if (this.options.spawnMode === "once") {
            if (this.hasSpawnedOnce) return;
            this.hasSpawnedOnce = true;
            this.spawnMany(this.options.count);
            return;
        }

        if (this.elapsed < this.nextInterval) return;
        this.nextInterval = this.elapsed + this.options.interval;
        this.spawnMany(this.options.burstCount);
    }

    public execute(_parentSequence: Sequence | null, commandName: string, properties: any): { found: boolean; finished: boolean; } {
        switch (commandName) {
            case "spawn":
                this.spawnMany(properties?.count ?? this.options.burstCount, properties);
                return { found: true, finished: true };
            case "resetSpawner":
                this.resetSpawner();
                return { found: true, finished: true };
        }

        return { found: false, finished: true };
    }

    private spawnMany(count: number, overrides?: Partial<EntitySpawnerOptions>): GameObject[] {
        const spawned: GameObject[] = [];

        for (let index = 0; index < count; index++) {
            if (!this.canSpawn()) break;
            spawned.push(this.spawnOne(overrides));
        }

        return spawned;
    }

    private canSpawn(): boolean {
        this.pruneLiveObjects();
        if (this.liveObjects.size >= this.options.maxAlive) return false;
        if (this.totalSpawned >= this.options.maxTotal) return false;
        return true;
    }

    private spawnOne(overrides?: Partial<EntitySpawnerOptions>): GameObject {
        const scene = this.parentObject!.parentScene;
        const entityName = overrides?.entity ?? this.options.entity;
        const entity = scene.entities.map[entityName];

        if (!entity) throw new Error(`EntitySpawnerComponent "${this.id}" could not find entity "${entityName}".`);

        const gameObject = scene.instantiateLiveGameObject(entity);
        gameObject.id = this.nextObjectID(gameObject.id, overrides?.idPrefix);
        this.liveObjects.add(gameObject);
        this.totalSpawned++;

        const groups = overrides?.groups ?? this.options.groups;
        scene.objectGroups.addToGroups(gameObject, groups);

        this.applyLoad(gameObject, overrides?.load ?? this.options.load);
        this.applyTransform(gameObject, overrides);
        this.applyMotion(gameObject, overrides);

        const alias = overrides?.alias ?? this.options.alias;
        if (alias) gameObject.setAlias(alias);

        this.runOnSpawn(gameObject, overrides?.onSpawn ?? this.options.onSpawn);
        return gameObject;
    }

    private nextObjectID(defaultID: string, idPrefix?: string): string {
        const prefix = idPrefix ?? this.options.idPrefix;
        return `${prefix}-${this.spawnIndex++}-${defaultID}`;
    }

    private applyLoad(gameObject: GameObject, load: any): void {
        if (!load) return;

        const loadComponent = gameObject.getComponent("Load") as any;
        if (!loadComponent || typeof loadComponent.load !== "function")
            throw new Error(`EntitySpawnerComponent "${this.id}" expected spawned object "${gameObject.id}" to have a Load component.`);

        loadComponent.load(load);
    }

    private applyTransform(gameObject: GameObject, overrides?: Partial<EntitySpawnerOptions>): void {
        const transformID = overrides?.spawnedTransformID ?? this.options.spawnedTransformID;
        const transform = gameObject.getComponent(transformID) as TransformComponent | undefined;

        if (!transform) {
            if (BaseController.debugMode) console.warn(`EntitySpawnerComponent "${this.id}" could not find spawned transform "${transformID}" on "${gameObject.id}".`);
            return;
        }

        transform.options.position = this.resolvePosition(overrides);
        transform.options.rotation = { angle: this.resolveRotation(overrides) };

        const scale = this.resolveScale(overrides?.scale ?? this.options.scale);
        if (scale) transform.options.scale = scale;
    }

    private applyMotion(gameObject: GameObject, overrides?: Partial<EntitySpawnerOptions>): void {
        const velocity = overrides?.velocity ?? this.options.velocity;
        const torque = overrides?.torque ?? this.options.torque;
        if (!velocity && torque === undefined) return;

        const motionID = velocity?.componentID ?? "Motion";
        const motion = gameObject.getComponent(motionID) as BasicPhysicsListener | undefined;

        if (!motion) {
            if (BaseController.debugMode) console.warn(`EntitySpawnerComponent "${this.id}" could not find motion component "${motionID}" on "${gameObject.id}".`);
            return;
        }

        if (velocity) {
            const speed = this.resolveNumber(velocity.speed ?? 0);
            const angle = this.resolveVelocityAngle(velocity);
            motion.options.velocity = { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed };
        }

        if (torque !== undefined) motion.options.torque = this.resolveNumber(torque);
    }

    private getOwnerPosition(): Point {
        return this.transform?.position ? { ...this.transform.position } : { x: 0, y: 0 };
    }

    private resolvePosition(overrides?: Partial<EntitySpawnerOptions>): Point {
        if (overrides?.position) return { ...overrides.position };
        if (this.options.position) return { ...this.options.position };

        const bounds = overrides?.bounds ?? this.options.bounds;
        if (bounds) return this.randomPosition(bounds, overrides);

        return this.getOwnerPosition();
    }

    private randomPosition(bounds: Bounds, overrides?: Partial<EntitySpawnerOptions>): Point {
        const padding = overrides?.edgePadding ?? this.options.edgePadding;
        const minDistanceFromTransform = overrides?.minDistanceFromTransform ?? overrides?.safeRadius ?? this.options.minDistanceFromTransform;
        const minDistanceFromGroupEntities = overrides?.minDistanceFromGroupEntities ?? overrides?.avoidRadius ?? this.options.minDistanceFromGroupEntities;
        const attempts = overrides?.maxPositionAttempts ?? this.options.maxPositionAttempts;

        for (let attempt = 0; attempt < attempts; attempt++) {
            const position = {
                x: bounds.x + padding + Math.random() * Math.max(0, bounds.width - padding * 2),
                y: bounds.y + padding + Math.random() * Math.max(0, bounds.height - padding * 2)
            };

            if (minDistanceFromTransform > 0 && !this.isFarFromOwner(position, minDistanceFromTransform)) continue;
            if (minDistanceFromGroupEntities > 0 && !this.isFarFromAvoidGroups(position, minDistanceFromGroupEntities, overrides?.avoidGroups ?? this.options.avoidGroups)) continue;
            return position;
        }

        const fallback = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };

        console.warn(`EntitySpawnerComponent "${this.id}" could not find a valid random spawn position after ${attempts} attempts.`, {
            bounds,
            padding,
            minDistanceFromTransform,
            minDistanceFromGroupEntities,
            avoidGroups: overrides?.avoidGroups ?? this.options.avoidGroups,
            fallback
        });

        return fallback;
    }

    private isFarFromOwner(position: Point, radius: number): boolean {
        const ownerPosition = this.getOwnerPosition();
        return this.distanceSquared(position, ownerPosition) >= radius * radius;
    }

    private isFarFromAvoidGroups(position: Point, radius: number, groupNames: string[]): boolean {
        const scene = this.parentObject!.parentScene;
        const radiusSquared = radius * radius;

        for (const groupName of groupNames) {
            const group = scene.objectGroups.getGroup(groupName);
            for (const object of group.list) {
                const transform = object.getComponent(this.options.spawnedTransformID) as TransformComponent | undefined;
                if (transform?.options?.position && this.distanceSquared(position, transform.options.position) < radiusSquared) return false;
            }
        }

        return true;
    }

    private resolveRotation(overrides?: Partial<EntitySpawnerOptions>): number {
        if (overrides?.rotation !== undefined) return overrides.rotation;

        const randomRotation = overrides?.randomRotation ?? this.options.randomRotation;
        if (randomRotation === true) return Math.random() * Math.PI * 2;
        if (typeof randomRotation === "object") return this.randomRange(randomRotation);

        return this.options.rotation ?? 0;
    }

    private resolveScale(scale?: Scale): Point | undefined {
        if (scale === undefined) return undefined;
        if (typeof scale === "number") return { x: scale, y: scale };
        if ("min" in scale && "max" in scale) {
            const value = this.randomRange(scale);
            return { x: value, y: value };
        }
        if ("x" in scale && typeof scale.x === "object") return { x: this.randomRange(scale.x), y: this.randomRange((scale as any).y ?? scale.x) };
        return scale as Point;
    }

    private resolveVelocityAngle(velocity: NonNullable<EntitySpawnerOptions["velocity"]>): number {
        if (velocity.angle !== undefined) return velocity.angle;

        switch (velocity.direction ?? "random") {
            case "fixed": return 0;
            case "towardOwner": return this.angleBetweenSpawnAndOwner(true);
            case "awayFromOwner": return this.angleBetweenSpawnAndOwner(false);
            case "random":
            default: return Math.random() * Math.PI * 2;
        }
    }

    private angleBetweenSpawnAndOwner(towardOwner: boolean): number {
        const ownerPosition = this.getOwnerPosition();
        const spawnPosition = this.options.position ?? ownerPosition;
        const dx = towardOwner ? ownerPosition.x - spawnPosition.x : spawnPosition.x - ownerPosition.x;
        const dy = towardOwner ? ownerPosition.y - spawnPosition.y : spawnPosition.y - ownerPosition.y;
        return Math.atan2(dy, dx);
    }

    private runOnSpawn(gameObject: GameObject, command?: { commandName: string; properties?: any; }): void {
        if (!command) return;
        gameObject.execute(null as any, command.commandName, command.properties ?? {});
    }

    private pruneLiveObjects(): void {
        [...this.liveObjects].forEach(object => {
            if (!object.isValid) this.liveObjects.delete(object);
        });
    }

    private resetSpawner(): void {
        this.elapsed = 0;
        this.nextInterval = 0;
        this.hasSpawnedOnce = false;
        this.spawnIndex = 0;
        this.totalSpawned = 0;
        this.liveObjects.clear();
    }

    private resolveNumber(value: number | Range): number {
        return typeof value === "number" ? value : this.randomRange(value);
    }

    private randomRange(range: Range): number {
        return range.min + Math.random() * (range.max - range.min);
    }

    private distanceSquared(a: Point, b: Point): number {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        return dx * dx + dy * dy;
    }
}
