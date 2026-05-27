/**
 * Mortar Ballistics Calculator - Platform Data & Active Settings
 *
 * Copyright (c) 2024 C-gamer_DX. All rights reserved.
 *
 * ===========================================================================
 *  HOW TO ADD A NEW FIRING PLATFORM
 * ===========================================================================
 *  1. Copy an existing platform object (e.g. PLATFORMS.M252) and rename it.
 *  2. Update `displayName` and add an <option> for it in index.html under
 *     every <select id="platform...">.
 *  3. Fill in `variants.vanilla.shells.<SHELL>.rings.<N>` with the firing
 *     table rows. Each row is an array:
 *         [range_m, elevation_mils, dElev_per_100m, TOF_sec, dTOF_per_100m]
 *     (dElev / dTOF are the per-100m altitude corrections used by the
 *     ballistics interpolator.)
 *  4. Set `rangeLimits.min` / `rangeLimits.max` to the inclusive shell range.
 *  5. If the shell cannot be fired at ring 0, set `allowsRingZero: false`.
 *
 * ===========================================================================
 *  HOW TO ADD A NEW SHELL TYPE
 * ===========================================================================
 *  1. Add a <option> for it in every <select id="section-N-shell-..."> in
 *     index.html (the section UI generator creates these dynamically; see
 *     updateMissionShellConfiguration in sections.js).
 *  2. Add the shell key under each platform's `variants.<variant>.shells`.
 *  3. The ring dropdown is data-driven: any ring numbers present as keys in
 *     `rings` will appear in the UI.
 *
 * ===========================================================================
 *  HOW TO ADD REALISTIC-MOD DATA
 * ===========================================================================
 *  Replace `variants.realistic = null` with the same `{shells: {...}}` shape
 *  as `variants.vanilla`. When the user toggles Realistic Mode ON the lookup
 *  falls back to vanilla for any platform/shell that is still `null`, so you
 *  can fill values in incrementally without breaking anything.
 * ===========================================================================
 */

const PLATFORMS = {
    M252: {
        id: 'M252',
        displayName: 'M252 (81mm Mortar)',
        // NATO convention: 6400 mils per full circle (1600 mils / quadrant).
        // Elevations in the firing tables below are NATO mils.
        milsPerCircle: 6400,
        variants: {
            vanilla: {
                shells: {
                    HE: {
                        rangeLimits: { min: 50, max: 2900 },
                        allowsRingZero: true,
                        rings: {
                            0: [
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
                        }
                    },
                    SMOKE: {
                        rangeLimits: { min: 100, max: 2400 },
                        allowsRingZero: false,
                        rings: {
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
                                [1400, 818, null, 18.0]
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
                                [2400, 871, 67, 25.8, 1.5]
                            ]
                        }
                    },
                    ILUM: {
                        rangeLimits: { min: 100, max: 2400 },
                        allowsRingZero: false,
                        rings: {
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
                                [1400, 900, 98, 20.5, 1.6]
                            ],
                            3: [
                                [300, 1521, 14, 31.1],
                                [400, 1494, 14, 31.1, 0, 1],
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
                                [1900, 875, 67, 24.1, 1.3]
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
                                [2400, 855, 52, 27.4, 1.1]
                            ]
                        }
                    },
                    PRACTICE: {
                        rangeLimits: { min: 50, max: 2900 },
                        allowsRingZero: true,
                        rings: {
                            0: [
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
                    }
                }
            },

            // PLACEHOLDER: Fill in firing tables from the realism mod.
            // While `null`, lookups transparently fall back to vanilla.
            realistic: null
        }
    },

    // Source: "2B14 VANILLA - M777.xlsx", sheets "2B14 82MM HE 0".."HE 4".
    // The accompanying SMOKE and ILUM sheets in that workbook are empty; add
    // them under `shells.SMOKE` / `shells.ILUM` when real values are available.
    '2B14': {
        id: '2B14',
        displayName: '2B14 (82mm Mortar)',
        // Soviet/Russian convention: 6000 mils per full circle (1500 mils /
        // quadrant). Elevations in the firing tables below are Russian mils
        // and the azimuth output uses the 6000-mil scale via Settings.
        milsPerCircle: 6000,
        variants: {
            vanilla: {
                shells: {
                    HE: {
                        rangeLimits: { min: 50, max: 2300 },
                        allowsRingZero: true,
                        // Per-ring dispersion (radius of probable impact, metres)
                        // from the spreadsheet's column F. Missing rings → unknown.
                        dispersionByRing: { 0: 13, 1: 21, 3: 44 },
                        rings: {
                            0: [
                                [50, 1455, 44, 15, null],
                                [100, 1411, 46, 15, 0.1],
                                [150, 1365, 47, 14.9, 0.1],
                                [200, 1318, 50, 14.8, 0.2],
                                [250, 1268, 51, 14.6, 0.2],
                                [300, 1217, 58, 14.4, 0.3],
                                [350, 1159, 64, 14.1, 0.4],
                                [400, 1095, 72, 13.7, 0.5],
                                [450, 1023, 101, 13.2, 0.8],
                                [500, 922, null, 12.4, null]
                            ],
                            1: [
                                [100, 1446, 27, 19.5, 0.1],
                                [200, 1392, 28, 19.4, 0.1],
                                [300, 1335, 29, 19.2, 0.1],
                                [400, 1275, 31, 18.9, 0.1],
                                [500, 1212, 35, 18.6, 0.2],
                                [600, 1141, 40, 18.1, 0.3],
                                [700, 1058, 48, 17.4, 0.4],
                                [800, 952, 81, 16.4, 0.9]
                            ],
                            2: [
                                [200, 1432, 17, 24.8, null],
                                [300, 1397, 18, 24.7, null],
                                [400, 1362, 18, 24.6, 0.1],
                                [500, 1325, 18, 24.4, 0.1],
                                [600, 1288, 20, 24.2, 0.1],
                                [700, 1248, 20, 24, 0.1],
                                [800, 1207, 22, 23.7, 0.2],
                                [900, 1162, 23, 23.3, 0.2],
                                [1000, 1114, 26, 22.9, 0.3],
                                [1100, 1060, 29, 22.3, 0.3],
                                [1200, 997, 37, 21.5, 0.4],
                                [1300, 914, 55, 20.4, 0.8],
                                [1400, 775, null, 17.8, null]
                            ],
                            3: [
                                [300, 1423, 13, 28.9, null],
                                [400, 1397, 14, 28.9, 0.1],
                                [500, 1370, 13, 28.8, 0.1],
                                [600, 1343, 14, 28.6, null],
                                [700, 1315, 14, 28.5, 0.1],
                                [800, 1286, 14, 28.3, 0.1],
                                [900, 1257, 16, 28.1, 0.1],
                                [1000, 1226, 16, 27.9, 0.2],
                                [1100, 1193, 16, 27.6, 0.2],
                                [1200, 1159, 18, 27.2, 0.2],
                                [1300, 1123, 19, 26.8, 0.2],
                                [1400, 1084, 22, 26.4, 0.3],
                                [1500, 1040, 24, 25.8, 0.3],
                                [1600, 991, 28, 25.1, 0.4],
                                [1700, 932, 36, 24.2, 0.6],
                                [1800, 851, 68, 22.8, 1.3]
                            ],
                            4: [
                                [400, 1418, 10, 32.9, null],
                                [500, 1398, 11, 32.9, 0.1],
                                [600, 1376, 10, 32.8, 0.1],
                                [700, 1355, 11, 32.7, 0.1],
                                [800, 1333, 11, 32.6, 0.1],
                                [900, 1311, 12, 32.4, 0.1],
                                [1000, 1288, 12, 32.2, null],
                                [1100, 1264, 12, 32.1, 0.1],
                                [1200, 1240, 13, 31.8, 0.1],
                                [1300, 1215, 13, 31.6, 0.1],
                                [1400, 1189, 14, 31.3, 0.1],
                                [1500, 1161, 14, 31, 0.1],
                                [1600, 1133, 15, 30.7, 0.2],
                                [1700, 1102, 16, 30.3, 0.2],
                                [1800, 1069, 17, 29.8, 0.2],
                                [1900, 1034, 19, 29.3, 0.3],
                                [2000, 995, 22, 28.7, 0.4],
                                [2100, 950, 26, 27.9, 0.5],
                                [2200, 896, 34, 26.9, 0.7],
                                [2300, 820, 65, 25.3, 1.4]
                            ]
                        }
                    }
                    // PLACEHOLDER: SMOKE and ILUM data not yet provided.
                }
            },
            realistic: null
        }
    },

    // Source: "2B14 VANILLA - M777.xlsx", sheets "M777 155M 1".."M777 155M 5".
    // Note: in sheet "M777 155M 5" the dElev and dTOF columns appear swapped
    // relative to rings 1-4 (column C holds 0.1-0.6 values and column E holds
    // 7-20 values). They are stored here in the canonical
    // [range, elevation, dElev, TOF, dTOF] order — i.e. with the swap applied.
    // A handful of obvious spreadsheet typos are preserved verbatim per user
    // instruction (e.g. ring 5 / 4900m elev = 641, ring 4 / 3500m TOF = 4.5,
    // ring 2 / 1700m elev = 1241, ring 2 / 2000m TOF = 32.1).
    M777: {
        id: 'M777',
        displayName: 'M777 (155mm Howitzer)',
        milsPerCircle: 6400,  // NATO
        variants: {
            vanilla: {
                shells: {
                    HE: {
                        rangeLimits: { min: 950, max: 5300 },
                        allowsRingZero: false,
                        dispersionByRing: { 1: 69, 3: 69, 5: 69 },
                        rings: {
                            1: [
                                [950, 1245, 24, 24.4, 0.2],
                                [1000, 1221, 24, 24.2, 0.2],
                                [1050, 1197, 26, 24, 0.3],
                                [1100, 1171, 27, 23.7, 0.3],
                                [1150, 1144, 29, 23.4, 0.3],
                                [1200, 1115, 31, 23.1, 0.4],
                                [1250, 1084, 34, 22.7, 0.4],
                                [1300, 1050, 39, 22.3, 0.5],
                                [1350, 1011, 46, 21.8, 0.6],
                                [1400, 965, 58, 21.2, 0.9],
                                [1450, 907, 107, 20.3, 1.7],
                                [1500, 800, null, 18.6, null]
                            ],
                            2: [
                                [1500, 1270, 13, 33.1, 0.1],
                                [1550, 1257, 14, 33, 0.1],
                                [1600, 1243, 14, 32.9, 0.2],
                                [1650, 1229, 15, 32.7, 0.2],
                                [1700, 1241, 14, 32.5, 0.1],   // spreadsheet anomaly preserved
                                [1750, 1200, 15, 32.4, 0.3],
                                [1800, 1185, 16, 32.1, 0.2],
                                [1850, 1169, 16, 31.9, 0.2],
                                [1900, 1153, 17, 31.7, 0.2],
                                [1950, 1136, 17, 31.5, 0.3],
                                [2000, 1119, 18, 32.1, 0.2],   // spreadsheet anomaly preserved
                                [2050, 1101, 19, 31, 0.3],
                                [2100, 1082, 20, 30.7, 0.4],
                                [2150, 1062, 21, 30.3, 0.3],
                                [2200, 1041, 23, 30, 0.4],
                                [2250, 1018, 23, 29.6, 0.4],
                                [2300, 995, 28, 29.2, 0.5],
                                [2350, 967, 29, 28.7, 0.6],
                                [2400, 938, 34, 28.1, 0.6],
                                [2450, 904, 44, 27.5, 1],
                                [2500, 860, null, 26.5, null]
                            ],
                            3: [
                                [2100, 1272, 10, 41, 0.1],
                                [2200, 1253, 10, 40.8, 0.2],
                                [2300, 1233, 10, 40.5, 0.2],
                                [2400, 1213, 11, 40.2, 0.2],
                                [2500, 1192, 11, 39.9, 0.2],
                                [2600, 1170, 12, 39.5, 0.2],
                                [2700, 1147, 12, 39.1, 0.2],
                                [2800, 1123, 13, 38.7, 0.2],
                                [2900, 1098, 14, 38.3, 0.3],
                                [3000, 1070, 14, 37.7, 0.2],
                                [3100, 1042, 16, 37.2, 0.4],
                                [3200, 1010, 16, 36.5, 0.3],
                                [3300, 975, 18, 35.7, 0.4],
                                [3400, 936, 22, 34.9, 0.6],
                                [3500, 890, 28, 33.7, 0.7],
                                [3600, 828, null, 32.1, null]
                            ],
                            4: [
                                [2600, 1271, 8, 47.2, 0.1],
                                [2700, 1255, 7, 47, 0.2],
                                [2800, 1240, 8, 46.7, 0.1],
                                [2900, 1224, 9, 46.5, 0.2],
                                [3000, 1207, 9, 46.2, 0.2],
                                [3100, 1190, 9, 45.9, 0.2],
                                [3200, 1172, 9, 45.6, 0.2],
                                [3300, 1154, 9, 45.2, 0.2],
                                [3400, 1135, 9, 44.9, 0.2],
                                [3500, 1116, 10, 4.5, 0.2],    // spreadsheet anomaly preserved (TOF likely 44.5)
                                [3600, 1095, 10, 44, 0.2],
                                [3700, 1074, 11, 43.6, 0.3],
                                [3800, 1052, 12, 43.1, 0.3],
                                [3900, 1028, 12, 42.5, 0.3],
                                [4000, 1003, 14, 41.9, 0.3],
                                [4100, 976, 15, 41.3, 0.4],
                                [4200, 946, 17, 40.5, 0.5],
                                [4300, 912, 17, 39.6, 0.5],
                                [4400, 874, 20, 38.5, 0.5],
                                [4500, 828, 26, 37.2, 0.8]
                            ],
                            // Ring 5: spreadsheet columns C and E were swapped
                            // (see header note above). Stored here with the
                            // swap applied → dElev from spreadsheet col E.
                            5: [
                                [3000, 1271, 7, 52.2, 0.1],
                                [3100, 1258, 7, 52, 0.1],
                                [3200, 1244, 7, 51.8, 0.1],
                                [3300, 1230, 7, 51.5, 0.1],
                                [3400, 1216, 7, 51.3, 0.2],
                                [3500, 1202, 7, 51, 0.1],
                                [3600, 1187, 7, 50.7, 0.1],
                                [3700, 1172, 8, 50.4, 0.1],
                                [3800, 1156, 7, 50.1, 0.2],
                                [3900, 1140, 8, 49.8, 0.2],
                                [4000, 1124, 9, 49.4, 0.2],
                                [4100, 1107, 9, 49, 0.2],
                                [4200, 1089, 9, 48.6, 0.2],
                                [4300, 1071, 9, 48.2, 0.2],
                                [4400, 1052, 10, 47.7, 0.2],
                                [4500, 1032, 10, 47.2, 0.2],
                                [4600, 1011, 10, 46.7, 0.3],
                                [4700, 989, 11, 46.1, 0.3],
                                [4800, 966, 12, 45.5, 0.4],
                                [4900, 641, 13, 44.7, 0.3],    // spreadsheet anomaly preserved (elev likely ~941)
                                [5000, 913, 14, 44, 0.5],
                                [5100, 883, 16, 43.1, 0.5],
                                [5200, 850, 20, 42, 0.6],
                                [5300, 809, null, 40.7, null]
                            ]
                        }
                    }
                }
            },
            realistic: null
        }
    },

    // PLACEHOLDER: Example of another platform. Fill in firing tables to
    // activate. The HTML platform dropdown already exposes M119 as an option;
    // until tables are provided, M119 calculations will return null and the
    // mission validator will warn the user.
    M119: {
        id: 'M119',
        displayName: 'M119 (105mm Howitzer)',
        milsPerCircle: 6400,  // NATO
        variants: {
            vanilla: null,
            realistic: null
        }
    }
};


/**
 * Settings — the single source of truth for the active platform and mod
 * variant. The platform dropdowns on the three mission pages drive this
 * lookup; the realistic-mode toggle on the home page flips `realistic`.
 */
const Settings = {
    realistic: false,

    init() {
        this.realistic = localStorage.getItem('realisticMode') === 'true';
        this.syncToggleButton();
    },

    toggleRealistic() {
        this.realistic = !this.realistic;
        localStorage.setItem('realisticMode', String(this.realistic));
        this.syncToggleButton();
    },

    syncToggleButton() {
        const btn = document.getElementById('realistic-toggle');
        if (btn) {
            btn.classList.toggle('active', this.realistic);
            btn.textContent = this.realistic ? 'Mod: Adult Mortars (ON)' : 'Mod: Adult Mortars (OFF)';
            btn.setAttribute('aria-pressed', String(this.realistic));
        }
        // Mirror to the Settings page checkbox (if it's currently in DOM).
        const checkbox = document.getElementById('pref-adult-mortars');
        if (checkbox) checkbox.checked = this.realistic;
    },

    /**
     * Which platform select drives this mission. Grid uses `platform`, polar
     * uses `platform-polar`, shift uses `platform-shift`.
     */
    getActivePlatformId(missionType) {
        const suffix = missionType === 'grid' ? '' : '-' + missionType;
        const select = document.getElementById('platform' + suffix);
        return select ? select.value : 'M252';
    },

    /**
     * Resolve a shell definition for the active platform/variant. Falls back
     * to vanilla when the requested variant is `null` (placeholder).
     */
    resolveShell(missionType, shell) {
        const platform = PLATFORMS[this.getActivePlatformId(missionType)];
        if (!platform) return null;

        const wanted = this.realistic ? 'realistic' : 'vanilla';
        const variant = platform.variants[wanted] || platform.variants.vanilla;
        if (!variant) return null;

        return variant.shells[shell] || null;
    },

    getShellTable(missionType, shell, rings) {
        const shellData = this.resolveShell(missionType, shell);
        if (!shellData) return null;
        const table = shellData.rings[rings];
        return Array.isArray(table) ? table : null;
    },

    getRangeLimits(missionType, shell) {
        const shellData = this.resolveShell(missionType, shell);
        return shellData ? shellData.rangeLimits : null;
    },

    getAvailableRings(missionType, shell) {
        const shellData = this.resolveShell(missionType, shell);
        if (!shellData) return [];
        return Object.keys(shellData.rings).map(Number).sort((a, b) => a - b);
    },

    /** Shell type ids ('HE', 'SMOKE', ...) the active platform/variant actually defines. */
    getAvailableShells(missionType) {
        const platform = PLATFORMS[this.getActivePlatformId(missionType)];
        if (!platform) return [];
        const wanted = this.realistic ? 'realistic' : 'vanilla';
        const variant = platform.variants[wanted] || platform.variants.vanilla;
        if (!variant) return [];
        return Object.keys(variant.shells);
    },

    /**
     * Mils per full circle for the active platform. NATO = 6400, Soviet
     * doctrine = 6000. Defaults to NATO when a platform omits the property.
     */
    getMilsPerCircle(missionType) {
        const platform = PLATFORMS[this.getActivePlatformId(missionType)];
        return (platform && platform.milsPerCircle) || 6400;
    },

    /**
     * Per-ring dispersion (impact radius, metres) for the active shell, or
     * null if the spreadsheet didn't include it for this ring.
     */
    getDispersion(missionType, shell, rings) {
        const shellData = this.resolveShell(missionType, shell);
        if (!shellData || !shellData.dispersionByRing) return null;
        const v = shellData.dispersionByRing[rings];
        return (typeof v === 'number') ? v : null;
    }
};
