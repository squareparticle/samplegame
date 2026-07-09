import { BaseComponent } from "@essentialskills/gameenginets";

export class ExampleComponent extends BaseComponent {
    public update(_gt: { dt: number; currentTime: number; gameTime: number; }): void { }

    public execute(_parentSequence: any, commandName: string, properties: any): { found: boolean; finished: boolean; } {
        switch (commandName) {
            case "example":
                void properties;
                return { found: true, finished: true };
        }
        return { found: false, finished: true };
    }
}
