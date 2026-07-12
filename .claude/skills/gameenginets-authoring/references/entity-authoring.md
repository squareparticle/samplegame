# Entity Authoring

## Basic shape

```json
{
  "type": "GameObject",
  "name": "Player",
  "globals": {},
  "alias": {
    "MAIN": {
      "executeUpdate": true,
      "executeRender": true,
      "enable": {
        "Transform": true,
        "Renderer": true
      }
    }
  },
  "components": []
}
```

## Rules

- every component needs a stable `base.id`
- component IDs are unique across the object hierarchy
- aliases may reference only existing IDs
- `requires` entries must resolve
- inserted and inherited scripts must exist
- circular insert or inheritance chains are invalid
- child globals override inherited globals

## LoadComponent setup interfaces

Use `LoadComponent` when an Entity needs a reusable setup interface for maps, spawners, or editor-generated object descriptors.

Array load is compact and positional:

```json
"load": [{ "x": 358, "y": 436 }, "PENCIL"]
```

Array load uses numbered placeholders in `LoadComponent` editors:

```json
"$value0"
"$value1"
```

Named-object load is preferred for multi-field setup:

```json
"load": {
  "position": { "x": 358, "y": 436 },
  "scale": { "x": 0.11, "y": 0.11 },
  "rotation": 0,
  "velocity": { "x": 30, "y": -10 }
}
```

Named-object load uses named placeholders:

```json
"$position"
"$scale"
"$rotation"
"$velocity"
```

The payload style must match the placeholders. Do not pass named-object load to a `LoadComponent` that expects `$value0`, and do not pass array load to a `LoadComponent` that expects `$position`.

Example named-load `LoadComponent`:

```json
{
  "type": "LoadComponent",
  "base": { "id": "Load" },
  "properties": {
    "editors": [
      {
        "update": {
          "#Transform": {
            "options.position": "$position",
            "options.scale": "$scale",
            "options.rotation.angle": "$rotation"
          },
          "#Motion": {
            "options.velocity": "$velocity"
          }
        }
      }
    ]
  }
}
```


## State loading contract

When an Entity exposes HP or other state through `LoadComponent`, keep `StateComponent` values under `properties.values` and update nested paths:

```json
{
  "type": "StateComponent",
  "base": { "id": "State" },
  "properties": {
    "values": {
      "HP": 2
    }
  }
}
```

```json
{
  "type": "LoadComponent",
  "base": { "id": "Load" },
  "properties": {
    "editors": [
      {
        "update": {
          "#State": {
            "values.HP": "$HP"
          }
        }
      }
    ]
  }
}
```
