# Pong Rebuild — Learning Exercise

A deliberately scoped rebuild of the classic **Pong** game, created to test and refine the **Vibe Coding Workflow** on a bounded, well-understood problem.

This is **not** a production game. It is a controlled experiment in architecture, decision-making, and AI-assisted development under a strict timebox.

---

## 🎯 Project Intent

**Primary Goal**
Evaluate the effectiveness of the *Vibe Coding Workflow* when applied to a small but non-trivial project.

**Secondary Goals**

* Practice modular game architecture using modern JavaScript
* Observe how AI tools support (or hinder) different development phases
* Generate measurable data for v1 vs v2 workflow comparison

**Time Budget:** 4–6 hours
**Scope Control:** Enforced via MoSCoW prioritisation
**Learning Style:** Build-first, reflect-by-phase

---

## 🧰 Tech Stack

* **Language:** JavaScript (ES6)
* **Rendering:** HTML5 Canvas (2D API)
* **Architecture:** Vanilla JS with ES Modules
* **Styling:** CSS
* **Audio:** HTML5 Audio or Web Audio API (lightweight)

### Why Vanilla JS + Modules?

* No framework overhead for a short timebox
* Full transparency of game loop, state, and physics
* Clean separation of concerns supports future extensions
* Architecture can scale to online multiplayer (WebSockets) without refactor

---

## ✅ MVP Scope (MoSCoW)

### MUST HAVE — Core Gameplay

* Canvas-based Pong game (800×600 target)
* Two paddles with responsive keyboard control
* Ball with deterministic physics and paddle-based angle variation
* Scoring system with reset and brief serve pause
* Win condition at 11 points
* Restart without page refresh

### SHOULD HAVE — Polish & Modes

* Single-player mode with basic AI opponent
* Pause / resume functionality
* Sound effects with mute option

### COULD HAVE — Enhancements

* Progressive ball speed
* Visual effects (trails, particles, glow)
* Touch/mobile input
* Online multiplayer–ready architecture (no full implementation)

---

## 🧠 Architectural Constraints (Non-Negotiable)

These decisions are intentional and part of the learning exercise.

### Game Loop

* `requestAnimationFrame`
* **Fixed timestep with accumulator**
* Rendering decoupled from simulation

### State Management

* Single, central game state object
* Explicit state transitions
* Serializable structure (future online play)

### Collision Detection

* Axis-Aligned Bounding Boxes (AABB)
* Deterministic outcomes over realism

Rendering, input handling, and UI overlays are intentionally kept simple.

---

## 📁 Project Structure

```
/pong-rebuild
├── index.html
├── styles.css
├── src/
│   ├── main.js        # Entry point & game loop
│   ├── game-state.js # Single source of truth
│   ├── paddle.js     # Paddle entity
│   ├── ball.js       # Ball entity & physics
│   ├── collision.js  # Collision detection
│   ├── ai.js         # CPU opponent logic
│   ├── renderer.js   # Canvas drawing
│   └── input.js      # Keyboard / touch handling
└── assets/
    └── sounds/
```

Each module has a **single responsibility** and should be swappable without cascading changes.

---

## 🧩 Implementation Phases

### Phase 1 — Foundation (60–90 min)

**Goal:** Game loop, paddles, input, rendering

Focus on structure, not features.

---

### Phase 2 — Physics & Ball (60–90 min)

**Goal:** Deterministic ball movement and collisions

Expect edge cases. Treat bugs as learning signals.

---

### Phase 3 — Scoring & Game Flow (45–60 min)

**Goal:** Playable loop with win condition

This phase stress-tests state management clarity.

---

### Phase 4 — AI & Polish (60–90 min)

**Goal:** Single-player mode and quality-of-life features

Assess how well the architecture supports extension.

---

## 📊 Definition of Done

### Functional

* Smooth paddle movement
* Reliable ball collisions
* Accurate scoring
* Clear win condition
* Restart without refresh
* Stable 60 FPS
* No console errors

### Technical

* Modular ES6 architecture
* Centralised, serialisable state
* Fixed timestep loop
* Accurate collision handling
* All MUST requirements complete
* At least two SHOULD features implemented

---

## 📈 v1 vs v2 Comparison Metrics

This project exists to be measured.

**Quantitative**

* Lines of code (total & per module)
* Number of classes/functions
* Cyclomatic complexity
* Time per phase
* Bug count
* AI interactions required

**Qualitative**

* Readability
* Architectural clarity
* Gameplay feel
* Confidence extending the codebase
* AI usefulness vs friction

---

## ⚠️ Known Pitfalls to Watch For

* Variable timestep physics bugs
* Collision tunnelling at higher speeds
* State mutation in multiple locations
* Garbage creation in render loop
* Input lag from poor buffering

These are signals, not failures.

---

## 🧪 Workflow Evaluation Notes

Document during development:

1. Which requirements were immediately actionable?
2. Where did AI guidance help vs slow you down?
3. Did MoSCoW prevent scope creep?
4. Were learning checkpoints useful?
5. Does this repo enable meaningful v1 vs v2 comparison?

---

## 🚀 Getting Started

Before coding:

* Requirements reviewed
* File structure created
* AI tools configured
* Timer running
* Comparison notes ready

**Suggested first prompt:**

> “Phase 1: set up a fixed-timestep game loop using requestAnimationFrame. Start with `main.js` and `game-state.js`. Here is my file structure: …”

---

## 🧭 Final Note

This repository prioritises **clarity, intent, and learning value** over novelty.
If something feels harder than expected, that friction is part of the experiment.

Ship, observe, reflect, iterate.
