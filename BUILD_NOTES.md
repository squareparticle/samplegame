# Refactor Notes

## Deliberately removed

- `AsteroidManager`
- two-gun weapon configuration
- second bullet type
- muzzle sprite animations
- direct imports from `dist`
- player-targeted debris velocity
- collision colour debugging
- historical Cave Genie and KidsQuest resource references
- twenty-object opening wave

## Architectural ownership

### Scene

Creates the player and round-controller objects.

### DebrisSpawnerComponent

Creates only the opening debris field.

### ScreenWrapComponent

Owns logical-world wrapping for ship and debris.

### FirePulseComponent

Owns one projectile type, one cooldown, and one spawn calculation.

### ObjectLayer

Renders normal scene objects by group.

### CreateCanvasLayer and PasteToCanvasLayer

Remain pivotal render-target and compositing primitives. In this starter they
provide responsive scaling, but the same architecture supports split-screen,
minimaps, mirrors, portals, and picture-in-picture rendering.
