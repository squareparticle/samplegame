import { Panel } from "@essentialskills/gameenginets";
import { GameScene } from "../scenes/levels/gameScene";

export class ScorePanel extends Panel {

    gameScene: GameScene|undefined;

    sceneReady(): void {
        this.textLineSpacing = 2;        
        this.gameScene = <GameScene>this.parentScene;
    }

    update(_gt: { dt: number; currentTime: number; gameTime: number; }): void {
        this.text = `Score: ${this.gameScene!.gameScore}
                     Collected: ${this.gameScene!.itemsCollected}`;
    }
}