import {
    BaseComponent,
    BasicPhysicsListener,
    GameObject,
    TransformComponent
} from "@essentialskills/gameenginets";

type DebrisSpawnerOptions = {
    entity: string;
    group?: string;
    count?: number;
    bounds: { x: number; y: number; width: number; height: number; };
    minSpeed?: number;
    maxSpeed?: number;
    safeRadius?: number;
};

export class DebrisSpawnerComponent extends BaseComponent {
    private readonly options: Required<Omit<DebrisSpawnerOptions, "bounds">> & {
        bounds: DebrisSpawnerOptions["bounds"];
    };
    private spawned = false;

    constructor(base: any, options: DebrisSpawnerOptions) {
        super(base);
        this.options = {
            entity: options.entity,
            group: options.group ?? "debris",
            count: options.count ?? 6,
            bounds: { ...options.bounds },
            minSpeed: options.minSpeed ?? 30,
            maxSpeed: options.maxSpeed ?? 90,
            safeRadius: options.safeRadius ?? 180
        };
    }

    public update(): void {
        if (this.spawned) return;
        this.spawned = true;

        for (let index = 0; index < this.options.count; index++) this.spawnDebris(index);
    }

    private spawnDebris(index: number): GameObject {
        const scene = this.parentObject!.parentScene;
        const entity = scene.entities.map[this.options.entity];
        if (!entity) throw new Error(`DebrisSpawnerComponent could not find entity "${this.options.entity}".`);

        const debris = scene.instantiateLiveGameObject(entity);
        const transform = debris.getComponent("Transform") as TransformComponent;
        const motion = debris.getComponent("Motion") as BasicPhysicsListener;
        transform.options.position = this.randomSpawnPosition();
        transform.options.rotation = { angle: Math.random() * Math.PI * 2 };

        const speed = this.options.minSpeed + Math.random() * (this.options.maxSpeed - this.options.minSpeed);
        const angle = Math.random() * Math.PI * 2;
        motion.options.velocity = { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed };
        motion.options.torque = (Math.random() - 0.5) * 30;

        debris.id = `debris-${index}-${debris.id}`;
        scene.objectGroups.addToGroups(debris, [this.options.group, "gameObjects"]);
        return debris;
    }

    private randomSpawnPosition(): { x: number; y: number } {
        const centerX = this.options.bounds.x + this.options.bounds.width / 2;
        const centerY = this.options.bounds.y + this.options.bounds.height / 2;

        for (let attempt = 0; attempt < 20; attempt++) {
            const position = {
                x: this.options.bounds.x + Math.random() * this.options.bounds.width,
                y: this.options.bounds.y + Math.random() * this.options.bounds.height
            };
            const dx = position.x - centerX;
            const dy = position.y - centerY;
            if (dx * dx + dy * dy >= this.options.safeRadius * this.options.safeRadius) return position;
        }

        return { x: this.options.bounds.x + 100, y: this.options.bounds.y + 100 };
    }
}
