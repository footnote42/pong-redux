# Menus are HTML over the canvas, with one set of screens and two layouts

Menus (landing, settings, pause, victory) move from canvas drawing to HTML/CSS laid over the canvas; the canvas renders gameplay only. Canvas menus needed hand-written hit-testing that duplicated the renderer's layout maths and could not reflow for phones. We keep one set of screens with two layouts, a Touch layout and a Desktop layout, chosen by input type rather than screen width, instead of building a separate mobile menu: separate menus would drift apart as settings are added.

## Considered Options

- Keep canvas menus and make them responsive: rejected, every layout change means editing the renderer and the hit-test copy in step.
- Separate mobile and desktop menus: rejected, two copies of every option to keep in sync.
