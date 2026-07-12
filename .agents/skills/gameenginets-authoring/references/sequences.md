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

## ValueResolver in sequences

Sequence command arrays are filtered through `ValueResolver` when the sequence is created. Unknown `@` commands pass through in this mode because route names such as `@self` and `@scene` are sequence routes, not ValueResolver commands.

Use this to include, skip, or choose whole commands:

```json
[
  {
    "@condition": {
      "value": { "@pick": ["step", "silent"] },
      "step": {
        "@scene": {
          "playSound": {
            "soundResource": "steps/ground.wav"
          }
        }
      },
      "silent": { "@value": "$pass" },
      "default": { "@value": "$pass" }
    }
  }
]
```

Command properties are resolved at execution time. This allows procedural payloads to run when the command actually fires:

```json
{
  "@scene": {
    "playSound": {
      "soundResource": {
        "@pick": [
          "steps/ground-1.wav",
          "steps/ground-2.wav",
          "steps/ground-3.wav"
        ]
      }
    }
  }
}
```

`@condition` also works inside command properties:

```json
{
  "@scene": {
    "addPoints": {
      "points": {
        "@condition": {
          "value": "Coin",
          "Coin": 10,
          "truthy": 1,
          "default": 0
        }
      }
    }
  }
}
```

Use `{ "@value": "$pass" }` to remove a command from a sequence array or omit a property from a resolved payload. Use `{ "@value": "$value" }` to return the inspected condition value.



## Runtime queries

Use `@query` when a runtime sequence needs to execute a command and branch on the returned value. This is common in collision handlers where `@otherObject` is only known at runtime.

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

`@query` is runtime-only. Keep the surrounding event handler as an array, for example `"+onEnter": [ ... ]`.

## Collision and inline run handlers

`@RUN` arrays are normal sequence command arrays. The same command filtering applies in trigger handlers, widget handlers, animation frame handlers, and other places that call `Sequence.createSequence(...)`.

```json
"@RUN": {
  "+onEnter": [
    {
      "@condition": {
        "value": { "@pick": [true, false] },
        "true": { "@otherObject": { "#BusDriver": { "stop": {} } } },
        "false": { "@value": "$pass" }
      }
    },
    { "@selfObject": { "#KidBrain": { "walkToBus": {} } } }
  ]
}
```

## Authoring rules

- Keep routes as `@self`, `@scene`, `@otherObject`, etc. Uppercase legacy routes may work, but new examples should prefer lower camel case.
- ValueResolver commands stay lowercase: `@pick`, `@condition`, `@value`, `@range`, and so on.
- A sequence command entry must still resolve to exactly one route containing exactly one command.
- Use `@condition` around whole command entries when choosing whether a command exists.
- Use `@condition` inside command properties when only a payload value changes.
