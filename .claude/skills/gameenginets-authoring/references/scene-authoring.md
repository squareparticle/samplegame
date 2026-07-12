# Scene Authoring

Scene JSON may define entities, groups, object instances, layers, widgets, sequences, and input scripts.

## Object placement

```json
{
  "Object": {
    "id": "player-1",
    "entity": "Player"
  }
}
```

Objects may belong to multiple groups. `getAllItems()` intentionally preserves duplicate memberships.

Layer order is execution order. Context-consuming layers must follow context-producing layers.

Component overrides use component IDs and validated property paths.

## Load and update in map entries

Prefer `Object.load` when the Entity exposes a `LoadComponent` setup interface:

```json
{
  "Object": {
    "entity": "Balloons",
    "load": {
      "position": {
        "@pointRange": {
          "x": { "min": 100, "max": 150 },
          "y": { "min": 400, "max": 450 }
        }
      }
    }
  }
}
```

Use `Object.update` for direct one-off component overrides:

```json
{
  "Object": {
    "entity": "Player",
    "update": {
      "component": {
        "#Transform": {
          "key": "options.position",
          "value": { "x": 50, "y": 450 }
        }
      }
    }
  }
}
```

When generating new content, use the current project's accepted update shape. Prefer the same `Object.load`/`Object.update` object-descriptor path used elsewhere rather than inventing a parallel setup format.


## Scene globals

Scene JSON can use `globals` for repeated bounds, percentages, resource names, and other reusable values.

```json
"globals": {
  "$contentBounds": { "value": { "x": 0, "y": 0, "width": 1280, "height": 720 } },
  "$screenPercent": { "value": { "x": 0, "y": 0, "width": 1, "height": 1 } }
}
```

Exact placeholders preserve object values:

```json
"sizeFromBounds": "{$contentBounds}"
```

```json
"destBounds_MatchCanvas": "{$screenPercent}"
```

Use this for layers such as `CreateCanvasLayer`, `PasteToCanvasLayer`, and `GUILayer` so canvas bounds remain real objects after script resolution.
