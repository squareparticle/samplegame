import {
    Action,
    BaseComponent,
    StandardAction,
    TransformComponent
} from "@essentialskills/gameenginets";

type FirePulseOptions = {
    projectileEntity: string;
    projectileGroup?: string;
    cooldown?: number;
    spawnDistance?: number;
};

export class FirePulseComponent extends BaseComponent {
    private readonly projectileEntity: string;
    private readonly projectileGroup: string;
    private readonly cooldown: number;
    private readonly spawnDistance: number;
    private elapsedSinceShot = Number.POSITIVE_INFINITY;

    constructor(base: any, options: FirePulseOptions) {
        super(base);
        this.projectileEntity = options.projectileEntity;
        this.projectileGroup = options.projectileGroup ?? "projectiles";
        this.cooldown = options.cooldown ?? 0.25;
        this.spawnDistance = options.spawnDistance ?? 50;
    }

    public update(gt: { dt: number; currentTime: number; gameTime: number }): void {
        this.elapsedSinceShot += gt.dt;
    }

    public channelListener(actions: Action[]): void {
        if (!actions.some(action => action.id === StandardAction.ACTION_1)) return;
        this.fire();
    }

    private fire(): void {
        if (this.elapsedSinceShot < this.cooldown) return;

        const scene = this.parentObject!.parentScene;
        const entity = scene.entities.map[this.projectileEntity];
        if (!entity) {
            throw new Error(
                `FirePulseComponent could not find entity "${this.projectileEntity}".`
            );
        }

        const shipTransform = this.parentObject!.getComponent("Transform") as TransformComponent;
        const projectile = scene.instantiateLiveGameObject(entity);
        const projectileTransform = projectile.getComponent("Transform") as TransformComponent;

        const angle = shipTransform.options.rotation.angle;
        projectileTransform.options.position = {
            x: shipTransform.options.position.x + Math.cos(angle) * this.spawnDistance,
            y: shipTransform.options.position.y + Math.sin(angle) * this.spawnDistance
        };
        projectileTransform.options.rotation = { angle };

        scene.objectGroups.addToGroups(projectile, [this.projectileGroup, "gameObjects"]);
        this.elapsedSinceShot = 0;
    }
}
