import {
    ObjectGroup,
    StandardScene,
    BaseController
} from "@essentialskills/gameenginets";

export class GameScene extends StandardScene {
    private readonly sceneFile = "scenes/levels/game/scene";

    protected initResources(): { scripts: string[] } {
        return { scripts: [this.sceneFile] };
    }

    public sceneReady(): void {
        BaseController.debugMode = true;
        this.initSceneFromJSON(this.sceneFile);

        // const player = this.instantiateGameObject(this.entities.map.Player, "player");
        // this.objectGroups.addToGroups(player, ["gameObjects", ObjectGroup.INPUT]);

        const roundController = this.instantiateGameObject(
            this.entities.map.RoundController,
            "round-controller"
        );
        this.objectGroups.addToGroups(roundController, ["hud"]);
    }
}
