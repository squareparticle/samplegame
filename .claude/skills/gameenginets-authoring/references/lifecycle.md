# Lifecycle

## JSON scene construction

`SceneBuilder.initSceneFromJSON()` performs:

1. script attachment
2. scriptable input initialization
3. entity resolution
4. group and object processing
5. layer construction and layer-map creation
6. `sceneReady()` on unique objects
7. `sceneReady()` on layers
8. `sceneReady()` on unique widgets

Do not duplicate these readiness calls in `StandardScene`.

## Object construction

1. Entity resolves a runtime object type.
2. BaseObject constructs components.
3. component IDs are indexed across the hierarchy.
4. `processRequires()` resolves dependencies.
5. aliases are applied after referenced components exist.
6. scene/group construction completes.
7. SceneBuilder invokes `sceneReady()`.

## Nested components

Nested components receive initialization, channels, and readiness, but render through their host.

## Destruction

Objects may occur in multiple groups. Deduplicate by object identity for one-time lifecycle operations.
