import {
    BaseController,
    BaseInputTemplate,
    InputAction,
    SceneManager,
    StandardAction
} from "@essentialskills/gameenginets";

class PilotInputTemplate extends BaseInputTemplate {
    public initMouseActions(): Record<string, InputAction> { return {}; }
    public initGamePadActions(): Record<string, InputAction> { return {}; }

    public initKeyboardActions(): Record<string, InputAction> {
        return {
            ArrowUp: {
                actionPressed: [{ id: StandardAction.MOVE_FORWARD }],
                actionReleased: [{ id: StandardAction.IDLE }],
                streaming: true
            },
            KeyW: {
                actionPressed: [{ id: StandardAction.MOVE_FORWARD }],
                actionReleased: [{ id: StandardAction.IDLE }],
                streaming: true
            },
            ArrowLeft: {
                actionPressed: [{ id: StandardAction.ROTATE_COUNTERCLOCKWISE }],
                actionReleased: [{ id: StandardAction.IDLE }],
                streaming: true
            },
            KeyA: {
                actionPressed: [{ id: StandardAction.ROTATE_COUNTERCLOCKWISE }],
                actionReleased: [{ id: StandardAction.IDLE }],
                streaming: true
            },
            ArrowRight: {
                actionPressed: [{ id: StandardAction.ROTATE_CLOCKWISE }],
                actionReleased: [{ id: StandardAction.IDLE }],
                streaming: true
            },
            KeyD: {
                actionPressed: [{ id: StandardAction.ROTATE_CLOCKWISE }],
                actionReleased: [{ id: StandardAction.IDLE }],
                streaming: true
            },
            Space: {
                actionPressed: [{ id: StandardAction.ACTION_1 }]
            }
        };
    }
}

export class GameController extends BaseController {
    protected initSceneManager(): SceneManager {
        const base = {
            gameController: this,
            targetResolution: { width: 1280, height: 720 }
        };
        const sceneOptions = { inputTemplate: new PilotInputTemplate() };

        return new SceneManager(
            () => ({ ...base }),
            () => ({ ...sceneOptions })
        );
    }

    public initialize(): void {
        this.sceneManager!.gotoSceneNow("logo");
    }
}
