# NOW — pong-redux

## Status
QUEUED — gameplay polish pass

## Next
Audit restart/mid-game flows and button hit areas: open the game in browser, reproduce each known interaction bug (restart behaviour, mid-game settings changes, button clickable zones undersized), log findings, fix in order of impact.

## Context
- Obsidian: `C:/Users/kenho/Obsidian/Second Brain/Projects/Pong-Redux/`
  - MANDATE.md — why this exists, what success looks like
  - DECISIONS.md — architectural choices and reasoning
- Active code: `src/` — `input.js` for click handling, `renderer.js` files for button rendering, `game-state.js` for restart logic
- Use DevTools → click inspection to diagnose hit area issues

## Blocker
None

## Last session
2026-06-21 — Migration to project workflow. PL-7 (portfolio-site) complete: hidden link navigates to `/workshop/pong`, full-screen iframe of `footnote42.github.io/pong-redux`. Easter Egg is live.
