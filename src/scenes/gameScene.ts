import { StandardScene, BaseController } from "@essentialskills/gameenginets";

export class GameScene extends StandardScene {
    private readonly sceneFile = "scenes/levels/game/scene";

    protected initResources(): { scripts: string[] } {
        return { scripts: [this.sceneFile] };
    }

    public sceneReady(): void {
        BaseController.debugMode = true;
        this.initSceneFromJSON(this.sceneFile);

        const roundController = this.instantiateGameObject(
            this.entities.map.RoundController,
            "round-controller"
        );
        this.objectGroups.addToGroups(roundController, ["hud"]);
    }
}
