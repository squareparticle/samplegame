import { describe, expect, it } from "vitest";
import { ExampleComponent } from "./exampleComponent";

describe("ExampleComponent", () => {
    it("constructs with safe defaults", () => {
        const component = new ExampleComponent({ id: "Example" } as any, {});
        expect(component).toBeInstanceOf(ExampleComponent);
    });
});
