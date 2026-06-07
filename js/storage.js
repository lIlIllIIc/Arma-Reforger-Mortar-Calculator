/**
 * Mortar Ballistics Calculator - localStorage Persistence
 *
 * Copyright (c) 2024 C-gamer_DX. All rights reserved.
 *
 * All `localStorage` keys are preserved from the previous monolithic
 * script.js so existing user data continues to load on first run.
 */

let isLoadingData = false;

// ============================================================================
// Schema versioning
// ============================================================================
//
// Bump CURRENT_SCHEMA_VERSION whenever the saved-data shape changes, and add
// a corresponding entry to MIGRATIONS that transforms one-version-older data
// into the new shape. ensureSchemaUpToDate() runs before loadAllData() to
// keep user data in sync without losing anything.

const CURRENT_SCHEMA_VERSION = 1;

const MIGRATIONS = {
    // 1: function () { /* first versioned schema — nothing to do */ }
    // Example for the future:
    // 2: function () {
    //     // Rename "shellType" → "shell" on every logged mission
    //     const list = JSON.parse(localStorage.getItem('loggedMissions') || '[]');
    //     list.forEach(m => { if (m.shellType) { m.shell = m.shellType; delete m.shellType; } });
    //     localStorage.setItem('loggedMissions', JSON.stringify(list));
    // }
};

function ensureSchemaUpToDate() {
    const stored = parseInt(localStorage.getItem('dataSchemaVersion'), 10) || 0;
    if (stored >= CURRENT_SCHEMA_VERSION) return;

    for (let v = stored + 1; v <= CURRENT_SCHEMA_VERSION; v++) {
        const migrate = MIGRATIONS[v];
        if (typeof migrate === 'function') {
            try { migrate(); }
            catch (e) { console.error(`Migration ${v} failed:`, e); }
        }
    }
    localStorage.setItem('dataSchemaVersion', String(CURRENT_SCHEMA_VERSION));
}

// Per-mission input field IDs. Used by both save and load.
const MISSION_FIELDS = {
    grid: [
        'platform', 'arc', 'sheaf-type-grid',
        'target-x', 'target-y', 'target-alt', 'fo-dir',
        'sheaf-length', 'sheaf-direction', 'sheaf-diameter',
        'add-drop', 'left-right', 'target-number-grid', 'amount-rounds-grid',
        'crest-grid'
    ],
    polar: [
        'platform-polar', 'arc-polar', 'sheaf-type-polar',
        'fo-x-polar', 'fo-y-polar', 'fo-dist-polar', 'fo-dir-polar', 'target-alt-polar',
        'sheaf-length-polar', 'sheaf-direction-polar', 'sheaf-diameter-polar',
        'add-drop-polar', 'left-right-polar', 'target-number-polar', 'amount-rounds-polar',
        'crest-polar'
    ],
    shift: [
        'platform-shift', 'arc-shift', 'sheaf-type-shift',
        'target-alt-shift', 'fo-dir-shift',
        'sheaf-length-shift', 'sheaf-direction-shift', 'sheaf-diameter-shift',
        'add-drop-shift', 'left-right-shift',
        'target-number-shift', 'amount-rounds-shift',
        'shift-x', 'shift-y',
        'crest-shift'
    ]
};

// Global (cross-mission) inputs that need autosaving alongside per-mission fields.
const GLOBAL_FIELDS = ['global-wind-speed', 'global-wind-from-deg'];

function getAllPersistedFieldIds() {
    return [
        'num-sections',
        ...GLOBAL_FIELDS,
        ...MISSION_FIELDS.grid, ...MISSION_FIELDS.polar, ...MISSION_FIELDS.shift
    ];
}

// ============================================================================
// Save
// ============================================================================

function saveGlobalData() {
    saveAllData();
    showAlertModal('Success', 'Global data saved');
}

function saveAllData() {
    if (isLoadingData) return;

    flashSaveIndicator();

    const numSectionsEl = document.getElementById('num-sections');
    const numSections = numSectionsEl ? parseInt(numSectionsEl.value) || 1 : 1;
    localStorage.setItem('numSections', numSections);

    // Section gun counts + altitudes
    for (let i = 1; i <= numSections; i++) {
        const gunsSel = document.getElementById(`section-${i}-guns`);
        const altInput = document.getElementById(`section-${i}-alt`);
        if (gunsSel) localStorage.setItem(`section-${i}-guns`, gunsSel.value);
        if (altInput) localStorage.setItem(`section-${i}-alt`, altInput.value);
    }

    // Per-section mortar coordinates
    const gunConfig = getGunConfiguration();
    gunConfig.forEach(cfg => {
        for (let g = 1; g <= cfg.guns; g++) {
            const x = document.getElementById(`section-${cfg.section}-gun-${g}-x`);
            const y = document.getElementById(`section-${cfg.section}-gun-${g}-y`);
            if (x && y) {
                localStorage.setItem(`section-${cfg.section}-gun-${g}-x`, x.value);
                localStorage.setItem(`section-${cfg.section}-gun-${g}-y`, y.value);
            }
        }
    });

    localStorage.setItem('numGuns', getTotalGuns());

    // Mission input fields (grid + polar + shift) and global (wind, etc.)
    [...GLOBAL_FIELDS, ...MISSION_FIELDS.grid, ...MISSION_FIELDS.polar, ...MISSION_FIELDS.shift].forEach(id => {
        const el = document.getElementById(id);
        if (el) localStorage.setItem(id, el.value);
    });

    // Per-section shell + rings selections, all three mission types
    ['grid', 'polar', 'shift'].forEach(type => {
        for (let i = 1; i <= numSections; i++) {
            const shellSel = document.getElementById(`section-${i}-shell-${type}`);
            const ringsSel = document.getElementById(`section-${i}-rings-${type}`);
            if (shellSel) localStorage.setItem(`section-${i}-shell-${type}`, shellSel.value);
            if (ringsSel) localStorage.setItem(`section-${i}-rings-${type}`, ringsSel.value);
        }
    });
}

function flashSaveIndicator() {
    const ind = document.getElementById('save-indicator');
    if (!ind) return;
    ind.style.display = 'block';
    setTimeout(() => { ind.style.display = 'none'; }, 1000);
}

// ============================================================================
// Load
// ============================================================================

function loadAllData() {
    ensureSchemaUpToDate();
    isLoadingData = true;

    const ind = document.getElementById('save-indicator');
    if (ind) {
        ind.textContent = 'Data loaded from previous session';
        ind.style.display = 'block';
        setTimeout(() => {
            ind.style.display = 'none';
            ind.textContent = 'Data saved automatically';
        }, 2000);
    }

    const numSections = localStorage.getItem('numSections');
    const numGuns = localStorage.getItem('numGuns');

    if (numSections) {
        const el = document.getElementById('num-sections');
        if (el) {
            el.value = numSections;
            updateSectionConfiguration();

            setTimeout(() => {
                for (let i = 1; i <= parseInt(numSections); i++) {
                    const savedGuns = localStorage.getItem(`section-${i}-guns`);
                    const savedAlt = localStorage.getItem(`section-${i}-alt`);
                    const gunsSel = document.getElementById(`section-${i}-guns`);
                    const altInput = document.getElementById(`section-${i}-alt`);
                    if (savedGuns && gunsSel) gunsSel.value = savedGuns;
                    if (savedAlt && altInput) altInput.value = savedAlt;
                }

                updateMortarCoordinates();

                setTimeout(() => {
                    restoreMortarCoordinates();
                    restoreSectionShellSelections(parseInt(numSections));
                }, 0);
            }, 0);
        }
    } else if (numGuns) {
        // Legacy data format (pre-multi-section). Fall back to a single section.
        const sectionSelect = document.getElementById('num-sections');
        if (sectionSelect) {
            sectionSelect.value = '1';
            updateSectionConfiguration();
            setTimeout(() => {
                const gunsSel = document.getElementById('section-1-guns');
                const altInput = document.getElementById('section-1-alt');
                if (gunsSel) gunsSel.value = numGuns;
                if (altInput) {
                    const oldAlt = localStorage.getItem('mortarAlt');
                    if (oldAlt) altInput.value = oldAlt;
                }
                updateMortarCoordinates();
                setTimeout(restoreMortarCoordinates, 0);
            }, 0);
        }
    }

    // Mission + global field values
    [...GLOBAL_FIELDS, ...MISSION_FIELDS.grid, ...MISSION_FIELDS.polar, ...MISSION_FIELDS.shift].forEach(id => {
        const value = localStorage.getItem(id);
        const el = document.getElementById(id);
        if (value !== null && el) el.value = value;
    });

    // Sheaf-type dropdowns need their show/hide handlers re-triggered.
    ['sheaf-type-grid', 'sheaf-type-polar', 'sheaf-type-shift'].forEach(id => {
        if (document.getElementById(id) && localStorage.getItem(id)) {
            onSheafTypeChange(id);
        }
    });

    // The shell dropdowns were built during updateSectionConfiguration before
    // platform values had loaded, so they reflect the default platform's shell
    // list. Rebuild them now and re-apply the saved per-section selections.
    refreshAllShellConfigurations();
    const reloadedSections = parseInt(document.getElementById('num-sections').value) || 1;
    setTimeout(() => restoreSectionShellSelections(reloadedSections), 20);

    setTimeout(() => { isLoadingData = false; }, 100);
}

function restoreMortarCoordinates() {
    const gunConfig = getGunConfiguration();
    gunConfig.forEach(cfg => {
        for (let g = 1; g <= cfg.guns; g++) {
            const x = localStorage.getItem(`section-${cfg.section}-gun-${g}-x`);
            const y = localStorage.getItem(`section-${cfg.section}-gun-${g}-y`);
            const xEl = document.getElementById(`section-${cfg.section}-gun-${g}-x`);
            const yEl = document.getElementById(`section-${cfg.section}-gun-${g}-y`);
            if (x && xEl) xEl.value = x;
            if (y && yEl) yEl.value = y;
        }
    });
}

function restoreSectionShellSelections(numSections) {
    ['grid', 'polar', 'shift'].forEach(type => {
        for (let i = 1; i <= numSections; i++) {
            const shellVal = localStorage.getItem(`section-${i}-shell-${type}`);
            const ringsVal = localStorage.getItem(`section-${i}-rings-${type}`);
            const shellSel = document.getElementById(`section-${i}-shell-${type}`);
            const ringsSel = document.getElementById(`section-${i}-rings-${type}`);
            if (shellVal && shellSel) shellSel.value = shellVal;
            if (ringsVal && ringsSel) ringsSel.value = ringsVal;
        }
    });
}

// ============================================================================
// Clear
// ============================================================================

// ============================================================================
// Export / Import (whole-localStorage backup)
// ============================================================================

/**
 * Bundle every localStorage key into a JSON file the user can download. Skips
 * nothing — known points, NFAs, logged missions, mission templates, schema
 * version, every input value: all included. Re-importing the file restores
 * the exact same state.
 */
function exportAllData() {
    const data = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        exportedAt: new Date().toISOString(),
        application: 'Mortar Ballistics Calculator',
        localStorage: {}
    };

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        data.localStorage[key] = localStorage.getItem(key);
    }

    const stamp = new Date().toISOString().split('T')[0];
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mortar-calc-data-${stamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/** Opens a hidden file picker, then routes the chosen file to importDataFromFile(). */
function triggerImportDataPicker() {
    let picker = document.getElementById('hidden-import-picker');
    if (!picker) {
        picker = document.createElement('input');
        picker.type = 'file';
        picker.id = 'hidden-import-picker';
        picker.accept = 'application/json,.json';
        picker.style.display = 'none';
        picker.addEventListener('change', function (e) {
            const file = e.target.files && e.target.files[0];
            if (file) importDataFromFile(file);
            picker.value = '';  // allow re-import of the same file later
        });
        document.body.appendChild(picker);
    }
    picker.click();
}

function importDataFromFile(file) {
    const reader = new FileReader();
    reader.onload = function (e) {
        let parsed;
        try { parsed = JSON.parse(e.target.result); }
        catch (err) {
            showAlertModal('Invalid File', 'Could not parse JSON: ' + err.message);
            return;
        }
        if (!parsed || typeof parsed.localStorage !== 'object') {
            showAlertModal('Invalid File', 'This file does not look like exported mortar-calc data.');
            return;
        }
        showConfirmModal(
            'Replace All Data?',
            'This will overwrite your current settings, known points, NFAs, logged missions, and templates with the contents of the file. Continue?',
            () => {
                localStorage.clear();
                Object.entries(parsed.localStorage).forEach(([k, v]) => {
                    localStorage.setItem(k, v);
                });
                location.reload();
            }
        );
    };
    reader.readAsText(file);
}

function clearAllData() {
    showConfirmModal(
        'Clear All Data',
        'Are you sure you want to clear all saved data? This action cannot be undone.',
        () => {
            // Wipe every key written by saveAllData (plus legacy keys).
            const keys = [
                'mortarAlt', 'numGuns', 'numSections', 'realisticMode',
                'shell', 'rings', 'shell-polar', 'rings-polar',
                ...MISSION_FIELDS.grid, ...MISSION_FIELDS.polar,
                'loggedMissions'
            ];

            // Per-section, per-gun, per-mission keys for up to 6 sections × 6 guns × 3 missions.
            for (let s = 1; s <= 6; s++) {
                keys.push(`section-${s}-guns`, `section-${s}-alt`);
                for (let g = 1; g <= 6; g++) {
                    keys.push(`section-${s}-gun-${g}-x`, `section-${s}-gun-${g}-y`);
                }
                ['grid', 'polar', 'shift'].forEach(type => {
                    keys.push(`section-${s}-shell-${type}`, `section-${s}-rings-${type}`);
                });
            }
            // Legacy per-gun keys from before multi-section.
            for (let i = 1; i <= 6; i++) keys.push(`mortarX${i}`, `mortarY${i}`);

            keys.forEach(k => localStorage.removeItem(k));
            location.reload();
        }
    );
}
