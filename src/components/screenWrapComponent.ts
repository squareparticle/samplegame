import {
    BaseComponent,
    TransformComponent
} from "@essentialskills/gameenginets";

type ScreenWrapOptions = {
    bounds: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    margin?: number;
};

export class ScreenWrapComponent extends BaseComponent {
    private readonly bounds: ScreenWrapOptions["bounds"];
    private readonly margin: number;
    private transform: TransformComponent | null = null;

    constructor(base: any, options: ScreenWrapOptions) {
        super(base);
        this.bounds = { ...options.bounds };
        this.margin = options.margin ?? 0;
    }

    public objectReady(): void {
        this.transform = this.parentObject!.getComponent("Transform") as TransformComponent;
    }

    public update(_gt: { dt: number; currentTime: number; gameTime: number }): void {
        if (!this.transform) return;

        const position = this.transform.options.position;
        const left = this.bounds.x - this.margin;
        const right = this.bounds.x + this.bounds.width + this.margin;
        const top = this.bounds.y - this.margin;
        const bottom = this.bounds.y + this.bounds.height + this.margin;

        if (position.x < left) position.x = right;
        else if (position.x > right) position.x = left;

        if (position.y < top) position.y = bottom;
        else if (position.y > bottom) position.y = top;
    }
}
