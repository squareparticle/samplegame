# Testing

## Minimum workflow

1. add focused unit tests
2. run the focused test file
3. run the full suite
4. run affected demos
5. run affected game levels

Use test-only subclasses to expose protected state. Do not weaken production visibility for tests.

Prefer partial mocks when mocking barrels. Replacing a full barrel can make unrelated exports undefined.

High-value tests cover omitted properties, copied source definitions, missing references, duplicate IDs, lifecycle order, re-entrant changes, malformed JSON, context failures, and input gating.
