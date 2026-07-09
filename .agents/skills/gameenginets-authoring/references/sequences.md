# Commands and Sequences

Each serialized command contains exactly one route and one command:

```json
{
  "@self": {
    "setState": {
      "state": "RUNNING"
    }
  }
}
```

Common routes: `@self`, `@selfObject`, `@otherObject`, `@widget`, `@scene`, `@gameController`, `@gameLoop`, `@system`, and `@sequence`.

A command returning `false` is retried on the next sequence update. Active sequence IDs are unique, and one Sequence instance may be active only once.
