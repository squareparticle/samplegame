# State Components

## StateComponent

`StateComponent` is a small key/value store for per-object runtime state. It is useful for HP, counters, flags, temporary status, inventory-like booleans, and values that sequences need to query or mutate.

```json
{
  "type": "StateComponent",
  "base": { "id": "State" },
  "properties": {
    "values": {
      "HP": 2,
      "hasKey": false,
      "status": "idle"
    }
  }
}
```

Use `properties.values`, not raw top-level state fields.

Common sequence commands:

```json
{ "@selfObject": { "#State": { "get": { "key": "HP" } } } }
```

```json
{ "@selfObject": { "#State": { "set": { "key": "status", "value": "walking" } } } }
```

```json
{ "@selfObject": { "#State": { "dec": { "key": "HP", "amount": 1 } } } }
```

Supported operations include `get`, `getAll`, `set`, `inc`, `dec`, `toggle`, `has`, `delete`, `clear`, and `merge`. Commands return useful values where possible, which lets `@query` and `@condition` react to the result.

Example: damage the other object and destroy it when HP reaches zero:

```json
{
  "@condition": {
    "value": {
      "@query": {
        "@otherObject": {
          "#State": {
            "dec": { "key": "HP", "amount": 1 }
          }
        }
      }
    },
    "0": [
      { "@otherObject": { "destroy": {} } },
      { "@selfObject": { "destroy": {} } }
    ],
    "default": [
      { "@selfObject": { "destroy": {} } }
    ]
  }
}
```

## Loading StateComponent values

When an Entity uses `LoadComponent` to load state, target the nested `values` object:

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

Then a spawner or map entry can pass:

```json
"load": {
  "HP": 2
}
```

## StateMachineComponent

`StateMachineComponent` stores a current named state and runs enter/exit sequences. It is intentionally dumb: it does not decide when transitions happen. Other components, triggers, or sequences decide when to call `setState`.

```json
{
  "type": "StateMachineComponent",
  "base": { "id": "FSM" },
  "properties": {
    "initialState": "idle",
    "states": {
      "idle": {
        "enter": [
          { "@selfObject": { "#Motion": { "isEnabled": false } } }
        ]
      },
      "chase": {
        "enter": [
          { "@selfObject": { "#Motion": { "isEnabled": true } } },
          { "@selfObject": { "#ChasePlayer": { "isEnabled": true } } }
        ]
      }
    }
  }
}
```

Transition from another sequence or component:

```json
{ "@selfObject": { "#FSM": { "setState": { "state": "chase" } } } }
```

Use `StateComponent` for arbitrary values. Use `StateMachineComponent` for named behavior modes with enter/exit effects.
