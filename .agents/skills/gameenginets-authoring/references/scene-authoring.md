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
