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
    // Re-run ring auto-selection on every mission page so the dropdowns
    // reflect new range envelopes / ring sets immediately.
    ['grid', 'polar', 'shift'].forEach(triggerRingUpdatesForCalculation);
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
    Settings.init();
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
});
