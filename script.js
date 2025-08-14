/**
 * Mortar Ballistics Calculator - Professional Fire Mission Planning Tool For Arma Reforger
 * 
 * Copyright (c) 2024 C-gamer_DX. All rights reserved.
 * 
 * This software is proprietary and confidential. Unauthorized copying, distribution,
 * modification, or use of this software, via any medium, is strictly prohibited.
 * 
 * For licensing inquiries, please contact the author.
 */

// Navigation history to track previous pages
let navigationHistory = [];

// Section Management Functions
function updateSectionConfiguration() {
    const numSections = parseInt(document.getElementById('num-sections').value);
    const container = document.getElementById('section-configuration-container');
    
    // Clear existing sections
    container.innerHTML = '';
    
    // Create sections based on the selected number
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
    }
    
    // Set default values for new sections
    for (let i = 1; i <= numSections; i++) {
        const sectionGunsSelect = document.getElementById(`section-${i}-guns`);
        
        if (sectionGunsSelect && !sectionGunsSelect.value) {
            sectionGunsSelect.value = '4'; // Default to 4 guns
        }
    }
    
    // Update mortar coordinates and section selections
    updateMortarCoordinates();
    updateSectionSelections();
    
    // Save the configuration
    saveGlobalData();
}

function updateSectionSelections() {
    const numSections = parseInt(document.getElementById('num-sections').value);
    const missionTypes = ['grid', 'polar', 'shift'];
    
    missionTypes.forEach(type => {
        const container = document.getElementById(`section-selection-${type}`);
        if (container) {
            // Clear existing sections
            container.innerHTML = '';
            
            // Create section checkboxes
            for (let i = 1; i <= numSections; i++) {
                const sectionDiv = document.createElement('div');
                sectionDiv.className = 'input-row';
                sectionDiv.innerHTML = `
                    <label><input type="checkbox" id="section-${i}-${type}" onchange="updateSectionSelection('${type}')" ${i === 1 ? 'checked' : ''} /> Section ${i}</label>
                `;
                container.appendChild(sectionDiv);
            }
        }
    });
    
    // Update shell configurations for all mission types
    updateMissionShellConfiguration('grid');
    updateMissionShellConfiguration('polar');
    updateMissionShellConfiguration('shift');
}

// Mission-specific shell configuration functions
function updateMissionShellConfiguration(missionType) {
    const numSections = parseInt(document.getElementById('num-sections').value);
    const container = document.getElementById(`shell-config-${missionType}`);
    
    if (!container) return;
    
    // Clear existing shell configurations
    container.innerHTML = '';
    
    // Create shell configurations for each section
    for (let i = 1; i <= numSections; i++) {
        const shellDiv = document.createElement('div');
        shellDiv.className = 'input-row';
        shellDiv.innerHTML = `
            <label>Section ${i} Shell Type:</label>
            <select id="section-${i}-shell-${missionType}" onchange="updateSectionRingsOptions${missionType.charAt(0).toUpperCase() + missionType.slice(1)}(${i})">
                <option value="HE">HE</option>
                <option value="SMOKE">SMOKE</option>
                <option value="ILUM">ILUM</option>
                <option value="PRACTICE">PRACTICE</option>
            </select>
        `;
        container.appendChild(shellDiv);
        
        const ringsDiv = document.createElement('div');
        ringsDiv.className = 'input-row';
        ringsDiv.innerHTML = `
            <label>Section ${i} Rings:</label>
            <select id="section-${i}-rings-${missionType}">
                <option value="0">0</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
            </select>
        `;
        container.appendChild(ringsDiv);
        
        // Add event listener for shell type change
        const shellSelect = document.getElementById(`section-${i}-shell-${missionType}`);
        if (shellSelect) {
            shellSelect.addEventListener('change', function() {
                if (missionType === 'grid') {
                    updateSectionRingsOptionsGrid(i);
                } else if (missionType === 'polar') {
                    updateSectionRingsOptionsPolar(i);
                } else if (missionType === 'shift') {
                    updateSectionRingsOptionsShift(i);
                }
            });
            
            // Trigger initial ring update for this section with a delay to ensure mortar coordinates are loaded
            setTimeout(() => {
                if (missionType === 'grid') {
                    updateSectionRingsOptionsGrid(i);
                } else if (missionType === 'polar') {
                    updateSectionRingsOptionsPolar(i);
                } else if (missionType === 'shift') {
                    updateSectionRingsOptionsShift(i);
                }
            }, 50);
        }
    }
}

function updateSectionSelection(missionType) {
    const allSectionsCheckbox = document.getElementById(`all-sections-${missionType}`);
    const numSections = parseInt(document.getElementById('num-sections').value);
    
    if (allSectionsCheckbox.checked) {
        // Uncheck all individual sections
        for (let i = 1; i <= numSections; i++) {
            const sectionCheckbox = document.getElementById(`section-${i}-${missionType}`);
            if (sectionCheckbox) {
                sectionCheckbox.checked = false;
            }
        }
    } else {
        // Check if at least one section is selected
        let hasSelection = false;
        for (let i = 1; i <= numSections; i++) {
            const sectionCheckbox = document.getElementById(`section-${i}-${missionType}`);
            if (sectionCheckbox && sectionCheckbox.checked) {
                hasSelection = true;
                break;
            }
        }
        
        // If no sections are selected, select the first one
        if (!hasSelection) {
            const firstSectionCheckbox = document.getElementById(`section-1-${missionType}`);
            if (firstSectionCheckbox) {
                firstSectionCheckbox.checked = true;
            }
        }
    }
}

function getSelectedSections(missionType) {
    const allSectionsCheckbox = document.getElementById(`all-sections-${missionType}`);
    const numSections = parseInt(document.getElementById('num-sections').value);
    
    if (allSectionsCheckbox && allSectionsCheckbox.checked) {
        // Return all sections
        const sections = [];
        for (let i = 1; i <= numSections; i++) {
            sections.push(i);
        }
        return sections;
    } else {
        // Return only selected sections
        const selectedSections = [];
        for (let i = 1; i <= numSections; i++) {
            const sectionCheckbox = document.getElementById(`section-${i}-${missionType}`);
            if (sectionCheckbox && sectionCheckbox.checked) {
                selectedSections.push(i);
            }
        }
        return selectedSections;
    }
}

function getTotalGuns() {
    const numSections = parseInt(document.getElementById('num-sections').value);
    let totalGuns = 0;
    
    for (let i = 1; i <= numSections; i++) {
        const sectionGunsSelect = document.getElementById(`section-${i}-guns`);
        if (sectionGunsSelect) {
            totalGuns += parseInt(sectionGunsSelect.value);
        }
    }
    
    return totalGuns;
}

function getGunConfiguration() {
    const numSections = parseInt(document.getElementById('num-sections').value);
    const configuration = [];
    
    for (let i = 1; i <= numSections; i++) {
        const sectionGunsSelect = document.getElementById(`section-${i}-guns`);
        if (sectionGunsSelect) {
            configuration.push({
                section: i,
                guns: parseInt(sectionGunsSelect.value)
            });
        }
    }
    
    return configuration;
}

function validateSectionSelection(missionType) {
    const selectedSections = getSelectedSections(missionType);
    
    if (selectedSections.length === 0) {
        showAlertModal('Section Selection Required', 'Please select at least one section to fire.');
        return false;
    }
    
    return true;
}

function showPage(pageId, addToHistory = true) {
    // Add current page to history before navigating (except for home page and when addToHistory is false)
    const currentPage = document.querySelector('.page.active');
    if (addToHistory && currentPage && currentPage.id !== 'home-page') {
        navigationHistory.push(currentPage.id);
    }
    
    // Hide all pages
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => {
        page.classList.remove('active');
    });
    
    // Show the selected page
    document.getElementById(pageId).classList.add('active');
    
    // Control floating buttons visibility
    const floatingHomeBtn = document.querySelector('.floating-home-btn');
    const floatingBackBtn = document.querySelector('.floating-back-btn');
    const floatingActionsGrid = document.getElementById('floating-actions-grid');
    const floatingActionsPolar = document.getElementById('floating-actions-polar');
    const floatingActionsShift = document.getElementById('floating-actions-shift');
    
    if (pageId === 'home-page') {
        floatingHomeBtn.style.display = 'none';
        floatingBackBtn.style.display = 'none';
        if (floatingActionsGrid) floatingActionsGrid.style.display = 'none';
        if (floatingActionsPolar) floatingActionsPolar.style.display = 'none';
        if (floatingActionsShift) floatingActionsShift.style.display = 'none';
        // Clear history when going to home
        navigationHistory = [];
    } else {
        floatingHomeBtn.style.display = 'block';
        floatingBackBtn.style.display = 'block';
        
        // Show/hide floating action buttons based on page
        if (floatingActionsGrid) {
            floatingActionsGrid.style.display = pageId === 'grid-mission' ? 'flex' : 'none';
        }
        if (floatingActionsPolar) {
            floatingActionsPolar.style.display = pageId === 'polar-mission' ? 'flex' : 'none';
        }
        if (floatingActionsShift) {
            floatingActionsShift.style.display = pageId === 'shift-from-known-point' ? 'flex' : 'none';
        }
    }
    
    // Load data for specific pages
    if (pageId === 'logged-missions') {
        displayLoggedMissions();
    } else if (pageId === 'known-points') {
        displayKnownPoints();
    } else if (pageId === 'nfa') {
        displayNFAs();
    } else if (pageId === 'shift-from-known-point') {
        updateKnownPointDropdown();
    }
}

function goBack() {
    if (navigationHistory.length > 0) {
        const previousPage = navigationHistory.pop();
        showPage(previousPage, false);
    } else {
        // If no history, go to home
        showPage('home-page', false);
    }
}

// Function to get the minimum required rings for a given range and shell type
function getMinimumRingsForRange(range, shell) {
    const firingTables = {
        HE: {
            0: 400,   // Max range for 0 rings
            1: 900,   // Max range for 1 ring
            2: 1600,  // Max range for 2 rings
            3: 2300,  // Max range for 3 rings
            4: 2900   // Max range for 4 rings
        },
        SMOKE: {
            1: 750,   // Max range for 1 ring
            2: 1400,  // Max range for 2 rings
            3: 1900,  // Max range for 3 rings
            4: 2400   // Max range for 4 rings
        },
        ILUM: {
            1: 750,   // Max range for 1 ring
            2: 1400,  // Max range for 2 rings
            3: 1900,  // Max range for 3 rings
            4: 2400   // Max range for 4 rings
        },
        PRACTICE: {
            0: 400,   // Max range for 0 rings
            1: 1000,  // Max range for 1 ring
            2: 1600,  // Max range for 2 rings
            3: 2300,  // Max range for 3 rings
            4: 2900   // Max range for 4 rings
        }
    };

    const shellTable = firingTables[shell];
    if (!shellTable) return null;

    // Find the minimum rings required for this range
    for (let rings = 0; rings <= 4; rings++) {
        if (shellTable[rings] && range <= shellTable[rings]) {
            return rings;
        }
    }
    
    return null; // Target is out of range
}

// Function to check if target is out of range
function checkTargetRange(range, shell) {
    const firingTables = {
        HE: { min: 50, max: 2900 },
        SMOKE: { min: 100, max: 2400 },
        ILUM: { min: 100, max: 2400 },
        PRACTICE: { min: 50, max: 2900 }
    };

    const shellLimits = firingTables[shell];
    if (!shellLimits) return { inRange: false, reason: "Invalid shell type" };

    if (range < shellLimits.min) {
        return { inRange: false, reason: "Target is too close" };
    } else if (range > shellLimits.max) {
        return { inRange: false, reason: "Target is too far" };
    }

    return { inRange: true };
}

// Function to calculate range between two points
function calculateRange(mortarX, mortarY, targetX, targetY) {
    return Math.sqrt(Math.pow(targetX - mortarX, 2) + Math.pow(targetY - mortarY, 2)) * 10;
}

function updateSectionRingsOptions(sectionNumber) {
    // This function is kept for backward compatibility but now delegates to mission-specific updates
    // Check which mission page is currently active and call the appropriate function
    const gridMission = document.getElementById('grid-mission');
    const polarMission = document.getElementById('polar-mission');
    const shiftMission = document.getElementById('shift-from-known-point');
    
    if (gridMission && gridMission.style.display !== 'none') {
        updateSectionRingsOptionsGrid(sectionNumber);
    } else if (polarMission && polarMission.style.display !== 'none') {
        updateSectionRingsOptionsPolar(sectionNumber);
    } else if (shiftMission && shiftMission.style.display !== 'none') {
        updateSectionRingsOptionsShift(sectionNumber);
    }
}

// Mission-specific ring update functions
function updateSectionRingsOptionsGrid(sectionNumber) {
    console.log(`=== GRID MISSION RING UPDATE FOR SECTION ${sectionNumber} ===`);
    
    const shell = document.getElementById(`section-${sectionNumber}-shell-grid`).value;
    const rings = document.getElementById(`section-${sectionNumber}-rings-grid`);
    
    if (!rings) {
        console.log(`ERROR: Rings dropdown not found for section ${sectionNumber}`);
        return;
    }
    
    rings.innerHTML = "";
    console.log(`Shell selected: ${shell}`);

    const options = (shell === "SMOKE" || shell === "ILUM") ? [1, 2, 3, 4] : [0, 1, 2, 3, 4];
    console.log(`Available ring options: ${options.join(', ')}`);
    
    // Try to get current target coordinates for automatic selection
    const targetX = parseFloat(document.getElementById("target-x").value);
    const targetY = parseFloat(document.getElementById("target-y").value);
    console.log(`Target coordinates: (${targetX}, ${targetY})`);
    
    // Get mortar coordinates for this section's second gun (base gun)
    let mortarX = null;
    let mortarY = null;
    
    const sectionGuns = parseInt(document.getElementById(`section-${sectionNumber}-guns`).value);
    console.log(`Section ${sectionNumber} has ${sectionGuns} guns`);
    
    if (sectionGuns >= 2) {
        const xElement = document.getElementById(`section-${sectionNumber}-gun-2-x`);
        const yElement = document.getElementById(`section-${sectionNumber}-gun-2-y`);
        
        if (xElement && yElement) {
            mortarX = parseFloat(xElement.value);
            mortarY = parseFloat(yElement.value);
            console.log(`Using Gun 2 coordinates: (${mortarX}, ${mortarY})`);
        } else {
            console.log(`ERROR: Mortar coordinate elements not found for section ${sectionNumber} gun 2`);
        }
    } else if (sectionGuns === 1) {
        // If only 1 gun in section, use that gun
        const xElement = document.getElementById(`section-${sectionNumber}-gun-1-x`);
        const yElement = document.getElementById(`section-${sectionNumber}-gun-1-y`);
        
        if (xElement && yElement) {
            mortarX = parseFloat(xElement.value);
            mortarY = parseFloat(yElement.value);
            console.log(`Using Gun 1 coordinates: (${mortarX}, ${mortarY})`);
        } else {
            console.log(`ERROR: Mortar coordinate elements not found for section ${sectionNumber} gun 1`);
        }
    }
    
    let autoSelectedRing = null;
    let rangeCheck = null;
    
    if (targetX && targetY && mortarX && mortarY) {
        const range = calculateRange(mortarX, mortarY, targetX, targetY);
        console.log(`Range calculated: ${range}m`);
        rangeCheck = checkTargetRange(range, shell);
        console.log(`Range check result:`, rangeCheck);
        if (rangeCheck.inRange) {
            autoSelectedRing = getMinimumRingsForRange(range, shell);
            console.log(`Auto-selected ring: ${autoSelectedRing}`);
        } else {
            console.log(`Target out of range: ${rangeCheck.reason}`);
        }
    } else {
        console.log(`ERROR: Missing coordinates - Target: ${targetX && targetY ? 'OK' : 'MISSING'}, Mortar: ${mortarX && mortarY ? 'OK' : 'MISSING'}`);
    }

    options.forEach(r => {
        const opt = document.createElement("option");
        opt.value = r;
        
        // Add visual indicator for auto-selected ring
        if (autoSelectedRing !== null && r === autoSelectedRing) {
            opt.textContent = `${r} !`;
            opt.selected = true;
        } else {
            opt.textContent = r;
        }
        
        rings.appendChild(opt);
    });

    // Show range error if target is out of range
    if (rangeCheck && !rangeCheck.inRange) {
        showAlertModal('Range Error', rangeCheck.reason);
    }
}

function updateSectionRingsOptionsPolar(sectionNumber) {
    console.log(`=== POLAR MISSION RING UPDATE FOR SECTION ${sectionNumber} ===`);
    
    const shell = document.getElementById(`section-${sectionNumber}-shell-polar`).value;
    const rings = document.getElementById(`section-${sectionNumber}-rings-polar`);
    
    if (!rings) {
        console.log(`ERROR: Rings dropdown not found for section ${sectionNumber}`);
        return;
    }
    
    rings.innerHTML = "";
    console.log(`Shell selected: ${shell}`);

    const options = (shell === "SMOKE" || shell === "ILUM") ? [1, 2, 3, 4] : [0, 1, 2, 3, 4];
    console.log(`Available ring options: ${options.join(', ')}`);
    
    // Get final target coordinates using the new function
    const targetCoords = calculateFinalTargetCoordinates('polar');
    console.log(`Target coordinates calculated:`, targetCoords);
    
    // Get mortar coordinates for this section's second gun (base gun)
    let mortarX = null;
    let mortarY = null;
    
    const sectionGuns = parseInt(document.getElementById(`section-${sectionNumber}-guns`).value);
    console.log(`Section ${sectionNumber} has ${sectionGuns} guns`);
    
    if (sectionGuns >= 2) {
        const xElement = document.getElementById(`section-${sectionNumber}-gun-2-x`);
        const yElement = document.getElementById(`section-${sectionNumber}-gun-2-y`);
        
        if (xElement && yElement) {
            mortarX = parseFloat(xElement.value);
            mortarY = parseFloat(yElement.value);
            console.log(`Using Gun 2 coordinates: (${mortarX}, ${mortarY})`);
        } else {
            console.log(`ERROR: Mortar coordinate elements not found for section ${sectionNumber} gun 2`);
        }
    } else if (sectionGuns === 1) {
        // If only 1 gun in section, use that gun
        const xElement = document.getElementById(`section-${sectionNumber}-gun-1-x`);
        const yElement = document.getElementById(`section-${sectionNumber}-gun-1-y`);
        
        if (xElement && yElement) {
            mortarX = parseFloat(xElement.value);
            mortarY = parseFloat(yElement.value);
            console.log(`Using Gun 1 coordinates: (${mortarX}, ${mortarY})`);
        } else {
            console.log(`ERROR: Mortar coordinate elements not found for section ${sectionNumber} gun 1`);
        }
    }
    
    let autoSelectedRing = null;
    let rangeCheck = null;
    
    if (targetCoords && mortarX && mortarY) {
        const range = calculateRange(mortarX, mortarY, targetCoords.x, targetCoords.y);
        console.log(`Range calculated: ${range}m`);
        rangeCheck = checkTargetRange(range, shell);
        console.log(`Range check result:`, rangeCheck);
        if (rangeCheck.inRange) {
            autoSelectedRing = getMinimumRingsForRange(range, shell);
            console.log(`Auto-selected ring: ${autoSelectedRing}`);
        } else {
            console.log(`Target out of range: ${rangeCheck.reason}`);
        }
    } else {
        console.log(`ERROR: Missing coordinates - Target: ${targetCoords ? 'OK' : 'MISSING'}, Mortar: ${mortarX && mortarY ? 'OK' : 'MISSING'}`);
    }

    options.forEach(r => {
        const opt = document.createElement("option");
        opt.value = r;
        
        // Add visual indicator for auto-selected ring
        if (autoSelectedRing !== null && r === autoSelectedRing) {
            opt.textContent = `${r} !`;
            opt.selected = true;
        } else {
            opt.textContent = r;
        }
        
        rings.appendChild(opt);
    });

    // Show range error if target is out of range
    if (rangeCheck && !rangeCheck.inRange) {
        showAlertModal('Range Error', rangeCheck.reason);
    }
}

function updateSectionRingsOptionsShift(sectionNumber) {
    console.log(`=== SHIFT MISSION RING UPDATE FOR SECTION ${sectionNumber} ===`);
    
    const shell = document.getElementById(`section-${sectionNumber}-shell-shift`).value;
    const rings = document.getElementById(`section-${sectionNumber}-rings-shift`);
    
    if (!rings) {
        console.log(`ERROR: Rings dropdown not found for section ${sectionNumber}`);
        return;
    }
    
    rings.innerHTML = "";
    console.log(`Shell selected: ${shell}`);

    const options = (shell === "SMOKE" || shell === "ILUM") ? [1, 2, 3, 4] : [0, 1, 2, 3, 4];
    console.log(`Available ring options: ${options.join(', ')}`);
    
    // Get final target coordinates using the new function
    const targetCoords = calculateFinalTargetCoordinates('shift');
    console.log(`Target coordinates calculated:`, targetCoords);
    
    // Get mortar coordinates for this section's second gun (base gun)
    let mortarX = null;
    let mortarY = null;
    
    const sectionGuns = parseInt(document.getElementById(`section-${sectionNumber}-guns`).value);
    console.log(`Section ${sectionNumber} has ${sectionGuns} guns`);
    
    if (sectionGuns >= 2) {
        const xElement = document.getElementById(`section-${sectionNumber}-gun-2-x`);
        const yElement = document.getElementById(`section-${sectionNumber}-gun-2-y`);
        
        if (xElement && yElement) {
            mortarX = parseFloat(xElement.value);
            mortarY = parseFloat(yElement.value);
            console.log(`Using Gun 2 coordinates: (${mortarX}, ${mortarY})`);
        } else {
            console.log(`ERROR: Mortar coordinate elements not found for section ${sectionNumber} gun 2`);
        }
    } else if (sectionGuns === 1) {
        // If only 1 gun in section, use that gun
        const xElement = document.getElementById(`section-${sectionNumber}-gun-1-x`);
        const yElement = document.getElementById(`section-${sectionNumber}-gun-1-y`);
        
        if (xElement && yElement) {
            mortarX = parseFloat(xElement.value);
            mortarY = parseFloat(yElement.value);
            console.log(`Using Gun 1 coordinates: (${mortarX}, ${mortarY})`);
        } else {
            console.log(`ERROR: Mortar coordinate elements not found for section ${sectionNumber} gun 1`);
        }
    }
    
    let autoSelectedRing = null;
    let rangeCheck = null;
    
    if (targetCoords && mortarX && mortarY) {
        const range = calculateRange(mortarX, mortarY, targetCoords.x, targetCoords.y);
        console.log(`Range calculated: ${range}m`);
        rangeCheck = checkTargetRange(range, shell);
        console.log(`Range check result:`, rangeCheck);
        if (rangeCheck.inRange) {
            autoSelectedRing = getMinimumRingsForRange(range, shell);
            console.log(`Auto-selected ring: ${autoSelectedRing}`);
        } else {
            console.log(`Target out of range: ${rangeCheck.reason}`);
        }
    } else {
        console.log(`ERROR: Missing coordinates - Target: ${targetCoords ? 'OK' : 'MISSING'}, Mortar: ${mortarX && mortarY ? 'OK' : 'MISSING'}`);
    }

    options.forEach(r => {
        const opt = document.createElement("option");
        opt.value = r;
        
        // Add visual indicator for auto-selected ring
        if (autoSelectedRing !== null && r === autoSelectedRing) {
            opt.textContent = `${r} !`;
            opt.selected = true;
        } else {
            opt.textContent = r;
        }
        
        rings.appendChild(opt);
    });

    // Show range error if target is out of range
    if (rangeCheck && !rangeCheck.inRange) {
        alert(rangeCheck.reason);
    }
}

function updateRingsOptions() {
    // This function is kept for backward compatibility but now delegates to section-specific updates
    const selectedSections = getSelectedSections('grid');
    selectedSections.forEach(section => {
        updateSectionRingsOptions(section);
    });
}

function updateRingsOptionsPolar() {
    const shell = document.getElementById("shell-polar").value;
    const rings = document.getElementById("rings-polar");
    rings.innerHTML = "";

    const options = (shell === "SMOKE" || shell === "ILUM") ? [1, 2, 3, 4] : [0, 1, 2, 3, 4];
    
    // Try to get current target coordinates for automatic selection
    const foX = parseFloat(document.getElementById("fo-x-polar").value);
    const foY = parseFloat(document.getElementById("fo-y-polar").value);
    const foDist = parseFloat(document.getElementById("fo-dist-polar").value);
    const foDir = parseFloat(document.getElementById("fo-dir-polar").value);
    
    // Get mortar coordinates based on selected sections and base gun logic
    const selectedSections = getSelectedSections('polar');
    const gunConfiguration = getGunConfiguration();
    let mortarX = null;
    let mortarY = null;
    
    if (selectedSections.length > 0) {
        const totalGuns = getTotalGuns();
        let baseGunNumber = 1;
        
        if (totalGuns > 1) {
            // Find gun 2 (base gun) across all selected sections
            let gunCount = 0;
            for (const section of selectedSections) {
                const sectionGuns = parseInt(document.getElementById(`section-${section}-guns`).value);
                if (gunCount + sectionGuns >= 2) {
                    // Gun 2 is in this section
                    const gunIndexInSection = 2 - gunCount - 1; // Convert to 0-based index
                    mortarX = parseFloat(document.getElementById(`section-${section}-gun-${gunIndexInSection + 1}-x`).value);
                    mortarY = parseFloat(document.getElementById(`section-${section}-gun-${gunIndexInSection + 1}-y`).value);
                    break;
                }
                gunCount += sectionGuns;
            }
        } else {
            // Only one gun total, use the first gun of the first selected section
            const firstSection = selectedSections[0];
            mortarX = parseFloat(document.getElementById(`section-${firstSection}-gun-1-x`).value);
            mortarY = parseFloat(document.getElementById(`section-${firstSection}-gun-1-y`).value);
        }
    }
    
    let autoSelectedRing = null;
    let rangeCheck = null;
    
    if (foX && foY && foDist && foDir && mortarX && mortarY) {
        // Convert polar coordinates to grid coordinates
        const foDirRad = foDir * Math.PI / 180;
        const scaledFoDist = foDist / 10;
        const targetX = foX + scaledFoDist * Math.sin(foDirRad);
        const targetY = foY + scaledFoDist * Math.cos(foDirRad);
        
        const range = calculateRange(mortarX, mortarY, targetX, targetY);
        rangeCheck = checkTargetRange(range, shell);
        if (rangeCheck.inRange) {
            autoSelectedRing = getMinimumRingsForRange(range, shell);
        }
    }

    options.forEach(r => {
        const opt = document.createElement("option");
        opt.value = r;
        
        // Add visual indicator for auto-selected ring
        if (autoSelectedRing !== null && r === autoSelectedRing) {
            opt.textContent = `${r} !`;
            opt.selected = true;
        } else {
            opt.textContent = r;
        }
        
        rings.appendChild(opt);
    });

    // Show range error if target is out of range
    if (rangeCheck && !rangeCheck.inRange) {
        showAlertModal('Range Error', rangeCheck.reason);
    }
}

function saveGlobalData() {
    // Save all data (both global and mission data) to ensure consistency
    saveAllData();
    showAlertModal('Success', 'Global data saved');
}

// Save all data from all pages
let isLoadingData = false;

function saveAllData() {
    if (isLoadingData) {
        console.log('Skipping saveAllData during loading');
        return;
    }
    // console.log('Saving all data...');
    
    // Show a brief visual indicator that data is being saved
    const saveIndicator = document.getElementById('save-indicator');
    if (saveIndicator) {
        saveIndicator.style.display = 'block';
        setTimeout(() => {
            saveIndicator.style.display = 'none';
        }, 1000);
    }
    
    // Save section configuration
    const numSectionsElement = document.getElementById("num-sections");
    const numSections = numSectionsElement ? parseInt(numSectionsElement.value) || 1 : 1;
    localStorage.setItem("numSections", numSections);
    // console.log('Saving numSections:', numSections);
    
    // Save section gun configurations and altitudes
    for (let i = 1; i <= numSections; i++) {
        const sectionGunsSelect = document.getElementById(`section-${i}-guns`);
        const sectionAltInput = document.getElementById(`section-${i}-alt`);
        
        if (sectionGunsSelect) {
            localStorage.setItem(`section-${i}-guns`, sectionGunsSelect.value);
            // console.log(`Saving section-${i}-guns:`, sectionGunsSelect.value);
        } else {
            // console.log(`WARNING: section-${i}-guns element not found`);
        }
        if (sectionAltInput) {
            localStorage.setItem(`section-${i}-alt`, sectionAltInput.value);
            // console.log(`Saving section-${i}-alt:`, sectionAltInput.value);
        } else {
            // console.log(`WARNING: section-${i}-alt element not found`);
        }
    }
    
    // Save section-specific mortar coordinates
    const gunConfiguration = getGunConfiguration();
    // console.log('Gun configuration for saving:', gunConfiguration);
    gunConfiguration.forEach((sectionConfig) => {
        const section = sectionConfig.section;
        const guns = sectionConfig.guns;
        
        for (let gunIndex = 1; gunIndex <= guns; gunIndex++) {
            const xInput = document.getElementById(`section-${section}-gun-${gunIndex}-x`);
            const yInput = document.getElementById(`section-${section}-gun-${gunIndex}-y`);
            
            if (xInput && yInput) {
                localStorage.setItem(`section-${section}-gun-${gunIndex}-x`, xInput.value);
                localStorage.setItem(`section-${section}-gun-${gunIndex}-y`, yInput.value);
                // console.log(`Saving section-${section}-gun-${gunIndex}-x:`, xInput.value);
                // console.log(`Saving section-${section}-gun-${gunIndex}-y:`, yInput.value);
            } else {
                // console.log(`WARNING: Gun coordinate elements not found for section ${section} gun ${gunIndex}`);
            }
        }
    });
    
    const totalGuns = getTotalGuns();
    localStorage.setItem("numGuns", totalGuns);
    
    // Grid mission data
    localStorage.setItem("platform", document.getElementById("platform").value);
    localStorage.setItem("sheaf-type-grid", document.getElementById("sheaf-type-grid").value);
    
    localStorage.setItem("target-x", document.getElementById("target-x").value);
    localStorage.setItem("target-y", document.getElementById("target-y").value);
    localStorage.setItem("target-alt", document.getElementById("target-alt").value);
    localStorage.setItem("fo-dir", document.getElementById("fo-dir").value);
    localStorage.setItem("sheaf-length", document.getElementById("sheaf-length").value);
    localStorage.setItem("sheaf-direction", document.getElementById("sheaf-direction").value);
    localStorage.setItem("sheaf-diameter", document.getElementById("sheaf-diameter").value);
    localStorage.setItem("add-drop", document.getElementById("add-drop").value);
    localStorage.setItem("left-right", document.getElementById("left-right").value);
    localStorage.setItem("target-number-grid", document.getElementById("target-number-grid").value);
    localStorage.setItem("amount-rounds-grid", document.getElementById("amount-rounds-grid").value);
    
    // Polar mission data
    localStorage.setItem("platform-polar", document.getElementById("platform-polar").value);
    localStorage.setItem("sheaf-type-polar", document.getElementById("sheaf-type-polar").value);
    
    localStorage.setItem("fo-x-polar", document.getElementById("fo-x-polar").value);
    localStorage.setItem("fo-y-polar", document.getElementById("fo-y-polar").value);
    localStorage.setItem("fo-dist-polar", document.getElementById("fo-dist-polar").value);
    localStorage.setItem("fo-dir-polar", document.getElementById("fo-dir-polar").value);
    localStorage.setItem("target-alt-polar", document.getElementById("target-alt-polar").value);
    localStorage.setItem("sheaf-length-polar", document.getElementById("sheaf-length-polar").value);
    localStorage.setItem("sheaf-direction-polar", document.getElementById("sheaf-direction-polar").value);
    localStorage.setItem("sheaf-diameter-polar", document.getElementById("sheaf-diameter-polar").value);
    localStorage.setItem("add-drop-polar", document.getElementById("add-drop-polar").value);
    localStorage.setItem("left-right-polar", document.getElementById("left-right-polar").value);
    localStorage.setItem("target-number-polar", document.getElementById("target-number-polar").value);
    localStorage.setItem("amount-rounds-polar", document.getElementById("amount-rounds-polar").value);
    
    // Save mission-specific shell configurations
    const missionTypes = ['grid', 'polar', 'shift'];
    missionTypes.forEach(type => {
        const numSections = parseInt(document.getElementById("num-sections").value) || 1;
        for (let i = 1; i <= numSections; i++) {
            const shellSelect = document.getElementById(`section-${i}-shell-${type}`);
            const ringsSelect = document.getElementById(`section-${i}-rings-${type}`);
            
            if (shellSelect) {
                localStorage.setItem(`section-${i}-shell-${type}`, shellSelect.value);
            }
            if (ringsSelect) {
                localStorage.setItem(`section-${i}-rings-${type}`, ringsSelect.value);
            }
        }
    });
    
    // console.log('All data saved successfully');
}

// Load all data to all pages
function loadAllData() {
    // console.log('Loading all data...');
    isLoadingData = true;
    
    // Show a brief visual indicator that data is being loaded
    const saveIndicator = document.getElementById('save-indicator');
    if (saveIndicator) {
        saveIndicator.textContent = 'Data loaded from previous session';
        saveIndicator.style.display = 'block';
        setTimeout(() => {
            saveIndicator.style.display = 'none';
            saveIndicator.textContent = 'Data saved automatically';
        }, 2000);
    }
    
    // Global data
    const numSections = localStorage.getItem("numSections");
    const numGuns = localStorage.getItem("numGuns");
    
    // Load section configuration
    if (numSections) {
        // console.log('Loading numSections:', numSections);
        // console.log('All localStorage keys:', Object.keys(localStorage));
        const numSectionsElement = document.getElementById("num-sections");
        if (numSectionsElement) {
            numSectionsElement.value = numSections;
            updateSectionConfiguration();
            
            // Load section gun configurations and altitudes
            setTimeout(() => {
                for (let i = 1; i <= parseInt(numSections); i++) {
                    const sectionGuns = localStorage.getItem(`section-${i}-guns`);
                    const sectionAlt = localStorage.getItem(`section-${i}-alt`);
                    const sectionGunsSelect = document.getElementById(`section-${i}-guns`);
                    const sectionAltInput = document.getElementById(`section-${i}-alt`);
                    
                    // console.log(`Loading section-${i}-guns:`, sectionGuns, 'Element found:', !!sectionGunsSelect);
                    // console.log(`Loading section-${i}-alt:`, sectionAlt, 'Element found:', !!sectionAltInput);
                    // console.log(`Raw localStorage.getItem('section-${i}-guns'):`, localStorage.getItem(`section-${i}-guns`));
                    // console.log(`Raw localStorage.getItem('section-${i}-alt'):`, localStorage.getItem(`section-${i}-alt`));
                    
                    if (sectionGuns && sectionGunsSelect) {
                        sectionGunsSelect.value = sectionGuns;
                    }
                    if (sectionAlt && sectionAltInput) {
                        sectionAltInput.value = sectionAlt;
                    }
                }
            updateMortarCoordinates();
            
            // Load section-specific mortar coordinates after recreating the inputs
            setTimeout(() => {
                const gunConfiguration = getGunConfiguration();
                gunConfiguration.forEach((sectionConfig) => {
                    const section = sectionConfig.section;
                    const guns = sectionConfig.guns;
                    
                    for (let gunIndex = 1; gunIndex <= guns; gunIndex++) {
                        const x = localStorage.getItem(`section-${section}-gun-${gunIndex}-x`);
                        const y = localStorage.getItem(`section-${section}-gun-${gunIndex}-y`);
                        const xElement = document.getElementById(`section-${section}-gun-${gunIndex}-x`);
                        const yElement = document.getElementById(`section-${section}-gun-${gunIndex}-y`);
                        if (x && xElement) xElement.value = x;
                        if (y && yElement) yElement.value = y;
                    }
                });
                
                // Load mission-specific shell configurations
                const missionTypes = ['grid', 'polar', 'shift'];
                missionTypes.forEach(type => {
                    for (let i = 1; i <= parseInt(numSections); i++) {
                        const shellValue = localStorage.getItem(`section-${i}-shell-${type}`);
                        const ringsValue = localStorage.getItem(`section-${i}-rings-${type}`);
                        
                        const shellSelect = document.getElementById(`section-${i}-shell-${type}`);
                        const ringsSelect = document.getElementById(`section-${i}-rings-${type}`);
                        
                        if (shellValue && shellSelect) {
                            shellSelect.value = shellValue;
                        }
                        if (ringsValue && ringsSelect) {
                            ringsSelect.value = ringsValue;
                        }
                    }
                });
            }, 0);
        }, 0);
    } else if (numGuns) {
        // Fallback for old data format
        document.getElementById("num-sections").value = "1";
        updateSectionConfiguration();
        
        setTimeout(() => {
            const sectionGunsSelect = document.getElementById("section-1-guns");
            const sectionAltInput = document.getElementById("section-1-alt");
            const sectionShellSelect = document.getElementById("section-1-shell");
            const sectionRingsSelect = document.getElementById("section-1-rings");
            
            if (sectionGunsSelect) {
                sectionGunsSelect.value = numGuns;
            }
            if (sectionAltInput) {
                // Use the old mortar altitude as default for section 1
                const oldMortarAlt = localStorage.getItem("mortarAlt");
                if (oldMortarAlt) {
                    sectionAltInput.value = oldMortarAlt;
                }
            }
            if (sectionShellSelect) {
                sectionShellSelect.value = "HE"; // Default shell type
                sectionShellSelect.addEventListener('change', function() {
                    updateSectionRingsOptions(1);
                });
            }
            if (sectionRingsSelect) {
                sectionRingsSelect.value = "1"; // Default rings
            }
            
            updateMortarCoordinates();
            
            // Load section-specific mortar coordinates after recreating the inputs
            setTimeout(() => {
                const gunConfiguration = getGunConfiguration();
                gunConfiguration.forEach((sectionConfig) => {
                    const section = sectionConfig.section;
                    const guns = sectionConfig.guns;
                    
                    for (let gunIndex = 1; gunIndex <= guns; gunIndex++) {
                        const x = localStorage.getItem(`section-${section}-gun-${gunIndex}-x`);
                        const y = localStorage.getItem(`section-${section}-gun-${gunIndex}-y`);
                        const xElement = document.getElementById(`section-${section}-gun-${gunIndex}-x`);
                        const yElement = document.getElementById(`section-${section}-gun-${gunIndex}-y`);
                        if (x && xElement) xElement.value = x;
                        if (y && yElement) yElement.value = y;
                    }
                });
            }, 0);
        }, 0);
    }
    }
    
    // Grid mission data
    const platform = localStorage.getItem("platform");
    const sheafTypeGrid = localStorage.getItem("sheaf-type-grid");
    
    const targetX = localStorage.getItem("target-x");
    const targetY = localStorage.getItem("target-y");
    const targetAlt = localStorage.getItem("target-alt");
    const foDir = localStorage.getItem("fo-dir");
    const sheafLength = localStorage.getItem("sheaf-length");
    const sheafDirection = localStorage.getItem("sheaf-direction");
    const sheafDiameter = localStorage.getItem("sheaf-diameter");
    const addDrop = localStorage.getItem("add-drop");
    const leftRight = localStorage.getItem("left-right");
    const targetNumberGrid = localStorage.getItem("target-number-grid");
    const amountRoundsGrid = localStorage.getItem("amount-rounds-grid");
    
    if (platform) document.getElementById("platform").value = platform;
    if (sheafTypeGrid) {
        document.getElementById("sheaf-type-grid").value = sheafTypeGrid;
        onSheafTypeChange('sheaf-type-grid');
    }
    
    if (targetX) document.getElementById("target-x").value = targetX;
    if (targetY) document.getElementById("target-y").value = targetY;
    if (targetAlt) document.getElementById("target-alt").value = targetAlt;
    if (foDir) document.getElementById("fo-dir").value = foDir;
    if (sheafLength) document.getElementById("sheaf-length").value = sheafLength;
    if (sheafDirection) document.getElementById("sheaf-direction").value = sheafDirection;
    if (sheafDiameter) document.getElementById("sheaf-diameter").value = sheafDiameter;
    if (addDrop) document.getElementById("add-drop").value = addDrop;
    if (leftRight) document.getElementById("left-right").value = leftRight;
    if (targetNumberGrid) document.getElementById("target-number-grid").value = targetNumberGrid;
    if (amountRoundsGrid) document.getElementById("amount-rounds-grid").value = amountRoundsGrid;
    
    // Polar mission data
    const platformPolar = localStorage.getItem("platform-polar");
    const shellPolar = localStorage.getItem("shell-polar");
    const ringsPolar = localStorage.getItem("rings-polar");
    const sheafTypePolar = localStorage.getItem("sheaf-type-polar");
    
    const foXPolar = localStorage.getItem("fo-x-polar");
    const foYPolar = localStorage.getItem("fo-y-polar");
    const foDistPolar = localStorage.getItem("fo-dist-polar");
    const foDirPolar = localStorage.getItem("fo-dir-polar");
    const targetAltPolar = localStorage.getItem("target-alt-polar");
    const sheafLengthPolar = localStorage.getItem("sheaf-length-polar");
    const sheafDirectionPolar = localStorage.getItem("sheaf-direction-polar");
    const sheafDiameterPolar = localStorage.getItem("sheaf-diameter-polar");
    const addDropPolar = localStorage.getItem("add-drop-polar");
    const leftRightPolar = localStorage.getItem("left-right-polar");
    const targetNumberPolar = localStorage.getItem("target-number-polar");
    const amountRoundsPolar = localStorage.getItem("amount-rounds-polar");
    
    if (platformPolar) document.getElementById("platform-polar").value = platformPolar;
    if (shellPolar) {
        document.getElementById("shell-polar").value = shellPolar;
    }
    if (ringsPolar) document.getElementById("rings-polar").value = ringsPolar;
    if (sheafTypePolar) {
        document.getElementById("sheaf-type-polar").value = sheafTypePolar;
        onSheafTypeChange('sheaf-type-polar');
    }
    
    if (foXPolar) document.getElementById("fo-x-polar").value = foXPolar;
    if (foYPolar) document.getElementById("fo-y-polar").value = foYPolar;
    if (foDistPolar) document.getElementById("fo-dist-polar").value = foDistPolar;
    if (foDirPolar) document.getElementById("fo-dir-polar").value = foDirPolar;
    if (targetAltPolar) document.getElementById("target-alt-polar").value = targetAltPolar;
    if (sheafLengthPolar) document.getElementById("sheaf-length-polar").value = sheafLengthPolar;
    if (sheafDirectionPolar) document.getElementById("sheaf-direction-polar").value = sheafDirectionPolar;
    if (sheafDiameterPolar) document.getElementById("sheaf-diameter-polar").value = sheafDiameterPolar;
    if (addDropPolar) document.getElementById("add-drop-polar").value = addDropPolar;
    if (leftRightPolar) document.getElementById("left-right-polar").value = leftRightPolar;
    if (targetNumberPolar) document.getElementById("target-number-polar").value = targetNumberPolar;
    if (amountRoundsPolar) document.getElementById("amount-rounds-polar").value = amountRoundsPolar;
    
    // console.log('All data loaded successfully');
    // Add a small delay before re-enabling saves to ensure loading is complete
    setTimeout(() => {
        isLoadingData = false;
        // console.log('Loading complete, saves re-enabled');
    }, 100);
}

// Function to get mortar coordinates for a specific gun (global index)
function getMortarCoordinates(gunNumber) {
    const gunConfiguration = getGunConfiguration();
    let currentGunIndex = 0;
    
    for (const sectionConfig of gunConfiguration) {
        const section = sectionConfig.section;
        const guns = sectionConfig.guns;
        
        for (let gunIndexInSection = 1; gunIndexInSection <= guns; gunIndexInSection++) {
            currentGunIndex++;
            if (currentGunIndex === gunNumber) {
                return getMortarCoordinatesBySection(section, gunIndexInSection);
            }
        }
    }
    
    return { x: 0, y: 0 };
}

// Update mortar coordinate fields based on total number of guns from all sections
function updateMortarCoordinates() {
    const gunConfiguration = getGunConfiguration();
    const container = document.getElementById('mortar-coordinates-container');
    const totalGunsDisplay = document.getElementById('total-guns-display');
    
    // Clear existing mortar coordinates
    container.innerHTML = '';
    
    // Calculate total guns
    const totalGuns = getTotalGuns();
    totalGunsDisplay.textContent = totalGuns;
    
    // Create mortar coordinate inputs for each section and its guns
    gunConfiguration.forEach((sectionConfig, sectionIndex) => {
        const section = sectionConfig.section;
        const guns = sectionConfig.guns;
        
        // Create section header
        const sectionHeader = document.createElement('div');
        sectionHeader.className = 'section-header';
        sectionHeader.textContent = `Section ${section} Mortar Coordinates`;
        container.appendChild(sectionHeader);
        
        // Create input groups for this section's guns
        for (let gunIndex = 1; gunIndex <= guns; gunIndex++) {
            const inputGroup = document.createElement('div');
            inputGroup.className = 'input-group';
            
            const inputRow = document.createElement('div');
            inputRow.className = 'input-row';
            
            inputRow.innerHTML = `
                <label>Gun ${gunIndex} X:</label>
                <input type="number" id="section-${section}-gun-${gunIndex}-x" placeholder="X coordinate" />
                <label>Gun ${gunIndex} Y:</label>
                <input type="number" id="section-${section}-gun-${gunIndex}-y" placeholder="Y coordinate" />
            `;
            
            inputGroup.appendChild(inputRow);
            container.appendChild(inputGroup);
        }
    });
    
    // Load saved mortar coordinates with a small delay to ensure elements are created
    setTimeout(loadMortarCoordinates, 10);
}

function loadMortarCoordinates() {
    // console.log('loadMortarCoordinates called');
    const gunConfiguration = getGunConfiguration();
    // console.log('Gun configuration in loadMortarCoordinates:', gunConfiguration);
    
    gunConfiguration.forEach((sectionConfig) => {
        const section = sectionConfig.section;
        const guns = sectionConfig.guns;
        
        for (let gunIndex = 1; gunIndex <= guns; gunIndex++) {
            const xInput = document.getElementById(`section-${section}-gun-${gunIndex}-x`);
            const yInput = document.getElementById(`section-${section}-gun-${gunIndex}-y`);
            
            // Add null checks to prevent TypeError
            if (xInput && yInput) {
                // Load saved values
                const savedX = localStorage.getItem(`section-${section}-gun-${gunIndex}-x`);
                const savedY = localStorage.getItem(`section-${section}-gun-${gunIndex}-y`);
                
                // console.log(`Loading mortar coordinates for section ${section} gun ${gunIndex}: x=${savedX}, y=${savedY}`);
                
                if (savedX) xInput.value = savedX;
                if (savedY) yInput.value = savedY;
                
                // Add event listeners for automatic saving and validation
                [xInput, yInput].forEach(input => {
                    input.addEventListener('change', saveAllData);
                    input.addEventListener('input', saveAllData);
                    
                    // Add input validation for mortar coordinate fields
                    input.addEventListener('input', function() {
                        // Remove any non-digit characters except minus sign
                        let value = this.value.replace(/[^\d-]/g, '');
                        
                        // Ensure only one minus sign at the beginning
                        if (value.startsWith('-')) {
                            value = '-' + value.substring(1).replace(/-/g, '');
                        } else {
                            value = value.replace(/-/g, '');
                        }
                        
                        // Limit to 4 digits (plus minus sign if present)
                        if (value.startsWith('-')) {
                            if (value.length > 5) { // - plus 4 digits
                                value = value.substring(0, 5);
                            }
                        } else {
                            if (value.length > 4) {
                                value = value.substring(0, 4);
                            }
                        }
                        
                        this.value = value;
                        
                        // Trigger ring updates when mortar coordinates change
                        const sectionMatch = this.id.match(/section-(\d+)-gun-(\d+)-[xy]/);
                        if (sectionMatch) {
                            const sectionNumber = parseInt(sectionMatch[1]);
                            setTimeout(() => {
                                updateSectionRingsOptionsGrid(sectionNumber);
                                updateSectionRingsOptionsPolar(sectionNumber);
                                updateSectionRingsOptionsShift(sectionNumber);
                            }, 100);
                        }
                    });
                });
            }
        }
    });
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

function getSectionAltitude(sectionIndex) {
    const altitudeInput = document.getElementById(`section-${sectionIndex}-alt`);
    if (altitudeInput) {
        return parseFloat(altitudeInput.value) || 0;
    }
    return 0;
}

function getSectionForGun(gunNumber) {
    const gunConfiguration = getGunConfiguration();
    let currentGunCount = 0;
    
    for (const sectionConfig of gunConfiguration) {
        currentGunCount += sectionConfig.guns;
        if (gunNumber <= currentGunCount) {
            return sectionConfig.section;
        }
    }
    
    // Fallback to section 1 if not found
    return 1;
}

// Function to calculate linear sheaf target coordinates based on Excel formulas
function calculateLinearSheafTargets(centerX, centerY, sheafLength, sheafDirection, numGuns) {
    const targets = [];
    
    // Convert direction to radians
    const directionRad = sheafDirection * Math.PI / 180;
    
    // Calculate start and end points of the imaginary line (Excel formulas)
    const halfLength = sheafLength / 2;
    const startX = centerX - halfLength * Math.sin(directionRad);
    const endX = centerX + halfLength * Math.sin(directionRad);
    const startY = centerY - halfLength * Math.cos(directionRad);
    const endY = centerY + halfLength * Math.cos(directionRad);
    
    // Calculate target coordinates for each gun (Excel drag formulas)
    for (let i = 1; i <= numGuns; i++) {
        let targetX, targetY;
        
        if (numGuns === 1) {
            // If only 1 gun, use the average of start and end points
            targetX = (startX + endX) / 2;
            targetY = (startY + endY) / 2;
        } else {
            // Distribute guns evenly along the line
            const ratio = (i - 1) / (numGuns - 1);
            targetX = startX + ratio * (endX - startX);
            targetY = startY + ratio * (endY - startY);
        }
        
        targets.push({ x: targetX, y: targetY });
    }
    
    return targets;
}

// Function to calculate circular sheaf target coordinates based on Excel formulas
function calculateCircularSheafTargets(centerX, centerY, diameter, numGuns) {
    const targets = [];
    
    // Calculate radius from diameter
    const radius = diameter / 2;
    
    // Calculate target coordinates for each gun (Excel drag formulas)
    for (let i = 1; i <= numGuns; i++) {
        let targetX, targetY;
        
        if (numGuns === 1) {
            // If only 1 gun, use the center point
            targetX = centerX;
            targetY = centerY;
        } else {
            // Distribute guns evenly around the circle
            // Calculate angle for each gun (360 degrees / numGuns)
            const angleStep = (2 * Math.PI) / numGuns;
            const angle = (i - 1) * angleStep;
            
            // Calculate position on circle using trigonometry
            targetX = centerX + radius * Math.cos(angle);
            targetY = centerY + radius * Math.sin(angle);
        }
        
        targets.push({ x: targetX, y: targetY });
    }
    
    return targets;
}

// Function to calculate converged sheaf target coordinates
// All guns fire at exactly the same target coordinate
function calculateConvergedSheafTargets(centerX, centerY, numGuns) {
    const targets = [];
    
    // All guns fire at the same target coordinate
    for (let i = 1; i <= numGuns; i++) {
        targets.push({ x: centerX, y: centerY });
    }
    
    return targets;
}

// Function to calculate open sheaf target coordinates
// Guns adjust based on specific coordinate modifications
function calculateOpenSheafTargets(centerX, centerY, numGuns) {
    const targets = [];
    
    for (let i = 1; i <= numGuns; i++) {
        let adjustedX = centerX;
        let adjustedY = centerY;
        
        if (i === 1) {
            // Gun 1: subtract 1 from X and subtract 1 from Y
            adjustedX = centerX - 1;
            adjustedY = centerY - 1;
        } else if (i === 2) {
            // Gun 2: shoot at original target coordinate
            adjustedX = centerX;
            adjustedY = centerY;
        } else if (i === 3) {
            // Gun 3: add 1 to X and subtract 1 from Y
            adjustedX = centerX + 1;
            adjustedY = centerY - 1;
        } else if (i === 4) {
            // Gun 4: add 2 to X and change nothing to Y
            adjustedX = centerX + 2;
            adjustedY = centerY;
        }
        
        targets.push({ x: adjustedX, y: adjustedY });
    }
    
    return targets;
}

// Function to perform ballistic calculation for a single gun-target pair
function calculateSingleGunBallistics(mortarX, mortarY, targetX, targetY, mortarAlt, targetAlt, shell, rings, addDrop, leftRight, foDirDeg) {
    const firingTables = {
        HE: {
            0:  [
                [50, 1540, 61, 13.2, 0.1],
                [100, 1479, 63, 13.2, 0.2],
                [150, 1416, 66, 13.0, 0.2],
                [200, 1350, 71, 12.8, 0.2],
                [250, 1279, 78, 12.6, 0.3],
                [300, 1201, 95, 12.3, 0.6],
                [350, 1106, 151, 11.7, 1.0],
                [400, 955, 0, 10.7, 1.5]
            ],
            1: [
                [100, 1547, 28, 20.0, 0.1],
                [200, 1492, 27, 19.9, 0.1],
                [300, 1437, 29, 19.7, 0.1],
                [400, 1378, 31, 19.5, 0.1],
                [500, 1317, 33, 19.2, 0.2],
                [600, 1249, 35, 18.8, 0.2],
                [700, 1174, 42, 18.3, 0.4],
                [800, 1085, 57, 17.5, 0.6],
                [900, 954, 148, 16.1, 1.8]
            ],
            2: [
                [200, 1538, 15, 26.6],
                [300, 1507, 16, 26.5],
                [400, 1475, 16, 26.4],
                [500, 1443, 16, 26.3, 0.1],
                [600, 1410, 16, 26.2, 0.1],
                [700, 1376, 17, 26.0, 0.1],
                [800, 1341, 18, 25.8, 0.1],
                [900, 1305, 20, 25.5, 0.1],
                [1000, 1266, 20, 25.2, 0.1],
                [1100, 1225, 22, 24.9, 0.2],
                [1200, 1180, 23, 24.4, 0.2],
                [1300, 1132, 27, 23.9, 0.3],
                [1400, 1076, 31, 23.2, 0.4],
                [1500, 1009, 43, 22.3, 0.6],
                [1600, 912, 109, 20.9, 1.9]
            ],
            3: [
                [300, 1534, 12, 31.7],
                [400, 1511, 11, 31.6],
                [500, 1489, 12, 31.6, 0.1],
                [600, 1466, 12, 31.5, 0.1],
                [700, 1442, 12, 31.4, 0.1],
                [800, 1419, 12, 31.3, 0.1],
                [900, 1395, 13, 31.1, 0.1],
                [1000, 1370, 13, 31.0, 0.1],
                [1100, 1344, 13, 30.8, 0.1],
                [1200, 1318, 13, 30.6, 0.1],
                [1300, 1291, 14, 30.3, 0.1],
                [1400, 1263, 15, 30.1, 0.2],
                [1500, 1233, 15, 29.7, 0.1],
                [1600, 1202, 16, 29.4, 0.2],
                [1700, 1169, 17, 29.0, 0.2],
                [1800, 1133, 19, 28.5, 0.2],
                [1900, 1094, 21, 28.0, 0.3],
                [2000, 1051, 26, 27.3, 0.4],
                [2100, 999, 31, 26.5, 0.5],
                [2200, 931, 46, 25.3, 0.9],
                [2300, 801, null, 22.7]
            ],
            4: [
                [400, 1531, 9, 36.3],
                [500, 1514, 9, 36.2],
                [600, 1496, 9, 36.2, 0.1],
                [700, 1478, 9, 36.1],
                [800, 1460, 9, 36.0],
                [900, 1442, 9, 35.9],
                [1000, 1424, 10, 35.8],
                [1100, 1405, 10, 35.7, 0.1],
                [1200, 1385, 9, 35.6, 0.1],
                [1300, 1366, 10, 35.4, 0.1],
                [1400, 1346, 10, 35.3, 0.1],
                [1500, 1326, 11, 35.1, 0.1],
                [1600, 1305, 11, 34.9, 0.1],
                [1700, 1283, 11, 34.6, 0.1],
                [1800, 1261, 11, 34.4, 0.1],
                [1900, 1238, 12, 34.1, 0.1],
                [2000, 1214, 12, 33.8, 0.1],
                [2100, 1188, 13, 33.5, 0.1],
                [2200, 1162, 14, 33.1, 0.1],
                [2300, 1134, 15, 32.7, 0.1],
                [2400, 1104, 17, 32.2, 0.2],
                [2500, 1070, 17, 31.7, 0.3],
                [2600, 1034, 20, 31.0, 0.3],
                [2700, 993, 25, 30.3, 0.5],
                [2800, 942, 31, 29.2, 0.6],
                [2900, 870, 64, 27.7, 1.5]
            ]
        },
        SMOKE: {
            1: [
                [200, 1463, 36, 17.7, 0.1],
                [250, 1427, 36, 17.6, 0.1],
                [300, 1391, 29, 17.5, 0.2],
                [350, 1352, 31, 17.3, 0.1],
                [400, 1314, 33, 17.2, 0.2],
                [450, 1271, 35, 16.9, 0.2],
                [500, 1227, 42, 16.7, 0.4],
                [550, 1178, 57, 16.4, 0.6],
                [600, 1124, 148, 16.0, 1.8],
                [650, 1060, null, 15.4, 1.0],
                [700, 982, null, 14.7, 1.0],
                [750, 822, null, 13, 2.7]
            ],
            2: [
                [200, 1528, 19, 24.8, 0.1],
                [300, 1491, 19, 24.7, 0.1],
                [400, 1453, 19, 24.6, 0.1],
                [500, 1414, 19, 24.4, 0.1],
                [600, 1374, 20, 24.3, 0.1],
                [700, 1333, 22, 24.0, 0.1],
                [800, 1289, 23, 23.7, 0.2],
                [900, 1242, 25, 23.3, 0.2],
                [1000, 1191, 28, 22.9, 0.3],
                [1100, 1133, 31, 22.3, 0.3],
                [1200, 1067, 39, 21.6, 0.5],
                [1300, 980, 58, 20.5, 0.9],
                [1400, 818, null, 18.0],
            ],
            3: [
                [300, 1522, 14, 29.6],
                [400, 1495, 14, 29.6, 0.1],
                [500, 1468, 14, 29.5, 0.1],
                [600, 1440, 14, 29.3],
                [700, 1412, 14, 29.2, 0.1],
                [800, 1383, 14, 29.0, 0.1],
                [900, 1354, 16, 28.9, 0.2],
                [1000, 1323, 16, 28.6, 0.1],
                [1100, 1291, 17, 28.4, 0.2],
                [1200, 1257, 18, 28.1, 0.2],
                [1300, 1221, 18, 27.7, 0.2],
                [1400, 1183, 20, 27.3, 0.2],
                [1500, 1142, 23, 26.8, 0.3],
                [1600, 1096, 25, 26.2, 0.3],
                [1700, 1044, 30, 25.5, 0.5],
                [1800, 980, 38, 24.5, 0.6],
                [1900, 892, 84, 23.0, 1.5]
            ],
            4: [
                [400, 1517, 11, 33.6],
                [500, 1495, 10, 33.5],
                [600, 1474, 11, 33.5, 0.1],
                [700, 1452, 11, 33.4, 0.1],
                [800, 1429, 11, 33.2],
                [900, 1407, 12, 33.1],
                [1000, 1383, 11, 33.0, 0.1],
                [1100, 1360, 12, 32.8, 0.1],
                [1200, 1335, 12, 32.6, 0.1],
                [1300, 1310, 13, 32.4, 0.1],
                [1400, 1284, 14, 32.1, 0.1],
                [1500, 1257, 14, 31.9, 0.2],
                [1600, 1228, 15, 31.5, 0.1],
                [1700, 1199, 17, 31.2, 0.2],
                [1800, 1166, 16, 30.8, 0.2],
                [1900, 1132, 18, 30.3, 0.2],
                [2000, 1096, 21, 28.8, 0.3],
                [2100, 1055, 23, 29.1, 0.3],
                [2200, 1008, 28, 28.4, 0.5],
                [2300, 952, 36, 27.7, 0.7],
                [2400, 871, 67, 25.8, 1.5],
            ]
        },
        ILUM: {
            1: [
                [200, 1463, 35, 18.1, 0.1],
                [250, 1428, 37, 18.0, 0.1],
                [300, 1391, 39, 17.9, 0.2],
                [350, 1352, 40, 17.7, 0.2],
                [400, 1312, 43, 17.5, 0.2],
                [450, 1269, 45, 17.3, 0.3],
                [500, 1224, 49, 17.0, 0.3],
                [550, 1175, 55, 16.7, 0.4],
                [600, 1120, 65, 16.3, 0.6],
                [650, 1055, 81, 15.7, 0.7],
                [700, 974, 151, 15.0, 1.7],
                [750, 823, null, 13.3, null]
            ],
            2: [
                [200, 1528, 17, 26.2, 0.1],
                [300, 1493, 18, 26.1, 0.1],
                [400, 1457, 19, 26.0, 0.1],
                [500, 1419, 19, 25.8, 0.1],
                [600, 1379, 20, 25.6, 0.1],
                [700, 1338, 21, 25.4, 0.2],
                [800, 1295, 23, 25.1, 0.2],
                [900, 1249, 25, 24.7, 0.2],
                [1000, 1199, 27, 24.3, 0.3],
                [1100, 1144, 30, 23.7, 0.3],
                [1200, 1081, 35, 23.0, 0.4],
                [1300, 1005, 47, 22.0, 0.6],
                [1400, 900, 98, 20.5, 1.6],
            ],
            3: [
                [300, 1521, 14, 31.1],
                [400, 1494, 14, 31.1, 0,1],
                [500, 1466, 14, 31.0, 0.1],
                [600, 1438, 14, 30.8],
                [700, 1409, 14, 30.7, 0.1],
                [800, 1380, 16, 30.5, 0.1],
                [900, 1349, 16, 30.3, 0.1],
                [1000, 1317, 16, 30.1, 0.2],
                [1100, 1284, 18, 29.8, 0.2],
                [1200, 1249, 19, 29.4, 0.2],
                [1300, 1212, 20, 29.1, 0.3],
                [1400, 1172, 21, 28.6, 0.2],
                [1500, 1128, 22, 28.1, 0.3],
                [1600, 1081, 26, 27.4, 0.3],
                [1700, 1027, 30, 26.6, 0.4],
                [1800, 962, 39, 25.6, 0.7],
                [1900, 875, 67, 24.1, 1.3],
            ],
            4: [
                [400, 1515, 11, 35.7],
                [500, 1493, 11, 35.7, 0.1],
                [600, 1471, 11, 35.6, 0.1],
                [700, 1448, 11, 35.5, 0.1],
                [800, 1426, 12, 35.4, 0.1],
                [900, 1402, 12, 35.2, 0.1],
                [1000, 1378, 12, 35.0, 0.1],
                [1100, 1353, 13, 34.8, 0.1],
                [1200, 1328, 13, 34.6, 0.1],
                [1300, 1301, 14, 34.4, 0.2],
                [1400, 1274, 14, 34.1, 0.1],
                [1500, 1245, 15, 33.8, 0.2],
                [1600, 1215, 15, 33.4, 0.1],
                [1700, 1184, 17, 33.0, 0.2],
                [1800, 1151, 18, 32.6, 0.3],
                [1900, 1115, 19, 32.1, 0.3],
                [2000, 1076, 21, 31.5, 0.4],
                [2100, 1033, 23, 30.8, 0.4],
                [2200, 985, 27, 29.8, 0.5],
                [2300, 928, 33, 28.8, 0.5],
                [2400, 855, 52, 27.4, 1.1],
            ]
        },
        PRACTICE: {
            0:  [
                [50, 1540, 61, 13.2, 0.1],
                [100, 1479, 63, 13.2, 0.2],
                [150, 1416, 66, 13.0, 0.2],
                [200, 1350, 71, 12.8, 0.2],
                [250, 1279, 78, 12.6, 0.3],
                [300, 1201, 95, 12.3, 0.6],
                [350, 1106, 151, 11.7, 1.0],
                [400, 955, 0, 10.7, 1.5]
            ],
            1: [
                [200, 1498, 26, 20.4, 0.1],
                [300, 1445, 27, 20.3, 0.1],
                [400, 1391, 29, 20.1, 0.1],
                [500, 1333, 30, 19.8, 0.1],
                [600, 1271, 34, 19.4, 0.2],
                [700, 1204, 34, 19.0, 0.3],
                [800, 1124, 47, 18.3, 0.4],
                [900, 1023, 72, 17.3, 0.8],
                [1000, 812, null, 14.7, 1.0]
            ],
            2: [
                [300, 1507, 15, 26.5],
                [400, 1476, 16, 26.4],
                [500, 1444, 17, 26.3, 0.1],
                [600, 1411, 17, 26.2, 0.1],
                [700, 1377, 17, 26.0, 0.1],
                [800, 1342, 18, 25.8, 0.1],
                [900, 1305, 19, 25.5, 0.1],
                [1000, 1267, 20, 25.2, 0.1],
                [1100, 1226, 21, 24.9, 0.2],
                [1200, 1182, 24, 24.4, 0.2],
                [1300, 1133, 26, 23.9, 0.3],
                [1400, 1078, 31, 23.2, 0.3],
                [1500, 1011, 42, 22.4, 0.6],
                [1600, 916, 105, 20.9, 1.7]
            ],
            3: [
                [400, 1511, 11, 31.6, 0.1],
                [500, 1489, 12, 31.5, 0.1],
                [600, 1466, 12, 31.5, 0.1],
                [700, 1442, 11, 31.4, 0.1],
                [800, 1419, 12, 31.2, 0.1],
                [900, 1395, 13, 31.1, 0.1],
                [1000, 1370, 13, 30.9, 0.1],
                [1100, 1345, 14, 30.7, 0.1],
                [1200, 1318, 13, 30.5, 0.1],
                [1300, 1291, 14, 30.3, 0.1],
                [1400, 1263, 14, 30.0, 0.2],
                [1500, 1233, 15, 29.7, 0.2],
                [1600, 1202, 16, 29.4, 0.2],
                [1700, 1169, 17, 29.0, 0.2],
                [1800, 1134, 19, 28.5, 0.3],
                [1900, 1095, 22, 28.0, 0.4],
                [2000, 1051, 25, 27.3, 0.4],
                [2100, 1000, 31, 26.5, 0.6],
                [2200, 933, 46, 25.3, 0.9],
                [2300, 803, null, 22.7]
            ],
            4: [
                [500, 1512, 9, 35.9, 0.1],
                [600, 1494, 9, 35.8, 0.1],
                [700, 1476, 9, 35.7, 0.1],
                [800, 1458, 9, 35.7, 0.1],
                [900, 1439, 9, 35.6, 0.1],
                [1000, 1420, 9, 35.4, 0.1],
                [1100, 1402, 10, 35.3, 0.1],
                [1200, 1382, 10, 35.2, 0.1],
                [1300, 1362, 10, 35.0, 0.1],
                [1400, 1342, 11, 34.9, 0.1],
                [1500, 1321, 11, 34.7, 0.1],
                [1600, 1300, 12, 34.5, 0.2],
                [1700, 1277, 12, 34.2, 0.1],
                [1800, 1255, 12, 34.0, 0.2],
                [1900, 1231, 13, 33.7, 0.2],
                [2000, 1206, 13, 33.4, 0.2],
                [2100, 1180, 13, 33.0, 0.2],
                [2200, 1153, 15, 32.7, 0.3],
                [2300, 1123, 15, 32.2, 0.2],
                [2400, 1092, 17, 31.7, 0.3],
                [2500, 1058, 19, 31.1, 0.3],
                [2600, 1018, 20, 30.4, 0.4],
                [2700, 973, 26, 29.5, 0.5],
                [2800, 915, 40, 28.4, 0.9],
                [2900, 812, null, 26.1, 1.0]
            ]
        }
    };

    const table = firingTables[shell]?.[rings];
    if (!table) {
        return null;
    }

    // --- Azimuth Calculation ---
    const dx = (400 - targetY) - (400 - mortarY);
    const dy = mortarX - targetX;

    const angleRadians = Math.atan2(dy, dx);
    const angleDegrees = angleRadians * 180 / Math.PI;

    let azimuth = (angleDegrees * 6400 / 360) + 3200;
    azimuth = ((azimuth % 6400) + 6400) % 6400;

    // --- Range calculation in meters ---
    const range = Math.sqrt(Math.pow(targetX - mortarX, 2) + Math.pow(targetY - mortarY, 2)) * 10;

    // Height difference in meters
    const heightDiff = targetAlt - mortarAlt;

    // --- Interpolation helper ---
    function interpolate(x, x0, y0, x1, y1) {
        if (x1 === x0) return y0;
        return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
    }

    // Find bounding ranges for interpolation
    let lower = table[0];
    let upper = table[table.length - 1];

    for (let i = 0; i < table.length - 1; i++) {
        if (range >= table[i][0] && range <= table[i + 1][0]) {
            lower = table[i];
            upper = table[i + 1];
            break;
        }
    }

    // Interpolate elevation and TOF
    let elevInterp = interpolate(range, lower[0], lower[1], upper[0], upper[1]);
    let dElevInterp = interpolate(range, lower[0], lower[2], upper[0], upper[2]);
    let tofInterp = interpolate(range, lower[0], lower[3], upper[0], upper[3]);
    let dTofInterp = interpolate(range, lower[0], lower[4], upper[0], upper[4]);

    // Adjust elevation for height difference
    let correctedElevation;
    if (heightDiff > 0) {
        correctedElevation = elevInterp - (dElevInterp * heightDiff / 100);
    } else {
        correctedElevation = elevInterp + (dElevInterp * Math.abs(heightDiff) / 100);
    }

    // Adjust TOF for height difference
    let correctedTof;
    if (heightDiff === 0) {
        correctedTof = tofInterp;
    } else if (heightDiff > 0) {
        correctedTof = tofInterp - (dTofInterp * heightDiff / 100);
    } else {
        correctedTof = tofInterp + (dTofInterp * Math.abs(heightDiff) / 100);
    }

    // --- Apply corrections (ADD/DROP forward/back, LEFT/RIGHT lateral) ---
    const foDirRad = foDirDeg * Math.PI / 180;

    const xCorr = (addDrop/10);
    const yCorr = (leftRight/10);

    const correctedTargetX = targetX + xCorr * Math.sin(foDirRad) + yCorr * Math.cos(foDirRad);
    const correctedTargetY = targetY + xCorr * Math.cos(foDirRad) - yCorr * Math.sin(foDirRad);

    // Recalculate azimuth corrected
    const dxCorr = (400 - correctedTargetY) - (400 - mortarY);
    const dyCorr = mortarX - correctedTargetX;
    let azimuthCorr = (Math.atan2(dyCorr, dxCorr) * 180 / Math.PI) * 6400 / 360 + 3200;
    azimuthCorr = ((azimuthCorr % 6400) + 6400) % 6400;

    // Recalculate range corrected
    const rangeCorr = Math.sqrt(Math.pow(correctedTargetX - mortarX, 2) + Math.pow(correctedTargetY - mortarY, 2)) * 10;

    // Interpolate elevation and TOF again for corrected range
    let lowerCorr = table[0];
    let upperCorr = table[table.length - 1];

    for (let i = 0; i < table.length - 1; i++) {
        if (rangeCorr >= table[i][0] && rangeCorr <= table[i + 1][0]) {
            lowerCorr = table[i];
            upperCorr = table[i + 1];
            break;
        }
    }

    let elevInterpCorr = interpolate(rangeCorr, lowerCorr[0], lowerCorr[1], upperCorr[0], upperCorr[1]);
    let dElevInterpCorr = interpolate(rangeCorr, lowerCorr[0], lowerCorr[2], upperCorr[0], upperCorr[2]);
    let tofInterpCorr = interpolate(rangeCorr, lowerCorr[0], lowerCorr[3], upperCorr[0], upperCorr[3]);
    let dTofInterpCorr = interpolate(rangeCorr, lowerCorr[0], lowerCorr[4], upperCorr[0], upperCorr[4]);

    let correctedElevationCorr;
    if (heightDiff > 0) {
        correctedElevationCorr = elevInterpCorr - (dElevInterpCorr * heightDiff / 100);
    } else {
        correctedElevationCorr = elevInterpCorr + (dElevInterpCorr * Math.abs(heightDiff) / 100);
    }

    let correctedTofCorr;
    if (heightDiff === 0) {
        correctedTofCorr = tofInterpCorr;
    } else if (heightDiff > 0) {
        correctedTofCorr = tofInterpCorr - (dTofInterpCorr * heightDiff / 100);
    } else {
        correctedTofCorr = tofInterpCorr + (dTofInterpCorr * Math.abs(heightDiff) / 100);
    }

    return {
        azimuth: azimuth,
        elevation: correctedElevation,
        tof: correctedTof,
        azimuthCorr: azimuthCorr,
        elevationCorr: correctedElevationCorr,
        tofCorr: correctedTofCorr
    };
}

function calculateGridMissionParallelSheaf(bypassNFA = false) {
    // Trigger ring updates before calculation
    triggerRingUpdatesForCalculation('grid');
    
    // Use flexible validation
    const validation = validateMissionFields('grid');
    
    // Show errors if any
    if (validation.errors.length > 0) {
        showAlertModal('Validation Error', 'Please fix the following errors:\n\n' + validation.errors.join('\n'));
        return;
    }
    
    // Get global data
    const selectedSections = getSelectedSections('grid');
    const gunConfiguration = getGunConfiguration();
    
    // Get target data
    const targetX = parseFloat(document.getElementById("target-x").value);
    const targetY = parseFloat(document.getElementById("target-y").value);
    const targetAlt = parseFloat(document.getElementById("target-alt").value) || 0;
    
    // Check for NFA violation (unless bypassing)
    if (!bypassNFA) {
        const nfaCheck = checkNFAViolation(targetX, targetY);
        if (nfaCheck.violated) {
            showNFAWarningModal(nfaCheck, 'grid');
            return; // Don't proceed until user decides
        }
    }
    
    // Get mission parameters
    const sheafType = document.getElementById("sheaf-type-grid").value;
    const foDirDeg = parseFloat(document.getElementById("fo-dir").value) || 0;
    const addDrop = parseFloat(document.getElementById("add-drop").value) || 0;
    const leftRight = parseFloat(document.getElementById("left-right").value) || 0;

    // Calculate total guns from selected sections
    let totalGuns = 0;
    let gunStartIndex = 1;
    const sectionGuns = [];
    
    for (let i = 1; i <= gunConfiguration.length; i++) {
        const section = gunConfiguration[i - 1];
        if (selectedSections.includes(section.section)) {
            sectionGuns.push({
                section: section.section,
                guns: section.guns,
                startIndex: gunStartIndex,
                endIndex: gunStartIndex + section.guns - 1
            });
            totalGuns += section.guns;
            gunStartIndex += section.guns;
        }
    }
    
    // Determine which gun to use for parallel sheaf calculations (use first gun from first selected section)
    let calculationGun = 1;
    if (totalGuns > 1) {
        calculationGun = 2; // Use gun 2 if more than 1 gun
    }
    
    // Get mortar coordinates for the calculation gun
    const mortarCoords = getMortarCoordinates(calculationGun);
    if (!mortarCoords.x || !mortarCoords.y) {
        alert(`Please enter coordinates for Gun ${calculationGun}`);
        return;
    }
    
    // Get section-specific altitude, shell, and rings for the calculation gun
    const calculationGunSection = getSectionForGun(calculationGun);
    const sectionMortarAlt = getSectionAltitude(calculationGunSection);
    const sectionShell = document.getElementById(`section-${calculationGunSection}-shell-grid`).value;
    const sectionRings = parseInt(document.getElementById(`section-${calculationGunSection}-rings-grid`).value);
    
    // Check range validation
    const range = calculateRange(mortarCoords.x, mortarCoords.y, targetX, targetY);
    const rangeCheck = checkTargetRange(range, sectionShell);
    if (!rangeCheck.inRange) {
        alert(rangeCheck.reason);
        return;
    }
    
    // Calculate base solution using the selected gun
    const baseSolution = calculateSingleGunBallistics(
        mortarCoords.x, mortarCoords.y, targetX, targetY, sectionMortarAlt, targetAlt,
        sectionShell, sectionRings, addDrop, leftRight, foDirDeg
    );

    if (!baseSolution) {
        alert("Firing table not available for this shell/ring combination.");
        return;
    }

    // Display base results
    document.getElementById("range-grid").textContent = Math.round(range);
    document.getElementById("azimuth").textContent = Math.round(baseSolution.azimuth);
    document.getElementById("elevation").textContent = Math.round(baseSolution.elevation);
    document.getElementById("tof").textContent = baseSolution.tof.toFixed(1);

    document.getElementById("azimuth-corr").textContent = Math.round(baseSolution.azimuthCorr);
    document.getElementById("elevation-corr").textContent = Math.round(baseSolution.elevationCorr);
    document.getElementById("tof-corr").textContent = baseSolution.tofCorr.toFixed(1);
    
    // Show result sections
    document.getElementById('base-results-grid').style.display = 'block';
    document.getElementById('corrected-results-grid').style.display = 'block';
    
    console.log('Grid mission results displayed:', {
        range: Math.round(range),
        azimuth: Math.round(baseSolution.azimuth),
        elevation: Math.round(baseSolution.elevation),
        tof: baseSolution.tof.toFixed(1),
        azimuthCorr: Math.round(baseSolution.azimuthCorr),
        elevationCorr: Math.round(baseSolution.elevationCorr),
        tofCorr: baseSolution.tofCorr.toFixed(1)
    });

    // Calculate solutions for all guns based on sheaf type
    let gunSolutions = [];
    
    if (sheafType === 'parallel') {
        // For parallel sheaf, all guns use the same solution
        // Calculate corrected target coordinates based on corrections
        const foDirRad = foDirDeg * Math.PI / 180;
        const xCorr = (addDrop/10);
        const yCorr = (leftRight/10);
        const correctedTargetX = targetX + xCorr * Math.sin(foDirRad) + yCorr * Math.cos(foDirRad);
        const correctedTargetY = targetY + xCorr * Math.cos(foDirRad) - yCorr * Math.sin(foDirRad);
        
        // Calculate solutions for all guns from selected sections
        for (const section of sectionGuns) {
            for (let i = section.startIndex; i <= section.endIndex; i++) {
                gunSolutions.push({
                    gun: i - section.startIndex + 1, // Section-relative gun number
                    section: section.section,
                    azimuth: baseSolution.azimuthCorr,
                    elevation: baseSolution.elevationCorr,
                    tof: baseSolution.tofCorr,
                    targetX: correctedTargetX,
                    targetY: correctedTargetY
                });
            }
        }
    } else if (sheafType === 'linear') {
        // For linear sheaf, calculate individual target coordinates for each gun
        const sheafLength = parseFloat(document.getElementById("sheaf-length").value);
        const sheafDirection = parseFloat(document.getElementById("sheaf-direction").value);
        
        if (!sheafLength || sheafDirection === null || sheafDirection === undefined || isNaN(sheafDirection)) {
            alert("Please enter sheaf length and direction for linear sheaf");
            return;
        }
        
        // Scale down sheaf length by dividing by 10 (convert meters to calculation units)
        const scaledSheafLength = sheafLength / 10;
        
        // Calculate target coordinates for each gun
        const targetCoordinates = calculateLinearSheafTargets(targetX, targetY, scaledSheafLength, sheafDirection, totalGuns);
        
        // Calculate ballistic solution for each gun-target pair
        let gunIndex = 0;
        for (const section of sectionGuns) {
            for (let i = section.startIndex; i <= section.endIndex; i++) {
                const gunCoords = getMortarCoordinates(i);
                if (!gunCoords.x || !gunCoords.y) {
                    alert(`Please enter coordinates for Gun ${i}`);
                    return;
                }
                
                const targetCoord = targetCoordinates[gunIndex];
                
                // Apply corrections to target coordinates
                const foDirRad = foDirDeg * Math.PI / 180;
                const xCorr = (addDrop/10);
                const yCorr = (leftRight/10);
                const correctedTargetX = targetCoord.x + xCorr * Math.sin(foDirRad) + yCorr * Math.cos(foDirRad);
                const correctedTargetY = targetCoord.y + xCorr * Math.cos(foDirRad) - yCorr * Math.sin(foDirRad);
                
                // Get section-specific altitude, shell, and rings for this gun
                const gunSection = getSectionForGun(i);
                const gunSectionAlt = getSectionAltitude(gunSection);
                const gunSectionShell = document.getElementById(`section-${gunSection}-shell-grid`).value;
                const gunSectionRings = parseInt(document.getElementById(`section-${gunSection}-rings-grid`).value);
                
                const solution = calculateSingleGunBallistics(
                    gunCoords.x, gunCoords.y, correctedTargetX, correctedTargetY, gunSectionAlt, targetAlt,
                    gunSectionShell, gunSectionRings, 0, 0, foDirDeg // Pass 0 for corrections to avoid double-correction
                );
                
                if (solution) {
                    gunSolutions.push({
                        gun: i - section.startIndex + 1, // Section-relative gun number
                        section: section.section,
                        azimuth: solution.azimuthCorr,
                        elevation: solution.elevationCorr,
                        tof: solution.tofCorr,
                        targetX: correctedTargetX,
                        targetY: correctedTargetY
                    });
                }
                gunIndex++;
            }
        }
    } else if (sheafType === 'circular') {
        // For circular sheaf, calculate individual target coordinates for each gun
        const sheafDiameter = parseFloat(document.getElementById("sheaf-diameter").value);
        
        if (!sheafDiameter || sheafDiameter <= 0) {
            alert("Please enter a valid sheaf diameter for circular sheaf");
            return;
        }
        
        // Scale down sheaf diameter by dividing by 10 (convert meters to calculation units)
        const scaledSheafDiameter = sheafDiameter / 10;
        
        // Calculate target coordinates for each gun
        const targetCoordinates = calculateCircularSheafTargets(targetX, targetY, scaledSheafDiameter, totalGuns);
        
        // Calculate ballistic solution for each gun-target pair
        let gunIndex = 0;
        for (const section of sectionGuns) {
            for (let i = section.startIndex; i <= section.endIndex; i++) {
                const gunCoords = getMortarCoordinates(i);
                if (!gunCoords.x || !gunCoords.y) {
                    alert(`Please enter coordinates for Gun ${i}`);
                    return;
                }
                
                const targetCoord = targetCoordinates[gunIndex];
                
                // Apply corrections to target coordinates
                const foDirRad = foDirDeg * Math.PI / 180;
                const xCorr = (addDrop/10);
                const yCorr = (leftRight/10);
                const correctedTargetX = targetCoord.x + xCorr * Math.sin(foDirRad) + yCorr * Math.cos(foDirRad);
                const correctedTargetY = targetCoord.y + xCorr * Math.cos(foDirRad) - yCorr * Math.sin(foDirRad);
                
                // Get section-specific altitude, shell, and rings for this gun
                const gunSection = getSectionForGun(i);
                const gunSectionAlt = getSectionAltitude(gunSection);
                const gunSectionShell = document.getElementById(`section-${gunSection}-shell-grid`).value;
                const gunSectionRings = parseInt(document.getElementById(`section-${gunSection}-rings-grid`).value);
                
                const solution = calculateSingleGunBallistics(
                    gunCoords.x, gunCoords.y, correctedTargetX, correctedTargetY, gunSectionAlt, targetAlt,
                    gunSectionShell, gunSectionRings, 0, 0, foDirDeg // Pass 0 for corrections to avoid double-correction
                );
                
                if (solution) {
                    gunSolutions.push({
                        gun: i - section.startIndex + 1, // Section-relative gun number
                        section: section.section,
                        azimuth: solution.azimuthCorr,
                        elevation: solution.elevationCorr,
                        tof: solution.tofCorr,
                        targetX: correctedTargetX,
                        targetY: correctedTargetY
                    });
                }
                gunIndex++;
            }
        }
    } else if (sheafType === 'converged') {
        // For converged sheaf, all guns fire at exactly the same target coordinate
        // Calculate ballistic solution for each gun to the same target
        for (const section of sectionGuns) {
            for (let i = section.startIndex; i <= section.endIndex; i++) {
                const gunCoords = getMortarCoordinates(i);
                if (!gunCoords.x || !gunCoords.y) {
                    alert(`Please enter coordinates for Gun ${i}`);
                    return;
                }
                
                // Apply corrections to target coordinates
                const foDirRad = foDirDeg * Math.PI / 180;
                const xCorr = (addDrop/10);
                const yCorr = (leftRight/10);
                const correctedTargetX = targetX + xCorr * Math.sin(foDirRad) + yCorr * Math.cos(foDirRad);
                const correctedTargetY = targetY + xCorr * Math.cos(foDirRad) - yCorr * Math.sin(foDirRad);
                
                // Get section-specific altitude, shell, and rings for this gun
                const gunSection = getSectionForGun(i);
                const gunSectionAlt = getSectionAltitude(gunSection);
                const gunSectionShell = document.getElementById(`section-${gunSection}-shell-grid`).value;
                const gunSectionRings = parseInt(document.getElementById(`section-${gunSection}-rings-grid`).value);
                
                const solution = calculateSingleGunBallistics(
                    gunCoords.x, gunCoords.y, correctedTargetX, correctedTargetY, gunSectionAlt, targetAlt,
                    gunSectionShell, gunSectionRings, 0, 0, foDirDeg // Pass 0 for corrections to avoid double-correction
                );
                
                if (solution) {
                    gunSolutions.push({
                        gun: i - section.startIndex + 1, // Section-relative gun number
                        section: section.section,
                        azimuth: solution.azimuthCorr,
                        elevation: solution.elevationCorr,
                        tof: solution.tofCorr,
                        targetX: correctedTargetX,
                        targetY: correctedTargetY
                    });
                }
            }
        }
    } else if (sheafType === 'open') {
        // For open sheaf, calculate specific target coordinates for each gun
        // Gun 1: subtract 1 from X and 1 from Y
        // Gun 2: use original coordinates (base gun)
        // Gun 3: add 1 to X and subtract 1 from Y
        // Gun 4: add 2 to X and change nothing to Y
        
        // Check if all sections are selected
        const allSectionsCheckbox = document.getElementById('all-sections-grid');
        const useGlobalGunIndex = allSectionsCheckbox && allSectionsCheckbox.checked;
        
        let globalGunIndex = 0;
        for (const section of sectionGuns) {
            for (let i = section.startIndex; i <= section.endIndex; i++) {
                const gunCoords = getMortarCoordinates(i);
                if (!gunCoords.x || !gunCoords.y) {
                    alert(`Please enter coordinates for Gun ${i}`);
                    return;
                }
                
                // Calculate target coordinates based on gun position
                let targetCoordX = targetX;
                let targetCoordY = targetY;
                
                let gunPosition;
                if (useGlobalGunIndex) {
                    // When all sections are selected, use global gun index (1 to n)
                    gunPosition = (globalGunIndex % 4) + 1; // 1-4 cycle
                } else {
                    // When specific sections are selected, use section-relative positioning
                    gunPosition = (i - section.startIndex + 1) % 4; // 1-4 cycle
                    if (gunPosition === 0) gunPosition = 4; // Convert 0 to 4 for Gun 4
                }
                
                if (gunPosition === 1) {
                    // Gun 1: subtract 1 from X and 1 from Y
                    targetCoordX = targetX - 1;
                    targetCoordY = targetY - 1;
                } else if (gunPosition === 2) {
                    // Gun 2: use original coordinates (base gun)
                    targetCoordX = targetX;
                    targetCoordY = targetY;
                } else if (gunPosition === 3) {
                    // Gun 3: add 1 to X and subtract 1 from Y
                    targetCoordX = targetX + 1;
                    targetCoordY = targetY - 1;
                } else if (gunPosition === 4) {
                    // Gun 4: add 2 to X and change nothing to Y
                    targetCoordX = targetX + 2;
                    targetCoordY = targetY;
                }
                
                // Apply corrections to target coordinates
                const foDirRad = foDirDeg * Math.PI / 180;
                const xCorr = (addDrop/10);
                const yCorr = (leftRight/10);
                const correctedTargetX = targetCoordX + xCorr * Math.sin(foDirRad) + yCorr * Math.cos(foDirRad);
                const correctedTargetY = targetCoordY + xCorr * Math.cos(foDirRad) - yCorr * Math.sin(foDirRad);
                
                // Get section-specific altitude, shell, and rings for this gun
                const gunSection = getSectionForGun(i);
                const gunSectionAlt = getSectionAltitude(gunSection);
                const gunSectionShell = document.getElementById(`section-${gunSection}-shell-grid`).value;
                const gunSectionRings = parseInt(document.getElementById(`section-${gunSection}-rings-grid`).value);
                
                const solution = calculateSingleGunBallistics(
                    gunCoords.x, gunCoords.y, correctedTargetX, correctedTargetY, gunSectionAlt, targetAlt,
                    gunSectionShell, gunSectionRings, 0, 0, foDirDeg // Pass 0 for corrections to avoid double-correction
                );
                
                if (solution) {
                    gunSolutions.push({
                        gun: i - section.startIndex + 1, // Section-relative gun number (display purposes)
                        section: section.section,
                        azimuth: solution.azimuthCorr,
                        elevation: solution.elevationCorr,
                        tof: solution.tofCorr,
                        targetX: correctedTargetX,
                        targetY: correctedTargetY
                    });
                }
                globalGunIndex++;
            }
        }
    }

    // For all sheaf types, gun solutions are already corrected, so display them directly
    displayGunSolutions(gunSolutions, 'gun-solutions-content-grid');
    
    document.getElementById("fire-solution-guns-grid").style.display = 'block';
}

// Function to display gun solutions
function displayGunSolutions(solutions, containerId) {
    const container = document.getElementById(containerId);
    if (!solutions || solutions.length === 0) {
        container.textContent = "No solutions available";
        return;
    }

    let output = "";
    
    // Group solutions by section
    const solutionsBySection = {};
    solutions.forEach(solution => {
        if (!solutionsBySection[solution.section]) {
            solutionsBySection[solution.section] = [];
        }
        solutionsBySection[solution.section].push(solution);
    });
    
    // Display solutions grouped by section
    Object.keys(solutionsBySection).sort().forEach(sectionNumber => {
        output += `Section ${sectionNumber}:\n`;
        solutionsBySection[sectionNumber].forEach(solution => {
            output += `  Gun ${solution.gun}:\n`;
            output += `    Azimuth: ${Math.round(solution.azimuth)} mils\n`;
            output += `    Elevation: ${Math.round(solution.elevation)} mils\n`;
            output += `    TOF: ${solution.tof.toFixed(1)} sec\n`;
            if (solution.targetX !== undefined && solution.targetY !== undefined) {
                output += `    Target: (${solution.targetX.toFixed(1)}, ${solution.targetY.toFixed(1)})\n`;
            }
            output += "\n";
        });
    });
    
    container.textContent = output;
}



function calculatePolarMissionParallelSheaf(bypassNFA = false) {
    // Trigger ring updates before calculation
    triggerRingUpdatesForCalculation('polar');
    
    // Use flexible validation
    const validation = validateMissionFields('polar');
    
    // Show errors if any
    if (validation.errors.length > 0) {
        showAlertModal('Validation Error', 'Please fix the following errors:\n\n' + validation.errors.join('\n'));
        return;
    }
    
    // Get global data
    const selectedSections = getSelectedSections('polar');
    const gunConfiguration = getGunConfiguration();
    
    // FO inputs from polar mission section
    const foX = parseFloat(document.getElementById("fo-x-polar").value);
    const foY = parseFloat(document.getElementById("fo-y-polar").value);
    const foDist = parseFloat(document.getElementById("fo-dist-polar").value);
    const foDirDeg = parseFloat(document.getElementById("fo-dir-polar").value) || 0;
    const targetAlt = parseFloat(document.getElementById("target-alt-polar").value) || 0;

    const sheafType = document.getElementById("sheaf-type-polar").value;

    // Get corrections from polar mission section
    const addDrop = parseFloat(document.getElementById("add-drop-polar").value) || 0;
    const leftRight = parseFloat(document.getElementById("left-right-polar").value) || 0;

    // Calculate total guns from selected sections
    let totalGuns = 0;
    let gunStartIndex = 1;
    const sectionGuns = [];
    
    for (let i = 1; i <= gunConfiguration.length; i++) {
        const section = gunConfiguration[i - 1];
        if (selectedSections.includes(section.section)) {
            sectionGuns.push({
                section: section.section,
                guns: section.guns,
                startIndex: gunStartIndex,
                endIndex: gunStartIndex + section.guns - 1
            });
            totalGuns += section.guns;
            gunStartIndex += section.guns;
        }
    }
    
    // Determine which gun to use for parallel sheaf calculations (use first gun from first selected section)
    let calculationGun = 1;
    if (totalGuns > 1) {
        calculationGun = 2; // Use gun 2 if more than 1 gun
    }
    
    // Get mortar coordinates for the calculation gun
    const mortarCoords = getMortarCoordinates(calculationGun);
    if (!mortarCoords.x || !mortarCoords.y) {
        alert(`Please enter coordinates for Gun ${calculationGun}`);
        return;
    }

    // Convert polar coordinates to grid coordinates
    const foDirRad = foDirDeg * Math.PI / 180;
    // Scale down FO distance by dividing by 10 (convert meters to calculation units)
    const scaledFoDist = foDist / 10;
    const targetX = foX + scaledFoDist * Math.sin(foDirRad);
    const targetY = foY + scaledFoDist * Math.cos(foDirRad);
    
    // Check for NFA violation after calculating target coordinates (unless bypassing)
    if (!bypassNFA) {
        const nfaCheck = checkNFAViolation(targetX, targetY);
        if (nfaCheck.violated) {
            showNFAWarningModal(nfaCheck, 'polar');
            return; // Don't proceed until user decides
        }
    }
    
    // Get section-specific altitude, shell, and rings for the calculation gun
    const calculationGunSection = getSectionForGun(calculationGun);
    const sectionMortarAlt = getSectionAltitude(calculationGunSection);
    const sectionShell = document.getElementById(`section-${calculationGunSection}-shell-polar`).value;
    const sectionRings = parseInt(document.getElementById(`section-${calculationGunSection}-rings-polar`).value);
    
    // Check range validation
    const range = calculateRange(mortarCoords.x, mortarCoords.y, targetX, targetY);
    const rangeCheck = checkTargetRange(range, sectionShell);
    if (!rangeCheck.inRange) {
        alert(rangeCheck.reason);
        return;
    }
    
    // Calculate base solution using the selected gun
    const baseSolution = calculateSingleGunBallistics(
        mortarCoords.x, mortarCoords.y, targetX, targetY, sectionMortarAlt, targetAlt,
        sectionShell, sectionRings, addDrop, leftRight, foDirDeg
    );

    if (!baseSolution) {
        alert("Firing table not available for this shell/ring combination.");
        return;
    }

    // Display base results
    document.getElementById("range-polar").textContent = Math.round(range);
    document.getElementById("azimuth-polar").textContent = Math.round(baseSolution.azimuth);
    document.getElementById("elevation-polar").textContent = Math.round(baseSolution.elevation);
    document.getElementById("tof-polar").textContent = baseSolution.tof.toFixed(1);

    // Display corrected results
    document.getElementById("azimuth-corr-polar").textContent = Math.round(baseSolution.azimuthCorr);
    document.getElementById("elevation-corr-polar").textContent = Math.round(baseSolution.elevationCorr);
    document.getElementById("tof-corr-polar").textContent = baseSolution.tofCorr.toFixed(1);
    
    // Show result sections
    document.getElementById('base-results-polar').style.display = 'block';
    document.getElementById('corrected-results-polar').style.display = 'block';
    
    console.log('Polar mission results displayed:', {
        range: Math.round(range),
        azimuth: Math.round(baseSolution.azimuth),
        elevation: Math.round(baseSolution.elevation),
        tof: baseSolution.tof.toFixed(1),
        azimuthCorr: Math.round(baseSolution.azimuthCorr),
        elevationCorr: Math.round(baseSolution.elevationCorr),
        tofCorr: baseSolution.tofCorr.toFixed(1)
    });

    // Calculate solutions for all guns based on sheaf type
    let gunSolutions = [];
    
    if (sheafType === 'parallel') {
        // For parallel sheaf, all guns use the same solution
        // Calculate corrected target coordinates based on corrections
        const foDirRad = foDirDeg * Math.PI / 180;
        const xCorr = (addDrop/10);
        const yCorr = (leftRight/10);
        const correctedTargetX = targetX + xCorr * Math.sin(foDirRad) + yCorr * Math.cos(foDirRad);
        const correctedTargetY = targetY + xCorr * Math.cos(foDirRad) - yCorr * Math.sin(foDirRad);
        
        // Calculate solutions for all guns from selected sections
        for (const section of sectionGuns) {
            for (let i = section.startIndex; i <= section.endIndex; i++) {
                gunSolutions.push({
                    gun: i - section.startIndex + 1, // Section-relative gun number
                    section: section.section,
                    azimuth: baseSolution.azimuthCorr,
                    elevation: baseSolution.elevationCorr,
                    tof: baseSolution.tofCorr,
                    targetX: correctedTargetX,
                    targetY: correctedTargetY
                });
            }
        }
    } else if (sheafType === 'linear') {
        // For linear sheaf, calculate individual target coordinates for each gun
        const sheafLength = parseFloat(document.getElementById("sheaf-length-polar").value);
        const sheafDirection = parseFloat(document.getElementById("sheaf-direction-polar").value);
        
        if (!sheafLength || sheafDirection === null || sheafDirection === undefined || isNaN(sheafDirection)) {
            alert("Please enter sheaf length and direction for linear sheaf");
            return;
        }
        
        // Scale down sheaf length by dividing by 10 (convert meters to calculation units)
        const scaledSheafLength = sheafLength / 10;
        
        // Calculate target coordinates for each gun using the center target point
        const targetCoordinates = calculateLinearSheafTargets(targetX, targetY, scaledSheafLength, sheafDirection, totalGuns);
        
        // Calculate ballistic solution for each gun-target pair
        let gunIndex = 0;
        for (const section of sectionGuns) {
            for (let i = section.startIndex; i <= section.endIndex; i++) {
                const gunCoords = getMortarCoordinates(i);
                if (!gunCoords.x || !gunCoords.y) {
                    alert(`Please enter coordinates for Gun ${i}`);
                    return;
                }
                
                const targetCoord = targetCoordinates[gunIndex];
                
                // Get section-specific altitude, shell, and rings for this gun
                const gunSection = getSectionForGun(i);
                const gunSectionAlt = getSectionAltitude(gunSection);
                const gunSectionShell = document.getElementById(`section-${gunSection}-shell-polar`).value;
                const gunSectionRings = parseInt(document.getElementById(`section-${gunSection}-rings-polar`).value);
                
                const solution = calculateSingleGunBallistics(
                    gunCoords.x, gunCoords.y, targetCoord.x, targetCoord.y, gunSectionAlt, targetAlt,
                    gunSectionShell, gunSectionRings, addDrop, leftRight, foDirDeg
                );
                
                if (solution) {
                    gunSolutions.push({
                        gun: i - section.startIndex + 1, // Section-relative gun number
                        section: section.section,
                        azimuth: solution.azimuthCorr,
                        elevation: solution.elevationCorr,
                        tof: solution.tofCorr,
                        targetX: targetCoord.x,
                        targetY: targetCoord.y
                    });
                }
                gunIndex++;
            }
        }
    } else if (sheafType === 'circular') {
        // For circular sheaf, calculate individual target coordinates for each gun
        const sheafDiameter = parseFloat(document.getElementById("sheaf-diameter-polar").value);
        
        if (!sheafDiameter || sheafDiameter <= 0) {
            alert("Please enter a valid sheaf diameter for circular sheaf");
            return;
        }
        
        // Scale down sheaf diameter by dividing by 10 (convert meters to calculation units)
        const scaledSheafDiameter = sheafDiameter / 10;
        
        // Calculate target coordinates for each gun using the center target point
        const targetCoordinates = calculateCircularSheafTargets(targetX, targetY, scaledSheafDiameter, totalGuns);
        
        // Calculate ballistic solution for each gun-target pair
        let gunIndex = 0;
        for (const section of sectionGuns) {
            for (let i = section.startIndex; i <= section.endIndex; i++) {
                const gunCoords = getMortarCoordinates(i);
                if (!gunCoords.x || !gunCoords.y) {
                    alert(`Please enter coordinates for Gun ${i}`);
                    return;
                }
                
                const targetCoord = targetCoordinates[gunIndex];
                
                // Get section-specific altitude, shell, and rings for this gun
                const gunSection = getSectionForGun(i);
                const gunSectionAlt = getSectionAltitude(gunSection);
                const gunSectionShell = document.getElementById(`section-${gunSection}-shell-polar`).value;
                const gunSectionRings = parseInt(document.getElementById(`section-${gunSection}-rings-polar`).value);
                
                const solution = calculateSingleGunBallistics(
                    gunCoords.x, gunCoords.y, targetCoord.x, targetCoord.y, gunSectionAlt, targetAlt,
                    gunSectionShell, gunSectionRings, addDrop, leftRight, foDirDeg
                );
                
                if (solution) {
                    gunSolutions.push({
                        gun: i - section.startIndex + 1, // Section-relative gun number
                        section: section.section,
                        azimuth: solution.azimuthCorr,
                        elevation: solution.elevationCorr,
                        tof: solution.tofCorr,
                        targetX: targetCoord.x,
                        targetY: targetCoord.y
                    });
                }
                gunIndex++;
            }
        }
    } else if (sheafType === 'converged') {
        // For converged sheaf, all guns fire at exactly the same target coordinate
        // Calculate ballistic solution for each gun to the same target
        for (const section of sectionGuns) {
            for (let i = section.startIndex; i <= section.endIndex; i++) {
                const gunCoords = getMortarCoordinates(i);
                if (!gunCoords.x || !gunCoords.y) {
                    alert(`Please enter coordinates for Gun ${i}`);
                    return;
                }
                
                // Get section-specific altitude, shell, and rings for this gun
                const gunSection = getSectionForGun(i);
                const gunSectionAlt = getSectionAltitude(gunSection);
                const gunSectionShell = document.getElementById(`section-${gunSection}-shell-polar`).value;
                const gunSectionRings = parseInt(document.getElementById(`section-${gunSection}-rings-polar`).value);
                
                const solution = calculateSingleGunBallistics(
                    gunCoords.x, gunCoords.y, targetX, targetY, gunSectionAlt, targetAlt,
                    gunSectionShell, gunSectionRings, addDrop, leftRight, foDirDeg
                );
                
                if (solution) {
                    gunSolutions.push({
                        gun: i - section.startIndex + 1, // Section-relative gun number
                        section: section.section,
                        azimuth: solution.azimuthCorr,
                        elevation: solution.elevationCorr,
                        tof: solution.tofCorr,
                        targetX: targetX,
                        targetY: targetY
                    });
                }
            }
        }
    } else if (sheafType === 'open') {
        // For open sheaf, calculate specific target coordinates for each gun
        // Gun 1: subtract 1 from X and 1 from Y
        // Gun 2: use original coordinates (base gun)
        // Gun 3: add 1 to X and subtract 1 from Y
        // Gun 4: add 2 to X and change nothing to Y
        
        // Check if all sections are selected
        const allSectionsCheckbox = document.getElementById('all-sections-polar');
        const useGlobalGunIndex = allSectionsCheckbox && allSectionsCheckbox.checked;
        
        let globalGunIndex = 0;
        for (const section of sectionGuns) {
            for (let i = section.startIndex; i <= section.endIndex; i++) {
                const gunCoords = getMortarCoordinates(i);
                if (!gunCoords.x || !gunCoords.y) {
                    alert(`Please enter coordinates for Gun ${i}`);
                    return;
                }
                
                // Calculate target coordinates based on gun position
                let targetCoordX = targetX;
                let targetCoordY = targetY;
                
                let gunPosition;
                if (useGlobalGunIndex) {
                    // When all sections are selected, use global gun index (1 to n)
                    gunPosition = (globalGunIndex % 4) + 1; // 1-4 cycle
                } else {
                    // When specific sections are selected, use section-relative positioning
                    gunPosition = (i - section.startIndex + 1) % 4; // 1-4 cycle
                    if (gunPosition === 0) gunPosition = 4; // Convert 0 to 4 for Gun 4
                }
                
                if (gunPosition === 1) {
                    // Gun 1: subtract 1 from X and 1 from Y
                    targetCoordX = targetX - 1;
                    targetCoordY = targetY - 1;
                } else if (gunPosition === 2) {
                    // Gun 2: use original coordinates (base gun)
                    targetCoordX = targetX;
                    targetCoordY = targetY;
                } else if (gunPosition === 3) {
                    // Gun 3: add 1 to X and subtract 1 from Y
                    targetCoordX = targetX + 1;
                    targetCoordY = targetY - 1;
                } else if (gunPosition === 4) {
                    // Gun 4: add 2 to X and change nothing to Y
                    targetCoordX = targetX + 2;
                    targetCoordY = targetY;
                }
                
                // Apply corrections to target coordinates
                const foDirRad = foDirDeg * Math.PI / 180;
                const xCorr = (addDrop/10);
                const yCorr = (leftRight/10);
                const correctedTargetX = targetCoordX + xCorr * Math.sin(foDirRad) + yCorr * Math.cos(foDirRad);
                const correctedTargetY = targetCoordY + xCorr * Math.cos(foDirRad) - yCorr * Math.sin(foDirRad);
                
                // Get section-specific altitude, shell, and rings for this gun
                const gunSection = getSectionForGun(i);
                const gunSectionAlt = getSectionAltitude(gunSection);
                const gunSectionShell = document.getElementById(`section-${gunSection}-shell-polar`).value;
                const gunSectionRings = parseInt(document.getElementById(`section-${gunSection}-rings-polar`).value);
                
                const solution = calculateSingleGunBallistics(
                    gunCoords.x, gunCoords.y, correctedTargetX, correctedTargetY, gunSectionAlt, targetAlt,
                    gunSectionShell, gunSectionRings, 0, 0, foDirDeg // Pass 0 for corrections to avoid double-correction
                );
                
                if (solution) {
                    gunSolutions.push({
                        gun: i - section.startIndex + 1, // Section-relative gun number (display purposes)
                        section: section.section,
                        azimuth: solution.azimuthCorr,
                        elevation: solution.elevationCorr,
                        tof: solution.tofCorr,
                        targetX: correctedTargetX,
                        targetY: correctedTargetY
                    });
                }
                globalGunIndex++;
            }
        }
    }

    // For all sheaf types, gun solutions are already corrected, so display them directly
    displayGunSolutions(gunSolutions, 'gun-solutions-content-polar');
    
    document.getElementById("fire-solution-guns-polar").style.display = 'block';
}

// Mission Logging Functions
let currentMissionData = null;

function showMTOModal(missionType) {
    console.log('showMTOModal called with missionType:', missionType);
    
    // Get mission data based on type
    const missionData = getMissionData(missionType);
    console.log('Mission data retrieved:', missionData);
    
    if (!missionData) {
        showAlertModal('No Fire Solution', 'Please calculate a fire solution first before showing MTO.');
        return;
    }
    
    // Find the lowest TOF from all gun solutions
    let lowestTOF = null;
    if (missionData.sectionSolutions && Object.keys(missionData.sectionSolutions).length > 0) {
        // Get all TOF values from section solutions
        const allTOFs = [];
        Object.values(missionData.sectionSolutions).forEach(section => {
            section.guns.forEach(gun => {
                if (gun.tof) allTOFs.push(gun.tof);
            });
        });
        if (allTOFs.length > 0) {
            lowestTOF = Math.min(...allTOFs);
        }
    } else if (missionData.gunSolutions && missionData.gunSolutions.length > 0) {
        lowestTOF = Math.min(...missionData.gunSolutions.map(solution => solution.tof));
    } else if (missionData.baseSolution && missionData.baseSolution.tof) {
        lowestTOF = missionData.baseSolution.tof;
    } else if (missionData.correctedSolution && missionData.correctedSolution.tofCorr) {
        lowestTOF = missionData.correctedSolution.tofCorr;
    }
    
    // Get shell type from section data
    let shellType = 'Not specified';
    if (missionData.sectionData && Object.keys(missionData.sectionData).length > 0) {
        const sections = Object.values(missionData.sectionData);
        const uniqueShells = [...new Set(sections.map(section => section.shell))];
        shellType = uniqueShells.join(', ');
    } else if (missionData.shellType) {
        shellType = missionData.shellType;
    }
    
    // Calculate total number of guns
    let totalGuns = 0;
    if (missionData.sectionSolutions && Object.keys(missionData.sectionSolutions).length > 0) {
        // Count total guns from all sections
        Object.keys(missionData.sectionSolutions).forEach(sectionNumber => {
            const section = missionData.sectionSolutions[sectionNumber];
            totalGuns += section.guns.length;
        });
    } else if (missionData.gunSolutions && missionData.gunSolutions.length > 0) {
        totalGuns = missionData.gunSolutions.length;
    } else {
        totalGuns = missionData.numGuns || 1;
    }
    
    // Populate MTO modal
    document.getElementById('mto-target-number').textContent = missionData.targetNumber || 'Not specified';
    document.getElementById('mto-rounds').textContent = missionData.amountRounds || 'Not specified';
    document.getElementById('mto-shell-type').textContent = shellType;
    document.getElementById('mto-tof').textContent = lowestTOF ? lowestTOF.toFixed(1) + ' sec' : 'Not calculated';
    document.getElementById('mto-guns').textContent = totalGuns || 'Not specified';
    
    // Store current mission data for logging
    currentMissionData = missionData;
    
    // Show modal
    document.getElementById('mto-modal').style.display = 'block';
}

function closeMTOModal() {
    document.getElementById('mto-modal').style.display = 'none';
    currentMissionData = null;
}

// NFA Warning Modal Functions
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
    // Store the mission type before closing the modal
    const missionType = currentMissionType;
    
    closeNFAWarningModal();
    
    // Continue with the calculation based on mission type (bypassing NFA check)
    if (missionType === 'grid') {
        calculateGridMissionParallelSheaf(true);
    } else if (missionType === 'polar') {
        calculatePolarMissionParallelSheaf(true);
    } else if (missionType === 'shift') {
        calculateShiftMission(true);
    }
}

// Flexible validation function that allows users to fill fields in any order
function validateMissionFields(missionType) {
    const errors = [];
    const warnings = [];
    
    if (missionType === 'grid') {
        // Check target coordinates
        const targetX = parseFloat(document.getElementById("target-x").value);
        const targetY = parseFloat(document.getElementById("target-y").value);
        
        if (isNaN(targetX) || isNaN(targetY)) {
            errors.push("Please enter valid target coordinates (X and Y)");
        }
        
        // Check target number
        const targetNumber = document.getElementById("target-number-grid").value;
        if (!targetNumber.trim()) {
            errors.push("Please enter a target number");
        }
        
        // Check amount of rounds
        const amountRounds = parseInt(document.getElementById("amount-rounds-grid").value);
        if (isNaN(amountRounds) || amountRounds <= 0) {
            errors.push("Please enter a valid amount of rounds");
        }
        
        // Check section selection
        const selectedSections = getSelectedSections('grid');
        if (selectedSections.length === 0) {
            errors.push("Please select at least one section");
        }
        
        // Check mortar coordinates for selected sections
        const gunConfiguration = getGunConfiguration();
        let totalGuns = 0;
        for (const section of gunConfiguration) {
            if (selectedSections.includes(section.section)) {
                totalGuns += section.guns;
            }
        }
        
        for (let i = 1; i <= totalGuns; i++) {
            const gunCoords = getMortarCoordinates(i);
            if (!gunCoords.x || !gunCoords.y) {
                errors.push(`Please enter coordinates for Gun ${i}`);
                break; // Only show first missing gun to avoid spam
            }
        }
        
    } else if (missionType === 'polar') {
        // Check FO coordinates
        const foX = parseFloat(document.getElementById('fo-x-polar').value);
        const foY = parseFloat(document.getElementById('fo-y-polar').value);
        const foDist = parseFloat(document.getElementById('fo-dist-polar').value);
        const foDir = parseFloat(document.getElementById('fo-dir-polar').value);
        
        if (isNaN(foX) || isNaN(foY)) {
            errors.push("Please enter valid FO coordinates (X and Y)");
        }
        if (isNaN(foDist) || foDist <= 0) {
            errors.push("Please enter a valid distance");
        }
        if (isNaN(foDir)) {
            errors.push("Please enter a valid direction");
        }
        
        // Check target number
        const targetNumber = document.getElementById("target-number-polar").value;
        if (!targetNumber.trim()) {
            errors.push("Please enter a target number");
        }
        
        // Check amount of rounds
        const amountRounds = parseInt(document.getElementById("amount-rounds-polar").value);
        if (isNaN(amountRounds) || amountRounds <= 0) {
            errors.push("Please enter a valid amount of rounds");
        }
        
        // Check section selection
        const selectedSections = getSelectedSections('polar');
        if (selectedSections.length === 0) {
            errors.push("Please select at least one section");
        }
        
        // Check mortar coordinates for selected sections
        const gunConfiguration = getGunConfiguration();
        let totalGuns = 0;
        for (const section of gunConfiguration) {
            if (selectedSections.includes(section.section)) {
                totalGuns += section.guns;
            }
        }
        
        for (let i = 1; i <= totalGuns; i++) {
            const gunCoords = getMortarCoordinates(i);
            if (!gunCoords.x || !gunCoords.y) {
                errors.push(`Please enter coordinates for Gun ${i}`);
                break;
            }
        }
        
    } else if (missionType === 'shift') {
        // Check known point selection
        const selectedPointId = document.getElementById('known-point-select').value;
        if (!selectedPointId) {
            errors.push("Please select a known point");
        }
        
        // Check shift values
        const shiftX = parseFloat(document.getElementById('shift-x').value);
        const shiftY = parseFloat(document.getElementById('shift-y').value);
        
        if (isNaN(shiftX) || isNaN(shiftY)) {
            errors.push("Please enter valid shift values (X and Y)");
        }
        
        // Check target number
        const targetNumber = document.getElementById("target-number-shift").value;
        if (!targetNumber.trim()) {
            errors.push("Please enter a target number");
        }
        
        // Check amount of rounds
        const amountRounds = parseInt(document.getElementById("amount-rounds-shift").value);
        if (isNaN(amountRounds) || amountRounds <= 0) {
            errors.push("Please enter a valid amount of rounds");
        }
        
        // Check section selection
        const selectedSections = getSelectedSections('shift');
        if (selectedSections.length === 0) {
            errors.push("Please select at least one section");
        }
        
        // Check mortar coordinates for selected sections
        const gunConfiguration = getGunConfiguration();
        let totalGuns = 0;
        for (const section of gunConfiguration) {
            if (selectedSections.includes(section.section)) {
                totalGuns += section.guns;
            }
        }
        
        for (let i = 1; i <= totalGuns; i++) {
            const gunCoords = getMortarCoordinates(i);
            if (!gunCoords.x || !gunCoords.y) {
                errors.push(`Please enter coordinates for Gun ${i}`);
                break;
            }
        }
    }
    
    return { errors, warnings };
}

function getMissionData(missionType) {
    console.log('getMissionData called with missionType:', missionType);
    
    // Calculate actual number of guns from selected sections
    const selectedSections = getSelectedSections(missionType);
    const gunConfiguration = getGunConfiguration();
    let totalGuns = 0;
    
    for (const section of gunConfiguration) {
        if (selectedSections.includes(section.section)) {
            totalGuns += section.guns;
        }
    }
    
    const missionData = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        missionType: missionType,
        numGuns: totalGuns
    };
    
    console.log('Initial mission data:', missionData);
    
    if (missionType === 'grid') {
        console.log('Processing grid mission data...');
        
        missionData.targetNumber = document.getElementById('target-number-grid').value;
        missionData.amountRounds = parseInt(document.getElementById('amount-rounds-grid').value);
        
        // Get section-specific shell and rings data
        const selectedSections = getSelectedSections('grid');
        console.log('Selected sections for grid:', selectedSections);
        missionData.sectionData = {};
        selectedSections.forEach(section => {
            const shellElement = document.getElementById(`section-${section}-shell-grid`);
            const ringsElement = document.getElementById(`section-${section}-rings-grid`);
            console.log(`Section ${section} - shell element:`, shellElement, 'rings element:', ringsElement);
            missionData.sectionData[section] = {
                shell: shellElement ? shellElement.value : 'HE',
                rings: ringsElement ? parseInt(ringsElement.value) : 0
            };
        });
        missionData.targetX = parseFloat(document.getElementById('target-x').value);
        missionData.targetY = parseFloat(document.getElementById('target-y').value);
        missionData.targetAltitude = parseFloat(document.getElementById('target-alt').value) || 0;
        
        console.log('Grid mission basic data:', {
            targetNumber: missionData.targetNumber,
            amountRounds: missionData.amountRounds,
            shellType: missionData.shellType,
            rings: missionData.rings
        });
        
        // Get base solution
        const azimuth = document.getElementById('azimuth').textContent;
        const elevation = document.getElementById('elevation').textContent;
        const tof = document.getElementById('tof').textContent;
        
        console.log('Base solution elements:', { azimuth, elevation, tof });
        
        if (azimuth !== '-' && elevation !== '-' && tof !== '-') {
            missionData.baseSolution = { 
                azimuth: parseFloat(azimuth), 
                elevation: parseFloat(elevation), 
                tof: parseFloat(tof) 
            };
            missionData.tof = parseFloat(tof);
            console.log('Base solution added:', missionData.baseSolution);
        } else {
            console.log('Base solution not available (contains "-" values)');
        }
        
        // Get corrected solution
        const azimuthCorr = document.getElementById('azimuth-corr').textContent;
        const elevationCorr = document.getElementById('elevation-corr').textContent;
        const tofCorr = document.getElementById('tof-corr').textContent;
        
        console.log('Corrected solution elements:', { azimuthCorr, elevationCorr, tofCorr });
        
        if (azimuthCorr !== '-' && elevationCorr !== '-' && tofCorr !== '-') {
            missionData.correctedSolution = { 
                azimuthCorr: parseFloat(azimuthCorr), 
                elevationCorr: parseFloat(elevationCorr), 
                tofCorr: parseFloat(tofCorr) 
            };
            console.log('Corrected solution added:', missionData.correctedSolution);
        } else {
            console.log('Corrected solution not available (contains "-" values)');
        }
        
        // Get gun solutions organized by section
        const gunSolutionsContainer = document.getElementById('gun-solutions-content-grid');
        console.log('Gun solutions container:', gunSolutionsContainer);
        
        if (gunSolutionsContainer && gunSolutionsContainer.textContent.trim() !== "No solutions available") {
            missionData.sectionSolutions = {};
            const solutionText = gunSolutionsContainer.textContent;
            console.log('Gun solutions text:', solutionText);
            
            // Parse section by section
            const sectionMatches = solutionText.match(/Section (\d+):\s*\n([\s\S]*?)(?=Section \d+:|$)/g);
            console.log('Section matches found:', sectionMatches);
            
            if (sectionMatches) {
                sectionMatches.forEach(sectionMatch => {
                    const sectionNumber = parseInt(sectionMatch.match(/Section (\d+):/)[1]);
                    const sectionContent = sectionMatch.replace(/Section \d+:\s*\n/, '');
                    
                    // Get shell and rings for this section
                    const sectionShellElement = document.getElementById(`section-${sectionNumber}-shell-grid`);
                    const sectionRingsElement = document.getElementById(`section-${sectionNumber}-rings-grid`);
                    const sectionShell = sectionShellElement ? sectionShellElement.value : 'HE';
                    const sectionRings = sectionRingsElement ? parseInt(sectionRingsElement.value) : 0;
                    
                    missionData.sectionSolutions[sectionNumber] = {
                        shell: sectionShell,
                        rings: sectionRings,
                        guns: []
                    };
                    
                    // Parse gun solutions for this section
                    const gunMatches = sectionContent.match(/Gun (\d+):\s*\n\s*Azimuth: ([^\n]+) mils\s*\n\s*Elevation: ([^\n]+) mils\s*\n\s*TOF: ([^\n]+) sec(\s*\n\s*Target: \(([^,]+), ([^)]+)\))?/g);
                    
                    if (gunMatches) {
                        gunMatches.forEach(match => {
                            const lines = match.split('\n').filter(line => line.trim());
                            const gunNumber = parseInt(lines[0].match(/Gun (\d+):/)[1]);
                            const azimuth = lines[1].match(/Azimuth: ([^\n]+) mils/)[1];
                            const elevation = lines[2].match(/Elevation: ([^\n]+) mils/)[1];
                            const tof = lines[3].match(/TOF: ([^\n]+) sec/)[1];
                            
                            const gunSolution = {
                                gun: gunNumber,
                                azimuth: parseFloat(azimuth),
                                elevation: parseFloat(elevation),
                                tof: parseFloat(tof)
                            };
                            
                            // Check if target coordinates are present
                            if (lines.length > 4 && lines[4].includes('Target:')) {
                                const targetMatch = lines[4].match(/Target: \(([^,]+), ([^)]+)\)/);
                                if (targetMatch) {
                                    gunSolution.targetX = parseFloat(targetMatch[1]);
                                    gunSolution.targetY = parseFloat(targetMatch[2]);
                                }
                            }
                            
                            missionData.sectionSolutions[sectionNumber].guns.push(gunSolution);
                            console.log(`Added gun solution for Section ${sectionNumber}:`, gunSolution);
                        });
                    }
                });
            }
        } else {
            console.log('No gun solutions available');
        }
        
    } else if (missionType === 'polar') {
        missionData.targetNumber = document.getElementById('target-number-polar').value;
        missionData.amountRounds = parseInt(document.getElementById('amount-rounds-polar').value);
        
        // Get section-specific shell and rings data
        const selectedSections = getSelectedSections('polar');
        missionData.sectionData = {};
        selectedSections.forEach(section => {
            const shellElement = document.getElementById(`section-${section}-shell-polar`);
            const ringsElement = document.getElementById(`section-${section}-rings-polar`);
            missionData.sectionData[section] = {
                shell: shellElement ? shellElement.value : 'HE',
                rings: ringsElement ? parseInt(ringsElement.value) : 0
            };
        });
        
        // Calculate target coordinates from polar data
        const foX = parseFloat(document.getElementById('fo-x-polar').value);
        const foY = parseFloat(document.getElementById('fo-y-polar').value);
        const foDist = parseFloat(document.getElementById('fo-dist-polar').value);
        const foDirDeg = parseFloat(document.getElementById('fo-dir-polar').value) || 0;
        
        if (foX && foY && foDist) {
            const foDirRad = foDirDeg * Math.PI / 180;
            const scaledFoDist = foDist / 10;
            missionData.targetX = foX + scaledFoDist * Math.sin(foDirRad);
            missionData.targetY = foY + scaledFoDist * Math.cos(foDirRad);
        }
        
        missionData.targetAltitude = parseFloat(document.getElementById('target-alt-polar').value) || 0;
        
        // Get base solution
        const azimuth = document.getElementById('azimuth-polar').textContent;
        const elevation = document.getElementById('elevation-polar').textContent;
        const tof = document.getElementById('tof-polar').textContent;
        
        if (azimuth !== '-' && elevation !== '-' && tof !== '-') {
            missionData.baseSolution = { 
                azimuth: parseFloat(azimuth), 
                elevation: parseFloat(elevation), 
                tof: parseFloat(tof) 
            };
            missionData.tof = parseFloat(tof);
        }
        
        // Get corrected solution
        const azimuthCorr = document.getElementById('azimuth-corr-polar').textContent;
        const elevationCorr = document.getElementById('elevation-corr-polar').textContent;
        const tofCorr = document.getElementById('tof-corr-polar').textContent;
        
        if (azimuthCorr !== '-' && elevationCorr !== '-' && tofCorr !== '-') {
            missionData.correctedSolution = { 
                azimuthCorr: parseFloat(azimuthCorr), 
                elevationCorr: parseFloat(elevationCorr), 
                tofCorr: parseFloat(tofCorr) 
            };
        }
        
        // Get gun solutions organized by section
        const gunSolutionsContainer = document.getElementById('gun-solutions-content-polar');
        if (gunSolutionsContainer && gunSolutionsContainer.textContent.trim() !== "No solutions available") {
            missionData.sectionSolutions = {};
            const solutionText = gunSolutionsContainer.textContent;
            
            // Parse section by section
            const sectionMatches = solutionText.match(/Section (\d+):\s*\n([\s\S]*?)(?=Section \d+:|$)/g);
            
            if (sectionMatches) {
                sectionMatches.forEach(sectionMatch => {
                    const sectionNumber = parseInt(sectionMatch.match(/Section (\d+):/)[1]);
                    const sectionContent = sectionMatch.replace(/Section \d+:\s*\n/, '');
                    
                    // Get shell and rings for this section
                    const sectionShellElement = document.getElementById(`section-${sectionNumber}-shell-polar`);
                    const sectionRingsElement = document.getElementById(`section-${sectionNumber}-rings-polar`);
                    const sectionShell = sectionShellElement ? sectionShellElement.value : 'HE';
                    const sectionRings = sectionRingsElement ? parseInt(sectionRingsElement.value) : 0;
                    
                    missionData.sectionSolutions[sectionNumber] = {
                        shell: sectionShell,
                        rings: sectionRings,
                        guns: []
                    };
                    
                    // Parse gun solutions for this section
                    const gunMatches = sectionContent.match(/Gun (\d+):\s*\n\s*Azimuth: ([^\n]+) mils\s*\n\s*Elevation: ([^\n]+) mils\s*\n\s*TOF: ([^\n]+) sec(\s*\n\s*Target: \(([^,]+), ([^)]+)\))?/g);
                    
                    if (gunMatches) {
                        gunMatches.forEach(match => {
                            const lines = match.split('\n').filter(line => line.trim());
                            const gunNumber = parseInt(lines[0].match(/Gun (\d+):/)[1]);
                            const azimuth = lines[1].match(/Azimuth: ([^\n]+) mils/)[1];
                            const elevation = lines[2].match(/Elevation: ([^\n]+) mils/)[1];
                            const tof = lines[3].match(/TOF: ([^\n]+) sec/)[1];
                            
                            const gunSolution = {
                                gun: gunNumber,
                                azimuth: parseFloat(azimuth),
                                elevation: parseFloat(elevation),
                                tof: parseFloat(tof)
                            };
                            
                            // Check if target coordinates are present
                            if (lines.length > 4 && lines[4].includes('Target:')) {
                                const targetMatch = lines[4].match(/Target: \(([^,]+), ([^)]+)\)/);
                                if (targetMatch) {
                                    gunSolution.targetX = parseFloat(targetMatch[1]);
                                    gunSolution.targetY = parseFloat(targetMatch[2]);
                                }
                            }
                            
                            missionData.sectionSolutions[sectionNumber].guns.push(gunSolution);
                        });
                    }
                });
            }
        }
    } else if (missionType === 'shift') {
        console.log('Processing shift mission data...');
        
        // Get selected known point
        const selectedPointId = document.getElementById('known-point-select').value;
        const knownPoints = JSON.parse(localStorage.getItem('knownPoints') || '[]');
        const selectedPoint = knownPoints.find(p => p.id === selectedPointId);
        
        if (!selectedPoint) {
            console.log('No known point selected');
            return null;
        }
        
        // Calculate target coordinates
        const shiftX = parseFloat(document.getElementById('shift-x').value) || 0;
        const shiftY = parseFloat(document.getElementById('shift-y').value) || 0;
        const targetX = selectedPoint.x + shiftX / 10;
        const targetY = selectedPoint.y + shiftY / 10;
        
        missionData.targetNumber = document.getElementById('target-number-shift').value;
        missionData.amountRounds = parseInt(document.getElementById('amount-rounds-shift').value);
        
        // Get section-specific shell and rings data
        const selectedSections = getSelectedSections('shift');
        missionData.sectionData = {};
        selectedSections.forEach(section => {
            const shellElement = document.getElementById(`section-${section}-shell-shift`);
            const ringsElement = document.getElementById(`section-${section}-rings-shift`);
            missionData.sectionData[section] = {
                shell: shellElement ? shellElement.value : 'HE',
                rings: ringsElement ? parseInt(ringsElement.value) : 0
            };
        });
        missionData.targetX = targetX;
        missionData.targetY = targetY;
        missionData.targetAltitude = parseFloat(document.getElementById('target-alt-shift').value) || selectedPoint.altitude;
        missionData.knownPointId = selectedPointId;
        missionData.shiftX = shiftX;
        missionData.shiftY = shiftY;
        
        console.log('Shift mission basic data:', {
            targetNumber: missionData.targetNumber,
            amountRounds: missionData.amountRounds,
            shellType: missionData.shellType,
            rings: missionData.rings,
            targetX: missionData.targetX,
            targetY: missionData.targetY,
            targetAltitude: missionData.targetAltitude
        });
        
        // Get base solution
        const azimuth = document.getElementById('azimuth-shift').textContent;
        const elevation = document.getElementById('elevation-shift').textContent;
        const tof = document.getElementById('tof-shift').textContent;
        
        if (azimuth !== '-' && elevation !== '-' && tof !== '-') {
            missionData.baseSolution = { 
                azimuth: parseFloat(azimuth), 
                elevation: parseFloat(elevation), 
                tof: parseFloat(tof) 
            };
            missionData.tof = parseFloat(tof);
        }
        
        // Get corrected solution
        const azimuthCorr = document.getElementById('azimuth-corr-shift').textContent;
        const elevationCorr = document.getElementById('elevation-corr-shift').textContent;
        const tofCorr = document.getElementById('tof-corr-shift').textContent;
        
        if (azimuthCorr !== '-' && elevationCorr !== '-' && tofCorr !== '-') {
            missionData.correctedSolution = { 
                azimuthCorr: parseFloat(azimuthCorr), 
                elevationCorr: parseFloat(elevationCorr), 
                tofCorr: parseFloat(tofCorr) 
            };
        }
        
        // Get gun solutions organized by section
        const gunSolutionsContainer = document.getElementById('gun-solutions-content-shift');
        if (gunSolutionsContainer && gunSolutionsContainer.textContent.trim() !== "No solutions available") {
            missionData.sectionSolutions = {};
            const solutionText = gunSolutionsContainer.textContent;
            
            // Parse section by section
            const sectionMatches = solutionText.match(/Section (\d+):\s*\n([\s\S]*?)(?=Section \d+:|$)/g);
            
            if (sectionMatches) {
                sectionMatches.forEach(sectionMatch => {
                    const sectionNumber = parseInt(sectionMatch.match(/Section (\d+):/)[1]);
                    const sectionContent = sectionMatch.replace(/Section \d+:\s*\n/, '');
                    
                    // Get shell and rings for this section
                    const sectionShellElement = document.getElementById(`section-${sectionNumber}-shell-shift`);
                    const sectionRingsElement = document.getElementById(`section-${sectionNumber}-rings-shift`);
                    const sectionShell = sectionShellElement ? sectionShellElement.value : 'HE';
                    const sectionRings = sectionRingsElement ? parseInt(sectionRingsElement.value) : 0;
                    
                    missionData.sectionSolutions[sectionNumber] = {
                        shell: sectionShell,
                        rings: sectionRings,
                        guns: []
                    };
                    
                    // Parse gun solutions for this section
                    const gunMatches = sectionContent.match(/Gun (\d+):\s*\n\s*Azimuth: ([^\n]+) mils\s*\n\s*Elevation: ([^\n]+) mils\s*\n\s*TOF: ([^\n]+) sec(\s*\n\s*Target: \(([^,]+), ([^)]+)\))?/g);
                    
                    if (gunMatches) {
                        gunMatches.forEach(match => {
                            const lines = match.split('\n').filter(line => line.trim());
                            const gunNumber = parseInt(lines[0].match(/Gun (\d+):/)[1]);
                            const azimuth = lines[1].match(/Azimuth: ([^\n]+) mils/)[1];
                            const elevation = lines[2].match(/Elevation: ([^\n]+) mils/)[1];
                            const tof = lines[3].match(/TOF: ([^\n]+) sec/)[1];
                            
                            const gunSolution = {
                                gun: gunNumber,
                                azimuth: parseFloat(azimuth),
                                elevation: parseFloat(elevation),
                                tof: parseFloat(tof)
                            };
                            
                            // Check if target coordinates are present
                            if (lines.length > 4 && lines[4].includes('Target:')) {
                                const targetMatch = lines[4].match(/Target: \(([^,]+), ([^)]+)\)/);
                                if (targetMatch) {
                                    gunSolution.targetX = parseFloat(targetMatch[1]);
                                    gunSolution.targetY = parseFloat(targetMatch[2]);
                                }
                            }
                            
                            missionData.sectionSolutions[sectionNumber].guns.push(gunSolution);
                        });
                    }
                });
            }
        }
    }
    
    console.log('Final mission data to be returned:', missionData);
    return missionData;
}





function logFireMission(missionType) {
    console.log('logFireMission called with missionType:', missionType);
    
    const missionData = getMissionData(missionType);
    console.log('Mission data collected:', missionData);
    
    // Check if we have at least a target number and some solution data
    if (!missionData || !missionData.targetNumber) {
        console.log('Validation failed - missing mission data or target number');
        console.log('missionData:', missionData);
        showAlertModal('No Fire Solution', 'Please calculate a fire solution first before logging the mission.');
        return;
    }
    
    // Check if we have any solution data
    const hasBaseSolution = missionData.baseSolution && missionData.baseSolution.azimuth !== '-';
    const hasCorrectedSolution = missionData.correctedSolution && missionData.correctedSolution.azimuthCorr !== '-';
    const hasSectionSolutions = missionData.sectionSolutions && Object.keys(missionData.sectionSolutions).length > 0;
    
    if (!hasBaseSolution && !hasCorrectedSolution && !hasSectionSolutions) {
        console.log('Validation failed - no solution data available');
        console.log('baseSolution:', missionData.baseSolution);
        console.log('correctedSolution:', missionData.correctedSolution);
        console.log('sectionSolutions:', missionData.sectionSolutions);
        showAlertModal('No Fire Solution', 'Please calculate a fire solution first before logging the mission.');
        return;
    }
    
    // Get existing logged missions
    const loggedMissions = JSON.parse(localStorage.getItem('loggedMissions') || '[]');
    console.log('Existing logged missions:', loggedMissions);
    
    // Add new mission
    loggedMissions.push(missionData);
    console.log('Updated logged missions:', loggedMissions);
    
    // Verify the mission was added
    console.log('Mission data being saved:', JSON.stringify(missionData, null, 2));
    
    // Limit to last 50 missions to prevent localStorage bloat
    if (loggedMissions.length > 50) {
        loggedMissions.splice(0, loggedMissions.length - 50);
    }
    
    // Save to localStorage
    localStorage.setItem('loggedMissions', JSON.stringify(loggedMissions));
    console.log('Mission saved to localStorage');
    
    // Save known point if target coordinates are available
    if (missionData.targetX !== undefined && missionData.targetY !== undefined) {
        const knownPoints = JSON.parse(localStorage.getItem('knownPoints') || '[]');
        
        // Check if this target number already exists
        const existingPoint = knownPoints.find(p => p.targetNumber === missionData.targetNumber);
        
        if (!existingPoint) {
            const newPoint = {
                id: Date.now().toString() + '_kp',
                targetNumber: missionData.targetNumber,
                x: missionData.targetX,
                y: missionData.targetY,
                altitude: missionData.targetAltitude || 0,
                timestamp: Date.now()
            };
            
            knownPoints.push(newPoint);
            localStorage.setItem('knownPoints', JSON.stringify(knownPoints));
            console.log('Known point saved:', newPoint);
        }
    }
    
    showAlertModal('Success', 'Fire mission logged successfully!');
    
    // Refresh the logged missions display
    displayLoggedMissions();
    
    // Close MTO modal if open
    closeMTOModal();
    
    // Auto-reset fields after successful logging
    resetMissionFields(missionType);
}

// Function to reset mission fields after logging
function resetMissionFields(missionType) {
    if (missionType === 'grid') {
        // Reset grid mission fields
        document.getElementById('target-number-grid').value = '';
        document.getElementById('amount-rounds-grid').value = '';
        document.getElementById('target-x').value = '';
        document.getElementById('target-y').value = '';
        document.getElementById('target-alt').value = '';
        document.getElementById('fo-dir').value = '';
        document.getElementById('add-drop').value = '';
        document.getElementById('left-right').value = '';
        document.getElementById('sheaf-type-grid').value = 'parallel';
        
        // Reset sheaf-specific fields
        document.getElementById('sheaf-length').value = '';
        document.getElementById('sheaf-direction').value = '';
        document.getElementById('sheaf-diameter').value = '';
        
        // Reset section selections
        document.getElementById('all-sections-grid').checked = false;
        const numSections = parseInt(document.getElementById('num-sections').value) || 1;
        for (let i = 1; i <= numSections; i++) {
            const sectionCheckbox = document.getElementById(`section-${i}-grid`);
            if (sectionCheckbox) {
                sectionCheckbox.checked = false;
            }
        }
        // Select first section by default
        const firstSectionCheckbox = document.getElementById('section-1-grid');
        if (firstSectionCheckbox) {
            firstSectionCheckbox.checked = true;
        }
        
        // Reset shell and rings to defaults
        for (let i = 1; i <= numSections; i++) {
            const shellSelect = document.getElementById(`section-${i}-shell-grid`);
            const ringsSelect = document.getElementById(`section-${i}-rings-grid`);
            if (shellSelect) shellSelect.value = 'HE';
            if (ringsSelect) ringsSelect.value = '0';
        }
        
    } else if (missionType === 'polar') {
        // Reset polar mission fields
        document.getElementById('target-number-polar').value = '';
        document.getElementById('amount-rounds-polar').value = '';
        document.getElementById('fo-x-polar').value = '';
        document.getElementById('fo-y-polar').value = '';
        document.getElementById('fo-dist-polar').value = '';
        document.getElementById('fo-dir-polar').value = '';
        document.getElementById('target-alt-polar').value = '';
        document.getElementById('add-drop-polar').value = '';
        document.getElementById('left-right-polar').value = '';
        document.getElementById('sheaf-type-polar').value = 'parallel';
        
        // Reset sheaf-specific fields
        document.getElementById('sheaf-length-polar').value = '';
        document.getElementById('sheaf-direction-polar').value = '';
        document.getElementById('sheaf-diameter-polar').value = '';
        
        // Reset section selections
        document.getElementById('all-sections-polar').checked = false;
        const numSections = parseInt(document.getElementById('num-sections').value) || 1;
        for (let i = 1; i <= numSections; i++) {
            const sectionCheckbox = document.getElementById(`section-${i}-polar`);
            if (sectionCheckbox) {
                sectionCheckbox.checked = false;
            }
        }
        // Select first section by default
        const firstSectionCheckbox = document.getElementById('section-1-polar');
        if (firstSectionCheckbox) {
            firstSectionCheckbox.checked = true;
        }
        
        // Reset shell and rings to defaults
        for (let i = 1; i <= numSections; i++) {
            const shellSelect = document.getElementById(`section-${i}-shell-polar`);
            const ringsSelect = document.getElementById(`section-${i}-rings-polar`);
            if (shellSelect) shellSelect.value = 'HE';
            if (ringsSelect) ringsSelect.value = '0';
        }
        
    } else if (missionType === 'shift') {
        // Reset shift mission fields
        document.getElementById('target-number-shift').value = '';
        document.getElementById('amount-rounds-shift').value = '';
        document.getElementById('known-point-select').value = '';
        document.getElementById('shift-x').value = '';
        document.getElementById('shift-y').value = '';
        document.getElementById('target-alt-shift').value = '';
        document.getElementById('fo-dir-shift').value = '';
        document.getElementById('add-drop-shift').value = '';
        document.getElementById('left-right-shift').value = '';
        document.getElementById('sheaf-type-shift').value = 'parallel';
        
        // Reset sheaf-specific fields
        document.getElementById('sheaf-length-shift').value = '';
        document.getElementById('sheaf-direction-shift').value = '';
        document.getElementById('sheaf-diameter-shift').value = '';
        
        // Reset section selections
        document.getElementById('all-sections-shift').checked = false;
        const numSections = parseInt(document.getElementById('num-sections').value) || 1;
        for (let i = 1; i <= numSections; i++) {
            const sectionCheckbox = document.getElementById(`section-${i}-shift`);
            if (sectionCheckbox) {
                sectionCheckbox.checked = false;
            }
        }
        // Select first section by default
        const firstSectionCheckbox = document.getElementById('section-1-shift');
        if (firstSectionCheckbox) {
            firstSectionCheckbox.checked = true;
        }
        
        // Reset shell and rings to defaults
        for (let i = 1; i <= numSections; i++) {
            const shellSelect = document.getElementById(`section-${i}-shell-shift`);
            const ringsSelect = document.getElementById(`section-${i}-rings-shift`);
            if (shellSelect) shellSelect.value = 'HE';
            if (ringsSelect) ringsSelect.value = '0';
        }
    }
    
    // Clear results displays
    const resultElements = [
        'base-results-grid', 'corrected-results-grid', 'gun-solutions-content-grid',
        'base-results-polar', 'corrected-results-polar', 'gun-solutions-content-polar',
        'base-results-shift', 'corrected-results-shift', 'gun-solutions-content-shift'
    ];
    
    resultElements.forEach(elementId => {
        const element = document.getElementById(elementId);
        if (element) {
            element.style.display = 'none';
        }
    });
    
    // Save the reset data
    saveAllData();
}



// Generic modal functions to replace browser popups
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
    if (confirmCallback) {
        confirmCallback();
    }
    closeConfirmModal();
}

// Known Point Modal functions
let editingKnownPointId = null;

function showKnownPointModal(title = 'Add Known Point', point = null) {
    document.getElementById('known-point-title').textContent = title;
    
    if (point) {
        // Editing existing point
        document.getElementById('known-point-number').value = point.targetNumber;
        document.getElementById('known-point-x').value = point.x;
        document.getElementById('known-point-y').value = point.y;
        document.getElementById('known-point-altitude').value = point.altitude;
        editingKnownPointId = point.id;
    } else {
        // Adding new point
        document.getElementById('known-point-number').value = '';
        document.getElementById('known-point-x').value = '';
        document.getElementById('known-point-y').value = '';
        document.getElementById('known-point-altitude').value = '';
        editingKnownPointId = null;
    }
    
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
    
    // Validate required fields
    const errors = [];
    if (!targetNumber) errors.push('Target number is required');
    if (!x || isNaN(x)) errors.push('Valid X coordinate is required');
    if (!y || isNaN(y)) errors.push('Valid Y coordinate is required');
    if (!altitude || isNaN(altitude)) errors.push('Valid altitude is required');
    
    if (errors.length > 0) {
        showAlertModal('Validation Error', 'Please fix the following errors:\n\n' + errors.join('\n'));
        return;
    }
    
    const knownPoints = JSON.parse(localStorage.getItem('knownPoints') || '[]');
    
    if (editingKnownPointId) {
        // Editing existing point
        const pointIndex = knownPoints.findIndex(p => p.id === editingKnownPointId);
        if (pointIndex !== -1) {
            knownPoints[pointIndex] = {
                ...knownPoints[pointIndex],
                targetNumber: targetNumber,
                x: parseFloat(x),
                y: parseFloat(y),
                altitude: parseFloat(altitude)
            };
        }
    } else {
        // Adding new point
        const newPoint = {
            id: Date.now().toString(),
            targetNumber: targetNumber,
            x: parseFloat(x),
            y: parseFloat(y),
            altitude: parseFloat(altitude),
            timestamp: Date.now()
        };
        knownPoints.push(newPoint);
    }
    
    localStorage.setItem('knownPoints', JSON.stringify(knownPoints));
    
    closeKnownPointModal();
    displayKnownPoints();
    updateKnownPointDropdown();
    
    const action = editingKnownPointId ? 'updated' : 'added';
    showAlertModal('Success', `Known point ${action} successfully!`);
}

function displayLoggedMissions() {
    console.log('displayLoggedMissions called');
    const loggedMissions = JSON.parse(localStorage.getItem('loggedMissions') || '[]');
    console.log('Retrieved logged missions from localStorage:', loggedMissions);
    
    const container = document.getElementById('logged-missions-list');
    console.log('Container element:', container);
    
    if (loggedMissions.length === 0) {
        console.log('No missions found, displaying empty message');
        container.innerHTML = '<p>No logged fire missions found.</p>';
        return;
    }
    
    // Clean up any missions missing required properties
    const cleanedMissions = loggedMissions.filter(mission => {
        if (!mission || typeof mission !== 'object') {
            console.log('Removing invalid mission:', mission);
            return false;
        }
        
        // Add missing properties if they don't exist
        if (!mission.missionType) {
            console.log('Adding missing missionType to mission:', mission);
            mission.missionType = 'Unknown';
        }
        if (!mission.id) {
            mission.id = Date.now() + Math.random();
        }
        if (!mission.timestamp) {
            mission.timestamp = new Date().toISOString();
        }
        
        return true;
    });
    
    // Save cleaned missions back to localStorage
    if (cleanedMissions.length !== loggedMissions.length) {
        localStorage.setItem('loggedMissions', JSON.stringify(cleanedMissions));
        console.log('Cleaned missions saved to localStorage');
    }
    
    // Sort missions alphabetically/numerically by target number
    cleanedMissions.sort((a, b) => {
        const targetA = (a.targetNumber || '').toLowerCase();
        const targetB = (b.targetNumber || '').toLowerCase();
        return targetA.localeCompare(targetB, undefined, {numeric: true, sensitivity: 'base'});
    });
    
    console.log('Sorted missions:', cleanedMissions);
    container.innerHTML = '';
    
    cleanedMissions.forEach(mission => {
        const missionElement = createMissionElement(mission);
        container.appendChild(missionElement);
    });
    
    console.log('Display completed');
}

function getShellSummary(mission) {
    // If section solutions exist, show shell types per section
    if (mission.sectionSolutions && Object.keys(mission.sectionSolutions).length > 0) {
        const sections = Object.keys(mission.sectionSolutions).sort();
        return sections.map(section => {
            const sectionData = mission.sectionSolutions[section];
            return `S${section}: ${sectionData.shell} (${sectionData.rings} rings)`;
        }).join(', ');
    }
    
    // If section data exists, show shell types per section
    if (mission.sectionData && Object.keys(mission.sectionData).length > 0) {
        const sections = Object.keys(mission.sectionData).sort();
        return sections.map(section => {
            const sectionData = mission.sectionData[section];
            return `S${section}: ${sectionData.shell} (${sectionData.rings} rings)`;
        }).join(', ');
    }
    
    // Fallback to legacy format
    return `${mission.shellType || 'N/A'} (${mission.rings || 0} rings)`;
}

function createMissionElement(mission) {
    const div = document.createElement('div');
    div.className = 'logged-mission';
    
    const timestamp = new Date(mission.timestamp).toLocaleString();
    const missionTitle = mission.targetNumber || `Mission ${mission.id}`;
    
    div.innerHTML = `
        <div class="logged-mission-header" onclick="toggleMissionDetails(this.parentElement, ${JSON.stringify(mission).replace(/"/g, '&quot;')})">
            <div class="logged-mission-title">${missionTitle}</div>
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
    
    // Base solution
    if (mission.baseSolution) {
        const azimuth = parseFloat(mission.baseSolution.azimuth) || 0;
        const elevation = parseFloat(mission.baseSolution.elevation) || 0;
        const tof = parseFloat(mission.baseSolution.tof) || 0;
        
        html += `
            <h4>Base Fire Solution</h4>
            <div class="logged-mission-gun-solution">
                <div class="logged-mission-gun-solution-details">
                    <div><strong>Azimuth:</strong> ${Math.round(azimuth)} mils</div>
                    <div><strong>Elevation:</strong> ${Math.round(elevation)} mils</div>
                    <div><strong>TOF:</strong> ${tof.toFixed(1)} sec</div>
                </div>
            </div>
        `;
    }
    
    // Section solutions (new format)
    if (mission.sectionSolutions && Object.keys(mission.sectionSolutions).length > 0) {
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
                            const azimuth = parseFloat(gun.azimuth) || 0;
                            const elevation = parseFloat(gun.elevation) || 0;
                            const tof = parseFloat(gun.tof) || 0;
                            
                            let targetInfo = '';
                            if (gun.targetX !== undefined && gun.targetY !== undefined) {
                                targetInfo = `<div><strong>Target:</strong> (${gun.targetX.toFixed(1)}, ${gun.targetY.toFixed(1)})</div>`;
                            }
                            
                            return `
                            <div class="logged-mission-gun-solution">
                                <div class="logged-mission-gun-solution-header">Gun ${gun.gun}</div>
                                <div class="logged-mission-gun-solution-details">
                                    <div><strong>Azimuth:</strong> ${Math.round(azimuth)} mils</div>
                                    <div><strong>Elevation:</strong> ${Math.round(elevation)} mils</div>
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
    
    // Legacy gun solutions (for backward compatibility)
    if (mission.gunSolutions && mission.gunSolutions.length > 0) {
        html += `
            <h4>Fire Solution per Gun (Legacy)</h4>
            ${mission.gunSolutions.map(solution => {
                const azimuth = parseFloat(solution.azimuth) || 0;
                const elevation = parseFloat(solution.elevation) || 0;
                const tof = parseFloat(solution.tof) || 0;
                
                let targetInfo = '';
                if (solution.targetX !== undefined && solution.targetY !== undefined) {
                    targetInfo = `<div><strong>Target:</strong> (${solution.targetX.toFixed(1)}, ${solution.targetY.toFixed(1)})</div>`;
                }
                
                return `
                <div class="logged-mission-gun-solution">
                    <div class="logged-mission-gun-solution-header">Gun ${solution.gunNumber}</div>
                    <div class="logged-mission-gun-solution-details">
                        <div><strong>Azimuth:</strong> ${Math.round(azimuth)} mils</div>
                        <div><strong>Elevation:</strong> ${Math.round(elevation)} mils</div>
                        <div><strong>TOF:</strong> ${tof.toFixed(1)} sec</div>
                        ${targetInfo}
                    </div>
                </div>
            `;
            }).join('')}
        `;
    }
    
    // Corrected solution
    if (mission.correctedSolution) {
        const azimuthCorr = parseFloat(mission.correctedSolution.azimuthCorr) || 0;
        const elevationCorr = parseFloat(mission.correctedSolution.elevationCorr) || 0;
        const tofCorr = parseFloat(mission.correctedSolution.tofCorr) || 0;
        
        html += `
            <h4>Corrected Fire Solution</h4>
            <div class="logged-mission-gun-solution">
                <div class="logged-mission-gun-solution-details">
                    <div><strong>Azimuth:</strong> ${Math.round(azimuthCorr)} mils</div>
                    <div><strong>Elevation:</strong> ${Math.round(elevationCorr)} mils</div>
                    <div><strong>TOF:</strong> ${tofCorr.toFixed(1)} sec</div>
                </div>
            </div>
        `;
    }
    
    return html;
}

function deleteMission(missionId, event) {
    event.stopPropagation(); // Prevent triggering the parent click event
    
    showConfirmModal('Delete Fire Mission', 'Are you sure you want to delete this fire mission?', () => {
        // Get existing logged missions
        const loggedMissions = JSON.parse(localStorage.getItem('loggedMissions') || '[]');
        
        // Remove the mission with the specified ID
        const updatedMissions = loggedMissions.filter(mission => mission.id !== missionId);
        
        // Save updated missions to localStorage
        localStorage.setItem('loggedMissions', JSON.stringify(updatedMissions));
        
        // Refresh the display
        displayLoggedMissions();
        
        showAlertModal('Success', 'Fire mission deleted successfully!');
    });
}

function toggleMissionDetails(element, mission) {
    const summaryDiv = element.querySelector('.logged-mission-summary');
    const solutionsDiv = element.querySelector('.logged-mission-solutions');
    const isVisible = summaryDiv.style.display !== 'none';
    
    summaryDiv.style.display = isVisible ? 'none' : 'block';
    solutionsDiv.style.display = isVisible ? 'none' : 'block';
}

// Function to clear all saved data
function clearAllData() {
    showConfirmModal('Clear All Data', 'Are you sure you want to clear all saved data? This action cannot be undone.', () => {
        // Clear all localStorage items
        const keysToRemove = [
            "mortarAlt", "numGuns",
            "platform", "shell", "rings", "sheaf-type-grid",
            "target-x", "target-y", "target-alt", "fo-dir", "sheaf-length", "sheaf-direction", "sheaf-diameter",
            "add-drop", "left-right", "target-number-grid", "amount-rounds-grid",
            "platform-polar", "shell-polar", "rings-polar", "sheaf-type-polar",
            "fo-x-polar", "fo-y-polar", "fo-dist-polar", "fo-dir-polar", "target-alt-polar",
            "sheaf-length-polar", "sheaf-direction-polar", "sheaf-diameter-polar",
            "add-drop-polar", "left-right-polar", "target-number-polar", "amount-rounds-polar",
            "loggedMissions"
        ];
        
        // Remove mortar coordinate keys
        for (let i = 1; i <= 6; i++) {
            keysToRemove.push(`mortarX${i}`, `mortarY${i}`);
        }
        
        keysToRemove.forEach(key => {
            localStorage.removeItem(key);
        });
        
        // Reload the page to reset all form fields
        location.reload();
    });
}

// Add event listeners for mission logging fields and correction inputs
document.addEventListener('DOMContentLoaded', function() {
    // Load all saved data when page loads
    loadAllData();
    
    // Setup input validation for field limits
    setupInputValidation();
    
    // Initialize section configuration
    updateSectionConfiguration();
    
    // Add event listeners for all input fields to automatically save data
    const allInputFields = [
        // Global data
        'num-sections',
        
        // Grid mission data
        'platform', 'sheaf-type-grid',
        'target-x', 'target-y', 'target-alt', 'fo-dir', 'sheaf-length', 'sheaf-direction', 'sheaf-diameter',
        'add-drop', 'left-right', 'target-number-grid', 'amount-rounds-grid',
        
        // Polar mission data
        'platform-polar', 'sheaf-type-polar',
        'fo-x-polar', 'fo-y-polar', 'fo-dist-polar', 'fo-dir-polar', 'target-alt-polar',
        'sheaf-length-polar', 'sheaf-direction-polar', 'sheaf-diameter-polar',
        'add-drop-polar', 'left-right-polar', 'target-number-polar', 'amount-rounds-polar'
    ];
    
    allInputFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.addEventListener('change', saveAllData);
            field.addEventListener('input', saveAllData);
            
            // Note: Removed live ring updates for grid mission - now only triggers on calculate button press
            
            // Note: Removed live ring updates for polar mission - now only triggers on calculate button press
        }
    });
    
    // Add event listeners for section configuration
    const numSectionsField = document.getElementById('num-sections');
    if (numSectionsField) {
        numSectionsField.addEventListener('change', function() {
            updateSectionConfiguration();
            saveAllData();
        });
    }
    
    // Add event listeners for section gun configuration and altitude (using event delegation)
    const sectionConfigContainer = document.getElementById('section-configuration-container');
    if (sectionConfigContainer) {
        sectionConfigContainer.addEventListener('change', function(e) {
            // console.log('Section config change event:', e.target.id, e.target.value);
            if (e.target.matches('select[id^="section-"][id$="-guns"]')) {
                updateMortarCoordinates();
                saveAllData();
            } else if (e.target.matches('input[id^="section-"][id$="-alt"]')) {
                saveAllData();
            }
        });
        sectionConfigContainer.addEventListener('input', function(e) {
            // console.log('Section config input event:', e.target.id, e.target.value);
            if (e.target.matches('input[id^="section-"][id$="-alt"]')) {
                saveAllData();
            }
        });
    }
    
    // Add event listeners for section selection (using event delegation)
    const sectionSelectionContainers = ['section-selection-grid', 'section-selection-polar', 'section-selection-shift'];
    sectionSelectionContainers.forEach(containerId => {
        const container = document.getElementById(containerId);
        if (container) {
            container.addEventListener('change', function(e) {
                if (e.target.matches('input[type="checkbox"]')) {
                    saveAllData();
                }
            });
        }
    });
    
    // Add event listeners for mortar coordinate inputs (these are dynamically created)
    const mortarContainer = document.getElementById('mortar-coordinates-container');
    if (mortarContainer) {
        // Use event delegation for dynamically created mortar coordinate inputs
        mortarContainer.addEventListener('change', function(e) {
            // console.log('Mortar coordinate change event:', e.target.id, e.target.value);
            if (e.target.matches('input[id*="-gun-"][id$="-x"], input[id*="-gun-"][id$="-y"]')) {
                saveAllData();
                // Note: Removed live ring updates - now only triggers on calculate button press
            }
        });
        mortarContainer.addEventListener('input', function(e) {
            // console.log('Mortar coordinate input event:', e.target.id, e.target.value);
            if (e.target.matches('input[id*="-gun-"][id$="-x"], input[id*="-gun-"][id$="-y"]')) {
                saveAllData();
                // Note: Removed live ring updates - now only triggers on calculate button press
            }
        });
    }
    
    // Add event listeners for mission-specific shell configurations (using event delegation)
    const missionTypes = ['grid', 'polar', 'shift'];
    missionTypes.forEach(type => {
        const shellConfigContainer = document.getElementById(`shell-config-${type}`);
        if (shellConfigContainer) {
            shellConfigContainer.addEventListener('change', function(e) {
                if (e.target.matches('select[id^="section-"][id$="-shell-' + type + '"], select[id^="section-"][id$="-rings-' + type + '"]')) {
                    saveAllData();
                    
                    // Note: Removed live ring updates when shell type changes - now only triggers on calculate button press
                }
            });
        }
    });
    
    // Add event listener for known point selection in shift missions
    const knownPointSelect = document.getElementById('known-point-select');
    if (knownPointSelect) {
        knownPointSelect.addEventListener('change', function() {
            saveAllData();
            // Note: Removed live ring updates - now only triggers on calculate button press
        });
    }
});

// Function to recalculate gun solutions when corrections change
function recalculateGunSolutions() {
    // Check if we're on grid mission page and have gun solutions
    const gridGunSolutions = document.getElementById('gun-solutions-content-grid');
    if (gridGunSolutions && gridGunSolutions.textContent.trim() !== "No solutions available") {
        // Recalculate gun solutions for grid mission
        const corrections = {
            addDrop: parseFloat(document.getElementById("add-drop").value) || 0,
            leftRight: parseFloat(document.getElementById("left-right").value) || 0
        };
        
        // Parse the existing gun solutions from the text content
        const solutionText = gridGunSolutions.textContent;
        const gunMatches = solutionText.match(/Gun (\d+):\s*\n\s*Azimuth: ([^\n]+) mils\s*\n\s*Elevation: ([^\n]+) mils\s*\n\s*TOF: ([^\n]+) sec/g);
        
        if (gunMatches) {
            const solutions = [];
            gunMatches.forEach(match => {
                const lines = match.split('\n').filter(line => line.trim());
                const gunNumber = parseInt(lines[0].match(/Gun (\d+):/)[1]);
                const azimuth = parseFloat(lines[1].match(/Azimuth: ([^\n]+) mils/)[1]);
                const elevation = parseFloat(lines[2].match(/Elevation: ([^\n]+) mils/)[1]);
                const tof = parseFloat(lines[3].match(/TOF: ([^\n]+) sec/)[1]);
                
                solutions.push({
                    gun: gunNumber,
                    azimuth: azimuth,
                    elevation: elevation,
                    tof: tof
                });
            });
            
            // Apply corrections to gun solutions
            const correctedGunSolutions = solutions.map(solution => {
                let correctedAzimuth = solution.azimuth;
                let correctedElevation = solution.elevation;
                
                if (corrections.leftRight && corrections.leftRight !== 0) {
                    const azimuthAdjustment = corrections.leftRight / 10;
                    correctedAzimuth = correctedAzimuth + azimuthAdjustment;
                }
                
                if (corrections.addDrop && corrections.addDrop !== 0) {
                    const elevationAdjustment = corrections.addDrop / 10;
                    correctedElevation = correctedElevation + elevationAdjustment;
                }
                
                return {
                    ...solution,
                    azimuth: correctedAzimuth,
                    elevation: correctedElevation
                };
            });
            
            displayGunSolutions(correctedGunSolutions, 'gun-solutions-content-grid');
        }
    }
    
    // Check if we're on polar mission page and have gun solutions
    const polarGunSolutions = document.getElementById('gun-solutions-content-polar');
    if (polarGunSolutions && polarGunSolutions.textContent.trim() !== "No solutions available") {
        // Recalculate gun solutions for polar mission
        const corrections = {
            addDrop: parseFloat(document.getElementById("add-drop-polar").value) || 0,
            leftRight: parseFloat(document.getElementById("left-right-polar").value) || 0
        };
        
        // Parse the existing gun solutions from the text content
        const solutionText = polarGunSolutions.textContent;
        const gunMatches = solutionText.match(/Gun (\d+):\s*\n\s*Azimuth: ([^\n]+) mils\s*\n\s*Elevation: ([^\n]+) mils\s*\n\s*TOF: ([^\n]+) sec/g);
        
        if (gunMatches) {
            const solutions = [];
            gunMatches.forEach(match => {
                const lines = match.split('\n').filter(line => line.trim());
                const gunNumber = parseInt(lines[0].match(/Gun (\d+):/)[1]);
                const azimuth = parseFloat(lines[1].match(/Azimuth: ([^\n]+) mils/)[1]);
                const elevation = parseFloat(lines[2].match(/Elevation: ([^\n]+) mils/)[1]);
                const tof = parseFloat(lines[3].match(/TOF: ([^\n]+) sec/)[1]);
                
                solutions.push({
                    gun: gunNumber,
                    azimuth: azimuth,
                    elevation: elevation,
                    tof: tof
                });
            });
            
            // Apply corrections to gun solutions
            const correctedGunSolutions = solutions.map(solution => {
                let correctedAzimuth = solution.azimuth;
                let correctedElevation = solution.elevation;
                
                if (corrections.leftRight && corrections.leftRight !== 0) {
                    const azimuthAdjustment = corrections.leftRight / 10;
                    correctedAzimuth = correctedAzimuth + azimuthAdjustment;
                }
                
                if (corrections.addDrop && corrections.addDrop !== 0) {
                    const elevationAdjustment = corrections.addDrop / 10;
                    correctedElevation = correctedElevation + elevationAdjustment;
                }
                
                return {
                    ...solution,
                    azimuth: correctedAzimuth,
                    elevation: correctedElevation
                };
            });
            
            displayGunSolutions(correctedGunSolutions, 'gun-solutions-content-polar');
        }
    }
}

// Function to reset all fields on the grid mission page
function resetGridMission() {
    showConfirmModal('Reset Grid Mission', 'Are you sure you want to reset all fields on the Grid Mission page? This will clear all input values and reset dropdowns to defaults.', () => {
        // Reset input fields to empty
        const gridInputFields = [
            'target-x', 'target-y', 'target-alt', 'fo-dir', 
            'sheaf-length', 'sheaf-direction', 'sheaf-diameter',
            'add-drop', 'left-right', 'amount-rounds-grid'
        ];
        
        gridInputFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.value = '';
            }
        });
        
        // Reset text field to empty
        const targetNumberField = document.getElementById('target-number-grid');
        if (targetNumberField) {
            targetNumberField.value = '';
        }
        
        // Reset dropdowns to default values
        const shellField = document.getElementById('shell');
        if (shellField) {
            shellField.value = 'HE';
        }
        
        const ringsField = document.getElementById('rings');
        if (ringsField) {
            ringsField.value = '0';
        }
        
        const sheafTypeField = document.getElementById('sheaf-type-grid');
        if (sheafTypeField) {
            sheafTypeField.value = 'parallel';
        }
        
        // Hide sheaf parameter sections
        const linearParams = document.getElementById('linear-sheaf-params');
        const circularParams = document.getElementById('circular-sheaf-params');
        if (linearParams) linearParams.style.display = 'none';
        if (circularParams) circularParams.style.display = 'none';
        
        // Hide results sections
        const baseResults = document.getElementById('base-results-grid');
        const correctedResults = document.getElementById('corrected-results-grid');
        const gunSolutions = document.getElementById('fire-solution-guns-grid');
        if (baseResults) baseResults.style.display = 'none';
        if (correctedResults) correctedResults.style.display = 'none';
        if (gunSolutions) gunSolutions.style.display = 'none';
        
        // Save the reset data
        saveAllData();
        
        // Show confirmation message
        const saveIndicator = document.getElementById('save-indicator');
        if (saveIndicator) {
            saveIndicator.textContent = 'Grid Mission fields reset';
            saveIndicator.style.display = 'block';
            setTimeout(() => {
                saveIndicator.style.display = 'none';
                saveIndicator.textContent = 'Data saved automatically'; // Reset text for future saves
            }, 2000);
        }
    });
}

// Function to reset all fields on the polar mission page
function resetPolarMission() {
    showConfirmModal('Reset Polar Mission', 'Are you sure you want to reset all fields on the Polar Plot Mission page? This will clear all input values and reset dropdowns to defaults.', () => {
        // Reset input fields to empty
        const polarInputFields = [
            'fo-x-polar', 'fo-y-polar', 'fo-dist-polar', 'fo-dir-polar', 'target-alt-polar',
            'sheaf-length-polar', 'sheaf-direction-polar', 'sheaf-diameter-polar',
            'add-drop-polar', 'left-right-polar', 'amount-rounds-polar'
        ];
        
        polarInputFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.value = '';
            }
        });
        
        // Reset text field to empty
        const targetNumberField = document.getElementById('target-number-polar');
        if (targetNumberField) {
            targetNumberField.value = '';
        }
        
        // Reset dropdowns to default values
        const shellField = document.getElementById('shell-polar');
        if (shellField) {
            shellField.value = 'HE';
        }
        
        const ringsField = document.getElementById('rings-polar');
        if (ringsField) {
            ringsField.value = '0';
        }
        
        const sheafTypeField = document.getElementById('sheaf-type-polar');
        if (sheafTypeField) {
            sheafTypeField.value = 'parallel';
        }
        
        // Hide sheaf parameter sections
        const linearParams = document.getElementById('linear-sheaf-params-polar');
        const circularParams = document.getElementById('circular-sheaf-params-polar');
        if (linearParams) linearParams.style.display = 'none';
        if (circularParams) circularParams.style.display = 'none';
        
        // Hide results sections
        const baseResults = document.getElementById('base-results-polar');
        const correctedResults = document.getElementById('corrected-results-polar');
        const gunSolutions = document.getElementById('fire-solution-guns-polar');
        if (baseResults) baseResults.style.display = 'none';
        if (correctedResults) correctedResults.style.display = 'none';
        if (gunSolutions) gunSolutions.style.display = 'none';
        
        // Save the reset data
        saveAllData();
        
        // Show confirmation message
        const saveIndicator = document.getElementById('save-indicator');
        if (saveIndicator) {
            saveIndicator.textContent = 'Polar Mission fields reset';
            saveIndicator.style.display = 'block';
            setTimeout(() => {
                saveIndicator.style.display = 'none';
                saveIndicator.textContent = 'Data saved automatically'; // Reset text for future saves
            }, 2000);
        }
    });
}

// Input validation functions to limit digits/characters
function setupInputValidation() {
    // Coordinate input fields (max 4 digits)
    const coordinateFields = [
        'target-x', 'target-y', 'fo-x-polar', 'fo-y-polar', 'fo-dist-polar',
        'target-alt', 'target-alt-polar', 'sheaf-length', 'sheaf-length-polar',
        'sheaf-diameter', 'sheaf-diameter-polar'
    ];
    
    coordinateFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.addEventListener('input', function() {
                // Remove any non-digit characters except minus sign
                let value = this.value.replace(/[^\d-]/g, '');
                
                // Ensure only one minus sign at the beginning
                if (value.startsWith('-')) {
                    value = '-' + value.substring(1).replace(/-/g, '');
                } else {
                    value = value.replace(/-/g, '');
                }
                
                // Limit to 4 digits (plus minus sign if present)
                if (value.startsWith('-')) {
                    if (value.length > 5) { // - plus 4 digits
                        value = value.substring(0, 5);
                    }
                } else {
                    if (value.length > 4) {
                        value = value.substring(0, 4);
                    }
                }
                
                this.value = value;
            });
        }
    });
    
    // Target direction fields (max 3 digits)
    const directionFields = ['fo-dir', 'fo-dir-polar', 'sheaf-direction', 'sheaf-direction-polar'];
    
    directionFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.addEventListener('input', function() {
                // Remove any non-digit characters
                let value = this.value.replace(/[^\d]/g, '');
                
                // Limit to 3 digits
                if (value.length > 3) {
                    value = value.substring(0, 3);
                }
                
                this.value = value;
            });
        }
    });
    
    // Correction fields (max 4 digits plus minus sign)
    const correctionFields = ['add-drop', 'left-right', 'add-drop-polar', 'left-right-polar'];
    
    correctionFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.addEventListener('input', function() {
                // Remove any non-digit characters except minus sign
                let value = this.value.replace(/[^\d-]/g, '');
                
                // Ensure only one minus sign at the beginning
                if (value.startsWith('-')) {
                    value = '-' + value.substring(1).replace(/-/g, '');
                } else {
                    value = value.replace(/-/g, '');
                }
                
                // Limit to 4 digits (plus minus sign if present)
                if (value.startsWith('-')) {
                    if (value.length > 5) { // - plus 4 digits
                        value = value.substring(0, 5);
                    }
                } else {
                    if (value.length > 4) {
                        value = value.substring(0, 4);
                    }
                }
                
                this.value = value;
            });
        }
    });
    
    // Target number fields (max 6 characters)
    const targetNumberFields = ['target-number-grid', 'target-number-polar'];
    
    targetNumberFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.addEventListener('input', function() {
                // Limit to 6 characters
                if (this.value.length > 6) {
                    this.value = this.value.substring(0, 6);
                }
            });
        }
    });
    
    // Amount of rounds fields (max 3 digits)
    const roundsFields = ['amount-rounds-grid', 'amount-rounds-polar'];
    
    roundsFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.addEventListener('input', function() {
                // Remove any non-digit characters
                let value = this.value.replace(/[^\d]/g, '');
                
                // Limit to 3 digits
                if (value.length > 3) {
                    value = value.substring(0, 3);
                }
                
                this.value = value;
            });
        }
    });
    
    // Mortar coordinate fields (max 4 digits)
    for (let i = 1; i <= 6; i++) {
        const xField = document.getElementById(`mortar-x-${i}`);
        const yField = document.getElementById(`mortar-y-${i}`);
        
        if (xField) {
            xField.addEventListener('input', function() {
                // Remove any non-digit characters except minus sign
                let value = this.value.replace(/[^\d-]/g, '');
                
                // Ensure only one minus sign at the beginning
                if (value.startsWith('-')) {
                    value = '-' + value.substring(1).replace(/-/g, '');
                } else {
                    value = value.replace(/-/g, '');
                }
                
                // Limit to 4 digits (plus minus sign if present)
                if (value.startsWith('-')) {
                    if (value.length > 5) { // - plus 4 digits
                        value = value.substring(0, 5);
                    }
                } else {
                    if (value.length > 4) {
                        value = value.substring(0, 4);
                    }
                }
                
                this.value = value;
            });
        }
        
        if (yField) {
            yField.addEventListener('input', function() {
                // Remove any non-digit characters except minus sign
                let value = this.value.replace(/[^\d-]/g, '');
                
                // Ensure only one minus sign at the beginning
                if (value.startsWith('-')) {
                    value = '-' + value.substring(1).replace(/-/g, '');
                } else {
                    value = value.replace(/-/g, '');
                }
                
                // Limit to 4 digits (plus minus sign if present)
                if (value.startsWith('-')) {
                    if (value.length > 5) { // - plus 4 digits
                        value = value.substring(0, 5);
                    }
                } else {
                    if (value.length > 4) {
                        value = value.substring(0, 4);
                    }
                }
                
                this.value = value;
            });
        }
    }
}

function deleteAllMissions() {
    showConfirmModal('Delete All Fire Missions', 'Are you sure you want to delete all logged fire missions? This action cannot be undone.', () => {
        localStorage.removeItem('loggedMissions');
        console.log('All logged missions deleted from localStorage');
        
        // Refresh the display
        displayLoggedMissions();
        
        // Show confirmation message
        const container = document.getElementById('logged-missions-list');
        container.innerHTML = '<p style="color: #4CAF50; text-align: center; font-weight: bold;">All missions have been deleted successfully.</p>';
        
        // Clear the confirmation message after 3 seconds
        setTimeout(() => {
            displayLoggedMissions();
        }, 3000);
    });
}

// ===== KNOWN POINTS FUNCTIONS =====

function displayKnownPoints() {
    const container = document.getElementById('known-points-list');
    const knownPoints = JSON.parse(localStorage.getItem('knownPoints') || '[]');
    
    if (knownPoints.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666;">No known points saved yet.</p>';
        return;
    }
    
    // Sort known points by target number
    knownPoints.sort((a, b) => a.targetNumber.localeCompare(b.targetNumber));
    
    let html = '';
    knownPoints.forEach(point => {
        html += `
            <div class="logged-mission" onclick="toggleKnownPointDetails('${point.id}')">
                <div class="logged-mission-header">
                    <span class="logged-mission-target">${point.targetNumber}</span>
                    <span class="logged-mission-coordinates">(${point.x}, ${point.y})</span>
                </div>
                <div class="logged-mission-summary" id="known-point-summary-${point.id}" style="display: none;">
                    <div class="logged-mission-detail">
                        <span class="logged-mission-detail-label">Coordinates:</span>
                        <span class="logged-mission-detail-value">X: ${point.x}, Y: ${point.y}</span>
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
                        <button onclick="editKnownPoint('${point.id}')" style="background: #2196F3; color: white; padding: 5px 10px; border: none; border-radius: 3px; margin-right: 5px; cursor: pointer;">Edit</button>
                        <button onclick="deleteKnownPoint('${point.id}')" style="background: #f44336; color: white; padding: 5px 10px; border: none; border-radius: 3px; cursor: pointer;">Delete</button>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function toggleKnownPointDetails(pointId) {
    const summary = document.getElementById(`known-point-summary-${pointId}`);
    if (summary.style.display === 'none') {
        summary.style.display = 'block';
    } else {
        summary.style.display = 'none';
    }
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
        const knownPoints = JSON.parse(localStorage.getItem('knownPoints') || '[]');
        const filteredPoints = knownPoints.filter(p => p.id !== pointId);
        localStorage.setItem('knownPoints', JSON.stringify(filteredPoints));
        
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
        
        setTimeout(() => {
            displayKnownPoints();
        }, 3000);
    });
}

function updateKnownPointDropdown() {
    const dropdown = document.getElementById('known-point-select');
    if (!dropdown) return;
    
    const knownPoints = JSON.parse(localStorage.getItem('knownPoints') || '[]');
    
    // Clear existing options except the first one
    dropdown.innerHTML = '<option value="">Select a known point...</option>';
    
    // Sort by target number
    knownPoints.sort((a, b) => a.targetNumber.localeCompare(b.targetNumber));
    
    knownPoints.forEach(point => {
        const option = document.createElement('option');
        option.value = point.id;
        option.textContent = `${point.targetNumber} (${point.x}, ${point.y})`;
        dropdown.appendChild(option);
    });
}

// ===== NFA FUNCTIONS =====

function displayNFAs() {
    const container = document.getElementById('nfa-list');
    const nfas = JSON.parse(localStorage.getItem('nfas') || '[]');
    
    if (nfas.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666;">No NFAs saved yet.</p>';
        return;
    }
    
    // Sort NFAs by name
    nfas.sort((a, b) => a.name.localeCompare(b.name));
    
    let html = '';
    nfas.forEach(nfa => {
        html += `
            <div class="logged-mission" onclick="toggleNFADetails('${nfa.id}')">
                <div class="logged-mission-header">
                    <span class="logged-mission-target">${nfa.name}</span>
                    <span class="logged-mission-coordinates">(${nfa.x}, ${nfa.y}) - ${nfa.diameter}m</span>
                </div>
                <div class="logged-mission-summary" id="nfa-summary-${nfa.id}" style="display: none;">
                    <div class="logged-mission-detail">
                        <span class="logged-mission-detail-label">Location:</span>
                        <span class="logged-mission-detail-value">X: ${nfa.x}, Y: ${nfa.y}</span>
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
        `;
    });
    
    container.innerHTML = html;
}

function toggleNFADetails(nfaId) {
    const summary = document.getElementById(`nfa-summary-${nfaId}`);
    if (summary.style.display === 'none') {
        summary.style.display = 'block';
    } else {
        summary.style.display = 'none';
    }
}

function addNewNFA() {
    // Clear previous values
    document.getElementById('nfa-name').value = '';
    document.getElementById('nfa-x').value = '';
    document.getElementById('nfa-y').value = '';
    document.getElementById('nfa-diameter').value = '';
    document.getElementById('nfa-issued-by').value = '';
    
    // Show the modal
    document.getElementById('add-nfa-modal').style.display = 'block';
}

function closeAddNFAModal() {
    document.getElementById('add-nfa-modal').style.display = 'none';
    
    // Reset modal state
    document.getElementById('add-nfa-modal').removeAttribute('data-editing-nfa-id');
    document.querySelector('#add-nfa-modal h2').textContent = 'Add New No Fire Area (NFA)';
    document.querySelector('#add-nfa-modal button[onclick="saveNewNFA()"]').textContent = 'Save NFA';
}

function saveNewNFA() {
    const name = document.getElementById('nfa-name').value.trim();
    const x = document.getElementById('nfa-x').value;
    const y = document.getElementById('nfa-y').value;
    const diameter = document.getElementById('nfa-diameter').value;
    const issuedBy = document.getElementById('nfa-issued-by').value.trim();
    
    // Validate required fields
    const errors = [];
    if (!name) errors.push('NFA name is required');
    if (!x || isNaN(x)) errors.push('Valid X coordinate is required');
    if (!y || isNaN(y)) errors.push('Valid Y coordinate is required');
    if (!diameter || isNaN(diameter) || diameter <= 0) errors.push('Valid diameter is required');
    
    if (errors.length > 0) {
        alert('Please fix the following errors:\n\n' + errors.join('\n'));
        return;
    }
    
    const nfas = JSON.parse(localStorage.getItem('nfas') || '[]');
    
    // Check if we're editing an existing NFA
    const editingNfaId = document.getElementById('add-nfa-modal').getAttribute('data-editing-nfa-id');
    
    if (editingNfaId) {
        // Editing existing NFA
        const nfaIndex = nfas.findIndex(n => n.id === editingNfaId);
        if (nfaIndex !== -1) {
            nfas[nfaIndex] = {
                ...nfas[nfaIndex],
                name: name,
                x: parseFloat(x),
                y: parseFloat(y),
                diameter: parseFloat(diameter),
                issuedBy: issuedBy || 'N/A'
            };
        }
    } else {
        // Adding new NFA
        const newNFA = {
            id: Date.now().toString(),
            name: name,
            x: parseFloat(x),
            y: parseFloat(y),
            diameter: parseFloat(diameter),
            issuedBy: issuedBy || 'N/A',
            timestamp: Date.now()
        };
        nfas.push(newNFA);
    }
    
    localStorage.setItem('nfas', JSON.stringify(nfas));
    
    // Reset modal state
    document.getElementById('add-nfa-modal').removeAttribute('data-editing-nfa-id');
    document.querySelector('#add-nfa-modal h2').textContent = 'Add New No Fire Area (NFA)';
    document.querySelector('#add-nfa-modal button[onclick="saveNewNFA()"]').textContent = 'Save NFA';
    
    // Close modal and refresh display
    closeAddNFAModal();
    displayNFAs();
    
    // Show success message
    const action = editingNfaId ? 'updated' : 'added';
    alert(`NFA ${action} successfully!`);
}

function editNFA(nfaId) {
    event.stopPropagation();
    const nfas = JSON.parse(localStorage.getItem('nfas') || '[]');
    const nfa = nfas.find(n => n.id === nfaId);
    
    if (!nfa) return;
    
    // Populate the modal with existing values
    document.getElementById('nfa-name').value = nfa.name;
    document.getElementById('nfa-x').value = nfa.x;
    document.getElementById('nfa-y').value = nfa.y;
    document.getElementById('nfa-diameter').value = nfa.diameter;
    document.getElementById('nfa-issued-by').value = nfa.issuedBy === 'N/A' ? '' : nfa.issuedBy;
    
    // Store the NFA ID for editing
    document.getElementById('add-nfa-modal').setAttribute('data-editing-nfa-id', nfaId);
    
    // Change modal title and button text
    document.querySelector('#add-nfa-modal h2').textContent = 'Edit No Fire Area (NFA)';
    document.querySelector('#add-nfa-modal button[onclick="saveNewNFA()"]').textContent = 'Update NFA';
    
    // Show the modal
    document.getElementById('add-nfa-modal').style.display = 'block';
}

function deleteNFA(nfaId) {
    event.stopPropagation();
    showConfirmModal('Delete NFA', 'Are you sure you want to delete this NFA?', () => {
        const nfas = JSON.parse(localStorage.getItem('nfas') || '[]');
        const filteredNFAs = nfas.filter(n => n.id !== nfaId);
        localStorage.setItem('nfas', JSON.stringify(filteredNFAs));
        
        displayNFAs();
    });
}

function deleteAllNFAs() {
    showConfirmModal('Delete All NFAs', 'Are you sure you want to delete all NFAs? This action cannot be undone.', () => {
        localStorage.removeItem('nfas');
        displayNFAs();
        
        const container = document.getElementById('nfa-list');
        container.innerHTML = '<p style="color: #4CAF50; text-align: center; font-weight: bold;">All NFAs have been deleted successfully.</p>';
        
        setTimeout(() => {
            displayNFAs();
        }, 3000);
    });
}

function checkNFAViolation(targetX, targetY) {
    const nfas = JSON.parse(localStorage.getItem('nfas') || '[]');
    console.log('Checking NFA violation for coordinates:', targetX, targetY);
    console.log('Available NFAs:', nfas);
    
    for (const nfa of nfas) {
        const distance = Math.sqrt(Math.pow(targetX - nfa.x, 2) + Math.pow(targetY - nfa.y, 2));
        console.log(`Checking NFA "${nfa.name}" at (${nfa.x}, ${nfa.y}) with diameter ${nfa.diameter}, distance: ${distance}`);
        if (distance <= nfa.diameter / 2) {
            console.log(`NFA violation detected! Distance ${distance} <= radius ${nfa.diameter / 2}`);
            return {
                violated: true,
                nfa: nfa,
                distance: distance
            };
        }
    }
    
    console.log('No NFA violations detected');
    return { violated: false };
}

// ===== SHIFT MISSION FUNCTIONS =====

function updateRingsOptionsShift() {
    const shell = document.getElementById("shell-shift").value;
    const rings = document.getElementById("rings-shift");
    rings.innerHTML = "";

    const options = (shell === "SMOKE" || shell === "ILUM") ? [1, 2, 3, 4] : [0, 1, 2, 3, 4];
    
    // Try to get current target coordinates for automatic selection
    const selectedPointId = document.getElementById("known-point-select").value;
    const shiftX = parseFloat(document.getElementById("shift-x").value) || 0;
    const shiftY = parseFloat(document.getElementById("shift-y").value) || 0;
    
    // Get mortar coordinates based on selected sections and base gun logic
    const selectedSections = getSelectedSections('shift');
    const gunConfiguration = getGunConfiguration();
    let mortarX = null;
    let mortarY = null;
    
    if (selectedSections.length > 0) {
        const totalGuns = getTotalGuns();
        let baseGunNumber = 1;
        
        if (totalGuns > 1) {
            // Find gun 2 (base gun) across all selected sections
            let gunCount = 0;
            for (const section of selectedSections) {
                const sectionGuns = parseInt(document.getElementById(`section-${section}-guns`).value);
                if (gunCount + sectionGuns >= 2) {
                    // Gun 2 is in this section
                    const gunIndexInSection = 2 - gunCount - 1; // Convert to 0-based index
                    mortarX = parseFloat(document.getElementById(`section-${section}-gun-${gunIndexInSection + 1}-x`).value);
                    mortarY = parseFloat(document.getElementById(`section-${section}-gun-${gunIndexInSection + 1}-y`).value);
                    break;
                }
                gunCount += sectionGuns;
            }
        } else {
            // Only one gun total, use the first gun of the first selected section
            const firstSection = selectedSections[0];
            mortarX = parseFloat(document.getElementById(`section-${firstSection}-gun-1-x`).value);
            mortarY = parseFloat(document.getElementById(`section-${firstSection}-gun-1-y`).value);
        }
    }
    
    let autoSelectedRing = null;
    let rangeCheck = null;
    
    if (selectedPointId && mortarX && mortarY) {
        const knownPoints = JSON.parse(localStorage.getItem('knownPoints') || '[]');
        const selectedPoint = knownPoints.find(p => p.id === selectedPointId);
        
        if (selectedPoint) {
            // Calculate new target coordinates
            const targetX = selectedPoint.x + shiftX / 10;
            const targetY = selectedPoint.y + shiftY / 10;
            
            const range = calculateRange(mortarX, mortarY, targetX, targetY);
            rangeCheck = checkTargetRange(range, shell);
            if (rangeCheck.inRange) {
                autoSelectedRing = getMinimumRingsForRange(range, shell);
            }
        }
    }

    options.forEach(r => {
        const opt = document.createElement("option");
        opt.value = r;
        
        // Add visual indicator for auto-selected ring
        if (autoSelectedRing !== null && r === autoSelectedRing) {
            opt.textContent = `${r} !`;
            opt.selected = true;
        } else {
            opt.textContent = r;
        }
        
        rings.appendChild(opt);
    });

    // Show range error if target is out of range
    if (rangeCheck && !rangeCheck.inRange) {
        alert(rangeCheck.reason);
    }
}

function calculateShiftMission(bypassNFA = false) {
    // Trigger ring updates before calculation
    triggerRingUpdatesForCalculation('shift');
    
    // Use flexible validation
    const validation = validateMissionFields('shift');
    
    // Show errors if any
    if (validation.errors.length > 0) {
        showAlertModal('Validation Error', 'Please fix the following errors:\n\n' + validation.errors.join('\n'));
        return;
    }
    
    // Get global data
    const selectedSections = getSelectedSections('shift');
    const gunConfiguration = getGunConfiguration();
    
    // Get selected known point
    const selectedPointId = document.getElementById("known-point-select").value;
    const knownPoints = JSON.parse(localStorage.getItem('knownPoints') || '[]');
    const selectedPoint = knownPoints.find(p => p.id === selectedPointId);
    
    // Get shift values
    const shiftX = parseFloat(document.getElementById("shift-x").value) || 0;
    const shiftY = parseFloat(document.getElementById("shift-y").value) || 0;
    
    // Calculate new target coordinates
    const targetX = selectedPoint.x + shiftX / 10; // Scale down by 10
    const targetY = selectedPoint.y + shiftY / 10; // Scale down by 10
    const targetAlt = parseFloat(document.getElementById("target-alt-shift").value) || selectedPoint.altitude;
    
    // Check for NFA violation after calculating target coordinates (unless bypassing)
    if (!bypassNFA) {
        const nfaCheck = checkNFAViolation(targetX, targetY);
        if (nfaCheck.violated) {
            showNFAWarningModal(nfaCheck, 'shift');
            return; // Don't proceed until user decides
        }
    }
    
    // Get mission parameters
    const sheafType = document.getElementById("sheaf-type-shift").value;
    const foDirDeg = parseFloat(document.getElementById("fo-dir-shift").value) || 0;
    const addDrop = parseFloat(document.getElementById("add-drop-shift").value) || 0;
    const leftRight = parseFloat(document.getElementById("left-right-shift").value) || 0;

    // Calculate total guns from selected sections
    let totalGuns = 0;
    let gunStartIndex = 1;
    const sectionGuns = [];
    
    for (let i = 1; i <= gunConfiguration.length; i++) {
        const section = gunConfiguration[i - 1];
        if (selectedSections.includes(section.section)) {
            sectionGuns.push({
                section: section.section,
                guns: section.guns,
                startIndex: gunStartIndex,
                endIndex: gunStartIndex + section.guns - 1
            });
            totalGuns += section.guns;
            gunStartIndex += section.guns;
        }
    }
    
    // Determine which gun to use for parallel sheaf calculations
    let calculationGun = 1;
    if (totalGuns > 1) {
        calculationGun = 2; // Use gun 2 if more than 1 gun
    }
    
    // Get mortar coordinates for the calculation gun
    const mortarCoords = getMortarCoordinates(calculationGun);
    if (!mortarCoords.x || !mortarCoords.y) {
        alert(`Please enter coordinates for Gun ${calculationGun}`);
        return;
    }
    
    // Get section-specific altitude, shell, and rings for the calculation gun
    const calculationGunSection = getSectionForGun(calculationGun);
    const sectionMortarAlt = getSectionAltitude(calculationGunSection);
    const sectionShell = document.getElementById(`section-${calculationGunSection}-shell-shift`).value;
    const sectionRings = parseInt(document.getElementById(`section-${calculationGunSection}-rings-shift`).value);
    
    // Check range validation
    const range = calculateRange(mortarCoords.x, mortarCoords.y, targetX, targetY);
    const rangeCheck = checkTargetRange(range, sectionShell);
    if (!rangeCheck.inRange) {
        alert(rangeCheck.reason);
        return;
    }

    // Calculate base solution using the selected gun
    const baseSolution = calculateSingleGunBallistics(
        mortarCoords.x, mortarCoords.y, targetX, targetY, sectionMortarAlt, targetAlt,
        sectionShell, sectionRings, addDrop, leftRight, foDirDeg
    );

    if (!baseSolution) {
        alert("Firing table not available for this shell/ring combination.");
        return;
    }

    // Display base results
    document.getElementById("range-shift").textContent = Math.round(range);
    document.getElementById("azimuth-shift").textContent = Math.round(baseSolution.azimuth);
    document.getElementById("elevation-shift").textContent = Math.round(baseSolution.elevation);
    document.getElementById("tof-shift").textContent = baseSolution.tof.toFixed(1);

    document.getElementById("azimuth-corr-shift").textContent = Math.round(baseSolution.azimuthCorr);
    document.getElementById("elevation-corr-shift").textContent = Math.round(baseSolution.elevationCorr);
    document.getElementById("tof-corr-shift").textContent = baseSolution.tofCorr.toFixed(1);
    
    // Show result sections
    document.getElementById('base-results-shift').style.display = 'block';
    document.getElementById('corrected-results-shift').style.display = 'block';
    
    console.log('Shift mission results displayed:', {
        range: Math.round(range),
        azimuth: Math.round(baseSolution.azimuth),
        elevation: Math.round(baseSolution.elevation),
        tof: baseSolution.tof.toFixed(1),
        azimuthCorr: Math.round(baseSolution.azimuthCorr),
        elevationCorr: Math.round(baseSolution.elevationCorr),
        tofCorr: baseSolution.tofCorr.toFixed(1)
    });

    // Calculate solutions for all guns based on sheaf type
    let gunSolutions = [];
    
    if (sheafType === 'parallel') {
        // For parallel sheaf, all guns use the same solution
        // Calculate corrected target coordinates based on corrections
        const foDirRad = foDirDeg * Math.PI / 180;
        const xCorr = (addDrop/10);
        const yCorr = (leftRight/10);
        const correctedTargetX = targetX + xCorr * Math.sin(foDirRad) + yCorr * Math.cos(foDirRad);
        const correctedTargetY = targetY + xCorr * Math.cos(foDirRad) - yCorr * Math.sin(foDirRad);
        
        // Calculate solutions for all guns from selected sections
        for (const section of sectionGuns) {
            for (let i = section.startIndex; i <= section.endIndex; i++) {
                gunSolutions.push({
                    gun: i - section.startIndex + 1, // Section-relative gun number
                    section: section.section,
                    azimuth: baseSolution.azimuthCorr,
                    elevation: baseSolution.elevationCorr,
                    tof: baseSolution.tofCorr,
                    targetX: correctedTargetX,
                    targetY: correctedTargetY
                });
            }
        }
    } else if (sheafType === 'linear') {
        // For linear sheaf, calculate individual target coordinates for each gun
        const sheafLength = parseFloat(document.getElementById("sheaf-length-shift").value);
        const sheafDirection = parseFloat(document.getElementById("sheaf-direction-shift").value);
        
        if (!sheafLength || sheafDirection === null || sheafDirection === undefined || isNaN(sheafDirection)) {
            alert("Please enter sheaf length and direction for linear sheaf");
            return;
        }
        
        // Scale down sheaf length by dividing by 10 (convert meters to calculation units)
        const scaledSheafLength = sheafLength / 10;
        
        // Calculate target coordinates for each gun
        const targetCoordinates = calculateLinearSheafTargets(targetX, targetY, scaledSheafLength, sheafDirection, totalGuns);
        
        // Calculate ballistic solution for each gun-target pair
        let gunIndex = 0;
        for (const section of sectionGuns) {
            for (let i = section.startIndex; i <= section.endIndex; i++) {
                const gunCoords = getMortarCoordinates(i);
                if (!gunCoords.x || !gunCoords.y) {
                    alert(`Please enter coordinates for Gun ${i}`);
                    return;
                }
                
                const targetCoord = targetCoordinates[gunIndex];
                
                // Get section-specific altitude, shell, and rings for this gun
                const gunSection = getSectionForGun(i);
                const gunSectionAlt = getSectionAltitude(gunSection);
                const gunSectionShell = document.getElementById(`section-${gunSection}-shell-shift`).value;
                const gunSectionRings = parseInt(document.getElementById(`section-${gunSection}-rings-shift`).value);
                
                const solution = calculateSingleGunBallistics(
                    gunCoords.x, gunCoords.y, targetCoord.x, targetCoord.y, gunSectionAlt, targetAlt,
                    gunSectionShell, gunSectionRings, addDrop, leftRight, foDirDeg
                );
                
                if (solution) {
                    gunSolutions.push({
                        gun: i - section.startIndex + 1, // Section-relative gun number
                        section: section.section,
                        azimuth: solution.azimuthCorr,
                        elevation: solution.elevationCorr,
                        tof: solution.tofCorr,
                        targetX: targetCoord.x,
                        targetY: targetCoord.y
                    });
                }
                gunIndex++;
            }
        }
    } else if (sheafType === 'circular') {
        // For circular sheaf, calculate individual target coordinates for each gun
        const sheafDiameter = parseFloat(document.getElementById("sheaf-diameter-shift").value);
        
        if (!sheafDiameter || sheafDiameter <= 0) {
            alert("Please enter a valid sheaf diameter for circular sheaf");
            return;
        }
        
        // Scale down sheaf diameter by dividing by 10 (convert meters to calculation units)
        const scaledSheafDiameter = sheafDiameter / 10;
        
        // Calculate target coordinates for each gun
        const targetCoordinates = calculateCircularSheafTargets(targetX, targetY, scaledSheafDiameter, totalGuns);
        
        // Calculate ballistic solution for each gun-target pair
        let gunIndex = 0;
        for (const section of sectionGuns) {
            for (let i = section.startIndex; i <= section.endIndex; i++) {
                const gunCoords = getMortarCoordinates(i);
                if (!gunCoords.x || !gunCoords.y) {
                    alert(`Please enter coordinates for Gun ${i}`);
                    return;
                }
                
                const targetCoord = targetCoordinates[gunIndex];
                
                // Get section-specific altitude, shell, and rings for this gun
                const gunSection = getSectionForGun(i);
                const gunSectionAlt = getSectionAltitude(gunSection);
                const gunSectionShell = document.getElementById(`section-${gunSection}-shell-shift`).value;
                const gunSectionRings = parseInt(document.getElementById(`section-${gunSection}-rings-shift`).value);
                
                const solution = calculateSingleGunBallistics(
                    gunCoords.x, gunCoords.y, targetCoord.x, targetCoord.y, gunSectionAlt, targetAlt,
                    gunSectionShell, gunSectionRings, addDrop, leftRight, foDirDeg
                );
                
                if (solution) {
                    gunSolutions.push({
                        gun: i - section.startIndex + 1, // Section-relative gun number
                        section: section.section,
                        azimuth: solution.azimuthCorr,
                        elevation: solution.elevationCorr,
                        tof: solution.tofCorr,
                        targetX: targetCoord.x,
                        targetY: targetCoord.y
                    });
                }
                gunIndex++;
            }
        }
    } else if (sheafType === 'converged') {
        // For converged sheaf, all guns fire at exactly the same target coordinate
        // Calculate ballistic solution for each gun to the same target
        for (const section of sectionGuns) {
            for (let i = section.startIndex; i <= section.endIndex; i++) {
                const gunCoords = getMortarCoordinates(i);
                if (!gunCoords.x || !gunCoords.y) {
                    alert(`Please enter coordinates for Gun ${i}`);
                    return;
                }
                
                // Apply corrections to target coordinates
                const foDirRad = foDirDeg * Math.PI / 180;
                const xCorr = (addDrop/10);
                const yCorr = (leftRight/10);
                const correctedTargetX = targetX + xCorr * Math.sin(foDirRad) + yCorr * Math.cos(foDirRad);
                const correctedTargetY = targetY + xCorr * Math.cos(foDirRad) - yCorr * Math.sin(foDirRad);
                
                // Get section-specific altitude, shell, and rings for this gun
                const gunSection = getSectionForGun(i);
                const gunSectionAlt = getSectionAltitude(gunSection);
                const gunSectionShell = document.getElementById(`section-${gunSection}-shell-shift`).value;
                const gunSectionRings = parseInt(document.getElementById(`section-${gunSection}-rings-shift`).value);
                
                const solution = calculateSingleGunBallistics(
                    gunCoords.x, gunCoords.y, correctedTargetX, correctedTargetY, gunSectionAlt, targetAlt,
                    gunSectionShell, gunSectionRings, 0, 0, foDirDeg // Pass 0 for corrections to avoid double-correction
                );
                
                if (solution) {
                    gunSolutions.push({
                        gun: i - section.startIndex + 1, // Section-relative gun number
                        section: section.section,
                        azimuth: solution.azimuthCorr,
                        elevation: solution.elevationCorr,
                        tof: solution.tofCorr,
                        targetX: correctedTargetX,
                        targetY: correctedTargetY
                    });
                }
            }
        }
    } else if (sheafType === 'open') {
        // For open sheaf, calculate specific target coordinates for each gun
        // Gun 1: subtract 1 from X and 1 from Y
        // Gun 2: use original coordinates (base gun)
        // Gun 3: add 1 to X and subtract 1 from Y
        // Gun 4: add 2 to X and change nothing to Y
        
        // Check if all sections are selected
        const allSectionsCheckbox = document.getElementById('all-sections-shift');
        const useGlobalGunIndex = allSectionsCheckbox && allSectionsCheckbox.checked;
        
        let globalGunIndex = 0;
        for (const section of sectionGuns) {
            for (let i = section.startIndex; i <= section.endIndex; i++) {
                const gunCoords = getMortarCoordinates(i);
                if (!gunCoords.x || !gunCoords.y) {
                    alert(`Please enter coordinates for Gun ${i}`);
                    return;
                }
                
                // Calculate target coordinates based on gun position
                let targetCoordX = targetX;
                let targetCoordY = targetY;
                
                let gunPosition;
                if (useGlobalGunIndex) {
                    // When all sections are selected, use global gun index (1 to n)
                    gunPosition = (globalGunIndex % 4) + 1; // 1-4 cycle
                } else {
                    // When specific sections are selected, use section-relative positioning
                    gunPosition = (i - section.startIndex + 1) % 4; // 1-4 cycle
                    if (gunPosition === 0) gunPosition = 4; // Convert 0 to 4 for Gun 4
                }
                
                if (gunPosition === 1) {
                    // Gun 1: subtract 1 from X and 1 from Y
                    targetCoordX = targetX - 1;
                    targetCoordY = targetY - 1;
                } else if (gunPosition === 2) {
                    // Gun 2: use original coordinates (base gun)
                    targetCoordX = targetX;
                    targetCoordY = targetY;
                } else if (gunPosition === 3) {
                    // Gun 3: add 1 to X and subtract 1 from Y
                    targetCoordX = targetX + 1;
                    targetCoordY = targetY - 1;
                } else if (gunPosition === 4) {
                    // Gun 4: add 2 to X and change nothing to Y
                    targetCoordX = targetX + 2;
                    targetCoordY = targetY;
                }
                
                // Apply corrections to target coordinates
                const foDirRad = foDirDeg * Math.PI / 180;
                const xCorr = (addDrop/10);
                const yCorr = (leftRight/10);
                const correctedTargetX = targetCoordX + xCorr * Math.sin(foDirRad) + yCorr * Math.cos(foDirRad);
                const correctedTargetY = targetCoordY + xCorr * Math.cos(foDirRad) - yCorr * Math.sin(foDirRad);
                
                // Get section-specific altitude, shell, and rings for this gun
                const gunSection = getSectionForGun(i);
                const gunSectionAlt = getSectionAltitude(gunSection);
                const gunSectionShell = document.getElementById(`section-${gunSection}-shell-shift`).value;
                const gunSectionRings = parseInt(document.getElementById(`section-${gunSection}-rings-shift`).value);
                
                const solution = calculateSingleGunBallistics(
                    gunCoords.x, gunCoords.y, correctedTargetX, correctedTargetY, gunSectionAlt, targetAlt,
                    gunSectionShell, gunSectionRings, 0, 0, foDirDeg // Pass 0 for corrections to avoid double-correction
                );
                
                if (solution) {
                    gunSolutions.push({
                        gun: i - section.startIndex + 1, // Section-relative gun number (display purposes)
                        section: section.section,
                        azimuth: solution.azimuthCorr,
                        elevation: solution.elevationCorr,
                        tof: solution.tofCorr,
                        targetX: correctedTargetX,
                        targetY: correctedTargetY
                    });
                }
                globalGunIndex++;
            }
        }
    }

    // For all sheaf types, gun solutions are already corrected, so display them directly
    displayGunSolutions(gunSolutions, 'gun-solutions-content-shift');
    
    document.getElementById("fire-solution-guns-shift").style.display = 'block';
}

function resetShiftMission() {
    // Reset all input fields to empty
    const fieldsToReset = [
        'target-number-shift', 'amount-rounds-shift', 'target-alt-shift', 'fo-dir-shift',
        'shift-x', 'shift-y', 'add-drop-shift', 'left-right-shift',
        'sheaf-length-shift', 'sheaf-direction-shift', 'sheaf-diameter-shift'
    ];
    
    fieldsToReset.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.value = '';
        }
    });
    
    // Reset dropdowns to default values
    document.getElementById('known-point-select').value = '';
    document.getElementById('platform-shift').value = 'M252';
    document.getElementById('shell-shift').value = 'HE';
    document.getElementById('rings-shift').value = '0';
    document.getElementById('sheaf-type-shift').value = 'parallel';
    
    // Hide sheaf parameters
    document.getElementById('linear-sheaf-params-shift').style.display = 'none';
    document.getElementById('circular-sheaf-params-shift').style.display = 'none';
    
    // Hide results sections
    document.getElementById('base-results-shift').style.display = 'none';
    document.getElementById('corrected-results-shift').style.display = 'none';
    document.getElementById('fire-solution-guns-shift').style.display = 'none';
    
    // Save data and show feedback
    saveAllData();
    showSaveIndicator();
    
    // Show reset confirmation
    const resetBtn = event.target;
    const originalText = resetBtn.textContent;
    resetBtn.textContent = 'Reset Complete!';
    resetBtn.style.background = '#4CAF50';
    
    setTimeout(() => {
        resetBtn.textContent = originalText;
        resetBtn.style.background = '#ff9800';
    }, 2000);
}

// Function to calculate final target coordinates for each mission type
function calculateFinalTargetCoordinates(missionType) {
    console.log(`calculateFinalTargetCoordinates called for mission type: ${missionType}`);
    
    if (missionType === 'grid') {
        // For grid mission, target coordinates are directly available
        const targetX = parseFloat(document.getElementById("target-x").value);
        const targetY = parseFloat(document.getElementById("target-y").value);
        console.log(`Grid mission - Target coordinates: (${targetX}, ${targetY})`);
        return { x: targetX, y: targetY };
    } else if (missionType === 'polar') {
        // For polar mission, calculate from FO data
        const foX = parseFloat(document.getElementById("fo-x-polar").value);
        const foY = parseFloat(document.getElementById("fo-y-polar").value);
        const foDist = parseFloat(document.getElementById("fo-dist-polar").value);
        const foDirDeg = parseFloat(document.getElementById("fo-dir-polar").value) || 0;
        
        console.log(`Polar mission - FO data: X=${foX}, Y=${foY}, Dist=${foDist}, Dir=${foDirDeg}`);
        
        if (foX && foY && foDist && foDirDeg !== null && foDirDeg !== undefined) {
            const foDirRad = foDirDeg * Math.PI / 180;
            const scaledFoDist = foDist / 10; // Apply the same scaling as in calculations
            const targetX = foX + scaledFoDist * Math.sin(foDirRad);
            const targetY = foY + scaledFoDist * Math.cos(foDirRad);
            console.log(`Polar mission - Calculated target: (${targetX}, ${targetY})`);
            return { x: targetX, y: targetY };
        } else {
            console.log(`Polar mission - Missing FO data: foX=${foX}, foY=${foY}, foDist=${foDist}, foDirDeg=${foDirDeg}`);
        }
        return null;
    } else if (missionType === 'shift') {
        // For shift mission, get from selected known point and add shift values
        const knownPointSelect = document.getElementById("known-point-select");
        const selectedPointId = knownPointSelect ? knownPointSelect.value : null;
        const shiftX = parseFloat(document.getElementById("shift-x").value) || 0;
        const shiftY = parseFloat(document.getElementById("shift-y").value) || 0;
        
        console.log(`Shift mission - Selected point ID: ${selectedPointId}, Shift: (${shiftX}, ${shiftY})`);
        
        if (selectedPointId) {
            const knownPoints = JSON.parse(localStorage.getItem('knownPoints') || '[]');
            const point = knownPoints.find(p => p.id === selectedPointId);
            if (point) {
                // Calculate final target coordinates by adding shift to known point
                const finalX = parseFloat(point.x) + shiftX / 10; // Scale down by 10
                const finalY = parseFloat(point.y) + shiftY / 10; // Scale down by 10
                console.log(`Shift mission - Known point: (${point.x}, ${point.y}), Final target: (${finalX}, ${finalY})`);
                return { x: finalX, y: finalY };
            } else {
                console.log(`Shift mission - Point not found in known points`);
            }
        } else {
            console.log(`Shift mission - No point selected`);
        }
        return null;
    }
    return null;
}

// Function to trigger ring updates for all sections when calculate button is pressed
function triggerRingUpdatesForCalculation(missionType) {
    console.log(`Triggering ring updates for ${missionType} mission calculation`);
    const numSections = parseInt(document.getElementById('num-sections').value) || 1;
    for (let i = 1; i <= numSections; i++) {
        if (missionType === 'grid') {
            updateSectionRingsOptionsGrid(i);
        } else if (missionType === 'polar') {
            updateSectionRingsOptionsPolar(i);
        } else if (missionType === 'shift') {
            updateSectionRingsOptionsShift(i);
        }
    }
}




