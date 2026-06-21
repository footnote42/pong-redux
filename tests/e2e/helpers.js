// Button centers in canvas-local coordinates (canvas 800x600)
// Derived from getLandingButtons(800, 600) in renderer-menu.js
export const BUTTONS = {
  single:      { x: 250, y: 180 },  // x: 120+130, y: 150+30
  versus:      { x: 550, y: 180 },  // x: 420+130
  rugbySingle: { x: 400, y: 260 },  // x: 270+130, y: 230+30
  rugbyVersus: { x: 400, y: 340 },  // y: 310+30
  settings:    { x: 760, y: 32  },  // gear icon center
};

// Click at canvas-local coordinates, accounting for 2px CSS border
export async function clickCanvasAt(page, canvasX, canvasY) {
  const box = await page.locator('#gameCanvas').boundingBox();
  await page.mouse.click(box.x + canvasX + 2, box.y + canvasY + 2);
}

export async function waitForGameState(page, target, timeout = 3000) {
  await page.waitForFunction(
    (s) => window.__gameState?.gameState === s,
    target,
    { timeout }
  );
}
