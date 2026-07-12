import { StandardScene, EngineDebug } from "@essentialskills/gameenginets";

export class GameScene extends StandardScene {
    private readonly sceneFile = "scenes/levels/game/scene";

    protected initResources(): { scripts: string[] } {
        return { scripts: [this.sceneFile] };
    }

    public sceneReady(): void {
        EngineDebug.debugMode = true;
        EngineDebug.visualGizmos = false;
        this.initSceneFromJSON(this.sceneFile);
    }
}
