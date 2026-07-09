import { StandardScene } from "@essentialskills/gameenginets";

export class TitleScene extends StandardScene {
    private readonly sceneFile = "scenes/title/scene";

    protected initResources(): { scripts: string[] } {
        return { scripts: [this.sceneFile] };
    }

    public sceneReady(): void {
        this.initSceneFromJSON(this.sceneFile);
    }
}
