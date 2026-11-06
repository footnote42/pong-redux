// The landing screen is HTML over the canvas (ADR 0001): reach its controls by
// role and name, the way a player sees them.
export const GAME_MODES = {
  single: 'vs CPU',
  versus: '2 Players',
  'rugby-single': 'Rugby (1P)',
  'rugby-versus': 'Rugby (2P)',
};

export function landing(page) {
  return page.locator('[data-screen="landing"]');
}

export function gameModeButton(page, mode) {
  return landing(page).getByRole('button', { name: GAME_MODES[mode], exact: true });
}

// Click (or, on a touch device, tap) a Game mode on the landing screen
export async function chooseGameMode(page, mode) {
  await gameModeButton(page, mode).click();
}

export async function waitForGameState(page, target, timeout = 3000) {
  await page.waitForFunction(
    (s) => window.__gameState?.gameState === s,
    target,
    { timeout }
  );
}
