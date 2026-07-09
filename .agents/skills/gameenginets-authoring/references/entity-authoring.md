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
