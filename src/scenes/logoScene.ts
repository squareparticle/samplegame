import { Graphics, Resources, StandardScene } from "@essentialskills/gameenginets";

export class LogoScene extends StandardScene {
    private readonly logoResource = "gameenginets-logo.png";
    private elapsed = 0;
    private alpha = 0;

    protected initResources(): { images: string[] } {
        return { images: [this.logoResource] };
    }

    public update(gt: { dt: number; currentTime: number; gameTime: number }): void {
        this.elapsed += gt.dt;
        this.alpha = Math.min(1, this.alpha + gt.dt * 0.8);

        if (this.elapsed >= 2.5) {
            this.gameController.sceneManager!.gotoScene("title");
        }
    }

    public render( ctx: CanvasRenderingContext2D, _gt: { dt: number; currentTime: number; gameTime: number } ): void {
        Graphics.drawImage(ctx, Resources.getImage(this.logoResource), {
            transform: { position: Graphics.toPixels({ x: 0.5, y: 0.5, toFit: { query: "gameCanvas" } }) },
            size: Graphics.toPixels({ width: 0.8, height: 0.8, toFit: { query: "gameCanvas" } }),
            respectAspectRatio: true,
            globalAlpha: this.alpha
        });
    }
}
