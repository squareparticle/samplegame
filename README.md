# Star Salvager Starter v1

This is the first cleanup pass extracted from the original asteroid prototype.

## Included in this pass

- `app.ts` startup
- logo, title, and game scenes
- responsive `CreateCanvasLayer` → render layers → `PasteToCanvasLayer` pipeline
- keyboard steering and firing
- one simplified pulse weapon
- one debris spawner component
- reusable screen wrapping
- JSON-authored entities and scenes
- no imports from `@essentialskills/gameenginets/dist/...`

## Not included yet

- collision consequences
- scoring
- debris splitting
- collectible energy fragments
- results panel
- sound playback
- tests
- generated project CLI integration

Those should be added only after this foundation runs correctly in the current engine.

## Required temporary assets

Add these files under `resources/Images/`:

- `gameenginets-logo.png`
- `title-background.png`
- `start-button.png`
- `salvage-ship.png`
- `debris.png`
- `pulse.png`

The starter deliberately references bitmap assets because the final public example
should teach the resource pipeline. Simple effects can remain procedural later.

## First test

Copy the project into a consumer app that has
`@essentialskills/gameenginets` linked or installed.

Then run:

```bash
npm run typecheck
npm test
npm run dev
```

Verify:

1. logo fades in and changes to the title
2. title scales responsively through the content canvas
3. Start switches to the game
4. ship rotates and moves with arrows or WASD
5. Space creates one pulse at a controlled rate
6. six debris objects spawn and wrap around the logical 1280×720 play area

## Likely engine export check

This starter imports `InputAction` from the public package root. If that type is
not currently re-exported, add it to the engine public exports. Do not teach
users to import from `dist/`.


## Project setup

```bash
npm install
npm run typecheck
npm run build
npm run dev
```

During local GameEngineTS development, relink the package from this project:

```bash
npm link @essentialskills/gameenginets
```

## Resource path rule

Resource paths are relative to their category folder.

Use:

```text
gameenginets-logo.png
scenes/title
entities/player
```

Do not use:

```text
Images/gameenginets-logo.png
Scripts/scenes/title
Scripts/entities/player
```

The engine already selects the `Images`, `Scripts`, `Fonts`, or `Sounds` resource category.
