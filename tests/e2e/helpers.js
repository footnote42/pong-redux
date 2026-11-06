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

// The pause button (HUD), pause screen and victory screen are HTML too
export const pauseButton = (page) => page.getByRole('button', { name: 'Pause', exact: true });
export const pauseScreen = (page) => page.locator('[data-screen="pause"]');
export const victoryScreen = (page) => page.locator('[data-screen="victory"]');

// Press a button on an overlay screen by its visible name
export const overlayButton = (screen, name) => screen.getByRole('button', { name, exact: true });

export async function waitForGameState(page, target, timeout = 3000) {
  await page.waitForFunction(
    (s) => window.__gameState?.gameState === s,
    target,
    { timeout }
  );
}

// The settings panel is HTML over the canvas (ADR 0001); reach its controls by
// role and name, the way a player sees them.
export function settingsPanel(page) {
  return page.locator('[data-screen="settings"]');
}

export function settingsTab(page, name) {
  return settingsPanel(page).getByRole('tab', { name });
}

export function settingsGroup(page, name) {
  return settingsPanel(page).getByRole('radiogroup', { name });
}

// Open settings from the landing gear (click, or tap on a touch screen)
export async function openSettingsFromGear(page, hasTouch = false) {
  const gear = landing(page).getByRole('button', { name: 'Settings' });
  await (hasTouch ? gear.tap() : gear.click());
  await settingsPanel(page).waitFor({ state: 'visible' });
}

// Start every test with a clean profile, but keep what the page saves across
// reloads within the test (a plain init script would wipe it on each reload).
export async function freshProfileOnce(page) {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('test-seeded')) return;
    sessionStorage.setItem('test-seeded', '1');
    localStorage.clear();
    localStorage.setItem('pong:seenInstructions', '1');
  });
}
