import { Sequence, StandardScene } from "@essentialskills/gameenginets";

export abstract class GameScene extends StandardScene {
    public gameScore: number = 0;
    public itemsCollected: number = 0;

    execute(_parentSequence: Sequence, commandName: string, properties: any) {
        switch (commandName) {
            case "addScore":
                this.gameScore += properties.score;
                return { found: true, finished: true };

            case "addCollectable":
                this.itemsCollected += 1;
                return { found: true, finished: true };
        }
        return { found: false, finished: true };
    }
}
