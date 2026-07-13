import { BaseController, SceneManager} from "@essentialskills/gameenginets";
import { GameInputMap } from "./gameInputMap";

export class GameController extends BaseController {
    protected initSceneManager(): SceneManager {
        const base = {
            gameController: this,
            targetResolution: { width: 1280, height: 720 }
        };
        
        const sceneOptions = { inputTemplate: new GameInputMap() };

        return new SceneManager(
            () => ({ ...base }),
            () => ({ ...sceneOptions })
        );
    }

    public initialize(): void {
        this.sceneManager!.gotoSceneNow("logo");
    }
}
