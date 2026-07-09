# Component Development

Use a component for behavior reusable across entities.

Cover:

- stable ID
- constructor defaults
- dependencies
- update ownership
- render ownership
- channels
- readiness
- destruction
- commands
- focused tests

`processRequires()` runs during initialization. Do not perform required-component lookup every frame.

Nested components are host-controlled and do not render independently through BaseObject.
