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
// Display helpers
// ============================================================================

/**
 * Render a grid coordinate as a 4-digit zero-padded string. Negative values
 * keep the leading minus sign and pad the magnitude to 4 digits.
 *   formatCoord(40)    → "0040"
 *   formatCoord(40.5)  → "0041"  (Math.round)
 *   formatCoord(-7)    → "-0007"
 */
function formatCoord(value) {
    const n = Math.round(Number(value) || 0);
    if (n < 0) return '-' + String(Math.abs(n)).padStart(4, '0');
    return String(n).padStart(4, '0');
}

/** "0040, 0050" — convenience wrapper for the common pair display. */
function formatCoordPair(x, y) {
    return `${formatCoord(x)}, ${formatCoord(y)}`;
}

// ============================================================================
// Helpers
// ============================================================================

function interpolate(x, x0, y0, x1, y1) {
    if (x1 === x0) return y0;
    return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
}

/**
 * Like interpolate(), but returns null if either endpoint is null/undefined.
 * Used for optional table columns (peakAlt, angleOfImpact, wind corrections)
 * that older firing-table rows might not include.
 */
function safeInterpolate(x, x0, y0, x1, y1) {
    if (y0 == null || y1 == null) return null;
    return interpolate(x, x0, y0, x1, y1);
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

/**
 * Firing-table row layout (column indices). Indices 0–4 are required; 5–8 are
 * optional and only present on platforms that publish them (currently M252
 * and 2B14 vanilla). When absent, safeInterpolate returns null and the wind/
 * peak-alt/angle-of-impact features quietly degrade for that platform.
 */
const TABLE_COL = {
    RANGE: 0,
    ELEV: 1,
    DELEV_PER_100M: 2,
    TOF: 3,
    DTOF_PER_100M: 4,
    PEAK_ALT: 5,           // metres above sea level
    ANGLE_OF_IMPACT: 6,    // degrees from horizontal
    WIND_CROSS_MILS: 7,    // azimuth correction (mils) per 10 m/s crosswind
    WIND_LONG_M: 8         // range correction (m) per 10 m/s longitudinal wind
};

/** Straight-line range in metres (game coords are 1 unit = 10m). */
function calculateRange(mortarX, mortarY, targetX, targetY) {
    return Math.sqrt(
        Math.pow(targetX - mortarX, 2) + Math.pow(targetY - mortarY, 2)
    ) * 10;
}

/**
 * Azimuth from mortar to target in mils.
 *
 * @param milsPerCircle  6400 for NATO weapons, 6000 for Soviet/Russian.
 *                       Defaults to NATO when omitted.
 */
function calculateAzimuth(mortarX, mortarY, targetX, targetY, milsPerCircle = 6400) {
    const dx = (400 - targetY) - (400 - mortarY);
    const dy = mortarX - targetX;
    const angleDeg = Math.atan2(dy, dx) * 180 / Math.PI;
    const halfCircle = milsPerCircle / 2;
    const azimuth = (angleDeg * milsPerCircle / 360) + halfCircle;
    return ((azimuth % milsPerCircle) + milsPerCircle) % milsPerCircle;
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
 * active platform/variant. When `crestElev` is provided, the picked ring
 * must also produce a trajectory whose apex clears that altitude — useful
 * to auto-bump rings over terrain. Returns null if no ring satisfies.
 */
function getMinimumRingsForRange(range, shell, missionType = 'grid', crestElev = null, mortarAlt = 0) {
    const shellData = Settings.resolveShell(missionType, shell);
    if (!shellData) return null;

    const ringNumbers = Object.keys(shellData.rings).map(Number).sort((a, b) => a - b);
    for (const rings of ringNumbers) {
        const table = shellData.rings[rings];
        if (!table || !table.length) continue;
        const maxRangeForRing = table[table.length - 1][0];
        const minRangeForRing = table[0][0];
        if (range > maxRangeForRing || range < minRangeForRing) continue;

        if (crestElev !== null && !trajectoryClearsCrest(table, range, mortarAlt, crestElev)) {
            continue;
        }
        return rings;
    }
    return null;
}

/**
 * Vacuum-trajectory apex check. Apex above firing point ≈ TOF² · g / 8.
 * (g ≈ 9.81 m/s² → factor ≈ 1.226). Real artillery sees a slightly lower
 * apex because of drag, so this OVER-estimates — i.e. it's optimistic about
 * clearance. Good enough as a heads-up, not a substitute for visual recon.
 */
function trajectoryClearsCrest(table, range, mortarAlt, crestElev) {
    const { lower, upper } = bracketRange(table, range);
    const tof = interpolate(range, lower[0], lower[3], upper[0], upper[3]);
    if (!isFinite(tof) || tof <= 0) return true;  // unknown → don't block
    const apexAboveFiring = (tof * tof * 9.81) / 8;
    return (mortarAlt + apexAboveFiring) >= crestElev;
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
 * @param missionType  'grid' | 'polar' | 'shift' — drives platform lookup.
 * @returns null when the firing table is unavailable, otherwise:
 *   {
 *     azimuth, elevation, tof,                       // base solution
 *     azimuthCorr, elevationCorr, tofCorr,           // ADD/DROP + L/R + wind
 *     peakAlt, angleOfImpact,                        // null on legacy tables
 *     windAdjMils, windAdjRangeM                     // 0 when no wind data
 *   }
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

    // Active platform's mil convention — NATO 6400 vs Russian 6000.
    const milsPerCircle = Settings.getMilsPerCircle(missionType);
    const heightDiff = targetAlt - mortarAlt;

    // --- Base solution (target as-is) ---
    const azimuth = calculateAzimuth(mortarX, mortarY, targetX, targetY, milsPerCircle);
    const range = calculateRange(mortarX, mortarY, targetX, targetY);
    const base = solveFromTable(table, range, heightDiff);

    // --- Shift-corrected solution (ADD/DROP + LEFT/RIGHT) ---
    const corr = applyShiftCorrection(targetX, targetY, addDrop, leftRight, foDirDeg);
    const azimuthCorr = calculateAzimuth(mortarX, mortarY, corr.x, corr.y, milsPerCircle);
    const rangeCorr = calculateRange(mortarX, mortarY, corr.x, corr.y);
    const shifted = solveFromTable(table, rangeCorr, heightDiff);

    // --- Wind correction (on top of shifted) ---
    // Only applied when the table provides windCrossMils/windLongM AND the
    // user has entered a non-zero wind speed in global data. Falls through
    // gracefully for legacy tables or zero wind.
    const wind = Settings.getWind ? Settings.getWind() : { speed: 0, fromDeg: 0 };
    let windAdjMils = 0;
    let windAdjRangeM = 0;
    let finalAzimuth = azimuthCorr;
    let finalElevation = shifted.elevation;
    let finalTof = shifted.tof;

    if (wind.speed > 0
        && shifted.windCrossMils != null
        && shifted.windLongM != null
        && isFinite(shifted.windCrossMils)
        && isFinite(shifted.windLongM)) {

        // Convert firing azimuth to compass degrees regardless of mil convention.
        const fireBearingDeg = azimuthCorr / milsPerCircle * 360;
        const deltaRad = (wind.fromDeg - fireBearingDeg) * Math.PI / 180;
        const crosswindFromRight = wind.speed * Math.sin(deltaRad);  // +ve = wind from right of gun
        const headwind = wind.speed * Math.cos(deltaRad);            // +ve = headwind, -ve = tailwind

        // Azimuth: wind from right pushes round left → aim right (+ mils).
        windAdjMils = crosswindFromRight * shifted.windCrossMils / 10;
        // Range: headwind shortens flight → aim further (+ m). Tailwind shortens aim.
        windAdjRangeM = headwind * shifted.windLongM / 10;

        finalAzimuth = ((azimuthCorr + windAdjMils) % milsPerCircle + milsPerCircle) % milsPerCircle;
        const reSolved = solveFromTable(table, rangeCorr + windAdjRangeM, heightDiff);
        finalElevation = reSolved.elevation;
        finalTof = reSolved.tof;
    }

    return {
        azimuth: azimuth,
        elevation: base.elevation,
        tof: base.tof,
        azimuthCorr: finalAzimuth,
        elevationCorr: finalElevation,
        tofCorr: finalTof,
        peakAlt: shifted.peakAlt,
        angleOfImpact: shifted.angleOfImpact,
        windAdjMils: windAdjMils,
        windAdjRangeM: windAdjRangeM
    };
}

/**
 * Interpolate the table for a range and apply altitude correction.
 * Returns elevation, tof, plus optional peakAlt / angleOfImpact /
 * windCrossMils / windLongM (null when the row doesn't include them).
 */
function solveFromTable(table, range, heightDiff) {
    const { lower, upper } = bracketRange(table, range);

    const elev = interpolate(range, lower[TABLE_COL.RANGE], lower[TABLE_COL.ELEV], upper[TABLE_COL.RANGE], upper[TABLE_COL.ELEV]);
    const dElev = interpolate(range, lower[TABLE_COL.RANGE], lower[TABLE_COL.DELEV_PER_100M], upper[TABLE_COL.RANGE], upper[TABLE_COL.DELEV_PER_100M]);
    const tof = interpolate(range, lower[TABLE_COL.RANGE], lower[TABLE_COL.TOF], upper[TABLE_COL.RANGE], upper[TABLE_COL.TOF]);
    const dTof = interpolate(range, lower[TABLE_COL.RANGE], lower[TABLE_COL.DTOF_PER_100M], upper[TABLE_COL.RANGE], upper[TABLE_COL.DTOF_PER_100M]);

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

    return {
        elevation: elevation,
        tof: correctedTof,
        peakAlt: safeInterpolate(range, lower[TABLE_COL.RANGE], lower[TABLE_COL.PEAK_ALT], upper[TABLE_COL.RANGE], upper[TABLE_COL.PEAK_ALT]),
        angleOfImpact: safeInterpolate(range, lower[TABLE_COL.RANGE], lower[TABLE_COL.ANGLE_OF_IMPACT], upper[TABLE_COL.RANGE], upper[TABLE_COL.ANGLE_OF_IMPACT]),
        windCrossMils: safeInterpolate(range, lower[TABLE_COL.RANGE], lower[TABLE_COL.WIND_CROSS_MILS], upper[TABLE_COL.RANGE], upper[TABLE_COL.WIND_CROSS_MILS]),
        windLongM: safeInterpolate(range, lower[TABLE_COL.RANGE], lower[TABLE_COL.WIND_LONG_M], upper[TABLE_COL.RANGE], upper[TABLE_COL.WIND_LONG_M])
    };
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
