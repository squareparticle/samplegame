import { EngineDebug } from "@essentialskills/gameenginets";
import { GameScene } from "./gameScene";

export class Level1 extends GameScene{
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