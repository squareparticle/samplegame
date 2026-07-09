# UI Authoring

Widgets inherit from `BaseWidget`. Position, size, and origin are copied during factory creation.

`Panel` supports buffered text/background rendering, optional image backing, style updates, and render-hash invalidation.

`ClickablePanel` ignores input while disabled or invisible, supports callbacks, and may launch click sequences.

`calcLayout()` requires a valid context, normally `Graphics.layerCtx["gameCanvas"]`.
