import { GameObject, ObjectLayer, TransformComponent } from "@essentialskills/gameenginets";

export class ScreenWrapLayer extends ObjectLayer{
    update(gt: { dt: number; currentTime: number; gameTime: number; }): void {
        super.update(gt);
        const allObjects = this.getMixedGroupItems("objectGroups").list;
        allObjects.forEach((gameObject: GameObject) => {
            const transform = gameObject.getComponent("Transform") as TransformComponent;
            const position = transform.options.position;

            position.x = ((position.x % 1280) + 1280) % 1280;
            position.y = ((position.y % 720) + 720) % 720;
        });
    }
}