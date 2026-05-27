/**
 * Mortar Ballistics Calculator - Sections, Guns & Mortar Coordinates
 *
 * Copyright (c) 2024 C-gamer_DX. All rights reserved.
 *
 * Owns the DOM that describes the firing battery (sections, guns per
 * section, gun coordinates, section altitudes) and the dynamic per-mission
 * shell/ring dropdowns. Also hosts the unified ring auto-selector that
 * replaces the three near-identical Grid/Polar/Shift variants.
 */

// ============================================================================
// Section configuration (Edit Global Data page)
// ============================================================================

function updateSectionConfiguration() {
    const numSections = parseInt(document.getElementById('num-sections').value);
    const container = document.getElementById('section-configuration-container');
    container.innerHTML = '';

    for (let i = 1; i <= numSections; i++) {
        const sectionDiv = document.createElement('div');
        sectionDiv.className = 'section-config';
        sectionDiv.innerHTML = `
            <label>Section ${i} Guns:
                <select id="section-${i}-guns" onchange="updateMortarCoordinates()">
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                    <option value="6">6</option>
                </select>
            </label>
            <div class="input-row">
                <label>Section ${i} Altitude (m):</label>
                <input type="number" id="section-${i}-alt" />
            </div>
        `;
        container.appendChild(sectionDiv);

        const sectionGunsSelect = document.getElementById(`section-${i}-guns`);
        if (sectionGunsSelect && !sectionGunsSelect.value) {
            sectionGunsSelect.value = '4';
        }
    }

    updateMortarCoordinates();
    updateSectionSelections();
    // Silent autosave — saveGlobalData() shows a success modal and is reserved
    // for the explicit "Save" button on the Edit Global Data page. This path
    // runs on every page load (bootstrap + loadAllData), so it must not pop UI.
    saveAllData();
}

/** Re-render the per-mission "which sections to fire" checkboxes. */
function updateSectionSelections() {
    const numSections = parseInt(document.getElementById('num-sections').value);
    const missionTypes = ['grid', 'polar', 'shift'];

    missionTypes.forEach(type => {
        const container = document.getElementById(`section-selection-${type}`);
        if (!container) return;
        container.innerHTML = '';
        for (let i = 1; i <= numSections; i++) {
            const row = document.createElement('div');
            row.className = 'input-row';
            row.innerHTML = `
                <label><input type="checkbox" id="section-${i}-${type}" onchange="updateSectionSelection('${type}')" ${i === 1 ? 'checked' : ''} /> Section ${i}</label>
            `;
            container.appendChild(row);
        }
    });

    missionTypes.forEach(updateMissionShellConfiguration);
}

/**
 * Build the shell/rings dropdowns for one mission page. The shell list is
 * sourced from the active platform via Settings, so platforms with fewer
 * shell types (e.g. 2B14 with HE only) don't show options that would error.
 *
 * Falls back to the canonical HE/SMOKE/ILUM/PRACTICE set when the platform
 * has no data yet (M119 placeholder) — that way the UI never collapses to
 * an empty select.
 */
const DEFAULT_SHELL_FALLBACK = ['HE', 'SMOKE', 'ILUM', 'PRACTICE'];

function updateMissionShellConfiguration(missionType) {
    const numSections = parseInt(document.getElementById('num-sections').value);
    const container = document.getElementById(`shell-config-${missionType}`);
    if (!container) return;

    const available = Settings.getAvailableShells(missionType);
    const shellOptions = available.length ? available : DEFAULT_SHELL_FALLBACK;

    container.innerHTML = '';

    for (let i = 1; i <= numSections; i++) {
        const shellRow = document.createElement('div');
        shellRow.className = 'input-row';
        shellRow.innerHTML = `
            <label>Section ${i} Shell Type:</label>
            <select id="section-${i}-shell-${missionType}" onchange="updateSectionRingsOptions(${i}, '${missionType}')">
                ${shellOptions.map(s => `<option value="${s}">${s}</option>`).join('')}
            </select>
        `;
        container.appendChild(shellRow);

        const ringsRow = document.createElement('div');
        ringsRow.className = 'input-row';
        ringsRow.innerHTML = `
            <label>Section ${i} Rings:</label>
            <select id="section-${i}-rings-${missionType}">
                <option value="0">0</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
            </select>
        `;
        container.appendChild(ringsRow);

        // Defer initial ring update so mortar coordinates have time to load.
        setTimeout(() => updateSectionRingsOptions(i, missionType), 50);
    }
}

/**
 * Rebuild every mission's shell/rings dropdowns + ring auto-selection. Call
 * after the active platform changes or the realistic-mode toggle flips, since
 * either can change the set of available shells.
 */
function refreshAllShellConfigurations() {
    ['grid', 'polar', 'shift'].forEach(mt => {
        updateMissionShellConfiguration(mt);
        triggerRingUpdatesForCalculation(mt);
    });
}

/** "All sections" master checkbox handler — keeps the per-section boxes sane. */
function updateSectionSelection(missionType) {
    const allBox = document.getElementById(`all-sections-${missionType}`);
    const numSections = parseInt(document.getElementById('num-sections').value);

    if (allBox && allBox.checked) {
        for (let i = 1; i <= numSections; i++) {
            const box = document.getElementById(`section-${i}-${missionType}`);
            if (box) box.checked = false;
        }
        return;
    }

    // If nothing is selected, force section 1 on.
    let hasSelection = false;
    for (let i = 1; i <= numSections; i++) {
        const box = document.getElementById(`section-${i}-${missionType}`);
        if (box && box.checked) { hasSelection = true; break; }
    }
    if (!hasSelection) {
        const first = document.getElementById(`section-1-${missionType}`);
        if (first) first.checked = true;
    }
}

// ============================================================================
// Selected-section / gun accessors
// ============================================================================

function getSelectedSections(missionType) {
    const allBox = document.getElementById(`all-sections-${missionType}`);
    const numSections = parseInt(document.getElementById('num-sections').value);
    const out = [];

    if (allBox && allBox.checked) {
        for (let i = 1; i <= numSections; i++) out.push(i);
        return out;
    }
    for (let i = 1; i <= numSections; i++) {
        const box = document.getElementById(`section-${i}-${missionType}`);
        if (box && box.checked) out.push(i);
    }
    return out;
}

function getTotalGuns() {
    const numSections = parseInt(document.getElementById('num-sections').value);
    let total = 0;
    for (let i = 1; i <= numSections; i++) {
        const sel = document.getElementById(`section-${i}-guns`);
        if (sel) total += parseInt(sel.value);
    }
    return total;
}

function getGunConfiguration() {
    const numSections = parseInt(document.getElementById('num-sections').value);
    const config = [];
    for (let i = 1; i <= numSections; i++) {
        const sel = document.getElementById(`section-${i}-guns`);
        if (sel) config.push({ section: i, guns: parseInt(sel.value) });
    }
    return config;
}

function validateSectionSelection(missionType) {
    if (getSelectedSections(missionType).length === 0) {
        showAlertModal('Section Selection Required', 'Please select at least one section to fire.');
        return false;
    }
    return true;
}

/**
 * Flatten the selected sections into a per-section span of global gun
 * indices. Each entry: { section, guns, startIndex, endIndex }.
 */
function buildSectionGunSpans(missionType) {
    const selected = getSelectedSections(missionType);
    const config = getGunConfiguration();
    const spans = [];
    let totalGuns = 0;
    let gunStart = 1;

    for (const cfg of config) {
        if (!selected.includes(cfg.section)) continue;
        spans.push({
            section: cfg.section,
            guns: cfg.guns,
            startIndex: gunStart,
            endIndex: gunStart + cfg.guns - 1
        });
        totalGuns += cfg.guns;
        gunStart += cfg.guns;
    }
    return { spans, totalGuns };
}

// ============================================================================
// Mortar coordinates (dynamically created per-section / per-gun inputs)
// ============================================================================

function updateMortarCoordinates() {
    const gunConfig = getGunConfiguration();
    const container = document.getElementById('mortar-coordinates-container');
    const totalGunsDisplay = document.getElementById('total-guns-display');

    container.innerHTML = '';
    totalGunsDisplay.textContent = getTotalGuns();

    gunConfig.forEach(cfg => {
        const header = document.createElement('div');
        header.className = 'section-header';
        header.textContent = `Section ${cfg.section} Mortar Coordinates`;
        container.appendChild(header);

        for (let gunIndex = 1; gunIndex <= cfg.guns; gunIndex++) {
            const group = document.createElement('div');
            group.className = 'input-group';

            const row = document.createElement('div');
            row.className = 'input-row';
            row.innerHTML = `
                <label>Gun ${gunIndex} X:</label>
                <input type="number" id="section-${cfg.section}-gun-${gunIndex}-x" placeholder="X coordinate" />
                <label>Gun ${gunIndex} Y:</label>
                <input type="number" id="section-${cfg.section}-gun-${gunIndex}-y" placeholder="Y coordinate" />
            `;
            group.appendChild(row);
            container.appendChild(group);
        }
    });

    setTimeout(loadMortarCoordinates, 10);
}

function loadMortarCoordinates() {
    const gunConfig = getGunConfiguration();

    gunConfig.forEach(cfg => {
        for (let gunIndex = 1; gunIndex <= cfg.guns; gunIndex++) {
            const xInput = document.getElementById(`section-${cfg.section}-gun-${gunIndex}-x`);
            const yInput = document.getElementById(`section-${cfg.section}-gun-${gunIndex}-y`);
            if (!xInput || !yInput) continue;

            const savedX = localStorage.getItem(`section-${cfg.section}-gun-${gunIndex}-x`);
            const savedY = localStorage.getItem(`section-${cfg.section}-gun-${gunIndex}-y`);
            if (savedX) xInput.value = savedX;
            if (savedY) yInput.value = savedY;

            [xInput, yInput].forEach(input => {
                input.addEventListener('change', saveAllData);
                input.addEventListener('input', saveAllData);
                input.addEventListener('input', function () {
                    this.value = sanitiseSignedInt4(this.value);

                    const match = this.id.match(/section-(\d+)-gun-(\d+)-[xy]/);
                    if (match) {
                        const sectionNum = parseInt(match[1]);
                        setTimeout(() => {
                            ['grid', 'polar', 'shift'].forEach(mt =>
                                updateSectionRingsOptions(sectionNum, mt)
                            );
                        }, 100);
                    }
                });
            });
        }
    });
}

/** Trim mortar-coord input to a signed 4-digit integer. */
function sanitiseSignedInt4(raw) {
    let value = raw.replace(/[^\d-]/g, '');
    if (value.startsWith('-')) {
        value = '-' + value.substring(1).replace(/-/g, '');
        if (value.length > 5) value = value.substring(0, 5);
    } else {
        value = value.replace(/-/g, '');
        if (value.length > 4) value = value.substring(0, 4);
    }
    return value;
}

function getMortarCoordinatesBySection(sectionIndex, gunIndexInSection) {
    const xInput = document.getElementById(`section-${sectionIndex}-gun-${gunIndexInSection}-x`);
    const yInput = document.getElementById(`section-${sectionIndex}-gun-${gunIndexInSection}-y`);
    if (xInput && yInput) {
        return {
            x: parseFloat(xInput.value) || 0,
            y: parseFloat(yInput.value) || 0
        };
    }
    return { x: 0, y: 0 };
}

/** Look up gun coordinates by global gun index (1..totalGuns across all sections). */
function getMortarCoordinates(gunNumber) {
    const gunConfig = getGunConfiguration();
    let cursor = 0;
    for (const cfg of gunConfig) {
        for (let g = 1; g <= cfg.guns; g++) {
            cursor++;
            if (cursor === gunNumber) {
                return getMortarCoordinatesBySection(cfg.section, g);
            }
        }
    }
    return { x: 0, y: 0 };
}

function getSectionAltitude(sectionIndex) {
    const input = document.getElementById(`section-${sectionIndex}-alt`);
    return input ? (parseFloat(input.value) || 0) : 0;
}

function getSectionForGun(gunNumber) {
    const gunConfig = getGunConfiguration();
    let cursor = 0;
    for (const cfg of gunConfig) {
        cursor += cfg.guns;
        if (gunNumber <= cursor) return cfg.section;
    }
    return 1;
}

// ============================================================================
// Target coordinate resolution per mission type
// ============================================================================

function calculateFinalTargetCoordinates(missionType) {
    if (missionType === 'grid') {
        const x = parseFloat(document.getElementById('target-x').value);
        const y = parseFloat(document.getElementById('target-y').value);
        if (isNaN(x) || isNaN(y)) return null;
        return { x: x, y: y };
    }

    if (missionType === 'polar') {
        const foX = parseFloat(document.getElementById('fo-x-polar').value);
        const foY = parseFloat(document.getElementById('fo-y-polar').value);
        const foDist = parseFloat(document.getElementById('fo-dist-polar').value);
        const foDirDeg = parseFloat(document.getElementById('fo-dir-polar').value) || 0;
        if (!foX || !foY || !foDist) return null;

        const foDirRad = foDirDeg * Math.PI / 180;
        const scaledFoDist = foDist / 10;
        return {
            x: foX + scaledFoDist * Math.sin(foDirRad),
            y: foY + scaledFoDist * Math.cos(foDirRad)
        };
    }

    if (missionType === 'shift') {
        const selectedPointId = document.getElementById('known-point-select').value;
        const shiftX = parseFloat(document.getElementById('shift-x').value) || 0;
        const shiftY = parseFloat(document.getElementById('shift-y').value) || 0;
        if (!selectedPointId) return null;

        const knownPoints = JSON.parse(localStorage.getItem('knownPoints') || '[]');
        const point = knownPoints.find(p => p.id === selectedPointId);
        if (!point) return null;

        return {
            x: parseFloat(point.x) + shiftX / 10,
            y: parseFloat(point.y) + shiftY / 10
        };
    }

    return null;
}

// ============================================================================
// Ring auto-selector (replaces updateSectionRingsOptions{Grid,Polar,Shift})
// ============================================================================

/**
 * Rebuild the rings dropdown for one section/mission, auto-selecting the
 * smallest ring count that can reach the current target. The selected option
 * gets a trailing "!" as a visual hint.
 */
function updateSectionRingsOptions(sectionNumber, missionType) {
    const shellSelect = document.getElementById(`section-${sectionNumber}-shell-${missionType}`);
    const ringsSelect = document.getElementById(`section-${sectionNumber}-rings-${missionType}`);
    if (!shellSelect || !ringsSelect) return;

    const shell = shellSelect.value;
    const previousValue = ringsSelect.value;
    ringsSelect.innerHTML = '';

    const ringOptions = Settings.getAvailableRings(missionType, shell);
    // Fallback for placeholder platforms with no data: keep old 0..4 / 1..4 lists.
    const options = ringOptions.length
        ? ringOptions
        : ((shell === 'SMOKE' || shell === 'ILUM') ? [1, 2, 3, 4] : [0, 1, 2, 3, 4]);

    const targetCoords = calculateFinalTargetCoordinates(missionType);
    const mortarCoords = pickBaseGunForSection(sectionNumber);
    const crestElev = getCrestValue(missionType);
    const sectionAlt = getSectionAltitude(sectionNumber);

    let autoRing = null;
    let rangeCheck = null;
    let crestWarning = null;

    if (targetCoords && mortarCoords && mortarCoords.x && mortarCoords.y) {
        const range = calculateRange(mortarCoords.x, mortarCoords.y, targetCoords.x, targetCoords.y);
        rangeCheck = checkTargetRange(range, shell, missionType);
        if (rangeCheck.inRange) {
            autoRing = getMinimumRingsForRange(range, shell, missionType, crestElev, sectionAlt);

            // If the user has a manual ring selection that doesn't clear the
            // crest, surface a warning (no auto-override of their pick).
            if (crestElev !== null && previousValue !== null && previousValue !== undefined) {
                const userRing = parseInt(previousValue, 10);
                const userTable = Settings.getShellTable(missionType, shell, userRing);
                if (userTable
                    && range >= userTable[0][0]
                    && range <= userTable[userTable.length - 1][0]
                    && !trajectoryClearsCrest(userTable, range, sectionAlt, crestElev)) {
                    crestWarning = `Ring ${userRing} may not clear ${crestElev}m crest`;
                }
            }
        }
    }

    options.forEach(r => {
        const opt = document.createElement('option');
        opt.value = r;
        if (autoRing !== null && r === autoRing) {
            opt.textContent = `${r} !`;
            opt.selected = true;
        } else {
            opt.textContent = r;
        }
        ringsSelect.appendChild(opt);
    });

    // Preserve the user's selection if it's still valid and no auto-ring was picked.
    if (autoRing === null && previousValue && options.map(String).includes(String(previousValue))) {
        ringsSelect.value = previousValue;
    }

    // Quiet visual hint: amber border + small message under the rings select.
    // Range failure takes precedence over crest failure.
    if (rangeCheck && !rangeCheck.inRange) {
        setFieldWarning(ringsSelect.id, rangeCheck.reason);
    } else if (crestWarning) {
        setFieldWarning(ringsSelect.id, crestWarning);
    } else {
        clearFieldWarning(ringsSelect.id);
    }
}

/** Read the crest-clearance input for the given mission, or null if blank/invalid. */
function getCrestValue(missionType) {
    const el = document.getElementById(`crest-${missionType}`);
    if (!el) return null;
    const v = parseFloat(el.value);
    return isFinite(v) ? v : null;
}

/**
 * Pick the gun whose coordinates feed the per-section range check —
 * gun 2 in the section if it has 2+ guns, otherwise gun 1.
 */
function pickBaseGunForSection(sectionNumber) {
    const gunsSel = document.getElementById(`section-${sectionNumber}-guns`);
    if (!gunsSel) return null;
    const sectionGuns = parseInt(gunsSel.value);
    const gunIndex = sectionGuns >= 2 ? 2 : 1;
    return getMortarCoordinatesBySection(sectionNumber, gunIndex);
}

// Backward-compat shims for inline HTML handlers that still reference the
// mission-typed function names (calls from index.html and reset paths).
function updateSectionRingsOptionsGrid(n)  { updateSectionRingsOptions(n, 'grid'); }
function updateSectionRingsOptionsPolar(n) { updateSectionRingsOptions(n, 'polar'); }
function updateSectionRingsOptionsShift(n) { updateSectionRingsOptions(n, 'shift'); }

/** Trigger ring auto-selection across every section for a mission. */
function triggerRingUpdatesForCalculation(missionType) {
    const numSections = parseInt(document.getElementById('num-sections').value) || 1;
    for (let i = 1; i <= numSections; i++) {
        updateSectionRingsOptions(i, missionType);
    }
}
