/**
 * Mortar Ballistics Calculator - Mission Orchestration
 *
 * Copyright (c) 2024 C-gamer_DX. All rights reserved.
 *
 * The single `calculateMission(missionType)` entry point replaces what used
 * to be three near-identical functions (calculateGridMissionParallelSheaf,
 * calculatePolarMissionParallelSheaf, calculateShiftMission). Mission-typed
 * shims are exported at the bottom for inline HTML handlers.
 *
 * This file also owns: validation, mission-data extraction (used by MTO and
 * logging), result rendering, per-mission reset, MTO and NFA-warning modals.
 */

// ============================================================================
// Per-mission field & output ID tables
// ============================================================================

const MISSION_INPUTS = {
    grid: {
        targetNumber: 'target-number-grid',
        amountRounds: 'amount-rounds-grid',
        targetAlt: 'target-alt',
        foDir: 'fo-dir',
        addDrop: 'add-drop',
        leftRight: 'left-right',
        sheafType: 'sheaf-type-grid',
        sheafLength: 'sheaf-length',
        sheafDirection: 'sheaf-direction',
        sheafDiameter: 'sheaf-diameter'
    },
    polar: {
        targetNumber: 'target-number-polar',
        amountRounds: 'amount-rounds-polar',
        targetAlt: 'target-alt-polar',
        foDir: 'fo-dir-polar',
        addDrop: 'add-drop-polar',
        leftRight: 'left-right-polar',
        sheafType: 'sheaf-type-polar',
        sheafLength: 'sheaf-length-polar',
        sheafDirection: 'sheaf-direction-polar',
        sheafDiameter: 'sheaf-diameter-polar'
    },
    shift: {
        targetNumber: 'target-number-shift',
        amountRounds: 'amount-rounds-shift',
        targetAlt: 'target-alt-shift',
        foDir: 'fo-dir-shift',
        addDrop: 'add-drop-shift',
        leftRight: 'left-right-shift',
        sheafType: 'sheaf-type-shift',
        sheafLength: 'sheaf-length-shift',
        sheafDirection: 'sheaf-direction-shift',
        sheafDiameter: 'sheaf-diameter-shift'
    }
};

const MISSION_OUTPUTS = {
    grid: {
        range: 'range-grid',
        azimuth: 'azimuth', elevation: 'elevation', tof: 'tof',
        azimuthCorr: 'azimuth-corr', elevationCorr: 'elevation-corr', tofCorr: 'tof-corr',
        baseResults: 'base-results-grid',
        correctedResults: 'corrected-results-grid',
        sectionSolutions: 'section-solutions-grid',
        gunSolutions: 'fire-solution-guns-grid',
        gunSolutionsContent: 'gun-solutions-content-grid'
    },
    polar: {
        range: 'range-polar',
        azimuth: 'azimuth-polar', elevation: 'elevation-polar', tof: 'tof-polar',
        azimuthCorr: 'azimuth-corr-polar', elevationCorr: 'elevation-corr-polar', tofCorr: 'tof-corr-polar',
        baseResults: 'base-results-polar',
        correctedResults: 'corrected-results-polar',
        sectionSolutions: 'section-solutions-polar',
        gunSolutions: 'fire-solution-guns-polar',
        gunSolutionsContent: 'gun-solutions-content-polar'
    },
    shift: {
        range: 'range-shift',
        azimuth: 'azimuth-shift', elevation: 'elevation-shift', tof: 'tof-shift',
        azimuthCorr: 'azimuth-corr-shift', elevationCorr: 'elevation-corr-shift', tofCorr: 'tof-corr-shift',
        baseResults: 'base-results-shift',
        correctedResults: 'corrected-results-shift',
        sectionSolutions: 'section-solutions-shift',
        gunSolutions: 'fire-solution-guns-shift',
        gunSolutionsContent: 'gun-solutions-content-shift'
    }
};

/**
 * Per mission × sheaf type, how should ADD/DROP + LEFT/RIGHT corrections be
 * applied?
 *   'pre'  – apply to target coords first, pass 0 to ballistics, display the
 *            corrected coord in the per-gun output.
 *   'pass' – pass the raw target + corrections to ballistics, display the
 *            uncorrected coord in the per-gun output.
 *
 * The math result is identical between modes (calculateSingleGunBallistics
 * applies the same shift internally). The only observable difference is the
 * "Target: (x, y)" line in the per-gun text output. These exact behaviours
 * are preserved from the original mission-typed functions.
 */
const SHEAF_CORRECTION_MODE = {
    grid:  { parallel: 'pre',  linear: 'pre',  circular: 'pre',  converged: 'pre',  open: 'pre' },
    polar: { parallel: 'pre',  linear: 'pass', circular: 'pass', converged: 'pass', open: 'pre' },
    shift: { parallel: 'pre',  linear: 'pass', circular: 'pass', converged: 'pre',  open: 'pre' }
};

// ============================================================================
// Main mission orchestrator
// ============================================================================

function calculateMission(missionType, bypassNFA = false) {
    triggerRingUpdatesForCalculation(missionType);

    const validation = validateMissionFields(missionType);
    if (validation.errors.length) {
        showAlertModal('Validation Error', 'Please fix the following errors:\n\n' + validation.errors.join('\n'));
        return;
    }

    const inputs = MISSION_INPUTS[missionType];
    const outputs = MISSION_OUTPUTS[missionType];

    const targetCoords = calculateFinalTargetCoordinates(missionType);
    if (!targetCoords) return;
    const { x: targetX, y: targetY } = targetCoords;
    const targetAlt = resolveTargetAltitude(missionType);

    if (!bypassNFA) {
        const nfaCheck = checkNFAViolation(targetX, targetY);
        if (nfaCheck.violated) {
            showNFAWarningModal(nfaCheck, missionType);
            return;
        }
    }

    const sheafType = document.getElementById(inputs.sheafType).value;
    const foDirDeg = parseFloat(document.getElementById(inputs.foDir).value) || 0;
    const addDrop = parseFloat(document.getElementById(inputs.addDrop).value) || 0;
    const leftRight = parseFloat(document.getElementById(inputs.leftRight).value) || 0;

    const { spans, totalGuns } = buildSectionGunSpans(missionType);
    if (totalGuns === 0) return;

    // Independent base solution per selected section — each uses its own
    // reference gun's coordinates, altitude, shell and ring count. This is
    // what lets two sections at different map locations fire on the same
    // target with their own (correct) azimuth/elevation.
    const sectionResult = computeSectionBaseSolutions(
        missionType, targetX, targetY, targetAlt, addDrop, leftRight, foDirDeg
    );
    if (sectionResult.error) {
        alert(sectionResult.error);
        return;
    }
    if (!sectionResult.sections.length) {
        alert('No valid section solutions could be computed.');
        return;
    }

    // 1 section → render the familiar single Base/Corrected boxes.
    // 2+ sections → hide single boxes, render per-section cards instead.
    renderMissionSolutions(missionType, sectionResult.sections);

    const gunSolutions = computeGunSolutions(
        missionType, sheafType, spans, totalGuns,
        targetX, targetY, targetAlt, addDrop, leftRight, foDirDeg,
        sectionResult.sections
    );
    if (gunSolutions === null) return;  // an error alert was already shown

    displayGunSolutions(gunSolutions, outputs.gunSolutionsContent);
    document.getElementById(outputs.gunSolutions).style.display = 'block';
}

/**
 * Compute one base + corrected firing solution per selected section.
 * Each section picks its own reference gun (gun 2 if the section has 2+
 * guns, otherwise gun 1) and uses the section's own altitude, shell and
 * ring count.
 *
 * @returns {{error?: string, sections?: Array<{
 *   section: number, range: number, shell: string, rings: number,
 *   referenceGun: number, solution: object
 * }>}}
 */
function computeSectionBaseSolutions(missionType, targetX, targetY, targetAlt, addDrop, leftRight, foDirDeg) {
    const selected = getSelectedSections(missionType);
    const out = [];

    for (const sectionNum of selected) {
        const gunsSel = document.getElementById(`section-${sectionNum}-guns`);
        const sectionGunCount = gunsSel ? parseInt(gunsSel.value) : 1;
        const referenceGun = sectionGunCount >= 2 ? 2 : 1;

        const mortarCoords = getMortarCoordinatesBySection(sectionNum, referenceGun);
        if (!mortarCoords.x || !mortarCoords.y) {
            return { error: `Section ${sectionNum}: please enter coordinates for Gun ${referenceGun}.` };
        }

        const sectionAlt = getSectionAltitude(sectionNum);
        const shell = document.getElementById(`section-${sectionNum}-shell-${missionType}`).value;
        const rings = parseInt(document.getElementById(`section-${sectionNum}-rings-${missionType}`).value);

        const range = calculateRange(mortarCoords.x, mortarCoords.y, targetX, targetY);
        const rangeCheck = checkTargetRange(range, shell, missionType);
        if (!rangeCheck.inRange) {
            return { error: `Section ${sectionNum}: ${rangeCheck.reason}.` };
        }

        const solution = calculateSingleGunBallistics(
            mortarCoords.x, mortarCoords.y, targetX, targetY,
            sectionAlt, targetAlt, shell, rings,
            addDrop, leftRight, foDirDeg, missionType
        );
        if (!solution) {
            return { error: `Section ${sectionNum}: firing table not available for ${shell} / ${rings} rings.` };
        }

        out.push({
            section: sectionNum,
            range: range,
            shell: shell,
            rings: rings,
            referenceGun: referenceGun,
            solution: solution
        });
    }

    return { sections: out };
}

/**
 * Pick the right result panel(s) to render. Single section → the legacy
 * Base/Corrected boxes; multiple sections → one card per section.
 */
function renderMissionSolutions(missionType, sectionSolutions) {
    const outputs = MISSION_OUTPUTS[missionType];
    const baseBox = document.getElementById(outputs.baseResults);
    const corrBox = document.getElementById(outputs.correctedResults);
    const sectionContainer = document.getElementById(outputs.sectionSolutions);

    if (sectionSolutions.length === 1) {
        const only = sectionSolutions[0];
        displayBaseResults(missionType, only.range, only.solution);
        if (sectionContainer) {
            sectionContainer.style.display = 'none';
            sectionContainer.innerHTML = '';
        }
        return;
    }

    // Multiple sections: hide the single boxes and render per-section cards.
    if (baseBox) baseBox.style.display = 'none';
    if (corrBox) corrBox.style.display = 'none';
    if (!sectionContainer) return;

    sectionContainer.innerHTML = renderSectionSolutionsHTML(sectionSolutions);
    sectionContainer.style.display = 'block';
}

function renderSectionSolutionsHTML(sectionSolutions) {
    const cards = sectionSolutions.map(({ section, range, shell, rings, referenceGun, solution }) => `
        <div class="section-solution-card">
            <div class="section-solution-header">
                <span class="section-solution-title">Section ${section}</span>
                <span class="section-solution-meta">${shell} • ${rings} rings • ref. gun ${referenceGun}</span>
            </div>
            <div class="section-solution-grid">
                <div class="section-solution-block">
                    <div class="section-solution-subhead">Base</div>
                    <div class="result-item"><span class="result-label">Range:</span> <span class="result-value">${Math.round(range)}</span> m</div>
                    <div class="result-item"><span class="result-label">Azimuth:</span> <span class="result-value">${Math.round(solution.azimuth)}</span> mils</div>
                    <div class="result-item"><span class="result-label">Elevation:</span> <span class="result-value">${Math.round(solution.elevation)}</span> mils</div>
                    <div class="result-item"><span class="result-label">TOF:</span> <span class="result-value">${solution.tof.toFixed(1)}</span> sec</div>
                </div>
                <div class="section-solution-block">
                    <div class="section-solution-subhead">Corrected</div>
                    <div class="result-item"><span class="result-label">Azimuth:</span> <span class="result-value">${Math.round(solution.azimuthCorr)}</span> mils</div>
                    <div class="result-item"><span class="result-label">Elevation:</span> <span class="result-value">${Math.round(solution.elevationCorr)}</span> mils</div>
                    <div class="result-item"><span class="result-label">TOF:</span> <span class="result-value">${solution.tofCorr.toFixed(1)}</span> sec</div>
                </div>
            </div>
        </div>
    `).join('');

    return `<h3>Fire Solution per Section</h3>${cards}`;
}

function resolveTargetAltitude(missionType) {
    const inputs = MISSION_INPUTS[missionType];
    const raw = parseFloat(document.getElementById(inputs.targetAlt).value);
    if (!isNaN(raw)) return raw;

    // Shift falls back to the known point's altitude when the field is blank.
    if (missionType === 'shift') {
        const id = document.getElementById('known-point-select').value;
        if (!id) return 0;
        const knownPoints = JSON.parse(localStorage.getItem('knownPoints') || '[]');
        const point = knownPoints.find(p => p.id === id);
        return point ? (point.altitude || 0) : 0;
    }
    return 0;
}

function displayBaseResults(missionType, range, sol) {
    const o = MISSION_OUTPUTS[missionType];
    document.getElementById(o.range).textContent = Math.round(range);
    document.getElementById(o.azimuth).textContent = Math.round(sol.azimuth);
    document.getElementById(o.elevation).textContent = Math.round(sol.elevation);
    document.getElementById(o.tof).textContent = sol.tof.toFixed(1);
    document.getElementById(o.azimuthCorr).textContent = Math.round(sol.azimuthCorr);
    document.getElementById(o.elevationCorr).textContent = Math.round(sol.elevationCorr);
    document.getElementById(o.tofCorr).textContent = sol.tofCorr.toFixed(1);
    document.getElementById(o.baseResults).style.display = 'block';
    document.getElementById(o.correctedResults).style.display = 'block';
    // Re-show in case a previous multi-section run hid them.
    const sectionContainer = document.getElementById(o.sectionSolutions);
    if (sectionContainer) {
        sectionContainer.style.display = 'none';
        sectionContainer.innerHTML = '';
    }
}

// ============================================================================
// Per-gun sheaf solving
// ============================================================================

function computeGunSolutions(
    missionType, sheafType, spans, totalGuns,
    targetX, targetY, targetAlt, addDrop, leftRight, foDirDeg,
    sectionSolutions
) {
    const correctionMode = SHEAF_CORRECTION_MODE[missionType][sheafType];

    if (sheafType === 'parallel') {
        return computeParallelSheaf(spans, sectionSolutions, targetX, targetY, addDrop, leftRight, foDirDeg);
    }

    if (sheafType === 'linear') {
        const inputs = MISSION_INPUTS[missionType];
        const sheafLength = parseFloat(document.getElementById(inputs.sheafLength).value);
        const sheafDirection = parseFloat(document.getElementById(inputs.sheafDirection).value);
        if (!sheafLength || sheafDirection === null || sheafDirection === undefined || isNaN(sheafDirection)) {
            alert('Please enter sheaf length and direction for linear sheaf');
            return null;
        }
        const targets = calculateLinearSheafTargets(targetX, targetY, sheafLength / 10, sheafDirection, totalGuns);
        return computePerGunSheaf(missionType, spans, targets, targetAlt, addDrop, leftRight, foDirDeg, correctionMode);
    }

    if (sheafType === 'circular') {
        const inputs = MISSION_INPUTS[missionType];
        const sheafDiameter = parseFloat(document.getElementById(inputs.sheafDiameter).value);
        if (!sheafDiameter || sheafDiameter <= 0) {
            alert('Please enter a valid sheaf diameter for circular sheaf');
            return null;
        }
        const targets = calculateCircularSheafTargets(targetX, targetY, sheafDiameter / 10, totalGuns);
        return computePerGunSheaf(missionType, spans, targets, targetAlt, addDrop, leftRight, foDirDeg, correctionMode);
    }

    if (sheafType === 'converged') {
        const targets = calculateConvergedSheafTargets(targetX, targetY, totalGuns);
        return computePerGunSheaf(missionType, spans, targets, targetAlt, addDrop, leftRight, foDirDeg, correctionMode);
    }

    if (sheafType === 'open') {
        return computeOpenSheaf(missionType, spans, targetX, targetY, targetAlt, addDrop, leftRight, foDirDeg);
    }

    return [];
}

/**
 * Parallel sheaf: every gun in a section uses that section's reference-gun
 * base solution (gun 2 if present, else gun 1). The displayed target is the
 * single shifted target. This is the doctrinal point of a parallel sheaf —
 * all barrels in a section laid at the same azimuth/elevation.
 *
 * Per-section bases are computed independently (see computeSectionBaseSolutions)
 * so two sections at different map locations get their own correct laying.
 */
function computeParallelSheaf(spans, sectionSolutions, targetX, targetY, addDrop, leftRight, foDirDeg) {
    const corr = applyShiftCorrection(targetX, targetY, addDrop, leftRight, foDirDeg);
    const bySection = {};
    sectionSolutions.forEach(s => { bySection[s.section] = s.solution; });

    const out = [];
    for (const span of spans) {
        const base = bySection[span.section];
        if (!base) continue;
        for (let i = span.startIndex; i <= span.endIndex; i++) {
            out.push({
                gun: i - span.startIndex + 1,
                section: span.section,
                azimuth: base.azimuthCorr,
                elevation: base.elevationCorr,
                tof: base.tofCorr,
                targetX: corr.x,
                targetY: corr.y
            });
        }
    }
    return out;
}

function computePerGunSheaf(missionType, spans, targets, targetAlt, addDrop, leftRight, foDirDeg, correctionMode) {
    const out = [];
    let idx = 0;

    for (const span of spans) {
        for (let i = span.startIndex; i <= span.endIndex; i++) {
            const gunCoords = getMortarCoordinates(i);
            if (!gunCoords.x || !gunCoords.y) {
                alert(`Please enter coordinates for Gun ${i}`);
                return null;
            }
            const t = targets[idx];

            const gunSection = getSectionForGun(i);
            const gunSectionAlt = getSectionAltitude(gunSection);
            const gunSectionShell = document.getElementById(`section-${gunSection}-shell-${missionType}`).value;
            const gunSectionRings = parseInt(document.getElementById(`section-${gunSection}-rings-${missionType}`).value);

            let solveX, solveY, displayX, displayY, balAddDrop, balLeftRight;
            if (correctionMode === 'pre') {
                const c = applyShiftCorrection(t.x, t.y, addDrop, leftRight, foDirDeg);
                solveX = c.x; solveY = c.y;
                displayX = c.x; displayY = c.y;
                balAddDrop = 0; balLeftRight = 0;
            } else {
                solveX = t.x; solveY = t.y;
                displayX = t.x; displayY = t.y;
                balAddDrop = addDrop; balLeftRight = leftRight;
            }

            const sol = calculateSingleGunBallistics(
                gunCoords.x, gunCoords.y, solveX, solveY,
                gunSectionAlt, targetAlt,
                gunSectionShell, gunSectionRings,
                balAddDrop, balLeftRight, foDirDeg,
                missionType
            );
            if (sol) {
                out.push({
                    gun: i - span.startIndex + 1,
                    section: span.section,
                    azimuth: sol.azimuthCorr,
                    elevation: sol.elevationCorr,
                    tof: sol.tofCorr,
                    targetX: displayX,
                    targetY: displayY
                });
            }
            idx++;
        }
    }
    return out;
}

function computeOpenSheaf(missionType, spans, targetX, targetY, targetAlt, addDrop, leftRight, foDirDeg) {
    const allBox = document.getElementById(`all-sections-${missionType}`);
    const useGlobal = allBox && allBox.checked;
    const out = [];
    let globalIdx = 0;

    for (const span of spans) {
        for (let i = span.startIndex; i <= span.endIndex; i++) {
            const gunCoords = getMortarCoordinates(i);
            if (!gunCoords.x || !gunCoords.y) {
                alert(`Please enter coordinates for Gun ${i}`);
                return null;
            }

            // Position 1..4: global cycle when all sections are checked, otherwise section-relative.
            let gunPosition = useGlobal
                ? (globalIdx % 4) + 1
                : ((i - span.startIndex + 1) % 4) || 4;

            const [dx, dy] = openSheafOffsetForPosition(gunPosition);
            const offsetTarget = applyShiftCorrection(targetX + dx, targetY + dy, addDrop, leftRight, foDirDeg);

            const gunSection = getSectionForGun(i);
            const gunSectionAlt = getSectionAltitude(gunSection);
            const gunSectionShell = document.getElementById(`section-${gunSection}-shell-${missionType}`).value;
            const gunSectionRings = parseInt(document.getElementById(`section-${gunSection}-rings-${missionType}`).value);

            const sol = calculateSingleGunBallistics(
                gunCoords.x, gunCoords.y, offsetTarget.x, offsetTarget.y,
                gunSectionAlt, targetAlt,
                gunSectionShell, gunSectionRings,
                0, 0, foDirDeg,
                missionType
            );
            if (sol) {
                out.push({
                    gun: i - span.startIndex + 1,
                    section: span.section,
                    azimuth: sol.azimuthCorr,
                    elevation: sol.elevationCorr,
                    tof: sol.tofCorr,
                    targetX: offsetTarget.x,
                    targetY: offsetTarget.y
                });
            }
            globalIdx++;
        }
    }
    return out;
}

// ============================================================================
// Rendering per-gun solutions (text grouped by section)
// ============================================================================

function displayGunSolutions(solutions, containerId) {
    const container = document.getElementById(containerId);
    if (!solutions || solutions.length === 0) {
        container.textContent = 'No solutions available';
        return;
    }

    const bySection = {};
    solutions.forEach(s => {
        (bySection[s.section] = bySection[s.section] || []).push(s);
    });

    let output = '';
    Object.keys(bySection).sort().forEach(sec => {
        output += `Section ${sec}:\n`;
        bySection[sec].forEach(sol => {
            output += `  Gun ${sol.gun}:\n`;
            output += `    Azimuth: ${Math.round(sol.azimuth)} mils\n`;
            output += `    Elevation: ${Math.round(sol.elevation)} mils\n`;
            output += `    TOF: ${sol.tof.toFixed(1)} sec\n`;
            if (sol.targetX !== undefined && sol.targetY !== undefined) {
                output += `    Target: (${sol.targetX.toFixed(1)}, ${sol.targetY.toFixed(1)})\n`;
            }
            output += '\n';
        });
    });
    container.textContent = output;
}

// ============================================================================
// Validation
// ============================================================================

function validateMissionFields(missionType) {
    const errors = [];
    const warnings = [];
    const inputs = MISSION_INPUTS[missionType];

    const targetNumber = document.getElementById(inputs.targetNumber).value;
    if (!targetNumber.trim()) errors.push('Please enter a target number');

    const amountRounds = parseInt(document.getElementById(inputs.amountRounds).value);
    if (isNaN(amountRounds) || amountRounds <= 0) errors.push('Please enter a valid amount of rounds');

    const selectedSections = getSelectedSections(missionType);
    if (selectedSections.length === 0) errors.push('Please select at least one section');

    if (missionType === 'grid') {
        const x = parseFloat(document.getElementById('target-x').value);
        const y = parseFloat(document.getElementById('target-y').value);
        if (isNaN(x) || isNaN(y)) errors.push('Please enter valid target coordinates (X and Y)');
    } else if (missionType === 'polar') {
        const foX = parseFloat(document.getElementById('fo-x-polar').value);
        const foY = parseFloat(document.getElementById('fo-y-polar').value);
        const foDist = parseFloat(document.getElementById('fo-dist-polar').value);
        const foDir = parseFloat(document.getElementById('fo-dir-polar').value);
        if (isNaN(foX) || isNaN(foY)) errors.push('Please enter valid FO coordinates (X and Y)');
        if (isNaN(foDist) || foDist <= 0) errors.push('Please enter a valid distance');
        if (isNaN(foDir)) errors.push('Please enter a valid direction');
    } else if (missionType === 'shift') {
        if (!document.getElementById('known-point-select').value) {
            errors.push('Please select a known point');
        }
        const sx = parseFloat(document.getElementById('shift-x').value);
        const sy = parseFloat(document.getElementById('shift-y').value);
        if (isNaN(sx) || isNaN(sy)) errors.push('Please enter valid shift values (X and Y)');
    }

    // Mortar coord coverage for the selected sections.
    const totalGuns = getGunConfiguration()
        .filter(c => selectedSections.includes(c.section))
        .reduce((sum, c) => sum + c.guns, 0);
    for (let i = 1; i <= totalGuns; i++) {
        const c = getMortarCoordinates(i);
        if (!c.x || !c.y) {
            errors.push(`Please enter coordinates for Gun ${i}`);
            break;
        }
    }

    return { errors, warnings };
}

// ============================================================================
// Mission data extraction (used by MTO + logging)
// ============================================================================

function getMissionData(missionType) {
    const selectedSections = getSelectedSections(missionType);
    const totalGuns = getGunConfiguration()
        .filter(c => selectedSections.includes(c.section))
        .reduce((sum, c) => sum + c.guns, 0);

    const inputs = MISSION_INPUTS[missionType];
    const outputs = MISSION_OUTPUTS[missionType];

    const md = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        missionType: missionType,
        numGuns: totalGuns,
        targetNumber: document.getElementById(inputs.targetNumber).value,
        amountRounds: parseInt(document.getElementById(inputs.amountRounds).value),
        targetAltitude: parseFloat(document.getElementById(inputs.targetAlt).value) || 0,
        sectionData: {}
    };

    selectedSections.forEach(s => {
        const shellEl = document.getElementById(`section-${s}-shell-${missionType}`);
        const ringsEl = document.getElementById(`section-${s}-rings-${missionType}`);
        md.sectionData[s] = {
            shell: shellEl ? shellEl.value : 'HE',
            rings: ringsEl ? parseInt(ringsEl.value) : 0
        };
    });

    if (missionType === 'grid') {
        md.targetX = parseFloat(document.getElementById('target-x').value);
        md.targetY = parseFloat(document.getElementById('target-y').value);
    } else if (missionType === 'polar') {
        const foX = parseFloat(document.getElementById('fo-x-polar').value);
        const foY = parseFloat(document.getElementById('fo-y-polar').value);
        const foDist = parseFloat(document.getElementById('fo-dist-polar').value);
        const foDirDeg = parseFloat(document.getElementById('fo-dir-polar').value) || 0;
        if (foX && foY && foDist) {
            const foDirRad = foDirDeg * Math.PI / 180;
            const scaledFoDist = foDist / 10;
            md.targetX = foX + scaledFoDist * Math.sin(foDirRad);
            md.targetY = foY + scaledFoDist * Math.cos(foDirRad);
        }
    } else if (missionType === 'shift') {
        const id = document.getElementById('known-point-select').value;
        const knownPoints = JSON.parse(localStorage.getItem('knownPoints') || '[]');
        const point = knownPoints.find(p => p.id === id);
        if (!point) return null;
        const sx = parseFloat(document.getElementById('shift-x').value) || 0;
        const sy = parseFloat(document.getElementById('shift-y').value) || 0;
        md.targetX = point.x + sx / 10;
        md.targetY = point.y + sy / 10;
        md.targetAltitude = parseFloat(document.getElementById('target-alt-shift').value) || point.altitude;
        md.knownPointId = id;
        md.shiftX = sx;
        md.shiftY = sy;
    }

    // Base solution from on-screen text
    const az  = document.getElementById(outputs.azimuth).textContent;
    const el  = document.getElementById(outputs.elevation).textContent;
    const tof = document.getElementById(outputs.tof).textContent;
    if (az !== '-' && el !== '-' && tof !== '-') {
        md.baseSolution = { azimuth: parseFloat(az), elevation: parseFloat(el), tof: parseFloat(tof) };
        md.tof = parseFloat(tof);
    }

    const azC  = document.getElementById(outputs.azimuthCorr).textContent;
    const elC  = document.getElementById(outputs.elevationCorr).textContent;
    const tofC = document.getElementById(outputs.tofCorr).textContent;
    if (azC !== '-' && elC !== '-' && tofC !== '-') {
        md.correctedSolution = {
            azimuthCorr: parseFloat(azC),
            elevationCorr: parseFloat(elC),
            tofCorr: parseFloat(tofC)
        };
    }

    // Per-section per-gun solutions parsed back from rendered text
    const container = document.getElementById(outputs.gunSolutionsContent);
    if (container && container.textContent.trim() !== 'No solutions available') {
        md.sectionSolutions = parseSectionSolutionsText(container.textContent, missionType);
    }

    return md;
}

function parseSectionSolutionsText(text, missionType) {
    const result = {};
    const sectionMatches = text.match(/Section (\d+):\s*\n([\s\S]*?)(?=Section \d+:|$)/g);
    if (!sectionMatches) return result;

    sectionMatches.forEach(sectionBlock => {
        const sectionNumber = parseInt(sectionBlock.match(/Section (\d+):/)[1]);
        const body = sectionBlock.replace(/Section \d+:\s*\n/, '');

        const shellEl = document.getElementById(`section-${sectionNumber}-shell-${missionType}`);
        const ringsEl = document.getElementById(`section-${sectionNumber}-rings-${missionType}`);
        result[sectionNumber] = {
            shell: shellEl ? shellEl.value : 'HE',
            rings: ringsEl ? parseInt(ringsEl.value) : 0,
            guns: []
        };

        const gunMatches = body.match(/Gun (\d+):\s*\n\s*Azimuth: ([^\n]+) mils\s*\n\s*Elevation: ([^\n]+) mils\s*\n\s*TOF: ([^\n]+) sec(\s*\n\s*Target: \(([^,]+), ([^)]+)\))?/g);
        if (!gunMatches) return;
        gunMatches.forEach(match => {
            const lines = match.split('\n').filter(l => l.trim());
            const gun = {
                gun: parseInt(lines[0].match(/Gun (\d+):/)[1]),
                azimuth: parseFloat(lines[1].match(/Azimuth: ([^\n]+) mils/)[1]),
                elevation: parseFloat(lines[2].match(/Elevation: ([^\n]+) mils/)[1]),
                tof: parseFloat(lines[3].match(/TOF: ([^\n]+) sec/)[1])
            };
            if (lines.length > 4 && lines[4].includes('Target:')) {
                const tm = lines[4].match(/Target: \(([^,]+), ([^)]+)\)/);
                if (tm) { gun.targetX = parseFloat(tm[1]); gun.targetY = parseFloat(tm[2]); }
            }
            result[sectionNumber].guns.push(gun);
        });
    });
    return result;
}

// ============================================================================
// Reset
// ============================================================================

const RESET_INPUT_FIELDS = {
    grid: [
        'target-number-grid', 'amount-rounds-grid',
        'target-x', 'target-y', 'target-alt', 'fo-dir',
        'add-drop', 'left-right',
        'sheaf-length', 'sheaf-direction', 'sheaf-diameter'
    ],
    polar: [
        'target-number-polar', 'amount-rounds-polar',
        'fo-x-polar', 'fo-y-polar', 'fo-dist-polar', 'fo-dir-polar', 'target-alt-polar',
        'add-drop-polar', 'left-right-polar',
        'sheaf-length-polar', 'sheaf-direction-polar', 'sheaf-diameter-polar'
    ],
    shift: [
        'target-number-shift', 'amount-rounds-shift',
        'shift-x', 'shift-y', 'target-alt-shift', 'fo-dir-shift',
        'add-drop-shift', 'left-right-shift',
        'sheaf-length-shift', 'sheaf-direction-shift', 'sheaf-diameter-shift'
    ]
};

const ALL_RESULT_PANELS = [
    'base-results-grid', 'corrected-results-grid', 'section-solutions-grid', 'gun-solutions-content-grid',
    'base-results-polar', 'corrected-results-polar', 'section-solutions-polar', 'gun-solutions-content-polar',
    'base-results-shift', 'corrected-results-shift', 'section-solutions-shift', 'gun-solutions-content-shift'
];

function resetMissionFields(missionType) {
    RESET_INPUT_FIELDS[missionType].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });

    const sheafType = document.getElementById(`sheaf-type-${missionType}`);
    if (sheafType) sheafType.value = 'parallel';

    const allBox = document.getElementById(`all-sections-${missionType}`);
    if (allBox) allBox.checked = false;

    const numSections = parseInt(document.getElementById('num-sections').value) || 1;
    for (let i = 1; i <= numSections; i++) {
        const cb = document.getElementById(`section-${i}-${missionType}`);
        if (cb) cb.checked = false;
    }
    const first = document.getElementById(`section-1-${missionType}`);
    if (first) first.checked = true;

    for (let i = 1; i <= numSections; i++) {
        const shellSel = document.getElementById(`section-${i}-shell-${missionType}`);
        const ringsSel = document.getElementById(`section-${i}-rings-${missionType}`);
        if (shellSel) shellSel.value = 'HE';
        if (ringsSel) ringsSel.value = '0';
    }

    if (missionType === 'shift') {
        const kp = document.getElementById('known-point-select');
        if (kp) kp.value = '';
    }

    ALL_RESULT_PANELS.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });

    saveAllData();
}

// ============================================================================
// MTO modal
// ============================================================================

let currentMissionData = null;

function showMTOModal(missionType) {
    const missionData = getMissionData(missionType);
    if (!missionData) {
        showAlertModal('No Fire Solution', 'Please calculate a fire solution first before showing MTO.');
        return;
    }

    let lowestTOF = null;
    if (missionData.sectionSolutions && Object.keys(missionData.sectionSolutions).length) {
        const tofs = [];
        Object.values(missionData.sectionSolutions).forEach(sec => {
            sec.guns.forEach(g => { if (g.tof) tofs.push(g.tof); });
        });
        if (tofs.length) lowestTOF = Math.min(...tofs);
    } else if (missionData.gunSolutions && missionData.gunSolutions.length) {
        lowestTOF = Math.min(...missionData.gunSolutions.map(s => s.tof));
    } else if (missionData.baseSolution && missionData.baseSolution.tof) {
        lowestTOF = missionData.baseSolution.tof;
    } else if (missionData.correctedSolution && missionData.correctedSolution.tofCorr) {
        lowestTOF = missionData.correctedSolution.tofCorr;
    }

    let shellType = 'Not specified';
    if (missionData.sectionData && Object.keys(missionData.sectionData).length) {
        shellType = [...new Set(Object.values(missionData.sectionData).map(s => s.shell))].join(', ');
    } else if (missionData.shellType) {
        shellType = missionData.shellType;
    }

    let totalGuns = 0;
    if (missionData.sectionSolutions && Object.keys(missionData.sectionSolutions).length) {
        Object.values(missionData.sectionSolutions).forEach(sec => { totalGuns += sec.guns.length; });
    } else if (missionData.gunSolutions && missionData.gunSolutions.length) {
        totalGuns = missionData.gunSolutions.length;
    } else {
        totalGuns = missionData.numGuns || 1;
    }

    document.getElementById('mto-target-number').textContent = missionData.targetNumber || 'Not specified';
    document.getElementById('mto-rounds').textContent = missionData.amountRounds || 'Not specified';
    document.getElementById('mto-shell-type').textContent = shellType;
    document.getElementById('mto-tof').textContent = lowestTOF ? lowestTOF.toFixed(1) + ' sec' : 'Not calculated';
    document.getElementById('mto-guns').textContent = totalGuns || 'Not specified';

    currentMissionData = missionData;
    document.getElementById('mto-modal').style.display = 'block';
}

function closeMTOModal() {
    document.getElementById('mto-modal').style.display = 'none';
    currentMissionData = null;
}

// ============================================================================
// NFA warning modal
// ============================================================================

let currentNFAViolation = null;
let currentMissionType = null;

function showNFAWarningModal(nfaViolation, missionType) {
    currentNFAViolation = nfaViolation;
    currentMissionType = missionType;
    document.getElementById('nfa-warning-name').textContent = nfaViolation.nfa.name;
    document.getElementById('nfa-warning-coords').textContent = `(${Math.round(nfaViolation.nfa.x)}, ${Math.round(nfaViolation.nfa.y)})`;
    document.getElementById('nfa-warning-issued-by').textContent = nfaViolation.nfa.issuedBy || 'Unknown';
    document.getElementById('nfa-warning-modal').style.display = 'block';
}

function closeNFAWarningModal() {
    document.getElementById('nfa-warning-modal').style.display = 'none';
    currentNFAViolation = null;
    currentMissionType = null;
}

function proceedWithNFAViolation() {
    const missionType = currentMissionType;
    closeNFAWarningModal();
    if (missionType) calculateMission(missionType, true);
}

// ============================================================================
// Backward-compat shims for inline HTML handlers
// ============================================================================

function calculateGridMissionParallelSheaf(bypassNFA = false) { return calculateMission('grid', bypassNFA); }
function calculatePolarMissionParallelSheaf(bypassNFA = false) { return calculateMission('polar', bypassNFA); }
function calculateShiftMission(bypassNFA = false) { return calculateMission('shift', bypassNFA); }
