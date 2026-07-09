import {
    BaseComponent,
    BasicPhysicsListener,
    EngineDebug,
    GameObject,
    Sequence,
    TransformComponent,
    TransformWatcher
} from "@essentialskills/gameenginets";

type Point = { x: number; y: number; };
type Range = { min: number; max: number; };
type Scale = number | Point | Range | { x: Range; y: Range; };
type SpawnSpace = "local" | "world";
type DirectionMode = "random" | "fixed" | "towardOwner" | "awayFromOwner";

type RectangleSpawnArea = {
    origin?: "center" | "topLeft";
    width: number;
    height: number;
    offset?: Point;
    padding?: number;
};

type CircleSpawnArea = {
    radius: number;
    innerRadius?: number;
    offset?: Point;
};

type SpawnArea = {
    space?: SpawnSpace;
    rectangle?: RectangleSpawnArea;
    circle?: CircleSpawnArea;
};

type StaticSpawnChannel = {
    count?: number;
    recipe?: string;
    enabled?: boolean;
};

type DynamicSpawnChannel = {
    targetCount?: number;
    burstCount?: number;
    interval?: number;
    startDelay?: number;
    recipe?: string;
    enabled?: boolean;
};

type SpawnProfile = {
    entity: string;
    groups: string[];
    idPrefix: string;
    spawnArea?: SpawnArea;
    bounds?: { x: number; y: number; width: number; height: number; };
    edgePadding: number;
    position?: Point;
    minDistanceFromTransform: number;
    safeRadius: number;
    avoidGroups: string[];
    minDistanceFromGroupEntities: number;
    avoidRadius: number;
    maxPositionAttempts: number;
    rotation?: number;
    randomRotation?: boolean | Range;
    scale?: Scale;
    alias?: string;
    load?: any;
    velocity?: {
        speed?: number | Range;
        angle?: number;
        direction?: DirectionMode;
        componentID?: string;
    };
    torque?: number | Range;
    spawnedTransformID: string;
    onSpawn?: { commandName: string; properties?: any; };
};

type SpawnRecipe = Partial<SpawnProfile> & {
    count?: number;
    burstCount?: number;
};

type SpawnCommand = Partial<SpawnProfile> & {
    recipe?: string;
    count?: number;
    burstCount?: number;
    manual?: string;
};

type EntitySpawnerOptions = Partial<SpawnProfile> & {
    entity: string;
    static?: StaticSpawnChannel;
    dynamic?: DynamicSpawnChannel;
    recipes?: Record<string, SpawnRecipe>;
    spawnMode?: "manual" | "once" | "interval" | "static" | "dynamic";
    count?: number;
    burstCount?: number;
    interval?: number;
    startDelay?: number;
    maxAlive?: number;
    maxTotal?: number;
};

/**
 * Creates runtime GameObjects from loaded Entities.
 *
 * Channels:
 * - static: creates an initial population once.
 * - dynamic: maintains a target live population over time.
 * - recipes: named spawn profiles triggered through the spawn command.
 */
export class EntitySpawnerComponent extends BaseComponent {
    private readonly options: Required<Omit<EntitySpawnerOptions,
        "position" | "rotation" | "randomRotation" | "scale" | "alias" | "load" | "velocity" | "torque" | "onSpawn" |
        "spawnArea" | "bounds" | "static" | "dynamic" | "recipes">> & SpawnProfile & {
            static?: StaticSpawnChannel;
            dynamic?: DynamicSpawnChannel;
            recipes: Record<string, SpawnRecipe>;
        };

    protected transform: TransformWatcher | null = null;

    private elapsed = 0;
    private nextDynamicSpawn = 0;
    private hasRunStatic = false;
    private spawnIndex = 0;
    private totalSpawned = 0;
    private liveObjects = new Set<GameObject>();

    constructor(base: any, options: EntitySpawnerOptions) {
        super(base);

        const staticChannel = options.static
            ?? (options.spawnMode === "once" || options.spawnMode === "static" ? { count: options.count ?? 1 } : undefined);

        const dynamicChannel = options.dynamic
            ?? (options.spawnMode === "interval" || options.spawnMode === "dynamic"
                ? {
                    targetCount: options.maxAlive ?? options.count ?? options.burstCount ?? 1,
                    burstCount: options.burstCount ?? 1,
                    interval: options.interval ?? 1,
                    startDelay: options.startDelay ?? 0
                }
                : undefined);

        this.options = {
            entity: options.entity,
            groups: options.groups ?? ["gameObjects"],
            idPrefix: options.idPrefix ?? options.entity,
            spawnArea: options.spawnArea,
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
            onSpawn: options.onSpawn,
            static: staticChannel,
            dynamic: dynamicChannel,
            recipes: options.recipes ?? {},
            spawnMode: options.spawnMode ?? (staticChannel ? "static" : dynamicChannel ? "dynamic" : "manual"),
            count: options.count ?? 1,
            burstCount: options.burstCount ?? 1,
            interval: options.interval ?? 1,
            startDelay: options.startDelay ?? 0,
            maxAlive: options.maxAlive ?? Number.POSITIVE_INFINITY,
            maxTotal: options.maxTotal ?? Number.POSITIVE_INFINITY
        };
    }

    public requiredImport(importComponent: BaseComponent): void {
        if (importComponent instanceof TransformComponent)
            this.transform = importComponent.options;
    }

    public update(gt: { dt: number; currentTime: number; gameTime: number; }): void {
        if (!this.isEnabled) return;

        this.elapsed += gt.dt;
        this.runStaticChannel();
        this.runDynamicChannel();
    }

    public execute(_parentSequence: Sequence | null, commandName: string, properties: any): { found: boolean; finished: boolean; } {
        switch (commandName) {
            case "spawn":
                this.spawnFromCommand(properties ?? {});
                return { found: true, finished: true };
            case "resetSpawner":
                this.resetSpawner();
                return { found: true, finished: true };
        }

        return { found: false, finished: true };
    }

    private runStaticChannel(): void {
        const channel = this.options.static;
        if (!channel || channel.enabled === false || this.hasRunStatic) return;

        this.hasRunStatic = true;
        const profile = this.resolveProfile(channel.recipe);
        this.spawnMany(channel.count ?? profile.count ?? this.options.count, profile);
    }

    private runDynamicChannel(): void {
        const channel = this.options.dynamic;
        if (!channel || channel.enabled === false) return;

        const startDelay = channel.startDelay ?? 0;
        if (this.elapsed < startDelay) return;
        if (this.elapsed < this.nextDynamicSpawn) return;

        this.nextDynamicSpawn = this.elapsed + (channel.interval ?? 1);
        this.pruneLiveObjects();

        const targetCount = channel.targetCount ?? this.options.maxAlive;
        if (this.liveObjects.size >= targetCount) return;

        const missing = Math.max(0, targetCount - this.liveObjects.size);
        const burstCount = Math.min(channel.burstCount ?? 1, missing);
        if (burstCount <= 0) return;

        this.spawnMany(burstCount, this.resolveProfile(channel.recipe));
    }

    private spawnFromCommand(command: SpawnCommand): GameObject[] {
        const recipeName = command.recipe ?? command.manual;
        const profile = this.resolveProfile(recipeName, command);
        const count = command.count ?? command.burstCount ?? profile.count ?? profile.burstCount ?? this.options.burstCount;
        return this.spawnMany(count, profile);
    }

    private resolveProfile(recipeName?: string, overrides?: Partial<SpawnProfile>): Partial<SpawnProfile> & { count?: number; burstCount?: number; } {
        const recipe = recipeName ? this.options.recipes[recipeName] : undefined;
        if (recipeName && !recipe) throw new Error(`EntitySpawnerComponent "${this.id}" could not find spawn recipe "${recipeName}".`);
        return { ...(recipe ?? {}), ...(overrides ?? {}) };
    }

    private spawnMany(count: number, overrides?: Partial<SpawnProfile>): GameObject[] {
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

    private spawnOne(overrides?: Partial<SpawnProfile>): GameObject {
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

    private applyTransform(gameObject: GameObject, overrides?: Partial<SpawnProfile>): void {
        const transformID = overrides?.spawnedTransformID ?? this.options.spawnedTransformID;
        const transform = gameObject.getComponent(transformID) as TransformComponent | undefined;

        if (!transform) {
            EngineDebug.warn(`EntitySpawnerComponent "${this.id}" could not find spawned transform "${transformID}" on "${gameObject.id}".`);
            return;
        }

        const position = this.resolvePosition(overrides);
        const rotation = this.resolveRotation(overrides);
        const scale = this.resolveScale(overrides?.scale ?? this.options.scale);

        transform.options.position.x = position.x;
        transform.options.position.y = position.y;
        transform.options.rotation.angle = rotation;

        if (scale) {
            transform.options.scale.x = scale.x;
            transform.options.scale.y = scale.y;
        }
    }

    private applyMotion(gameObject: GameObject, overrides?: Partial<SpawnProfile>): void {
        const velocity = overrides?.velocity ?? this.options.velocity;
        const torque = overrides?.torque ?? this.options.torque;
        if (!velocity && torque === undefined) return;

        const motionID = velocity?.componentID ?? "Motion";
        const motion = gameObject.getComponent(motionID) as BasicPhysicsListener | undefined;

        if (!motion) {
            EngineDebug.warn(`EntitySpawnerComponent "${this.id}" could not find motion component "${motionID}" on "${gameObject.id}".`);
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

    private resolvePosition(overrides?: Partial<SpawnProfile>): Point {
        if (overrides?.position) return { ...overrides.position };
        if (this.options.position) return { ...this.options.position };

        const spawnArea = overrides?.spawnArea ?? this.options.spawnArea;
        if (spawnArea) return this.randomPositionInSpawnArea(spawnArea, overrides);

        const bounds = overrides?.bounds ?? this.options.bounds;
        if (bounds) return this.randomPositionInLegacyBounds(bounds, overrides);

        return this.getOwnerPosition();
    }

    private randomPositionInSpawnArea(spawnArea: SpawnArea, overrides?: Partial<SpawnProfile>): Point {
        this.validateSpawnArea(spawnArea);

        const attempts = overrides?.maxPositionAttempts ?? this.options.maxPositionAttempts;
        const minDistanceFromTransform = overrides?.minDistanceFromTransform ?? overrides?.safeRadius ?? this.options.minDistanceFromTransform;
        const minDistanceFromGroupEntities = overrides?.minDistanceFromGroupEntities ?? overrides?.avoidRadius ?? this.options.minDistanceFromGroupEntities;
        const avoidGroups = overrides?.avoidGroups ?? this.options.avoidGroups;

        const fallback = this.resolveSpawnAreaAnchor(spawnArea);
        let lastPosition = fallback;

        for (let attempt = 0; attempt < attempts; attempt++) {
            const position = spawnArea.rectangle
                ? this.randomRectanglePosition(spawnArea, spawnArea.rectangle)
                : this.randomCirclePosition(spawnArea, spawnArea.circle!);

            lastPosition = position;
            if (minDistanceFromTransform > 0 && !this.isFarFromOwner(position, minDistanceFromTransform)) continue;
            if (minDistanceFromGroupEntities > 0 && !this.isFarFromAvoidGroups(position, minDistanceFromGroupEntities, avoidGroups)) continue;
            return position;
        }

        EngineDebug.warn(`EntitySpawnerComponent "${this.id}" could not find a valid spawnArea position after ${attempts} attempts.`, {
            spawnArea,
            minDistanceFromTransform,
            minDistanceFromGroupEntities,
            avoidGroups,
            fallback,
            lastPosition
        });

        return lastPosition;
    }

    private randomPositionInLegacyBounds(bounds: { x: number; y: number; width: number; height: number; }, overrides?: Partial<SpawnProfile>): Point {
        return this.randomPositionInSpawnArea({
            space: "world",
            rectangle: {
                origin: "topLeft",
                width: bounds.width,
                height: bounds.height,
                offset: { x: bounds.x, y: bounds.y },
                padding: overrides?.edgePadding ?? this.options.edgePadding
            }
        }, overrides);
    }

    private randomRectanglePosition(spawnArea: SpawnArea, rectangle: RectangleSpawnArea): Point {
        const anchor = this.resolveSpawnAreaAnchor(spawnArea);
        const offset = rectangle.offset ?? { x: 0, y: 0 };
        const padding = rectangle.padding ?? 0;
        const origin = rectangle.origin ?? "center";

        let left = anchor.x + offset.x;
        let top = anchor.y + offset.y;

        if (origin === "center") {
            left -= rectangle.width / 2;
            top -= rectangle.height / 2;
        }

        return {
            x: left + padding + Math.random() * Math.max(0, rectangle.width - padding * 2),
            y: top + padding + Math.random() * Math.max(0, rectangle.height - padding * 2)
        };
    }

    private randomCirclePosition(spawnArea: SpawnArea, circle: CircleSpawnArea): Point {
        const anchor = this.resolveSpawnAreaAnchor(spawnArea);
        const offset = circle.offset ?? { x: 0, y: 0 };
        const center = { x: anchor.x + offset.x, y: anchor.y + offset.y };
        const innerRadius = circle.innerRadius ?? 0;
        const radius = Math.sqrt(innerRadius * innerRadius + Math.random() * Math.max(0, circle.radius * circle.radius - innerRadius * innerRadius));
        const angle = Math.random() * Math.PI * 2;

        return {
            x: center.x + Math.cos(angle) * radius,
            y: center.y + Math.sin(angle) * radius
        };
    }

    private resolveSpawnAreaAnchor(spawnArea: SpawnArea): Point {
        return (spawnArea.space ?? "local") === "world" ? { x: 0, y: 0 } : this.getOwnerPosition();
    }

    private validateSpawnArea(spawnArea: SpawnArea): void {
        const hasRectangle = !!spawnArea.rectangle;
        const hasCircle = !!spawnArea.circle;

        if (hasRectangle === hasCircle)
            throw new Error(`EntitySpawnerComponent "${this.id}" spawnArea must define exactly one shape: rectangle or circle.`);

        if (spawnArea.rectangle) {
            if (spawnArea.rectangle.width < 0 || spawnArea.rectangle.height < 0)
                throw new Error(`EntitySpawnerComponent "${this.id}" spawnArea rectangle width and height must be >= 0.`);

            const padding = spawnArea.rectangle.padding ?? 0;
            if (padding < 0)
                throw new Error(`EntitySpawnerComponent "${this.id}" spawnArea rectangle padding must be >= 0.`);

            if (padding * 2 > spawnArea.rectangle.width || padding * 2 > spawnArea.rectangle.height)
                EngineDebug.warn(`EntitySpawnerComponent "${this.id}" spawnArea rectangle padding is larger than half the width or height.`);
        }

        if (spawnArea.circle) {
            if (spawnArea.circle.radius < 0)
                throw new Error(`EntitySpawnerComponent "${this.id}" spawnArea circle radius must be >= 0.`);

            if ((spawnArea.circle.innerRadius ?? 0) < 0)
                throw new Error(`EntitySpawnerComponent "${this.id}" spawnArea circle innerRadius must be >= 0.`);

            if ((spawnArea.circle.innerRadius ?? 0) > spawnArea.circle.radius)
                throw new Error(`EntitySpawnerComponent "${this.id}" spawnArea circle innerRadius cannot be greater than radius.`);
        }
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
            if (EngineDebug.debugMode && group.list.length === 0)
                EngineDebug.warn(`EntitySpawnerComponent "${this.id}" avoid group "${groupName}" has no objects.`);

            for (const object of group.list) {
                const transform = object.getComponent(this.options.spawnedTransformID) as TransformComponent | undefined;
                if (transform?.options?.position && this.distanceSquared(position, transform.options.position) < radiusSquared) return false;
            }
        }

        return true;
    }

    private resolveRotation(overrides?: Partial<SpawnProfile>): number {
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

    private resolveVelocityAngle(velocity: NonNullable<SpawnProfile["velocity"]>): number {
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
        this.nextDynamicSpawn = 0;
        this.hasRunStatic = false;
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
