/**
 * Mortar Ballistics Calculator - Persistent Records
 *
 * Copyright (c) 2024 C-gamer_DX. All rights reserved.
 *
 * Owns the three localStorage-backed record types:
 *   - knownPoints   (pre-registered targets, drive Shift From Known Point)
 *   - nfas          (no-fire areas, checked before every mission)
 *   - loggedMissions (history of fired solutions)
 */

// ============================================================================
// Known points
// ============================================================================

let editingKnownPointId = null;

function displayKnownPoints() {
    const container = document.getElementById('known-points-list');
    const knownPoints = JSON.parse(localStorage.getItem('knownPoints') || '[]');

    if (knownPoints.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666;">No known points saved yet.</p>';
        return;
    }

    knownPoints.sort((a, b) => a.targetNumber.localeCompare(b.targetNumber));

    container.innerHTML = knownPoints.map(point => `
        <div class="logged-mission" onclick="toggleKnownPointDetails('${point.id}')">
            <div class="logged-mission-header">
                <span class="logged-mission-target">${point.targetNumber}</span>
                <span class="logged-mission-coordinates">(${formatCoordPair(point.x, point.y)})</span>
            </div>
            <div class="logged-mission-summary" id="known-point-summary-${point.id}" style="display: none;">
                <div class="logged-mission-detail">
                    <span class="logged-mission-detail-label">Coordinates:</span>
                    <span class="logged-mission-detail-value">X: ${formatCoord(point.x)}, Y: ${formatCoord(point.y)}</span>
                </div>
                <div class="logged-mission-detail">
                    <span class="logged-mission-detail-label">Altitude:</span>
                    <span class="logged-mission-detail-value">${point.altitude} m</span>
                </div>
                <div class="logged-mission-detail">
                    <span class="logged-mission-detail-label">Created:</span>
                    <span class="logged-mission-detail-value">${new Date(point.timestamp).toLocaleString()}</span>
                </div>
                <div style="margin-top: 10px;">
                    <button onclick="fireAtKnownPoint('${point.id}')" style="background: #4ade80; color: #0a0f0c; padding: 5px 10px; border: none; border-radius: 3px; margin-right: 5px; cursor: pointer; font-weight: 600;">Fire</button>
                    <button onclick="editKnownPoint('${point.id}')" style="background: #2196F3; color: white; padding: 5px 10px; border: none; border-radius: 3px; margin-right: 5px; cursor: pointer;">Edit</button>
                    <button onclick="deleteKnownPoint('${point.id}')" style="background: #f44336; color: white; padding: 5px 10px; border: none; border-radius: 3px; cursor: pointer;">Delete</button>
                </div>
            </div>
        </div>
    `).join('');
}

/**
 * Pre-fill the Grid Mission page with this known point's coordinates and
 * navigate to it. The user can immediately press Calculate, or tweak fields
 * first. Target altitude defaults to the known point's altitude.
 */
function fireAtKnownPoint(pointId) {
    if (typeof event !== 'undefined' && event) event.stopPropagation();
    const knownPoints = JSON.parse(localStorage.getItem('knownPoints') || '[]');
    const point = knownPoints.find(p => p.id === pointId);
    if (!point) return;

    const setIfPresent = (id, value) => {
        const el = document.getElementById(id);
        if (el) {
            el.value = value;
            el.dispatchEvent(new Event('input', { bubbles: true }));
        }
    };

    setIfPresent('target-x', point.x);
    setIfPresent('target-y', point.y);
    setIfPresent('target-alt', point.altitude || 0);
    setIfPresent('target-number-grid', point.targetNumber || '');

    showPage('grid-mission');
}

function toggleKnownPointDetails(pointId) {
    const summary = document.getElementById(`known-point-summary-${pointId}`);
    summary.style.display = summary.style.display === 'none' ? 'block' : 'none';
}

function addNewKnownPoint() {
    showKnownPointModal('Add Known Point');
}

function editKnownPoint(pointId) {
    event.stopPropagation();
    const knownPoints = JSON.parse(localStorage.getItem('knownPoints') || '[]');
    const point = knownPoints.find(p => p.id === pointId);
    if (!point) return;
    showKnownPointModal('Edit Known Point', point);
}

function deleteKnownPoint(pointId) {
    event.stopPropagation();
    showConfirmModal('Delete Known Point', 'Are you sure you want to delete this known point?', () => {
        const filtered = JSON.parse(localStorage.getItem('knownPoints') || '[]')
            .filter(p => p.id !== pointId);
        localStorage.setItem('knownPoints', JSON.stringify(filtered));
        displayKnownPoints();
        updateKnownPointDropdown();
    });
}

function deleteAllKnownPoints() {
    showConfirmModal('Delete All Known Points', 'Are you sure you want to delete all known points? This action cannot be undone.', () => {
        localStorage.removeItem('knownPoints');
        displayKnownPoints();
        updateKnownPointDropdown();

        const container = document.getElementById('known-points-list');
        container.innerHTML = '<p style="color: #4CAF50; text-align: center; font-weight: bold;">All known points have been deleted successfully.</p>';
        setTimeout(displayKnownPoints, 3000);
    });
}

function updateKnownPointDropdown() {
    const dropdown = document.getElementById('known-point-select');
    if (!dropdown) return;

    const knownPoints = JSON.parse(localStorage.getItem('knownPoints') || '[]');
    dropdown.innerHTML = '<option value="">Select a known point...</option>';
    knownPoints.sort((a, b) => a.targetNumber.localeCompare(b.targetNumber));

    knownPoints.forEach(point => {
        const opt = document.createElement('option');
        opt.value = point.id;
        opt.textContent = `${point.targetNumber} (${formatCoordPair(point.x, point.y)})`;
        dropdown.appendChild(opt);
    });
}

function showKnownPointModal(title = 'Add Known Point', point = null) {
    document.getElementById('known-point-title').textContent = title;
    document.getElementById('known-point-number').value = point ? point.targetNumber : '';
    document.getElementById('known-point-x').value = point ? point.x : '';
    document.getElementById('known-point-y').value = point ? point.y : '';
    document.getElementById('known-point-altitude').value = point ? point.altitude : '';
    editingKnownPointId = point ? point.id : null;
    document.getElementById('add-known-point-modal').style.display = 'block';
}

function closeKnownPointModal() {
    document.getElementById('add-known-point-modal').style.display = 'none';
    editingKnownPointId = null;
}

function saveKnownPoint() {
    const targetNumber = document.getElementById('known-point-number').value.trim();
    const x = document.getElementById('known-point-x').value;
    const y = document.getElementById('known-point-y').value;
    const altitude = document.getElementById('known-point-altitude').value;

    const errors = [];
    if (!targetNumber) errors.push('Target number is required');
    if (!x || isNaN(x)) errors.push('Valid X coordinate is required');
    if (!y || isNaN(y)) errors.push('Valid Y coordinate is required');
    if (!altitude || isNaN(altitude)) errors.push('Valid altitude is required');
    if (errors.length) {
        showAlertModal('Validation Error', 'Please fix the following errors:\n\n' + errors.join('\n'));
        return;
    }

    const knownPoints = JSON.parse(localStorage.getItem('knownPoints') || '[]');
    if (editingKnownPointId) {
        const idx = knownPoints.findIndex(p => p.id === editingKnownPointId);
        if (idx !== -1) {
            knownPoints[idx] = {
                ...knownPoints[idx],
                targetNumber: targetNumber,
                x: parseFloat(x), y: parseFloat(y),
                altitude: parseFloat(altitude)
            };
        }
    } else {
        knownPoints.push({
            id: Date.now().toString(),
            targetNumber: targetNumber,
            x: parseFloat(x), y: parseFloat(y),
            altitude: parseFloat(altitude),
            timestamp: Date.now()
        });
    }

    localStorage.setItem('knownPoints', JSON.stringify(knownPoints));

    const action = editingKnownPointId ? 'updated' : 'added';
    closeKnownPointModal();
    displayKnownPoints();
    updateKnownPointDropdown();
    showAlertModal('Success', `Known point ${action} successfully!`);
}

// ============================================================================
// No-fire areas
// ============================================================================

function displayNFAs() {
    const container = document.getElementById('nfa-list');
    const nfas = JSON.parse(localStorage.getItem('nfas') || '[]');

    if (nfas.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666;">No NFAs saved yet.</p>';
        return;
    }

    nfas.sort((a, b) => a.name.localeCompare(b.name));

    container.innerHTML = nfas.map(nfa => `
        <div class="logged-mission" onclick="toggleNFADetails('${nfa.id}')">
            <div class="logged-mission-header">
                <span class="logged-mission-target">${nfa.name}</span>
                <span class="logged-mission-coordinates">(${formatCoordPair(nfa.x, nfa.y)}) - ${nfa.diameter}m</span>
            </div>
            <div class="logged-mission-summary" id="nfa-summary-${nfa.id}" style="display: none;">
                <div class="logged-mission-detail">
                    <span class="logged-mission-detail-label">Location:</span>
                    <span class="logged-mission-detail-value">X: ${formatCoord(nfa.x)}, Y: ${formatCoord(nfa.y)}</span>
                </div>
                <div class="logged-mission-detail">
                    <span class="logged-mission-detail-label">Diameter:</span>
                    <span class="logged-mission-detail-value">${nfa.diameter} m</span>
                </div>
                <div class="logged-mission-detail">
                    <span class="logged-mission-detail-label">Issued by:</span>
                    <span class="logged-mission-detail-value">${nfa.issuedBy || 'N/A'}</span>
                </div>
                <div class="logged-mission-detail">
                    <span class="logged-mission-detail-label">Created:</span>
                    <span class="logged-mission-detail-value">${new Date(nfa.timestamp).toLocaleString()}</span>
                </div>
                <div style="margin-top: 10px;">
                    <button onclick="editNFA('${nfa.id}')" style="background: #2196F3; color: white; padding: 5px 10px; border: none; border-radius: 3px; margin-right: 5px; cursor: pointer;">Edit</button>
                    <button onclick="deleteNFA('${nfa.id}')" style="background: #f44336; color: white; padding: 5px 10px; border: none; border-radius: 3px; cursor: pointer;">Delete</button>
                </div>
            </div>
        </div>
    `).join('');
}

function toggleNFADetails(nfaId) {
    const summary = document.getElementById(`nfa-summary-${nfaId}`);
    summary.style.display = summary.style.display === 'none' ? 'block' : 'none';
}

function addNewNFA() {
    document.getElementById('nfa-name').value = '';
    document.getElementById('nfa-x').value = '';
    document.getElementById('nfa-y').value = '';
    document.getElementById('nfa-diameter').value = '';
    document.getElementById('nfa-issued-by').value = '';
    document.getElementById('add-nfa-modal').style.display = 'block';
}

function closeAddNFAModal() {
    const modal = document.getElementById('add-nfa-modal');
    modal.style.display = 'none';
    modal.removeAttribute('data-editing-nfa-id');
    document.querySelector('#add-nfa-modal h2').textContent = 'Add New No Fire Area (NFA)';
    document.querySelector('#add-nfa-modal button[onclick="saveNewNFA()"]').textContent = 'Save NFA';
}

function saveNewNFA() {
    const name = document.getElementById('nfa-name').value.trim();
    const x = document.getElementById('nfa-x').value;
    const y = document.getElementById('nfa-y').value;
    const diameter = document.getElementById('nfa-diameter').value;
    const issuedBy = document.getElementById('nfa-issued-by').value.trim();

    const errors = [];
    if (!name) errors.push('NFA name is required');
    if (!x || isNaN(x)) errors.push('Valid X coordinate is required');
    if (!y || isNaN(y)) errors.push('Valid Y coordinate is required');
    if (!diameter || isNaN(diameter) || diameter <= 0) errors.push('Valid diameter is required');
    if (errors.length) {
        showAlertModal('Validation Error', 'Please fix the following errors:\n\n' + errors.join('\n'));
        return;
    }

    const nfas = JSON.parse(localStorage.getItem('nfas') || '[]');
    const editingId = document.getElementById('add-nfa-modal').getAttribute('data-editing-nfa-id');

    if (editingId) {
        const idx = nfas.findIndex(n => n.id === editingId);
        if (idx !== -1) {
            nfas[idx] = {
                ...nfas[idx],
                name: name,
                x: parseFloat(x), y: parseFloat(y),
                diameter: parseFloat(diameter),
                issuedBy: issuedBy || 'N/A'
            };
        }
    } else {
        nfas.push({
            id: Date.now().toString(),
            name: name,
            x: parseFloat(x), y: parseFloat(y),
            diameter: parseFloat(diameter),
            issuedBy: issuedBy || 'N/A',
            timestamp: Date.now()
        });
    }

    localStorage.setItem('nfas', JSON.stringify(nfas));
    closeAddNFAModal();
    displayNFAs();
    showAlertModal('Success', `NFA ${editingId ? 'updated' : 'added'} successfully!`);
}

function editNFA(nfaId) {
    event.stopPropagation();
    const nfa = JSON.parse(localStorage.getItem('nfas') || '[]').find(n => n.id === nfaId);
    if (!nfa) return;

    document.getElementById('nfa-name').value = nfa.name;
    document.getElementById('nfa-x').value = nfa.x;
    document.getElementById('nfa-y').value = nfa.y;
    document.getElementById('nfa-diameter').value = nfa.diameter;
    document.getElementById('nfa-issued-by').value = nfa.issuedBy === 'N/A' ? '' : nfa.issuedBy;

    const modal = document.getElementById('add-nfa-modal');
    modal.setAttribute('data-editing-nfa-id', nfaId);
    document.querySelector('#add-nfa-modal h2').textContent = 'Edit No Fire Area (NFA)';
    document.querySelector('#add-nfa-modal button[onclick="saveNewNFA()"]').textContent = 'Update NFA';
    modal.style.display = 'block';
}

function deleteNFA(nfaId) {
    event.stopPropagation();
    showConfirmModal('Delete NFA', 'Are you sure you want to delete this NFA?', () => {
        const filtered = JSON.parse(localStorage.getItem('nfas') || '[]').filter(n => n.id !== nfaId);
        localStorage.setItem('nfas', JSON.stringify(filtered));
        displayNFAs();
    });
}

function deleteAllNFAs() {
    showConfirmModal('Delete All NFAs', 'Are you sure you want to delete all NFAs? This action cannot be undone.', () => {
        localStorage.removeItem('nfas');
        displayNFAs();
        document.getElementById('nfa-list').innerHTML = '<p style="color: #4CAF50; text-align: center; font-weight: bold;">All NFAs have been deleted successfully.</p>';
        setTimeout(displayNFAs, 3000);
    });
}

/**
 * Is `(targetX, targetY)` inside any registered NFA circle? Returns
 * `{violated: true, nfa, distance}` for the first hit, otherwise
 * `{violated: false}`.
 */
function checkNFAViolation(targetX, targetY) {
    const nfas = JSON.parse(localStorage.getItem('nfas') || '[]');
    for (const nfa of nfas) {
        const distance = Math.sqrt(
            Math.pow(targetX - nfa.x, 2) + Math.pow(targetY - nfa.y, 2)
        );
        if (distance <= nfa.diameter / 2) {
            return { violated: true, nfa: nfa, distance: distance };
        }
    }
    return { violated: false };
}

// ============================================================================
// Logged missions
// ============================================================================

function displayLoggedMissions() {
    const container = document.getElementById('logged-missions-list');
    const loggedMissions = JSON.parse(localStorage.getItem('loggedMissions') || '[]');

    if (loggedMissions.length === 0) {
        container.innerHTML = '<p>No logged fire missions found.</p>';
        return;
    }

    // Clean up any missions missing required properties (back-fill defaults).
    const cleaned = loggedMissions.filter(m => m && typeof m === 'object').map(m => ({
        ...m,
        missionType: m.missionType || 'Unknown',
        id: m.id || (Date.now() + Math.random()),
        timestamp: m.timestamp || new Date().toISOString()
    }));
    if (cleaned.length !== loggedMissions.length) {
        localStorage.setItem('loggedMissions', JSON.stringify(cleaned));
    }

    cleaned.sort((a, b) => {
        const ta = (a.targetNumber || '').toLowerCase();
        const tb = (b.targetNumber || '').toLowerCase();
        return ta.localeCompare(tb, undefined, { numeric: true, sensitivity: 'base' });
    });

    container.innerHTML = '';
    cleaned.forEach(m => container.appendChild(createMissionElement(m)));
}

function getShellSummary(mission) {
    if (mission.sectionSolutions && Object.keys(mission.sectionSolutions).length) {
        return Object.keys(mission.sectionSolutions).sort().map(s => {
            const sd = mission.sectionSolutions[s];
            return `S${s}: ${sd.shell} (${sd.rings} rings)`;
        }).join(', ');
    }
    if (mission.sectionData && Object.keys(mission.sectionData).length) {
        return Object.keys(mission.sectionData).sort().map(s => {
            const sd = mission.sectionData[s];
            return `S${s}: ${sd.shell} (${sd.rings} rings)`;
        }).join(', ');
    }
    return `${mission.shellType || 'N/A'} (${mission.rings || 0} rings)`;
}

function createMissionElement(mission) {
    const div = document.createElement('div');
    div.className = 'logged-mission';

    const timestamp = new Date(mission.timestamp).toLocaleString();
    const title = mission.targetNumber || `Mission ${mission.id}`;

    div.innerHTML = `
        <div class="logged-mission-header" onclick="toggleMissionDetails(this.parentElement, ${JSON.stringify(mission).replace(/"/g, '&quot;')})">
            <div class="logged-mission-title">${title}</div>
            <div class="logged-mission-timestamp">${timestamp}</div>
            <button class="delete-mission-btn" onclick="deleteMission(${mission.id}, event)">Delete</button>
        </div>
        <div class="logged-mission-summary" style="display: none;">
            <div class="logged-mission-detail">
                <span class="logged-mission-detail-label">Type:</span>
                <span class="logged-mission-detail-value">${(mission.missionType || 'Unknown').toUpperCase()}</span>
            </div>
            <div class="logged-mission-detail">
                <span class="logged-mission-detail-label">Shell:</span>
                <span class="logged-mission-detail-value">${getShellSummary(mission)}</span>
            </div>
            <div class="logged-mission-detail">
                <span class="logged-mission-detail-label">Rounds:</span>
                <span class="logged-mission-detail-value">${mission.amountRounds || 'N/A'}</span>
            </div>
            <div class="logged-mission-detail">
                <span class="logged-mission-detail-label">Guns:</span>
                <span class="logged-mission-detail-value">${mission.numGuns || 'N/A'}</span>
            </div>
        </div>
        <div class="logged-mission-solutions" style="display: none;">
            ${createMissionSolutionsHTML(mission)}
        </div>
    `;
    return div;
}

function createMissionSolutionsHTML(mission) {
    let html = '';

    if (mission.baseSolution) {
        const az = parseFloat(mission.baseSolution.azimuth) || 0;
        const el = parseFloat(mission.baseSolution.elevation) || 0;
        const tof = parseFloat(mission.baseSolution.tof) || 0;
        html += `
            <h4>Base Fire Solution</h4>
            <div class="logged-mission-gun-solution">
                <div class="logged-mission-gun-solution-details">
                    <div><strong>Azimuth:</strong> ${Math.round(az)} mils</div>
                    <div><strong>Elevation:</strong> ${Math.round(el)} mils</div>
                    <div><strong>TOF:</strong> ${tof.toFixed(1)} sec</div>
                </div>
            </div>
        `;
    }

    if (mission.sectionSolutions && Object.keys(mission.sectionSolutions).length) {
        html += `<h4>Fire Solution per Section</h4>`;
        Object.keys(mission.sectionSolutions).forEach(sectionNumber => {
            const section = mission.sectionSolutions[sectionNumber];
            html += `
                <div class="logged-mission-section">
                    <div class="logged-mission-section-header">Section ${sectionNumber}</div>
                    <div class="logged-mission-section-details">
                        <div><strong>Shell:</strong> ${section.shell} (${section.rings} rings)</div>
                    </div>
                    <div class="logged-mission-section-guns">
                        ${section.guns.map(gun => {
                            const az = parseFloat(gun.azimuth) || 0;
                            const el = parseFloat(gun.elevation) || 0;
                            const tof = parseFloat(gun.tof) || 0;
                            const targetInfo = (gun.targetX !== undefined && gun.targetY !== undefined)
                                ? `<div><strong>Target:</strong> (${formatCoordPair(gun.targetX, gun.targetY)})</div>`
                                : '';
                            return `
                                <div class="logged-mission-gun-solution">
                                    <div class="logged-mission-gun-solution-header">Gun ${gun.gun}</div>
                                    <div class="logged-mission-gun-solution-details">
                                        <div><strong>Azimuth:</strong> ${Math.round(az)} mils</div>
                                        <div><strong>Elevation:</strong> ${Math.round(el)} mils</div>
                                        <div><strong>TOF:</strong> ${tof.toFixed(1)} sec</div>
                                        ${targetInfo}
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        });
    }

    // Legacy per-gun solutions block (kept for back-compat with older logs).
    if (mission.gunSolutions && mission.gunSolutions.length) {
        html += `
            <h4>Fire Solution per Gun (Legacy)</h4>
            ${mission.gunSolutions.map(sol => {
                const az = parseFloat(sol.azimuth) || 0;
                const el = parseFloat(sol.elevation) || 0;
                const tof = parseFloat(sol.tof) || 0;
                const targetInfo = (sol.targetX !== undefined && sol.targetY !== undefined)
                    ? `<div><strong>Target:</strong> (${formatCoordPair(sol.targetX, sol.targetY)})</div>`
                    : '';
                return `
                    <div class="logged-mission-gun-solution">
                        <div class="logged-mission-gun-solution-header">Gun ${sol.gunNumber}</div>
                        <div class="logged-mission-gun-solution-details">
                            <div><strong>Azimuth:</strong> ${Math.round(az)} mils</div>
                            <div><strong>Elevation:</strong> ${Math.round(el)} mils</div>
                            <div><strong>TOF:</strong> ${tof.toFixed(1)} sec</div>
                            ${targetInfo}
                        </div>
                    </div>
                `;
            }).join('')}
        `;
    }

    if (mission.correctedSolution) {
        const az = parseFloat(mission.correctedSolution.azimuthCorr) || 0;
        const el = parseFloat(mission.correctedSolution.elevationCorr) || 0;
        const tof = parseFloat(mission.correctedSolution.tofCorr) || 0;
        html += `
            <h4>Corrected Fire Solution</h4>
            <div class="logged-mission-gun-solution">
                <div class="logged-mission-gun-solution-details">
                    <div><strong>Azimuth:</strong> ${Math.round(az)} mils</div>
                    <div><strong>Elevation:</strong> ${Math.round(el)} mils</div>
                    <div><strong>TOF:</strong> ${tof.toFixed(1)} sec</div>
                </div>
            </div>
        `;
    }
    return html;
}

function deleteMission(missionId, event) {
    event.stopPropagation();
    showConfirmModal('Delete Fire Mission', 'Are you sure you want to delete this fire mission?', () => {
        const filtered = JSON.parse(localStorage.getItem('loggedMissions') || '[]')
            .filter(m => m.id !== missionId);
        localStorage.setItem('loggedMissions', JSON.stringify(filtered));
        displayLoggedMissions();
        showAlertModal('Success', 'Fire mission deleted successfully!');
    });
}

function toggleMissionDetails(element) {
    const summary = element.querySelector('.logged-mission-summary');
    const solutions = element.querySelector('.logged-mission-solutions');
    const hidden = summary.style.display === 'none';
    summary.style.display = hidden ? 'block' : 'none';
    solutions.style.display = hidden ? 'block' : 'none';
}

function deleteAllMissions() {
    showConfirmModal('Delete All Fire Missions', 'Are you sure you want to delete all logged fire missions? This action cannot be undone.', () => {
        localStorage.removeItem('loggedMissions');
        displayLoggedMissions();

        const container = document.getElementById('logged-missions-list');
        container.innerHTML = '<p style="color: #4CAF50; text-align: center; font-weight: bold;">All missions have been deleted successfully.</p>';
        setTimeout(displayLoggedMissions, 3000);
    });
}

/**
 * Save the currently-displayed mission to localStorage and (optionally) record
 * the target as a known point. Capped at 50 entries to prevent storage bloat.
 */
function logFireMission(missionType) {
    const missionData = getMissionData(missionType);
    if (!missionData) {
        showAlertModal('No Fire Solution', 'Please calculate a fire solution first before logging the mission.');
        return;
    }

    // Target number + amount of rounds are only required at log time so the
    // user can iterate on calculations without filling in the paperwork.
    // Inline-flag any that are missing.
    const inputs = MISSION_INPUTS[missionType];
    const targetNumber = (missionData.targetNumber || '').trim();
    const rounds = parseInt(missionData.amountRounds, 10);
    const missing = {};
    if (!targetNumber) missing[inputs.targetNumber] = 'Required to log';
    if (isNaN(rounds) || rounds <= 0) missing[inputs.amountRounds] = 'Required to log';
    if (Object.keys(missing).length) {
        clearAllFieldErrors();
        Object.entries(missing).forEach(([id, msg]) => setFieldError(id, msg));
        showAlertModal('Cannot Log Mission', 'Please fill in the highlighted mission details before logging.');
        return;
    }

    const hasBase = missionData.baseSolution && missionData.baseSolution.azimuth !== '-';
    const hasCorrected = missionData.correctedSolution && missionData.correctedSolution.azimuthCorr !== '-';
    const hasSections = missionData.sectionSolutions && Object.keys(missionData.sectionSolutions).length;
    if (!hasBase && !hasCorrected && !hasSections) {
        showAlertModal('No Fire Solution', 'Please calculate a fire solution first before logging the mission.');
        return;
    }

    const loggedMissions = JSON.parse(localStorage.getItem('loggedMissions') || '[]');
    loggedMissions.push(missionData);
    if (loggedMissions.length > 50) loggedMissions.splice(0, loggedMissions.length - 50);
    localStorage.setItem('loggedMissions', JSON.stringify(loggedMissions));

    // Auto-register the target as a known point (if not already).
    if (missionData.targetX !== undefined && missionData.targetY !== undefined) {
        const knownPoints = JSON.parse(localStorage.getItem('knownPoints') || '[]');
        if (!knownPoints.find(p => p.targetNumber === missionData.targetNumber)) {
            knownPoints.push({
                id: Date.now().toString() + '_kp',
                targetNumber: missionData.targetNumber,
                x: missionData.targetX,
                y: missionData.targetY,
                altitude: missionData.targetAltitude || 0,
                timestamp: Date.now()
            });
            localStorage.setItem('knownPoints', JSON.stringify(knownPoints));
        }
    }

    showAlertModal('Success', 'Fire mission logged successfully!');
    displayLoggedMissions();
    closeMTOModal();
    resetMissionFields(missionType);
}

// ============================================================================
// Mission templates (battery setup presets)
// ============================================================================
//
// A template captures the "battery configuration" subset of localStorage —
// section/gun counts, per-gun coordinates, per-section altitudes, the active
// platform per mission, and the per-section shell + ring selections.
// Mission-instance inputs (target coords, FO data, sheaf params, etc.) are
// NOT included; those are per-fire-mission and shouldn't be replayed.

const TEMPLATE_KEY_PATTERNS = [
    /^numSections$/,
    /^numGuns$/,
    /^section-\d+-guns$/,
    /^section-\d+-alt$/,
    /^section-\d+-gun-\d+-[xy]$/,
    /^platform(-polar|-shift)?$/,
    /^section-\d+-(shell|rings)-(grid|polar|shift)$/,
    /^global-wind-(speed|from-deg)$/
];

function captureCurrentTemplate() {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (TEMPLATE_KEY_PATTERNS.some(rx => rx.test(key))) {
            data[key] = localStorage.getItem(key);
        }
    }
    return data;
}

function displayTemplates() {
    const container = document.getElementById('templates-list');
    if (!container) return;

    const templates = JSON.parse(localStorage.getItem('missionTemplates') || '[]');
    if (templates.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666;">No templates saved yet. Set up your battery the way you want it, then click "Save Current Setup as Template".</p>';
        return;
    }

    templates.sort((a, b) => a.name.localeCompare(b.name));

    container.innerHTML = templates.map(t => `
        <div class="logged-mission">
            <div class="logged-mission-header">
                <span class="logged-mission-target">${t.name}</span>
                <span class="logged-mission-coordinates">${new Date(t.createdAt).toLocaleString()}</span>
            </div>
            <div style="padding: 10px;">
                <button onclick="loadTemplate('${t.id}')" style="background: #4ade80; color: #0a0f0c; padding: 6px 14px; border: none; border-radius: 4px; margin-right: 6px; cursor: pointer; font-weight: 600;">Load</button>
                <button onclick="renameTemplate('${t.id}')" style="background: #2196F3; color: white; padding: 6px 14px; border: none; border-radius: 4px; margin-right: 6px; cursor: pointer;">Rename</button>
                <button onclick="deleteTemplate('${t.id}')" style="background: #f44336; color: white; padding: 6px 14px; border: none; border-radius: 4px; cursor: pointer;">Delete</button>
            </div>
        </div>
    `).join('');
}

function saveCurrentAsTemplate() {
    showPromptModal('Save Template', 'Name for this battery setup:', '', (name) => {
        if (!name) return;
        const templates = JSON.parse(localStorage.getItem('missionTemplates') || '[]');
        templates.push({
            id: Date.now().toString(),
            name: name,
            createdAt: new Date().toISOString(),
            data: captureCurrentTemplate()
        });
        localStorage.setItem('missionTemplates', JSON.stringify(templates));
        displayTemplates();
        showAlertModal('Saved', `Template "${name}" saved.`);
    });
}

function loadTemplate(templateId) {
    const templates = JSON.parse(localStorage.getItem('missionTemplates') || '[]');
    const tpl = templates.find(t => t.id === templateId);
    if (!tpl) return;

    showConfirmModal(
        'Load Template?',
        `Loading "${tpl.name}" will replace your current battery setup (sections, gun positions, altitudes, platforms, shell/ring selections). Mission inputs like target coords are unaffected. Continue?`,
        () => {
            // Strip every template-scope key, then apply the saved values.
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (TEMPLATE_KEY_PATTERNS.some(rx => rx.test(key))) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(k => localStorage.removeItem(k));
            Object.entries(tpl.data).forEach(([k, v]) => localStorage.setItem(k, v));
            location.reload();
        }
    );
}

function renameTemplate(templateId) {
    const templates = JSON.parse(localStorage.getItem('missionTemplates') || '[]');
    const tpl = templates.find(t => t.id === templateId);
    if (!tpl) return;
    showPromptModal('Rename Template', 'New name:', tpl.name, (newName) => {
        if (!newName || newName === tpl.name) return;
        tpl.name = newName;
        localStorage.setItem('missionTemplates', JSON.stringify(templates));
        displayTemplates();
    });
}

function deleteTemplate(templateId) {
    const templates = JSON.parse(localStorage.getItem('missionTemplates') || '[]');
    const tpl = templates.find(t => t.id === templateId);
    if (!tpl) return;
    showConfirmModal(
        'Delete Template?',
        `Delete "${tpl.name}"? This cannot be undone.`,
        () => {
            const filtered = templates.filter(t => t.id !== templateId);
            localStorage.setItem('missionTemplates', JSON.stringify(filtered));
            displayTemplates();
        }
    );
}
