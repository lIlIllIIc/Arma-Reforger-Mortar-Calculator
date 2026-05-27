/**
 * Mortar Ballistics Calculator - UI Plumbing & App Bootstrap
 *
 * Copyright (c) 2024 C-gamer_DX. All rights reserved.
 *
 * Owns: page navigation, generic alert/confirm modals, sheaf-parameter
 * show/hide, input-validation listeners, per-mission reset, and the
 * DOMContentLoaded wiring that connects everything together.
 */

// ============================================================================
// User preferences (Settings page)
// ============================================================================
//
// Pref values live under the single 'userPrefs' localStorage key (JSON). The
// home-page Adult Mortars toggle and the Settings page checkbox both reflect
// the same backing flag (Settings.realistic from platforms.js).

const Prefs = {
    DEFAULTS: {
        liveRecalc: false,
        defaultPlatform: 'M252',
        defaultSections: 1,
        defaultSheafType: 'parallel'
    },
    current: null,

    init() {
        try {
            const raw = localStorage.getItem('userPrefs');
            this.current = raw ? { ...this.DEFAULTS, ...JSON.parse(raw) } : { ...this.DEFAULTS };
        } catch (e) {
            this.current = { ...this.DEFAULTS };
        }
    },

    get(key) { return this.current[key]; },

    set(key, value) {
        this.current[key] = value;
        localStorage.setItem('userPrefs', JSON.stringify(this.current));
    }
};

/**
 * Seed localStorage with the user's defaults before loadAllData runs, so any
 * brand-new install (or any key the user has never set) picks up their
 * preferred starting values rather than the HTML's hardcoded ones.
 */
function applyPrefsAsDefaultsToStorage() {
    if (!localStorage.getItem('numSections')) {
        localStorage.setItem('numSections', String(Prefs.get('defaultSections')));
    }
    const defPlatform = Prefs.get('defaultPlatform');
    ['platform', 'platform-polar', 'platform-shift'].forEach(id => {
        if (!localStorage.getItem(id)) localStorage.setItem(id, defPlatform);
    });
    const defSheaf = Prefs.get('defaultSheafType');
    ['sheaf-type-grid', 'sheaf-type-polar', 'sheaf-type-shift'].forEach(id => {
        if (!localStorage.getItem(id)) localStorage.setItem(id, defSheaf);
    });
}

// ----- Settings page UI handlers -----

function syncSettingsPageUI() {
    const adult = document.getElementById('pref-adult-mortars');
    if (adult) adult.checked = !!Settings.realistic;

    const live = document.getElementById('pref-live-recalc');
    if (live) live.checked = !!Prefs.get('liveRecalc');

    const platform = document.getElementById('pref-default-platform');
    if (platform) platform.value = Prefs.get('defaultPlatform');

    const sections = document.getElementById('pref-default-sections');
    if (sections) sections.value = String(Prefs.get('defaultSections'));

    const sheaf = document.getElementById('pref-default-sheaf');
    if (sheaf) sheaf.value = Prefs.get('defaultSheafType');
}

function setAdultMortarsMod(on) {
    if (Settings.realistic !== on) toggleRealisticMode();  // reuses existing flip path
}

function setLiveRecalc(on) {
    Prefs.set('liveRecalc', !!on);
}

function setDefaultPlatform(v) { Prefs.set('defaultPlatform', v); }
function setDefaultSections(v) { Prefs.set('defaultSections', parseInt(v, 10) || 1); }
function setDefaultSheafType(v) { Prefs.set('defaultSheafType', v); }

// ----- Live auto-recalc -----

let liveRecalcDebounceTimer = null;

function maybeLiveRecalc(missionType) {
    if (!Prefs.get('liveRecalc')) return;
    // Only recalc if a solution is already on screen; otherwise we'd flag
    // validation errors before the user even pressed Calculate.
    const base = document.getElementById(`base-results-${missionType}`);
    const cards = document.getElementById(`section-solutions-${missionType}`);
    const hasResult = (base && base.style.display !== 'none')
                   || (cards && cards.style.display !== 'none');
    if (!hasResult) return;

    clearTimeout(liveRecalcDebounceTimer);
    liveRecalcDebounceTimer = setTimeout(() => calculateMission(missionType, true), 300);
}

// ============================================================================
// Page navigation
// ============================================================================

let navigationHistory = [];

function showPage(pageId, addToHistory = true) {
    const current = document.querySelector('.page.active');
    if (addToHistory && current && current.id !== 'home-page') {
        navigationHistory.push(current.id);
    }

    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');

    // Floating buttons visibility
    const homeBtn = document.querySelector('.floating-home-btn');
    const backBtn = document.querySelector('.floating-back-btn');
    const floatGrid = document.getElementById('floating-actions-grid');
    const floatPolar = document.getElementById('floating-actions-polar');
    const floatShift = document.getElementById('floating-actions-shift');

    if (pageId === 'home-page') {
        homeBtn.style.display = 'none';
        backBtn.style.display = 'none';
        if (floatGrid)  floatGrid.style.display = 'none';
        if (floatPolar) floatPolar.style.display = 'none';
        if (floatShift) floatShift.style.display = 'none';
        navigationHistory = [];
    } else {
        homeBtn.style.display = 'block';
        backBtn.style.display = 'block';
        if (floatGrid)  floatGrid.style.display  = pageId === 'grid-mission'           ? 'flex' : 'none';
        if (floatPolar) floatPolar.style.display = pageId === 'polar-mission'          ? 'flex' : 'none';
        if (floatShift) floatShift.style.display = pageId === 'shift-from-known-point' ? 'flex' : 'none';
    }

    // Per-page data refresh
    if (pageId === 'logged-missions') displayLoggedMissions();
    else if (pageId === 'known-points') displayKnownPoints();
    else if (pageId === 'nfa') displayNFAs();
    else if (pageId === 'templates') displayTemplates();
    else if (pageId === 'settings') syncSettingsPageUI();
    else if (pageId === 'shift-from-known-point') updateKnownPointDropdown();
}

function goBack() {
    if (navigationHistory.length) {
        showPage(navigationHistory.pop(), false);
    } else {
        showPage('home-page', false);
    }
}

// ============================================================================
// Sheaf parameter show/hide (was inline in index.html)
// ============================================================================

const SHEAF_PARAM_PANELS = {
    'sheaf-type-grid':  { linear: 'linear-sheaf-params',        circular: 'circular-sheaf-params' },
    'sheaf-type-polar': { linear: 'linear-sheaf-params-polar',  circular: 'circular-sheaf-params-polar' },
    'sheaf-type-shift': { linear: 'linear-sheaf-params-shift',  circular: 'circular-sheaf-params-shift' }
};

function onSheafTypeChange(sheafTypeSelectId) {
    const panels = SHEAF_PARAM_PANELS[sheafTypeSelectId];
    if (!panels) return;

    const value = document.getElementById(sheafTypeSelectId).value;
    const linearPanel = document.getElementById(panels.linear);
    const circularPanel = document.getElementById(panels.circular);
    if (!linearPanel || !circularPanel) return;

    linearPanel.style.display = value === 'linear' ? 'block' : 'none';
    circularPanel.style.display = value === 'circular' ? 'block' : 'none';
}

// ============================================================================
// Inline field validation (red border + helper text)
// ============================================================================

/**
 * Mark a form field as having a validation error. The visual hint is a red
 * border on the input plus a small message in a sibling `<div>` inside the
 * same `.input-row`. Errors auto-clear the next time the user edits the field.
 */
function setFieldError(inputId, message) {
    const input = document.getElementById(inputId);
    if (!input) return;
    input.classList.add('has-error');

    const row = input.closest('.input-row');
    if (!row) return;

    let msg = row.querySelector('.field-error-message');
    if (!msg) {
        msg = document.createElement('div');
        msg.className = 'field-error-message';
        row.appendChild(msg);
    }
    msg.textContent = message;
}

function clearFieldError(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    input.classList.remove('has-error');
    const row = input.closest('.input-row');
    if (!row) return;
    const msg = row.querySelector('.field-error-message');
    if (msg) msg.remove();
}

function clearAllFieldErrors() {
    document.querySelectorAll('.has-error').forEach(el => el.classList.remove('has-error'));
    document.querySelectorAll('.field-error-message').forEach(el => el.remove());
}

/** Same shape as setFieldError but uses an amber (non-blocking) warning style. */
function setFieldWarning(inputId, message) {
    const input = document.getElementById(inputId);
    if (!input) return;
    input.classList.add('has-warning');

    const row = input.closest('.input-row');
    if (!row) return;
    let msg = row.querySelector('.field-warning-message');
    if (!msg) {
        msg = document.createElement('div');
        msg.className = 'field-warning-message';
        row.appendChild(msg);
    }
    msg.textContent = message;
}

function clearFieldWarning(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    input.classList.remove('has-warning');
    const row = input.closest('.input-row');
    if (!row) return;
    const msg = row.querySelector('.field-warning-message');
    if (msg) msg.remove();
}

// ============================================================================
// Global error banner (catches uncaught JS errors so the page doesn't die silently)
// ============================================================================

function showGlobalErrorBanner(message) {
    let banner = document.getElementById('global-error-banner');
    if (!banner) {
        banner = document.createElement('div');
        banner.id = 'global-error-banner';
        banner.innerHTML = `
            <span aria-hidden="true">⚠</span>
            <span class="global-error-text"></span>
            <button onclick="location.reload()">Reload</button>
            <button class="dismiss" onclick="document.getElementById('global-error-banner').style.display='none'">Dismiss</button>
        `;
        document.body.appendChild(banner);
    }
    banner.querySelector('.global-error-text').textContent = message;
    banner.style.display = 'block';
}

window.addEventListener('error', function (event) {
    showGlobalErrorBanner('Unexpected error: ' + (event.message || 'unknown'));
});
window.addEventListener('unhandledrejection', function (event) {
    const reason = event.reason && event.reason.message ? event.reason.message : String(event.reason);
    showGlobalErrorBanner('Unhandled promise rejection: ' + reason);
});

// ============================================================================
// Generic alert / confirm modals
// ============================================================================

let confirmCallback = null;

function showAlertModal(title, message) {
    document.getElementById('alert-title').textContent = title || 'Alert';
    document.getElementById('alert-message').textContent = message;
    document.getElementById('alert-modal').style.display = 'block';
}

function closeAlertModal() {
    document.getElementById('alert-modal').style.display = 'none';
}

function showConfirmModal(title, message, callback) {
    document.getElementById('confirm-title').textContent = title || 'Confirm Action';
    document.getElementById('confirm-message').textContent = message;
    confirmCallback = callback;
    document.getElementById('confirm-modal').style.display = 'block';
}

function closeConfirmModal() {
    document.getElementById('confirm-modal').style.display = 'none';
    confirmCallback = null;
}

function confirmAction() {
    if (confirmCallback) confirmCallback();
    closeConfirmModal();
}

// ----- Prompt modal (replaces native window.prompt for consistent UI) -----

let promptCallback = null;

function showPromptModal(title, message, defaultValue, callback) {
    document.getElementById('prompt-title').textContent = title || 'Enter Value';
    document.getElementById('prompt-message').textContent = message || '';
    const input = document.getElementById('prompt-input');
    input.value = defaultValue || '';
    promptCallback = callback;
    document.getElementById('prompt-modal').style.display = 'block';
    setTimeout(() => { input.focus(); input.select(); }, 50);
}

function submitPromptModal() {
    const value = document.getElementById('prompt-input').value.trim();
    const cb = promptCallback;
    closePromptModal();
    if (cb) cb(value);
}

function closePromptModal() {
    document.getElementById('prompt-modal').style.display = 'none';
    promptCallback = null;
}

// ============================================================================
// Save indicator helper
// ============================================================================

function showSaveIndicator(message = 'Data saved automatically') {
    const ind = document.getElementById('save-indicator');
    if (!ind) return;
    ind.textContent = message;
    ind.style.display = 'block';
    setTimeout(() => {
        ind.style.display = 'none';
        ind.textContent = 'Data saved automatically';
    }, 2000);
}

// ============================================================================
// Realistic-mode toggle
// ============================================================================

function toggleRealisticMode() {
    Settings.toggleRealistic();
    // Available shells + range envelopes can both change between vanilla and
    // realistic data, so rebuild the whole shell/rings UI for every mission.
    refreshAllShellConfigurations();
}

// ============================================================================
// Coord-pair auto-split — typing or pasting "XXXX YYYY" (or "XXXX, YYYY")
// into the X field fills both X and Y in one go.
// ============================================================================

/**
 * Pairs of (X input id → Y input id) that should support auto-split.
 * Dynamic mortar-coord inputs are handled separately via event delegation
 * (see registerMortarCoordAutoSplit below).
 */
const COORD_PAIR_FIELDS = [
    ['target-x', 'target-y'],
    ['fo-x-polar', 'fo-y-polar'],
    ['shift-x', 'shift-y']
];

const COORD_PAIR_REGEX = /^\s*(-?\d{1,4})\s*[,\s]\s*(-?\d{1,4})\s*$/;
const COORD_NUMBER_REGEX = /^-?\d{1,4}$/;

/**
 * Shared auto-split logic. Fires whenever an X input changes.
 *
 * Two cases:
 *  - Full pair detected ("0040 0050"): split into X and Y, overwriting Y
 *    even if it had a value (user clearly typed/pasted a pair).
 *  - User typed a separator after a valid number AND Y is empty: split the
 *    X part out, move focus to Y so they can continue typing the Y digits
 *    fluidly. Y with an existing value is left alone (won't clobber it for
 *    a stray space).
 */
function autoSplitCoordPair(xInput, yInput) {
    if (!xInput || !yInput) return;

    const text = xInput.value;
    const fullMatch = text.match(COORD_PAIR_REGEX);
    if (fullMatch) {
        xInput.value = fullMatch[1];
        yInput.value = fullMatch[2];
        yInput.dispatchEvent(new Event('input', { bubbles: true }));
        yInput.focus();
        const end = yInput.value.length;
        try { yInput.setSelectionRange(end, end); } catch (e) { /* number inputs may not allow */ }
        return;
    }

    const sepIdx = text.search(/[,\s]/);
    if (sepIdx > 0 && !yInput.value) {
        const xPart = text.substring(0, sepIdx);
        if (COORD_NUMBER_REGEX.test(xPart)) {
            xInput.value = xPart;
            yInput.focus();
        }
    }
}

function attachCoordPairAutoSplit(xId, yId) {
    const xInput = document.getElementById(xId);
    const yInput = document.getElementById(yId);
    if (!xInput || !yInput) return;
    xInput.addEventListener('input', () => autoSplitCoordPair(xInput, yInput));
}

/** Event-delegated auto-split for the dynamically-created gun coord X inputs. */
function registerMortarCoordAutoSplit() {
    const container = document.getElementById('mortar-coordinates-container');
    if (!container) return;
    container.addEventListener('input', function (e) {
        const t = e.target;
        if (!t || !t.matches || !t.matches('input[id*="-gun-"][id$="-x"]')) return;
        const yId = t.id.replace(/-x$/, '-y');
        autoSplitCoordPair(t, document.getElementById(yId));
    });
}

// ============================================================================
// Adjust-fire (±10 / ±50 / ±100 button panel next to ADD/DROP and LEFT/RIGHT)
// ============================================================================

/**
 * Add `delta` to the named input and (if a solution is already on screen for
 * the input's mission page) re-run the calculation. Bypasses NFA on the
 * follow-up — the user accepted the warning on the original calc and small
 * adjustments shouldn't re-prompt.
 */
function adjustField(inputId, delta) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const current = parseFloat(input.value) || 0;
    input.value = String(current + delta);
    input.dispatchEvent(new Event('input', { bubbles: true }));

    const missionType = inputId.endsWith('-polar') ? 'polar'
                      : inputId.endsWith('-shift') ? 'shift'
                      : 'grid';

    // Recalculate only if a previous solution is currently displayed; this
    // matches the "adjust fire" workflow and avoids spurious validation errors
    // before the user has set anything up.
    const base = document.getElementById(`base-results-${missionType}`);
    const cards = document.getElementById(`section-solutions-${missionType}`);
    const hasResult = (base && base.style.display !== 'none')
                   || (cards && cards.style.display !== 'none');
    if (hasResult) calculateMission(missionType, true);
}

// ============================================================================
// Reset (per mission)
// ============================================================================

function resetGridMission() {
    showConfirmModal('Reset Grid Mission',
        'Are you sure you want to reset all fields on the Grid Mission page? This will clear all input values and reset dropdowns to defaults.',
        () => resetMissionPage('grid', 'Grid Mission fields reset')
    );
}

function resetPolarMission() {
    showConfirmModal('Reset Polar Mission',
        'Are you sure you want to reset all fields on the Polar Plot Mission page? This will clear all input values and reset dropdowns to defaults.',
        () => resetMissionPage('polar', 'Polar Mission fields reset')
    );
}

function resetShiftMission() {
    // The original shift reset bypassed the confirm modal; preserve that.
    resetMissionPage('shift', null);

    const btn = (typeof event !== 'undefined' && event && event.target) ? event.target : null;
    if (btn) {
        const originalText = btn.textContent;
        const originalBg = btn.style.background;
        btn.textContent = 'Reset Complete!';
        btn.style.background = '#4CAF50';
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = originalBg || '#ff9800';
        }, 2000);
    }
}

function resetMissionPage(missionType, savedMessage) {
    RESET_INPUT_FIELDS[missionType].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });

    const sheafType = document.getElementById(`sheaf-type-${missionType}`);
    if (sheafType) sheafType.value = 'parallel';

    // Hide sheaf parameter panels
    const panels = SHEAF_PARAM_PANELS[`sheaf-type-${missionType}`];
    if (panels) {
        const l = document.getElementById(panels.linear);
        const c = document.getElementById(panels.circular);
        if (l) l.style.display = 'none';
        if (c) c.style.display = 'none';
    }

    if (missionType === 'shift') {
        const kp = document.getElementById('known-point-select');
        if (kp) kp.value = '';
    }

    // Hide result panels for this mission
    [
        `base-results-${missionType}`,
        `corrected-results-${missionType}`,
        `section-solutions-${missionType}`,
        `mini-map-${missionType}`,
        `fire-solution-guns-${missionType}`
    ].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });

    saveAllData();
    if (savedMessage) showSaveIndicator(savedMessage);
}

// ============================================================================
// Input validation listeners
// ============================================================================

/**
 * Per-field max length rules. Coord/correction fields allow a leading minus.
 *   maxDigits: int (excluding the minus sign)
 *   signed: boolean
 */
const INPUT_RULES = {
    coord: { maxDigits: 4, signed: true },
    direction: { maxDigits: 3, signed: false },
    rounds: { maxDigits: 3, signed: false },
    targetNumber: { maxChars: 6 }
};

const FIELD_RULE_MAP = [
    { rule: 'coord', fields: [
        'target-x', 'target-y', 'fo-x-polar', 'fo-y-polar', 'fo-dist-polar',
        'target-alt', 'target-alt-polar',
        'sheaf-length', 'sheaf-length-polar',
        'sheaf-diameter', 'sheaf-diameter-polar',
        'add-drop', 'left-right', 'add-drop-polar', 'left-right-polar'
    ]},
    { rule: 'direction', fields: ['fo-dir', 'fo-dir-polar', 'sheaf-direction', 'sheaf-direction-polar'] },
    { rule: 'rounds', fields: ['amount-rounds-grid', 'amount-rounds-polar'] },
    { rule: 'targetNumber', fields: ['target-number-grid', 'target-number-polar'] }
];

function setupInputValidation() {
    FIELD_RULE_MAP.forEach(({ rule, fields }) => {
        const ruleDef = INPUT_RULES[rule];
        fields.forEach(id => {
            const field = document.getElementById(id);
            if (!field) return;
            field.addEventListener('input', function () {
                this.value = applyInputRule(this.value, ruleDef);
            });
        });
    });

    // Legacy single-gun mortar coords (mortar-x-{i}/mortar-y-{i}) — these only
    // exist for back-compat with old saved data and are no longer rendered,
    // but if an HTML edit re-introduces them this still trims input.
    for (let i = 1; i <= 6; i++) {
        ['x', 'y'].forEach(axis => {
            const field = document.getElementById(`mortar-${axis}-${i}`);
            if (!field) return;
            field.addEventListener('input', function () {
                this.value = applyInputRule(this.value, INPUT_RULES.coord);
            });
        });
    }
}

function applyInputRule(raw, rule) {
    if (rule.maxChars !== undefined) {
        return raw.length > rule.maxChars ? raw.substring(0, rule.maxChars) : raw;
    }
    let value = raw.replace(/[^\d-]/g, '');
    if (rule.signed) {
        if (value.startsWith('-')) {
            value = '-' + value.substring(1).replace(/-/g, '');
            if (value.length > rule.maxDigits + 1) value = value.substring(0, rule.maxDigits + 1);
        } else {
            value = value.replace(/-/g, '');
            if (value.length > rule.maxDigits) value = value.substring(0, rule.maxDigits);
        }
    } else {
        value = value.replace(/-/g, '');
        if (value.length > rule.maxDigits) value = value.substring(0, rule.maxDigits);
    }
    return value;
}

// ============================================================================
// DOMContentLoaded bootstrap
// ============================================================================

document.addEventListener('DOMContentLoaded', function () {
    Prefs.init();
    Settings.init();
    applyPrefsAsDefaultsToStorage();
    loadAllData();
    setupInputValidation();
    updateSectionConfiguration();
    updateKnownPointDropdown();

    // Auto-save listeners for every fixed input field (dynamically-created
    // section/gun inputs wire themselves up via event delegation below).
    getAllPersistedFieldIds().forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (!field) return;
        field.addEventListener('change', saveAllData);
        field.addEventListener('input', saveAllData);
    });

    const numSectionsField = document.getElementById('num-sections');
    if (numSectionsField) {
        numSectionsField.addEventListener('change', () => {
            updateSectionConfiguration();
            saveAllData();
        });
    }

    // Section gun/altitude changes — event delegation onto the dynamic container.
    const sectionConfigContainer = document.getElementById('section-configuration-container');
    if (sectionConfigContainer) {
        sectionConfigContainer.addEventListener('change', function (e) {
            if (e.target.matches('select[id^="section-"][id$="-guns"]')) {
                updateMortarCoordinates();
                saveAllData();
            } else if (e.target.matches('input[id^="section-"][id$="-alt"]')) {
                saveAllData();
            }
        });
        sectionConfigContainer.addEventListener('input', function (e) {
            if (e.target.matches('input[id^="section-"][id$="-alt"]')) {
                saveAllData();
            }
        });
    }

    // Per-mission section-selection checkboxes.
    ['section-selection-grid', 'section-selection-polar', 'section-selection-shift']
        .forEach(id => {
            const c = document.getElementById(id);
            if (!c) return;
            c.addEventListener('change', function (e) {
                if (e.target.matches('input[type="checkbox"]')) saveAllData();
            });
        });

    // Mortar coordinate inputs (dynamically created) — autosave on change/input.
    const mortarContainer = document.getElementById('mortar-coordinates-container');
    if (mortarContainer) {
        ['change', 'input'].forEach(evt => {
            mortarContainer.addEventListener(evt, function (e) {
                if (e.target.matches('input[id*="-gun-"][id$="-x"], input[id*="-gun-"][id$="-y"]')) {
                    saveAllData();
                }
            });
        });
    }

    // Per-mission shell/rings dropdowns (also dynamic).
    ['grid', 'polar', 'shift'].forEach(type => {
        const container = document.getElementById(`shell-config-${type}`);
        if (!container) return;
        container.addEventListener('change', function (e) {
            if (e.target.matches(`select[id^="section-"][id$="-shell-${type}"], select[id^="section-"][id$="-rings-${type}"]`)) {
                saveAllData();
            }
        });
    });

    const kpSelect = document.getElementById('known-point-select');
    if (kpSelect) kpSelect.addEventListener('change', saveAllData);

    // Typing or pasting "XXXX YYYY" into the X field auto-fills both coords.
    COORD_PAIR_FIELDS.forEach(([x, y]) => attachCoordPairAutoSplit(x, y));
    registerMortarCoordAutoSplit();

    // Clear an inline field-error the next time the user edits that field.
    document.body.addEventListener('input', function (e) {
        if (e.target && e.target.classList && e.target.classList.contains('has-error')) {
            clearFieldError(e.target.id);
        }
    });
    document.body.addEventListener('change', function (e) {
        if (e.target && e.target.classList && e.target.classList.contains('has-error')) {
            clearFieldError(e.target.id);
        }
    });

    // Live auto-recalculate (debounced) when the user enables it in Settings.
    document.body.addEventListener('input', function (e) {
        const page = e.target && e.target.closest ? e.target.closest('.page') : null;
        if (!page) return;
        const missionType = page.id === 'grid-mission' ? 'grid'
                          : page.id === 'polar-mission' ? 'polar'
                          : page.id === 'shift-from-known-point' ? 'shift'
                          : null;
        if (missionType) maybeLiveRecalc(missionType);
    });
});
