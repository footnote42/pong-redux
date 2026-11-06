// src/screen-settings.js
// The settings panel: tabs of native controls (radios, switches, sliders) laid
// over the canvas. Markup lives in index.html under data-screen="settings";
// mounted by screens.js. Values go through src/settings-model.js, which uses
// the game-state.js setters, so saved settings are unchanged.

import { settingsTabs, applySetting, readSetting, isSelected, formatSetting, SETTINGS, PADDLE_COLORS } from './settings-model.js';

/** Hide the panel: the state flag is what screens.js watches. */
export function closeSettings(state) {
  state.showSettings = false;
}

// "name", "!name" or "name=value", tested against the current settings
function conditionHolds(state, expression) {
  const negate = expression.startsWith('!');
  const [name, value] = expression.replace(/^!/, '').split('=');
  const current = readSetting(state, name);
  const holds = value === undefined ? Boolean(current) : String(current) === value;
  return negate ? !holds : holds;
}

const FOCUSABLE = 'button:not([disabled]), input:not([disabled])';

/**
 * @param {HTMLElement} el - the data-screen="settings" element
 * @param {Object} state - Game state
 */
export function mountSettings(el, state) {
  const doc = el.ownerDocument;
  const panel = el.querySelector('.settings-panel');
  const body = el.querySelector('.settings-body');
  const tabs = [...el.querySelectorAll('[role="tab"]')];
  const panes = [...el.querySelectorAll('[role="tabpanel"]')];
  let lastSignature = '';
  let pressedBackdrop = false;

  // The paddle colour swatches come from the model's palette
  for (const group of el.querySelectorAll('[data-colors]')) {
    const name = group.dataset.colors;
    for (const { value, name: label } of PADDLE_COLORS) {
      group.insertAdjacentHTML('beforeend',
        '<label class="seg swatch"><input type="radio"><span></span></label>');
      const input = group.lastElementChild.querySelector('input');
      input.name = name;
      input.value = value;
      input.dataset.setting = name;
      input.setAttribute('aria-label', label);
      input.nextElementSibling.style.background = value;
    }
  }

  const controls = [...el.querySelectorAll('[data-setting]')];
  for (const range of controls.filter((c) => c.type === 'range')) {
    const { min, max, step } = SETTINGS[range.dataset.setting];
    Object.assign(range, { min, max, step });
  }

  function currentTab() {
    const offered = settingsTabs(state);
    return offered.includes(state.settingsTab) ? state.settingsTab : offered[0];
  }

  function selectTab(tab, { focus = false } = {}) {
    if (!settingsTabs(state).includes(tab)) return;
    if (state.settingsTab !== tab) body.scrollTop = 0;
    state.settingsTab = tab;
    refresh();
    if (focus) tabs.find((t) => t.dataset.tab === tab).focus();
  }

  // Write the game state into every control
  function refresh() {
    const offered = settingsTabs(state);
    const tab = currentTab();
    for (const t of tabs) {
      const selected = t.dataset.tab === tab;
      t.hidden = !offered.includes(t.dataset.tab);
      t.setAttribute('aria-selected', String(selected));
      t.tabIndex = selected ? 0 : -1;
    }
    for (const pane of panes) pane.hidden = pane.dataset.pane !== tab;

    for (const control of controls) {
      const name = control.dataset.setting;
      if (control.type === 'radio') control.checked = isSelected(state, name, control.value);
      else if (control.type === 'checkbox') control.checked = Boolean(readSetting(state, name));
      else if (control.type === 'range') {
        const value = readSetting(state, name);
        control.value = value;
        const { min, max } = SETTINGS[name];
        control.style.setProperty('--fill', `${((value - min) / (max - min)) * 100}%`);
        const out = el.querySelector(`[data-output="${name}"]`);
        if (out) out.textContent = formatSetting(name, value);
      }
    }
    for (const node of el.querySelectorAll('[data-when]')) {
      node.hidden = !conditionHolds(state, node.dataset.when);
    }
    for (const node of el.querySelectorAll('[data-enabled-when]')) {
      node.disabled = !conditionHolds(state, node.dataset.enabledWhen);
    }
    lastSignature = signature();
  }

  // Settings can also change behind the panel's back (the 1/2/3 difficulty keys)
  function signature() {
    return JSON.stringify([state.settings, state.rugbySettings, state.settingsTab, state.rugbyMode?.enabled]);
  }

  function onChange(e) {
    const control = e.target.closest('[data-setting]');
    if (!control || control.type === 'range') return;
    const value = control.type === 'checkbox' ? control.checked : control.value;
    applySetting(state, control.dataset.setting, value);
    refresh();
  }

  function onInput(e) {
    const control = e.target.closest('[data-setting]');
    if (!control || control.type !== 'range') return;
    applySetting(state, control.dataset.setting, control.value);
    refresh();
  }

  function onClick(e) {
    if (e.target.closest('[data-action="close"]')) return closeSettings(state);
    const tab = e.target.closest('[role="tab"]');
    if (tab) return selectTab(tab.dataset.tab);
    // Tapping outside the panel closes it, but not when a drag that began on a
    // control (a slider thumb) happens to end out there
    if (e.target === el && pressedBackdrop) closeSettings(state);
  }

  function onPointerdown(e) {
    pressedBackdrop = e.target === el;
  }

  // Keyboard inside the panel. Esc and Tab-from-outside are handled in input.js.
  function onKeydown(e) {
    if (el.hidden) return;
    const inside = panel.contains(doc.activeElement);
    const selectedTab = tabs.find((t) => t.dataset.tab === currentTab());

    // Tab closes the panel from outside it (input.js); once focus is in the
    // panel it moves between controls, wrapping at the ends
    if (e.key === 'Tab' && inside) {
      const items = [...panel.querySelectorAll(FOCUSABLE)].filter((n) => n.offsetParent !== null && n.tabIndex >= 0);
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && doc.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && doc.activeElement === last) { e.preventDefault(); first.focus(); }
      return;
    }

    // Arrow keys bring a keyboard player into the panel
    if (!inside && e.key.startsWith('Arrow')) {
      e.preventDefault();
      selectedTab.focus();
      return;
    }

    // Arrow keys along the tab strip
    if (doc.activeElement?.getAttribute('role') === 'tab') {
      const offered = settingsTabs(state);
      const at = offered.indexOf(doc.activeElement.dataset.tab);
      const to = { ArrowLeft: at - 1, ArrowRight: at + 1, Home: 0, End: offered.length - 1 }[e.key];
      if (to !== undefined && to >= 0 && to < offered.length) {
        e.preventDefault();
        selectTab(offered[to], { focus: true });
      }
    }
  }

  el.addEventListener('click', onClick);
  el.addEventListener('pointerdown', onPointerdown);
  el.addEventListener('change', onChange);
  el.addEventListener('input', onInput);
  doc.addEventListener('keydown', onKeydown);

  return {
    show() {
      state.settingsTab = currentTab();
      body.scrollTop = 0;
      refresh();
    },
    update() {
      if (signature() !== lastSignature) refresh();
    },
    unmount() {
      el.removeEventListener('click', onClick);
      el.removeEventListener('pointerdown', onPointerdown);
      el.removeEventListener('change', onChange);
      el.removeEventListener('input', onInput);
      doc.removeEventListener('keydown', onKeydown);
    },
  };
}
