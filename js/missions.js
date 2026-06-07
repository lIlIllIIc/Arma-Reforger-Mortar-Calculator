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
        trajectoryInfo: 'trajectory-info-grid',
        peakAlt: 'peak-alt-grid', angleOfImpact: 'angle-impact-grid',
        windCorrRow: 'wind-corr-row-grid', windCorr: 'wind-corr-grid',
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
        trajectoryInfo: 'trajectory-info-polar',
        peakAlt: 'peak-alt-polar', angleOfImpact: 'angle-impact-polar',
        windCorrRow: 'wind-corr-row-polar', windCorr: 'wind-corr-polar',
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
        trajectoryInfo: 'trajectory-info-shift',
        peakAlt: 'peak-alt-shift', angleOfImpact: 'angle-impact-shift',
        windCorrRow: 'wind-corr-row-shift', windCorr: 'wind-corr-shift',
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

    if (applyValidationResult(validateMissionFields(missionType))) return;

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
        showAlertModal('Range Error', sectionResult.error);
        return;
    }
    if (!sectionResult.sections.length) {
        showAlertModal('No Solution', 'No valid section solutions could be computed.');
        return;
    }

    const gunSolutions = computeGunSolutions(
        missionType, sheafType, spans, totalGuns,
        targetX, targetY, targetAlt, addDrop, leftRight, foDirDeg,
        sectionResult.sections
    );
    if (gunSolutions === null) return;  // an error alert was already shown

    // TOT (Time on Target): annotate each section + each gun with the fire
    // delay needed so all rounds land simultaneously. Skip when TOFs are
    // close enough to ignore.
    annotateFireDelays(sectionResult.sections, gunSolutions, missionType);

    // Top-level summary boxes: only shown when there's a single gun.
    renderMissionSolutions(missionType, sectionResult.sections, totalGuns);

    // Always populate the per-gun cache (used by MTO + logging) but only
    // *show* the panel when 2+ guns fire — a single-gun mission is fully
    // covered by the Base/Corrected boxes above.
    displayGunSolutions(gunSolutions, outputs.gunSolutionsContent);
    document.getElementById(outputs.gunSolutions).style.display = (totalGuns > 1) ? 'block' : 'none';

    // SVG mini-map at the bottom — mortars, target, sheaf points, nearby NFAs.
    renderMiniMap(missionType, { targetX, targetY }, gunSolutions);
}

// ============================================================================
// Mini map (SVG sketch view of mortars, target, sheaf pattern, NFAs)
// ============================================================================

const MAP_CANVAS = { w: 360, h: 360 };

function renderMiniMap(missionType, target, gunSolutions) {
    const container = document.getElementById(`mini-map-${missionType}`);
    if (!container) return;

    // Collect mortar positions for the SELECTED sections only — unselected
    // sections aren't part of this fire mission and shouldn't clutter the map.
    const mortars = [];
    const selected = new Set(getSelectedSections(missionType));
    getGunConfiguration().forEach(cfg => {
        if (!selected.has(cfg.section)) return;
        for (let g = 1; g <= cfg.guns; g++) {
            const c = getMortarCoordinatesBySection(cfg.section, g);
            if (c.x && c.y) mortars.push({ x: c.x, y: c.y, section: cfg.section, gun: g });
        }
    });

    // FO position (polar) — informational only.
    let foPos = null;
    if (missionType === 'polar') {
        const foX = parseFloat(document.getElementById('fo-x-polar').value);
        const foY = parseFloat(document.getElementById('fo-y-polar').value);
        if (isFinite(foX) && isFinite(foY)) foPos = { x: foX, y: foY };
    }

    // Sheaf gun targets (yellow dots).
    const sheafTargets = gunSolutions
        .filter(g => g.targetX !== undefined && g.targetY !== undefined)
        .map(g => ({ x: g.targetX, y: g.targetY }));

    // Primary bounds from the action area only — NFAs only extend the view
    // if they overlap, so a far-off NFA doesn't shrink the map to nothing.
    const primary = [...mortars];
    if (target && isFinite(target.targetX)) primary.push({ x: target.targetX, y: target.targetY });
    sheafTargets.forEach(p => primary.push(p));
    if (foPos) primary.push(foPos);

    if (primary.length === 0) {
        container.style.display = 'none';
        return;
    }

    const xs = primary.map(p => p.x), ys = primary.map(p => p.y);
    let minX = Math.min(...xs), maxX = Math.max(...xs);
    let minY = Math.min(...ys), maxY = Math.max(...ys);
    const pad = Math.max((maxX - minX) * 0.2, (maxY - minY) * 0.2, 5);
    minX -= pad; maxX += pad; minY -= pad; maxY += pad;

    const allNFAs = JSON.parse(localStorage.getItem('nfas') || '[]');
    // diameter in metres, world coords in 10m units → radius in coord units.
    const nfaCoordRadius = n => (n.diameter / 2) / 10;
    const visibleNFAs = allNFAs.filter(n => {
        const r = nfaCoordRadius(n);
        return n.x + r >= minX && n.x - r <= maxX && n.y + r >= minY && n.y - r <= maxY;
    });

    container.innerHTML = buildMiniMapSVG(missionType, mortars, target, sheafTargets, visibleNFAs, foPos, { minX, maxX, minY, maxY });
    container.style.display = 'block';
}

function buildMiniMapSVG(missionType, mortars, target, sheafTargets, nfas, foPos, bounds) {
    const { w, h } = MAP_CANVAS;
    const { minX, maxX, minY, maxY } = bounds;
    // Uniform scale, centred — preserves aspect (no squashing).
    const s = Math.min(w / (maxX - minX), h / (maxY - minY));
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const tx = x => (x - cx) * s + w / 2;
    const ty = y => h / 2 - (y - cy) * s;  // flip Y so north is up

    // Section colour palette so each section's mortars are visually distinct.
    const SECTION_COLOURS = ['#4ade80', '#22d3ee', '#fbbf24', '#a78bfa', '#fb7185', '#f97316'];
    const colourFor = sec => SECTION_COLOURS[(sec - 1) % SECTION_COLOURS.length];

    let svg = `<div class="mini-map-header"><h3>Map View</h3><span class="mini-map-scale">~${Math.round((maxX - minX) * 10)}m × ${Math.round((maxY - minY) * 10)}m</span></div>`;
    svg += `<svg viewBox="0 0 ${w} ${h}" class="mini-map-svg" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">`;
    svg += `<rect width="${w}" height="${h}" fill="#0a1410" />`;

    // Faint grid every 100m (10 coord units).
    const gridStep = 10;
    for (let gx = Math.ceil(minX / gridStep) * gridStep; gx <= maxX; gx += gridStep) {
        const x = tx(gx);
        svg += `<line x1="${x}" y1="0" x2="${x}" y2="${h}" stroke="#1f3329" stroke-width="0.5" />`;
    }
    for (let gy = Math.ceil(minY / gridStep) * gridStep; gy <= maxY; gy += gridStep) {
        const y = ty(gy);
        svg += `<line x1="0" y1="${y}" x2="${w}" y2="${y}" stroke="#1f3329" stroke-width="0.5" />`;
    }

    // NFAs first (background) — dashed red circles.
    nfas.forEach(n => {
        const x = tx(n.x);
        const y = ty(n.y);
        const r = Math.max((n.diameter / 2 / 10) * s, 3);
        svg += `<circle cx="${x}" cy="${y}" r="${r}" fill="rgba(248,113,113,0.10)" stroke="#f87171" stroke-width="1" stroke-dasharray="4,3" />`;
        svg += `<text x="${x}" y="${y - r - 4}" fill="#f87171" font-size="9" text-anchor="middle" font-family="monospace">${escapeXML(n.name)}</text>`;
    });

    // Trajectory hints — thin line from each mortar's section to the target.
    if (target && isFinite(target.targetX)) {
        const tX = tx(target.targetX), tY = ty(target.targetY);
        const seenSections = new Set();
        mortars.forEach(m => {
            if (seenSections.has(m.section)) return;
            seenSections.add(m.section);
            svg += `<line x1="${tx(m.x)}" y1="${ty(m.y)}" x2="${tX}" y2="${tY}" stroke="${colourFor(m.section)}" stroke-width="0.5" stroke-dasharray="2,3" opacity="0.5" />`;
        });
    }

    // Mortar positions.
    mortars.forEach(m => {
        const x = tx(m.x), y = ty(m.y);
        const c = colourFor(m.section);
        svg += `<rect x="${x - 4}" y="${y - 4}" width="8" height="8" fill="${c}" stroke="#0a0f0c" stroke-width="1"><title>Section ${m.section} Gun ${m.gun}</title></rect>`;
    });

    // FO marker.
    if (foPos) {
        const x = tx(foPos.x), y = ty(foPos.y);
        svg += `<circle cx="${x}" cy="${y}" r="5" fill="#60a5fa" stroke="#0a0f0c" stroke-width="1" />`;
        svg += `<text x="${x + 7}" y="${y + 3}" fill="#60a5fa" font-size="10" font-family="monospace">FO</text>`;
    }

    // Per-gun sheaf target points.
    sheafTargets.forEach(p => {
        svg += `<circle cx="${tx(p.x)}" cy="${ty(p.y)}" r="2" fill="#fbbf24" />`;
    });

    // Primary target crosshair (drawn on top).
    if (target && isFinite(target.targetX)) {
        const x = tx(target.targetX), y = ty(target.targetY);
        svg += `<path d="M ${x - 8} ${y} L ${x + 8} ${y} M ${x} ${y - 8} L ${x} ${y + 8}" stroke="#fbbf24" stroke-width="1.5" />`;
        svg += `<circle cx="${x}" cy="${y}" r="4" fill="none" stroke="#fbbf24" stroke-width="1.5" />`;
    }

    svg += '</svg>';

    // Legend below the SVG (HTML, easier to style than inline SVG text).
    svg += `<div class="mini-map-legend">
        <span><span class="mini-map-swatch" style="background:#4ade80"></span>Mortars (coloured by section)</span>
        <span><span class="mini-map-swatch crosshair">✚</span>Target</span>
        <span><span class="mini-map-swatch" style="background:#fbbf24"></span>Sheaf gun aim points</span>
        <span><span class="mini-map-swatch nfa">○</span>NFA</span>
        ${foPos ? '<span><span class="mini-map-swatch" style="background:#60a5fa;border-radius:50%"></span>FO</span>' : ''}
    </div>`;
    return svg;
}

function escapeXML(s) {
    return String(s).replace(/[<>&"']/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[c]));
}

/**
 * Compute per-section and per-gun fire delays for TOT (Time on Target).
 * delay = maxTOF − thisTOF. Section/gun with the longest TOF fires first
 * (delay 0); the others wait by their delta so every round lands together.
 *
 * Annotation is skipped when the spread between fastest and slowest is below
 * 0.1s (no meaningful stagger). For shift missions we also stash the
 * platform-level dispersion lookup needed by section card rendering.
 */
function annotateFireDelays(sections, gunSolutions, missionType) {
    const tofs = [
        ...sections.map(s => s.solution.tofCorr),
        ...gunSolutions.map(g => g.tof)
    ].filter(v => isFinite(v));
    if (!tofs.length) return;

    const maxTOF = Math.max(...tofs);
    const minTOF = Math.min(...tofs);
    if (maxTOF - minTOF < 0.1) return;  // no meaningful variation

    sections.forEach(s => {
        s.fireDelay = maxTOF - s.solution.tofCorr;
        s.impactTOF = maxTOF;
    });
    gunSolutions.forEach(g => {
        g.fireDelay = maxTOF - g.tof;
    });
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
 * Pick the right result panel(s) to render based on total gun count.
 *   1 gun  → single Base/Corrected boxes (the per-gun panel would just echo them).
 *   2+ guns → hide the single boxes; the per-gun panel below is the source of truth.
 * The per-section card view is no longer used in either case — the per-gun
 * panel groups by section anyway, so cards became redundant.
 */
function renderMissionSolutions(missionType, sectionSolutions, totalGuns) {
    const outputs = MISSION_OUTPUTS[missionType];
    const baseBox = document.getElementById(outputs.baseResults);
    const corrBox = document.getElementById(outputs.correctedResults);
    const sectionContainer = document.getElementById(outputs.sectionSolutions);

    // Per-section cards stay hidden in normal use; keep the container empty.
    if (sectionContainer) {
        sectionContainer.style.display = 'none';
        sectionContainer.innerHTML = '';
    }

    if (totalGuns <= 1) {
        const only = sectionSolutions[0];
        displayBaseResults(missionType, only.range, only.solution);
    } else {
        if (baseBox) baseBox.style.display = 'none';
        if (corrBox) corrBox.style.display = 'none';
        // Trajectory-info is the single-gun companion box — hide when per-gun
        // panel is in play.
        const trajBox = document.getElementById(outputs.trajectoryInfo);
        if (trajBox) trajBox.style.display = 'none';
    }
}

function renderSectionSolutionsHTML(sectionSolutions, missionType) {
    const cards = sectionSolutions.map(s => renderSectionCardHTML(s, missionType)).join('');
    const hasTOT = sectionSolutions.some(s => s.fireDelay !== undefined);
    const totBanner = hasTOT
        ? `<div class="section-solutions-tot-note">TOT staggered: all rounds land at the same moment. The section that fires first carries delay <strong>+0.0s</strong>; others wait by the amount shown.</div>`
        : '';
    return `<h3>Fire Solution per Section</h3>${totBanner}${cards}`;
}

function renderSectionCardHTML({ section, range, shell, rings, referenceGun, solution, fireDelay }, missionType) {
    const dispersion = Settings.getDispersion(missionType, shell, rings);
    const dispersionTag = (dispersion !== null) ? ` • ±${dispersion}m` : '';
    const delayTag = (fireDelay !== undefined)
        ? `<div class="section-solution-tot">Fire delay: <strong>+${fireDelay.toFixed(1)}s</strong></div>`
        : '';

    return `
        <div class="section-solution-card">
            <div class="section-solution-header">
                <span class="section-solution-title">Section ${section}</span>
                <span class="section-solution-meta">${shell} • ${rings} rings • ref. gun ${referenceGun}${dispersionTag}</span>
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
            ${delayTag}
        </div>
    `;
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

    // Trajectory-info panel: peak altitude + angle of impact + (when present)
    // a wind-correction breakdown line. Only shown when the active platform's
    // firing table actually provides these fields.
    const trajBox = document.getElementById(o.trajectoryInfo);
    if (trajBox) {
        const hasExtras = sol.peakAlt != null || sol.angleOfImpact != null
                       || sol.windAdjMils !== 0 || sol.windAdjRangeM !== 0;
        if (hasExtras) {
            document.getElementById(o.peakAlt).textContent = (sol.peakAlt != null) ? Math.round(sol.peakAlt) : '—';
            document.getElementById(o.angleOfImpact).textContent = (sol.angleOfImpact != null) ? sol.angleOfImpact.toFixed(1) : '—';
            const windRow = document.getElementById(o.windCorrRow);
            if (sol.windAdjMils || sol.windAdjRangeM) {
                document.getElementById(o.windCorr).textContent =
                    `${sol.windAdjMils >= 0 ? '+' : ''}${Math.round(sol.windAdjMils)} mils az · ${sol.windAdjRangeM >= 0 ? '+' : ''}${Math.round(sol.windAdjRangeM)} m range`;
                windRow.style.display = '';
            } else if (windRow) {
                windRow.style.display = 'none';
            }
            trajBox.style.display = 'block';
        } else {
            trajBox.style.display = 'none';
        }
    }

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
            showAlertModal('Sheaf Parameters', 'Please enter sheaf length and direction for the linear sheaf.');
            return null;
        }
        const targets = calculateLinearSheafTargets(targetX, targetY, sheafLength / 10, sheafDirection, totalGuns);
        return computePerGunSheaf(missionType, spans, targets, targetAlt, addDrop, leftRight, foDirDeg, correctionMode);
    }

    if (sheafType === 'circular') {
        const inputs = MISSION_INPUTS[missionType];
        const sheafDiameter = parseFloat(document.getElementById(inputs.sheafDiameter).value);
        if (!sheafDiameter || sheafDiameter <= 0) {
            showAlertModal('Sheaf Parameters', 'Please enter a valid sheaf diameter for the circular sheaf.');
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
                showAlertModal('Missing Coordinates', `Please enter coordinates for Gun ${i}.`);
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
                showAlertModal('Missing Coordinates', `Please enter coordinates for Gun ${i}.`);
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

// In-memory cache of the per-gun solutions currently rendered for each mission.
// Used by getMissionData() so we don't have to round-trip through the rendered
// text (which is fragile when display lines are added/removed, e.g. TOT delay).
const renderedGunSolutions = { grid: null, polar: null, shift: null };

function displayGunSolutions(solutions, containerId) {
    const container = document.getElementById(containerId);

    // Cache by mission type — derived from the container id suffix.
    const missionType = containerId.endsWith('grid') ? 'grid'
                      : containerId.endsWith('polar') ? 'polar'
                      : containerId.endsWith('shift') ? 'shift'
                      : null;
    if (missionType) {
        renderedGunSolutions[missionType] = solutions ? solutions.slice() : null;
    }

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
            if (sol.fireDelay !== undefined) {
                output += `    TOT delay: +${sol.fireDelay.toFixed(1)} sec\n`;
            }
            if (sol.peakAlt != null) {
                output += `    Peak Alt: ${Math.round(sol.peakAlt)} m\n`;
            }
            if (sol.angleOfImpact != null) {
                output += `    Angle of Impact: ${sol.angleOfImpact.toFixed(1)}°\n`;
            }
            if (sol.windAdjMils || sol.windAdjRangeM) {
                const az = sol.windAdjMils >= 0 ? `+${Math.round(sol.windAdjMils)}` : `${Math.round(sol.windAdjMils)}`;
                const rng = sol.windAdjRangeM >= 0 ? `+${Math.round(sol.windAdjRangeM)}` : `${Math.round(sol.windAdjRangeM)}`;
                output += `    Wind: ${az} mils az, ${rng} m range\n`;
            }
            if (sol.targetX !== undefined && sol.targetY !== undefined) {
                output += `    Target: (${formatCoordPair(sol.targetX, sol.targetY)})\n`;
            }
            output += '\n';
        });
    });
    container.textContent = output;
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Validation for the "press Calculate" path. Target number and round count
 * are NOT required here — those are only enforced at log-mission time so the
 * user can iterate on a fire solution without filling in the paperwork.
 *
 * Returns:
 *   {
 *     fieldErrors: { fieldId: 'message', ... },  // rendered inline
 *     generalErrors: [ 'message', ... ]           // rendered in a modal
 *   }
 */
function validateMissionFields(missionType) {
    const fieldErrors = {};
    const generalErrors = [];

    const selectedSections = getSelectedSections(missionType);
    if (selectedSections.length === 0) {
        generalErrors.push('Please select at least one section to fire.');
    }

    if (missionType === 'grid') {
        const x = parseFloat(document.getElementById('target-x').value);
        const y = parseFloat(document.getElementById('target-y').value);
        if (isNaN(x)) fieldErrors['target-x'] = 'Enter a valid X coordinate';
        if (isNaN(y)) fieldErrors['target-y'] = 'Enter a valid Y coordinate';
    } else if (missionType === 'polar') {
        const foX = parseFloat(document.getElementById('fo-x-polar').value);
        const foY = parseFloat(document.getElementById('fo-y-polar').value);
        const foDist = parseFloat(document.getElementById('fo-dist-polar').value);
        const foDir = parseFloat(document.getElementById('fo-dir-polar').value);
        if (isNaN(foX)) fieldErrors['fo-x-polar'] = 'Enter a valid X coordinate';
        if (isNaN(foY)) fieldErrors['fo-y-polar'] = 'Enter a valid Y coordinate';
        if (isNaN(foDist) || foDist <= 0) fieldErrors['fo-dist-polar'] = 'Enter a positive distance';
        if (isNaN(foDir)) fieldErrors['fo-dir-polar'] = 'Enter a direction in degrees';
    } else if (missionType === 'shift') {
        if (!document.getElementById('known-point-select').value) {
            fieldErrors['known-point-select'] = 'Pick a known point';
        }
        const sx = parseFloat(document.getElementById('shift-x').value);
        const sy = parseFloat(document.getElementById('shift-y').value);
        if (isNaN(sx)) fieldErrors['shift-x'] = 'Enter X shift in metres';
        if (isNaN(sy)) fieldErrors['shift-y'] = 'Enter Y shift in metres';
    }

    // Mortar coordinates for every gun in every selected section.
    const config = getGunConfiguration();
    let globalIdx = 0;
    for (const cfg of config) {
        for (let g = 1; g <= cfg.guns; g++) {
            globalIdx++;
            if (!selectedSections.includes(cfg.section)) continue;
            const coords = getMortarCoordinatesBySection(cfg.section, g);
            if (!coords.x || !coords.y) {
                const baseId = `section-${cfg.section}-gun-${g}`;
                if (!coords.x) fieldErrors[`${baseId}-x`] = 'Required';
                if (!coords.y) fieldErrors[`${baseId}-y`] = 'Required';
            }
        }
    }

    return { fieldErrors, generalErrors };
}

/**
 * Apply a validation result to the UI. Returns true if there were any errors
 * (so the caller can stop), false if everything is clean.
 */
function applyValidationResult(result) {
    clearAllFieldErrors();
    Object.entries(result.fieldErrors).forEach(([id, msg]) => setFieldError(id, msg));

    const hasFieldErrors = Object.keys(result.fieldErrors).length > 0;
    if (result.generalErrors.length) {
        showAlertModal('Validation Error', result.generalErrors.join('\n'));
    }
    return hasFieldErrors || result.generalErrors.length > 0;
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
        platform: Settings.getActivePlatformId(missionType),
        arc: Settings.platformSupportsArcs(missionType) ? Settings.getArc(missionType) : null,
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

    // Per-section per-gun solutions — pulled from the in-memory cache that
    // displayGunSolutions populated. Way more robust than re-parsing the
    // rendered text (which used to break whenever a new line like "TOT delay"
    // was added to the output).
    const cached = renderedGunSolutions[missionType];
    if (cached && cached.length) {
        md.sectionSolutions = {};
        cached.forEach(sol => {
            const sec = sol.section;
            if (!md.sectionSolutions[sec]) {
                const shellEl = document.getElementById(`section-${sec}-shell-${missionType}`);
                const ringsEl = document.getElementById(`section-${sec}-rings-${missionType}`);
                md.sectionSolutions[sec] = {
                    shell: shellEl ? shellEl.value : 'HE',
                    rings: ringsEl ? parseInt(ringsEl.value) : 0,
                    guns: []
                };
            }
            const gun = {
                gun: sol.gun,
                azimuth: sol.azimuth,
                elevation: sol.elevation,
                tof: sol.tof
            };
            if (sol.targetX !== undefined) gun.targetX = sol.targetX;
            if (sol.targetY !== undefined) gun.targetY = sol.targetY;
            if (sol.fireDelay !== undefined) gun.fireDelay = sol.fireDelay;
            if (sol.peakAlt != null) gun.peakAlt = sol.peakAlt;
            if (sol.angleOfImpact != null) gun.angleOfImpact = sol.angleOfImpact;
            if (sol.windAdjMils) gun.windAdjMils = sol.windAdjMils;
            if (sol.windAdjRangeM) gun.windAdjRangeM = sol.windAdjRangeM;
            md.sectionSolutions[sec].guns.push(gun);
        });
    }

    return md;
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
    'base-results-grid', 'corrected-results-grid', 'section-solutions-grid', 'trajectory-info-grid', 'mini-map-grid', 'gun-solutions-content-grid',
    'base-results-polar', 'corrected-results-polar', 'section-solutions-polar', 'trajectory-info-polar', 'mini-map-polar', 'gun-solutions-content-polar',
    'base-results-shift', 'corrected-results-shift', 'section-solutions-shift', 'trajectory-info-shift', 'mini-map-shift', 'gun-solutions-content-shift'
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

    renderedGunSolutions[missionType] = null;
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

/**
 * Open a clean print window with the current MTO formatted for a radio
 * call-out — monospace, big text, no app chrome. The opened window is
 * self-contained so closing this tab won't blank it.
 */
function printCurrentMTO() {
    if (!currentMissionData) {
        showAlertModal('No Mission', 'No mission to print — calculate a fire solution first.');
        return;
    }
    const md = currentMissionData;
    const win = window.open('', 'print-mto', 'width=720,height=900');
    if (!win) {
        showAlertModal('Popup Blocked', 'Allow popups for this page to use Print MTO.');
        return;
    }
    win.document.write(buildPrintMTOHTML(md));
    win.document.close();
    win.focus();
}

function buildPrintMTOHTML(md) {
    const ts = new Date(md.timestamp || Date.now()).toLocaleString();
    const targetLine = (md.targetX !== undefined && md.targetY !== undefined)
        ? `${formatCoordPair(md.targetX, md.targetY)}`
        : '—';

    let sections = '';
    if (md.sectionSolutions && Object.keys(md.sectionSolutions).length) {
        sections = '<h2>Sections</h2>';
        Object.entries(md.sectionSolutions).sort().forEach(([num, sec]) => {
            const guns = sec.guns.map(g => {
                const tot = (g.fireDelay !== undefined) ? `   TOT +${g.fireDelay.toFixed(1)}s` : '';
                return `   GUN ${g.gun}   AZ ${Math.round(g.azimuth)}   EL ${Math.round(g.elevation)}   TOF ${g.tof.toFixed(1)}s${tot}`;
            }).join('\n');
            sections += `<pre>SECTION ${num}   ${sec.shell} × ${sec.rings} rings\n${guns}</pre>`;
        });
    } else if (md.baseSolution) {
        const az = Math.round(md.baseSolution.azimuth);
        const el = Math.round(md.baseSolution.elevation);
        const tof = md.baseSolution.tof.toFixed(1);
        sections = `<pre>AZ ${az}   EL ${el}   TOF ${tof}s</pre>`;
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>MTO ${md.targetNumber || ''}</title>
<style>
    body { font-family: 'Courier New', Consolas, monospace; padding: 24px; color: #000; font-size: 18px; line-height: 1.4; }
    h1 { margin: 0 0 4px; font-size: 28px; border-bottom: 3px solid #000; padding-bottom: 8px; letter-spacing: 0.03em; }
    .meta { color: #555; font-size: 14px; margin-bottom: 18px; }
    .row { display: flex; padding: 6px 0; border-bottom: 1px dashed #999; font-size: 18px; }
    .row .k { width: 200px; font-weight: bold; }
    h2 { margin: 22px 0 8px; font-size: 20px; border-bottom: 2px solid #000; padding-bottom: 4px; }
    pre { background: #f5f5f5; padding: 10px 12px; border-left: 4px solid #000; font-size: 16px; margin: 6px 0; }
    .actions { margin-top: 26px; display: flex; gap: 12px; }
    button { padding: 10px 20px; font-size: 15px; font-family: inherit; cursor: pointer; border: 2px solid #000; background: #fff; }
    @media print { .actions { display: none; } body { padding: 12px; } }
</style>
</head>
<body>
    <h1>MESSAGE TO OBSERVER</h1>
    <div class="meta">${ts} · ${(md.missionType || '').toUpperCase()} mission</div>

    <div class="row"><div class="k">Target Number</div><div>${md.targetNumber || '—'}</div></div>
    <div class="row"><div class="k">Target Coords</div><div>${targetLine}</div></div>
    <div class="row"><div class="k">Target Altitude</div><div>${md.targetAltitude !== undefined ? md.targetAltitude + ' m' : '—'}</div></div>
    <div class="row"><div class="k">Amount of Rounds</div><div>${md.amountRounds || '—'}</div></div>
    <div class="row"><div class="k">Number of Guns</div><div>${md.numGuns || '—'}</div></div>

    ${sections}

    <div class="actions">
        <button onclick="window.print()">Print</button>
        <button onclick="window.close()">Close</button>
    </div>
</body>
</html>`;
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
    document.getElementById('nfa-warning-coords').textContent = `(${formatCoordPair(nfaViolation.nfa.x, nfaViolation.nfa.y)})`;
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
