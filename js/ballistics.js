/**
 * Mortar Ballistics Calculator - Pure Math
 *
 * Copyright (c) 2024 C-gamer_DX. All rights reserved.
 *
 * Every function here is side-effect free: it takes numbers, returns numbers.
 * Firing-table lookups go through Settings (platforms.js) so the same math
 * works for any platform/variant without changing this file.
 */

// ============================================================================
// Helpers
// ============================================================================

function interpolate(x, x0, y0, x1, y1) {
    if (x1 === x0) return y0;
    return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
}

/** Find the table rows bracketing `range` for piecewise linear interpolation. */
function bracketRange(table, range) {
    for (let i = 0; i < table.length - 1; i++) {
        if (range >= table[i][0] && range <= table[i + 1][0]) {
            return { lower: table[i], upper: table[i + 1] };
        }
    }
    return { lower: table[0], upper: table[table.length - 1] };
}

/** Straight-line range in metres (game coords are 1 unit = 10m). */
function calculateRange(mortarX, mortarY, targetX, targetY) {
    return Math.sqrt(
        Math.pow(targetX - mortarX, 2) + Math.pow(targetY - mortarY, 2)
    ) * 10;
}

/** Azimuth from mortar to target in mils (0..6400). */
function calculateAzimuth(mortarX, mortarY, targetX, targetY) {
    const dx = (400 - targetY) - (400 - mortarY);
    const dy = mortarX - targetX;
    const angleDeg = Math.atan2(dy, dx) * 180 / Math.PI;
    let azimuth = (angleDeg * 6400 / 360) + 3200;
    return ((azimuth % 6400) + 6400) % 6400;
}

/** Apply ADD/DROP + LEFT/RIGHT shift in the FO's frame to a target. */
function applyShiftCorrection(targetX, targetY, addDrop, leftRight, foDirDeg) {
    const foDirRad = foDirDeg * Math.PI / 180;
    const xCorr = addDrop / 10;
    const yCorr = leftRight / 10;
    return {
        x: targetX + xCorr * Math.sin(foDirRad) + yCorr * Math.cos(foDirRad),
        y: targetY + xCorr * Math.cos(foDirRad) - yCorr * Math.sin(foDirRad)
    };
}

// ============================================================================
// Range / ring lookups (data-driven via Settings)
// ============================================================================

/**
 * Smallest ring count that can reach `range` for the given shell on the
 * active platform/variant. Returns null if the range is unreachable.
 */
function getMinimumRingsForRange(range, shell, missionType = 'grid') {
    const shellData = Settings.resolveShell(missionType, shell);
    if (!shellData) return null;

    const ringNumbers = Object.keys(shellData.rings).map(Number).sort((a, b) => a - b);
    for (const rings of ringNumbers) {
        const table = shellData.rings[rings];
        if (!table || !table.length) continue;
        const maxRangeForRing = table[table.length - 1][0];
        if (range <= maxRangeForRing) return rings;
    }
    return null;
}

/** Is `range` inside the shell's min/max envelope? */
function checkTargetRange(range, shell, missionType = 'grid') {
    const limits = Settings.getRangeLimits(missionType, shell);
    if (!limits) return { inRange: false, reason: 'Invalid shell type' };
    if (range < limits.min) return { inRange: false, reason: 'Target is too close' };
    if (range > limits.max) return { inRange: false, reason: 'Target is too far' };
    return { inRange: true };
}

// ============================================================================
// Single-gun firing solution
// ============================================================================

/**
 * Computes the firing solution for one mortar/target pair.
 *
 * @param missionType  'grid' | 'polar' | 'shift' - selects which platform
 *                     dropdown drives the table lookup.
 * @returns null when the firing table is unavailable, otherwise:
 *          { azimuth, elevation, tof,
 *            azimuthCorr, elevationCorr, tofCorr }
 *          where the *Corr fields fold in ADD/DROP + LEFT/RIGHT shifts.
 */
function calculateSingleGunBallistics(
    mortarX, mortarY, targetX, targetY,
    mortarAlt, targetAlt,
    shell, rings,
    addDrop, leftRight, foDirDeg,
    missionType = 'grid'
) {
    const table = Settings.getShellTable(missionType, shell, rings);
    if (!table) return null;

    const heightDiff = targetAlt - mortarAlt;

    // --- Base solution ---
    const azimuth = calculateAzimuth(mortarX, mortarY, targetX, targetY);
    const range = calculateRange(mortarX, mortarY, targetX, targetY);

    const { elevation, tof } = solveFromTable(table, range, heightDiff);

    // --- Corrected solution ---
    const corr = applyShiftCorrection(targetX, targetY, addDrop, leftRight, foDirDeg);
    const azimuthCorr = calculateAzimuth(mortarX, mortarY, corr.x, corr.y);
    const rangeCorr = calculateRange(mortarX, mortarY, corr.x, corr.y);
    const solved = solveFromTable(table, rangeCorr, heightDiff);

    return {
        azimuth: azimuth,
        elevation: elevation,
        tof: tof,
        azimuthCorr: azimuthCorr,
        elevationCorr: solved.elevation,
        tofCorr: solved.tof
    };
}

/** Interpolate elevation/TOF for a range and apply altitude correction. */
function solveFromTable(table, range, heightDiff) {
    const { lower, upper } = bracketRange(table, range);

    const elev = interpolate(range, lower[0], lower[1], upper[0], upper[1]);
    const dElev = interpolate(range, lower[0], lower[2], upper[0], upper[2]);
    const tof = interpolate(range, lower[0], lower[3], upper[0], upper[3]);
    const dTof = interpolate(range, lower[0], lower[4], upper[0], upper[4]);

    // Altitude correction: positive height diff (target above mortar) reduces
    // elevation by dElev * (heightDiff/100); negative does the opposite.
    const elevation = heightDiff >= 0
        ? elev - (dElev * heightDiff / 100)
        : elev + (dElev * Math.abs(heightDiff) / 100);

    let correctedTof;
    if (heightDiff === 0) {
        correctedTof = tof;
    } else if (heightDiff > 0) {
        correctedTof = tof - (dTof * heightDiff / 100);
    } else {
        correctedTof = tof + (dTof * Math.abs(heightDiff) / 100);
    }

    return { elevation: elevation, tof: correctedTof };
}

// ============================================================================
// Sheaf target-coordinate generators
// ============================================================================

/** Linear sheaf — guns evenly distributed along a line through (cx, cy). */
function calculateLinearSheafTargets(cx, cy, sheafLength, sheafDirection, numGuns) {
    const directionRad = sheafDirection * Math.PI / 180;
    const halfLength = sheafLength / 2;
    const startX = cx - halfLength * Math.sin(directionRad);
    const endX = cx + halfLength * Math.sin(directionRad);
    const startY = cy - halfLength * Math.cos(directionRad);
    const endY = cy + halfLength * Math.cos(directionRad);

    const targets = [];
    for (let i = 1; i <= numGuns; i++) {
        if (numGuns === 1) {
            targets.push({ x: (startX + endX) / 2, y: (startY + endY) / 2 });
        } else {
            const ratio = (i - 1) / (numGuns - 1);
            targets.push({
                x: startX + ratio * (endX - startX),
                y: startY + ratio * (endY - startY)
            });
        }
    }
    return targets;
}

/** Circular sheaf — guns evenly distributed around a circle of `diameter`. */
function calculateCircularSheafTargets(cx, cy, diameter, numGuns) {
    const radius = diameter / 2;
    const targets = [];
    for (let i = 1; i <= numGuns; i++) {
        if (numGuns === 1) {
            targets.push({ x: cx, y: cy });
        } else {
            const angle = (i - 1) * (2 * Math.PI) / numGuns;
            targets.push({
                x: cx + radius * Math.cos(angle),
                y: cy + radius * Math.sin(angle)
            });
        }
    }
    return targets;
}

/** Converged sheaf — every gun fires at the same point. */
function calculateConvergedSheafTargets(cx, cy, numGuns) {
    const targets = [];
    for (let i = 0; i < numGuns; i++) targets.push({ x: cx, y: cy });
    return targets;
}

/**
 * Open sheaf — fixed offset pattern repeating every 4 guns:
 *   Gun 1: (-1, -1)
 *   Gun 2: ( 0,  0)   base gun
 *   Gun 3: (+1, -1)
 *   Gun 4: (+2,  0)
 */
const OPEN_SHEAF_OFFSETS = [
    [-1, -1],
    [0, 0],
    [1, -1],
    [2, 0]
];

function openSheafOffsetForPosition(gunPosition) {
    // gunPosition is 1..4; mod 4 (with 4 instead of 0) was the original logic.
    const idx = ((gunPosition - 1) % 4 + 4) % 4;
    return OPEN_SHEAF_OFFSETS[idx];
}

function calculateOpenSheafTargets(cx, cy, numGuns) {
    const targets = [];
    for (let i = 1; i <= numGuns; i++) {
        const [dx, dy] = openSheafOffsetForPosition(i);
        targets.push({ x: cx + dx, y: cy + dy });
    }
    return targets;
}
