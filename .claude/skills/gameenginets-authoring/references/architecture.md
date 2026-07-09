# Architecture

GameEngineTS separates authoring data from runtime behavior.

- Scene JSON composes the level.
- Entity JSON defines reusable object blueprints.
- Components provide reusable behavior.
- Groups create named collections.
- Layers define ordered rendering/input passes.
- Widgets provide GUI behavior.
- Commands and sequences provide declarative execution.

## Runtime types

- **Entity**: resolved prefab-like definition.
- **GameObject**: runtime instance created from an Entity.
- **BaseObject**: owns components, aliases, lifecycle, and lookup.
- **BaseComponent**: reusable object behavior with optional dependencies.
- **BaseScene / BasicScene / StandardScene**: lifecycle, loading, then full runtime composition.
- **SceneBuilder**: constructs JSON scenes and owns JSON-created readiness.
- **Resources**: loads and caches media and scripts.
- **ScriptBuilder**: resolves inheritance, inserted scripts, then global placeholders.
