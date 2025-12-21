# TODO - Pong Redux

## Known Issues to Address

### Settings Menu Non-Responsive (Priority: High)
**Issue:** Settings menu renders but is non-responsive to mouse/keyboard input
**Context:**
- Settings overlay appears when pressing S key or clicking gear icon
- UI renders correctly with all tabs, buttons, and sliders visible
- However, clicks and interactions don't register
- Need to investigate event handling in `src/input.js`

**Possible Causes:**
1. Event listener attachment order (settings handlers may be registered too early)
2. Z-index or event propagation issues with canvas overlay
3. Coordinate calculation mismatch between render and input handlers
4. Canvas redraw clearing event state

**Files to Check:**
- `src/input.js` - Settings click handlers (`handleSettingsClick`, `detectSettingsHover`)
- `src/renderer.js` - Settings overlay rendering (verify coordinates match input handlers)
- `src/main.js` - Event listener attachment timing

**Testing Approach:**
1. Add console.log statements in settings click handlers to verify they're being called
2. Check if hover states are updating (visual feedback)
3. Verify canvas coordinate calculations match between render and input
4. Test in browser console with manual event dispatching

**Created:** 2025-12-21
**Status:** Not Started

---

## Future Enhancements

### Stage 9: Paddle Customization
- Paddle styles (Classic, Retro, Neon, Custom)
- Color customization
- Size options

### Stage 7: Instructions & Help System
- Help overlay accessible during gameplay
- Control reference
- Tutorial mode (optional)

### Stage 10-11: Ball Customization & Visual Effects
- Ball trails
- Particle effects on collision
- Ball styles and colors

### Stage 12-16: Polish & Launch
- Sound effects (Web Audio API)
- Visual polish and animations
- Stats tracking
- Portfolio documentation
