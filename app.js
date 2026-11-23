// DMC Dashboard Application Logic - Mission BOSS Light Minimal Style

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const schoolSelector = document.getElementById('schoolSelector');
  const levelTabButtons = document.querySelectorAll('#levelTabs .tab-control-btn');
  const basePeriodSelect = document.getElementById('basePeriodSelect');
  const targetPeriodSelect = document.getElementById('targetPeriodSelect');
  const quickComparePresets = document.querySelectorAll('#quickComparePresets .preset-btn');
  const tableSearchInput = document.getElementById('tableSearchInput');
  const topSearchInput = document.getElementById('topSearchInput');
  const schoolTableBody = document.getElementById('schoolTableBody');
  const tableHeaders = document.querySelectorAll('#schoolTable th');
  const topSchoolsList = document.getElementById('topSchoolsList');
  const btnExport = document.getElementById('btnExport');
  const btnRefresh = document.getElementById('btnRefresh');
  const btnPresent = document.getElementById('btnPresent');
  const alertsContainer = document.getElementById('alertsContainer');

  // KPI elements (4 cards as per Mission BOSS style)
  const kpiSchoolsVal = document.getElementById('kpi-schools-val');
  const kpiStudentsVal = document.getElementById('kpi-students-val');
  const kpiStudentsUnit = document.getElementById('kpi-students-unit');
  const badgeStudents = document.getElementById('badge-students');
  const kpiRoomsVal = document.getElementById('kpi-rooms-val');
  const kpiRoomsUnit = document.getElementById('kpi-rooms-unit');
  const badgeRooms = document.getElementById('badge-rooms');
  const kpiDensityVal = document.getElementById('kpi-density-val');
  const badgeDensity = document.getElementById('badge-density');
  const thChange = document.getElementById('thChange');
  const thRooms = document.getElementById('thRooms');
  const thDensity = document.getElementById('thDensity');

  // State (Custom Pairwise Comparison)
  let selectedSchool = 'ALL';
  let selectedLevel = 'ALL'; // 'ALL', 'มต้น', 'มปลาย'
  let basePeriod = 'y69_1'; // รอบตั้งต้น: 'y68', 'y69_1', 'y69_2'
  let targetPeriod = 'y69_2'; // รอบเปรียบเทียบ: 'y68', 'y69_1', 'y69_2'
  let selectedPeriod = 'y69_2'; // alias to targetPeriod
  let searchQuery = '';

  // Helper for human-readable period labels
  function getPeriodLabel(pKey) {
    if (pKey === 'y68') return 'ปี 2568';
    if (pKey === 'y69_1') return '2569 เทอม 1';
    if (pKey === 'y69_2') return '2569 เทอม 2';
    return pKey;
  }
  let currentSortKey = 'change';
  let currentSortDir = 'desc';
  let currentClusterFilter = 'all'; // 'all', 'decline', 'overcrowded', 'small'
  let modalGradesChart = null;
  let modalGenderChart = null;

  // State variables for executive control center
  let chartMetric = 'students'; // 'students', 'rooms', 'density'
  let thresholdDecline = -6.5; // percentage value
  let thresholdDensity = 37.0; // average ratio
  let selectedSchoolSizes = ['S', 'M', 'L', 'XL'];
  let isDarkMode = false;
  let currentPrimaryColor = '#1a73e8';

  // State variables for Pairwise School Comparison
  let comparisonSchoolA = '';
  let comparisonSchoolB = '';
  let comparisonBarChart = null;

  // Helper to determine school size based on OBEC standards (2569 total)
  function getSchoolSize(school) {
    const pData = school[targetPeriod] || school[selectedPeriod] || school.y69_2 || school.y69;
    const totalStudents = pData.total.total;
    if (totalStudents < 120) return 'S';
    if (totalStudents < 500) return 'M';
    if (totalStudents < 1500) return 'L';
    return 'XL';
  }

  // Populate school dropdown dynamically based on selected sizes
  function populateSchoolDropdown() {
    // Clear original options except the first one
    schoolSelector.innerHTML = '<option value="ALL">ภาพรวมทั้งหมด (45 โรงเรียน)</option>';
    
    const filteredSchoolsForDropdown = DASHBOARD_DATA.filter(s => {
      const size = getSchoolSize(s);
      return selectedSchoolSizes.includes(size);
    });
    
    const sortedSchools = [...filteredSchoolsForDropdown].sort((a, b) => a.name.localeCompare(b.name, 'th'));
    sortedSchools.forEach(school => {
      const option = document.createElement('option');
      option.value = school.id;
      option.textContent = school.name;
      if (school.id === selectedSchool) {
        option.selected = true;
      }
      schoolSelector.appendChild(option);
    });

    // Update school count label on option 1
    schoolSelector.firstElementChild.textContent = `ภาพรวมทั้งหมด (${filteredSchoolsForDropdown.length} โรงเรียน)`;
  }

  // Chart instance
  let mainLineChart = null;

  // Initialize
  init();

  function init() {
    // 1. Populate school dropdown
    populateSchoolDropdown();

    // 2. Register Event Listeners
    schoolSelector.addEventListener('change', (e) => {
      selectedSchool = e.target.value;
      updateDashboard();
    });

    // Custom Pairwise Period Selectors
    if (basePeriodSelect && targetPeriodSelect) {
      basePeriodSelect.addEventListener('change', (e) => {
        basePeriod = e.target.value;
        syncPresetButtons();
        updateDashboard();
      });

      targetPeriodSelect.addEventListener('change', (e) => {
        targetPeriod = e.target.value;
        selectedPeriod = targetPeriod;
        syncPresetButtons();
        updateDashboard();
      });
    }

    if (quickComparePresets) {
      quickComparePresets.forEach(btn => {
        btn.addEventListener('click', (e) => {
          quickComparePresets.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          basePeriod = btn.dataset.base;
          targetPeriod = btn.dataset.target;
          selectedPeriod = targetPeriod;
          if (basePeriodSelect) basePeriodSelect.value = basePeriod;
          if (targetPeriodSelect) targetPeriodSelect.value = targetPeriod;
          updateDashboard();
        });
      });
    }

    function syncPresetButtons() {
      if (!quickComparePresets) return;
      quickComparePresets.forEach(btn => {
        if (btn.dataset.base === basePeriod && btn.dataset.target === targetPeriod) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
    }

    levelTabButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        levelTabButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedLevel = btn.dataset.level;
        updateDashboard();
      });
    });

    // Sync search boxes
    tableSearchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.trim().toLowerCase();
      topSearchInput.value = e.target.value;
      renderTable();
    });

    topSearchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.trim().toLowerCase();
      tableSearchInput.value = e.target.value;
      renderTable();
    });

    tableHeaders.forEach(th => {
      th.addEventListener('click', () => {
        const key = th.dataset.sort;
        if (!key) return;

        if (currentSortKey === key) {
          currentSortDir = currentSortDir === 'asc' ? 'desc' : 'asc';
        } else {
          currentSortKey = key;
          currentSortDir = 'desc';
        }

        tableHeaders.forEach(h => h.classList.remove('sorted-asc', 'sorted-desc'));
        th.classList.add(currentSortDir === 'asc' ? 'sorted-asc' : 'sorted-desc');

        renderTable();
      });
    });

    btnExport.addEventListener('click', (e) => {
      e.preventDefault();
      window.print();
    });

    btnRefresh.addEventListener('click', (e) => {
      e.preventDefault();
      updateDashboard();
    });

    // Close School Detail Modal Event Listeners
    const closeSchoolDetailBtn = document.getElementById('closeSchoolDetailBtn');
    const schoolDetailModal = document.getElementById('schoolDetailModal');
    
    if (closeSchoolDetailBtn && schoolDetailModal) {
      closeSchoolDetailBtn.addEventListener('click', () => {
        schoolDetailModal.style.display = 'none';
      });
      
      schoolDetailModal.addEventListener('click', (e) => {
        if (e.target === schoolDetailModal) {
          schoolDetailModal.style.display = 'none';
        }
      });
    }

    // School Clustering Tabs Click Event Listeners
    const clusterButtons = document.querySelectorAll('.cluster-tab-btn');
    clusterButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        clusterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentClusterFilter = btn.getAttribute('data-filter');
        renderTable();
      });
    });

    if (btnPresent) {
      btnPresent.addEventListener('click', (e) => {
        e.preventDefault();
        alert('เริ่มโหมดนำเสนอสำหรับที่ประชุมผู้บริหาร สพม.สกลนคร');
      });
    }

    // 5. Sidebar Menu Click Navigation & Actions
    const menuDashboard = document.getElementById('menuDashboard');
    const menuStudents = document.getElementById('menuStudents');
    const menuClassrooms = document.getElementById('menuClassrooms');
    const menuAnalytics = document.getElementById('menuAnalytics');
    const menuComparison = document.getElementById('menuComparison');
    const menuInsights = document.getElementById('menuInsights');
    const menuSettings = document.getElementById('menuSettings');

    const settingsModal = document.getElementById('settingsModal');
    const closeSettingsBtn = document.getElementById('closeSettingsBtn');

    const menuItems = [menuDashboard, menuStudents, menuClassrooms, menuAnalytics, menuComparison, menuInsights, menuSettings];

    function setActiveMenu(activeItem) {
      menuItems.forEach(item => {
        if (item) item.classList.remove('active');
      });
      if (activeItem) activeItem.classList.add('active');
    }

    if (menuDashboard) {
      menuDashboard.addEventListener('click', (e) => {
        e.preventDefault();
        setActiveMenu(menuDashboard);
        document.getElementById('topSection').scrollIntoView({ behavior: 'smooth' });
      });
    }

    if (menuStudents) {
      menuStudents.addEventListener('click', (e) => {
        e.preventDefault();
        setActiveMenu(menuStudents);
        const panel = document.getElementById('studentsChartPanel');
        panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
        panel.classList.remove('glow-highlight');
        void panel.offsetWidth; // Trigger reflow
        panel.classList.add('glow-highlight');
        setTimeout(() => panel.classList.remove('glow-highlight'), 1500);
      });
    }

    if (menuClassrooms) {
      menuClassrooms.addEventListener('click', (e) => {
        e.preventDefault();
        setActiveMenu(menuClassrooms);
        const panel = document.getElementById('kpiCardRooms');
        panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        const kpiRooms = document.getElementById('kpiCardRooms');
        const kpiDensity = document.getElementById('kpiCardDensity');
        
        kpiRooms.classList.remove('glow-highlight');
        kpiDensity.classList.remove('glow-highlight');
        void kpiRooms.offsetWidth; // Trigger reflow
        kpiRooms.classList.add('glow-highlight');
        kpiDensity.classList.add('glow-highlight');
        setTimeout(() => {
          kpiRooms.classList.remove('glow-highlight');
          kpiDensity.classList.remove('glow-highlight');
        }, 1500);
      });
    }

    if (menuAnalytics) {
      menuAnalytics.addEventListener('click', (e) => {
        e.preventDefault();
        setActiveMenu(menuAnalytics);
        const panel = document.getElementById('tableSection');
        panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
        panel.classList.remove('glow-highlight');
        void panel.offsetWidth;
        panel.classList.add('glow-highlight');
        setTimeout(() => panel.classList.remove('glow-highlight'), 1500);
      });
    }

    if (menuComparison) {
      menuComparison.addEventListener('click', (e) => {
        e.preventDefault();
        setActiveMenu(menuComparison);
        const panel = document.getElementById('comparisonSection');
        panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
        panel.classList.remove('glow-highlight');
        void panel.offsetWidth;
        panel.classList.add('glow-highlight');
        setTimeout(() => panel.classList.remove('glow-highlight'), 1500);
      });
    }

    if (menuInsights) {
      menuInsights.addEventListener('click', (e) => {
        e.preventDefault();
        setActiveMenu(menuInsights);
        const panel = document.getElementById('insightsSection');
        panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
        panel.classList.remove('glow-highlight');
        void panel.offsetWidth;
        panel.classList.add('glow-highlight');
        setTimeout(() => panel.classList.remove('glow-highlight'), 1500);
      });
    }

    // Modal open
    if (menuSettings && settingsModal) {
      menuSettings.addEventListener('click', (e) => {
        e.preventDefault();
        setActiveMenu(menuSettings);
        settingsModal.style.display = 'flex';
      });
    }

    // Modal close
    if (closeSettingsBtn && settingsModal) {
      closeSettingsBtn.addEventListener('click', () => {
        settingsModal.style.display = 'none';
        setActiveMenu(menuDashboard); // Return to default dashboard item
      });
      
      settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
          settingsModal.style.display = 'none';
          setActiveMenu(menuDashboard);
        }
      });
    }

    // Settings logic: Theme Accent Colors
    const colorDots = document.querySelectorAll('.color-dot');
    colorDots.forEach(dot => {
      dot.addEventListener('click', (e) => {
        colorDots.forEach(d => d.classList.remove('active'));
        e.target.classList.add('active');
        
        const color = e.target.dataset.color;
        let primaryColor = '#1a73e8'; // default blue
        let primaryHover = '#1557b0';
        let primaryLight = '#e8f0fe';

        if (color === 'green') {
          primaryColor = '#137333';
          primaryHover = '#0f5b28';
          primaryLight = '#e6f4ea';
        } else if (color === 'red') {
          primaryColor = '#c5221f';
          primaryHover = '#a11b19';
          primaryLight = '#fce8e6';
        } else if (color === 'orange') {
          primaryColor = '#b06000';
          primaryHover = '#8a4b00';
          primaryLight = '#fef7e0';
        } else if (color === 'purple') {
          primaryColor = '#7627cf';
          primaryHover = '#5c1ea3';
          primaryLight = '#f3e8ff';
        }

        // Apply dynamically to CSS variables root
        document.documentElement.style.setProperty('--color-primary', primaryColor);
        document.documentElement.style.setProperty('--color-primary-hover', primaryHover);
        document.documentElement.style.setProperty('--color-primary-light', primaryLight);
        
        currentPrimaryColor = primaryColor; // Save to state

        // Update charts to reflect primary accent color change!
        if (mainLineChart) {
          const ctx = document.getElementById('mainLineChart').getContext('2d');
          const gradient69 = ctx.createLinearGradient(0, 0, 0, 260);
          gradient69.addColorStop(0, primaryColor + '2e'); // ~18% opacity in hex
          gradient69.addColorStop(1, primaryColor + '00');
          
          mainLineChart.data.datasets[0].borderColor = primaryColor;
          mainLineChart.data.datasets[0].pointBackgroundColor = primaryColor;
          mainLineChart.data.datasets[0].backgroundColor = gradient69;
          mainLineChart.update();
        }
      });
    });

    // Settings logic: Toggle Gridlines
    const settingGridlines = document.getElementById('settingGridlines');
    if (settingGridlines) {
      settingGridlines.addEventListener('change', (e) => {
        const isChecked = e.target.checked;
        if (mainLineChart) {
          mainLineChart.options.scales.x.grid.display = isChecked;
          mainLineChart.options.scales.y.grid.display = isChecked;
          mainLineChart.update();
        }
      });
    }

    // Settings logic: Toggle Alert Box
    const settingAlertBox = document.getElementById('settingAlertBox');
    const alertBox = document.getElementById('alertBox');
    if (settingAlertBox && alertBox) {
      settingAlertBox.addEventListener('change', (e) => {
        alertBox.style.display = e.target.checked ? 'flex' : 'none';
      });
    }

    // 1. Chart Metric Selector listener
    const settingChartMetric = document.getElementById('settingChartMetric');
    if (settingChartMetric) {
      settingChartMetric.addEventListener('change', (e) => {
        chartMetric = e.target.value;
        updateDashboard();
      });
    }

    // 2. Decline Threshold range slider listener
    const settingDeclineThreshold = document.getElementById('settingDeclineThreshold');
    const labelDeclineThreshold = document.getElementById('labelDeclineThreshold');
    if (settingDeclineThreshold && labelDeclineThreshold) {
      settingDeclineThreshold.addEventListener('input', (e) => {
        thresholdDecline = -parseFloat(e.target.value);
        labelDeclineThreshold.textContent = `${thresholdDecline.toFixed(1)}%`;
        const stats = getFilteredStats();
        renderAlerts(stats);
        renderTable();
      });
    }

    // 3. Density Threshold range slider listener
    const settingDensityThreshold = document.getElementById('settingDensityThreshold');
    const labelDensityThreshold = document.getElementById('labelDensityThreshold');
    if (settingDensityThreshold && labelDensityThreshold) {
      settingDensityThreshold.addEventListener('input', (e) => {
        thresholdDensity = parseInt(e.target.value);
        labelDensityThreshold.textContent = `${thresholdDensity.toFixed(1)} คน/ห้อง`;
        const stats = getFilteredStats();
        renderAlerts(stats);
        renderTable();
      });
    }

    // 4. School Size Checkboxes listeners
    const settingSchoolSizes = document.querySelectorAll('.setting-school-size');
    settingSchoolSizes.forEach(cb => {
      cb.addEventListener('change', () => {
        selectedSchoolSizes = Array.from(settingSchoolSizes)
          .filter(c => c.checked)
          .map(c => c.value);
        
        populateSchoolDropdown();
        updateDashboard();
      });
    });

    // 5. Dark Mode Toggle listener
    const settingDarkMode = document.getElementById('settingDarkMode');
    if (settingDarkMode) {
      settingDarkMode.addEventListener('change', (e) => {
        isDarkMode = e.target.checked;
        if (isDarkMode) {
          document.body.classList.add('dark-theme');
        } else {
          document.body.classList.remove('dark-theme');
        }
        // Force redraw line chart to adapt colors
        const stats = getFilteredStats();
        renderLineChart(stats);
      });
    }

    // Default sorting column
    document.querySelector('th[data-sort="change"]').classList.add('sorted-desc');

    // Responsive Mobile Sidebar Toggle
    const menuToggleBtn = document.getElementById('menuToggleBtn');
    const sidebar = document.querySelector('.sidebar');
    const sidebarBackdrop = document.getElementById('sidebarBackdrop');

    if (menuToggleBtn && sidebar && sidebarBackdrop) {
      menuToggleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        sidebar.classList.toggle('open');
        sidebarBackdrop.classList.toggle('active');
      });

      sidebarBackdrop.addEventListener('click', () => {
        sidebar.classList.remove('open');
        sidebarBackdrop.classList.remove('active');
      });

      // Close sidebar drawer after navigating on mobile
      const navLinks = document.querySelectorAll('.nav-menu a');
      navLinks.forEach(link => {
        link.addEventListener('click', () => {
          sidebar.classList.remove('open');
          sidebarBackdrop.classList.remove('active');
        });
      });
    }

    updateDashboard();
  }

  // Calculate filtered stats
  function getFilteredStats() {
    let filteredSchools = DASHBOARD_DATA;
    
    // Filter schools by size
    filteredSchools = filteredSchools.filter(s => {
      const size = getSchoolSize(s);
      return selectedSchoolSizes.includes(size);
    });

    if (selectedSchool !== 'ALL') {
      filteredSchools = DASHBOARD_DATA.filter(s => s.id === selectedSchool);
    }

    const initStat = () => ({
      students: 0, rooms: 0, male: 0, female: 0,
      grades: { ม1: 0, ม2: 0, ม3: 0, ม4: 0, ม5: 0, ม6: 0 },
      roomsGrades: { ม1: 0, ม2: 0, ม3: 0, ม4: 0, ม5: 0, ม6: 0 }
    });

    let stats = {
      y68: initStat(),
      y69_1: initStat(),
      y69_2: initStat(),
      68: null,
      '69_1': null,
      '69_2': null
    };

    const accumulate = (target, pData) => {
      if (!pData) return;
      if (selectedLevel === 'ALL') {
        target.students += pData.total.total;
        target.rooms += pData.total.rooms;
        target.male += pData.total.m;
        target.female += pData.total.f;
      } else {
        const lvlData = pData.levels[selectedLevel];
        target.students += lvlData.total;
        target.rooms += lvlData.rooms;
        target.male += lvlData.m;
        target.female += lvlData.f;
      }
      for (let i = 1; i <= 6; i++) {
        target.grades[`ม${i}`] += pData.grades[`ม${i}`].total;
        target.roomsGrades[`ม${i}`] += pData.grades[`ม${i}`].rooms;
      }
    };

    filteredSchools.forEach(sch => {
      accumulate(stats.y68, sch.y68);
      accumulate(stats.y69_1, sch.y69_1);
      accumulate(stats.y69_2, sch.y69_2);
    });

    stats[68] = stats.y68;
    stats['69_1'] = stats.y69_1;
    stats['69_2'] = stats.y69_2;
    stats[69] = stats[targetPeriod] || stats.y69_2;

    return stats;
  }

  // Update dashboard components
  function updateDashboard() {
    const stats = getFilteredStats();
    
    updateKPIs(stats);
    renderLineChart(stats);
    renderTopSchools();
    renderAlerts(stats);
    renderTable();
    
    // Add call to new views
    updateComparison();
    updateInsightsView();
  }

  function updateKPIs(stats) {
    const totalSchoolsCount = selectedSchool === 'ALL' ? DASHBOARD_DATA.length : 1;
    kpiSchoolsVal.textContent = totalSchoolsCount;

    const baseLabel = getPeriodLabel(basePeriod);
    const targetLabel = getPeriodLabel(targetPeriod);

    if (kpiStudentsUnit) kpiStudentsUnit.textContent = `คน (${targetLabel})`;
    if (kpiRoomsUnit) kpiRoomsUnit.textContent = `ห้อง (${targetLabel})`;

    // Students Card
    const stdBase = (stats[basePeriod] || stats.y68).students;
    const stdTarget = (stats[targetPeriod] || stats.y69_2).students;
    const stdDiff = stdTarget - stdBase;
    const stdPct = stdBase > 0 ? (stdDiff / stdBase) * 100 : 0;
    
    kpiStudentsVal.textContent = stdTarget.toLocaleString();
    if (basePeriod !== targetPeriod) {
      updateBadge(badgeStudents, stdPct, true, false, baseLabel);
    } else {
      badgeStudents.className = 'trend-badge stable';
      badgeStudents.textContent = 'รอบเดียวกัน (0%)';
    }

    // Rooms Card
    const rmsBase = (stats[basePeriod] || stats.y68).rooms;
    const rmsTarget = (stats[targetPeriod] || stats.y69_2).rooms;
    const rmsDiff = rmsTarget - rmsBase;
    const rmsPct = rmsBase > 0 ? (rmsDiff / rmsBase) * 100 : 0;
    
    kpiRoomsVal.textContent = rmsTarget.toLocaleString();
    if (basePeriod !== targetPeriod) {
      updateBadge(badgeRooms, rmsPct, true, false, baseLabel);
    } else {
      badgeRooms.className = 'trend-badge stable';
      badgeRooms.textContent = 'รอบเดียวกัน (0%)';
    }

    // Density Card (Students/Room Ratio)
    const ratioBase = rmsBase > 0 ? stdBase / rmsBase : 0;
    const ratioTarget = rmsTarget > 0 ? stdTarget / rmsTarget : 0;
    const ratioDiff = ratioTarget - ratioBase;

    kpiDensityVal.textContent = ratioTarget.toFixed(1);
    if (basePeriod !== targetPeriod) {
      updateBadge(badgeDensity, ratioDiff, false, true, baseLabel);
    } else {
      badgeDensity.className = 'trend-badge stable';
      badgeDensity.textContent = 'รอบเดียวกัน (0.0)';
    }
  }

  // Helper to update trend badges
  function updateBadge(badgeElement, val, isPercentage = true, reversePolarity = false, compareLabel = '') {
    badgeElement.classList.remove('positive', 'negative', 'stable');
    
    const displayVal = isPercentage ? `${val >= 0 ? '+' : ''}${val.toFixed(1)}%` : `${val >= 0 ? '+' : ''}${val.toFixed(1)}`;
    const suffix = compareLabel ? ` vs ${compareLabel}` : '';
    
    if (val > 0) {
      badgeElement.classList.add(reversePolarity ? 'negative' : 'positive');
      badgeElement.innerHTML = val > 0 && !reversePolarity ? `↗ ${displayVal}${suffix}` : `▲ ${displayVal}${suffix}`;
    } else if (val < 0) {
      badgeElement.classList.add(reversePolarity ? 'positive' : 'negative');
      badgeElement.innerHTML = val < 0 && reversePolarity ? `↘ ${displayVal}${suffix}` : `▼ ${displayVal}${suffix}`;
    } else {
      badgeElement.classList.add('stable');
      badgeElement.innerHTML = `คงที่ ${displayVal}${suffix}`;
    }
  }

  // Render Line Area Chart for Pairwise Comparison
  function renderLineChart(stats) {
    const isDarkTheme = document.body.classList.contains('dark-theme');
    const gridColor = isDarkTheme ? '#3c4043' : '#eef1f6'; 
    const textColor = isDarkTheme ? '#9aa0a6' : '#5f6368'; 

    let labels = [];
    let dataBase = [];
    let dataTarget = [];
    let metricLabel = 'คน';

    const getGradeArray = (pKey) => {
      const g = (stats[pKey] || stats.y68).grades;
      if (selectedLevel === 'ALL') return [g.ม1, g.ม2, g.ม3, g.ม4, g.ม5, g.ม6];
      if (selectedLevel === 'มต้น') return [g.ม1, g.ม2, g.ม3];
      return [g.ม4, g.ม5, g.ม6];
    };

    const getRoomsArray = (pKey) => {
      const r = (stats[pKey] || stats.y68).roomsGrades;
      if (selectedLevel === 'ALL') return [r.ม1, r.ม2, r.ม3, r.ม4, r.ม5, r.ม6];
      if (selectedLevel === 'มต้น') return [r.ม1, r.ม2, r.ม3];
      return [r.ม4, r.ม5, r.ม6];
    };

    const getDensityArray = (pKey) => {
      const getRatio = (std, rms) => rms > 0 ? Number((std / rms).toFixed(1)) : 0;
      const g = (stats[pKey] || stats.y68).grades;
      const r = (stats[pKey] || stats.y68).roomsGrades;
      if (selectedLevel === 'ALL') return [getRatio(g.ม1, r.ม1), getRatio(g.ม2, r.ม2), getRatio(g.ม3, r.ม3), getRatio(g.ม4, r.ม4), getRatio(g.ม5, r.ม5), getRatio(g.ม6, r.ม6)];
      if (selectedLevel === 'มต้น') return [getRatio(g.ม1, r.ม1), getRatio(g.ม2, r.ม2), getRatio(g.ม3, r.ม3)];
      return [getRatio(g.ม4, r.ม4), getRatio(g.ม5, r.ม5), getRatio(g.ม6, r.ม6)];
    };

    if (selectedLevel === 'ALL') {
      labels = ['ม.1', 'ม.2', 'ม.3', 'ม.4', 'ม.5', 'ม.6'];
    } else if (selectedLevel === 'มต้น') {
      labels = ['ม.1', 'ม.2', 'ม.3'];
    } else {
      labels = ['ม.4', 'ม.5', 'ม.6'];
    }

    if (chartMetric === 'students') {
      metricLabel = 'คน';
      dataBase = getGradeArray(basePeriod);
      dataTarget = getGradeArray(targetPeriod);
    } else if (chartMetric === 'rooms') {
      metricLabel = 'ห้อง';
      dataBase = getRoomsArray(basePeriod);
      dataTarget = getRoomsArray(targetPeriod);
    } else {
      metricLabel = 'คน/ห้อง';
      dataBase = getDensityArray(basePeriod);
      dataTarget = getDensityArray(targetPeriod);
    }

    const baseLabel = getPeriodLabel(basePeriod);
    const targetLabel = getPeriodLabel(targetPeriod);

    const subTitleElem = document.getElementById('chartSubTitle');
    if (subTitleElem) {
      subTitleElem.textContent = `เปรียบเทียบแนวโน้มจำนวนนักเรียนระดับชั้น ม.1 - ม.6 (${baseLabel} ➔ ${targetLabel})`;
    }

    if (mainLineChart) {
      mainLineChart.destroy();
    }

    const ctx = document.getElementById('mainLineChart').getContext('2d');
    
    // Dynamic area gradient
    const gradientTarget = ctx.createLinearGradient(0, 0, 0, 260);
    gradientTarget.addColorStop(0, currentPrimaryColor + '38'); 
    gradientTarget.addColorStop(1, currentPrimaryColor + '00');

    const isGridChecked = document.getElementById('settingGridlines') ? document.getElementById('settingGridlines').checked : true;

    const datasets = [
      {
        label: `รอบตั้งต้น (${baseLabel})`,
        data: dataBase,
        borderColor: '#98989d',
        borderWidth: 2.2,
        borderDash: [5, 5],
        backgroundColor: 'transparent',
        fill: false,
        tension: 0.35,
        pointRadius: 4,
        pointBackgroundColor: '#98989d'
      },
      {
        label: `รอบเปรียบเทียบ (${targetLabel})`,
        data: dataTarget,
        borderColor: currentPrimaryColor,
        borderWidth: 3.2,
        backgroundColor: gradientTarget,
        fill: true,
        tension: 0.35,
        pointRadius: 5,
        pointBackgroundColor: currentPrimaryColor
      }
    ];

    mainLineChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              boxWidth: 12,
              font: { family: 'Google Sans, Sarabun', size: 12 },
              color: isDarkTheme ? '#f1f3f4' : '#202124'
            }
          },
          tooltip: {
            backgroundColor: isDarkTheme ? '#1e1f22' : '#ffffff',
            titleColor: isDarkTheme ? '#f1f3f4' : '#202124',
            bodyColor: isDarkTheme ? '#bdc1c6' : '#3c4043',
            borderColor: isDarkTheme ? '#3c4043' : '#dadce0',
            borderWidth: 1,
            boxPadding: 6,
            usePointStyle: true,
            callbacks: {
              label: (context) => ` ${context.dataset.label}: ${context.parsed.y.toLocaleString()} ${metricLabel}`,
              afterBody: (items) => {
                if (items.length >= 2) {
                  const bVal = items[0].parsed.y;
                  const tVal = items[1].parsed.y;
                  const diff = tVal - bVal;
                  const pct = bVal > 0 ? (diff / bVal) * 100 : 0;
                  return `
ผลต่างการเปลี่ยนแปลง: ${diff >= 0 ? '+' : ''}${diff.toLocaleString()} ${metricLabel} (${diff >= 0 ? '+' : ''}${pct.toFixed(1)}%)`;
                }
                return '';
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              color: textColor,
              font: { family: 'Google Sans, Sarabun', size: 12 }
            }
          },
          y: {
            grid: {
              display: isGridChecked,
              color: gridColor,
              drawBorder: false
            },
            ticks: {
              color: textColor,
              font: { family: 'Google Sans, Sarabun', size: 11 },
              callback: (val) => val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val
            }
          }
        }
      }
    });
  }

  // Render Top 5 Schools progress bars (Asset list style)
  function renderTopSchools() {
    let filteredListForTop = DASHBOARD_DATA.filter(s => {
      const size = getSchoolSize(s);
      return selectedSchoolSizes.includes(size);
    });

    let schoolList = filteredListForTop.map(school => {
      let count = 0;
      const pData = school[targetPeriod] || school[selectedPeriod] || school.y69_2;
      if (selectedLevel === 'ALL') {
        count = pData.total.total;
      } else {
        count = pData.levels[selectedLevel].total;
      }
      return {
        name: school.name,
        count: count
      };
    });

    schoolList.sort((a, b) => b.count - a.count);
    const top5 = schoolList.slice(0, 5);
    const maxVal = top5.length > 0 ? top5[0].count : 1;

    topSchoolsList.innerHTML = '';
    top5.forEach(sch => {
      const percentage = (sch.count / maxVal) * 100;
      
      const itemHTML = `
        <div class="progress-item">
          <div class="progress-meta">
            <span class="progress-name" title="${sch.name}">${sch.name}</span>
            <span class="progress-val">${sch.count.toLocaleString()} คน</span>
          </div>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill" style="width: ${percentage}%"></div>
          </div>
        </div>
      `;
      topSchoolsList.insertAdjacentHTML('beforeend', itemHTML);
    });
  }

  // Render warnings/insights for the alerts panel
  function renderAlerts(stats) {
    alertsContainer.innerHTML = '';
    let alerts = [];

    let activeSchools = DASHBOARD_DATA.filter(s => {
      const size = getSchoolSize(s);
      return selectedSchoolSizes.includes(size);
    });

    const baseLabel = getPeriodLabel(basePeriod);
    const targetLabel = getPeriodLabel(targetPeriod);

    if (selectedSchool === 'ALL') {
      // 1. Find schools with student drop in this pair
      const pairDeclining = activeSchools.map(s => {
        const pBase = s[basePeriod] || s.y68;
        const pTarget = s[targetPeriod] || s.y69_2;
        let std1 = selectedLevel === 'ALL' ? pBase.total.total : pBase.levels[selectedLevel].total;
        let std2 = selectedLevel === 'ALL' ? pTarget.total.total : pTarget.levels[selectedLevel].total;
        let diff = std2 - std1;
        let pct = std1 > 0 ? (diff / std1) * 100 : 0;
        return { name: s.name, pct: pct, diff: diff };
      })
      .filter(s => s.diff < 0)
      .sort((a, b) => a.pct - b.pct);

      if (pairDeclining.length > 0) {
        const names = pairDeclining.slice(0, 3).map(s => `${s.name} (${s.diff} คน / ${s.pct.toFixed(1)}%)`);
        alerts.push(`<div class="alert-item">⚠️ **โรงเรียนที่นักเรียนลดลงสูงสุด (${baseLabel} ➔ ${targetLabel})**: ${names.join(', ')} ${pairDeclining.length > 3 ? `และอีก ${pairDeclining.length - 3} แห่ง` : ''}</div>`);
      }

      // 2. Positive growth in this pair
      const pairGrowing = activeSchools.map(s => {
        const pBase = s[basePeriod] || s.y68;
        const pTarget = s[targetPeriod] || s.y69_2;
        let std1 = selectedLevel === 'ALL' ? pBase.total.total : pBase.levels[selectedLevel].total;
        let std2 = selectedLevel === 'ALL' ? pTarget.total.total : pTarget.levels[selectedLevel].total;
        let diff = std2 - std1;
        let pct = std1 > 0 ? (diff / std1) * 100 : 0;
        return { name: s.name, pct: pct, diff: diff };
      })
      .filter(s => s.diff > 0)
      .sort((a, b) => b.diff - a.diff);

      if (pairGrowing.length > 0) {
        const topGrow = pairGrowing.slice(0, 3).map(s => `${s.name} (+${s.diff} คน / +${s.pct.toFixed(1)}%)`);
        alerts.push(`<div class="alert-item" style="color:var(--color-success)">🟢 **โรงเรียนที่นักเรียนเพิ่มขึ้น (${baseLabel} ➔ ${targetLabel})**: ${topGrow.join(', ')} (${pairGrowing.length} โรงเรียนมียอดนักเรียนเพิ่มขึ้น)</div>`);
      }

      // 3. Find schools with high classroom density in targetPeriod
      const denseSchools = activeSchools.map(s => {
        const pData = s[targetPeriod] || s.y69_2;
        let std = selectedLevel === 'ALL' ? pData.total.total : pData.levels[selectedLevel].total;
        let room = selectedLevel === 'ALL' ? pData.total.rooms : pData.levels[selectedLevel].rooms;
        let ratio = room > 0 ? std / room : 0;
        return { name: s.name, ratio: ratio };
      })
      .filter(s => s.ratio > thresholdDensity)
      .sort((a, b) => b.ratio - a.ratio);

      if (denseSchools.length > 0) {
        const schoolNames = denseSchools.slice(0, 3).map(s => `${s.name} (${s.ratio.toFixed(1)} คน/ห้อง)`);
        alerts.push(`<div class="alert-item">⚠️ **ห้องเรียนแออัดวิกฤตใน ${targetLabel}** (เกินเกณฑ์ ${thresholdDensity} คน/ห้อง): ${schoolNames.join(', ')} ${denseSchools.length > 3 ? `และโรงเรียนอื่นอีก ${denseSchools.length - 3} แห่ง` : ''}</div>`);
      }

    } else {
      // Single school alerts
      const school = DASHBOARD_DATA.find(s => s.id === selectedSchool);
      if (school) {
        const pBase = school[basePeriod] || school.y68;
        const pTarget = school[targetPeriod] || school.y69_2;
        let std1 = selectedLevel === 'ALL' ? pBase.total.total : pBase.levels[selectedLevel].total;
        let std2 = selectedLevel === 'ALL' ? pTarget.total.total : pTarget.levels[selectedLevel].total;
        let room2 = selectedLevel === 'ALL' ? pTarget.total.rooms : pTarget.levels[selectedLevel].rooms;
        
        let diff = std2 - std1;
        let pct = std1 > 0 ? (diff / std1) * 100 : 0;
        let ratio = room2 > 0 ? std2 / room2 : 0;

        if (diff < 0) {
          alerts.push(`<div class="alert-item">⚠️ **การเปลี่ยนแปลง (${baseLabel} ➔ ${targetLabel})**: นักเรียนลดลง ${Math.abs(diff)} คน (${pct.toFixed(1)}%)</div>`);
        } else if (diff > 0) {
          alerts.push(`<div class="alert-item" style="color:var(--color-success)">🟢 **การเปลี่ยนแปลง (${baseLabel} ➔ ${targetLabel})**: นักเรียนเพิ่มขึ้น +${diff} คน (+${pct.toFixed(1)}%)</div>`);
        } else {
          alerts.push(`<div class="alert-item" style="color:var(--color-success)">🟢 ยอดนักเรียนคงที่สมบูรณ์แบบระหว่างสองช่วงเวลา</div>`);
        }

        if (ratio > thresholdDensity) {
          alerts.push(`<div class="alert-item">⚠️ **ความแออัดเฉลี่ยสูงวิกฤต**: เฉลี่ย ${ratio.toFixed(1)} คน/ห้อง เกินเกณฑ์ ${thresholdDensity} คน/ห้อง</div>`);
        } else if (ratio < 20.0 && ratio > 0) {
          alerts.push(`<div class="alert-item" style="color:var(--color-success)">🟢 **สัดส่วนห้องเรียนดีเยี่ยม**: เฉลี่ย ${ratio.toFixed(1)} คน/ห้อง ดูแลนักเรียนได้อย่างทั่วถึง</div>`);
        }
      }
    }

    if (alerts.length === 0) {
      alerts.push(`<div class="alert-item" style="color:var(--color-success)">🟢 ดัชนีความหนาแน่นและยอดรวมนักเรียนอยู่ในเกณฑ์ปกติเรียบร้อยดี</div>`);
    }

    alertsContainer.innerHTML = alerts.join('<div style="height: 8px;"></div>');
  }

  // Render comparative table
  function renderTable() {
    const baseLabel = getPeriodLabel(basePeriod);
    const targetLabel = getPeriodLabel(targetPeriod);

    if (thChange) {
      thChange.textContent = `ผลต่าง (${baseLabel} ➔ ${targetLabel}) ↕`;
    }
    if (thRooms) thRooms.textContent = `ห้องเรียน (${targetLabel}) ↕`;
    if (thDensity) thDensity.textContent = `นร./ห้อง (${targetLabel}) ↕`;

    // Filter by school sizes and clustering tabs
    let filteredSchoolsForTable = DASHBOARD_DATA.filter(s => {
      const size = getSchoolSize(s);
      return selectedSchoolSizes.includes(size);
    });

    if (currentClusterFilter === 'decline') {
      filteredSchoolsForTable = filteredSchoolsForTable.filter(s => {
        const s1 = (s[basePeriod] || s.y68).total.total;
        const s2 = (s[targetPeriod] || s.y69_2).total.total;
        return s1 > 0 && ((s2 - s1) / s1 * 100) < -1.0;
      });
    } else if (currentClusterFilter === 'overcrowded') {
      filteredSchoolsForTable = filteredSchoolsForTable.filter(s => {
        const pData = s[targetPeriod] || s.y69_2;
        const std = pData.total.total;
        const rooms = pData.total.rooms;
        const ratio = rooms > 0 ? std / rooms : 0;
        return ratio > thresholdDensity;
      });
    } else if (currentClusterFilter === 'small') {
      filteredSchoolsForTable = filteredSchoolsForTable.filter(s => {
        const pData = s[targetPeriod] || s.y69_2;
        return pData.total.total < 120;
      });
    }

    let records = filteredSchoolsForTable.map((school, index) => {
      let std68 = 0, room68 = 0;
      let std69_1 = 0, room69_1 = 0;
      let std69_2 = 0, room69_2 = 0;

      if (selectedLevel === 'ALL') {
        std68 = school.y68.total.total;
        room68 = school.y68.total.rooms;
        std69_1 = school.y69_1.total.total;
        room69_1 = school.y69_1.total.rooms;
        std69_2 = school.y69_2.total.total;
        room69_2 = school.y69_2.total.rooms;
      } else {
        std68 = school.y68.levels[selectedLevel].total;
        room68 = school.y68.levels[selectedLevel].rooms;
        std69_1 = school.y69_1.levels[selectedLevel].total;
        room69_1 = school.y69_1.levels[selectedLevel].rooms;
        std69_2 = school.y69_2.levels[selectedLevel].total;
        room69_2 = school.y69_2.levels[selectedLevel].rooms;
      }

      const pBase = school[basePeriod] || school.y68;
      const pTarget = school[targetPeriod] || school.y69_2;
      const stdBaseVal = selectedLevel === 'ALL' ? pBase.total.total : pBase.levels[selectedLevel].total;
      const stdTargetVal = selectedLevel === 'ALL' ? pTarget.total.total : pTarget.levels[selectedLevel].total;
      const roomTargetVal = selectedLevel === 'ALL' ? pTarget.total.rooms : pTarget.levels[selectedLevel].rooms;

      const diff = stdTargetVal - stdBaseVal;
      const change = stdBaseVal > 0 ? (diff / stdBaseVal) * 100 : 0;
      const ratioActive = roomTargetVal > 0 ? stdTargetVal / roomTargetVal : 0;

      return {
        id: school.id,
        name: school.name,
        std68,
        std69_1,
        std69_2,
        stdBaseVal,
        stdTargetVal,
        change,
        diff,
        room68,
        room69_1,
        room69_2,
        roomActive: roomTargetVal,
        ratioActive,
        originalIndex: index + 1
      };
    });

    if (searchQuery) {
      records = records.filter(r => r.name.toLowerCase().includes(searchQuery));
    }

    records.sort((a, b) => {
      let valA = a[currentSortKey];
      let valB = b[currentSortKey];

      if (currentSortKey === 'name') {
        return currentSortDir === 'asc' 
          ? valA.localeCompare(valB, 'th') 
          : valB.localeCompare(valA, 'th');
      }

      if (currentSortDir === 'asc') {
        return (valA || 0) - (valB || 0);
      } else {
        return (valB || 0) - (valA || 0);
      }
    });

    schoolTableBody.innerHTML = '';
    
    if (records.length === 0) {
      schoolTableBody.innerHTML = `
        <tr>
          <td colspan="10" style="text-align: center; color: var(--text-muted); padding: 30px;">
            ไม่พบข้อมูลโรงเรียนที่ค้นหา
          </td>
        </tr>
      `;
      return;
    }

    records.forEach((rec, idx) => {
      const tr = document.createElement('tr');
      tr.dataset.id = rec.id;
      
      if (selectedSchool !== 'ALL' && rec.id === selectedSchool) {
        tr.style.backgroundColor = 'var(--color-primary-light)';
        tr.style.fontWeight = '500';
      }

      let badgeClass = 'neutral';
      let changeText = '0.0%';
      if (rec.diff > 0) {
        badgeClass = 'positive';
        changeText = `+${rec.diff} คน (+${rec.change.toFixed(1)}%)`;
      } else if (rec.diff < 0) {
        badgeClass = 'negative';
        changeText = `${rec.diff} คน (${rec.change.toFixed(1)}%)`;
      } else {
        changeText = basePeriod === targetPeriod ? 'รอบเดียวกัน' : 'คงที่ (0%)';
      }

      let warningIndicator = '';
      if (rec.change < -1.5 || rec.ratioActive > thresholdDensity) {
        warningIndicator = `<span style="color: var(--color-error); font-weight: bold; font-size: 13px; margin-right: 4px;" title="วิกฤตความหนาแน่นหรืออัตรานักเรียนลดลง">⚠️</span>`;
      }

      // Highlight active columns
      const style68 = basePeriod === 'y68' || targetPeriod === 'y68' ? 'font-weight: 700; color: var(--text-main);' : 'color: #5f6368;';
      const style69_1 = basePeriod === 'y69_1' || targetPeriod === 'y69_1' ? 'font-weight: 700; color: #0284c7;' : 'color: #5f6368;';
      const style69_2 = basePeriod === 'y69_2' || targetPeriod === 'y69_2' ? 'font-weight: 700; color: var(--color-primary);' : 'color: #5f6368;';

      tr.innerHTML = `
        <td class="col-toggle" style="text-align: center; vertical-align: middle;">
          <button class="row-toggle-btn" data-id="${rec.id}">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="3">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
        </td>
        <td class="col-seq" style="color: var(--text-muted)">${idx + 1}</td>
        <td class="col-name">
          <div style="display: flex; align-items: center;">
            ${warningIndicator}
            <a href="#" class="table-school-link" data-id="${rec.id}">
              ${rec.name}
            </a>
          </div>
        </td>
        <td class="col-std68" style="${style68}">${rec.std68.toLocaleString()}</td>
        <td class="col-std69_1" style="${style69_1}">${rec.std69_1.toLocaleString()}</td>
        <td class="col-std69_2" style="${style69_2}">${rec.std69_2.toLocaleString()}</td>
        <td class="col-change">
          <span class="table-change-badge ${badgeClass}">${changeText}</span>
        </td>
        <td class="col-room">${rec.roomActive}</td>
        <td class="col-ratio" style="font-weight: 700; color: var(--text-main);">${rec.ratioActive.toFixed(1)}</td>
      `;

      schoolTableBody.appendChild(tr);
    });

    // Toggle details row on mobile & tablet
    document.querySelectorAll('.row-toggle-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const tr = btn.closest('tr');
        const nextTr = tr.nextElementSibling;
        
        if (nextTr && nextTr.classList.contains('child-row')) {
          nextTr.remove();
          tr.classList.remove('expanded');
          btn.innerHTML = `
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="3">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          `;
        } else {
          tr.classList.add('expanded');
          btn.innerHTML = `
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="3">
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          `;
          
          const recId = btn.dataset.id;
          const rec = records.find(r => r.id === recId);
          
          const childTr = document.createElement('tr');
          childTr.classList.add('child-row');
          
          let detailsHTML = '<div class="child-details-wrapper">';
          detailsHTML += `
            <div class="child-detail-item">
              <span class="detail-label">รอบตั้งต้น (${baseLabel}):</span>
              <span class="detail-val">${rec.stdBaseVal.toLocaleString()} คน</span>
            </div>
            <div class="child-detail-item">
              <span class="detail-label">รอบเปรียบเทียบ (${targetLabel}):</span>
              <span class="detail-val" style="color: var(--color-primary); font-weight: 700;">${rec.stdTargetVal.toLocaleString()} คน</span>
            </div>
            <div class="child-detail-item">
              <span class="detail-label">ผลต่าง:</span>
              <span class="detail-val">${rec.diff >= 0 ? '+' : ''}${rec.diff} คน (${rec.diff >= 0 ? '+' : ''}${rec.change.toFixed(1)}%)</span>
            </div>
            <div class="child-detail-item">
              <span class="detail-label">ห้องเรียน (${targetLabel}):</span>
              <span class="detail-val">${rec.roomActive} ห้อง</span>
            </div>
            <div class="child-detail-item">
              <span class="detail-label">นร./ห้อง (${targetLabel}):</span>
              <span class="detail-val" style="font-weight: 700;">${rec.ratioActive.toFixed(1)} คน/ห้อง</span>
            </div>
          `;
          detailsHTML += '</div>';
          
          childTr.innerHTML = `
            <td colspan="9">
              ${detailsHTML}
            </td>
          `;
          
          tr.after(childTr);
        }
      });
    });

    document.querySelectorAll('.table-school-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const schoolId = link.dataset.id;
        openSchoolDetailModal(schoolId);
      });
    });
  }

  // --- School Detail Drill-down Modal Functions ---

  function openSchoolDetailModal(schoolId) {
    const school = DASHBOARD_DATA.find(s => s.id === schoolId);
    if (!school) return;

    // Set textual information
    document.getElementById('modalSchoolName').textContent = school.name;
    document.getElementById('modalSchoolDistrict').textContent = school.districtName || 'สังกัด สพม.สกลนคร';
    
    // Set KPI summary cards
    if (document.getElementById('modalKpiStd68')) {
      document.getElementById('modalKpiStd68').textContent = `${school.y68.total.total.toLocaleString()} คน`;
    }
    if (document.getElementById('modalKpiStd69_1')) {
      document.getElementById('modalKpiStd69_1').textContent = `${school.y69_1.total.total.toLocaleString()} คน`;
    }
    if (document.getElementById('modalKpiStd69_2')) {
      document.getElementById('modalKpiStd69_2').textContent = `${school.y69_2.total.total.toLocaleString()} คน`;
    }
    if (document.getElementById('modalKpiRooms69')) {
      document.getElementById('modalKpiRooms69').textContent = `${school.y69_2.total.rooms.toLocaleString()} ห้อง`;
    }

    // Render detailed charts
    renderModalCharts(school);

    // Show modal overlay
    const modal = document.getElementById('schoolDetailModal');
    if (modal) modal.style.display = 'flex';
  }

  function renderModalCharts(school) {
    // 1. Grades Chart (ม.1 - ม.6) with 3 periods
    if (modalGradesChart) {
      modalGradesChart.destroy();
    }
    
    const gradesCtx = document.getElementById('modalGradesChart').getContext('2d');
    const grades = ['ม1', 'ม2', 'ม3', 'ม4', 'ม5', 'ม6'];
    const data68 = grades.map(g => school.y68.grades[g] ? school.y68.grades[g].total : 0);
    const data69_1 = grades.map(g => school.y69_1.grades[g] ? school.y69_1.grades[g].total : 0);
    const data69_2 = grades.map(g => school.y69_2.grades[g] ? school.y69_2.grades[g].total : 0);

    modalGradesChart = new Chart(gradesCtx, {
      type: 'bar',
      data: {
        labels: ['ม.1', 'ม.2', 'ม.3', 'ม.4', 'ม.5', 'ม.6'],
        datasets: [
          {
            label: 'ปี 2568',
            data: data68,
            backgroundColor: '#98989d',
            borderRadius: 4
          },
          {
            label: '2569 เทอม 1',
            data: data69_1,
            backgroundColor: '#0284c7',
            borderRadius: 4
          },
          {
            label: '2569 เทอม 2',
            data: data69_2,
            backgroundColor: currentPrimaryColor,
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              boxWidth: 12,
              font: { family: 'Google Sans, Sarabun' }
            }
          }
        },
        scales: {
          x: { grid: { display: false } },
          y: {
            beginAtZero: true,
            ticks: { precision: 0 }
          }
        }
      }
    });

    // 2. Gender Chart (Pie Chart for target period)
    if (modalGenderChart) {
      modalGenderChart.destroy();
    }
    
    const genderCtx = document.getElementById('modalGenderChart').getContext('2d');
    const pData = school[targetPeriod] || school.y69_2;
    const mActive = pData.total.m;
    const fActive = pData.total.f;
    const targetLabel = getPeriodLabel(targetPeriod);

    const genderTitle = document.getElementById('modalGenderTitle');
    if (genderTitle) {
      genderTitle.textContent = `สัดส่วนเพศ (ชาย / หญิง) ${targetLabel}`;
    }

    modalGenderChart = new Chart(genderCtx, {
      type: 'doughnut',
      data: {
        labels: ['นักเรียนชาย', 'นักเรียนหญิง'],
        datasets: [{
          data: [mActive, fActive],
          backgroundColor: [
            currentPrimaryColor,
            '#ea4335'
          ],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 12,
              font: { family: 'Google Sans, Sarabun' }
            }
          }
        },
        cutout: '65%'
      }
    });
  }

  // --- Pairwise School Comparison Functions ---

  function initComparison() {
    const compareSelectorA = document.getElementById('compareSelectorA');
    const compareSelectorB = document.getElementById('compareSelectorB');

    if (!compareSelectorA || !compareSelectorB) return;

    // Clear options
    compareSelectorA.innerHTML = '';
    compareSelectorB.innerHTML = '';

    const sortedSchools = [...DASHBOARD_DATA].sort((a, b) => a.name.localeCompare(b.name, 'th'));

    sortedSchools.forEach(school => {
      const optA = document.createElement('option');
      optA.value = school.id;
      optA.textContent = school.name;
      compareSelectorA.appendChild(optA);

      const optB = document.createElement('option');
      optB.value = school.id;
      optB.textContent = school.name;
      compareSelectorB.appendChild(optB);
    });

    if (sortedSchools.length >= 2) {
      comparisonSchoolA = sortedSchools[0].id;
      comparisonSchoolB = sortedSchools[1].id;
      compareSelectorA.value = comparisonSchoolA;
      compareSelectorB.value = comparisonSchoolB;
    }

    compareSelectorA.addEventListener('change', (e) => {
      comparisonSchoolA = e.target.value;
      updateComparison();
    });

    compareSelectorB.addEventListener('change', (e) => {
      comparisonSchoolB = e.target.value;
      updateComparison();
    });

    updateComparison();
  }

  function updateComparison() {
    const schA = DASHBOARD_DATA.find(s => s.id === comparisonSchoolA);
    const schB = DASHBOARD_DATA.find(s => s.id === comparisonSchoolB);

    if (!schA || !schB) return;

    const baseLabel = getPeriodLabel(basePeriod);
    const targetLabel = getPeriodLabel(targetPeriod);

    const getSchoolStats = (sch) => {
      const pBase = sch[basePeriod] || sch.y68;
      const pTarget = sch[targetPeriod] || sch.y69_2;
      const std1 = pBase.total.total;
      const std2 = pTarget.total.total;
      const diff = std2 - std1;
      const change = std1 > 0 ? (diff / std1) * 100 : 0;
      const roomsActive = pTarget.total.rooms;
      const ratioActive = roomsActive > 0 ? std2 / roomsActive : 0;
      
      const size = getSchoolSize(sch);
      let sizeText = 'ขนาดเล็ก (S)';
      if (size === 'M') sizeText = 'ขนาดกลาง (M)';
      if (size === 'L') sizeText = 'ขนาดใหญ่ (L)';
      if (size === 'XL') sizeText = 'ขนาดใหญ่พิเศษ (XL)';

      return { std1, std2, diff, change, roomsActive, ratioActive, sizeText };
    };

    const statsA = getSchoolStats(schA);
    const statsB = getSchoolStats(schB);

    // Update dynamic period labels for School A & B
    const labelBaseA = document.getElementById('compareLabelBaseA');
    const labelTargetA = document.getElementById('compareLabelTargetA');
    const labelBaseB = document.getElementById('compareLabelBaseB');
    const labelTargetB = document.getElementById('compareLabelTargetB');
    if (labelBaseA) labelBaseA.textContent = `นักเรียน ${baseLabel}`;
    if (labelTargetA) labelTargetA.textContent = `นักเรียน ${targetLabel}`;
    if (labelBaseB) labelBaseB.textContent = `นักเรียน ${baseLabel}`;
    if (labelTargetB) labelTargetB.textContent = `นักเรียน ${targetLabel}`;

    const chartTitleEl = document.getElementById('comparisonBarChartTitle');
    if (chartTitleEl) {
      chartTitleEl.innerHTML = `📊 กราฟแท่งเปรียบเทียบสัดส่วนนักเรียนรายชั้นเรียน (${targetLabel}) (ม.1 - ม.6)`;
    }

    // Update School A Card
    document.getElementById('compareNameA').textContent = schA.name;
    document.getElementById('compareSizeBadgeA').textContent = statsA.sizeText;
    document.getElementById('compareStd68A').textContent = `${statsA.std1.toLocaleString()} คน`;
    document.getElementById('compareStd69A').textContent = `${statsA.std2.toLocaleString()} คน`;
    
    const badgeA = document.getElementById('compareChangeBadgeA');
    badgeA.classList.remove('positive', 'negative', 'stable');
    if (statsA.diff > 0) {
      badgeA.classList.add('positive');
      badgeA.textContent = `↗ +${statsA.diff} คน (+${statsA.change.toFixed(1)}%)`;
    } else if (statsA.diff < 0) {
      badgeA.classList.add('negative');
      badgeA.textContent = `▼ ${statsA.diff} คน (${statsA.change.toFixed(1)}%)`;
    } else {
      badgeA.classList.add('stable');
      badgeA.textContent = 'คงที่';
    }

    document.getElementById('compareRoomsA').textContent = `${statsA.roomsActive} ห้อง`;
    document.getElementById('compareRatioA').textContent = `${statsA.ratioActive.toFixed(1)} คน/ห้อง`;

    // Update School B Card
    document.getElementById('compareNameB').textContent = schB.name;
    document.getElementById('compareSizeBadgeB').textContent = statsB.sizeText;
    document.getElementById('compareStd68B').textContent = `${statsB.std1.toLocaleString()} คน`;
    document.getElementById('compareStd69B').textContent = `${statsB.std2.toLocaleString()} คน`;

    const badgeB = document.getElementById('compareChangeBadgeB');
    badgeB.classList.remove('positive', 'negative', 'stable');
    if (statsB.diff > 0) {
      badgeB.classList.add('positive');
      badgeB.textContent = `↗ +${statsB.diff} คน (+${statsB.change.toFixed(1)}%)`;
    } else if (statsB.diff < 0) {
      badgeB.classList.add('negative');
      badgeB.textContent = `▼ ${statsB.diff} คน (${statsB.change.toFixed(1)}%)`;
    } else {
      badgeB.classList.add('stable');
      badgeB.textContent = 'คงที่';
    }

    document.getElementById('compareRoomsB').textContent = `${statsB.roomsActive} ห้อง`;
    document.getElementById('compareRatioB').textContent = `${statsB.ratioActive.toFixed(1)} คน/ห้อง`;

    // Render Side-by-Side Grade Chart
    renderComparisonChart(schA, schB);
  }

  function renderComparisonChart(schA, schB) {
    const grades = ['ม1', 'ม2', 'ม3', 'ม4', 'ม5', 'ม6'];
    const labels = ['ม.1', 'ม.2', 'ม.3', 'ม.4', 'ม.5', 'ม.6'];

    const pA = schA[targetPeriod] || schA.y69_2;
    const pB = schB[targetPeriod] || schB.y69_2;
    const dataA = grades.map(g => pA.grades[g] ? pA.grades[g].total : 0);
    const dataB = grades.map(g => pB.grades[g] ? pB.grades[g].total : 0);

    if (comparisonBarChart) {
      comparisonBarChart.destroy();
    }

    const ctx = document.getElementById('comparisonBarChart').getContext('2d');
    const isDarkTheme = document.body.classList.contains('dark-theme');
    const gridColor = isDarkTheme ? '#3c4043' : '#eef1f6'; 
    const textColor = isDarkTheme ? '#9aa0a6' : '#5f6368'; 
    
    const colorA = currentPrimaryColor;
    const colorB = '#b06000'; // Google orange

    const targetLabel = getPeriodLabel(targetPeriod);

    comparisonBarChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: `${schA.name} (${targetLabel})`,
            data: dataA,
            backgroundColor: colorA,
            borderRadius: 4,
            barPercentage: 0.8,
            categoryPercentage: 0.7
          },
          {
            label: `${schB.name} (${targetLabel})`,
            data: dataB,
            backgroundColor: colorB,
            borderRadius: 4,
            barPercentage: 0.8,
            categoryPercentage: 0.7
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              color: isDarkTheme ? '#f1f3f4' : '#202124',
              font: { family: 'Google Sans, Sarabun', size: 11 }
            }
          },
          tooltip: {
            backgroundColor: isDarkTheme ? '#1e1f22' : '#ffffff',
            titleColor: isDarkTheme ? '#f1f3f4' : '#202124',
            bodyColor: isDarkTheme ? '#bdc1c6' : '#3c4043',
            borderColor: isDarkTheme ? '#3c4043' : '#dadce0',
            borderWidth: 1,
            callbacks: {
              label: (context) => ` ${context.dataset.label}: ${context.parsed.y.toLocaleString()} คน`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              color: textColor,
              font: { family: 'Google Sans, Sarabun', size: 11 }
            }
          },
          y: {
            beginAtZero: true,
            grid: { color: gridColor },
            ticks: {
              color: textColor,
              font: { family: 'Google Sans, Sarabun', size: 11 }
            }
          }
        }
      }
    });
  }

  // Multi-Dimensional Insights & Size Analysis
  function updateInsightsView() {
    const sizeStats = {
      S: { count: 0, students: 0, rooms: 0 },
      M: { count: 0, students: 0, rooms: 0 },
      L: { count: 0, students: 0, rooms: 0 },
      XL: { count: 0, students: 0, rooms: 0 }
    };

    DASHBOARD_DATA.forEach(sch => {
      const size = getSchoolSize(sch);
      const pData = sch[targetPeriod] || sch.y69_2;
      if (sizeStats[size]) {
        sizeStats[size].count += 1;
        sizeStats[size].students += pData.total.total;
        sizeStats[size].rooms += pData.total.rooms;
      }
    });

    const sizeLabels = {
      S: 'ขนาดเล็ก (< 120)',
      M: 'ขนาดกลาง (120 - 499)',
      L: 'ขนาดใหญ่ (500 - 1499)',
      XL: 'ขนาดใหญ่พิเศษ (>= 1500)'
    };

    const sizeStatsTableBody = document.getElementById('sizeStatsTableBody');
    if (sizeStatsTableBody) {
      sizeStatsTableBody.innerHTML = '';
      Object.keys(sizeStats).forEach(key => {
        const stats = sizeStats[key];
        const avgRatio = stats.rooms > 0 ? stats.students / stats.rooms : 0;
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${sizeLabels[key]}</strong></td>
          <td style="text-align: center;">${stats.count}</td>
          <td style="text-align: right;">${stats.students.toLocaleString()}</td>
          <td style="text-align: center; font-weight: 700;">${avgRatio.toFixed(1)}</td>
        `;
        sizeStatsTableBody.appendChild(tr);
      });
    }

    const densityStats = {
      crowded: { count: 0, students: 0 },
      standard: { count: 0, students: 0 },
      roomy: { count: 0, students: 0 }
    };

    DASHBOARD_DATA.forEach(sch => {
      const pData = sch[targetPeriod] || sch.y69_2;
      const ratio = pData.total.rooms > 0 ? pData.total.total / pData.total.rooms : 0;
      const students = pData.total.total;
      
      if (ratio > 35) {
        densityStats.crowded.count += 1;
        densityStats.crowded.students += students;
      } else if (ratio >= 20) {
        densityStats.standard.count += 1;
        densityStats.standard.students += students;
      } else {
        densityStats.roomy.count += 1;
        densityStats.roomy.students += students;
      }
    });

    const totalStudentsOverall = DASHBOARD_DATA.reduce((sum, s) => {
      const pData = s[targetPeriod] || s.y69_2;
      return sum + pData.total.total;
    }, 0);

    const densityStatsTableBody = document.getElementById('densityStatsTableBody');
    if (densityStatsTableBody) {
      densityStatsTableBody.innerHTML = '';
      
      const rows = [
        { label: 'แออัดหนาแน่นสูง (> 35 คน/ห้อง)', stats: densityStats.crowded, color: 'var(--color-error)' },
        { label: 'ระดับเกณฑ์ดีมาตรฐาน (20-35 คน/ห้อง)', stats: densityStats.standard, color: 'var(--color-success)' },
        { label: 'ระดับเบาบางมาก (< 20 คน/ห้อง)', stats: densityStats.roomy, color: 'var(--text-muted)' }
      ];

      rows.forEach(r => {
        const pct = totalStudentsOverall > 0 ? (r.stats.students / totalStudentsOverall) * 100 : 0;
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><span style="color: ${r.color}; font-weight: 600;">■</span> ${r.label}</td>
          <td style="text-align: center;">${r.stats.count}</td>
          <td style="text-align: right;">${r.stats.students.toLocaleString()}</td>
          <td style="text-align: center; font-weight: 700;">${pct.toFixed(1)}%</td>
        `;
        densityStatsTableBody.appendChild(tr);
      });
    }

    const policyInsightsContent = document.getElementById('policyInsightsContent');
    if (policyInsightsContent) {
      const baseLabel = getPeriodLabel(basePeriod);
      const targetLabel = getPeriodLabel(targetPeriod);

      let bullet1 = `วิเคราะห์เปรียบเทียบเชิงมิติเวลา (${baseLabel} ➔ ${targetLabel}): เพื่อการบริหารจัดการและติดตามพัฒนาการประชากรนักเรียนในสังกัด สพม.สกลนคร`;
      
      if (basePeriod === 'y69_1' && targetPeriod === 'y69_2') {
        bullet1 = `วิเคราะห์การคงอยู่ระหว่างภาคเรียน (เทอม 1 ➔ เทอม 2 ปี 2569): จำนวนนักเรียนทั้งเขตลดลง **-252 คน (-0.56%)** โดยลดลงในระดับ ม.ต้น -126 คน และ ม.ปลาย -126 คน เท่ากันพอดี`;
        bullet2 = `โรงเรียนที่สูญเสียนักเรียนระหว่างเทอมสูงสุด: **รร.เตรียมอุดมศึกษาฯ (-42 คน)**, **รร.ธาตุนารายณ์วิทยา (-39 คน)** และ **รร.มัธยมวานรนิวาส (-31 คน)**`;
        bullet3 = `โรงเรียนที่มีนักเรียนเพิ่มขึ้นสวนกระแสในเทอม 2: **รร.เทพสวัสดิ์วิทยา (+23 คน หรือ +22.8%)** เพิ่มจาก 101 เป็น 124 คน`;
        bullet4 = `การบริหารห้องเรียน: ปรับลดลง -4 ห้อง (จาก 1,396 เหลือ 1,392 ห้อง) ช่วยเพิ่มประสิทธิภาพการจัดสรรงบประมาณครู`;
      } else if (basePeriod === 'y68' && targetPeriod === 'y69_2') {
        bullet1 = `วิเคราะห์การเปลี่ยนแปลงรอบ 1 ปี (2568 ➔ 2569 เทอม 2): นักเรียนทั้งเขตลดลงสุทธิ **-837 คน (-1.84%)** (จาก 45,403 เหลือ 44,566 คน)`;
        bullet2 = `โรงเรียนขนาดเล็กและกลางลดลงรวดเร็วกว่าขนาดใหญ่ สะท้อนการเคลื่อนย้ายนักเรียนเข้าสู่สถานศึกษาศูนย์กลาง`;
        bullet3 = `ห้องเรียนความหนาแน่นวิกฤต (> 37 คน/ห้อง) ยังคงกระจุกตัวที่ **รร.ธาตุนารายณ์วิทยา** และ **รร.สกลราชวิทยานุกูล**`;
        bullet4 = `ข้อเสนอแนะ: เตรียมแผนรับมือนักเรียนแรกเข้า ม.1 ที่มีแนวโน้มลดลงต่อเนื่องตามอัตราการเกิดของประชากร`;
      } else {
        bullet1 = `วิเคราะห์เปรียบเทียบข้อมูลระหว่าง **${baseLabel}** และ **${targetLabel}**: สะท้อนแนวโน้มการเปลี่ยนแปลงตามนโยบาย`;
        bullet2 = `สามารถเลือกสลับคู่เปรียบเทียบอื่นได้อิสระจากแถบควบคุมด้านบน`;
        bullet3 = `รายงานระบบแสดงผลสถิติที่จัดกลุ่มตามขนาดโรงเรียนและความหนาแน่นห้องเรียนอย่างเป็นกลาง`;
        bullet4 = `ส่งออกรายงานผ่านปุ่ม '+ ส่งออกรายงาน PDF' เพื่อนำเสนอต่อคณะกรรมการบริหารเขตพื้นที่ฯ ได้ทันที`;
      }

      policyInsightsContent.innerHTML = `
        <div class="insight-bullet">${bullet1}</div>
        <div class="insight-bullet">${bullet2}</div>
        <div class="insight-bullet">${bullet3}</div>
        <div class="insight-bullet">${bullet4}</div>
      `;
    }
  }

  // Hook initComparison inside init()
  initComparison();

});
