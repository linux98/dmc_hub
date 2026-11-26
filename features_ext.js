/**
 * DMC Hub - Enterprise Feature Extensions
 * Includes:
 * 1. Interactive GIS Spatial Intelligence Map (Leaflet.js)
 * 2. What-If Policy Sandbox & Scenario Simulator
 * 3. Strategic Early Warning Radar (4D Anomaly Detector)
 * 4. Executive Speech Synthesizer with Passcode Gate (PIN = 6547)
 * 5. PWA & Navigation Integration
 */

(function () {
  'use strict';

  // Wait for DOM to be fully loaded
  document.addEventListener('DOMContentLoaded', () => {
    initGisMap();
    initPolicySandbox();
    initEarlyWarningRadar();
    initExecutiveSpeechModule();
    initLongitudinalModule();
    initCohortModule();
    initHealthIndexModule();
    initCommandPaletteModule();
    initOnePagerModule();
    initGisSynergyModule();
    initAiCopilotModule();
    initSidebarNavigation();
    initInspectionRoutePlanner();
  });

  /* ==========================================================================
     MODULE 1: INTERACTIVE GIS SPATIAL MAP (LEAFLET.JS)
     ========================================================================== */
  let gisMap = null;
  let schoolMarkers = [];
  let buffer5Layers = [];
  let buffer10Layers = [];
  let showBuffer5 = false;
  let showBuffer10 = false;
  let activeSizeFilter = 'ALL';
  let activeClusterFilter = 'ALL';

  function initGisMap() {
    const mapContainer = document.getElementById('schoolGisMap');
    if (!mapContainer || typeof L === 'undefined') return;

    // Provincial geographic center of Sakon Nakhon [17.3000, 103.8800]
    const SAKON_CENTER = [17.3000, 103.8800];
    gisMap = L.map('schoolGisMap', {
      center: SAKON_CENTER,
      zoom: 9,
      zoomControl: true,
      scrollWheelZoom: true
    });

    // Clean OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; OpenStreetMap contributors | สพม.สกลนคร DMC Hub'
    }).addTo(gisMap);

    window.gisMap = gisMap;

    // Hoisted Map Resize & Invalidation function
    function forceMapResize() {
      if (gisMap) {
        gisMap.invalidateSize();
      }
    }
    window.forceMapResize = forceMapResize;

    renderGisMarkers();
    window.schoolMarkers = schoolMarkers;
    window.getSchoolMarkers = () => schoolMarkers;
    setupGisEvents();

    // ------------------------------------------------------------------------
    // Automatic Resizing & Invalidation (Eliminates Grey Area on wide screens)
    // ------------------------------------------------------------------------
    // 1. Initial delayed passes for DOM layout, web fonts and flex settlement
    setTimeout(forceMapResize, 100);
    setTimeout(forceMapResize, 300);
    setTimeout(forceMapResize, 700);
    setTimeout(forceMapResize, 1500);

    // 2. Continuous ResizeObserver: monitors any change to map container dimensions
    if (window.ResizeObserver && mapContainer) {
      const resizeObserver = new ResizeObserver(() => {
        forceMapResize();
      });
      resizeObserver.observe(mapContainer);
      const appMain = document.querySelector('.main-content') || document.querySelector('.content-area');
      if (appMain) resizeObserver.observe(appMain);
    }

    // 3. IntersectionObserver: instantly invalidates size when scrolled into viewport
    if (window.IntersectionObserver) {
      const intersectObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            forceMapResize();
          }
        });
      }, { threshold: 0.05 });
      intersectObserver.observe(mapContainer);
    }

    // 4. Global window resize & custom orientation/sidebar events
    window.addEventListener('resize', forceMapResize);
    window.addEventListener('orientationchange', () => setTimeout(forceMapResize, 300));
    mapContainer.addEventListener('mouseenter', forceMapResize, { passive: true });
  }

  function getSchoolSize(totalStudents) {
    if (totalStudents >= 1680) return 'XL';
    if (totalStudents >= 720) return 'L';
    if (totalStudents >= 120) return 'M';
    return 'S';
  }

  function renderGisMarkers() {
    if (!gisMap || typeof DASHBOARD_DATA === 'undefined') return;

    // Clear existing layers
    schoolMarkers.forEach(m => gisMap.removeLayer(m));
    buffer5Layers.forEach(b => gisMap.removeLayer(b));
    buffer10Layers.forEach(b => gisMap.removeLayer(b));
    schoolMarkers = [];
    buffer5Layers = [];
    buffer10Layers = [];

    const coordsMap = typeof SCHOOL_COORDINATES !== 'undefined' ? SCHOOL_COORDINATES : {};
    const clusterColors = typeof CLUSTER_METADATA !== 'undefined' ? CLUSTER_METADATA : {};
    const sizeColors = typeof SIZE_COLORS !== 'undefined' ? SIZE_COLORS : {
      XL: '#1e3a8a', L: '#059669', M: '#d97706', S: '#7c3aed'
    };

    DASHBOARD_DATA.forEach(school => {
      const coords = coordsMap[school.name];
      if (!coords) return;

      const total69_2 = school.y69_2 ? school.y69_2.total.total : 0;
      const rooms69_2 = school.y69_2 ? school.y69_2.total.rooms : 0;
      const mTon = school.y69_2 ? (school.y69_2.grades['ม1'].total + school.y69_2.grades['ม2'].total + school.y69_2.grades['ม3'].total) : 0;
      const mPlai = school.y69_2 ? (school.y69_2.grades['ม4'].total + school.y69_2.grades['ม5'].total + school.y69_2.grades['ม6'].total) : 0;
      const density = rooms69_2 > 0 ? (total69_2 / rooms69_2).toFixed(1) : '0';
      const grant = (mTon * 3800) + (mPlai * 4300);
      const size = getSchoolSize(total69_2);

      // Apply Filters
      if (activeSizeFilter !== 'ALL' && size !== activeSizeFilter) return;
      if (activeClusterFilter !== 'ALL' && school.cluster !== activeClusterFilter) return;

      const markerColor = sizeColors[size] || '#1e3a8a';
      const markerRadius = size === 'XL' ? 14 : size === 'L' ? 11 : size === 'M' ? 8 : 6;

      // Circle Marker
      const marker = L.circleMarker([coords.lat, coords.lng], {
        radius: markerRadius,
        fillColor: markerColor,
        color: '#ffffff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.88
      });

      // Tooltip
      marker.bindTooltip(`<strong>${school.name}</strong><br>ขนาด ${size} (${total69_2.toLocaleString()} คน)`, {
        direction: 'top',
        className: 'gis-tooltip'
      });

      // Rich Popup
      const projBadge = school.project ? `
        <span class="school-popup-tag" style="background: #fef3c7; color: #92400e; border: 1px solid #fde68a; padding: 2px 7px; border-radius: 4px; font-weight: 600; font-size: 10.5px;">
          🏅 ${school.project}
        </span>
      ` : '';

      const contactRow = `
        <div style="margin-top: 6px; padding-top: 6px; border-top: 1px dashed #e2e8f0; font-size: 11.5px; color: #475569; display: flex; flex-direction: column; gap: 3px;">
          <div>📍 ต.${school.tambon || ''} อ.${school.amphoe} ${school.distanceKm ? `(ห่าง สพท. <strong>${school.distanceKm} กม.</strong>)` : ''}</div>
          <div style="display: flex; gap: 6px; align-items: center; margin-top: 3px; flex-wrap: wrap;">
            ${school.tel ? `<a href="tel:${school.tel}" style="color: #1e3a8a; background: #e0e7ff; padding: 2px 6px; border-radius: 4px; text-decoration: none; font-weight: 600; font-size: 11px;">📞 ${school.tel}</a>` : ''}
            ${school.website ? `<a href="${school.website}" target="_blank" rel="noopener" style="color: #047857; background: #d1fae5; padding: 2px 6px; border-radius: 4px; text-decoration: none; font-weight: 600; font-size: 11px;">🌐 เว็บไซต์ รร.</a>` : ''}
          </div>
        </div>
      `;

      const popupHTML = `
        <div class="school-popup-card">
          <h4>${school.name}</h4>
          <div style="display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 6px; align-items: center;">
            <span class="school-popup-badge" style="background:${markerColor}15; color:${markerColor}; border:1px solid ${markerColor}40;">
              ขนาด ${size} • ${school.cluster}
            </span>
            ${projBadge}
          </div>
          <div class="school-popup-grid">
            <div><strong>นักเรียนรวม:</strong> ${total69_2.toLocaleString()} คน</div>
            <div><strong>ห้องเรียน:</strong> ${rooms69_2} ห้อง (${density}/ห้อง)</div>
            <div><strong>ม.ต้น:</strong> ${mTon.toLocaleString()} คน</div>
            <div><strong>ม.ปลาย:</strong> ${mPlai.toLocaleString()} คน</div>
            <div style="grid-column: span 2;"><strong>งบประมาณรายหัวจำลอง:</strong> ${(grant / 1e6).toFixed(2)} ล้านบาท</div>
          </div>
          ${contactRow}
          <button class="school-popup-btn" style="margin-top: 8px;" onclick="window.openSchoolDetailModal && window.openSchoolDetailModal('${school.id}')">
            🔍 เปิดแฟ้มประวัติ 360° (Dossier)
          </button>
        </div>
      `;
      marker.bindPopup(popupHTML);
      marker.addTo(gisMap);
      schoolMarkers.push(marker);

      // Buffer 5km
      const buf5 = L.circle([coords.lat, coords.lng], {
        radius: 5000,
        color: '#0284c7',
        fillColor: '#38bdf8',
        fillOpacity: 0.06,
        weight: 1,
        dashArray: '3, 4'
      });
      buffer5Layers.push(buf5);
      if (showBuffer5) buf5.addTo(gisMap);

      // Buffer 10km
      const buf10 = L.circle([coords.lat, coords.lng], {
        radius: 10000,
        color: '#6366f1',
        fillColor: '#818cf8',
        fillOpacity: 0.03,
        weight: 1,
        dashArray: '4, 6'
      });
      buffer10Layers.push(buf10);
      if (showBuffer10) buf10.addTo(gisMap);
    });
  }

  function setupGisEvents() {
    // Cluster Select
    const clusterSel = document.getElementById('gisClusterSelect');
    if (clusterSel) {
      clusterSel.addEventListener('change', (e) => {
        activeClusterFilter = e.target.value;
        renderGisMarkers();
      });
    }

    // Size Filter Buttons
    const sizeBtns = document.querySelectorAll('.gis-filter-btn[data-size]');
    sizeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        sizeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeSizeFilter = btn.getAttribute('data-size');
        renderGisMarkers();
      });
    });

    // Buffer 5km Toggle
    const btnBuf5 = document.getElementById('btnToggleBuffer5');
    if (btnBuf5) {
      btnBuf5.addEventListener('click', () => {
        showBuffer5 = !showBuffer5;
        btnBuf5.classList.toggle('active', showBuffer5);
        btnBuf5.style.background = showBuffer5 ? '#0284c7' : '#ffffff';
        btnBuf5.style.color = showBuffer5 ? '#ffffff' : '#334155';
        buffer5Layers.forEach(l => showBuffer5 ? l.addTo(gisMap) : gisMap.removeLayer(l));
      });
    }

    // Buffer 10km Toggle
    const btnBuf10 = document.getElementById('btnToggleBuffer10');
    if (btnBuf10) {
      btnBuf10.addEventListener('click', () => {
        showBuffer10 = !showBuffer10;
        btnBuf10.classList.toggle('active', showBuffer10);
        btnBuf10.style.background = showBuffer10 ? '#6366f1' : '#ffffff';
        btnBuf10.style.color = showBuffer10 ? '#ffffff' : '#334155';
        buffer10Layers.forEach(l => showBuffer10 ? l.addTo(gisMap) : gisMap.removeLayer(l));
      });
    }

    // Reset Map View
    const btnResetMap = document.getElementById('btnResetMapView');
    if (btnResetMap) {
      btnResetMap.addEventListener('click', () => {
        activeSizeFilter = 'ALL';
        activeClusterFilter = 'ALL';
        showBuffer5 = false;
        showBuffer10 = false;
        if (clusterSel) clusterSel.value = 'ALL';
        sizeBtns.forEach(b => b.classList.toggle('active', b.getAttribute('data-size') === 'ALL'));
        if (btnBuf5) {
          btnBuf5.classList.remove('active');
          btnBuf5.style.background = '#ffffff';
          btnBuf5.style.color = '#334155';
        }
        if (btnBuf10) {
          btnBuf10.classList.remove('active');
          btnBuf10.style.background = '#ffffff';
          btnBuf10.style.color = '#334155';
        }
        renderGisMarkers();
        if (gisMap) {
          gisMap.invalidateSize();
          gisMap.setView([17.3000, 103.8800], 9);
        }
      });
    }
  }

  /* ==========================================================================
     MODULE 2: WHAT-IF POLICY SANDBOX & SCENARIO SIMULATOR
     ========================================================================== */
  function initPolicySandbox() {
    const sliderClassSize = document.getElementById('sliderClassSize');
    const sliderIntakeGrowth = document.getElementById('sliderIntakeGrowth');
    const sliderSmallThreshold = document.getElementById('sliderSmallThreshold');
    const btnResetSandbox = document.getElementById('btnResetSandbox');

    if (!sliderClassSize || !sliderIntakeGrowth || !sliderSmallThreshold) return;

    function runSimulation() {
      if (typeof DASHBOARD_DATA === 'undefined') return;

      const targetSize = parseInt(sliderClassSize.value, 10);
      const intakeGrowth = parseInt(sliderIntakeGrowth.value, 10);
      const smallThresh = parseInt(sliderSmallThreshold.value, 10);
      const intakeFactor = 1 + (intakeGrowth / 100);

      // Update badge labels
      document.getElementById('sliderValClassSize').textContent = `${targetSize} คน/ห้อง`;
      document.getElementById('sliderValIntakeGrowth').textContent = `${intakeGrowth > 0 ? '+' : ''}${intakeGrowth}% ${intakeGrowth === 0 ? '(คงที่)' : ''}`;
      document.getElementById('sliderValSmallThreshold').textContent = `< ${smallThresh} คน`;

      let totalSimStudents = 0;
      let totalSimRooms = 0;
      let totalSimGrant = 0;
      const focusSchools = [];

      DASHBOARD_DATA.forEach(school => {
        if (!school.y69_2) return;
        const g = school.y69_2.grades;
        const simM1 = Math.round(g['ม1'].total * intakeFactor);
        const simM4 = Math.round(g['ม4'].total * intakeFactor);
        const simM_Ton = simM1 + g['ม2'].total + g['ม3'].total;
        const simM_Plai = simM4 + g['ม5'].total + g['ม6'].total;
        const schoolTotal = simM_Ton + simM_Plai;

        const schoolRooms = Math.ceil(schoolTotal / targetSize);
        const schoolGrant = (simM_Ton * 3800) + (simM_Plai * 4300);

        totalSimStudents += schoolTotal;
        totalSimRooms += schoolRooms;
        totalSimGrant += schoolGrant;

        if (schoolTotal < smallThresh) {
          focusSchools.push({ name: school.name, count: schoolTotal });
        }
      });

      const BASE_ROOMS = 1392;
      const BASE_GRANT_MILLION = 179.63;
      const diffRooms = totalSimRooms - BASE_ROOMS;
      const simGrantMillion = totalSimGrant / 1e6;
      const diffGrant = simGrantMillion - BASE_GRANT_MILLION;

      // Update Result Cards
      const kpiRooms = document.getElementById('sandboxKpiRooms');
      const kpiRoomsDiff = document.getElementById('sandboxKpiRoomsDiff');
      const kpiGrant = document.getElementById('sandboxKpiGrant');
      const kpiGrantDiff = document.getElementById('sandboxKpiGrantDiff');
      const kpiStudents = document.getElementById('sandboxKpiStudents');
      const kpiStudentsDiff = document.getElementById('sandboxKpiStudentsDiff');
      const kpiFocusCount = document.getElementById('sandboxKpiFocusCount');
      const kpiFocusList = document.getElementById('sandboxKpiFocusList');

      if (kpiRooms) kpiRooms.textContent = `${totalSimRooms.toLocaleString()} ห้อง`;
      if (kpiRoomsDiff) {
        kpiRoomsDiff.textContent = `เทียบฐานเดิม (1,392): ${diffRooms > 0 ? '+' : ''}${diffRooms.toLocaleString()} ห้อง`;
        kpiRoomsDiff.style.color = diffRooms > 0 ? '#b91c1c' : diffRooms < 0 ? '#059669' : '#64748b';
      }

      if (kpiGrant) kpiGrant.textContent = `${simGrantMillion.toFixed(2)} ล้านบาท`;
      if (kpiGrantDiff) {
        kpiGrantDiff.textContent = `เทียบฐานเดิม (179.63): ${diffGrant > 0 ? '+' : ''}${diffGrant.toFixed(2)} ล้านบาท`;
        kpiGrantDiff.style.color = diffGrant >= 0 ? '#059669' : '#b91c1c';
      }

      if (kpiStudents) kpiStudents.textContent = `${totalSimStudents.toLocaleString()} คน`;
      if (kpiStudentsDiff) {
        const avgDensity = totalSimRooms > 0 ? (totalSimStudents / totalSimRooms).toFixed(1) : '0';
        kpiStudentsDiff.textContent = `ความหนาแน่นเฉลี่ย: ${avgDensity} คน/ห้อง`;
      }

      if (kpiFocusCount) kpiFocusCount.textContent = `${focusSchools.length} โรงเรียน`;
      if (kpiFocusList) {
        const names = focusSchools.slice(0, 3).map(s => s.name).join(', ');
        kpiFocusList.textContent = focusSchools.length > 3 ? `${names} +${focusSchools.length - 3} แห่ง` : (names || 'ไม่มี');
      }
    }

    sliderClassSize.addEventListener('input', runSimulation);
    sliderIntakeGrowth.addEventListener('input', runSimulation);
    sliderSmallThreshold.addEventListener('input', runSimulation);

    if (btnResetSandbox) {
      btnResetSandbox.addEventListener('click', () => {
        sliderClassSize.value = 32;
        sliderIntakeGrowth.value = 0;
        sliderSmallThreshold.value = 150;
        runSimulation();
      });
    }

    // Initial run
    runSimulation();
  }

  /* ==========================================================================
     MODULE 3: STRATEGIC EARLY WARNING RADAR
     ========================================================================== */
  function initEarlyWarningRadar() {
    if (typeof DASHBOARD_DATA === 'undefined') return;

    const redList = document.getElementById('radarRedList');
    const yellowList = document.getElementById('radarYellowList');
    const orangeList = document.getElementById('radarOrangeList');
    const blueList = document.getElementById('radarBlueList');

    const redItems = [];
    const yellowItems = [];
    const orangeItems = [];
    const blueItems = [];

    DASHBOARD_DATA.forEach(school => {
      const s69_1 = school.y69_1 ? school.y69_1.total.total : 0;
      const s69_2 = school.y69_2 ? school.y69_2.total.total : 0;
      const rooms = school.y69_2 ? school.y69_2.total.rooms : 0;
      const density = rooms > 0 ? (s69_2 / rooms) : 0;

      // 1. Red Alert: Drop > 8 or Retention < 98.8%
      const diff = s69_1 - s69_2;
      const retRate = s69_1 > 0 ? (s69_2 / s69_1) * 100 : 100;
      if (diff >= 8 || (retRate < 98.8 && diff > 3)) {
        redItems.push({ id: school.id, name: school.name, diff, retRate: retRate.toFixed(2) });
      }

      // 2. Yellow Alert: Density > 35.5 students/room
      if (density >= 35.5) {
        yellowItems.push({ id: school.id, name: school.name, density: density.toFixed(1), rooms });
      }

      // 3. Orange Alert: Small schools < 150 students
      if (s69_2 < 150) {
        orangeItems.push({ id: school.id, name: school.name, count: s69_2 });
      }

      // 4. Blue Alert: Transition Gap (M.ปลาย / M.ต้น < 0.60)
      if (school.y69_2) {
        const g = school.y69_2.grades;
        const mTon = g['ม1'].total + g['ม2'].total + g['ม3'].total;
        const mPlai = g['ม4'].total + g['ม5'].total + g['ม6'].total;
        const ratio = mTon > 0 ? (mPlai / mTon) : 1;
        if (ratio < 0.60 && mTon > 60) {
          blueItems.push({ id: school.id, name: school.name, ratio: (ratio * 100).toFixed(0), mTon, mPlai });
        }
      }
    });

    // Update Counts
    const redCount = document.getElementById('radarRedCount');
    const yellowCount = document.getElementById('radarYellowCount');
    const orangeCount = document.getElementById('radarOrangeCount');
    const blueCount = document.getElementById('radarBlueCount');

    if (redCount) redCount.textContent = `${redItems.length} ร.ร.`;
    if (yellowCount) yellowCount.textContent = `${yellowItems.length} ร.ร.`;
    if (orangeCount) orangeCount.textContent = `${orangeItems.length} ร.ร.`;
    if (blueCount) blueCount.textContent = `${blueItems.length} ร.ร.`;

    // Render Lists
    if (redList) {
      redList.innerHTML = redItems.map(item => `
        <div class="radar-item" onclick="window.openSchoolDetailModal && window.openSchoolDetailModal('${item.id}')">
          <span><strong>${item.name}</strong></span>
          <span style="color:#b91c1c; font-weight:700;">-${item.diff} คน (${item.retRate}%)</span>
        </div>
      `).join('') || '<div style="color:#94a3b8; font-size:12px; padding:6px;">ไม่มีสถานศึกษาผิดปกติ</div>';
    }

    if (yellowList) {
      yellowList.innerHTML = yellowItems.map(item => `
        <div class="radar-item" onclick="window.openSchoolDetailModal && window.openSchoolDetailModal('${item.id}')">
          <span><strong>${item.name}</strong></span>
          <span style="color:#b45309; font-weight:700;">${item.density} คน/ห้อง (${item.rooms} ห้อง)</span>
        </div>
      `).join('') || '<div style="color:#94a3b8; font-size:12px; padding:6px;">ไม่มีสถานศึกษาแออัดเกินเกณฑ์</div>';
    }

    if (orangeList) {
      orangeList.innerHTML = orangeItems.map(item => `
        <div class="radar-item" onclick="window.openSchoolDetailModal && window.openSchoolDetailModal('${item.id}')">
          <span><strong>${item.name}</strong></span>
          <span style="color:#c2410c; font-weight:700;">${item.count} คน</span>
        </div>
      `).join('') || '<div style="color:#94a3b8; font-size:12px; padding:6px;">ไม่มีสถานศึกษาต่ำกว่าเกณฑ์</div>';
    }

    if (blueList) {
      blueList.innerHTML = blueItems.map(item => `
        <div class="radar-item" onclick="window.openSchoolDetailModal && window.openSchoolDetailModal('${item.id}')">
          <span><strong>${item.name}</strong></span>
          <span style="color:#1d4ed8; font-weight:700;">ปลาย/ต้น ${item.ratio}% (${item.mPlai}/${item.mTon})</span>
        </div>
      `).join('') || '<div style="color:#94a3b8; font-size:12px; padding:6px;">สัดส่วนต่อเนื่องปกติทุกแห่ง</div>';
    }
  }

  /* ==========================================================================
     MODULE 4: EXECUTIVE SPEECH SYNTHESIZER WITH PASSCODE GATE (PIN = 6547)
     ========================================================================== */
  const EXECUTIVE_PASSCODE = '6547';
  let currentSpeechContext = 'board';

  function initExecutiveSpeechModule() {
    const btnOpenSpeech = document.getElementById('openExecutiveSpeechBtn');
    const menuSpeechGen = document.getElementById('menuSpeechGen');
    const authModal = document.getElementById('executiveSpeechAuthModal');
    const speechModal = document.getElementById('executiveSpeechModal');
    const pinInput = document.getElementById('executivePinInput');
    const btnSubmitPin = document.getElementById('btnSubmitPin');
    const btnCancelPin = document.getElementById('btnCancelPin');
    const pinErrorMsg = document.getElementById('pinErrorMsg');
    const cardElement = document.getElementById('securityGateCard');
    const btnCloseSpeechModal = document.getElementById('btnCloseSpeechModal');
    const btnCopySpeechBtn = document.getElementById('btnCopySpeechBtn');
    const btnPrintSpeechBtn = document.getElementById('btnPrintSpeechBtn');

    // Always clear any stored tokens on page load
    try {
      sessionStorage.removeItem('dmc_executive_auth_token');
      localStorage.removeItem('dmc_executive_auth_token');
    } catch(e) {}

    // ALWAYS prompt for passcode every single time! Never cache!
    function checkAuthAndOpen() {
      openAuthModal();
    }
    window.openExecutiveSpeechModal = checkAuthAndOpen;

    function openAuthModal() {
      if (!authModal) return;
      authModal.style.display = 'flex';
      if (pinInput) {
        pinInput.value = '';
        setTimeout(() => pinInput.focus(), 100);
      }
      if (pinErrorMsg) pinErrorMsg.style.display = 'none';
      if (cardElement) cardElement.classList.remove('shake');
    }

    function closeAuthModal() {
      if (authModal) authModal.style.display = 'none';
      if (pinInput) pinInput.value = '';
      if (pinErrorMsg) pinErrorMsg.style.display = 'none';
    }

    function handlePinSubmit() {
      const enteredPin = pinInput ? pinInput.value.trim() : '';
      if (enteredPin === EXECUTIVE_PASSCODE) {
        // Clear PIN input immediately upon success (no token stored anywhere)
        if (pinInput) pinInput.value = '';
        if (pinErrorMsg) pinErrorMsg.style.display = 'none';
        closeAuthModal();
        openSpeechModal();
      } else {
        if (pinErrorMsg) pinErrorMsg.style.display = 'block';
        if (cardElement) {
          cardElement.classList.add('shake');
          setTimeout(() => cardElement.classList.remove('shake'), 400);
        }
        if (pinInput) {
          pinInput.value = '';
          pinInput.focus();
        }
      }
    }

    function openSpeechModal() {
      if (!speechModal) return;
      speechModal.style.display = 'flex';
      renderExecutiveSpeech(currentSpeechContext);
    }

    function closeSpeechModal() {
      if (speechModal) speechModal.style.display = 'none';
      // Ensure state is completely cleared so next access requires PIN 6547
      if (pinInput) pinInput.value = '';
      try {
        sessionStorage.removeItem('dmc_executive_auth_token');
        localStorage.removeItem('dmc_executive_auth_token');
      } catch(e) {}
    }

    if (btnOpenSpeech) btnOpenSpeech.addEventListener('click', checkAuthAndOpen);
    if (menuSpeechGen) menuSpeechGen.addEventListener('click', (e) => {
      e.preventDefault();
      checkAuthAndOpen();
    });

    if (btnSubmitPin) btnSubmitPin.addEventListener('click', handlePinSubmit);
    if (btnCancelPin) btnCancelPin.addEventListener('click', closeAuthModal);
    if (pinInput) {
      pinInput.addEventListener('input', () => {
        const val = pinInput.value.trim();
        if (val.length === 4) {
          handlePinSubmit();
        }
      });
      pinInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handlePinSubmit();
      });
    }

    if (btnCloseSpeechModal) btnCloseSpeechModal.addEventListener('click', closeSpeechModal);

    // Context Tabs in Speech Modal
    const speechTabs = document.querySelectorAll('.speech-tab-btn');
    speechTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        speechTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentSpeechContext = tab.getAttribute('data-context');
        renderExecutiveSpeech(currentSpeechContext);
      });
    });

    // Copy Speech
    if (btnCopySpeechBtn) {
      btnCopySpeechBtn.addEventListener('click', () => {
        const text = document.getElementById('speechContentDisplay').innerText;
        navigator.clipboard.writeText(text).then(() => {
          const originalText = btnCopySpeechBtn.innerHTML;
          btnCopySpeechBtn.innerHTML = '✅ คัดลอกสำเร็จแล้ว!';
          btnCopySpeechBtn.style.background = '#047857';
          setTimeout(() => {
            btnCopySpeechBtn.innerHTML = originalText;
            btnCopySpeechBtn.style.background = '#059669';
          }, 2000);
        });
      });
    }

    // Print Speech
    if (btnPrintSpeechBtn) {
      btnPrintSpeechBtn.addEventListener('click', () => {
        const text = document.getElementById('speechContentDisplay').innerHTML;
        const printWin = window.open('', '', 'width=800,height=600');
        printWin.document.write(`
          <html>
            <head>
              <title>สคริปต์รายงาน ผอ.สพม.สกลนคร</title>
              <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap" rel="stylesheet">
              <style>
                body { font-family: 'Sarabun', sans-serif; padding: 40px; line-height: 1.8; color: #1e293b; font-size: 15px; }
                h2 { color: #1e3a8a; border-bottom: 2px solid #1e3a8a; padding-bottom: 10px; }
                .meta { font-size: 13px; color: #64748b; margin-bottom: 20px; }
              </style>
            </head>
            <body>
              <h2>บทสรุปประเด็นรายงานและการแถลงข่าว ผอ.สพม.สกลนคร</h2>
              <div class="meta">ฐานข้อมูลสารสนเทศ DMC ภาคเรียนที่ 2/2569 (ข้อมูล ณ วันที่ 10 พ.ย. 2569) • ศูนย์ DMC Hub สพม.สกลนคร</div>
              <div>${text}</div>
            </body>
          </html>
        `);
        printWin.document.close();
        printWin.focus();
        printWin.print();
        printWin.close();
      });
    }
  }

  function renderExecutiveSpeech(context) {
    const display = document.getElementById('speechContentDisplay');
    if (!display) return;

    let speechHTML = '';

    if (context === 'board') {
      speechHTML = `
<strong>ประเด็นแถลงและรายงานต่อที่ประชุม คณะกรรมการ อ.ก.ค.ศ. เขตพื้นที่การศึกษา และ กศจ.</strong>
<strong>โดย: ผู้อำนวยการสำนักงานเขตพื้นที่การศึกษามัธยมศึกษาสกลนคร</strong>
<strong>วาระ: การรับรองฐานข้อมูลนักเรียน DMC ภาคเรียนที่ 2/2569 เพื่อการบริหารอัตรากำลังครูและสถานศึกษา</strong>
-------------------------------------------------------------------------------------------------

เรียน ท่านประธาน และคณะกรรมการทุกท่าน,

ผมขอเรียนนำเสนอข้อมูลสารสนเทศประชากรนักเรียนจากระบบจัดเก็บข้อมูลนักเรียนรายบุคคล (Data Management Center : DMC) ประจำปีการศึกษา 2569 ภาคเรียนที่ 2 ข้อมูล ณ วันที่ 10 พฤศจิกายน 2569 ซึ่งกลุ่มส่งเสริมการศึกษาทางไกล เทคโนโลยีสารสนเทศและการสื่อสาร (DLICT) ได้ประมวลผล ตรวจสอบ และยืนยันความถูกต้องเรียบร้อยแล้ว โดยมีสาระสำคัญที่เกี่ยวข้องกับภารกิจของคณะกรรมการ ดังนี้ครับ:

<strong>1. สถานะประชากรนักเรียนและขนาดสถานศึกษาจริง:</strong>
ปัจจุบัน สพม.สกลนคร มีสถานศึกษาในสังกัดครบทั้ง <strong>45 โรงเรียน</strong> ครอบคลุม 18 อำเภอ มีจำนวนนักเรียนรวมทั้งสิ้น <strong>44,566 คน</strong> แบ่งเป็นระดับมัธยมศึกษาตอนต้น 24,002 คน และระดับมัธยมศึกษาตอนปลาย 20,564 คน จัดการเรียนการสอนรวม <strong>1,392 ห้องเรียน</strong> โดยมีความหนาแน่นเฉลี่ยทั้งเขตอยู่ที่ <strong>32.0 คนต่อห้องเรียน</strong> ซึ่งสะท้อนถึงการบริหารจัดการชั้นเรียนที่ได้มาตรฐานตามเกณฑ์ของ สพฐ.

<strong>2. การนำข้อมูลไปใช้ประกอบการพิจารณาด้านอัตรากำลังครู (กลุ่มบริหารงานบุคคล):</strong>
ข้อมูลนักเรียน 44,566 คนและห้องเรียน 1,392 ห้องเรียนนี้ ได้ส่งมอบให้กลุ่มบริหารงานบุคคลเรียบร้อยแล้ว เพื่อใช้เป็นฐานข้อมูลตัวเลขทางการที่ถูกต้องตรงกันในการคำนวณภาระงานครู การพิจารณาอัตรากำลังตามเกณฑ์ ก.ค.ศ. และการพิจารณาย้ายข้าราชการครูประจำปี โดยยึดหลักความเป็นธรรม โปร่งใส และสอดคล้องกับขนาดสถานศึกษาที่แท้จริง

<strong>3. มิติการกระจายตัวเชิงพื้นที่ 8 สหวิทยาเขต:</strong>
ข้อมูลเชิงพื้นที่ชี้ให้เห็นว่า สัดส่วนนักเรียนในเขตเมืองมีร้อยละ 34.2 ขณะที่สถานศึกษานอกเขตเมืองมีสัดส่วนถึงร้อยละ 65.8 ดังนั้น การบริหารอัตรากำลังครูและการจัดสรรทรัพยากรทางการศึกษา คณะกรรมการต้องให้ความสำคัญกับโรงเรียนมัธยมขนาดกลางและขนาดเล็กในพื้นที่รอบนอก เพื่อมิให้เกิดภาวะขาดแคลนครูผู้สอนในสาขาวิชาเอกหลัก

จึงขอนำเรียนต่อที่ประชุมเพื่อโปรดรับทราบและใช้เป็นฐานข้อมูลอ้างอิงในการพิจารณาวาระต่าง ๆ ต่อไปครับ
      `;
    } else if (context === 'inspection') {
      speechHTML = `
<strong>ประเด็นรายงานการตรวจราชการและติดตามประเมินผลการจัดการศึกษาขั้นพื้นฐาน (สพฐ. / กระทรวงศึกษาธิการ)</strong>
<strong>หัวข้อ: ผลการขับเคลื่อนนโยบาย "เรียนดี มีความสุข" และการป้องกันเด็กหลุดออกจากระบบ (Zero Dropout)</strong>
-------------------------------------------------------------------------------------------------

เรียน ท่านผู้ตรวจราชการกระทรวงศึกษาธิการ และคณะผู้ตรวจราชการ สพฐ.,

สำนักงานเขตพื้นที่การศึกษามัธยมศึกษาสกลนคร ได้ขับเคลื่อนนโยบาย "เรียนดี มีความสุข" ของ พลตำรวจเอก เพิ่มพูน ชิดชอบ รัฐมนตรีว่าการกระทรวงศึกษาธิการ และนโยบายเร่งด่วนของ สพฐ. อย่างเข้มข้น โดยใช้ระบบสารสนเทศดิจิทัล "DMC Hub สพม.สกลนคร" เป็นเครื่องมือหลักในการติดตามและสนับสนุนเชิงรุก ซึ่งมีผลสัมฤทธิ์เชิงประจักษ์ดังนี้:

<strong>1. ผลสัมฤทธิ์นโยบาย Zero Dropout และอัตราการคงอยู่ของนักเรียน (Retention Rate):</strong>
จากการติดตามสถิตินักเรียนระหว่างภาคเรียนที่ 1/2569 (44,818 คน) สู่ภาคเรียนที่ 2/2569 (44,566 คน) พบว่า สพม.สกลนคร มีอัตราการคงอยู่ของนักเรียนสูงถึง <strong>ร้อยละ 99.44</strong> โดยมีนักเรียนลดลงระหว่างภาคเรียนเพียง <strong>252 คน</strong> ซึ่งมีประสิทธิภาพในการดูแลช่วยเหลือนักเรียนดีขึ้นกว่าปี 2568 ที่เคยลดลงถึง 356 คน สะท้อนว่ามาตรการระบบดูแลช่วยเหลือนักเรียนและการประสานงานร่วมกับผู้ปกครองสามารถสกัดกั้นเด็กมิให้หลุดออกจากระบบการศึกษาได้อย่างมีประสิทธิภาพ

<strong>2. การลดความเหลื่อมล้ำและโรงเรียนคุณภาพตามบริบทเชิงพื้นที่:</strong>
เราได้วางระบบเรดาร์เตือนภัยล่วงหน้า (Early Warning Radar) ตรวจจับสถานศึกษาที่มีความเปราะบาง โดยเฉพาะโรงเรียนขนาดเล็กและโรงเรียนในพื้นที่ห่างไกลแถบเทือกเขาภูพานและลุ่มน้ำอูน เพื่อให้ทีมเคลื่อนที่เร็วของเขตพื้นที่ลงไปหนุนเสริมสื่อเทคโนโลยีการศึกษาทางไกล (OBEC Content Center / DLIT) เพื่อให้เด็กนักเรียนทุกคนได้เรียนรู้อย่างมีความสุขและเท่าเทียม

<strong>3. การเตรียมการรองรับประชากรนักเรียนปีการศึกษา 2570:</strong>
จากแบบจำลองพยากรณ์ประชากรนักเรียนล่วงหน้า (Demographic Cohort Progression) คาดการณ์ว่าปี 2570 จะมีนักเรียนรวม <strong>43,899 คน</strong> สพม.สกลนคร จึงได้เตรียมแผนการรับนักเรียน ม.1 และ ม.4 ร่วมกับโรงเรียนประถมศึกษาและวิทยาลัยอาชีวศึกษาในจังหวัดสกลนคร เพื่อเปิดประตูโอกาสทางการศึกษาและสายอาชีพรองรับเยาวชนอย่างครบวงจรครับ
      `;
    } else {
      speechHTML = `
<strong>คำกล่าวเปิดการประชุมสัมมนาและมอบนโยบายแก่ผู้บริหารสถานศึกษาในสังกัด 45 โรงเรียน</strong>
<strong>โดย: ผู้อำนวยการสำนักงานเขตพื้นที่การศึกษามัธยมศึกษาสกลนคร</strong>
<strong>หัวข้อ: ยกระดับมัธยมศึกษาสกลนครสู่ความเป็นเลิศด้วยพลังข้อมูลสารสนเทศ (Data-Driven Leadership)</strong>
-------------------------------------------------------------------------------------------------

สวัสดีท่านผู้อำนวยการสถานศึกษา รองผู้อำนวยการ และเพื่อนครูผู้บริหารทุกท่าน,

วันนี้ผมมีความยินดีเป็นอย่างยิ่งที่ได้พบปะกับผู้บริหารหัวขบวนทั้ง 45 โรงเรียนของ สพม.สกลนคร ในการประชุมขับเคลื่อนยุทธศาสตร์การศึกษาภาคเรียนที่ 2 ปีการศึกษา 2569 

สิ่งแรกที่ผมขอชื่นชมและขอบคุณผู้บริหารทุกท่านและคณะครู คือตัวเลขสถิติ <strong>อัตราการคงอยู่ของนักเรียนที่สูงถึง 99.44%</strong> ในเทอมนี้ เราดูแลเด็กนักเรียนของเรากว่า 44,566 ชีวิตให้อยู่ในระบบการศึกษาได้อย่างเหนียวแน่น มีเด็กออกกลางคันลดลงอย่างเห็นได้ชัด นี่คือเครื่องพิสูจน์ถึงหัวใจความเป็นครูของพวกเราทุกคนตามนโยบาย "เรียนดี มีความสุข"

ในยุคปัจจุบัน การบริหารโรงเรียนจะใช้ความรู้สึกอย่างเดียวไม่ได้แล้วครับ <strong>"ผู้บริหารยุคใหม่ต้องนำด้วยข้อมูล (Data-Driven Leadership)"</strong> วันนี้ทางเขตพื้นที่ฯ โดยกลุ่ม DLICT ได้พัฒนาและเปิดตัวระบบ <strong>"DMC Hub สพม.สกลนคร"</strong> ขึ้นมา เพื่อให้ท่าน ผอ. ทั้ง 45 โรงเรียน สามารถเปิดดูข้อมูลสถิติของโรงเรียนตัวเอง เปรียบเทียบย้อนหลัง 5 เทอม ดูโครงสร้างห้องเรียน และประมาณการงบประมาณรายหัวได้ทันทีผ่านมือถือและแท็บเล็ต

ผมขอฝาก 3 ทิศทางสำคัญในการขับเคลื่อนร่วมกันนับจากนี้:
<strong>1. ความเข้มแข็งของ 8 สหวิทยาเขต:</strong> โรงเรียนพี่ใหญ่ต้องจับมือเป็นพี่เลี้ยงร่วมพัฒนากับโรงเรียนน้อง เพื่อแบ่งปันทรัพยากร หลักสูตร และกิจกรรม
<strong>2. การยกระดับคุณภาพห้องเรียน:</strong> ห้องเรียนของเราเฉลี่ย 32 คน/ห้อง เป็นขนาดที่เหมาะสมอย่างยิ่งในการจัดการเรียนรู้เชิงรุก (Active Learning) ขอให้เน้นพัฒนาทักษะชีวิตและทักษะอาชีพของเด็ก
<strong>3. การเตรียมรับมือการเปลี่ยนแปลงปี 2570:</strong> แนวโน้มเด็กเกิดใหม่ลดลง เราต้องเร่งพัฒนาโรงเรียนให้น่าเรียน มีอัตลักษณ์ และสร้างความเชื่อมั่นแก่ผู้ปกครองในชุมชน

ขอให้ทุกท่านใช้ระบบ DMC Hub ให้เกิดประโยชน์สูงสุดในการบริหารโรงเรียน และร่วมกันพามัธยมศึกษาสกลนครก้าวไปข้างหน้าอย่างมั่นคงครับ ขอบคุณครับ
      `;
    }

    display.innerHTML = speechHTML.trim();
  }


  /* ==========================================================================
     MODULE 6: 5-WAVE LONGITUDINAL ANALYTICS & TREND
     ========================================================================== */
  let longitudinalChartInstance = null;
  let currentLongitudinalMetric = 'students'; // 'students', 'rooms', 'density'
  let currentLongitudinalSchoolId = 'ALL';

  function initLongitudinalModule() {
    const schoolSelect = document.getElementById('longitudinalSchoolSelect');
    const metricPills = document.querySelectorAll('#longitudinalMetricGroup .filter-pill');

    if (schoolSelect && typeof DASHBOARD_DATA !== 'undefined') {
      const sorted = [...DASHBOARD_DATA].sort((a, b) => (a.shortName || a.name).localeCompare(b.shortName || b.name, 'th'));
      sorted.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.id;
        opt.textContent = `${s.shortName || s.name} (${s.cluster || ''})`;
        schoolSelect.appendChild(opt);
      });

      schoolSelect.addEventListener('change', () => {
        currentLongitudinalSchoolId = schoolSelect.value;
        renderLongitudinalView();
      });
    }

    if (metricPills) {
      metricPills.forEach(pill => {
        pill.addEventListener('click', () => {
          metricPills.forEach(p => p.classList.remove('active'));
          pill.classList.add('active');
          currentLongitudinalMetric = pill.getAttribute('data-metric');
          renderLongitudinalView();
        });
      });
    }

    renderLongitudinalView();
  }

  function renderLongitudinalView() {
    if (typeof DASHBOARD_DATA === 'undefined') return;

    const periods = ['y68_1', 'y68_2', 'y68_3', 'y69_1', 'y69_2'];
    const periodLabels = [
      '2568 เทอม 1\n(10 มิ.ย. 68)',
      '2568 เทอม 2\n(10 พ.ย. 68)',
      '2568 สิ้นปี\n(30 เม.ย. 69)',
      '2569 เทอม 1\n(10 มิ.ย. 69)',
      '2569 เทอม 2\n(10 พ.ย. 69)'
    ];

    let dataPoints = [0, 0, 0, 0, 0];
    let roomPoints = [0, 0, 0, 0, 0];
    let densityPoints = [0, 0, 0, 0, 0];

    const isAll = currentLongitudinalSchoolId === 'ALL';
    let targetSchools = isAll ? DASHBOARD_DATA : DASHBOARD_DATA.filter(s => s.id === currentLongitudinalSchoolId);
    if (targetSchools.length === 0) targetSchools = DASHBOARD_DATA;

    periods.forEach((pKey, idx) => {
      let sumStd = 0;
      let sumRooms = 0;
      targetSchools.forEach(s => {
        const p = s[pKey] || {};
        sumStd += (p.total?.total || 0);
        sumRooms += (p.total?.rooms || 0);
      });
      dataPoints[idx] = sumStd;
      roomPoints[idx] = sumRooms;
      densityPoints[idx] = sumRooms > 0 ? Number((sumStd / sumRooms).toFixed(1)) : 0;
    });

    // Update 4 Highlight Cards
    const valStart = dataPoints[0];
    const valEnd = dataPoints[4];
    const netDiff = valEnd - valStart;
    const netPct = valStart > 0 ? (netDiff / valStart * 100).toFixed(2) : '0.00';

    const loss68 = dataPoints[1] - dataPoints[0];
    const loss69 = dataPoints[4] - dataPoints[3];
    const summerIntake = dataPoints[3] - dataPoints[2];
    const endRooms = roomPoints[4];
    const roomDiff = roomPoints[4] - roomPoints[0];

    const elShiftVal = document.getElementById('longShiftVal');
    const elShiftSub = document.getElementById('longShiftSub');
    if (elShiftVal) {
      elShiftVal.textContent = `${netDiff >= 0 ? '+' : ''}${netDiff.toLocaleString()} คน (${netDiff >= 0 ? '+' : ''}${netPct}%)`;
      elShiftVal.style.color = netDiff >= 0 ? '#16a34a' : '#b91c1c';
    }
    if (elShiftSub) elShiftSub.textContent = `${valStart.toLocaleString()} ➔ ${valEnd.toLocaleString()} คน`;

    const elMidVal = document.getElementById('longMidYearVal');
    const elMidSub = document.getElementById('longMidYearSub');
    if (elMidVal) {
      elMidVal.textContent = isAll ? 'ดีขึ้น +0.22%' : `ลดลง ${loss69.toLocaleString()} คน`;
    }
    if (elMidSub) elMidSub.textContent = `ปี 68 (${loss68.toLocaleString()} คน) vs ปี 69 (${loss69.toLocaleString()} คน)`;

    const elSummerVal = document.getElementById('longSummerVal');
    const elSummerSub = document.getElementById('longSummerSub');
    if (elSummerVal) {
      elSummerVal.textContent = `${summerIntake >= 0 ? '+' : ''}${summerIntake.toLocaleString()} คน`;
      elSummerVal.style.color = summerIntake >= 0 ? '#16a34a' : '#b91c1c';
    }
    if (elSummerSub) elSummerSub.textContent = `สิ้นปี 68 (${dataPoints[2].toLocaleString()}) ➔ เปิดปี 69 (${dataPoints[3].toLocaleString()})`;

    const elRoomsVal = document.getElementById('longRoomsVal');
    const elRoomsSub = document.getElementById('longRoomsSub');
    if (elRoomsVal) elRoomsVal.textContent = `${endRooms.toLocaleString()} ห้อง`;
    if (elRoomsSub) elRoomsSub.textContent = `${roomDiff >= 0 ? 'ขยายเพิ่ม +' : 'ลดลง '}${Math.abs(roomDiff)} ห้อง จากปี 2568`;

    // Render Chart
    const canvas = document.getElementById('longitudinalChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (longitudinalChartInstance) longitudinalChartInstance.destroy();

    let chartDatasetData = dataPoints;
    let chartLabel = 'จำนวนนักเรียนรวม (คน)';
    let chartUnit = 'คน';
    let borderColor = '#1e3a8a';
    let bgColor = 'rgba(30, 58, 138, 0.12)';

    if (currentLongitudinalMetric === 'rooms') {
      chartDatasetData = roomPoints;
      chartLabel = 'จำนวนห้องเรียน (ห้อง)';
      chartUnit = 'ห้อง';
      borderColor = '#c28e38';
      bgColor = 'rgba(194, 142, 56, 0.15)';
    } else if (currentLongitudinalMetric === 'density') {
      chartDatasetData = densityPoints;
      chartLabel = 'ความหนาแน่นเฉลี่ย (คน/ห้อง)';
      chartUnit = 'คน/ห้อง';
      borderColor = '#0284c7';
      bgColor = 'rgba(2, 132, 199, 0.15)';
    }

    const isDark = document.body.classList.contains('dark-theme');
    const textColor = isDark ? '#e2e8f0' : '#475569';
    const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';

    longitudinalChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['2568 เทอม 1', '2568 เทอม 2', '2568 สิ้นปี', '2569 เทอม 1', '2569 เทอม 2'],
        datasets: [{
          label: chartLabel,
          data: chartDatasetData,
          borderColor: borderColor,
          backgroundColor: bgColor,
          borderWidth: 3,
          fill: true,
          tension: 0.35,
          pointRadius: 6,
          pointHoverRadius: 8,
          pointBackgroundColor: '#ffffff',
          pointBorderColor: borderColor,
          pointBorderWidth: 2.5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            padding: 12,
            titleFont: { family: 'Sarabun', size: 13, weight: 'bold' },
            bodyFont: { family: 'Sarabun', size: 13 },
            callbacks: {
              title: (c) => periodLabels[c[0].dataIndex].replace('\\n', ' '),
              label: (c) => ` ${chartLabel}: ${Number(c.parsed.y).toLocaleString()} ${chartUnit}`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: textColor, font: { family: 'Sarabun', size: 12 } }
          },
          y: {
            grid: { color: gridColor },
            ticks: { color: textColor, font: { family: 'Sarabun', size: 12 } }
          }
        }
      }
    });
  }

  /* ==========================================================================
     MODULE 7: LONGITUDINAL COHORT TRACKING
     ========================================================================== */
  function initCohortModule() {
    if (typeof DASHBOARD_DATA === 'undefined') return;

    const tbody = document.getElementById('cohortTableBody');
    const searchInput = document.getElementById('cohortSearchInput');
    if (!tbody) return;

    const records = DASHBOARD_DATA.map((s, idx) => {
      const g68 = s.y68_1?.grades || {};
      const g69 = s.y69_1?.grades || {};

      const m1_68 = g68.ม1?.total || 0;
      const m2_69 = g69.ม2?.total || 0;
      const c1 = m1_68 > 0 ? (m2_69 / m1_68 * 100) : 100;

      const m2_68 = g68.ม2?.total || 0;
      const m3_69 = g69.ม3?.total || 0;
      const c2 = m2_68 > 0 ? (m3_69 / m2_68 * 100) : 100;

      const m3_68 = g68.ม3?.total || 0;
      const m4_69 = g69.ม4?.total || 0;
      const c3 = m3_68 > 0 ? (m4_69 / m3_68 * 100) : 0;

      const m4_68 = g68.ม4?.total || 0;
      const m5_69 = g69.ม5?.total || 0;
      const c4 = m4_68 > 0 ? (m5_69 / m4_68 * 100) : 100;

      const m5_68 = g68.ม5?.total || 0;
      const m6_69 = g69.ม6?.total || 0;
      const c5 = m5_68 > 0 ? (m6_69 / m5_68 * 100) : 100;

      // Overall Cohort Retention (averaging regular cohort years)
      const validC = [c1, c2, c4, c5].filter(x => x > 0);
      const avgRetention = validC.length > 0 ? (validC.reduce((a, b) => a + b, 0) / validC.length) : 100;

      let badge = '<span class="badge" style="background: #dcfce7; color: #166534; font-size: 11px;">🌟 ดีเด่น (≥98%)</span>';
      if (avgRetention < 92.0) {
        badge = '<span class="badge" style="background: #ffedd5; color: #9a3412; font-size: 11px;">⚠️ ควรเฝ้าระวัง</span>';
      } else if (avgRetention < 98.0) {
        badge = '<span class="badge" style="background: #e0f2fe; color: #075985; font-size: 11px;">มาตรฐาน</span>';
      }

      return {
        id: s.id,
        name: s.shortName || s.name,
        fullName: s.name,
        cluster: s.cluster || 'ทั่วไป',
        c1: Number(c1.toFixed(1)),
        c2: Number(c2.toFixed(1)),
        c3: Number(c3.toFixed(1)),
        c4: Number(c4.toFixed(1)),
        c5: Number(c5.toFixed(1)),
        avg: Number(avgRetention.toFixed(1)),
        badge: badge
      };
    });

    records.sort((a, b) => b.avg - a.avg);

    function renderCohortRows(filter = '') {
      tbody.innerHTML = '';
      const q = filter.trim().toLowerCase();
      const filtered = records.filter(r => !q || r.name.toLowerCase().includes(q) || r.cluster.toLowerCase().includes(q));

      filtered.forEach((r, i) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td style="text-align: center; color: var(--text-muted);">${i + 1}</td>
          <td><strong>${r.name}</strong></td>
          <td style="text-align: center; color: var(--text-muted); font-size: 11px;">${r.cluster}</td>
          <td style="text-align: right; font-weight: 600; color: ${r.c1 >= 100 ? '#16a34a' : '#1e293b'};">${r.c1}%</td>
          <td style="text-align: right; font-weight: 600; color: ${r.c2 >= 100 ? '#16a34a' : '#1e293b'};">${r.c2}%</td>
          <td style="text-align: right; font-weight: 600; color: #0284c7;">${r.c3}%</td>
          <td style="text-align: right; font-weight: 600; color: ${r.c4 >= 98 ? '#16a34a' : '#1e293b'};">${r.c4}%</td>
          <td style="text-align: right; font-weight: 600; color: ${r.c5 >= 98 ? '#16a34a' : '#1e293b'};">${r.c5}%</td>
          <td style="text-align: center; font-weight: 700; color: #1e3a8a; font-size: 13px;">${r.avg}%</td>
          <td style="text-align: center;">${r.badge}</td>
        `;
        tbody.appendChild(tr);
      });
    }

    renderCohortRows();

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        renderCohortRows(e.target.value);
      });
    }
  }

  /* ==========================================================================
     MODULE 8: SCHOOL HEALTH INDEX & MULTI-DIMENSIONAL RADAR
     ========================================================================== */
  let healthRadarChartInstance = null;
  let selectedHealthSchoolId = null;

  function initHealthIndexModule() {
    if (typeof DASHBOARD_DATA === 'undefined') return;

    const tbody = document.getElementById('healthTableBody');
    const searchInput = document.getElementById('healthSearchInput');
    if (!tbody) return;

    // Calculate health scores for all 45 schools
    const healthData = DASHBOARD_DATA.map(s => {
      const counts = [
        s.y68_1?.total?.total || 0,
        s.y68_2?.total?.total || 0,
        s.y68_3?.total?.total || 0,
        s.y69_1?.total?.total || 0,
        s.y69_2?.total?.total || 0
      ];
      const mean = counts.reduce((a, b) => a + b, 0) / 5.0;
      const variance = counts.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / 5.0;
      const stdDev = Math.sqrt(variance);
      const cv = mean > 0 ? (stdDev / mean) : 0;
      const score_stability = Math.max(10.0, Math.min(25.0, 25.0 - (cv * 300.0)));

      const s69_1 = counts[3];
      const s69_2 = counts[4];
      const retRate = s69_1 > 0 ? (s69_2 / s69_1 * 100.0) : 100.0;
      let score_retention = 25.0;
      if (retRate < 97.0) score_retention = Math.max(8.0, 15.0 - (97.0 - retRate) * 2.0);
      else if (retRate < 99.0) score_retention = 15.0 + (retRate - 97.0) * 2.5;
      else if (retRate < 100.0) score_retention = 20.0 + (retRate - 99.0) * 5.0;

      const rooms = s.y69_2?.total?.rooms || 0;
      const density = rooms > 0 ? (s69_2 / rooms) : 0;
      let score_density = 20.0;
      if (density >= 28.0 && density <= 35.0) score_density = 20.0;
      else if (density >= 24.0 && density < 28.0) score_density = 16.0 + (density - 24.0);
      else if (density > 35.0 && density <= 38.0) score_density = 20.0 - (density - 35.0) * 1.5;
      else if (density > 38.0) score_density = Math.max(8.0, 15.5 - (density - 38.0) * 3.0);
      else score_density = Math.max(8.0, 16.0 - (24.0 - density) * 0.8);

      const g68 = s.y68_1?.grades || {};
      const g69 = s.y69_1?.grades || {};
      const c1 = g68.ม1?.total > 0 ? (g69.ม2?.total / g68.ม1?.total * 100.0) : 100.0;
      const c4 = g68.ม4?.total > 0 ? (g69.ม5?.total / g68.ม4?.total * 100.0) : 100.0;
      const trans = g68.ม3?.total > 0 ? (g69.ม4?.total / g68.ม3?.total * 100.0) : 80.0;
      const avgCohort = (c1 * 0.4 + c4 * 0.4 + Math.min(100.0, trans) * 0.2);
      const score_cohort = Math.max(5.0, Math.min(15.0, (avgCohort - 80.0) * 0.5 + 5.0));

      let score_resource = 11.5;
      if (s69_2 >= 1680) score_resource = 15.0;
      else if (s69_2 >= 720) score_resource = 13.5;
      else if (s69_2 >= 300) score_resource = 11.5;
      else if (s69_2 >= 120) score_resource = 9.5;
      else score_resource = 7.5;

      const total = Number((score_stability + score_retention + score_density + score_cohort + score_resource).toFixed(1));
      let grade = 'B';
      if (total >= 90.0) grade = 'AAA';
      else if (total >= 80.0) grade = 'AA';
      else if (total >= 70.0) grade = 'A';

      return {
        id: s.id,
        name: s.shortName || s.name,
        fullName: s.name,
        cluster: s.cluster || 'ทั่วไป',
        amphoe: s.amphoe || '',
        totalStudents: s69_2,
        density: Number(density.toFixed(1)),
        score_stability: Number(score_stability.toFixed(1)),
        score_retention: Number(score_retention.toFixed(1)),
        score_density: Number(score_density.toFixed(1)),
        score_cohort: Number(score_cohort.toFixed(1)),
        score_resource: Number(score_resource.toFixed(1)),
        total: total,
        grade: grade
      };
    });

    healthData.sort((a, b) => b.total - a.total);

    // District Average benchmarks
    const avgStability = Number((healthData.reduce((a, b) => a + b.score_stability, 0) / healthData.length).toFixed(1));
    const avgRetention = Number((healthData.reduce((a, b) => a + b.score_retention, 0) / healthData.length).toFixed(1));
    const avgDensity = Number((healthData.reduce((a, b) => a + b.score_density, 0) / healthData.length).toFixed(1));
    const avgCohort = Number((healthData.reduce((a, b) => a + b.score_cohort, 0) / healthData.length).toFixed(1));
    const avgResource = Number((healthData.reduce((a, b) => a + b.score_resource, 0) / healthData.length).toFixed(1));

    function renderHealthTable(filter = '') {
      tbody.innerHTML = '';
      const q = filter.trim().toLowerCase();
      const filtered = healthData.filter(r => !q || r.name.toLowerCase().includes(q) || r.cluster.toLowerCase().includes(q));

      filtered.forEach((r, idx) => {
        const tr = document.createElement('tr');
        tr.className = `health-row-clickable ${r.id === selectedHealthSchoolId ? 'selected-row' : ''}`;
        
        let gradeStyle = 'background: #dcfce7; color: #166534;';
        if (r.grade === 'AA') gradeStyle = 'background: #e0f2fe; color: #075985;';
        else if (r.grade === 'A') gradeStyle = 'background: #fef9c3; color: #854d0e;';
        else if (r.grade === 'B') gradeStyle = 'background: #ffedd5; color: #9a3412;';

        tr.innerHTML = `
          <td style="text-align: center; color: var(--text-muted);">${idx + 1}</td>
          <td><strong>${r.name}</strong><br><span style="font-size: 10.5px; color: var(--text-muted);">${r.cluster}</span></td>
          <td style="text-align: center;"><span class="badge" style="${gradeStyle} font-weight: 700;">${r.grade}</span></td>
          <td style="text-align: right; font-weight: 700; color: #1e3a8a; font-size: 13px;">${r.total}</td>
          <td style="text-align: center;">
            <button class="primary-btn btn-sm" style="padding: 4px 10px; font-size: 11px; border-radius: 6px;">เรดาร์ 🎯</button>
          </td>
        `;

        tr.addEventListener('click', () => {
          selectedHealthSchoolId = r.id;
          document.querySelectorAll('.health-row-clickable').forEach(el => el.classList.remove('selected-row'));
          tr.classList.add('selected-row');
          renderHealthDetail(r);
        });

        tbody.appendChild(tr);
      });
    }

    function renderHealthDetail(school) {
      if (!school) return;

      const elName = document.getElementById('healthDetailSchoolName');
      const elCluster = document.getElementById('healthDetailCluster');
      const elBadge = document.getElementById('healthDetailGradeBadge');
      const chipsBox = document.getElementById('healthScoresChips');
      const recBox = document.getElementById('healthRecommendationBox');

      if (elName) elName.textContent = school.fullName || school.name;
      if (elCluster) elCluster.textContent = `${school.cluster} • นักเรียน ${school.totalStudents.toLocaleString()} คน (${school.density} คน/ห้อง)`;

      let badgeBg = '#dcfce7';
      let badgeColor = '#166534';
      if (school.grade === 'AA') { badgeBg = '#e0f2fe'; badgeColor = '#075985'; }
      else if (school.grade === 'A') { badgeBg = '#fef9c3'; badgeColor = '#854d0e'; }
      else if (school.grade === 'B') { badgeBg = '#ffedd5'; badgeColor = '#9a3412'; }

      if (elBadge) {
        elBadge.style.background = badgeBg;
        elBadge.style.color = badgeColor;
        elBadge.textContent = `${school.grade} (${school.total} คะแนน)`;
      }

      if (chipsBox) {
        chipsBox.innerHTML = `
          <div style="background: #f1f5f9; padding: 6px 10px; border-radius: 6px;">📈 <strong>เสถียรภาพ 5 รอบ:</strong> ${school.score_stability}/25</div>
          <div style="background: #f1f5f9; padding: 6px 10px; border-radius: 6px;">🛡️ <strong>Zero Dropout:</strong> ${school.score_retention}/25</div>
          <div style="background: #f1f5f9; padding: 6px 10px; border-radius: 6px;">🏫 <strong>บริหารชั้นเรียน:</strong> ${school.score_density}/20</div>
          <div style="background: #f1f5f9; padding: 6px 10px; border-radius: 6px;">👥 <strong>ดุลยภาพข้ามรุ่น:</strong> ${school.score_cohort}/15</div>
          <div style="background: #f1f5f9; padding: 6px 10px; border-radius: 6px; grid-column: span 2;">💰 <strong>เสถียรภาพงบประมาณ:</strong> ${school.score_resource}/15 คะแนน</div>
        `;
      }

      if (recBox) {
        let recommendation = '';
        if (school.grade === 'AAA') {
          recommendation = `🌟 <strong>สถานะสุขภาวะระดับยอดเยี่ยม:</strong> มีเสถียรภาพประชากรสูงมาก การบริหารชั้นเรียนได้มาตรฐาน และอัตราคงอยู่นักเรียนดีเด่น แนะนำให้เป็นสถานศึกษาต้นแบบ (Role Model) ด้านการจัดการศึกษาในสหวิทยาเขต ${school.cluster}`;
        } else if (school.grade === 'AA') {
          recommendation = `🔵 <strong>สถานะสุขภาวะระดับดีมาก:</strong> ภาพรวมเข้มแข็งในระดับสูง แนะนำให้เพิ่มความเข้มข้นในการแนะแนวการศึกษาต่อ ม.3 สู่ ม.4 และการสร้างแรงจูงใจในการคงอยู่ของนักเรียน ม.ปลาย`;
        } else if (school.grade === 'A') {
          recommendation = `🟡 <strong>สถานะสุขภาวะระดับมาตรฐาน:</strong> มีความมั่นคง แต่ควรเฝ้าระวังความผันผวนของจำนวนนักเรียนระหว่างภาคเรียน และการบริหารความจุห้องเรียนให้กระชับสมดุลยิ่งขึ้น`;
        } else {
          recommendation = `🟠 <strong>กลุ่มเฝ้าระวังพิเศษ (Watchlist):</strong> ต้องได้รับการหนุนเสริมทรัพยากรทางการศึกษาเร่งด่วน โดยเฉพาะการจับคู่โรงเรียนพี่เลี้ยง (School Pairing Mentorship) ภายใต้กลุ่มสหวิทยาเขต และการจัดสรรสื่อดิจิทัลการศึกษาทางไกลชดเชยอัตรากำลัง`;
        }
        recBox.innerHTML = recommendation;
      }

      // Render Radar Chart
      const radarCanvas = document.getElementById('healthRadarChart');
      if (!radarCanvas) return;
      const ctx = radarCanvas.getContext('2d');
      if (healthRadarChartInstance) healthRadarChartInstance.destroy();

      const isDark = document.body.classList.contains('dark-theme');
      const textColor = isDark ? '#e2e8f0' : '#475569';

      healthRadarChartInstance = new Chart(ctx, {
        type: 'radar',
        data: {
          labels: [
            'เสถียรภาพประชากร (25)',
            'Zero Dropout (25)',
            'บริหารชั้นเรียน (20)',
            'ดุลยภาพข้ามรุ่น (15)',
            'งบประมาณ (15)'
          ],
          datasets: [
            {
              label: school.name,
              data: [school.score_stability, school.score_retention, school.score_density, school.score_cohort, school.score_resource],
              borderColor: '#c28e38',
              backgroundColor: 'rgba(194, 142, 56, 0.28)',
              pointBackgroundColor: '#c28e38',
              pointBorderColor: '#ffffff',
              pointRadius: 4,
              borderWidth: 2.5
            },
            {
              label: 'ค่าเฉลี่ย สพม.สกลนคร',
              data: [avgStability, avgRetention, avgDensity, avgCohort, avgResource],
              borderColor: '#94a3b8',
              backgroundColor: 'transparent',
              borderDash: [4, 4],
              pointRadius: 3,
              pointBackgroundColor: '#94a3b8',
              borderWidth: 1.5
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: { font: { family: 'Sarabun', size: 11.5 }, color: textColor, boxWidth: 12 }
            }
          },
          scales: {
            r: {
              angleLines: { color: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' },
              grid: { color: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' },
              pointLabels: { font: { family: 'Sarabun', size: 11, weight: 'bold' }, color: textColor },
              ticks: { display: false }
            }
          }
        }
      });
    }

    selectedHealthSchoolId = healthData[0].id;
    renderHealthTable();
    renderHealthDetail(healthData[0]);

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        renderHealthTable(e.target.value);
      });
    }
  }


  /* ==========================================================================
     MODULE 9: UNIVERSAL COMMAND PALETTE (CTRL + K)
     ========================================================================== */
  function initCommandPaletteModule() {
    const modal = document.getElementById('commandPaletteModal');
    const input = document.getElementById('cmdPaletteInput');
    const resultsBox = document.getElementById('cmdPaletteResults');
    const btnOpen = document.getElementById('btnOpenCmdPalette');
    if (!modal || !input || !resultsBox) return;

    // Build Search Index
    const searchIndex = [
      // Modules
      { title: 'แดชบอร์ดภาพรวม', desc: 'หน้าแรกและสรุปตัวชี้วัดสำคัญ', tag: 'โมดูล', targetId: 'topSection' },
      { title: 'บทสรุปผู้บริหาร', desc: '5 เสาหลักยุทธศาสตร์และข้อสั่งการ', tag: 'โมดูล', targetId: 'executiveSection' },
      { title: 'สถิตินักเรียน 45 โรงเรียน', desc: 'ตารางสถิตินักเรียน ม.1 - ม.6 ชาย/หญิง', tag: 'โมดูล', targetId: 'tableSection' },
      { title: 'สถิติห้องเรียน & ความหนาแน่น', desc: 'ความจุและความหนาแน่นต่อห้อง', tag: 'โมดูล', targetId: 'tableSection' },
      { title: 'เปรียบเทียบโรงเรียน', desc: 'วิเคราะห์ประกบคู่ 2 สถานศึกษา', tag: 'โมดูล', targetId: 'tableSection' },
      { title: 'Zero Dropout & อัตราคงอยู่', desc: 'การติดตามนักเรียนหลุดระหว่างเทอม', tag: 'โมดูล', targetId: 'retentionSection' },
      { title: 'แผนที่ GIS 45 ร.ร.', desc: 'รัศมีบริการ 5 กม. / 10 กม. และพิกัด', tag: 'โมดูล', targetId: 'gisMapSection' },
      { title: 'พยากรณ์ประชากรปี 2570', desc: 'Demographic Cohort Forecasting', tag: 'โมดูล', targetId: 'forecastSection' },
      { title: 'งบประมาณเงินอุดหนุนรายหัว', desc: 'คำนวณเงินอุดหนุน สพฐ. 179.63 ล้านบาท', tag: 'โมดูล', targetId: 'resourceSection' },
      { title: 'จำลองนโยบาย (Policy Sandbox)', desc: 'What-If Simulation สไลเดอร์ปรับค่า', tag: 'โมดูล', targetId: 'policySandboxSection' },
      { title: 'เรดาร์เตือนภัย 4 มิติ (4D Radar)', desc: 'คัดกรองความเสี่ยง 4 มิติสถานศึกษา', tag: 'โมดูล', targetId: 'earlyWarningSection' },
      { title: 'ไทม์ไลน์ 5 รอบเวลา (Big Data)', desc: 'กราฟคลื่นความเคลื่อนไหว 5 จุดเวลา', tag: 'โมดูล', targetId: 'longitudinalSection' },
      { title: 'ติดตามรุ่นนักเรียน (Cohort Tracking)', desc: 'การเลื่อนชั้น ม.1 สู่ ม.6 ข้ามปี', tag: 'โมดูล', targetId: 'cohortSection' },
      { title: 'ดัชนีสุขภาวะ 45 ร.ร. (Health Index)', desc: 'เรดาร์ชาร์ต 100 คะแนนเต็ม 5 มิติ', tag: 'โมดูล', targetId: 'healthIndexSection' },
      { title: 'สคริปต์รายงาน ผอ.เขต 🔒', desc: 'เครื่องมือสร้างสุนทรพจน์ทางการ กศจ./สพฐ.', tag: 'เครื่องมือ', targetId: 'openExecutiveSpeechBtn', isButton: true },
      { title: 'AI Executive Policy Copilot 🔒', desc: 'ผู้ช่วยอัจฉริยะ ผอ.เขต (ต้องใส่รหัส 6547)', tag: 'เครื่องมือ', targetId: 'btnOpenCopilot', isButton: true },
      { title: 'เส้นทางตรวจเยี่ยมโรงเรียน (Route Planner)', desc: 'ระบบวางแผนเส้นทางตรวจราชการและคำนวณเวลา', tag: 'เครื่องมือ', targetId: 'btnToggleRoutePlanner', isButton: true },
      { title: 'เอกสารสรุปหน้าเดียว A4 (One-Pager)', desc: 'พรีวิวและพิมพ์สรุปนโยบายหน้าเดียว A4', tag: 'เอกสาร', targetId: 'btnOpenOnePager', isButton: true }
    ];

    // Add 8 Clusters
    if (typeof CLUSTER_METADATA !== 'undefined') {
      Object.keys(CLUSTER_METADATA).forEach(cName => {
        searchIndex.push({
          title: cName,
          desc: 'สหวิทยาเขตในสังกัด สพม.สกลนคร',
          tag: 'สหวิทยาเขต',
          targetId: 'gisMapSection',
          action: () => {
            const select = document.getElementById('gisClusterSelect');
            if (select) {
              select.value = cName;
              select.dispatchEvent(new Event('change'));
            }
          }
        });
      });
    }

    // Add 45 Schools
    if (typeof DASHBOARD_DATA !== 'undefined') {
      DASHBOARD_DATA.forEach(s => {
        const extra = [s.tel ? `โทร ${s.tel}` : '', s.tambon ? `ต.${s.tambon}` : '', s.project].filter(Boolean).join(' • ');
        searchIndex.push({
          title: s.name,
          desc: `${s.cluster || ''} • นักเรียน ${s.y69_2?.total?.total || 0} คน ${extra ? '• ' + extra : ''}`,
          tag: 'โรงเรียน',
          targetId: 'tableSection',
          action: () => {
            const searchBox = document.getElementById('tableSearchInput');
            if (searchBox) {
              searchBox.value = s.shortName || s.name;
              searchBox.dispatchEvent(new Event('input'));
            }
          }
        });
      });
    }

    function openPalette() {
      modal.style.display = 'flex';
      input.value = '';
      renderResults('');
      setTimeout(() => input.focus(), 80);
    }

    function closePalette() {
      modal.style.display = 'none';
    }

    function renderResults(q) {
      resultsBox.innerHTML = '';
      const query = q.trim().toLowerCase();
      const filtered = searchIndex.filter(item => 
        !query || item.title.toLowerCase().includes(query) || item.desc.toLowerCase().includes(query) || item.tag.toLowerCase().includes(query)
      ).slice(0, 8);

      if (filtered.length === 0) {
        resultsBox.innerHTML = '<div style="padding: 20px; text-align: center; color: #64748b; font-size: 13px;">ไม่พบข้อมูลที่ตรงกับคำค้นหา</div>';
        return;
      }

      filtered.forEach((item, idx) => {
        const div = document.createElement('div');
        div.className = `cmd-item ${idx === 0 ? 'active' : ''}`;
        div.innerHTML = `
          <div class="cmd-item-left">
            <span>${item.tag === 'โรงเรียน' ? '🏫' : (item.tag === 'สหวิทยาเขต' ? '📍' : (item.tag === 'เอกสาร' ? '📄' : '⚡'))}</span>
            <div>
              <div class="cmd-item-title">${item.title}</div>
              <div class="cmd-item-desc">${item.desc}</div>
            </div>
          </div>
          <span class="cmd-item-tag">${item.tag}</span>
        `;

        div.addEventListener('click', () => {
          closePalette();
          if (item.action) {
            item.action();
          }
          if (item.isButton) {
            const btn = document.getElementById(item.targetId);
            if (btn) btn.click();
          } else if (item.targetId) {
            const el = document.getElementById(item.targetId);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        });

        resultsBox.appendChild(div);
      });
    }

    input.addEventListener('input', (e) => renderResults(e.target.value));

    // Global Keydown Shortcut (Ctrl + K or Cmd + K)
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (modal.style.display === 'flex') closePalette();
        else openPalette();
      } else if (e.key === 'Escape' && modal.style.display === 'flex') {
        closePalette();
      }
    });

    if (btnOpen) btnOpen.addEventListener('click', openPalette);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closePalette();
    });
  }

  /* ==========================================================================
     MODULE 10: A4 EXECUTIVE POLICY ONE-PAGER
     ========================================================================== */
  function initOnePagerModule() {
    const modal = document.getElementById('executiveOnePagerModal');
    const btnOpen = document.getElementById('btnOpenOnePager');
    const btnClose = document.getElementById('btnCloseOnePager');
    const btnPrint = document.getElementById('btnPrintOnePager');

    if (btnOpen && modal) {
      btnOpen.addEventListener('click', () => {
        modal.style.display = 'flex';
      });
    }

    if (btnClose && modal) {
      btnClose.addEventListener('click', () => {
        modal.style.display = 'none';
      });
    }

    if (btnPrint) {
      btnPrint.addEventListener('click', () => {
        window.print();
      });
    }

    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
      });
    }
  }

  /* ==========================================================================
     MODULE 11: GIS SCHOOL CLUSTERING SYNERGY NETWORK
     ========================================================================== */
  let synergyLayers = [];
  let isSynergyNetworkVisible = false;

  function initGisSynergyModule() {
    const btnToggle = document.getElementById('btnToggleSynergyNetwork');
    if (!btnToggle) return;

    btnToggle.addEventListener('click', () => {
      if (!gisMap) return;
      isSynergyNetworkVisible = !isSynergyNetworkVisible;

      if (isSynergyNetworkVisible) {
        btnToggle.style.background = '#16a34a';
        btnToggle.style.color = '#ffffff';
        btnToggle.style.borderColor = '#15803d';
        drawSynergyNetwork();
      } else {
        btnToggle.style.background = '#f0fdf4';
        btnToggle.style.color = '#166534';
        btnToggle.style.borderColor = '#bbf7d0';
        clearSynergyNetwork();
      }
    });
  }

  function clearSynergyNetwork() {
    if (!gisMap) return;
    synergyLayers.forEach(l => gisMap.removeLayer(l));
    synergyLayers = [];
  }

  function drawSynergyNetwork() {
    clearSynergyNetwork();
    if (!gisMap || typeof SCHOOL_COORDINATES === 'undefined') return;

    // Mentor Pairings (Major School -> Partner Vulnerable / Small Schools)
    const synergyPairs = [
      {
        mentorName: 'สกลราชวิทยานุกูล',
        partnerName: 'ท่าแร่ศึกษา',
        focus: 'แลกเปลี่ยนสื่อดิจิทัลและห้องปฏิบัติการวิทยาศาสตร์ (Digital Lab Sharing)'
      },
      {
        mentorName: 'สกลราชวิทยานุกูล',
        partnerName: 'ท่านผู้หญิงจันทิมาพึ่งบารมี',
        focus: 'หนุนเสริมการจัดการเรียนการสอนพื้นที่สูงและเทือกเขา'
      },
      {
        mentorName: 'ธาตุนารายณ์วิทยา',
        partnerName: 'ด่านม่วงคำพิทยาคม',
        focus: 'แชร์ครูผู้สอนภาษาต่างประเทศและแนะแนวการศึกษาต่อ'
      },
      {
        mentorName: 'สว่างแดนดิน',
        partnerName: 'ลำปลาหางวิทยา',
        focus: 'โรงเรียนพี่เลี้ยงคู่พัฒนา (Mentorship Partner) ใช้ทรัพยากรร่วม (120 คน)'
      },
      {
        mentorName: 'สว่างแดนดิน',
        partnerName: 'บงเหนือวิทยาคม',
        focus: 'หนุนเสริมหลักสูตรทวิศึกษาและส่งต่อสายอาชีพ'
      },
      {
        mentorName: 'พังโคนวิทยาคม',
        partnerName: 'เทพสวัสดิ์วิทยา',
        focus: 'เกลี่ยอัตรากำลังครูหมุนเวียนและสื่อ OBEC Center (124 คน)'
      },
      {
        mentorName: 'พังโคนวิทยาคม',
        partnerName: 'ช้างมิ่งพิทยานุกูล',
        focus: 'เครือข่ายห้องเรียนสะเต็มศึกษา (STEM Synergy)'
      },
      {
        mentorName: 'มัธยมวานรนิวาส',
        partnerName: 'ท่าสงครามวิทยา',
        focus: 'พัฒนาคุณภาพการศึกษาคู่ขนานลุ่มน้ำอูน (146 คน)'
      },
      {
        mentorName: 'อากาศอำนวยศึกษา',
        partnerName: 'โพนงามศึกษา',
        focus: 'แลกเปลี่ยนครูวิชาเอกคณิตศาสตร์และวิทยาศาสตร์'
      }
    ];

    synergyPairs.forEach(pair => {
      const c1 = SCHOOL_COORDINATES[pair.mentorName];
      const c2 = SCHOOL_COORDINATES[pair.partnerName];
      if (c1 && c2) {
        const latlng1 = [c1.lat, c1.lng];
        const latlng2 = [c2.lat, c2.lng];
        // Draw dashed synergy line
        const polyline = L.polyline([latlng1, latlng2], {
          color: '#c28e38',
          weight: 3.5,
          opacity: 0.85,
          dashArray: '8, 8',
          lineCap: 'round'
        }).addTo(gisMap);

        const mSch = DASHBOARD_DATA.find(s => s.name === pair.mentorName);
        const pSch = DASHBOARD_DATA.find(s => s.name === pair.partnerName);

        const distKm = (gisMap.distance(latlng1, latlng2) / 1000).toFixed(1);

        polyline.bindPopup(`
          <div style="font-family: 'Sarabun'; padding: 6px; min-width: 220px;">
            <div style="font-size: 13px; font-weight: 700; color: #1e3a8a; border-bottom: 2px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 6px;">
              🔗 พันธมิตรโรงเรียนคุณภาพคู่พัฒนา (Synergy)
            </div>
            <div style="font-size: 12px; margin-bottom: 3px;">
              🏛️ <strong>รร. พี่เลี้ยง:</strong> ${pair.mentorName} (${mSch && mSch.y69_2 ? mSch.y69_2.total.total.toLocaleString() : '-'} คน)
            </div>
            <div style="font-size: 12px; margin-bottom: 3px;">
              🤝 <strong>รร. คู่พัฒนา:</strong> ${pair.partnerName} (${pSch && pSch.y69_2 ? pSch.y69_2.total.total.toLocaleString() : '-'} คน)
            </div>
            <div style="font-size: 11.5px; color: #64748b; margin-bottom: 4px;">
              📏 <strong>ระยะทางห่างกัน:</strong> ${distKm} กิโลเมตร
            </div>
            <div style="font-size: 11.5px; background: #f8fafc; border: 1px solid #e2e8f0; padding: 6px; border-radius: 4px; color: #334155;">
              🎯 <strong>จุดเน้นความร่วมมือ:</strong> ${pair.focus}
            </div>
          </div>
        `);

        synergyLayers.push(polyline);
      }
    });
  }

  /* ==========================================================================
     MODULE 12: AI EXECUTIVE POLICY COPILOT (DUAL-ENGINE: GEMINI AI + DMC ENGINE)
     ========================================================================== */
  function initAiCopilotModule() {
    const btnOpen = document.getElementById('btnOpenCopilot');
    const modal = document.getElementById('copilotModal');
    const btnClose = document.getElementById('btnCloseCopilot');
    const form = document.getElementById('copilotForm');
    const input = document.getElementById('copilotInput');
    const msgBox = document.getElementById('copilotMessages');
    const chips = document.querySelectorAll('#copilotChipsBar .copilot-chip');

    // Security Gate Elements (Passcode 6547)
    const COPILOT_PASSCODE = '6547';
    const authModal = document.getElementById('copilotAuthModal');
    const authCard = document.getElementById('copilotSecurityGateCard');
    const pinInput = document.getElementById('copilotPinInput');
    const btnSubmitPin = document.getElementById('btnSubmitCopilotPin');
    const btnCancelPin = document.getElementById('btnCancelCopilotPin');
    const pinErrorMsg = document.getElementById('copilotPinErrorMsg');
    const btnLockCopilot = document.getElementById('btnLockCopilot');

    // Gemini Settings Elements
    const btnToggleSettings = document.getElementById('btnToggleCopilotSettings');
    const btnOpenSettings = document.getElementById('btnOpenApiKeySettings');
    const settingsPanel = document.getElementById('copilotSettingsPanel');
    const btnCloseSettings = document.getElementById('btnCloseSettingsPanel');
    const keyInput = document.getElementById('copilotApiKeyInput');
    const btnToggleVis = document.getElementById('btnToggleKeyVisibility');
    const btnSaveKey = document.getElementById('btnSaveApiKey');
    const btnClearKey = document.getElementById('btnClearApiKey');
    const statusDot = document.getElementById('copilotStatusDot');
    const statusText = document.getElementById('copilotStatusText');

    if (!btnOpen || !modal || !form || !input || !msgBox) return;

    function openCopilotAuthModal() {
      if (!authModal) return;
      authModal.style.display = 'flex';
      if (pinInput) {
        pinInput.value = '';
        setTimeout(() => pinInput.focus(), 120);
      }
      if (pinErrorMsg) pinErrorMsg.style.display = 'none';
      if (authCard) authCard.classList.remove('shake');
    }

    function closeCopilotAuthModal() {
      if (authModal) authModal.style.display = 'none';
      if (pinInput) pinInput.value = '';
      if (pinErrorMsg) pinErrorMsg.style.display = 'none';
    }

    function unlockAndOpenCopilot() {
      closeCopilotAuthModal();
      modal.style.display = 'flex';
      setTimeout(() => input.focus(), 150);
    }

    function handleCopilotPinSubmit() {
      const enteredPin = pinInput ? pinInput.value.trim() : '';
      if (enteredPin === COPILOT_PASSCODE) {
        if (pinInput) pinInput.value = '';
        if (pinErrorMsg) pinErrorMsg.style.display = 'none';
        unlockAndOpenCopilot();
      } else {
        if (pinErrorMsg) pinErrorMsg.style.display = 'block';
        if (authCard) {
          authCard.classList.add('shake');
          setTimeout(() => authCard.classList.remove('shake'), 400);
        }
        if (pinInput) {
          pinInput.value = '';
          pinInput.focus();
        }
      }
    }

    let chatHistory = [];
    const STORAGE_KEY = 'dmc_gemini_api_key';

    // Check saved API key on init
    function getSavedApiKey() {
      try {
        return localStorage.getItem(STORAGE_KEY) || '';
      } catch (e) {
        return '';
      }
    }

    function updateEngineStatusUI() {
      const key = getSavedApiKey();
      if (key && key.trim().length > 10) {
        if (statusDot) {
          statusDot.className = 'status-dot online';
        }
        if (statusText) {
          statusText.innerHTML = 'โหมด: 🟢 <strong>Google Gemini AI</strong> (ตอบได้ทุกเรื่อง & เจาะลึกฐาน DMC)';
        }
        if (btnOpenSettings) {
          btnOpenSettings.textContent = '⚙️ ตั้งค่าคีย์';
          btnOpenSettings.className = 'btn-setup-gemini active-mode';
        }
        if (keyInput) {
          keyInput.value = key;
        }
      } else {
        if (statusDot) {
          statusDot.className = 'status-dot offline';
        }
        if (statusText) {
          statusText.innerHTML = 'โหมด: ⚪ <strong>Smart Offline Engine</strong> (วิเคราะห์ฐาน DMC 45 ร.ร.)';
        }
        if (btnOpenSettings) {
          btnOpenSettings.textContent = '⚡ เชื่อมต่อ Gemini AI';
          btnOpenSettings.className = 'btn-setup-gemini';
        }
        if (keyInput) {
          keyInput.value = '';
        }
      }
    }

    updateEngineStatusUI();

    // Toggle Settings Panel
    function toggleSettings(show) {
      if (!settingsPanel) return;
      const willShow = typeof show === 'boolean' ? show : (settingsPanel.style.display === 'none');
      settingsPanel.style.display = willShow ? 'block' : 'none';
      if (willShow && keyInput) {
        keyInput.value = getSavedApiKey();
        keyInput.focus();
      }
    }

    if (btnToggleSettings) btnToggleSettings.addEventListener('click', () => toggleSettings());
    if (btnOpenSettings) btnOpenSettings.addEventListener('click', () => toggleSettings());
    if (btnCloseSettings) btnCloseSettings.addEventListener('click', () => toggleSettings(false));

    // Toggle key visibility
    if (btnToggleVis && keyInput) {
      btnToggleVis.addEventListener('click', () => {
        keyInput.type = keyInput.type === 'password' ? 'text' : 'password';
      });
    }

    // Save API key
    if (btnSaveKey && keyInput) {
      btnSaveKey.addEventListener('click', () => {
        const val = keyInput.value.trim();
        if (!val) {
          alert('กรุณากรอก Google Gemini API Key');
          return;
        }
        try {
          localStorage.setItem(STORAGE_KEY, val);
          updateEngineStatusUI();
          toggleSettings(false);
          addMessage('bot', `
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 10px; border-radius: 8px; color: #166534; font-size: 12.5px;">
              ✅ <strong>เชื่อมต่อ Google Gemini AI เรียบร้อยแล้ว!</strong><br>
              ตอนนี้ AI Executive Copilot พร้อมตอบคำถามได้ทุกอย่าง ทุกหัวข้อ ไม่ว่าจะเป็นการวิเคราะห์ข้อมูล DMC, การกำหนดนโยบายการศึกษา, ร่างสปีช หรือคำถามทั่วไปในโลก เชิญพิมพ์สอบถามได้เลยครับ! 🚀
            </div>
          `);
        } catch (e) {
          alert('ไม่สามารถบันทึกคีย์ลงใน LocalStorage ได้: ' + e.message);
        }
      });
    }

    // Clear API key
    if (btnClearKey) {
      btnClearKey.addEventListener('click', () => {
        try {
          localStorage.removeItem(STORAGE_KEY);
          if (keyInput) keyInput.value = '';
          updateEngineStatusUI();
          toggleSettings(false);
          addMessage('bot', `
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px; border-radius: 8px; color: #475569; font-size: 12.5px;">
              ℹ️ <strong>กลับสู่โหมด Smart Offline Engine</strong><br>
              ระบบจะตอบคำถามวิเคราะห์สถิติ 45 โรงเรียน และยุทธศาสตร์ 5 เสาหลักตามฐานข้อมูลในระบบตามปกติครับ
            </div>
          `);
        } catch (e) {
          console.error(e);
        }
      });
    }

    // Open Copilot protected by Passcode 6547
    const menuAiCopilot = document.getElementById('menuAiCopilot');
    if (menuAiCopilot) {
      menuAiCopilot.addEventListener('click', (e) => {
        e.preventDefault();
        openCopilotAuthModal();
      });
    }

    btnOpen.addEventListener('click', () => {
      openCopilotAuthModal();
    });

    if (btnSubmitPin) {
      btnSubmitPin.addEventListener('click', handleCopilotPinSubmit);
    }

    if (btnCancelPin) {
      btnCancelPin.addEventListener('click', closeCopilotAuthModal);
    }

    if (pinInput) {
      pinInput.addEventListener('input', () => {
        const val = pinInput.value.trim();
        if (val.length === 4) {
          handleCopilotPinSubmit();
        }
      });
      pinInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleCopilotPinSubmit();
        }
      });
    }

    if (authModal) {
      authModal.addEventListener('click', (e) => {
        if (e.target === authModal) closeCopilotAuthModal();
      });
    }

    if (btnLockCopilot) {
      btnLockCopilot.addEventListener('click', () => {
        modal.style.display = 'none';
      });
    }

    btnClose.addEventListener('click', () => {
      modal.style.display = 'none';
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.style.display = 'none';
    });

    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        const prompt = chip.getAttribute('data-prompt');
        if (prompt) {
          handleUserQuery(prompt);
        }
      });
    });

    // Clear Chat History Button & Copy Buttons
    const btnClearChat = document.getElementById('btnClearChatHistory');

    function bindCopyButtons(container) {
      if (!container) return;
      container.querySelectorAll('.btn-copy-bubble').forEach(btn => {
        if (btn.dataset.bound) return;
        btn.dataset.bound = 'true';
        btn.addEventListener('click', () => {
          const card = btn.closest('.copilot-msg-card');
          const content = card ? card.querySelector('.msg-content') : null;
          if (content) {
            navigator.clipboard.writeText(content.innerText).then(() => {
              btn.textContent = '✓ คัดลอกแล้ว';
              btn.classList.add('copied');
              setTimeout(() => {
                btn.textContent = '📋 คัดลอก';
                btn.classList.remove('copied');
              }, 2000);
            }).catch(() => {
              btn.textContent = '✓ คัดลอกแล้ว';
            });
          }
        });
      });
    }

    bindCopyButtons(msgBox);

    if (btnClearChat) {
      btnClearChat.addEventListener('click', () => {
        chatHistory = [];
        msgBox.innerHTML = `
          <div class="copilot-msg bot">
            <div class="copilot-msg-card">
              <div class="copilot-msg-header">
                <div class="copilot-msg-author">
                  <span class="copilot-bot-sparkle">✨</span>
                  <strong>AI Executive Copilot</strong>
                  <span class="copilot-engine-tag">DMC Engine</span>
                </div>
                <button type="button" class="btn-copy-bubble" title="คัดลอกข้อความ">📋 คัดลอก</button>
              </div>
              <div class="msg-content">
                สวัสดีครับท่านผู้อำนวยการและคณะทำงาน สพม.สกลนคร! 🙏 ผมคือ <strong>AI Executive Policy Copilot</strong> ผู้ช่วยสังเคราะห์ข้อมูลสารสนเทศทางการศึกษา<br><br>
                ล้างประวัติการสนทนาเรียบร้อยแล้วครับ เชิญพิมพ์คำถามเชิงนโยบายเพื่อเริ่มการวิเคราะห์ใหม่ได้ทันทีครับ!
              </div>
            </div>
          </div>
        `;
        bindCopyButtons(msgBox);
      });
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) return;
      input.value = '';
      handleUserQuery(text);
    });

    function addMessage(sender, text) {
      const msgDiv = document.createElement('div');
      msgDiv.className = `copilot-msg ${sender}`;
      if (sender === 'user') {
        msgDiv.innerHTML = `<div class="user-bubble">${text}</div>`;
      } else {
        const engineLabel = getSavedApiKey() ? 'Gemini 1.5' : 'DMC Intelligence';
        msgDiv.innerHTML = `
          <div class="copilot-msg-card">
            <div class="copilot-msg-header">
              <div class="copilot-msg-author">
                <span class="copilot-bot-sparkle">✨</span>
                <strong>AI Executive Copilot</strong>
                <span class="copilot-engine-tag">${engineLabel}</span>
              </div>
              <button type="button" class="btn-copy-bubble" title="คัดลอกข้อความ">📋 คัดลอก</button>
            </div>
            <div class="msg-content">${text}</div>
          </div>
        `;
        bindCopyButtons(msgDiv);
      }
      msgBox.appendChild(msgDiv);
      msgBox.scrollTop = msgBox.scrollHeight;
      return msgDiv;
    }

    function showTypingIndicator(label) {
      const typingDiv = document.createElement('div');
      typingDiv.className = 'copilot-msg bot typing-msg';
      typingDiv.id = 'copilotTypingIndicator';
      typingDiv.innerHTML = `
        <div class="copilot-msg-card" style="padding: 10px 14px; background: rgba(255, 255, 255, 0.95);">
          <div style="color: #64748b; font-size: 12px; display: flex; align-items: center; gap: 8px;">
            <div class="typing-dots"><span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span></div>
            <span>${label || 'กำลังคิดและสังเคราะห์คำตอบเชิงนโยบาย...'}</span>
          </div>
        </div>
      `;
      msgBox.appendChild(typingDiv);
      msgBox.scrollTop = msgBox.scrollHeight;
      return typingDiv;
    }

    function removeTypingIndicator() {
      const el = document.getElementById('copilotTypingIndicator');
      if (el) el.remove();
    }

    function formatMarkdown(text) {
      if (!text) return '';
      let out = text;

      // Tables
      if (out.includes('|')) {
        const lines = out.split('\n');
        let inTable = false;
        let tableHtml = '';
        let newLines = [];
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (line.startsWith('|') && line.endsWith('|')) {
            if (!inTable) {
              inTable = true;
              tableHtml = '<table class="copilot-markdown-table">';
            }
            if (line.includes('---')) {
              continue;
            }
            const cells = line.split('|').slice(1, -1);
            const isHeader = !tableHtml.includes('<tbody>') && !tableHtml.includes('<tr>');
            if (isHeader) {
              tableHtml += '<thead><tr>' + cells.map(c => `<th>${c.trim()}</th>`).join('') + '</tr></thead><tbody>';
            } else {
              tableHtml += '<tr>' + cells.map(c => `<td>${c.trim()}</td>`).join('') + '</tr>';
            }
          } else {
            if (inTable) {
              inTable = false;
              tableHtml += '</tbody></table>';
              newLines.push(tableHtml);
              tableHtml = '';
            }
            newLines.push(lines[i]);
          }
        }
        if (inTable) {
          tableHtml += '</tbody></table>';
          newLines.push(tableHtml);
        }
        out = newLines.join('\n');
      }

      // Headings
      out = out.replace(/^### (.*?)$/gm, '<h4 style="margin: 8px 0 4px; color: #1e3a8a; font-size: 13.5px; font-weight: 700;">$1</h4>');
      out = out.replace(/^## (.*?)$/gm, '<h3 style="margin: 10px 0 6px; color: #1e3a8a; font-size: 14.5px; font-weight: 700;">$1</h3>');
      // Bold & Italic
      out = out.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      out = out.replace(/\*(.*?)\*/g, '<em>$1</em>');
      // Lists
      out = out.replace(/^\s*[\*\-]\s+(.*?)$/gm, '<div style="margin-left: 8px; margin-bottom: 3px;">• $1</div>');
      out = out.replace(/^\s*(\d+)\.\s+(.*?)$/gm, '<div style="margin-left: 8px; margin-bottom: 3px;"><strong>$1.</strong> $2</div>');
      // Line breaks
      out = out.replace(/\n\n/g, '<br><br>').replace(/\n/g, '<br>');
      return out;
    }

    function buildDmcGroundingContext() {
      if (typeof DASHBOARD_DATA === 'undefined') return '';
      let summary = `ข้อมูลสารสนเทศทางการศึกษา สพม.สกลนคร (สำนักงานเขตพื้นที่การศึกษามัธยมศึกษาสกลนคร):\n`;
      summary += `- ดูแล 45 โรงเรียนมัธยมศึกษา ใน 18 อำเภอ แบ่งเป็น 8 สหวิทยาเขต\n`;
      summary += `- ไทม์ไลน์ 5 รอบเวลา (ปี 2568-2569): 2568/1 (45,403 คน), 2568/2 (45,047 คน), 2568/สิ้นปี (44,808 คน), 2569/1 (44,818 คน), 2569/2 (44,566 คน รวม 1,392 ห้อง)\n`;
      summary += `- สถิติล่าสุด (2/2569): ม.ต้น 24,002 คน, ม.ปลาย 20,564 คน, อัตราคงอยู่ 99.44% (-252 คน ระหว่างเทอม)\n`;
      summary += `- งบประมาณเงินอุดหนุนรายหัว สพฐ. 179.63 ล้านบาท (ม.ต้น 3,800 บ./คน = 91.21 ลบ., ม.ปลาย 4,300 บ./คน = 88.43 ลบ.)\n`;
      summary += `- เกณฑ์ขนาดสถานศึกษา สพฐ. ล่าสุด (พ.ค. 2569): เล็ก (<=119 คน มี 0 รร.), กลาง (120-719 คน มี 26 รร.), ใหญ่ (720-1,679 คน มี 10 รร.), ใหญ่พิเศษ (>=1,680 คน มี 9 รร.)\n`;
      summary += `- 3 โรงเรียนเปราะบางต่ำกว่า 150 คน: ลำปลาหางวิทยา (120 คน), เทพสวัสดิ์วิทยา (124 คน), ท่าสงครามวิทยา (146 คน)\n`;
      summary += `- โรงเรียนสุขภาวะยอดเยี่ยมเกรด AAA 5 อันดับแรก: บ้านม่วงพิทยาคม (94.4), พังโคนวิทยาคม (93.3), คำตากล้าราชประชาสงเคราะห์ (93.3), พรรณาวุฒาจารย์ (93.0), อากาศอำนวยศึกษา (93.0)\n\n`;
      summary += `ตารางสรุป 45 โรงเรียน (เทอมล่าสุด 2/2569):\n`;
      
      DASHBOARD_DATA.forEach((s, idx) => {
        const total = s.y69_2?.total?.total || 0;
        const rooms = s.y69_2?.total?.rooms || 0;
        const diff = total - (s.y69_1?.total?.total || 0);
        const proj = s.project ? ` [โครงการ: ${s.project}]` : '';
        const dist = s.distanceKm ? ` [ห่างเขต ${s.distanceKm} กม.]` : '';
        const tel = s.tel ? ` [โทร ${s.tel}]` : '';
        summary += `${idx+1}. ${s.name} | ต.${s.tambon || ''} อ.${s.amphoe} | ${s.cluster} | นักเรียน ${total} คน | ${rooms} ห้อง | เทอมล่าสุด ${diff >= 0 ? '+' : ''}${diff} คน${dist}${proj}${tel}\n`;
      });
      return summary;
    }

    async function callGeminiApi(userPrompt, apiKey) {
      const grounding = buildDmcGroundingContext();
      const systemInstruction = `คุณคือ 'AI Executive Policy Copilot' ผู้ช่วยอัจฉริยะและที่ปรึกษาเชิงยุทธศาสตร์ระดับสูงของ ผู้อำนวยการสำนักงานเขตพื้นที่การศึกษามัธยมศึกษาสกลนคร (ผอ.สพม.สกลนคร)
บุคลิกภาพ: สุภาพ มืออาชีพ ลึกซึ้ง มีวิสัยทัศน์ในการบริหารจัดการศึกษา อ้างอิงตัวเลขสถิติอย่างแม่นยำ และจัดรูปแบบคำตอบด้วย Markdown (หัวข้อย่อย, ตัวหนา, bullet points, อิโมจิ) ให้อ่านง่าย สบายตา
ขอบเขต: คุณสามารถตอบคำถามได้ทุกอย่าง ทุกหัวข้อ ไม่จำกัด! ไม่ว่าจะเป็นการวิเคราะห์ข้อมูล DMC, การกำหนดนโยบายการศึกษา, ระเบียบ สพฐ./ก.ค.ศ./ศธ., ร่างสปีชเปิดงานประชุม/หนังสือราชการ, หรือคำถามทั่วไป สาระความรู้ เทคโนโลยี การบริหารจัดการ ฯลฯ

ฐานข้อมูลทางการ DMC ของ สพม.สกลนคร (45 โรงเรียน 5 รอบเวลา 2568-2569):
${grounding}`;

      // Take last 8 turns of history
      const contents = chatHistory.slice(-8).map(h => ({
        role: h.role,
        parts: [{ text: h.text }]
      }));
      contents.push({
        role: 'user',
        parts: [{ text: userPrompt }]
      });

      const payload = {
        contents: contents,
        systemInstruction: {
          parts: [{ text: systemInstruction }]
        },
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048
        }
      };

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`;

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson?.error?.message || `HTTP ${res.status}`);
      }

      const data = await res.json();
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!reply) throw new Error('ไม่พบคำตอบจาก Gemini API');

      chatHistory.push({ role: 'user', text: userPrompt });
      chatHistory.push({ role: 'model', text: reply });

      return reply;
    }

    async function handleUserQuery(query) {
      addMessage('user', query);

      const apiKey = getSavedApiKey();

      if (apiKey && apiKey.trim().length > 10) {
        showTypingIndicator('Gemini AI กำลังคิดและประมวลผลคำตอบ...');
        try {
          const geminiReply = await callGeminiApi(query, apiKey.trim());
          removeTypingIndicator();
          addMessage('bot', formatMarkdown(geminiReply));
        } catch (err) {
          removeTypingIndicator();
          console.warn('Gemini API Error, falling back to local engine:', err);
          const fallbackAns = generateExecutiveAnswer(query);
          addMessage('bot', `
            <div style="font-size: 11.5px; color: #b91c1c; background: #fef2f2; border: 1px solid #fecaca; padding: 6px 10px; border-radius: 6px; margin-bottom: 8px;">
              ⚠️ <strong>การเชื่อมต่อ Gemini AI ขัดข้อง:</strong> ${err.message}<br>
              <em>ระบบเปลี่ยนมาตอบด้วย Smart Local Engine อัตโนมัติ:</em>
            </div>
            ${fallbackAns}
          `);
        }
      } else {
        // Local engine mode
        showTypingIndicator('กำลังวิเคราะห์ฐานข้อมูล DMC...');
        setTimeout(() => {
          removeTypingIndicator();
          const response = generateExecutiveAnswer(query);
          const tip = `
            ${response}
            <div style="margin-top: 10px; padding-top: 8px; border-top: 1px dashed #cbd5e1; font-size: 11px; color: #64748b;">
              💡 <em>ต้องการให้ Copilot ตอบคำถามได้ทุกอย่างในโลก หรือช่วยร่างสปีช/หนังสือราชการ? 
              <a href="#" class="inline-open-settings" style="color: #2563eb; text-decoration: underline; font-weight: 600;">คลิกเชื่อมต่อ Gemini AI ฟรีที่นี่</a></em>
            </div>
          `;
          const msgEl = addMessage('bot', tip);
          const link = msgEl.querySelector('.inline-open-settings');
          if (link) {
            link.addEventListener('click', (e) => {
              e.preventDefault();
              toggleSettings(true);
            });
          }
        }, 350);
      }
    }

        function generateExecutiveAnswer(q) {
      const lower = q.toLowerCase().trim();
      const cleanQ = lower.replace(/รร\.|โรงเรียน/g, ' ').replace(/วิเคราะห์|ข้อมูล|สถิติ/g, ' ').trim();
      const words = cleanQ.split(/[\s,]+/).filter(w => w.length >= 3);

      // 1. Identity, Greetings, Help & Capabilities
      const greetings = ['คุณคือใคร', 'คุณเป็นใคร', 'ใครคือคุณ', 'ใครนะ', 'ผู้ช่วย', 'สวัสดี', 'hello', 'hi', 'ทำอะไรได้บ้าง', 'ช่วยอะไรได้', 'ความสามารถ', 'แนะนำตัว', 'copilot'];
      if (greetings.some(g => lower.includes(g))) {
        return `
          🤖 <strong>สวัสดีครับท่านผู้บริหาร! กระผมคือ AI Executive Policy Copilot</strong><br>
          ผู้ช่วยอัจฉริยะสังเคราะห์สารสนเทศทางการศึกษา ประจำสำนักงานเขตพื้นที่การศึกษามัธยมศึกษาสกลนคร (สพม.สกลนคร) ขับเคลื่อนด้วยคลังข้อมูลสถิติ DMC เชิงลึก 5 รอบเวลา (ปี 2568 - 2569) ครอบคลุมทั้ง 45 สถานศึกษา<br><br>
          🎯 <strong>ภารกิจและความสามารถหลักที่ท่านสามารถเรียกใช้ได้ทันที:</strong><br>
          • <strong>เจาะลึก 8 สหวิทยาเขต:</strong> พิมพ์ เช่น <em>"สหวิทยาเขตสกลราช"</em> หรือ <em>"สหวิทยาเขตดำรงธรรม"</em> เพื่อดูรายชื่อโรงเรียนและสถิตินักเรียนในสังกัด<br>
          • <strong>วิเคราะห์รายโรงเรียน:</strong> พิมพ์ เช่น <em>"วิเคราะห์ รร.สกลราช"</em> หรือ <em>"รร.คำเพิ่ม"</em> เพื่อดูสถิตินักเรียน ความหนาแน่นห้องเรียน และข้อเสนอเชิงนโยบาย<br>
          • <strong>คัดกรองตามอำเภอ:</strong> พิมพ์ เช่น <em>"อำเภอเมือง"</em> หรือ <em>"อ.พังโคน"</em> เพื่อดูโรงเรียนในพื้นที่<br>
          • <strong>วิเคราะห์ตามขนาด:</strong> พิมพ์ <em>"โรงเรียนขนาดใหญ่พิเศษ"</em> หรือ <em>"ขนาดกลาง"</em> ตามเกณฑ์ สพฐ.<br>
          • <strong>Zero Dropout & กลุ่มเสี่ยง:</strong> พิมพ์ <em>"กลุ่มเสี่ยงหลุด"</em> หรือ <em>"สุขภาวะ"</em> เพื่อดูดัชนีเฝ้าระวัง<br>
          • <strong>งบประมาณ & ไทม์ไลน์ 5 รอบ:</strong> พิมพ์ <em>"งบประมาณ"</em> หรือ <em>"ไทม์ไลน์ 5 รอบ"</em><br>
          • <strong>เส้นทางตรวจเยี่ยม:</strong> พิมพ์ <em>"เส้นทางตรวจเยี่ยม"</em> เพื่อดูระบบ Route Planner<br>
          💡 <em>หากเชื่อมต่อ Gemini AI ฟรี จะสามารถสั่งร่างสุนทรพจน์หรือหนังสือราชการได้แบบไร้ขีดจำกัดครับ!</em>
        `;
      }

      // 2. Specific Cluster Queries (สหวิทยาเขตทั้ง 8 แห่ง)
      if (typeof DASHBOARD_DATA !== 'undefined') {
        const clusterNames = [
          'สหวิทยาเขตสกลราช',
          'สหวิทยาเขตดำรงธรรม',
          'สหวิทยาเขตพระธาตุนารายณ์เจงเวง',
          'สหวิทยาเขตลุ่มน้ำอูน',
          'สหวิทยาเขตสว่างศึกษา',
          'สหวิทยาเขตเทพทวีพัฒน์',
          'สหวิทยาเขตเบญจพัฒน์',
          'สหวิทยาเขตเบญจรักษ์'
        ];

        // Check if asking for a specific cluster
        for (const cName of clusterNames) {
          const shortC = cName.replace('สหวิทยาเขต', '');
          if (lower.includes(cName.toLowerCase()) || (lower.includes(shortC.toLowerCase()) && (lower.includes('สหวิทยาเขต') || lower.includes('เขต') || lower.includes('กลุ่ม')))) {
            const clusterSchools = DASHBOARD_DATA.filter(s => s.cluster === cName);
            const totalStd = clusterSchools.reduce((sum, s) => sum + (s.y69_2?.total?.total || 0), 0);
            const totalRooms = clusterSchools.reduce((sum, s) => sum + (s.y69_2?.total?.rooms || 0), 0);
            const avgDensity = totalRooms > 0 ? (totalStd / totalRooms).toFixed(1) : 0;

            const schoolListHtml = clusterSchools.map((s, idx) => {
              const std = s.y69_2?.total?.total || 0;
              const rms = s.y69_2?.total?.rooms || 0;
              const sz = getSchoolSize(std);
              return `${idx + 1}. <strong>${s.name}</strong> (อ.${s.amphoe}) - <strong>${std.toLocaleString()} คน</strong> (${rms} ห้อง, ไซส์ ${sz})`;
            }).join('<br>');

            return `
              🏛️ <strong>สารสนเทศ ${cName}:</strong><br>
              • <strong>จำนวนสถานศึกษา:</strong> ${clusterSchools.length} โรงเรียน<br>
              • <strong>ประชากรนักเรียนรวม (2/2569):</strong> <strong>${totalStd.toLocaleString()} คน</strong> (${totalRooms} ห้องเรียน)<br>
              • <strong>ความหนาแน่นเฉลี่ย:</strong> ${avgDensity} คน/ห้อง<br><br>
              📋 <strong>รายชื่อโรงเรียนในสังกัด:</strong><br>
              ${schoolListHtml}<br><br>
              💡 <strong>ข้อเสนอแนะเชิงพื้นที่:</strong> ควรสื่อสารร่วมมือผ่านประธานสหวิทยาเขตเพื่อบูรณาการใช้ทรัพยากรครูและห้องปฏิบัติการร่วมกัน (Cluster Mentorship Model)
            `;
          }
        }

        // Check if asking for all clusters
        if (lower.includes('สหวิทยาเขต') && (lower.includes('กี่') || lower.includes('อะไรบ้าง') || lower.includes('ทั้งหมด') || lower.includes('รายชื่อ') || lower.includes('มีอะไร'))) {
          const clusterSummary = clusterNames.map((cName, idx) => {
            const scs = DASHBOARD_DATA.filter(s => s.cluster === cName);
            const std = scs.reduce((sum, s) => sum + (s.y69_2?.total?.total || 0), 0);
            return `${idx + 1}. <strong>${cName}</strong> (${scs.length} โรงเรียน, นักเรียน ${std.toLocaleString()} คน)`;
          }).join('<br>');

          return `
            🌐 <strong>โครงสร้าง 8 สหวิทยาเขต สพม.สกลนคร:</strong><br>
            ครอบคลุม 45 โรงเรียนมัธยมศึกษาใน 18 อำเภอ ดังนี้:<br><br>
            ${clusterSummary}<br><br>
            👉 <em>ท่านสามารถพิมพ์ชื่อสหวิทยาเขตเฉพาะ เช่น "สหวิทยาเขตสกลราช" เพื่อเจาะลึกรายชื่อโรงเรียนได้ทันทีครับ</em>
          `;
        }
      }

      // 3. District Queries (อำเภอทั้ง 18 แห่ง)
      if (typeof DASHBOARD_DATA !== 'undefined' && (lower.includes('อำเภอ') || lower.includes(' อ.') || lower.startsWith('อ.'))) {
        const amphoes = [...new Set(DASHBOARD_DATA.map(s => s.amphoe))];
        for (const amp of amphoes) {
          if (lower.includes(amp.toLowerCase())) {
            const ampSchools = DASHBOARD_DATA.filter(s => s.amphoe === amp);
            const totalStd = ampSchools.reduce((sum, s) => sum + (s.y69_2?.total?.total || 0), 0);
            const listHtml = ampSchools.map((s, i) => `${i + 1}. <strong>${s.name}</strong> (${(s.y69_2?.total?.total || 0).toLocaleString()} คน, ${s.cluster})`).join('<br>');
            return `
              📍 <strong>สารสนเทศสถานศึกษา อ.${amp}:</strong><br>
              • <strong>จำนวนโรงเรียน:</strong> ${ampSchools.length} แห่ง<br>
              • <strong>นักเรียนรวม:</strong> ${totalStd.toLocaleString()} คน<br><br>
              📋 <strong>รายชื่อโรงเรียน:</strong><br>
              ${listHtml}
            `;
          }
        }
      }

      // 4. Specific School Query (Robust fuzzy search)
      if (typeof DASHBOARD_DATA !== 'undefined') {
        let matchedSchool = null;

        // Exact match with full name or shortName
        matchedSchool = DASHBOARD_DATA.find(s => 
          cleanQ.includes(s.name.toLowerCase()) || 
          (s.shortName && cleanQ.includes(s.shortName.toLowerCase()))
        );

        // Substring / keyword match
        if (!matchedSchool && words.length > 0) {
          let maxScore = 0;
          for (const s of DASHBOARD_DATA) {
            const sName = s.name.toLowerCase();
            const sShort = (s.shortName || '').toLowerCase();
            for (const w of words) {
              if (sName.includes(w) || (sShort && sShort.includes(w))) {
                if (w.length > maxScore) {
                  maxScore = w.length;
                  matchedSchool = s;
                }
              }
            }
          }
        }

        if (matchedSchool) {
          const s = matchedSchool;
          const std = s.y69_2?.total?.total || 0;
          const rooms = s.y69_2?.total?.rooms || 0;
          const ratio = rooms > 0 ? (std / rooms).toFixed(1) : 0;
          const drop = (s.y69_2?.total?.total || 0) - (s.y69_1?.total?.total || 0);
          const size = getSchoolSize(std);

          return `
            📌 <strong>บทวิเคราะห์สารสนเทศ: ${s.name}</strong><br>
            • <strong>สังกัด:</strong> ${s.cluster || 'ทั่วไป'} (อ.${s.amphoe || ''})<br>
            • <strong>ขนาดสถานศึกษา:</strong> ขนาด ${size} (${std < 120 ? 'เล็ก' : size === 'M' ? 'กลาง' : size === 'L' ? 'ใหญ่' : 'ใหญ่พิเศษ'})<br>
            • <strong>จำนวนนักเรียนล่าสุด (2/2569):</strong> <strong>${std.toLocaleString()} คน</strong> (${rooms} ห้องเรียน)<br>
            • <strong>ความหนาแน่นเฉลี่ย:</strong> ${ratio} คน/ห้อง ${ratio > 36 ? '⚠️ (ค่อนข้างแออัด)' : '✅ (ได้มาตรฐาน)'}<br>
            • <strong>อัตราเปลี่ยนแปลงระหว่างเทอม:</strong> ${drop >= 0 ? '+' : ''}${drop} คน (${drop < 0 ? 'เฝ้าระวัง Zero Dropout' : 'ยอดคงที่/เพิ่มขึ้น'})<br>
            💡 <strong>ข้อเสนอแนะเชิงนโยบาย:</strong> ${
              ratio > 36 ? 'ควรพิจารณาปรับแผนรับนักเรียน ม.1/ม.4 ปี 2570 เพื่อลดความแออัดของห้องเรียนให้อยู่ในเกณฑ์ 32-35 คน/ห้อง' :
              std < 150 ? 'จัดเป็นสถานศึกษาเปราะบาง ควรนำโมเดลโรงเรียนคุณภาพคู่พัฒนา (Mentorship) เข้ามาร่วมแชร์ทรัพยากร' :
              'ผลการดำเนินงานอยู่ในเกณฑ์มาตรฐาน รักษาเสถียรภาพและคุณภาพการเรียนรู้ต่อเนื่อง'
            }
          `;
        }
      }

      // 5. School Sizes Breakdown (สพฐ.)
      if (lower.includes('ขนาด') || lower.includes('เปราะบาง') || lower.includes('xl') || lower.includes('ไซส์')) {
        return `
          🏫 <strong>สถานการณ์ขนาดโรงเรียนตามเกณฑ์ สพฐ. ล่าสุด (พฤษภาคม 2569):</strong><br>
          • <strong>ขนาดเล็ก (≤ 119 คน):</strong> 0 โรงเรียนในเทอม 2/69 (รร.ลำปลาหางวิทยา มี 120 คน ขยับขึ้นขนาดกลางพอดี)<br>
          • <strong>ขนาดกลาง (120 - 719 คน):</strong> 26 โรงเรียน (9,320 คน)<br>
          • <strong>ขนาดใหญ่ (720 - 1,679 คน):</strong> 10 โรงเรียน (11,964 คน)<br>
          • <strong>ขนาดใหญ่พิเศษ (≥ 1,680 คน):</strong> 9 โรงเรียน (23,282 คน)<br>
          ⚠️ <strong>กลุ่มเฝ้าระวังต่ำกว่า 150 คน:</strong> รร.ลำปลาหางวิทยา (120), รร.เทพสวัสดิ์วิทยา (124), รร.ท่าสงครามวิทยา (146) ควรขับเคลื่อนโมเดล <strong>โรงเรียนคุณภาพคู่พัฒนา (Mentorship Partner)</strong>
        `;
      }

      // 6. Rankings & Extremes
      if (lower.includes('มากที่สุด') || lower.includes('สูงสุด') || lower.includes('top 5') || lower.includes('น้อยที่สุด') || lower.includes('ต่ำสุด')) {
        if (lower.includes('น้อยที่สุด') || lower.includes('ต่ำสุด')) {
          return `
            📉 <strong>5 อันดับสถานศึกษาที่มีจำนวนนักเรียนน้อยที่สุด (เทอม 2/2569):</strong><br>
            1. <strong>รร.ลำปลาหางวิทยา:</strong> 120 คน (ขนาดกลาง, อ.พังโคน)<br>
            2. <strong>รร.เทพสวัสดิ์วิทยา:</strong> 124 คน (ขนาดกลาง, อ.พรรณานิคม)<br>
            3. <strong>รร.ท่าสงครามวิทยา:</strong> 146 คน (ขนาดกลาง, อ.อากาศอำนวย)<br>
            4. <strong>รร.บะฮีวิทยาคม:</strong> 174 คน (ขนาดกลาง, อ.พรรณานิคม)<br>
            5. <strong>รร.โพธิแสนวิทยา:</strong> 183 คน (ขนาดกลาง, อ.กุสุมาลย์)<br>
            🎯 <em>ข้อเสนอแนะ: กลุ่มเปราะบางต่ำกว่า 150 คนควรได้รับการสนับสนุนด้านงบพัฒนาและสื่อการสอนเฉพาะกิจ</em>
          `;
        } else {
          return `
            🏆 <strong>5 อันดับสถานศึกษาที่มีจำนวนนักเรียนมากที่สุด (เทอม 2/2569):</strong><br>
            1. <strong>รร.สกลราชวิทยานุกูล:</strong> 3,718 คน (ขนาดใหญ่พิเศษ, อ.เมือง)<br>
            2. <strong>รร.สว่างแดนดิน:</strong> 3,248 คน (ขนาดใหญ่พิเศษ, อ.สว่างแดนดิน)<br>
            3. <strong>รร.ธาตุนารายณ์วิทยา:</strong> 3,244 คน (ขนาดใหญ่พิเศษ, อ.เมือง)<br>
            4. <strong>รร.พังโคนวิทยาคม:</strong> 2,827 คน (ขนาดใหญ่พิเศษ, อ.พังโคน)<br>
            5. <strong>รร.เตรียมอุดมศึกษา ภาคตะวันออกเฉียงเหนือ:</strong> 2,746 คน (ขนาดใหญ่พิเศษ, อ.สว่างแดนดิน)
          `;
        }
      }

      // 7. Route Planner / ตรวจเยี่ยม
      if (lower.includes('เส้นทาง') || lower.includes('ตรวจเยี่ยม') || lower.includes('route') || lower.includes('เดินทาง')) {
        return `
          🚗 <strong>ระบบวางแผนเส้นทางตรวจเยี่ยมโรงเรียนอัจฉริยะ (Route Planner):</strong><br>
          ระบบออกแบบมาเพื่ออำนวยความสะดวกแก่คณะผู้บริหาร สพม.สกลนคร ในการลงพื้นที่ตรวจราชการ 8 สหวิทยาเขต โดยคำนวณระยะทาง พิกัด GPS จริง จุดพักรับประทานอาหารกลางวัน และสร้างลิงก์นำทางบน Google Maps อัตโนมัติ<br><br>
          👉 <em>ท่านสามารถคลิกปุ่ม <strong>"🚗 แผนตรวจเยี่ยม"</strong> บนแผนที่ GIS หรือในเมนูนำทางด้านซ้ายเพื่อเปิดระบบวางแผนเส้นทางได้ทันทีครับ!</em>
        `;
      }

      // 8. 5 เสาหลัก / ภาพรวม
      if (lower.includes('5 เสาหลัก') || lower.includes('ภาพรวม') || lower.includes('สรุป')) {
        return `
          🏛️ <strong>สรุปสาระสำคัญ 5 เสาหลักยุทธศาสตร์การศึกษา สพม.สกลนคร:</strong><br>
          1. <strong>ประชากรนักเรียนรวม:</strong> 44,566 คน (45 โรงเรียน, 1,392 ห้องเรียน)<br>
          2. <strong>อัตราคงอยู่ (Zero Dropout):</strong> 99.44% (ลดลงระหว่างเทอม -252 คน ดีขึ้นกว่าปี 68 ที่ลด -356 คน)<br>
          3. <strong>การกระจายตัวเชิงพื้นที่:</strong> ในเมือง 34.2% : นอกเมือง 65.8% (ครอบคลุม 18 อำเภอ 8 สหวิทยาเขต)<br>
          4. <strong>คาดการณ์ปี 2570:</strong> 43,899 คน (แนวโน้มลดลง -667 คน หรือ -1.50%)<br>
          5. <strong>งบประมาณอุดหนุนรายหัว:</strong> ประมาณการรวม 179.63 ล้านบาท/ปี (เฉลี่ย 4,031 บาท/คน)
        `;
      }

      // 9. Zero Dropout / หลุด
      if (lower.includes('หลุด') || lower.includes('dropout') || lower.includes('เสี่ยง')) {
        return `
          🚨 <strong>โรงเรียนที่ต้องเฝ้าระวังการลดลงของนักเรียนสูงสุดระหว่างภาคเรียน (2569):</strong><br>
          1. <strong>รร.เตรียมอุดมศึกษา ภาคตะวันออกเฉียงเหนือ:</strong> ลดลง -42 คน (คงอยู่ 98.49%)<br>
          2. <strong>รร.ธาตุนารายณ์วิทยา:</strong> ลดลง -39 คน (คงอยู่ 98.81%)<br>
          3. <strong>รร.มัธยมวานรนิวาส:</strong> ลดลง -31 คน (คงอยู่ 98.60%)<br>
          4. <strong>รร.สกลราชวิทยานุกูล:</strong> ลดลง -22 คน (คงอยู่ 98.88%)<br>
          🎯 <strong>แนวทางปฏิบัติ:</strong> มอบกลุ่มส่งเสริมการจัดการศึกษาและระบบดูแลช่วยเหลือนักเรียน ลงพื้นที่ติดตามสาเหตุ (ย้ายถิ่นฐาน, ปัญหาส่วนตัว) เพื่อนำเด็กกลับเข้าสู่ระบบการศึกษา
        `;
      }

      // 10. สุขภาวะ / AAA
      if (lower.includes('สุขภาวะ') || lower.includes('aaa') || lower.includes('เกรด')) {
        return `
          🏆 <strong>5 อันดับสถานศึกษาที่มีดัชนีสุขภาวะสูงสุด (เกรด AAA จาก 100 คะแนนเต็ม):</strong><br>
          1. <strong>รร.บ้านม่วงพิทยาคม:</strong> 94.4 คะแนน (เสถียรภาพสูงมาก, ห้องเรียนสมดุล)<br>
          2. <strong>รร.พังโคนวิทยาคม:</strong> 93.3 คะแนน (อัตราคงอยู่ดีเด่น, สหวิทยาเขตดำรงธรรม)<br>
          3. <strong>รร.คำตากล้าราชประชาสงเคราะห์:</strong> 93.3 คะแนน (สหวิทยาเขตเบญจพัฒน์)<br>
          4. <strong>รร.พรรณาวุฒาจารย์:</strong> 93.0 คะแนน (การบริหารจัดการชั้นเรียนยอดเยี่ยม)<br>
          5. <strong>รร.อากาศอำนวยศึกษา:</strong> 93.0 คะแนน (รักษาเสถียรภาพนักเรียนต่อเนื่อง)<br>
          * รวมทั้งเขตมีโรงเรียนผ่านเกณฑ์ AAA ทั้งสิ้น 8 โรงเรียน
        `;
      }

      // 11. ไทม์ไลน์ 5 รอบ
      if (lower.includes('ไทม์ไลน์') || lower.includes('5 รอบ') || lower.includes('แนวโน้ม') || lower.includes('รอบเวลา')) {
        return `
          📈 <strong>สรุปสถิติการเคลื่อนไหวของนักเรียน 5 รอบเวลาต่อเนื่อง:</strong><br>
          • <strong>2568 เทอม 1:</strong> 45,403 คน (1,382 ห้อง)<br>
          • <strong>2568 เทอม 2:</strong> 45,047 คน (-356 คน ระหว่างเทอม)<br>
          • <strong>2568 สิ้นปี:</strong> 44,808 คน (-239 คน ปลายปี)<br>
          • <strong>2569 เทอม 1:</strong> 44,818 คน (+10 คน รับ ม.1/ม.4 ชดเชยได้)<br>
          • <strong>2569 เทอม 2:</strong> 44,566 คน (-252 คน ระหว่างเทอม)<br>
          📊 ภาพรวม 2 ปีลดลงสุทธิ -837 คน (-1.84%) แต่วิกฤตการหลุดระหว่างเทอมลดความรุนแรงลงอย่างมีนัยสำคัญ
        `;
      }

      // 12. งบประมาณ
      if (lower.includes('งบประมาณ') || lower.includes('รายหัว') || lower.includes('เงิน')) {
        return `
          💰 <strong>ประมาณการงบประมาณเงินอุดหนุนรายหัว (สพฐ.):</strong><br>
          • <strong>ระดับมัธยมศึกษาตอนต้น (24,002 คน x 3,800 บาท):</strong> 91.21 ล้านบาท<br>
          • <strong>ระดับมัธยมศึกษาตอนปลาย (20,564 คน x 4,300 บาท):</strong> 88.43 ล้านบาท<br>
          • <strong>ยอดรวมทั้งเขต:</strong> <strong>179.63 ล้านบาท</strong> (เฉลี่ย 4,031 บาท/คน)<br>
          💸 <strong>ผลกระทบจากการลดลงระหว่างเทอม (-252 คน):</strong> เสียโอกาสทางงบประมาณราว 1.02 ล้านบาท
        `;
      }

      // 13. General fallback
      return `
        ขอเรียนข้อมูลสรุปสำหรับท่านผู้บริหารครับ: ปัจจุบัน สพม.สกลนคร มีนักเรียนรวม <strong>44,566 คน</strong> (45 โรงเรียน 1,392 ห้องเรียน) โดยมีอัตราคงอยู่ 99.44% และงบประมาณอุดหนุนรายหัว 179.63 ล้านบาท<br><br>
        ท่านสามารถเจาะลึกได้หลากหลายมิติ เช่น:<br>
        • พิมพ์ชื่อสหวิทยาเขต: <em>"สหวิทยาเขตสกลราช"</em> หรือ <em>"สหวิทยาเขตดำรงธรรม"</em><br>
        • พิมพ์ชื่อโรงเรียน: <em>"วิเคราะห์ รร.สกลราช"</em> หรือ <em>"รร.คำเพิ่ม"</em><br>
        • พิมพ์ประเด็น: <em>"งบประมาณ"</em>, <em>"สุขภาวะ"</em>, หรือ <em>"โรงเรียนขนาดใหญ่พิเศษ"</em> ได้ตลอดเวลาครับ!
      `;
    }
  }
/* ==========================================================================
     MODULE 5: SIDEBAR NAVIGATION & INTEGRATION
     ========================================================================== */
  function initSidebarNavigation() {
    const navItems = [
      { id: 'menuGisMap', targetId: 'gisMapSection' },
      { id: 'menuRoutePlanner', targetId: 'gisMapSection', action: () => window.openRoutePlannerDrawer && window.openRoutePlannerDrawer() },
      { id: 'menuSandbox', targetId: 'policySandboxSection' },
      { id: 'menuEarlyWarning', targetId: 'earlyWarningSection' },
      { id: 'menuLongitudinal', targetId: 'longitudinalSection' },
      { id: 'menuCohort', targetId: 'cohortSection' },
      { id: 'menuHealthIndex', targetId: 'healthIndexSection' }
    ];

    navItems.forEach(item => {
      const el = document.getElementById(item.id);
      if (el) {
        el.addEventListener('click', (e) => {
          e.preventDefault();
          document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
          el.classList.add('active');
          const target = document.getElementById(item.targetId);
          if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            // In case map was hidden or resized, invalidate Leaflet size
            if (item.action) item.action();
            if (item.targetId === 'gisMapSection' && gisMap) {
              setTimeout(() => gisMap.invalidateSize(), 300);
            }
          }
        });
      }
    });
  }


  /* ==========================================================================
     MODULE: EXECUTIVE INSPECTION ROUTE PLANNER (ระบบวางแผนเส้นทางตรวจเยี่ยม)
     ========================================================================== */
  const SEC_SAKON_OFFICE = {
    name: "สำนักงานเขตพื้นที่การศึกษามัธยมศึกษาสกลนคร (สพม.สกลนคร)",
    shortName: "สพม.สกลนคร",
    lat: 17.1598,
    lng: 104.1448,
    address: "ศูนย์ราชการจังหวัดสกลนคร ถนนศูนย์ราชการ ต.ธาตุเชิงชุม อ.เมืองสกลนคร",
    tel: "042711031"
  };

  let routePolylineLayer = null;
  let routeMarkerLayers = [];
  let currentOptimalRoute = null;

  function calcRoadDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c) * 1.22; // 1.22 winding road multiplier for Isan highways
  }

  function minutesToTimeStr(totalMins) {
    const h = Math.floor(totalMins / 60) % 24;
    const m = Math.floor(totalMins % 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} น.`;
  }

  function timeStrToMinutes(timeStr) {
    const parts = (timeStr || '08:30').split(':');
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
  }

  function generateSchoolInspectionFocus(school) {
    const total = school.y69_2 ? school.y69_2.total.total : 0;
    const prev = school.y69_1 ? school.y69_1.total.total : 0;
    const diff = total - prev;
    const size = getSchoolSize(total);
    const points = [];

    if (school.project && school.project.includes('1 อำเภอ 1 โรงเรียนคุณภาพ')) {
      points.push('🏅 ติดตามความพร้อมห้องเรียนอัจฉริยะ โครงสร้างพื้นฐาน และการเป็นศูนย์กลางวิชาการระดับอำเภอ');
    }
    if (school.project && school.project.includes('พระราชดำริ')) {
      points.push('👑 ตรวจเยี่ยมโครงการอันเนื่องมาจากพระราชดำริ การอนุรักษ์พันธุกรรมพืช และทักษะอาชีพนักเรียน');
    }
    if (size === 'S') {
      points.push(`⚠️ โรงเรียนขนาดเล็ก (${total} คน): ตรวจสอบแนวทางการจัดการเรียนรวม/แชร์ทรัพยากรครูในสหวิทยาเขต`);
    } else if (size === 'XL') {
      points.push(`🏢 โรงเรียนขนาดใหญ่พิเศษ (${total.toLocaleString()} คน): ติดตามการบริหารอัตรากำลังครูและงบประมาณรายหัว`);
    }
    if (diff < -15) {
      points.push(`📉 นักเรียนลดลงสุทธิ ${Math.abs(diff)} คน: ติดตามมาตรการ Zero Dropout และการป้องกันเด็กหลุดจากระบบ`);
    } else if (diff > 15) {
      points.push(`📈 นักเรียนเพิ่มขึ้น +${diff} คน: นิเทศการบริหารจัดการห้องเรียนและความเพียงพอของสื่อการสอน`);
    }
    if (points.length === 0) {
      points.push('📌 นิเทศติดตามนโยบาย "เรียนดี มีความสุข" และตรวจเยี่ยมสภาพแวดล้อมความปลอดภัยในสถานศึกษา');
    }
    return points;
  }

  function solveOptimalRoute(selectedSchools, isRoundtrip) {
    if (!selectedSchools || selectedSchools.length === 0) return null;

    const coordsMap = typeof SCHOOL_COORDINATES !== 'undefined' ? SCHOOL_COORDINATES : {};
    
    // Attach coordinates
    const validSchools = selectedSchools.map(s => {
      const c = coordsMap[s.name] || coordsMap[s.shortName];
      return { ...s, coords: c };
    }).filter(s => !!s.coords);

    if (validSchools.length === 0) return null;

    // Nearest Neighbor TSP starting from SEC_SAKON_OFFICE
    let unvisited = [...validSchools];
    let orderedStops = [];
    let currentPos = { lat: SEC_SAKON_OFFICE.lat, lng: SEC_SAKON_OFFICE.lng, name: SEC_SAKON_OFFICE.name };

    while (unvisited.length > 0) {
      let nearestIdx = 0;
      let minDistance = Infinity;

      for (let i = 0; i < unvisited.length; i++) {
        const dist = calcRoadDistance(currentPos.lat, currentPos.lng, unvisited[i].coords.lat, unvisited[i].coords.lng);
        if (dist < minDistance) {
          minDistance = dist;
          nearestIdx = i;
        }
      }

      const nextSchool = unvisited.splice(nearestIdx, 1)[0];
      const legDist = minDistance;
      const legTravelMins = Math.max(5, Math.round(legDist / 60 * 60) + 3);

      orderedStops.push({
        school: nextSchool,
        legDistanceKm: Math.round(legDist * 10) / 10,
        legTravelMins: legTravelMins
      });

      currentPos = { lat: nextSchool.coords.lat, lng: nextSchool.coords.lng, name: nextSchool.name };
    }

    // Optional return leg
    let returnLeg = null;
    if (isRoundtrip) {
      const retDist = calcRoadDistance(currentPos.lat, currentPos.lng, SEC_SAKON_OFFICE.lat, SEC_SAKON_OFFICE.lng);
      returnLeg = {
        legDistanceKm: Math.round(retDist * 10) / 10,
        legTravelMins: Math.max(5, Math.round(retDist / 60 * 60) + 3)
      };
    }

    return {
      stops: orderedStops,
      returnLeg: returnLeg,
      isRoundtrip: isRoundtrip
    };
  }

  function initInspectionRoutePlanner() {
    const btnToggle = document.getElementById('btnToggleRoutePlanner');
    const panel = document.getElementById('routePlannerPanel');
    const btnClose = document.getElementById('btnCloseRoutePlanner');
    if (!btnToggle || !panel) return;

    let activePreset = 'cluster';

    // Populate custom checkbox container with all 45 schools
    const checkboxContainer = document.getElementById('routeSchoolCheckboxContainer');
    if (checkboxContainer && typeof DASHBOARD_DATA !== 'undefined') {
      checkboxContainer.innerHTML = '';
      DASHBOARD_DATA.forEach(s => {
        const chip = document.createElement('label');
        chip.className = 'route-school-chip';
        chip.innerHTML = `
          <input type="checkbox" value="${s.name}" data-school-id="${s.id}" style="cursor: pointer;">
          <span>${s.name} (${s.amphoe})</span>
        `;
        const cb = chip.querySelector('input');
        cb.addEventListener('change', () => {
          chip.classList.toggle('checked', cb.checked);
        });
        checkboxContainer.appendChild(chip);
      });
    }

    // Toggle panel
    function openRoutePlanner() {
      panel.style.display = 'block';
      btnToggle.style.background = '#1e40af';
      btnToggle.style.color = '#ffffff';
      panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (gisMap) {
        setTimeout(() => gisMap.invalidateSize(), 200);
      }
      if (!currentOptimalRoute) {
        runRouteCalculation();
      }
    }

    function closeRoutePlanner() {
      panel.style.display = 'none';
      btnToggle.style.background = '#eff6ff';
      btnToggle.style.color = '#1e40af';
      // Clear route layers from map
      clearRouteMapLayers();
    }

    btnToggle.addEventListener('click', () => {
      if (panel.style.display === 'none' || panel.style.display === '') {
        openRoutePlanner();
      } else {
        closeRoutePlanner();
      }
    });

    if (btnClose) {
      btnClose.addEventListener('click', closeRoutePlanner);
    }

    window.openRoutePlannerDrawer = openRoutePlanner;

    // Preset selection buttons
    const presetBtns = document.querySelectorAll('.route-preset-btn');
    const clusterSelectWrap = document.getElementById('routeClusterSelectWrap');
    const customSelector = document.getElementById('routeCustomSchoolSelector');

    presetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        presetBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activePreset = btn.getAttribute('data-preset');

        if (activePreset === 'cluster') {
          if (clusterSelectWrap) clusterSelectWrap.style.display = 'block';
          if (customSelector) customSelector.style.display = 'none';
        } else if (activePreset === 'custom') {
          if (clusterSelectWrap) clusterSelectWrap.style.display = 'none';
          if (customSelector) customSelector.style.display = 'block';
        } else {
          if (clusterSelectWrap) clusterSelectWrap.style.display = 'none';
          if (customSelector) customSelector.style.display = 'none';
        }

        runRouteCalculation();
      });
    });

    const routeClusterSelect = document.getElementById('routeClusterSelect');
    if (routeClusterSelect) {
      routeClusterSelect.addEventListener('change', () => {
        if (activePreset === 'cluster') runRouteCalculation();
      });
    }

    const btnSelectAll = document.getElementById('btnSelectAllRouteSchools');
    if (btnSelectAll && checkboxContainer) {
      btnSelectAll.addEventListener('click', () => {
        checkboxContainer.querySelectorAll('input[type="checkbox"]').forEach(cb => {
          cb.checked = true;
          cb.closest('.route-school-chip').classList.add('checked');
        });
        runRouteCalculation();
      });
    }

    const btnClearAll = document.getElementById('btnClearAllRouteSchools');
    if (btnClearAll && checkboxContainer) {
      btnClearAll.addEventListener('click', () => {
        checkboxContainer.querySelectorAll('input[type="checkbox"]').forEach(cb => {
          cb.checked = false;
          cb.closest('.route-school-chip').classList.remove('checked');
        });
        runRouteCalculation();
      });
    }

    const btnCalc = document.getElementById('btnCalculateRoute');
    if (btnCalc) {
      btnCalc.addEventListener('click', runRouteCalculation);
    }

    function getSelectedSchoolsForRoute() {
      if (typeof DASHBOARD_DATA === 'undefined') return [];
      if (activePreset === 'cluster') {
        const selectedCluster = routeClusterSelect ? routeClusterSelect.value : 'สหวิทยาเขตสกลราช';
        return DASHBOARD_DATA.filter(s => s.cluster === selectedCluster);
      } else if (activePreset === 'quality') {
        return DASHBOARD_DATA.filter(s => s.project && s.project.includes('1 อำเภอ 1 โรงเรียนคุณภาพ'));
      } else if (activePreset === 'royal') {
        return DASHBOARD_DATA.filter(s => s.project && s.project.includes('พระราชดำริ'));
      } else if (activePreset === 'small') {
        return DASHBOARD_DATA.filter(s => {
          const total = s.y69_2 ? s.y69_2.total.total : 0;
          return total <= 119;
        });
      } else if (activePreset === 'custom') {
        if (!checkboxContainer) return [];
        const checkedNames = Array.from(checkboxContainer.querySelectorAll('input:checked')).map(cb => cb.value);
        return DASHBOARD_DATA.filter(s => checkedNames.includes(s.name));
      }
      return DASHBOARD_DATA.slice(0, 5);
    }

    function clearRouteMapLayers() {
      if (gisMap) {
        if (routePolylineLayer) {
          gisMap.removeLayer(routePolylineLayer);
          routePolylineLayer = null;
        }
        routeMarkerLayers.forEach(m => gisMap.removeLayer(m));
        routeMarkerLayers = [];
      }
    }

    function runRouteCalculation() {
      const selectedSchools = getSelectedSchoolsForRoute();
      const isRoundtrip = document.getElementById('routeRoundtripCheckbox') ? document.getElementById('routeRoundtripCheckbox').checked : true;
      const startTimeStr = document.getElementById('routeStartTime') ? document.getElementById('routeStartTime').value : '08:30';
      const durationMins = document.getElementById('routeDurationPerSchool') ? parseInt(document.getElementById('routeDurationPerSchool').value, 10) : 90;

      const timelineContainer = document.getElementById('routeTimelineContainer');
      const totalDistEl = document.getElementById('routeTotalDist');
      const totalTravelTimeEl = document.getElementById('routeTotalTravelTime');
      const totalStopsEl = document.getElementById('routeTotalStops');
      const endTimeEl = document.getElementById('routeEndTime');

      if (!selectedSchools || selectedSchools.length === 0) {
        if (timelineContainer) {
          timelineContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: #64748b; background: #f8fafc; border-radius: 8px;">ยังไม่มีโรงเรียนที่เลือก กรุณาติ๊กเลือกโรงเรียนเป้าหมาย</div>';
        }
        clearRouteMapLayers();
        return;
      }

      const plan = solveOptimalRoute(selectedSchools, isRoundtrip);
      if (!plan || plan.stops.length === 0) return;
      currentOptimalRoute = plan;

      // Calculate totals and timetable
      let currentMinute = timeStrToMinutes(startTimeStr);
      let totalDistance = 0;
      let totalTravelMinutes = 0;
      let hasTakenLunch = false;

      const timelineItems = [];

      // 1. Departure from Office
      timelineItems.push({
        type: 'start',
        time: minutesToTimeStr(currentMinute),
        title: SEC_SAKON_OFFICE.name,
        badge: '🏛️ จุดเริ่มต้น',
        desc: `ออกเดินทางจากสำนักงานเขตพื้นที่การศึกษา (${SEC_SAKON_OFFICE.address})`,
        actionHtml: `<a href="tel:${SEC_SAKON_OFFICE.tel}" style="color: #1e40af; background: #e0e7ff; padding: 2px 8px; border-radius: 4px; text-decoration: none; font-size: 11px; font-weight: 600;">📞 โทร: ${SEC_SAKON_OFFICE.tel}</a>`
      });

      // 2. Each Stop
      plan.stops.forEach((stop, idx) => {
        totalDistance += stop.legDistanceKm;
        totalTravelMinutes += stop.legTravelMins;
        currentMinute += stop.legTravelMins;

        const arrivalTime = minutesToTimeStr(currentMinute);

        // Check for Lunch Break if crossing 12:00
        if (!hasTakenLunch && currentMinute >= 700 && currentMinute <= 780) { // between 11:40 and 13:00
          timelineItems.push({
            type: 'lunch',
            time: `${minutesToTimeStr(currentMinute)} - ${minutesToTimeStr(currentMinute + 45)}`,
            title: '🍱 พักรับประทานอาหารกลางวัน (45 นาที)',
            badge: 'พักกลางวัน',
            desc: `พักรับประทานอาหารกลางวันในพื้นที่ อ.${stop.school.amphoe} ก่อนดำเนินการตรวจราชการต่อ`,
            actionHtml: ''
          });
          currentMinute += 45;
          hasTakenLunch = true;
        }

        const departureTime = minutesToTimeStr(currentMinute + durationMins);
        const focusPoints = generateSchoolInspectionFocus(stop.school);
        const totalStd = stop.school.y69_2 ? stop.school.y69_2.total.total : 0;
        const rooms = stop.school.y69_2 ? stop.school.y69_2.total.rooms : 0;
        const size = getSchoolSize(totalStd);

        timelineItems.push({
          type: 'stop',
          stopIndex: idx + 1,
          arrivalTime: arrivalTime,
          departureTime: departureTime,
          school: stop.school,
          legDistance: stop.legDistanceKm,
          legTravelMins: stop.legTravelMins,
          totalStd: totalStd,
          rooms: rooms,
          size: size,
          focusPoints: focusPoints
        });

        currentMinute += durationMins;
      });

      // 3. Return Leg
      if (plan.returnLeg) {
        totalDistance += plan.returnLeg.legDistanceKm;
        totalTravelMinutes += plan.returnLeg.legTravelMins;
        currentMinute += plan.returnLeg.legTravelMins;

        timelineItems.push({
          type: 'end',
          time: minutesToTimeStr(currentMinute),
          title: `กลับถึง ${SEC_SAKON_OFFICE.name}`,
          badge: '🏁 สิ้นสุดภารกิจ',
          desc: `เดินทางกลับถึง สพท. (ระยะทางช่วงสุดท้าย ${plan.returnLeg.legDistanceKm} กม. • ใช้เวลาเดินทาง ${plan.returnLeg.legTravelMins} นาที)`,
          actionHtml: ''
        });
      }

      // Update KPI displays
      if (totalDistEl) totalDistEl.textContent = `${Math.round(totalDistance * 10) / 10} กม.`;
      if (totalTravelTimeEl) totalTravelTimeEl.textContent = `${Math.floor(totalTravelMinutes / 60)} ชม. ${totalTravelMinutes % 60} นาที`;
      if (totalStopsEl) totalStopsEl.textContent = `${plan.stops.length} แห่ง`;
      if (endTimeEl) endTimeEl.textContent = minutesToTimeStr(currentMinute);

      // Render Timeline Cards
      if (timelineContainer) {
        timelineContainer.innerHTML = '';
        timelineItems.forEach(item => {
          if (item.type === 'start') {
            const card = document.createElement('div');
            card.className = 'route-stop-card start-hub';
            card.innerHTML = `
              <div class="route-stop-number start">🏛️</div>
              <div style="flex: 1;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 6px;">
                  <div>
                    <h5 style="margin: 0; font-size: 14px; font-weight: 700; color: #1e3a8a;">${item.title}</h5>
                    <p style="margin: 3px 0 0 0; font-size: 12px; color: #64748b;">${item.desc}</p>
                  </div>
                  <span style="font-size: 13px; font-weight: 700; color: #1e3a8a; background: #e0e7ff; padding: 2px 8px; border-radius: 4px;">⏰ ${item.time}</span>
                </div>
                <div style="margin-top: 6px;">${item.actionHtml}</div>
              </div>
            `;
            timelineContainer.appendChild(card);
          } else if (item.type === 'lunch') {
            const card = document.createElement('div');
            card.className = 'route-stop-card lunch-break';
            card.innerHTML = `
              <div class="route-stop-number lunch">🍱</div>
              <div style="flex: 1;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 6px;">
                  <h5 style="margin: 0; font-size: 13.5px; font-weight: 700; color: #92400e;">${item.title}</h5>
                  <span style="font-size: 12px; font-weight: 700; color: #92400e; background: #fef3c7; padding: 2px 8px; border-radius: 4px;">⏰ ${item.time}</span>
                </div>
                <p style="margin: 3px 0 0 0; font-size: 12px; color: #78350f;">${item.desc}</p>
              </div>
            `;
            timelineContainer.appendChild(card);
          } else if (item.type === 'stop') {
            // Leg travel banner
            const legDiv = document.createElement('div');
            legDiv.className = 'route-leg-divider';
            legDiv.innerHTML = `🚗 เดินทาง ${item.legDistance} กม. (~${item.legTravelMins} นาที)`;
            timelineContainer.appendChild(legDiv);

            const s = item.school;
            const card = document.createElement('div');
            card.className = 'route-stop-card';
            card.innerHTML = `
              <div class="route-stop-number">${item.stopIndex}</div>
              <div style="flex: 1;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 8px;">
                  <div>
                    <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                      <h5 style="margin: 0; font-size: 14.5px; font-weight: 700; color: #1e3a8a;">${s.name}</h5>
                      <span class="school-popup-badge" style="background: rgba(30,58,138,0.08); color: #1e3a8a; border: 1px solid rgba(30,58,138,0.25); font-size: 10.5px; padding: 1px 6px; border-radius: 4px;">
                        ขนาด ${item.size} • ${s.cluster}
                      </span>
                      ${s.project ? `<span style="background: #fef3c7; color: #92400e; font-size: 10px; padding: 1px 6px; border-radius: 4px; font-weight: 600;">🏅 ${s.project}</span>` : ''}
                    </div>
                    <div style="margin-top: 4px; font-size: 12px; color: #475569;">
                      📍 ต.${s.tambon || ''} อ.${s.amphoe} (ห่าง สพท. ${s.distanceKm || '--'} กม.) • <strong>นักเรียน ${item.totalStd.toLocaleString()} คน</strong> (${item.rooms} ห้อง)
                    </div>
                  </div>
                  <div style="text-align: right;">
                    <div style="font-size: 13px; font-weight: 700; color: #047857; background: #d1fae5; padding: 2px 8px; border-radius: 4px; display: inline-block;">
                      ⏰ ถึง: ${item.arrivalTime} — ออก: ${item.departureTime}
                    </div>
                    <div style="font-size: 10.5px; color: #64748b; margin-top: 2px;">(เวลาตรวจเยี่ยม ${durationMins} นาที)</div>
                  </div>
                </div>

                <!-- Focus Points List -->
                <div style="margin-top: 10px; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 6px; padding: 8px 12px;">
                  <span style="font-size: 11px; font-weight: 700; color: #334155; display: block; margin-bottom: 4px;">
                    🎯 ประเด็นตรวจราชการเน้นย้ำ (Key Mission Talking Points):
                  </span>
                  <ul style="margin: 0; padding-left: 18px; font-size: 11.5px; color: #334155; line-height: 1.5;">
                    ${item.focusPoints.map(p => `<li>${p}</li>`).join('')}
                  </ul>
                </div>

                <!-- Contact & Dossier Actions -->
                <div style="display: flex; gap: 8px; margin-top: 8px; align-items: center; flex-wrap: wrap;">
                  ${s.tel ? `<a href="tel:${s.tel}" style="background: #e0e7ff; color: #1e40af; padding: 3px 8px; border-radius: 4px; text-decoration: none; font-size: 11px; font-weight: 600;">📞 โทร: ${s.tel}</a>` : ''}
                  ${s.website ? `<a href="${s.website}" target="_blank" rel="noopener" style="background: #d1fae5; color: #065f46; padding: 3px 8px; border-radius: 4px; text-decoration: none; font-size: 11px; font-weight: 600;">🌐 เว็บไซต์โรงเรียน</a>` : ''}
                  <button class="btn btn-secondary" style="font-size: 11px; padding: 2px 8px; border-radius: 4px; cursor: pointer;" onclick="window.openSchoolDetailModal && window.openSchoolDetailModal('${s.id}')">
                    🔍 เปิดแฟ้ม 360°
                  </button>
                </div>
              </div>
            `;
            timelineContainer.appendChild(card);
          } else if (item.type === 'end') {
            const card = document.createElement('div');
            card.className = 'route-stop-card start-hub';
            card.innerHTML = `
              <div class="route-stop-number start">🏁</div>
              <div style="flex: 1;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 6px;">
                  <div>
                    <h5 style="margin: 0; font-size: 14px; font-weight: 700; color: #1e3a8a;">${item.title}</h5>
                    <p style="margin: 3px 0 0 0; font-size: 12px; color: #64748b;">${item.desc}</p>
                  </div>
                  <span style="font-size: 13px; font-weight: 700; color: #1e3a8a; background: #e0e7ff; padding: 2px 8px; border-radius: 4px;">⏰ ${item.time}</span>
                </div>
              </div>
            `;
            timelineContainer.appendChild(card);
          }
        });
      }

      // Draw Route on Leaflet Map
      if (gisMap) {
        clearRouteMapLayers();

        const latlngs = [[SEC_SAKON_OFFICE.lat, SEC_SAKON_OFFICE.lng]];

        // Start Office Marker
        const officeIcon = L.divIcon({
          className: 'custom-route-marker-wrap',
          html: '<div class="leaflet-route-marker start" title="สพม.สกลนคร">🏛️</div>',
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });
        const officeMarker = L.marker([SEC_SAKON_OFFICE.lat, SEC_SAKON_OFFICE.lng], { icon: officeIcon })
          .bindPopup(`<strong>${SEC_SAKON_OFFICE.name}</strong><br>จุดเริ่มต้นและศูนย์สั่งการ`);
        officeMarker.addTo(gisMap);
        routeMarkerLayers.push(officeMarker);

        // Stops Markers
        plan.stops.forEach((stop, idx) => {
          const lat = stop.school.coords.lat;
          const lng = stop.school.coords.lng;
          latlngs.push([lat, lng]);

          const stopIcon = L.divIcon({
            className: 'custom-route-marker-wrap',
            html: `<div class="leaflet-route-marker">${idx + 1}</div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 16]
          });
          const marker = L.marker([lat, lng], { icon: stopIcon })
            .bindPopup(`<strong>จุดที่ ${idx + 1}: ${stop.school.name}</strong><br>ห่าง สพท. ${stop.school.distanceKm || '--'} กม.<br>นักเรียน ${stop.school.y69_2 ? stop.school.y69_2.total.total : 0} คน`);
          marker.addTo(gisMap);
          routeMarkerLayers.push(marker);
        });

        // If Roundtrip, add Office latlng at end
        if (plan.returnLeg) {
          latlngs.push([SEC_SAKON_OFFICE.lat, SEC_SAKON_OFFICE.lng]);
        }

        // Draw Polyline
        routePolylineLayer = L.polyline(latlngs, {
          color: '#1e40af',
          weight: 4.5,
          opacity: 0.85,
          dashArray: '8, 8',
          lineCap: 'round',
          lineJoin: 'round'
        }).addTo(gisMap);

        // Fit bounds to polyline
        try {
          gisMap.fitBounds(routePolylineLayer.getBounds(), { padding: [50, 50], maxZoom: 13 });
        } catch (e) {
          console.warn("Could not fit bounds to route:", e);
        }
      }

      // Update Google Maps Live Navigation URL
      const gmapsLink = document.getElementById('btnOpenGoogleMapsRoute');
      if (gmapsLink) {
        const waypoints = [
          `${SEC_SAKON_OFFICE.lat},${SEC_SAKON_OFFICE.lng}`,
          ...plan.stops.map(s => `${s.school.coords.lat},${s.school.coords.lng}`)
        ];
        if (plan.returnLeg) {
          waypoints.push(`${SEC_SAKON_OFFICE.lat},${SEC_SAKON_OFFICE.lng}`);
        }
        gmapsLink.href = `https://www.google.com/maps/dir/${waypoints.join('/')}`;
      }
    }

    // Print Route Dossier Action
    const btnPrint = document.getElementById('btnPrintRouteDossier');
    if (btnPrint) {
      btnPrint.addEventListener('click', () => {
        if (!currentOptimalRoute) {
          alert('กรุณาคำนวณเส้นทางก่อนสั่งพิมพ์');
          return;
        }
        printExecutiveInspectionDossier(currentOptimalRoute);
      });
    }
  }

  function printExecutiveInspectionDossier(plan) {
    const startTimeStr = document.getElementById('routeStartTime') ? document.getElementById('routeStartTime').value : '08:30';
    const durationMins = document.getElementById('routeDurationPerSchool') ? parseInt(document.getElementById('routeDurationPerSchool').value, 10) : 90;

    let currentMinute = timeStrToMinutes(startTimeStr);
    let rowsHtml = '';
    let totalDist = 0;

    plan.stops.forEach((stop, idx) => {
      totalDist += stop.legDistanceKm;
      currentMinute += stop.legTravelMins;
      const arr = minutesToTimeStr(currentMinute);
      const dep = minutesToTimeStr(currentMinute + durationMins);
      currentMinute += durationMins;
      const s = stop.school;
      const totalStd = s.y69_2 ? s.y69_2.total.total : 0;
      const rooms = s.y69_2 ? s.y69_2.total.rooms : 0;
      const focus = generateSchoolInspectionFocus(s).map(f => `• ${f}`).join('<br>');

      rowsHtml += `
        <tr>
          <td style="text-align: center; font-weight: bold; padding: 8px;">${idx + 1}</td>
          <td style="padding: 8px;">
            <strong>${s.name}</strong><br>
            <span style="font-size: 12px; color: #475569;">ต.${s.tambon || ''} อ.${s.amphoe} (${s.cluster}) • โทร ${s.tel || '-'}</span>
          </td>
          <td style="text-align: center; padding: 8px;">${arr} - ${dep}</td>
          <td style="text-align: center; padding: 8px;">${totalStd.toLocaleString()} คน (${rooms} ห้อง)</td>
          <td style="padding: 8px; font-size: 12px; line-height: 1.4;">${focus}</td>
        </tr>
      `;
    });

    const printWin = window.open('', '_blank');
    if (!printWin) {
      alert('บราวเซอร์บล็อกหน้าต่างป็อปอัป กรุณาอนุญาตป็อปอัปเพื่อสั่งพิมพ์เอกสาร');
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html lang="th">
      <head>
        <meta charset="UTF-8">
        <title>แผนปฏิบัติภารกิจตรวจราชการและนิเทศติดตามสถานศึกษา - สพม.สกลนคร</title>
        <style>
          body { font-family: 'Sarabun', 'TH Sarabun New', sans-serif; padding: 25px; color: #1e293b; line-height: 1.4; }
          .header { text-align: center; border-bottom: 2px solid #1e3a8a; padding-bottom: 12px; margin-bottom: 20px; }
          .header h2 { margin: 0; font-size: 20px; color: #1e3a8a; }
          .header p { margin: 4px 0 0 0; font-size: 14px; color: #475569; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 13px; }
          th, td { border: 1px solid #cbd5e1; }
          th { background: #f1f5f9; padding: 8px; text-align: center; font-weight: bold; }
          .kpi-summary { display: flex; justify-content: space-between; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 12px 18px; margin-bottom: 15px; }
          .kpi-item { text-align: center; }
          .kpi-label { font-size: 12px; color: #1e40af; }
          .kpi-val { font-size: 18px; font-weight: bold; color: #1e3a8a; }
          .signature-section { margin-top: 40px; display: flex; justify-content: flex-end; }
          .sign-box { text-align: center; width: 250px; }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>แผนปฏิบัติภารกิจตรวจราชการและนิเทศติดตามสถานศึกษา</h2>
          <p>สำนักงานเขตพื้นที่การศึกษามัธยมศึกษาสกลนคร (สพม.สกลนคร)</p>
          <p style="font-size: 12.5px; margin-top: 3px;">จุดเริ่มต้น: ศูนย์ราชการจังหวัดสกลนคร • วันที่สั่งพิมพ์: ${new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        <div class="kpi-summary">
          <div class="kpi-item"><div class="kpi-label">จำนวนโรงเรียนเป้าหมาย</div><div class="kpi-val">${plan.stops.length} แห่ง</div></div>
          <div class="kpi-item"><div class="kpi-label">ระยะทางรวมประมาณการ</div><div class="kpi-val">${Math.round(totalDist * 10) / 10} กม.</div></div>
          <div class="kpi-item"><div class="kpi-label">เวลาเริ่มออกเดินทาง</div><div class="kpi-val">${startTimeStr} น.</div></div>
          <div class="kpi-item"><div class="kpi-label">เวลาตรวจเฉลี่ย/แห่ง</div><div class="kpi-val">${durationMins} นาที</div></div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 45px;">จุดที่</th>
              <th style="width: 240px;">สถานศึกษาเป้าหมาย</th>
              <th style="width: 140px;">กำหนดการเวลา</th>
              <th style="width: 130px;">ข้อมูลพื้นฐาน</th>
              <th>ประเด็นตรวจราชการเน้นย้ำ</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="signature-section">
          <div class="sign-box">
            <p>ลงชื่อ........................................................</p>
            <p>(........................................................)</p>
            <p>ผู้อำนวยการสำนักงานเขตพื้นที่การศึกษามัธยมศึกษาสกลนคร</p>
          </div>
        </div>

        <div class="no-print" style="text-align: center; margin-top: 25px;">
          <button onclick="window.print()" style="padding: 8px 20px; font-size: 14px; background: #1e40af; color: #fff; border: none; border-radius: 6px; cursor: pointer;">🖨️ สั่งพิมพ์เอกสารนี้</button>
        </div>
      </body>
      </html>
    `;

    printWin.document.open();
    printWin.document.write(html);
    printWin.document.close();
  }

})();
