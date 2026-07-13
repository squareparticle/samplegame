import { BaseComponent, ComponentBaseAttributes, Sequence, StateComponent, TransformComponent } from "@essentialskills/gameenginets";
import { GameScene } from "../scenes/levels/gameScene";

export class DebrisComponent extends BaseComponent{

    transform: TransformComponent|undefined;
    state: StateComponent|undefined;
    dropEntity: string = "Gem";

    public requiredImport(importComponent: BaseComponent): void {
        if (importComponent instanceof StateComponent) this.state = importComponent;
        if (importComponent instanceof TransformComponent) this.transform = importComponent;
    }

    constructor(public base: ComponentBaseAttributes, options: any) {
        super(base, options);
        this.dropEntity = options.dropEntity ?? this.dropEntity;
    }

    private passScoreToScene() {(<GameScene>this.parentScene).addScore(this.state?.values["points"]);}
    private createDrop(){
        const entity = this.parentScene!.entities.map[this.dropEntity];
        const gameObject = this.parentScene!.instantiateGameObject(entity);
        const transform = gameObject.getComponent("Transform") as TransformComponent;

        transform.options.position.x = this.transform!.options.position.x;
        transform.options.position.y = this.transform!.options.position.y;

        this.parentScene!.objectGroups.addToGroups(gameObject, ["gameObjects"]);
    }

    execute(parentSequence: Sequence | null, commandName: string, properties: any): { found: boolean; finished: boolean; } {
        super.execute(parentSequence, commandName, properties);
        switch (commandName) {
            case "destroy":
                this.passScoreToScene();
                this.createDrop();
                this.destroy();                
        }
        return { found: false, finished: true };
    }
}