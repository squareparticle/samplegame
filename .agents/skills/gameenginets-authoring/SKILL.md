---
name: gameenginets-authoring
description: Build, modify, validate, test, and document games made with GameEngineTS. Use for entities, components, scenes, groups, layers, widgets, input, resources, commands, sequences, and engine-safe gameplay changes.
---

# GameEngineTS Authoring

Use this skill whenever a task involves creating or modifying a GameEngineTS game or its reusable gameplay code.

## Primary goal

Make the smallest correct change inside the correct architectural partition, validate all references, preserve lifecycle ownership, add focused tests, and leave a reviewable patch.

## Required workflow

1. Identify the smallest affected partition: entity JSON, scene JSON, component, object, layer, widget, input mapping, sequence, resource definition, or engine class.
2. Read only the relevant files in `references/`.
3. Inspect an existing nearby example before inventing a new pattern.
4. Prefer declarative JSON for composition and reusable TypeScript for behavior.
5. Do not move lifecycle ownership between classes without explicit tests.
6. Validate IDs and cross-references before running the game.
7. Add or update focused unit tests.
8. Run focused tests, then the complete suite.
9. Smoke-test affected demos and game levels.
10. Report changed files, behavior, assumptions, tests, and untested legacy paths.

## Core architecture rules

- `Entity` is a resolved prefab-like definition.
- `GameObject` is a runtime instance created from an `Entity`.
- `BaseObject` is the runtime superclass for GameObjects.
- `BaseComponent` is the runtime superclass for components.
- `BaseWidget` is the runtime superclass for GUI widgets.
- `BaseLayer` is the runtime superclass for render/input layers.
- `SceneBuilder` owns readiness for objects, layers, and widgets created from JSON.
- Do not add automatic `sceneReady()` calls to `StandardScene`.
- Objects and widgets may belong to multiple groups.
- Lifecycle operations that require uniqueness must deduplicate references.
- Component IDs must be unique across the entire GameObject hierarchy.
- Aliases may reference only component IDs that actually exist.
- Nested components are host-controlled and render through their host.
- `processRequires()` runs during object initialization, not per frame.
- Layers may depend on contexts published by earlier layers. Preserve layer order.
- `Sequence` commands retry when they return unfinished.
- Missing references should fail with contextual errors, not incidental `undefined` crashes.
- Do not weaken validation merely to make malformed game data load.

## Editing rules

- Keep TypeScript compact and readable.
- Preserve existing public behavior unless the task explicitly changes it.
- Use meaningful `#region` blocks in larger classes.
- Remove dead commented-out implementations before final TSDoc.
- Add explicit return types to public methods you touch.
- Do not invent new `Base*` abstractions for concrete concepts.
- Prefer direct imports over broad barrels when circular dependencies are possible.
- Preserve serialized compatibility, including historical names such as `PERSISTANT`, unless migration is deliberate.


## Declarative loading and spawning rules

- Use `LoadComponent` for an Entity's normal setup interface.
- Prefer named-object `load` for multi-field setup; use array `load` only for small positional shortcuts.
- `ValueResolver` procedural commands run before `LoadComponent`, `Object.update`, and `Object.execute`.
- Map `Object` entries and `EntitySpawnerComponent` object recipes use the same ValueResolver language.
- Use `@range`, `@intRange`, `@pointRange`, `@pick`, `@weightedPick`, `@loadingRule`, `@condition`, and `@value` for procedural authoring.
- Use `@loadingRule` for values supplied by the active loading/spawning component, for example `{ "@loadingRule": { "this": "spawnPosition" } }`; do not use spawner-only rules in plain map entries.
- Use `@condition` to choose a branch by exact return value, then `truthy`, `falsy`, then `default`.
- Use `{ "@value": "$value" }` inside `@condition` to return the inspected value.
- Use `{ "@value": "$pass" }` to omit the current field from the resolved object.
- In `EntitySpawnerComponent.entities[]`, keep spawner metadata such as `weight`, `groups`, and `idPrefix` outside `Object`; keep `entity`, `load`, `update`, and `execute` inside `Object`.
- Prefer `Object.load` for normal spawned object setup and `Object.update` only for one-off direct overrides.

## Authoring decision guide

### Change JSON when

- composing existing components
- placing objects in scenes
- wiring groups
- selecting resources
- configuring widgets
- defining command sequences
- changing aliases or input mappings

### Change TypeScript when

- introducing reusable runtime behavior
- implementing a component, layer, widget, camera, or command target
- adding validation
- fixing lifecycle or execution semantics
- adding a reusable game-system primitive

## Validation checklist

Verify:

- all script resources exist
- all registered types exist
- all entity names resolve
- object IDs are unique where required
- component IDs are unique across each object hierarchy
- aliases and `requires` entries reference existing components
- groups and layer IDs exist
- rendering source contexts exist in the expected order
- widget image keys resolve
- sequence commands contain exactly one route and one command
- sequence targets and group IDs exist
- input mappings use normalized key codes and modifiers
- runtime instantiation does not mutate source JSON

## Reference selection

Read only what is needed:

- `references/architecture.md`
- `references/lifecycle.md`
- `references/entity-authoring.md`
- `references/loading-authoring.md`
- `references/scene-authoring.md`
- `references/component-development.md`
- `references/ui-authoring.md`
- `references/sequences.md`
- `references/testing.md`

## Safety boundary

When behavior is not covered by tests or active games, do not redesign it casually. Mark the path as legacy or unverified and isolate changes behind focused tests.
