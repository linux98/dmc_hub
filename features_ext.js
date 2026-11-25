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
    initSidebarNavigation();
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

    // Center on Sakon Nakhon province
    const SAKON_CENTER = [17.1544, 104.1486];
    gisMap = L.map('schoolGisMap', {
      center: SAKON_CENTER,
      zoom: 10,
      zoomControl: true,
      scrollWheelZoom: true
    });

    // Clean OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; OpenStreetMap contributors | สพม.สกลนคร DMC Hub'
    }).addTo(gisMap);

    renderGisMarkers();
    setupGisEvents();
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
      const popupHTML = `
        <div class="school-popup-card">
          <h4>${school.name}</h4>
          <span class="school-popup-badge" style="background:${markerColor}15; color:${markerColor}; border:1px solid ${markerColor}40;">
            ขนาด ${size} • ${school.cluster}
          </span>
          <div class="school-popup-grid">
            <div><strong>นักเรียนรวม:</strong> ${total69_2.toLocaleString()} คน</div>
            <div><strong>ห้องเรียน:</strong> ${rooms69_2} ห้อง (${density}/ห้อง)</div>
            <div><strong>ม.ต้น:</strong> ${mTon.toLocaleString()} คน</div>
            <div><strong>ม.ปลาย:</strong> ${mPlai.toLocaleString()} คน</div>
            <div style="grid-column: span 2;"><strong>งบประมาณรายหัวจำลอง:</strong> ${(grant / 1e6).toFixed(2)} ล้านบาท</div>
          </div>
          <button class="school-popup-btn" onclick="window.openSchoolDetailModal && window.openSchoolDetailModal('${school.id}')">
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
        gisMap.setView([17.1544, 104.1486], 10);
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
              <div class="meta">ฐานข้อมูลสารสนเทศ DMC ภาคเรียนที่ ๒/๒๕๖๙ (ข้อมูล ณ วันที่ ๑๐ พ.ย. ๒๕๖๙) • ศูนย์ DMC Hub สพม.สกลนคร</div>
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
<strong>วาระ: การรับรองฐานข้อมูลนักเรียน DMC ภาคเรียนที่ ๒/๒๕๖๙ เพื่อการบริหารอัตรากำลังครูและสถานศึกษา</strong>
-------------------------------------------------------------------------------------------------

เรียน ท่านประธาน และคณะกรรมการทุกท่าน,

ผมขอเรียนนำเสนอข้อมูลสารสนเทศประชากรนักเรียนจากระบบจัดเก็บข้อมูลนักเรียนรายบุคคล (Data Management Center : DMC) ประจำปีการศึกษา ๒๕๖๙ ภาคเรียนที่ ๒ ข้อมูล ณ วันที่ ๑๐ พฤศจิกายน ๒๕๖๙ ซึ่งกลุ่มส่งเสริมการศึกษาทางไกล เทคโนโลยีสารสนเทศและการสื่อสาร (DLICT) ได้ประมวลผล ตรวจสอบ และยืนยันความถูกต้องเรียบร้อยแล้ว โดยมีสาระสำคัญที่เกี่ยวข้องกับภารกิจของคณะกรรมการ ดังนี้ครับ:

<strong>๑. สถานะประชากรนักเรียนและขนาดสถานศึกษาจริง:</strong>
ปัจจุบัน สพม.สกลนคร มีสถานศึกษาในสังกัดครบทั้ง <strong>๔๕ โรงเรียน</strong> ครอบคลุม ๑๘ อำเภอ มีจำนวนนักเรียนรวมทั้งสิ้น <strong>๔๔,๕๖๖ คน</strong> แบ่งเป็นระดับมัธยมศึกษาตอนต้น ๒๔,๐๐๒ คน และระดับมัธยมศึกษาตอนปลาย ๒๐,๕๖๔ คน จัดการเรียนการสอนรวม <strong>๑,๓๙๒ ห้องเรียน</strong> โดยมีความหนาแน่นเฉลี่ยทั้งเขตอยู่ที่ <strong>๓๒.๐ คนต่อห้องเรียน</strong> ซึ่งสะท้อนถึงการบริหารจัดการชั้นเรียนที่ได้มาตรฐานตามเกณฑ์ของ สพฐ.

<strong>๒. การนำข้อมูลไปใช้ประกอบการพิจารณาด้านอัตรากำลังครู (กลุ่มบริหารงานบุคคล):</strong>
ข้อมูลนักเรียน ๔๔,๕๖๖ คนและห้องเรียน ๑,๓๙๒ ห้องเรียนนี้ ได้ส่งมอบให้กลุ่มบริหารงานบุคคลเรียบร้อยแล้ว เพื่อใช้เป็นฐานข้อมูลตัวเลขทางการที่ถูกต้องตรงกันในการคำนวณภาระงานครู การพิจารณาอัตรากำลังตามเกณฑ์ ก.ค.ศ. และการพิจารณาย้ายข้าราชการครูประจำปี โดยยึดหลักความเป็นธรรม โปร่งใส และสอดคล้องกับขนาดสถานศึกษาที่แท้จริง

<strong>๓. มิติการกระจายตัวเชิงพื้นที่ ๘ สหวิทยาเขต:</strong>
ข้อมูลเชิงพื้นที่ชี้ให้เห็นว่า สัดส่วนนักเรียนในเขตเมืองมีร้อยละ ๓๔.๒ ขณะที่สถานศึกษานอกเขตเมืองมีสัดส่วนถึงร้อยละ ๖๕.๘ ดังนั้น การบริหารอัตรากำลังครูและการจัดสรรทรัพยากรทางการศึกษา คณะกรรมการต้องให้ความสำคัญกับโรงเรียนมัธยมขนาดกลางและขนาดเล็กในพื้นที่รอบนอก เพื่อมิให้เกิดภาวะขาดแคลนครูผู้สอนในสาขาวิชาเอกหลัก

จึงขอนำเรียนต่อที่ประชุมเพื่อโปรดรับทราบและใช้เป็นฐานข้อมูลอ้างอิงในการพิจารณาวาระต่าง ๆ ต่อไปครับ
      `;
    } else if (context === 'inspection') {
      speechHTML = `
<strong>ประเด็นรายงานการตรวจราชการและติดตามประเมินผลการจัดการศึกษาขั้นพื้นฐาน (สพฐ. / กระทรวงศึกษาธิการ)</strong>
<strong>หัวข้อ: ผลการขับเคลื่อนนโยบาย "เรียนดี มีความสุข" และการป้องกันเด็กหลุดออกจากระบบ (Zero Dropout)</strong>
-------------------------------------------------------------------------------------------------

เรียน ท่านผู้ตรวจราชการกระทรวงศึกษาธิการ และคณะผู้ตรวจราชการ สพฐ.,

สำนักงานเขตพื้นที่การศึกษามัธยมศึกษาสกลนคร ได้ขับเคลื่อนนโยบาย "เรียนดี มีความสุข" ของ พลตำรวจเอก เพิ่มพูน ชิดชอบ รัฐมนตรีว่าการกระทรวงศึกษาธิการ และนโยบายเร่งด่วนของ สพฐ. อย่างเข้มข้น โดยใช้ระบบสารสนเทศดิจิทัล "DMC Hub สพม.สกลนคร" เป็นเครื่องมือหลักในการติดตามและสนับสนุนเชิงรุก ซึ่งมีผลสัมฤทธิ์เชิงประจักษ์ดังนี้:

<strong>๑. ผลสัมฤทธิ์นโยบาย Zero Dropout และอัตราการคงอยู่ของนักเรียน (Retention Rate):</strong>
จากการติดตามสถิตินักเรียนระหว่างภาคเรียนที่ ๑/๒๕๖๙ (๔๔,๘๑๘ คน) สู่ภาคเรียนที่ ๒/๒๕๖๙ (๔๔,๕๖๖ คน) พบว่า สพม.สกลนคร มีอัตราการคงอยู่ของนักเรียนสูงถึง <strong>ร้อยละ ๙๙.๔๔</strong> โดยมีนักเรียนลดลงระหว่างภาคเรียนเพียง <strong>๒๕๒ คน</strong> ซึ่งมีประสิทธิภาพในการดูแลช่วยเหลือนักเรียนดีขึ้นกว่าปี ๒๕๖๘ ที่เคยลดลงถึง ๓๕๖ คน สะท้อนว่ามาตรการระบบดูแลช่วยเหลือนักเรียนและการประสานงานร่วมกับผู้ปกครองสามารถสกัดกั้นเด็กมิให้หลุดออกจากระบบการศึกษาได้อย่างมีประสิทธิภาพ

<strong>๒. การลดความเหลื่อมล้ำและโรงเรียนคุณภาพตามบริบทเชิงพื้นที่:</strong>
เราได้วางระบบเรดาร์เตือนภัยล่วงหน้า (Early Warning Radar) ตรวจจับสถานศึกษาที่มีความเปราะบาง โดยเฉพาะโรงเรียนขนาดเล็กและโรงเรียนในพื้นที่ห่างไกลแถบเทือกเขาภูพานและลุ่มน้ำอูน เพื่อให้ทีมเคลื่อนที่เร็วของเขตพื้นที่ลงไปหนุนเสริมสื่อเทคโนโลยีการศึกษาทางไกล (OBEC Content Center / DLIT) เพื่อให้เด็กนักเรียนทุกคนได้เรียนรู้อย่างมีความสุขและเท่าเทียม

<strong>๓. การเตรียมการรองรับประชากรนักเรียนปีการศึกษา ๒๕๗๐:</strong>
จากแบบจำลองพยากรณ์ประชากรนักเรียนล่วงหน้า (Demographic Cohort Progression) คาดการณ์ว่าปี ๒๕๗๐ จะมีนักเรียนรวม <strong>๔๓,๘๙๙ คน</strong> สพม.สกลนคร จึงได้เตรียมแผนการรับนักเรียน ม.๑ และ ม.๔ ร่วมกับโรงเรียนประถมศึกษาและวิทยาลัยอาชีวศึกษาในจังหวัดสกลนคร เพื่อเปิดประตูโอกาสทางการศึกษาและสายอาชีพรองรับเยาวชนอย่างครบวงจรครับ
      `;
    } else {
      speechHTML = `
<strong>คำกล่าวเปิดการประชุมสัมมนาและมอบนโยบายแก่ผู้บริหารสถานศึกษาในสังกัด ๔๕ โรงเรียน</strong>
<strong>โดย: ผู้อำนวยการสำนักงานเขตพื้นที่การศึกษามัธยมศึกษาสกลนคร</strong>
<strong>หัวข้อ: ยกระดับมัธยมศึกษาสกลนครสู่ความเป็นเลิศด้วยพลังข้อมูลสารสนเทศ (Data-Driven Leadership)</strong>
-------------------------------------------------------------------------------------------------

สวัสดีท่านผู้อำนวยการสถานศึกษา รองผู้อำนวยการ และเพื่อนครูผู้บริหารทุกท่าน,

วันนี้ผมมีความยินดีเป็นอย่างยิ่งที่ได้พบปะกับผู้บริหารหัวขบวนทั้ง ๔๕ โรงเรียนของ สพม.สกลนคร ในการประชุมขับเคลื่อนยุทธศาสตร์การศึกษาภาคเรียนที่ ๒ ปีการศึกษา ๒๕๖๙ 

สิ่งแรกที่ผมขอชื่นชมและขอบคุณผู้บริหารทุกท่านและคณะครู คือตัวเลขสถิติ <strong>อัตราการคงอยู่ของนักเรียนที่สูงถึง ๙๙.๔๔%</strong> ในเทอมนี้ เราดูแลเด็กนักเรียนของเรากว่า ๔๔,๕๖๖ ชีวิตให้อยู่ในระบบการศึกษาได้อย่างเหนียวแน่น มีเด็กออกกลางคันลดลงอย่างเห็นได้ชัด นี่คือเครื่องพิสูจน์ถึงหัวใจความเป็นครูของพวกเราทุกคนตามนโยบาย "เรียนดี มีความสุข"

ในยุคปัจจุบัน การบริหารโรงเรียนจะใช้ความรู้สึกอย่างเดียวไม่ได้แล้วครับ <strong>"ผู้บริหารยุคใหม่ต้องนำด้วยข้อมูล (Data-Driven Leadership)"</strong> วันนี้ทางเขตพื้นที่ฯ โดยกลุ่ม DLICT ได้พัฒนาและเปิดตัวระบบ <strong>"DMC Hub สพม.สกลนคร"</strong> ขึ้นมา เพื่อให้ท่าน ผอ. ทั้ง ๔๕ โรงเรียน สามารถเปิดดูข้อมูลสถิติของโรงเรียนตัวเอง เปรียบเทียบย้อนหลัง ๕ เทอม ดูโครงสร้างห้องเรียน และประมาณการงบประมาณรายหัวได้ทันทีผ่านมือถือและแท็บเล็ต

ผมขอฝาก ๓ ทิศทางสำคัญในการขับเคลื่อนร่วมกันนับจากนี้:
<strong>๑. ความเข้มแข็งของ ๘ สหวิทยาเขต:</strong> โรงเรียนพี่ใหญ่ต้องจับมือเป็นพี่เลี้ยงร่วมพัฒนากับโรงเรียนน้อง เพื่อแบ่งปันทรัพยากร หลักสูตร และกิจกรรม
<strong>๒. การยกระดับคุณภาพห้องเรียน:</strong> ห้องเรียนของเราเฉลี่ย ๓๒ คน/ห้อง เป็นขนาดที่เหมาะสมอย่างยิ่งในการจัดการเรียนรู้เชิงรุก (Active Learning) ขอให้เน้นพัฒนาทักษะชีวิตและทักษะอาชีพของเด็ก
<strong>๓. การเตรียมรับมือการเปลี่ยนแปลงปี ๒๕๗๐:</strong> แนวโน้มเด็กเกิดใหม่ลดลง เราต้องเร่งพัฒนาโรงเรียนให้น่าเรียน มีอัตลักษณ์ และสร้างความเชื่อมั่นแก่ผู้ปกครองในชุมชน

ขอให้ทุกท่านใช้ระบบ DMC Hub ให้เกิดประโยชน์สูงสุดในการบริหารโรงเรียน และร่วมกันพามัธยมศึกษาสกลนครก้าวไปข้างหน้าอย่างมั่นคงครับ ขอบคุณครับ
      `;
    }

    display.innerHTML = speechHTML.trim();
  }

  /* ==========================================================================
     MODULE 5: SIDEBAR NAVIGATION & INTEGRATION
     ========================================================================== */
  function initSidebarNavigation() {
    const navItems = [
      { id: 'menuGisMap', targetId: 'gisMapSection' },
      { id: 'menuSandbox', targetId: 'policySandboxSection' },
      { id: 'menuEarlyWarning', targetId: 'earlyWarningSection' }
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
            if (item.targetId === 'gisMapSection' && gisMap) {
              setTimeout(() => gisMap.invalidateSize(), 300);
            }
          }
        });
      }
    });
  }

})();
