import { Sequence, StandardScene } from "@essentialskills/gameenginets";

export abstract class GameScene extends StandardScene {
    public gameScore: number = 0;
    public itemsCollected: number = 0;

    public addScore(points:number): number{ this.gameScore+=points; return this.gameScore; }
    public incItemsCollected(): number{ this.itemsCollected+=1; return this.itemsCollected; }

    execute(parentSequence: Sequence, commandName: string, properties: any): { found: boolean; finished: boolean; } {
        super.execute(parentSequence, commandName, properties);
        switch (commandName) {
            case "addScore":
                this.addScore(properties.score);
                return { found: true, finished: true };

            case "addCollectable":
                this.incItemsCollected();
                return { found: true, finished: true };
        }
        return { found: false, finished: true };
    }
}
