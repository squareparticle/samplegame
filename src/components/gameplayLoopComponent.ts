import {
    BaseComponent,
    GameObject,
    TransformComponent
} from "@essentialskills/gameenginets";

type GameplayLoopOptions = {
    debrisGroup?: string;
    projectileGroup?: string;
    collectibleGroup?: string;
    collectibleEntity: string;
    targetScore?: number;
    debrisRadius?: number;
    projectileRadius?: number;
    playerRadius?: number;
    collectibleRadius?: number;
};

export class GameplayLoopComponent extends BaseComponent {
    private readonly debrisGroup: string;
    private readonly projectileGroup: string;
    private readonly collectibleGroup: string;
    private readonly collectibleEntity: string;
    private readonly targetScore: number;
    private readonly debrisRadius: number;
    private readonly projectileRadius: number;
    private readonly playerRadius: number;
    private readonly collectibleRadius: number;

    private score = 0;
    private destroyedDebris = 0;
    private complete = false;

    constructor(base: any, options: GameplayLoopOptions) {
        super(base);
        this.debrisGroup = options.debrisGroup ?? "debris";
        this.projectileGroup = options.projectileGroup ?? "projectiles";
        this.collectibleGroup = options.collectibleGroup ?? "collectibles";
        this.collectibleEntity = options.collectibleEntity;
        this.targetScore = options.targetScore ?? 6;
        this.debrisRadius = options.debrisRadius ?? 48;
        this.projectileRadius = options.projectileRadius ?? 12;
        this.playerRadius = options.playerRadius ?? 34;
        this.collectibleRadius = options.collectibleRadius ?? 22;
    }

    public update(_gt: { dt: number; currentTime: number; gameTime: number }): void {
        if (this.complete) return;

        this.resolveProjectileHits();
        this.resolveCollections();

        if (this.score >= this.targetScore) this.complete = true;
    }

    public render(ctx: CanvasRenderingContext2D): void {
        ctx.save();
        ctx.font = "700 28px system-ui, sans-serif";
        ctx.textBaseline = "top";
        ctx.fillStyle = "rgba(5, 12, 24, 0.72)";
        ctx.fillRect(22, 20, 280, 82);
        ctx.fillStyle = "#ffffff";
        ctx.fillText(`Salvage: ${this.score}/${this.targetScore}`, 40, 34);
        ctx.font = "500 18px system-ui, sans-serif";
        ctx.fillStyle = "#9edcff";
        ctx.fillText(`Debris cleared: ${this.destroyedDebris}`, 40, 70);

        if (this.complete) {
            ctx.fillStyle = "rgba(3, 8, 18, 0.78)";
            ctx.fillRect(0, 0, 1280, 720);
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.font = "800 64px system-ui, sans-serif";
            ctx.fillStyle = "#ffffff";
            ctx.fillText("MISSION COMPLETE", 640, 310);
            ctx.font = "500 28px system-ui, sans-serif";
            ctx.fillStyle = "#8fe8ff";
            ctx.fillText(`Recovered ${this.score} energy crystals`, 640, 380);
        }

        ctx.restore();
    }

    private resolveProjectileHits(): void {
        const scene = this.parentObject!.parentScene;
        const projectiles = [...scene.objectGroups.getGroup(this.projectileGroup).list] as GameObject[];
        const debris = [...scene.objectGroups.getGroup(this.debrisGroup).list] as GameObject[];
        const consumedProjectiles = new Set<GameObject>();
        const destroyedDebris = new Set<GameObject>();

        for (const projectile of projectiles) {
            if (consumedProjectiles.has(projectile)) continue;

            const projectilePosition = this.getPosition(projectile);
            if (!projectilePosition) continue;

            for (const debrisObject of debris) {
                if (destroyedDebris.has(debrisObject)) continue;

                const debrisPosition = this.getPosition(debrisObject);
                if (!debrisPosition) continue;

                if (!this.overlaps(
                    projectilePosition,
                    this.projectileRadius,
                    debrisPosition,
                    this.debrisRadius
                )) continue;

                consumedProjectiles.add(projectile);
                destroyedDebris.add(debrisObject);
                this.spawnCollectible(debrisPosition);
                this.destroyedDebris++;
                break;
            }
        }

        consumedProjectiles.forEach(projectile => scene.deleteObject(projectile));
        destroyedDebris.forEach(debrisObject => scene.deleteObject(debrisObject));
    }

    private resolveCollections(): void {
        const scene = this.parentObject!.parentScene;
        const players = scene.objectGroups.getGroup("gameObjects").list as GameObject[];
        const player = players.find(object => object.id === "player");
        if (!player) return;

        const playerPosition = this.getPosition(player);
        if (!playerPosition) return;

        const collectibles = [...scene.objectGroups.getGroup(this.collectibleGroup).list] as GameObject[];
        for (const collectible of collectibles) {
            const collectiblePosition = this.getPosition(collectible);
            if (!collectiblePosition) continue;

            if (!this.overlaps(
                playerPosition,
                this.playerRadius,
                collectiblePosition,
                this.collectibleRadius
            )) continue;

            scene.deleteObject(collectible);
            this.score++;
        }
    }

    private spawnCollectible(position: { x: number; y: number }): void {
        const scene = this.parentObject!.parentScene;
        const entity = scene.entities.map[this.collectibleEntity];
        if (!entity) {
            throw new Error(
                `GameplayLoopComponent could not find entity "${this.collectibleEntity}".`
            );
        }

        const collectible = scene.instantiateLiveGameObject(entity);
        const transform = collectible.getComponent("Transform") as TransformComponent;
        transform.options.position = { ...position };
        transform.options.rotation = { angle: Math.random() * Math.PI * 2 };
        collectible.id = `gem-${collectible.id}`;
        scene.objectGroups.addToGroups(collectible, [this.collectibleGroup, "gameObjects"]);
    }

    private getPosition(object: GameObject): { x: number; y: number } | null {
        const transform = object.getComponent("Transform") as TransformComponent | undefined;
        return transform?.options.position ?? null;
    }

    private overlaps(
        a: { x: number; y: number },
        aRadius: number,
        b: { x: number; y: number },
        bRadius: number
    ): boolean {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const radius = aRadius + bRadius;
        return dx * dx + dy * dy <= radius * radius;
    }
}
