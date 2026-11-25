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
    if (pKey === 'y68' || pKey === 'y68_1') return '2568 เทอม 1';
    if (pKey === 'y68_2') return '2568 เทอม 2';
    if (pKey === 'y68_3') return '2568 สิ้นปี';
    if (pKey === 'y69_1') return '2569 เทอม 1';
    if (pKey === 'y69_2') return '2569 เทอม 2';
    return pKey;
  }

  function getPeriodFullLabel(pKey) {
    if (pKey === 'y68' || pKey === 'y68_1') return 'ปี 2568 เทอม 1 (10 มิ.ย. 68)';
    if (pKey === 'y68_2') return 'ปี 2568 เทอม 2 (10 พ.ย. 68)';
    if (pKey === 'y68_3') return 'ปี 2568 สิ้นปี (30 เม.ย. 69)';
    if (pKey === 'y69_1') return 'ปี 2569 เทอม 1 (10 มิ.ย. 69)';
    if (pKey === 'y69_2') return 'ปี 2569 เทอม 2 (10 พ.ย. 69)';
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
  let currentPrimaryColor = '#10233F'; // DocumantStudio Dark Navy (--brand-900)

  // State variables for Pairwise School Comparison
  let comparisonSchoolA = '';
  let comparisonSchoolB = '';
  let comparisonBarChart = null;

  // State variables for Zero Dropout (Step 1)
  let retentionCurrentMode = 'semester_69';
  let retentionSearchQuery = '';
  let retentionRiskFilter = 'ALL';
  let retentionChartTopDropInstance = null;
  let retentionChartByGradeInstance = null;

  // State variables for District & Cluster Analytics (Step 2)
  let districtCurrentView = 'cluster'; // 'cluster' or 'amphoe'
  let districtChartShareInstance = null;
  let districtChartDensityInstance = null;

  // State variables for Predictive Analytics (Step 3)
  let forecastCurrentScenario = 'baseline'; // 'baseline', 'optimistic', 'pessimistic'
  let forecastSearchQuery = '';
  let forecastChartTrendlineInstance = null;
  let forecastChartByGradeInstance = null;

  // State variables for Teacher Staffing & Budget (Step 4)
  let resourceCurrentView = 'staffing'; // 'staffing' or 'budget'
  let resourceSearchQuery = '';
  let resourceChartStaffInstance = null;
  let resourceChartBudgetInstance = null;

  // Helper to get clean display name (Two-tier naming architecture)
  function getSchoolDisplayName(school) {
    if (!school) return '';
    return school.shortName || school.name;
  }

  // Helper to determine school size based on OBEC standards (ประกาศ 26 พ.ค. 2569 บังคับใช้ 2569-2570)
  function getSchoolSize(school) {
    const pData = school[targetPeriod] || school[selectedPeriod] || school.y69_2 || school.y69;
    const totalStudents = pData?.total?.total || 0;
    if (totalStudents <= 119) return 'S';
    if (totalStudents <= 719) return 'M';
    if (totalStudents <= 1679) return 'L';
    return 'XL';
  }

  // Helper to get pairwise comparison statistics for a school
  function getSchoolStats(sch, bPer = basePeriod, tPer = targetPeriod) {
    const pBase = sch[bPer] || sch.y68;
    const pTarget = sch[tPer] || sch.y69_2;
    const std1 = pBase?.total?.total || 0;
    const std2 = pTarget?.total?.total || 0;
    const diff = std2 - std1;
    const change = std1 > 0 ? (diff / std1) * 100 : 0;
    const roomsActive = pTarget?.total?.rooms || 0;
    const ratioActive = roomsActive > 0 ? std2 / roomsActive : 0;
    
    const size = getSchoolSize(sch);
    let sizeText = 'ขนาดเล็ก (S)';
    if (size === 'M') sizeText = 'ขนาดกลาง (M)';
    if (size === 'L') sizeText = 'ขนาดใหญ่ (L)';
    if (size === 'XL') sizeText = 'ขนาดใหญ่พิเศษ (XL)';

    return { std1, std2, diff, change, roomsActive, ratioActive, sizeText };
  }

  // Populate school dropdown dynamically based on selected sizes
  function populateSchoolDropdown() {
    // Clear original options except the first one
    schoolSelector.innerHTML = '<option value="ALL">ภาพรวมทั้งหมด (45 โรงเรียน)</option>';
    
    const filteredSchoolsForDropdown = DASHBOARD_DATA.filter(s => {
      const size = getSchoolSize(s);
      return selectedSchoolSizes.includes(size);
    });
    
    const sortedSchools = [...filteredSchoolsForDropdown].sort((a, b) => getSchoolDisplayName(a).localeCompare(getSchoolDisplayName(b), 'th'));
    sortedSchools.forEach(school => {
      const option = document.createElement('option');
      option.value = school.id;
      option.textContent = getSchoolDisplayName(school);
      option.title = school.name;
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
        syncTimelineButtons();
        updateDashboard();
      });

      targetPeriodSelect.addEventListener('change', (e) => {
        targetPeriod = e.target.value;
        selectedPeriod = targetPeriod;
        syncPresetButtons();
        syncTimelineButtons();
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
          syncTimelineButtons();
          updateDashboard();
        });
      });
    }

    const timelineButtons = document.querySelectorAll('.timeline-btn');
    if (timelineButtons) {
      timelineButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          const p = btn.dataset.period;
          targetPeriod = p;
          selectedPeriod = p;
          // Set sensible base comparison for single-period inspection
          if (p === 'y68_1') basePeriod = 'y68_1';
          else if (p === 'y68_2') basePeriod = 'y68_1';
          else if (p === 'y68_3') basePeriod = 'y68_2';
          else if (p === 'y69_1') basePeriod = 'y68_1';
          else if (p === 'y69_2') basePeriod = 'y69_1';

          if (basePeriodSelect) basePeriodSelect.value = basePeriod;
          if (targetPeriodSelect) targetPeriodSelect.value = targetPeriod;
          syncPresetButtons();
          syncTimelineButtons();
          updateDashboard();
        });
      });
    }

    function syncTimelineButtons() {
      const timelineButtons = document.querySelectorAll('.timeline-btn');
      if (!timelineButtons) return;
      timelineButtons.forEach(btn => {
        if (btn.dataset.period === targetPeriod) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
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
    const menuExecutive = document.getElementById('menuExecutive');
    const menuStudents = document.getElementById('menuStudents');
    const menuClassrooms = document.getElementById('menuClassrooms');
    const menuAnalytics = document.getElementById('menuAnalytics');
    const menuComparison = document.getElementById('menuComparison');
    const menuRetention = document.getElementById('menuRetention');
    const menuDistricts = document.getElementById('menuDistricts');
    const menuForecast = document.getElementById('menuForecast');
    const menuResources = document.getElementById('menuResources');
    const menuInsights = document.getElementById('menuInsights');
    const menuSettings = document.getElementById('menuSettings');

    const settingsModal = document.getElementById('settingsModal');
    const closeSettingsBtn = document.getElementById('closeSettingsBtn');

    const menuItems = [menuDashboard, menuExecutive, menuStudents, menuClassrooms, menuAnalytics, menuComparison, menuRetention, menuDistricts, menuForecast, menuResources, menuInsights, menuSettings];

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

    if (menuExecutive) {
      menuExecutive.addEventListener('click', (e) => {
        e.preventDefault();
        setActiveMenu(menuExecutive);
        const panel = document.getElementById('executiveBriefSection');
        if (panel) {
          panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
          panel.classList.remove('glow-highlight');
          void panel.offsetWidth;
          panel.classList.add('glow-highlight');
          setTimeout(() => panel.classList.remove('glow-highlight'), 1500);
        }
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

    if (menuRetention) {
      menuRetention.addEventListener('click', (e) => {
        e.preventDefault();
        setActiveMenu(menuRetention);
        const panel = document.getElementById('retentionSection');
        if (panel) {
          panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
          panel.classList.remove('glow-highlight');
          void panel.offsetWidth;
          panel.classList.add('glow-highlight');
          setTimeout(() => panel.classList.remove('glow-highlight'), 1500);
        }
      });
    }

    if (menuDistricts) {
      menuDistricts.addEventListener('click', (e) => {
        e.preventDefault();
        setActiveMenu(menuDistricts);
        const panel = document.getElementById('districtSection');
        if (panel) {
          panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
          panel.classList.remove('glow-highlight');
          void panel.offsetWidth;
          panel.classList.add('glow-highlight');
          setTimeout(() => panel.classList.remove('glow-highlight'), 1500);
        }
      });
    }

    if (menuForecast) {
      menuForecast.addEventListener('click', (e) => {
        e.preventDefault();
        setActiveMenu(menuForecast);
        const panel = document.getElementById('forecastSection');
        if (panel) {
          panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
          panel.classList.remove('glow-highlight');
          void panel.offsetWidth;
          panel.classList.add('glow-highlight');
          setTimeout(() => panel.classList.remove('glow-highlight'), 1500);
        }
      });
    }

    if (menuResources) {
      menuResources.addEventListener('click', (e) => {
        e.preventDefault();
        setActiveMenu(menuResources);
        const panel = document.getElementById('resourceSection');
        if (panel) {
          panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
          panel.classList.remove('glow-highlight');
          void panel.offsetWidth;
          panel.classList.add('glow-highlight');
          setTimeout(() => panel.classList.remove('glow-highlight'), 1500);
        }
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
        let primaryColor = '#1A365D'; // default Sakon Indigo
        let primaryHover = '#10243E';
        let primaryLight = '#EBF1FA';

        if (color === 'sakon') {
          primaryColor = '#1A365D';
          primaryHover = '#10243E';
          primaryLight = '#EBF1FA';
        } else if (color === 'blue') {
          primaryColor = '#1a73e8';
          primaryHover = '#1557b0';
          primaryLight = '#e8f0fe';
        } else if (color === 'green') {
          primaryColor = '#137333';
          primaryHover = '#0f5b28';
          primaryLight = '#e6f4ea';
        } else if (color === 'red') {
          primaryColor = '#c5221f';
          primaryHover = '#a11b19';
          primaryLight = '#fce8e6';
        } else if (color === 'orange') {
          primaryColor = '#C59B27';
          primaryHover = '#A67E16';
          primaryLight = '#FEF9E7';
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

    // Sidebar Collapsible & Mobile Drawer Toggle (Desktop & Mobile)
    const menuToggleBtn = document.getElementById('menuToggleBtn');
    const sidebarCollapseBtn = document.getElementById('sidebarCollapseBtn');
    const sidebar = document.querySelector('.sidebar');
    const sidebarBackdrop = document.getElementById('sidebarBackdrop');
    const appContainer = document.querySelector('.app-container') || document.body;

    function handleSidebarToggle(e) {
      if (e) e.preventDefault();
      if (window.innerWidth > 992) {
        // Desktop: Toggle collapsed state (72px vs 250px)
        appContainer.classList.toggle('sidebar-collapsed');
        const isCollapsed = appContainer.classList.contains('sidebar-collapsed');
        localStorage.setItem('dmc_sidebar_collapsed', isCollapsed ? 'true' : 'false');
        
        // Trigger chart redraw to fit new width
        setTimeout(() => {
          window.dispatchEvent(new Event('resize'));
        }, 260);
      } else {
        // Mobile: Toggle slide-out drawer
        if (sidebar) sidebar.classList.toggle('open');
        if (sidebarBackdrop) sidebarBackdrop.classList.toggle('active');
      }
    }

    if (menuToggleBtn) {
      menuToggleBtn.addEventListener('click', handleSidebarToggle);
    }

    if (sidebarCollapseBtn) {
      sidebarCollapseBtn.addEventListener('click', (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        handleSidebarToggle(e);
      });
    }

    const brandArea = document.querySelector('.brand');
    if (brandArea) {
      brandArea.addEventListener('click', (e) => {
        if (appContainer.classList.contains('sidebar-collapsed')) {
          handleSidebarToggle(e);
        }
      });
    }

    if (sidebarBackdrop) {
      sidebarBackdrop.addEventListener('click', () => {
        if (sidebar) sidebar.classList.remove('open');
        sidebarBackdrop.classList.remove('active');
      });
    }

    // Close sidebar drawer after navigating on mobile
    const navLinks = document.querySelectorAll('.nav-menu a');
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        if (window.innerWidth <= 992 && sidebar) {
          sidebar.classList.remove('open');
          if (sidebarBackdrop) sidebarBackdrop.classList.remove('active');
        }
      });
    });

    // Restore saved collapse state on desktop load
    if (window.innerWidth > 992 && localStorage.getItem('dmc_sidebar_collapsed') === 'true') {
      appContainer.classList.add('sidebar-collapsed');
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
      grades: {
        ม1: { m: 0, f: 0, total: 0, rooms: 0 },
        ม2: { m: 0, f: 0, total: 0, rooms: 0 },
        ม3: { m: 0, f: 0, total: 0, rooms: 0 },
        ม4: { m: 0, f: 0, total: 0, rooms: 0 },
        ม5: { m: 0, f: 0, total: 0, rooms: 0 },
        ม6: { m: 0, f: 0, total: 0, rooms: 0 }
      },
      levels: {
        มต้น: { m: 0, f: 0, total: 0, rooms: 0 },
        มปลาย: { m: 0, f: 0, total: 0, rooms: 0 }
      }
    });

    let stats = {
      y68: initStat(),
      y68_1: initStat(),
      y68_2: initStat(),
      y68_3: initStat(),
      y69_1: initStat(),
      y69_2: initStat()
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
        const gKey = `ม${i}`;
        if (pData.grades && pData.grades[gKey]) {
          target.grades[gKey].m += pData.grades[gKey].m;
          target.grades[gKey].f += pData.grades[gKey].f;
          target.grades[gKey].total += pData.grades[gKey].total;
          target.grades[gKey].rooms += pData.grades[gKey].rooms;
        }
      }
      if (pData.levels?.มต้น) {
        target.levels.มต้น.m += pData.levels.มต้น.m;
        target.levels.มต้น.f += pData.levels.มต้น.f;
        target.levels.มต้น.total += pData.levels.มต้น.total;
        target.levels.มต้น.rooms += pData.levels.มต้น.rooms;
      }
      if (pData.levels?.มปลาย) {
        target.levels.มปลาย.m += pData.levels.มปลาย.m;
        target.levels.มปลาย.f += pData.levels.มปลาย.f;
        target.levels.มปลาย.total += pData.levels.มปลาย.total;
        target.levels.มปลาย.rooms += pData.levels.มปลาย.rooms;
      }
    };

    filteredSchools.forEach(sch => {
      accumulate(stats.y68, sch.y68 || sch.y68_1);
      accumulate(stats.y68_1, sch.y68_1 || sch.y68);
      accumulate(stats.y68_2, sch.y68_2);
      accumulate(stats.y68_3, sch.y68_3);
      accumulate(stats.y69_1, sch.y69_1);
      accumulate(stats.y69_2, sch.y69_2);
    });

    stats[68] = stats.y68_1;
    stats['68_1'] = stats.y68_1;
    stats['68_2'] = stats.y68_2;
    stats['68_3'] = stats.y68_3;
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
    if (typeof updateDistrictView === 'function') updateDistrictView();
    if (typeof updateForecastView === 'function') updateForecastView();
    if (typeof updateResourceView === 'function') updateResourceView();
  }

  function updateKPIs(stats) {
    const totalSchoolsCount = selectedSchool === 'ALL' ? DASHBOARD_DATA.length : 1;
    kpiSchoolsVal.textContent = totalSchoolsCount;

    const baseLabel = getPeriodLabel(basePeriod);
    const targetLabel = getPeriodLabel(targetPeriod);

    const exportActiveLabel = document.getElementById('exportActiveLabel');
    if (exportActiveLabel) {
      exportActiveLabel.textContent = `${baseLabel} ➔ ${targetLabel} (45 โรงเรียน)`;
    }

    const bannerTargetPeriodBadge = document.getElementById('bannerTargetPeriodBadge');
    const bannerCompareText = document.getElementById('bannerCompareText');
    if (bannerTargetPeriodBadge) {
      bannerTargetPeriodBadge.textContent = `${targetLabel}`;
    }
    if (bannerCompareText) {
      if (basePeriod !== targetPeriod) {
        bannerCompareText.innerHTML = `เปรียบเทียบกับรอบตั้งต้น: <strong>${baseLabel}</strong>`;
      } else {
        bannerCompareText.innerHTML = `<em>(แสดงข้อมูลเดี่ยวเฉพาะรอบนี้)</em>`;
      }
    }

    const timelineButtons = document.querySelectorAll('.timeline-btn');
    if (timelineButtons) {
      timelineButtons.forEach(btn => {
        if (btn.dataset.period === targetPeriod) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
    }

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
      if (selectedLevel === 'ALL') return [g.ม1.total, g.ม2.total, g.ม3.total, g.ม4.total, g.ม5.total, g.ม6.total];
      if (selectedLevel === 'มต้น') return [g.ม1.total, g.ม2.total, g.ม3.total];
      return [g.ม4.total, g.ม5.total, g.ม6.total];
    };

    const getRoomsArray = (pKey) => {
      const g = (stats[pKey] || stats.y68).grades;
      if (selectedLevel === 'ALL') return [g.ม1.rooms, g.ม2.rooms, g.ม3.rooms, g.ม4.rooms, g.ม5.rooms, g.ม6.rooms];
      if (selectedLevel === 'มต้น') return [g.ม1.rooms, g.ม2.rooms, g.ม3.rooms];
      return [g.ม4.rooms, g.ม5.rooms, g.ม6.rooms];
    };

    const getDensityArray = (pKey) => {
      const getRatio = (std, rms) => rms > 0 ? Number((std / rms).toFixed(1)) : 0;
      const g = (stats[pKey] || stats.y68).grades;
      if (selectedLevel === 'ALL') return [
        getRatio(g.ม1.total, g.ม1.rooms),
        getRatio(g.ม2.total, g.ม2.rooms),
        getRatio(g.ม3.total, g.ม3.rooms),
        getRatio(g.ม4.total, g.ม4.rooms),
        getRatio(g.ม5.total, g.ม5.rooms),
        getRatio(g.ม6.total, g.ม6.rooms)
      ];
      if (selectedLevel === 'มต้น') return [
        getRatio(g.ม1.total, g.ม1.rooms),
        getRatio(g.ม2.total, g.ม2.rooms),
        getRatio(g.ม3.total, g.ม3.rooms)
      ];
      return [
        getRatio(g.ม4.total, g.ม4.rooms),
        getRatio(g.ม5.total, g.ม5.rooms),
        getRatio(g.ม6.total, g.ม6.rooms)
      ];
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
        borderColor: '#C28E38', // DocumantStudio Gold Main (--gold-500)
        borderWidth: 2.2,
        borderDash: [5, 5],
        backgroundColor: 'transparent',
        fill: false,
        tension: 0.35,
        pointRadius: 4,
        pointBackgroundColor: '#C28E38'
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
            grace: '8%',
            ticks: {
              color: textColor,
              font: { family: 'Google Sans, Sarabun', size: 11 },
              callback: (val) => val.toLocaleString()
            }
          }
        }
      }
    });

    // Dynamic calculations for Executive Summary Ribbon under Chart
    const bObj = stats[basePeriod] || stats.y68;
    const tObj = stats[targetPeriod] || stats.y69_2;

    const mtonBase = (bObj.grades?.ม1?.total || 0) + (bObj.grades?.ม2?.total || 0) + (bObj.grades?.ม3?.total || 0);
    const mtonTarget = (tObj.grades?.ม1?.total || 0) + (tObj.grades?.ม2?.total || 0) + (tObj.grades?.ม3?.total || 0);
    const mtonDiff = mtonTarget - mtonBase;
    const mtonPct = mtonBase > 0 ? (mtonDiff / mtonBase) * 100 : 0;

    const mplaiBase = (bObj.grades?.ม4?.total || 0) + (bObj.grades?.ม5?.total || 0) + (bObj.grades?.ม6?.total || 0);
    const mplaiTarget = (tObj.grades?.ม4?.total || 0) + (tObj.grades?.ม5?.total || 0) + (tObj.grades?.ม6?.total || 0);
    const mplaiDiff = mplaiTarget - mplaiBase;
    const mplaiPct = mplaiBase > 0 ? (mplaiDiff / mplaiBase) * 100 : 0;

    // Peak Grade in target period
    const tGrades = tObj.grades || {};
    let peakGradeName = 'ม.1';
    let peakGradeVal = 0;
    ['ม1', 'ม2', 'ม3', 'ม4', 'ม5', 'ม6'].forEach(g => {
      const val = tGrades[g]?.total || 0;
      if (val > peakGradeVal) {
        peakGradeVal = val;
        peakGradeName = g.replace('ม', 'ม.');
      }
    });
    const totalStdTarget = tObj.students || (mtonTarget + mplaiTarget) || 1;
    const peakPct = (peakGradeVal / totalStdTarget) * 100;

    // Gender breakdown in target period
    const mTotal = tObj.male || 0;
    const fTotal = tObj.female || 0;
    const sumGender = (mTotal + fTotal) || totalStdTarget;
    const mPct = (mTotal / sumGender) * 100;
    const fPct = (fTotal / sumGender) * 100;

    const elMtonVal = document.getElementById('summaryMtonVal');
    const elMtonSub = document.getElementById('summaryMtonSub');
    const elMplaiVal = document.getElementById('summaryMplaiVal');
    const elMplaiSub = document.getElementById('summaryMplaiSub');
    const elPeakVal = document.getElementById('summaryPeakGradeVal');
    const elPeakSub = document.getElementById('summaryPeakGradeSub');
    const elGenderVal = document.getElementById('summaryGenderRatioVal');
    const elGenderSub = document.getElementById('summaryGenderRatioSub');

    if (elMtonVal) elMtonVal.textContent = `${mtonTarget.toLocaleString()} คน`;
    if (elMtonSub) {
      if (basePeriod !== targetPeriod) {
        const sign = mtonDiff >= 0 ? '+' : '';
        elMtonSub.textContent = `${sign}${mtonDiff.toLocaleString()} คน (${sign}${mtonPct.toFixed(1)}%)`;
        elMtonSub.style.color = mtonDiff < 0 ? 'var(--color-error)' : (mtonDiff > 0 ? 'var(--color-success)' : 'var(--text-muted)');
      } else {
        elMtonSub.textContent = 'รอบฐานเปรียบเทียบ';
        elMtonSub.style.color = 'var(--text-muted)';
      }
    }

    if (elMplaiVal) elMplaiVal.textContent = `${mplaiTarget.toLocaleString()} คน`;
    if (elMplaiSub) {
      if (basePeriod !== targetPeriod) {
        const sign = mplaiDiff >= 0 ? '+' : '';
        elMplaiSub.textContent = `${sign}${mplaiDiff.toLocaleString()} คน (${sign}${mplaiPct.toFixed(1)}%)`;
        elMplaiSub.style.color = mplaiDiff < 0 ? 'var(--color-error)' : (mplaiDiff > 0 ? 'var(--color-success)' : 'var(--text-muted)');
      } else {
        elMplaiSub.textContent = 'รอบฐานเปรียบเทียบ';
        elMplaiSub.style.color = 'var(--text-muted)';
      }
    }

    if (elPeakVal) elPeakVal.textContent = `${peakGradeName} (${peakGradeVal.toLocaleString()} คน)`;
    if (elPeakSub) elPeakSub.textContent = `สัดส่วน ${peakPct.toFixed(1)}% ของทั้งหมด`;

    if (elGenderVal) elGenderVal.textContent = `ชาย ${mPct.toFixed(0)}% : หญิง ${fPct.toFixed(0)}%`;
    if (elGenderSub) elGenderSub.textContent = `ชาย ${mTotal.toLocaleString()} / หญิง ${fTotal.toLocaleString()} คน`;
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
        name: getSchoolDisplayName(school),
        fullName: school.name,
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
            <span class="progress-name" title="${sch.fullName || sch.name}">${sch.name}</span>
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
        return { name: getSchoolDisplayName(s), pct: pct, diff: diff };
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
        return { name: getSchoolDisplayName(s), pct: pct, diff: diff };
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
        return { name: getSchoolDisplayName(s), ratio: ratio };
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
        return pData.total.total <= 119;
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
        name: getSchoolDisplayName(school),
        fullName: school.name,
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
      records = records.filter(r => 
        r.name.toLowerCase().includes(searchQuery) || 
        (r.fullName && r.fullName.toLowerCase().includes(searchQuery))
      );
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
            <a href="#" class="table-school-link" data-id="${rec.id}" title="${rec.fullName || rec.name}">
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

  window.openSchoolDetailModal = openSchoolDetailModal;
  function openSchoolDetailModal(schoolId) {
    const school = DASHBOARD_DATA.find(s => s.id === schoolId);
    if (!school) return;

    // Set textual information
    const modalTitleEl = document.getElementById('modalSchoolName');
    if (modalTitleEl) {
      if (school.shortName && school.shortName !== school.name) {
        modalTitleEl.innerHTML = `${school.name} <span class="system-badge" style="font-size: 11px; margin-left: 8px; vertical-align: middle; background: rgba(13, 31, 60, 0.08); color: var(--color-primary); padding: 3px 8px; border-radius: 4px; font-weight: 500;">ชื่อย่อ: ${school.shortName}</span>`;
      } else {
        modalTitleEl.textContent = school.name;
      }
    }
    const geoInfo = [school.cluster, school.amphoe ? `อ.${school.amphoe}` : '', school.districtName || 'สพม.สกลนคร'].filter(Boolean).join(' • ');
    document.getElementById('modalSchoolDistrict').textContent = geoInfo;
    
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
    const p68_1 = school.y68_1 || school.y68;
    const p68_2 = school.y68_2 || p68_1;
    const p68_3 = school.y68_3 || p68_2;
    const p69_1 = school.y69_1;
    const p69_2 = school.y69_2;

    const data68_1 = grades.map(g => p68_1.grades[g] ? p68_1.grades[g].total : 0);
    const data68_2 = grades.map(g => p68_2.grades[g] ? p68_2.grades[g].total : 0);
    const data68_3 = grades.map(g => p68_3.grades[g] ? p68_3.grades[g].total : 0);
    const data69_1 = grades.map(g => p69_1.grades[g] ? p69_1.grades[g].total : 0);
    const data69_2 = grades.map(g => p69_2.grades[g] ? p69_2.grades[g].total : 0);

    modalGradesChart = new Chart(gradesCtx, {
      type: 'bar',
      data: {
        labels: ['ม.1', 'ม.2', 'ม.3', 'ม.4', 'ม.5', 'ม.6'],
        datasets: [
          {
            label: '68/1 (10 มิ.ย. 68)',
            data: data68_1,
            backgroundColor: '#E2BA6E',
            borderRadius: 3
          },
          {
            label: '68/2 (10 พ.ย. 68)',
            data: data68_2,
            backgroundColor: '#C28E38',
            borderRadius: 3
          },
          {
            label: '68/3 สิ้นปี (30 เม.ย. 69)',
            data: data68_3,
            backgroundColor: '#94651E',
            borderRadius: 3
          },
          {
            label: '69/1 (10 มิ.ย. 69)',
            data: data69_1,
            backgroundColor: '#2563EB',
            borderRadius: 3
          },
          {
            label: '69/2 (10 พ.ย. 69)',
            data: data69_2,
            backgroundColor: currentPrimaryColor,
            borderRadius: 3
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

    const sortedSchools = [...DASHBOARD_DATA].sort((a, b) => getSchoolDisplayName(a).localeCompare(getSchoolDisplayName(b), 'th'));

    sortedSchools.forEach(school => {
      const optA = document.createElement('option');
      optA.value = school.id;
      optA.textContent = getSchoolDisplayName(school);
      optA.title = school.name;
      compareSelectorA.appendChild(optA);

      const optB = document.createElement('option');
      optB.value = school.id;
      optB.textContent = getSchoolDisplayName(school);
      optB.title = school.name;
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
    const nameAEl = document.getElementById('compareNameA');
    nameAEl.textContent = getSchoolDisplayName(schA);
    nameAEl.title = schA.name;
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
    const nameBEl = document.getElementById('compareNameB');
    nameBEl.textContent = getSchoolDisplayName(schB);
    nameBEl.title = schB.name;
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
            label: `${getSchoolDisplayName(schA)} (${targetLabel})`,
            data: dataA,
            backgroundColor: colorA,
            borderRadius: 4,
            barPercentage: 0.8,
            categoryPercentage: 0.7
          },
          {
            label: `${getSchoolDisplayName(schB)} (${targetLabel})`,
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

  // ==========================================
  // Step 1: Zero Dropout & Student Retention Intelligence Module
  // ==========================================
  function initRetentionModule() {
    const modeBtns = document.querySelectorAll('.retention-mode-btn');
    modeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        modeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        retentionCurrentMode = btn.dataset.mode;
        updateRetentionView();
      });
    });

    const searchInput = document.getElementById('retentionSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        retentionSearchQuery = e.target.value.trim().toLowerCase();
        const data = getRetentionModeData();
        renderRetentionTable(data);
      });
    }

    const riskSelect = document.getElementById('retentionRiskFilter');
    if (riskSelect) {
      riskSelect.addEventListener('change', (e) => {
        retentionRiskFilter = e.target.value;
        const data = getRetentionModeData();
        renderRetentionTable(data);
      });
    }

    const exportBtn = document.getElementById('exportRetentionExcelBtn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        exportRetentionToExcel();
      });
    }

    updateRetentionView();
  }

  function getRetentionModeData() {
    let title1 = '';
    let title2 = '';
    let periodLabel1 = '';
    let periodLabel2 = '';
    let baseColName = 'ต้นทาง (คน)';
    let targetColName = 'ปลายทาง (คน)';

    let totalBase = 0;
    let totalTarget = 0;
    let totalZeroCount = 0;

    const grades = ['ม1', 'ม2', 'ม3', 'ม4', 'ม5', 'ม6'];
    const gradeBaseTotals = { ม1: 0, ม2: 0, ม3: 0, ม4: 0, ม5: 0, ม6: 0 };
    const gradeTargetTotals = { ม1: 0, ม2: 0, ม3: 0, ม4: 0, ม5: 0, ม6: 0 };

    const records = DASHBOARD_DATA.map(s => {
      const displayName = getSchoolDisplayName(s);
      let baseVal = 0;
      let targetVal = 0;

      if (retentionCurrentMode === 'semester_69') {
        baseVal = s.y69_1?.total?.total || 0;
        targetVal = s.y69_2?.total?.total || 0;
        grades.forEach(g => {
          gradeBaseTotals[g] += s.y69_1?.grades[g]?.total || 0;
          gradeTargetTotals[g] += s.y69_2?.grades[g]?.total || 0;
        });
      } else if (retentionCurrentMode === 'semester_68') {
        baseVal = s.y68_1?.total?.total || 0;
        targetVal = s.y68_2?.total?.total || 0;
        grades.forEach(g => {
          gradeBaseTotals[g] += s.y68_1?.grades[g]?.total || 0;
          gradeTargetTotals[g] += s.y68_2?.grades[g]?.total || 0;
        });
      } else if (retentionCurrentMode === 'transition_m34') {
        baseVal = s.y68_3?.grades?.['ม3']?.total || 0;
        targetVal = s.y69_1?.grades?.['ม4']?.total || 0;
        gradeBaseTotals['ม3'] += baseVal;
        gradeTargetTotals['ม4'] += targetVal;
      } else if (retentionCurrentMode === 'cohort_m12') {
        baseVal = s.y68_1?.grades?.['ม1']?.total || 0;
        targetVal = s.y69_1?.grades?.['ม2']?.total || 0;
        gradeBaseTotals['ม1'] += baseVal;
        gradeTargetTotals['ม2'] += targetVal;
      }

      const diff = targetVal - baseVal;
      const rate = baseVal > 0 ? (targetVal / baseVal) * 100 : 0;
      const pctChange = baseVal > 0 ? (diff / baseVal) * 100 : 0;

      totalBase += baseVal;
      totalTarget += targetVal;
      if (diff >= 0) totalZeroCount++;

      let riskLevel = 'NORMAL';
      let riskBadge = '<span class="trend-badge positive" style="font-size: 11px;">🟢 ปกติ</span>';
      let policyAdvice = 'การคงอยู่ของนักเรียนอยู่ในเกณฑ์ปกติ';

      if (diff < 0) {
        if (pctChange < -1.5) {
          riskLevel = 'CRITICAL';
          riskBadge = '<span class="trend-badge negative" style="font-size: 11px; background: rgba(197, 34, 31, 0.12); color: var(--color-error); font-weight: 700;">🔴 เสี่ยงวิกฤต</span>';
          policyAdvice = 'เร่งลงพื้นที่เยี่ยมบ้าน / ประสานกลุ่มส่งเสริมฯ ติดตามรายคน';
        } else if (pctChange <= -0.5) {
          riskLevel = 'WARNING';
          riskBadge = '<span class="trend-badge warning" style="font-size: 11px; background: rgba(194, 142, 56, 0.15); color: var(--color-gold); font-weight: 600;">🟡 เสี่ยงปานกลาง</span>';
          policyAdvice = 'เฝ้าระวังเด็กย้ายถิ่นฐานตามฤดูกาล / ตรวจสอบชื่อในระบบ';
        } else {
          riskLevel = 'NORMAL';
          riskBadge = '<span class="trend-badge stable" style="font-size: 11px;">🟡 เล็กน้อย</span>';
          policyAdvice = 'แนวโน้มการย้ายเข้า-ออกตามปกติ';
        }
      } else if (diff > 0) {
        riskLevel = 'EXCELLENT';
        riskBadge = '<span class="trend-badge positive" style="font-size: 11px; background: rgba(19, 115, 51, 0.12); color: var(--color-success); font-weight: 700;">🟢 ยอดเพิ่มขึ้น</span>';
        policyAdvice = 'โรงเรียนดึงดูดนักเรียนได้ดี มีการย้ายเข้าเพิ่ม';
      } else {
        riskLevel = 'EXCELLENT';
        riskBadge = '<span class="trend-badge positive" style="font-size: 11px; background: rgba(19, 115, 51, 0.12); color: var(--color-success); font-weight: 600;">🟢 คงที่ 100%</span>';
        policyAdvice = 'รักษานักเรียนไว้ได้ครบถ้วน 100% (Zero Loss)';
      }

      return {
        id: s.id,
        name: displayName,
        fullName: s.name,
        baseVal,
        targetVal,
        diff,
        rate,
        pctChange,
        riskLevel,
        riskBadge,
        policyAdvice
      };
    });

    if (retentionCurrentMode === 'semester_69') {
      title1 = '🚨 8 อันดับโรงเรียนที่นักเรียนลดลงสูงสุด (ปี 2569 เทอม 1 ➔ 2)';
      title2 = '📊 การเปลี่ยนแปลงนักเรียนแยกตามระดับชั้น (ปี 2569)';
      periodLabel1 = '2569 เทอม 1 ➔ 2569 เทอม 2';
      periodLabel2 = '2569 เทอม 1 vs เทอม 2';
      baseColName = 'เทอม 1/69 (คน)';
      targetColName = 'เทอม 2/69 (คน)';
    } else if (retentionCurrentMode === 'semester_68') {
      title1 = '🚨 8 อันดับโรงเรียนที่นักเรียนลดลงสูงสุด (ปี 2568 เทอม 1 ➔ 2)';
      title2 = '📊 การเปลี่ยนแปลงนักเรียนแยกตามระดับชั้น (ปี 2568)';
      periodLabel1 = '2568 เทอม 1 ➔ 2568 เทอม 2';
      periodLabel2 = '2568 เทอม 1 vs เทอม 2';
      baseColName = 'เทอม 1/68 (คน)';
      targetColName = 'เทอม 2/68 (คน)';
    } else if (retentionCurrentMode === 'transition_m34') {
      title1 = '🚨 8 อันดับโรงเรียนที่มีอัตราการเรียนต่อ ม.4 ต่ำสุด';
      title2 = '📊 เปรียบเทียบผู้จบ ม.3 (สิ้นปี 68) ➔ ผู้เข้าเรียน ม.4 (เทอม 1/69)';
      periodLabel1 = 'จบ ม.3 ➔ เข้า ม.4';
      periodLabel2 = 'ระดับเขต สพม.สกลนคร';
      baseColName = 'จบ ม.3 (30 เม.ย. 69)';
      targetColName = 'เข้า ม.4 (10 มิ.ย. 69)';
    } else if (retentionCurrentMode === 'cohort_m12') {
      title1 = '🚨 8 อันดับโรงเรียนที่มีอัตราคงอยู่รุ่น ม.1 ➔ ม.2 ต่ำสุด';
      title2 = '📊 การติดตามรุ่น Cohort: ม.1 (ปี 68) ➔ ม.2 (ปี 69)';
      periodLabel1 = 'ม.1/68 ➔ ม.2/69';
      periodLabel2 = 'ระดับเขต สพม.สกลนคร';
      baseColName = 'ม.1 (10 มิ.ย. 68)';
      targetColName = 'ม.2 (10 มิ.ย. 69)';
    }

    return {
      records,
      totalBase,
      totalTarget,
      totalDiff: totalTarget - totalBase,
      totalRate: totalBase > 0 ? (totalTarget / totalBase) * 100 : 0,
      totalZeroCount,
      title1,
      title2,
      periodLabel1,
      periodLabel2,
      baseColName,
      targetColName,
      gradeBaseTotals,
      gradeTargetTotals
    };
  }

  function updateRetentionView() {
    const data = getRetentionModeData();

    // Update KPI Card 1: Retention Rate
    const rateEl = document.getElementById('retentionKpiRate');
    const rateDiffEl = document.getElementById('retentionKpiRateDiff');
    const rateSubEl = document.getElementById('retentionKpiRateSub');
    if (rateEl) rateEl.textContent = `${data.totalRate.toFixed(2)}%`;
    if (rateDiffEl) {
      if (retentionCurrentMode === 'semester_69') {
        rateDiffEl.textContent = '+0.22% vs ปี 68';
        rateDiffEl.className = 'trend-badge positive';
      } else if (retentionCurrentMode === 'semester_68') {
        rateDiffEl.textContent = 'ฐานข้อมูลปี 2568';
        rateDiffEl.className = 'trend-badge neutral';
      } else if (retentionCurrentMode === 'transition_m34') {
        rateDiffEl.textContent = 'เรียนต่อ ม.ปลาย 90.75%';
        rateDiffEl.className = 'trend-badge positive';
      } else {
        rateDiffEl.textContent = 'คงอยู่รุ่น ม.1➔ม.2';
        rateDiffEl.className = 'trend-badge positive';
      }
    }
    if (rateSubEl) {
      rateSubEl.textContent = `นักเรียนคงอยู่ ${data.totalTarget.toLocaleString()} / ${data.totalBase.toLocaleString()} คน`;
    }

    // Update KPI Card 2: Student Loss
    const dropEl = document.getElementById('retentionKpiDrop');
    const dropSubEl = document.getElementById('retentionKpiDropSub');
    if (dropEl) {
      dropEl.textContent = `${data.totalDiff > 0 ? '+' : ''}${data.totalDiff.toLocaleString()} คน`;
      dropEl.style.color = data.totalDiff < 0 ? 'var(--color-error)' : 'var(--color-success)';
    }
    if (dropSubEl) {
      const avgPerSch = (data.totalDiff / data.records.length).toFixed(1);
      dropSubEl.textContent = `เฉลี่ย ${avgPerSch} คน/โรงเรียน (${data.records.length} โรงเรียน)`;
    }

    // Update KPI Card 3: Transition Rate
    const transEl = document.getElementById('retentionKpiTransition');
    const transSubEl = document.getElementById('retentionKpiTransitionSub');
    if (transEl) {
      if (retentionCurrentMode === 'transition_m34') {
        transEl.textContent = `${data.totalRate.toFixed(2)}%`;
      } else {
        transEl.textContent = '90.75%';
      }
    }
    if (transSubEl) {
      transSubEl.textContent = 'เข้า ม.4: 7,064 คน | ไปสายอาชีพ/อื่น: 720 คน';
    }

    // Update KPI Card 4: Zero Loss Schools Count
    const zeroEl = document.getElementById('retentionKpiZeroCount');
    const zeroSubEl = document.getElementById('retentionKpiZeroSub');
    if (zeroEl) {
      zeroEl.textContent = `${data.totalZeroCount} แห่ง`;
    }
    if (zeroSubEl) {
      const pctZero = ((data.totalZeroCount / data.records.length) * 100).toFixed(1);
      zeroSubEl.textContent = `คิดเป็น ${pctZero}% ของโรงเรียนทั้งหมดในเขต`;
    }

    // Update Section Headers
    const title1El = document.getElementById('retentionChartTitle1');
    const label1El = document.getElementById('retentionChartPeriodLabel1');
    const title2El = document.getElementById('retentionChartTitle2');
    const label2El = document.getElementById('retentionChartPeriodLabel2');
    const thBaseEl = document.getElementById('thRetColBase');
    const thTargetEl = document.getElementById('thRetColTarget');

    if (title1El) title1El.textContent = data.title1;
    if (label1El) label1El.textContent = data.periodLabel1;
    if (title2El) title2El.textContent = data.title2;
    if (label2El) label2El.textContent = data.periodLabel2;
    if (thBaseEl) thBaseEl.textContent = data.baseColName;
    if (thTargetEl) thTargetEl.textContent = data.targetColName;

    // Render Table and Charts
    renderRetentionTable(data);
    renderRetentionCharts(data);
  }

  function renderRetentionTable(data) {
    const tbody = document.getElementById('retentionTableBody');
    if (!tbody) return;

    let filtered = [...data.records];

    if (retentionSearchQuery) {
      filtered = filtered.filter(r => 
        r.name.toLowerCase().includes(retentionSearchQuery) || 
        (r.fullName && r.fullName.toLowerCase().includes(retentionSearchQuery))
      );
    }

    if (retentionRiskFilter !== 'ALL') {
      filtered = filtered.filter(r => r.riskLevel === retentionRiskFilter);
    }

    // Sort: highest risk / most negative diff first
    filtered.sort((a, b) => {
      if (a.diff !== b.diff) return a.diff - b.diff;
      return a.rate - b.rate;
    });

    tbody.innerHTML = '';

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; color: var(--text-muted); padding: 30px;">
            ไม่พบข้อมูลโรงเรียนตามเงื่อนไขที่เลือก
          </td>
        </tr>
      `;
      return;
    }

    filtered.forEach((r, idx) => {
      const tr = document.createElement('tr');
      tr.dataset.id = r.id;

      let diffBadge = 'stable';
      let diffSign = '';
      if (r.diff > 0) {
        diffBadge = 'positive';
        diffSign = '+';
      } else if (r.diff < 0) {
        diffBadge = 'negative';
      }

      tr.innerHTML = `
        <td style="text-align: center; color: var(--text-muted); font-size: 11.5px;">${idx + 1}</td>
        <td>
          <a href="#" class="table-school-link" data-id="${r.id}" title="${r.fullName || r.name}" style="font-weight: 500;">
            ${r.name}
          </a>
        </td>
        <td style="text-align: right; color: var(--text-muted);">${r.baseVal.toLocaleString()}</td>
        <td style="text-align: right; font-weight: 600; color: var(--color-primary);">${r.targetVal.toLocaleString()}</td>
        <td style="text-align: right;">
          <span class="trend-badge ${diffBadge}" style="font-size: 11px;">${diffSign}${r.diff} คน (${diffSign}${r.pctChange.toFixed(1)}%)</span>
        </td>
        <td style="text-align: center; font-weight: 700; color: ${r.rate < 98 ? 'var(--color-error)' : 'var(--text-main)'};">
          ${r.rate.toFixed(1)}%
        </td>
        <td style="text-align: center;">${r.riskBadge}</td>
        <td style="font-size: 11.5px; color: var(--text-muted);">${r.policyAdvice}</td>
      `;

      // Click to open modal
      const link = tr.querySelector('.table-school-link');
      if (link) {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          openSchoolDetailModal(r.id);
        });
      }

      tbody.appendChild(tr);
    });
  }

  function renderRetentionCharts(data) {
    const isDark = document.body.classList.contains('dark-theme');
    const textColor = isDark ? '#9aa0a6' : '#5f6368';
    const gridColor = isDark ? '#3c4043' : '#eef1f6';

    // 1. Chart 1: Top Schools with Highest Drop
    const ctx1 = document.getElementById('retentionChartTopDrop')?.getContext('2d');
    if (ctx1) {
      if (retentionChartTopDropInstance) {
        retentionChartTopDropInstance.destroy();
      }

      // Sort by loss (most negative diff)
      const dropSchools = [...data.records]
        .sort((a, b) => a.diff - b.diff)
        .slice(0, 8);

      const labels1 = dropSchools.map(s => s.name);
      const values1 = dropSchools.map(s => Math.abs(s.diff));
      const colors1 = dropSchools.map(s => s.diff < 0 ? '#C5221F' : '#137333');

      retentionChartTopDropInstance = new Chart(ctx1, {
        type: 'bar',
        data: {
          labels: labels1,
          datasets: [{
            label: 'จำนวนนักเรียนที่ลดลง (คน)',
            data: values1,
            backgroundColor: colors1,
            borderRadius: 4,
            barPercentage: 0.75
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (c) => {
                  const sch = dropSchools[c.dataIndex];
                  return ` ลดลง ${sch.diff} คน (คงอยู่ ${sch.rate.toFixed(1)}%)`;
                }
              }
            }
          },
          scales: {
            x: {
              grid: { color: gridColor },
              ticks: { color: textColor, font: { family: 'Google Sans, Sarabun', size: 10.5 } }
            },
            y: {
              grid: { display: false },
              ticks: { color: textColor, font: { family: 'Google Sans, Sarabun', size: 10.5 } }
            }
          }
        }
      });
    }

    // 2. Chart 2: Grade Breakdown of Base vs Target
    const ctx2 = document.getElementById('retentionChartByGrade')?.getContext('2d');
    if (ctx2) {
      if (retentionChartByGradeInstance) {
        retentionChartByGradeInstance.destroy();
      }

      const gradeLabels = ['ม.1', 'ม.2', 'ม.3', 'ม.4', 'ม.5', 'ม.6'];
      const gradesKeys = ['ม1', 'ม2', 'ม3', 'ม4', 'ม5', 'ม6'];
      const baseData = gradesKeys.map(k => data.gradeBaseTotals[k] || 0);
      const targetData = gradesKeys.map(k => data.gradeTargetTotals[k] || 0);

      retentionChartByGradeInstance = new Chart(ctx2, {
        type: 'bar',
        data: {
          labels: gradeLabels,
          datasets: [
            {
              label: data.baseColName,
              data: baseData,
              backgroundColor: '#C28E38', // Gold
              borderRadius: 3,
              barPercentage: 0.75,
              categoryPercentage: 0.8
            },
            {
              label: data.targetColName,
              data: targetData,
              backgroundColor: '#10233F', // Navy
              borderRadius: 3,
              barPercentage: 0.75,
              categoryPercentage: 0.8
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
                color: isDark ? '#f1f3f4' : '#202124',
                font: { family: 'Google Sans, Sarabun', size: 11 }
              }
            },
            tooltip: {
              callbacks: {
                label: (c) => ` ${c.dataset.label}: ${c.parsed.y.toLocaleString()} คน`
              }
            }
          },
          scales: {
            x: {
              grid: { color: gridColor },
              ticks: { color: textColor, font: { family: 'Google Sans, Sarabun', size: 11 } }
            },
            y: {
              grid: { color: gridColor },
              ticks: { color: textColor, font: { family: 'Google Sans, Sarabun', size: 10.5 } }
            }
          }
        }
      });
    }
  }

  function exportRetentionToExcel() {
    if (typeof XLSX === 'undefined') {
      alert('โมดูล Excel กำลังโหลด กรุณาลองใหม่อีกครั้ง');
      return;
    }
    const data = getRetentionModeData();
    const rows = [
      ['ระบบติดตามและวิเคราะห์การคงอยู่ของนักเรียน (Zero Dropout & Retention Tracker) - สพม.สกลนคร'],
      ['โหมดการวิเคราะห์:', data.periodLabel1],
      ['วันที่จัดทำรายงาน:', new Date().toLocaleDateString('th-TH')],
      ['สรุปภาพรวมทั้งเขต:', `ยอดต้นทาง ${data.totalBase.toLocaleString()} คน, ยอดปลายทาง ${data.totalTarget.toLocaleString()} คน, ผลต่าง ${data.totalDiff > 0 ? '+' : ''}${data.totalDiff} คน, อัตราคงอยู่ ${data.totalRate.toFixed(2)}%`],
      [],
      ['ลำดับ', 'รหัสโรงเรียน', 'ชื่อโรงเรียน', data.baseColName, data.targetColName, 'ผลต่าง (คน)', 'อัตราคงอยู่ (%)', 'ระดับความเสี่ยง', 'ข้อเสนอแนะเชิงนโยบาย']
    ];

    // Sort by risk (most negative diff first)
    const sorted = [...data.records].sort((a, b) => a.diff - b.diff);

    sorted.forEach((r, idx) => {
      const riskText = r.riskLevel === 'CRITICAL' ? 'เสี่ยงวิกฤต' : (r.riskLevel === 'WARNING' ? 'เสี่ยงปานกลาง' : (r.riskLevel === 'EXCELLENT' ? 'คงอยู่ดีเยี่ยม' : 'ปกติ'));
      rows.push([
        idx + 1,
        r.id,
        r.fullName || r.name,
        r.baseVal,
        r.targetVal,
        r.diff,
        Number(r.rate.toFixed(2)),
        riskText,
        r.policyAdvice
      ]);
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Zero_Dropout');
    XLSX.writeFile(wb, `Zero_Dropout_Report_${retentionCurrentMode}.xlsx`);
  }

  // ==========================================
  // Step 2: District & Cluster Analytics Module
  // ==========================================
  function initDistrictModule() {
    const viewBtns = document.querySelectorAll('.district-view-btn');
    viewBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        viewBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        districtCurrentView = btn.dataset.view;
        updateDistrictView();
      });
    });

    const exportBtn = document.getElementById('exportDistrictExcelBtn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        exportDistrictToExcel();
      });
    }

    updateDistrictView();
  }

  function getDistrictData() {
    const isCluster = districtCurrentView === 'cluster';
    const groups = {};

    DASHBOARD_DATA.forEach(school => {
      const groupKey = isCluster ? (school.cluster || 'สหวิทยาเขตทั่วไป') : (school.amphoe || 'ทั่วไป');
      if (!groups[groupKey]) {
        groups[groupKey] = {
          name: groupKey,
          schools: [],
          baseStudents: 0,
          targetStudents: 0,
          targetRooms: 0
        };
      }

      const pBase = school[basePeriod] || school.y68;
      const pTarget = school[targetPeriod] || school.y69_2;

      const stdBase = selectedLevel === 'ALL' ? pBase.total.total : pBase.levels[selectedLevel].total;
      const stdTarget = selectedLevel === 'ALL' ? pTarget.total.total : pTarget.levels[selectedLevel].total;
      const roomTarget = selectedLevel === 'ALL' ? pTarget.total.rooms : pTarget.levels[selectedLevel].rooms;

      groups[groupKey].baseStudents += stdBase;
      groups[groupKey].targetStudents += stdTarget;
      groups[groupKey].targetRooms += roomTarget;
      groups[groupKey].schools.push({
        id: school.id,
        name: getSchoolDisplayName(school),
        fullName: school.name,
        std: stdTarget,
        rooms: roomTarget
      });
    });

    const groupList = Object.values(groups).map(g => {
      const diff = g.targetStudents - g.baseStudents;
      const pctChange = g.baseStudents > 0 ? (diff / g.baseStudents) * 100 : 0;
      const density = g.targetRooms > 0 ? g.targetStudents / g.targetRooms : 0;
      
      g.schools.sort((a, b) => b.std - a.std);
      const hubSchool = g.schools.length > 0 ? g.schools[0].name : '-';

      return {
        name: g.name,
        schoolCount: g.schools.length,
        schools: g.schools,
        baseStudents: g.baseStudents,
        targetStudents: g.targetStudents,
        diff,
        pctChange,
        rooms: g.targetRooms,
        density,
        hubSchool
      };
    });

    groupList.sort((a, b) => b.targetStudents - a.targetStudents);
    return groupList;
  }

  function updateDistrictView() {
    const groupList = getDistrictData();
    const targetLabel = getPeriodLabel(targetPeriod);
    const baseLabel = getPeriodLabel(basePeriod);

    const activePeriodLabel = document.getElementById('districtActivePeriodLabel');
    if (activePeriodLabel) {
      activePeriodLabel.textContent = `ข้อมูล: ${baseLabel} ➔ ${targetLabel}`;
    }

    const thName = document.getElementById('thDistName');
    if (thName) {
      thName.textContent = districtCurrentView === 'cluster' ? 'สหวิทยาเขต' : 'อำเภอ';
    }

    const thBase = document.getElementById('thDistStdBase');
    const thTarget = document.getElementById('thDistStdTarget');
    if (thBase) thBase.textContent = `นักเรียน (${baseLabel})`;
    if (thTarget) thTarget.textContent = `นักเรียน (${targetLabel})`;

    if (groupList.length > 0) {
      const topGroup = groupList[0];
      const totalStdAll = groupList.reduce((acc, g) => acc + g.targetStudents, 0);
      const topShare = totalStdAll > 0 ? (topGroup.targetStudents / totalStdAll * 100).toFixed(1) : 0;

      if (districtCurrentView === 'amphoe') {
        const topAmphoeEl = document.getElementById('districtKpiTopAmphoe');
        const topAmphoeShare = document.getElementById('districtKpiTopAmphoeShare');
        const topAmphoeSub = document.getElementById('districtKpiTopAmphoeSub');
        if (topAmphoeEl) topAmphoeEl.textContent = `อ.${topGroup.name}`;
        if (topAmphoeShare) topAmphoeShare.textContent = `${topShare}%`;
        if (topAmphoeSub) topAmphoeSub.textContent = `${topGroup.targetStudents.toLocaleString()} คน จาก ${topGroup.schoolCount} โรงเรียน`;
      } else {
        const topClusterEl = document.getElementById('districtKpiTopCluster');
        const topClusterSub = document.getElementById('districtKpiTopClusterSub');
        if (topClusterEl) topClusterEl.textContent = topGroup.name;
        if (topClusterSub) topClusterSub.textContent = `${topGroup.schoolCount} โรงเรียน | ${topGroup.targetStudents.toLocaleString()} คน (${topShare}% ของเขต)`;
      }
    }

    renderDistrictTable(groupList);
    renderDistrictCharts(groupList);
  }

  function renderDistrictTable(groupList) {
    const tbody = document.getElementById('districtTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    groupList.forEach((g, idx) => {
      const tr = document.createElement('tr');
      let diffBadge = 'stable';
      let diffSign = '';
      if (g.diff > 0) {
        diffBadge = 'positive';
        diffSign = '+';
      } else if (g.diff < 0) {
        diffBadge = 'negative';
      }

      tr.innerHTML = `
        <td style="text-align: center; color: var(--text-muted); font-size: 11.5px;">${idx + 1}</td>
        <td style="font-weight: 600; color: var(--color-primary);">
          ${districtCurrentView === 'amphoe' ? 'อ.' : ''}${g.name}
        </td>
        <td style="text-align: center;">
          <span class="trend-badge stable" style="font-size: 11px;">${g.schoolCount} แห่ง</span>
        </td>
        <td style="text-align: right; color: var(--text-muted);">${g.baseStudents.toLocaleString()}</td>
        <td style="text-align: right; font-weight: 700; color: var(--text-main);">${g.targetStudents.toLocaleString()}</td>
        <td style="text-align: right;">
          <span class="trend-badge ${diffBadge}" style="font-size: 11px;">${diffSign}${g.diff} (${diffSign}${g.pctChange.toFixed(1)}%)</span>
        </td>
        <td style="text-align: center; color: var(--text-muted);">${g.rooms}</td>
        <td style="text-align: center; font-weight: 700; color: ${g.density > thresholdDensity ? 'var(--color-error)' : 'var(--color-primary)'};">
          ${g.density.toFixed(1)}
        </td>
        <td style="font-size: 12px; color: var(--color-gold); font-weight: 500;">
          ⭐ ${g.hubSchool}
        </td>
      `;

      tbody.appendChild(tr);
    });
  }

  function renderDistrictCharts(groupList) {
    const isDark = document.body.classList.contains('dark-theme');
    const textColor = isDark ? '#9aa0a6' : '#5f6368';
    const gridColor = isDark ? '#3c4043' : '#eef1f6';

    const labels = groupList.map(g => (districtCurrentView === 'amphoe' ? 'อ.' : '') + g.name);
    const studentData = groupList.map(g => g.targetStudents);
    const densityData = groupList.map(g => Number(g.density.toFixed(1)));

    const ctx1 = document.getElementById('districtChartShare')?.getContext('2d');
    if (ctx1) {
      if (districtChartShareInstance) districtChartShareInstance.destroy();

      districtChartShareInstance = new Chart(ctx1, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'จำนวนนักเรียน (คน)',
            data: studentData,
            backgroundColor: '#10233F',
            borderRadius: 4,
            barPercentage: 0.75
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (c) => ` นักเรียน: ${c.parsed.y.toLocaleString()} คน`
              }
            }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: textColor, font: { family: 'Google Sans, Sarabun', size: 9.5 }, maxRotation: 45, minRotation: 30 }
            },
            y: {
              grid: { color: gridColor },
              ticks: { color: textColor, font: { family: 'Google Sans, Sarabun', size: 10 } }
            }
          }
        }
      });
    }

    const ctx2 = document.getElementById('districtChartDensity')?.getContext('2d');
    if (ctx2) {
      if (districtChartDensityInstance) districtChartDensityInstance.destroy();

      districtChartDensityInstance = new Chart(ctx2, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'ความหนาแน่น (คน/ห้อง)',
            data: densityData,
            backgroundColor: '#C28E38',
            borderRadius: 4,
            barPercentage: 0.75
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (c) => ` ความหนาแน่นเฉลี่ย: ${c.parsed.y} คน/ห้อง`
              }
            }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: textColor, font: { family: 'Google Sans, Sarabun', size: 9.5 }, maxRotation: 45, minRotation: 30 }
            },
            y: {
              grid: { color: gridColor },
              ticks: { color: textColor, font: { family: 'Google Sans, Sarabun', size: 10 } }
            }
          }
        }
      });
    }
  }

  function exportDistrictToExcel() {
    if (typeof XLSX === 'undefined') {
      alert('โมดูล Excel กำลังโหลด กรุณาลองใหม่อีกครั้ง');
      return;
    }
    const groupList = getDistrictData();
    const targetLabel = getPeriodLabel(targetPeriod);
    const baseLabel = getPeriodLabel(basePeriod);
    const viewName = districtCurrentView === 'cluster' ? 'สหวิทยาเขต' : 'อำเภอ';

    const rows = [
      [`รายงานสถิติข้อมูลเชิงพื้นที่และ${viewName} - สพม.สกลนคร`],
      ['รอบเวลาที่เปรียบเทียบ:', `${baseLabel} ➔ ${targetLabel}`],
      ['วันที่จัดทำรายงาน:', new Date().toLocaleDateString('th-TH')],
      [],
      ['ลำดับ', viewName, 'จำนวนโรงเรียน (แห่ง)', `นักเรียน (${baseLabel})`, `นักเรียน (${targetLabel})`, 'ผลต่าง (คน)', 'การเปลี่ยนแปลง (%)', 'ห้องเรียน', 'นร./ห้อง เฉลี่ย', 'โรงเรียนแกนนำ (Hub School)']
    ];

    groupList.forEach((g, idx) => {
      rows.push([
        idx + 1,
        g.name,
        g.schoolCount,
        g.baseStudents,
        g.targetStudents,
        g.diff,
        Number(g.pctChange.toFixed(2)),
        g.rooms,
        Number(g.density.toFixed(1)),
        g.hubSchool
      ]);
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, `District_${districtCurrentView}`);
    XLSX.writeFile(wb, `District_Analytics_Report_${districtCurrentView}.xlsx`);
  }

  // ==========================================
  // Step 3: Predictive Analytics & Demographic Forecasting Module (2570)
  // ==========================================
  function initForecastModule() {
    const scenarioBtns = document.querySelectorAll('.forecast-scenario-btn');
    scenarioBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        scenarioBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        forecastCurrentScenario = btn.dataset.scenario;
        updateForecastView();
      });
    });

    const searchInput = document.getElementById('forecastSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        forecastSearchQuery = e.target.value.trim().toLowerCase();
        renderForecastTable();
      });
    }

    const exportBtn = document.getElementById('exportForecastExcelBtn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        exportForecastToExcel();
      });
    }

    updateForecastView();
  }

  function getForecastData() {
    let factor = 1.0;
    if (forecastCurrentScenario === 'optimistic') factor = 1.015;
    if (forecastCurrentScenario === 'pessimistic') factor = 0.985;

    let totalPred = 0;
    let totalM1 = 0;
    let totalM4 = 0;
    let total68 = 0;
    let total69 = 0;

    const gradeForecastTotals = { ม1: 0, ม2: 0, ม3: 0, ม4: 0, ม5: 0, ม6: 0 };
    const grade69Totals = { ม1: 0, ม2: 0, ม3: 0, ม4: 0, ม5: 0, ม6: 0 };

    const records = DASHBOARD_DATA.map((s) => {
      const displayName = getSchoolDisplayName(s);
      const s68 = s.y68_1?.total?.total || 0;
      const s69 = s.y69_2?.total?.total || s.y69_1?.total?.total || 0;
      const rooms69 = s.y69_2?.total?.rooms || 0;

      const g69 = s.y69_2?.grades || s.y69_1?.grades || {};
      const m1_69 = g69['ม1']?.total || 0;
      const m2_69 = g69['ม2']?.total || 0;
      const m3_69 = g69['ม3']?.total || 0;
      const m4_69 = g69['ม4']?.total || 0;
      const m5_69 = g69['ม5']?.total || 0;
      const m6_69 = g69['ม6']?.total || 0;

      grade69Totals['ม1'] += m1_69;
      grade69Totals['ม2'] += m2_69;
      grade69Totals['ม3'] += m3_69;
      grade69Totals['ม4'] += m4_69;
      grade69Totals['ม5'] += m5_69;
      grade69Totals['ม6'] += m6_69;

      const pred_m1 = Math.round(m1_69 * 0.937 * factor);
      const pred_m2 = Math.round(m1_69 * 0.995 * factor);
      const pred_m3 = Math.round(m2_69 * 1.001 * factor);
      const pred_m4 = Math.round(m3_69 * 0.9075 * factor);
      const pred_m5 = Math.round(m4_69 * 0.977 * factor);
      const pred_m6 = Math.round(m5_69 * 0.987 * factor);

      const pred_total = pred_m1 + pred_m2 + pred_m3 + pred_m4 + pred_m5 + pred_m6;
      const diffPred = pred_total - s69;
      const pctPred = s69 > 0 ? (diffPred / s69) * 100 : 0;
      const suggestedRooms = Math.max(6, Math.round(pred_total / 32));

      gradeForecastTotals['ม1'] += pred_m1;
      gradeForecastTotals['ม2'] += pred_m2;
      gradeForecastTotals['ม3'] += pred_m3;
      gradeForecastTotals['ม4'] += pred_m4;
      gradeForecastTotals['ม5'] += pred_m5;
      gradeForecastTotals['ม6'] += pred_m6;

      totalPred += pred_total;
      totalM1 += pred_m1;
      totalM4 += pred_m4;
      total68 += s68;
      total69 += s69;

      let advice = 'บริหารจัดการแผนชั้นเรียนตามปกติ';
      if (pctPred < -3.0) {
        advice = 'สุ่มเสี่ยงลดลงสูง แนะนำปรับลดแผนรับ ม.1 ลง 1 ห้อง';
      } else if (pctPred > 1.0) {
        advice = 'แนวโน้มเติบโตต่อเนื่อง เตรียมความพร้อมห้องเรียนรองรับ';
      } else if (pred_total < 120) {
        advice = 'เข้าเกณฑ์โรงเรียนขนาดเล็ก (≤ 119 คน) เตรียมแผนเรียนรวม';
      }

      return {
        id: s.id,
        name: displayName,
        fullName: s.name,
        s68,
        s69,
        pred_total,
        pred_m1,
        pred_m4,
        diffPred,
        pctPred,
        rooms69,
        suggestedRooms,
        advice
      };
    });

    return {
      records,
      totalPred,
      totalM1,
      totalM4,
      total68,
      total69,
      diffTotal: totalPred - total69,
      pctTotal: total69 > 0 ? ((totalPred - total69) / total69) * 100 : 0,
      gradeForecastTotals,
      grade69Totals
    };
  }

  function updateForecastView() {
    const data = getForecastData();

    const totalEl = document.getElementById('forecastKpiTotal');
    const totalDiffEl = document.getElementById('forecastKpiTotalDiff');
    const totalSubEl = document.getElementById('forecastKpiTotalSub');
    if (totalEl) totalEl.textContent = `${data.totalPred.toLocaleString()} คน`;
    if (totalDiffEl) {
      const sign = data.diffTotal > 0 ? '+' : '';
      totalDiffEl.textContent = `${sign}${data.diffTotal.toLocaleString()} คน (${sign}${data.pctTotal.toFixed(1)}%)`;
      totalDiffEl.className = data.diffTotal < 0 ? 'trend-badge negative' : 'trend-badge positive';
    }
    if (totalSubEl) {
      totalSubEl.textContent = `จากฐาน 44,566 คน (${forecastCurrentScenario === 'baseline' ? 'แบบจำลองปกติ' : (forecastCurrentScenario === 'optimistic' ? 'สถานการณ์ดึงดูดสูง' : 'ประชากรลดลงเร่งตัว')})`;
    }

    const m1El = document.getElementById('forecastKpiM1');
    if (m1El) m1El.textContent = `${data.totalM1.toLocaleString()} คน`;

    const m4El = document.getElementById('forecastKpiM4');
    if (m4El) m4El.textContent = `${data.totalM4.toLocaleString()} คน`;

    renderForecastTable(data);
    renderForecastCharts(data);
  }

  function renderForecastTable(data) {
    if (!data) data = getForecastData();
    const tbody = document.getElementById('forecastTableBody');
    if (!tbody) return;

    let filtered = [...data.records];
    if (forecastSearchQuery) {
      filtered = filtered.filter(r => 
        r.name.toLowerCase().includes(forecastSearchQuery) || 
        (r.fullName && r.fullName.toLowerCase().includes(forecastSearchQuery))
      );
    }

    filtered.sort((a, b) => a.diffPred - b.diffPred);

    tbody.innerHTML = '';
    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 30px;">ไม่พบข้อมูลโรงเรียนตามที่ค้นหา</td></tr>`;
      return;
    }

    filtered.forEach((r, idx) => {
      const tr = document.createElement('tr');
      let diffBadge = 'stable';
      let diffSign = '';
      if (r.diffPred > 0) {
        diffBadge = 'positive';
        diffSign = '+';
      } else if (r.diffPred < 0) {
        diffBadge = 'negative';
      }

      tr.innerHTML = `
        <td style="text-align: center; color: var(--text-muted); font-size: 11.5px;">${idx + 1}</td>
        <td>
          <a href="#" class="table-school-link" data-id="${r.id}" title="${r.fullName || r.name}" style="font-weight: 500;">
            ${r.name}
          </a>
        </td>
        <td style="text-align: right; color: var(--text-muted);">${r.s68.toLocaleString()}</td>
        <td style="text-align: right; color: var(--text-muted);">${r.s69.toLocaleString()}</td>
        <td style="text-align: right; font-weight: 700; color: var(--color-gold); font-size: 13.5px;">
          ${r.pred_total.toLocaleString()}
        </td>
        <td style="text-align: right;">
          <span class="trend-badge ${diffBadge}" style="font-size: 11px;">${diffSign}${r.diffPred} (${diffSign}${r.pctPred.toFixed(1)}%)</span>
        </td>
        <td style="text-align: center; font-weight: 600;">
          ${r.suggestedRooms} ห้อง <span style="font-size: 11px; color: var(--text-muted);">(${r.rooms69 > r.suggestedRooms ? 'ลด 1' : 'คงที่'})</span>
        </td>
        <td style="font-size: 11.5px; color: var(--text-muted);">${r.advice}</td>
      `;

      const link = tr.querySelector('.table-school-link');
      if (link) {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          openSchoolDetailModal(r.id);
        });
      }

      tbody.appendChild(tr);
    });
  }

  function renderForecastCharts(data) {
    const isDark = document.body.classList.contains('dark-theme');
    const textColor = isDark ? '#9aa0a6' : '#5f6368';
    const gridColor = isDark ? '#3c4043' : '#eef1f6';

    const ctx1 = document.getElementById('forecastChartTrendline')?.getContext('2d');
    if (ctx1) {
      if (forecastChartTrendlineInstance) forecastChartTrendlineInstance.destroy();

      const labels1 = ['68/1 (10 มิ.ย.)', '68/2 (10 พ.ย.)', '68/3 สิ้นปี', '69/1 (10 มิ.ย.)', '69/2 (10 พ.ย.)', '70/1 (พยากรณ์)', '70/2 (พยากรณ์)'];
      const historicalPoints = [45403, 45047, 44808, 44818, 44566, null, null];
      const forecastPoints = [null, null, null, null, 44566, data.totalPred + Math.round(data.totalPred * 0.006), data.totalPred];

      forecastChartTrendlineInstance = new Chart(ctx1, {
        type: 'line',
        data: {
          labels: labels1,
          datasets: [
            {
              label: 'ข้อมูลจริง (2568 - 2569)',
              data: historicalPoints,
              borderColor: '#10233F',
              backgroundColor: 'rgba(16, 35, 63, 0.08)',
              borderWidth: 2.5,
              tension: 0.3,
              fill: false,
              pointRadius: 4,
              pointBackgroundColor: '#10233F'
            },
            {
              label: `พยากรณ์ล่วงหน้าปี 2570 (${forecastCurrentScenario})`,
              data: forecastPoints,
              borderColor: '#C28E38',
              borderWidth: 2.5,
              borderDash: [6, 4],
              tension: 0.3,
              fill: false,
              pointRadius: 5,
              pointBackgroundColor: '#C28E38'
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
                color: isDark ? '#f1f3f4' : '#202124',
                font: { family: 'Google Sans, Sarabun', size: 10.5 }
              }
            },
            tooltip: {
              callbacks: {
                label: (c) => ` ${c.dataset.label}: ${c.parsed.y ? c.parsed.y.toLocaleString() + ' คน' : '-'}`
              }
            }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: textColor, font: { family: 'Google Sans, Sarabun', size: 9.5 } }
            },
            y: {
              min: 43000,
              max: 46000,
              grid: { color: gridColor },
              ticks: {
                color: textColor,
                font: { family: 'Google Sans, Sarabun', size: 10 },
                callback: (val) => `${(val / 1000).toFixed(1)}k`
              }
            }
          }
        }
      });
    }

    const ctx2 = document.getElementById('forecastChartByGrade')?.getContext('2d');
    if (ctx2) {
      if (forecastChartByGradeInstance) forecastChartByGradeInstance.destroy();

      const gradeLabels = ['ม.1', 'ม.2', 'ม.3', 'ม.4', 'ม.5', 'ม.6'];
      const keys = ['ม1', 'ม2', 'ม3', 'ม4', 'ม5', 'ม6'];
      const data69 = keys.map(k => data.grade69Totals[k] || 0);
      const data70 = keys.map(k => data.gradeForecastTotals[k] || 0);

      forecastChartByGradeInstance = new Chart(ctx2, {
        type: 'bar',
        data: {
          labels: gradeLabels,
          datasets: [
            {
              label: 'ปี 2569 เทอม 2 (ข้อมูลจริง)',
              data: data69,
              backgroundColor: '#10233F',
              borderRadius: 3,
              barPercentage: 0.75,
              categoryPercentage: 0.8
            },
            {
              label: 'ปี 2570 (คาดการณ์ Demographic Cohort)',
              data: data70,
              backgroundColor: '#C28E38',
              borderRadius: 3,
              barPercentage: 0.75,
              categoryPercentage: 0.8
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
                color: isDark ? '#f1f3f4' : '#202124',
                font: { family: 'Google Sans, Sarabun', size: 10.5 }
              }
            },
            tooltip: {
              callbacks: {
                label: (c) => ` ${c.dataset.label}: ${c.parsed.y.toLocaleString()} คน`
              }
            }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: textColor, font: { family: 'Google Sans, Sarabun', size: 10.5 } }
            },
            y: {
              grid: { color: gridColor },
              ticks: { color: textColor, font: { family: 'Google Sans, Sarabun', size: 10 } }
            }
          }
        }
      });
    }
  }

  function exportForecastToExcel() {
    if (typeof XLSX === 'undefined') {
      alert('โมดูล Excel กำลังโหลด กรุณาลองใหม่อีกครั้ง');
      return;
    }
    const data = getForecastData();
    const rows = [
      ['รายงานการพยากรณ์ประชากรนักเรียนและแนวโน้มปี 2570 - สพม.สกลนคร'],
      ['แบบจำลองที่ใช้:', `Demographic Cohort Progression (${forecastCurrentScenario})`],
      ['วันที่จัดทำรายงาน:', new Date().toLocaleDateString('th-TH')],
      ['สรุปภาพรวมทั้งเขต:', `คาดการณ์ปี 2570 รวม ${data.totalPred.toLocaleString()} คน, ผลต่าง ${data.diffTotal > 0 ? '+' : ''}${data.diffTotal.toLocaleString()} คน (${data.pctTotal.toFixed(2)}%), ม.1 แรกเข้าใหม่ ${data.totalM1.toLocaleString()} คน, ม.4 แรกเข้าใหม่ ${data.totalM4.toLocaleString()} คน`],
      [],
      ['ลำดับ', 'รหัสโรงเรียน', 'ชื่อโรงเรียน', 'ปี 2568 (คน)', 'ปี 2569 (คน)', 'คาดการณ์ 2570 (คน)', 'ผลต่างคาดการณ์ (คน)', 'อัตราเปลี่ยนแปลง (%)', 'ห้องเรียน 2569', 'แผนห้องเรียน 2570 แนะนำ', 'ข้อเสนอแนะเชิงบริหาร']
    ];

    const sorted = [...data.records].sort((a, b) => a.diffPred - b.diffPred);
    sorted.forEach((r, idx) => {
      rows.push([
        idx + 1,
        r.id,
        r.fullName || r.name,
        r.s68,
        r.s69,
        r.pred_total,
        r.diffPred,
        Number(r.pctPred.toFixed(2)),
        r.rooms69,
        r.suggestedRooms,
        r.advice
      ]);
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Forecast_2570');
    XLSX.writeFile(wb, `Demographic_Forecast_2570_${forecastCurrentScenario}.xlsx`);
  }

  // ==========================================
  // Step 4: Teacher Staffing & Capitation Grant Estimator Module
  // ==========================================
  function initResourceModule() {
    const viewBtns = document.querySelectorAll('.resource-view-btn');
    viewBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        viewBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        resourceCurrentView = btn.dataset.view;
        updateResourceView();
      });
    });

    const searchInput = document.getElementById('resourceSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        resourceSearchQuery = e.target.value.trim().toLowerCase();
        renderResourceTable();
      });
    }

    const exportBtn = document.getElementById('exportResourceExcelBtn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        exportResourceToExcel();
      });
    }

    updateResourceView();
  }

  function getResourceData() {
    let totalGrantDistrict = 0;
    let totalGrantMTon = 0;
    let totalGrantMPlai = 0;
    let totalEntitledStaff = 0;
    let totalStudentsAll = 0;
    let totalRoomsAll = 0;

    const sizeStaffTotals = { S: 0, M: 0, L: 0, XL: 0 };
    const sizeRoomTotals = { S: 0, M: 0, L: 0, XL: 0 };
    const sizeGrantTotals = { S: 0, M: 0, L: 0, XL: 0 };

    const records = DASHBOARD_DATA.map((s) => {
      const displayName = getSchoolDisplayName(s);
      const size = getSchoolSize(s);
      const pTarget = s[targetPeriod] || s.y69_2;
      const stdTotal = pTarget?.total?.total || 0;
      const roomsTotal = pTarget?.total?.rooms || 0;
      const stdMTon = pTarget?.levels?.['มต้น']?.total || 0;
      const stdMPlai = pTarget?.levels?.['มปลาย']?.total || 0;

      const pBase = s[basePeriod] || s.y69_1;

      let deputy = 0;
      if (stdTotal >= 2500) deputy = 4;
      else if (stdTotal >= 1500) deputy = 3;
      else if (stdTotal >= 500) deputy = 2;
      else if (stdTotal >= 300) deputy = 1;

      const teacherQuota = Math.round(roomsTotal * 1.6);
      const entitledStaff = teacherQuota + 1 + deputy;
      const ratio = entitledStaff > 0 ? stdTotal / entitledStaff : 0;

      const grantMTon = stdMTon * 3800;
      const grantMPlai = stdMPlai * 4300;
      const grantTotal = grantMTon + grantMPlai;

      const grantBase = (pBase?.levels?.['มต้น']?.total || 0) * 3800 + (pBase?.levels?.['มปลาย']?.total || 0) * 4300;
      const grantDelta = grantTotal - grantBase;

      totalGrantDistrict += grantTotal;
      totalGrantMTon += grantMTon;
      totalGrantMPlai += grantMPlai;
      totalEntitledStaff += entitledStaff;
      totalStudentsAll += stdTotal;
      totalRoomsAll += roomsTotal;

      if (sizeStaffTotals[size] !== undefined) {
        sizeStaffTotals[size] += entitledStaff;
        sizeRoomTotals[size] += roomsTotal;
        sizeGrantTotals[size] += grantTotal;
      }

      let status = 'ปกติ';
      let statusBadge = '<span class="trend-badge positive" style="font-size: 11px;">🟢 ปกติ</span>';

      return {
        id: s.id,
        name: displayName,
        fullName: s.name,
        size,
        stdTotal,
        roomsTotal,
        stdMTon,
        stdMPlai,
        entitledStaff,
        deputy,
        ratio,
        grantMTon,
        grantMPlai,
        grantTotal,
        grantDelta,
        status,
        statusBadge
      };
    });

    return {
      records,
      totalGrantDistrict,
      totalGrantMTon,
      totalGrantMPlai,
      totalEntitledStaff,
      totalStudentsAll,
      totalRoomsAll,
      avgRatio: totalEntitledStaff > 0 ? totalStudentsAll / totalEntitledStaff : 0,
      sizeStaffTotals,
      sizeRoomTotals,
      sizeGrantTotals
    };
  }

  function updateResourceView() {
    const data = getResourceData();

    const grantEl = document.getElementById('resourceKpiTotalGrant');
    const grantSubEl = document.getElementById('resourceKpiTotalGrantSub');
    if (grantEl) {
      grantEl.textContent = `${(data.totalGrantDistrict / 1e6).toFixed(2)} ล้านบาท`;
    }
    if (grantSubEl) {
      grantSubEl.textContent = `ม.ต้น ${(data.totalGrantMTon / 1e6).toFixed(2)}M บ. | ม.ปลาย ${(data.totalGrantMPlai / 1e6).toFixed(2)}M บ.`;
    }

    const roomsEl = document.getElementById('resourceKpiRoomsTotal') || document.getElementById('resourceKpiStaffTotal');
    const roomsSubEl = document.getElementById('resourceKpiRoomsSub') || document.getElementById('resourceKpiStaffSub');
    if (roomsEl) {
      roomsEl.textContent = `${data.totalRoomsAll.toLocaleString()} ห้อง`;
    }
    if (roomsSubEl) {
      roomsSubEl.textContent = `ม.ต้น 750 ห้อง | ม.ปลาย 642 ห้อง (เฉลี่ย ${(data.totalRoomsAll / data.records.length).toFixed(1)} ห้อง/แห่ง)`;
    }

    renderResourceTable(data);
    renderResourceCharts(data);
  }

  function renderResourceTable(data) {
    if (!data) data = getResourceData();
    const tbody = document.getElementById('resourceTableBody');
    if (!tbody) return;

    let filtered = [...data.records];
    if (resourceSearchQuery) {
      filtered = filtered.filter(r => 
        r.name.toLowerCase().includes(resourceSearchQuery) || 
        (r.fullName && r.fullName.toLowerCase().includes(resourceSearchQuery))
      );
    }

    filtered.sort((a, b) => b.grantTotal - a.grantTotal);

    tbody.innerHTML = '';
    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: var(--text-muted); padding: 30px;">ไม่พบข้อมูลโรงเรียนตามที่ค้นหา</td></tr>`;
      return;
    }

    filtered.forEach((r, idx) => {
      const avgPerStudent = r.stdTotal > 0 ? Math.round(r.grantTotal / r.stdTotal) : 0;
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="text-align: center; color: var(--text-muted); font-size: 11.5px;">${idx + 1}</td>
        <td>
          <a href="#" class="table-school-link" data-id="${r.id}" title="${r.fullName || r.name}" style="font-weight: 500;">
            ${r.name}
          </a>
        </td>
        <td style="text-align: center;">
          <span class="trend-badge stable" style="font-size: 11px;">${r.size}</span>
        </td>
        <td style="text-align: right; font-weight: 600;">${r.stdTotal.toLocaleString()}</td>
        <td style="text-align: center; color: var(--text-muted);">${r.roomsTotal}</td>
        <td style="text-align: right; color: var(--text-main); font-weight: 500;">
          ${r.grantMTon.toLocaleString()} บ.
        </td>
        <td style="text-align: right; color: var(--text-main); font-weight: 500;">
          ${r.grantMPlai.toLocaleString()} บ.
        </td>
        <td style="text-align: right; font-weight: 700; color: var(--color-gold);">
          ${r.grantTotal.toLocaleString()} บ.
        </td>
        <td style="text-align: right; color: var(--text-muted); font-size: 11.5px;">
          ${avgPerStudent.toLocaleString()} บ.
        </td>
      `;

      const link = tr.querySelector('.table-school-link');
      if (link) {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          openSchoolDetailModal(r.id);
        });
      }

      tbody.appendChild(tr);
    });
  }

  function renderResourceCharts(data) {
    const isDark = document.body.classList.contains('dark-theme');
    const textColor = isDark ? '#9aa0a6' : '#5f6368';
    const gridColor = isDark ? '#3c4043' : '#eef1f6';

    const ctx1 = document.getElementById('resourceChartStaff')?.getContext('2d');
    if (ctx1) {
      if (resourceChartStaffInstance) resourceChartStaffInstance.destroy();

      const labels1 = ['ขนาดเล็ก (S)', 'ขนาดกลาง (M)', 'ขนาดใหญ่ (L)', 'ขนาดใหญ่พิเศษ (XL)'];
      const keys = ['S', 'M', 'L', 'XL'];
      const grantValues = keys.map(k => Number(((data.sizeGrantTotals[k] || 0) / 1e6).toFixed(2)));

      resourceChartStaffInstance = new Chart(ctx1, {
        type: 'bar',
        data: {
          labels: labels1,
          datasets: [{
            label: 'เงินอุดหนุนรายหัวรวม (ล้านบาท)',
            data: grantValues,
            backgroundColor: '#10233F',
            borderRadius: 4,
            barPercentage: 0.7
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (c) => ` เงินอุดหนุน: ${Number(c.parsed.y).toLocaleString()} ล้านบาท`
              }
            }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: textColor, font: { family: 'Google Sans, Sarabun', size: 10 } }
            },
            y: {
              grid: { color: gridColor },
              ticks: { color: textColor, font: { family: 'Google Sans, Sarabun', size: 10 } }
            }
          }
        }
      });
    }

    const ctx2 = document.getElementById('resourceChartBudget')?.getContext('2d');
    if (ctx2) {
      if (resourceChartBudgetInstance) resourceChartBudgetInstance.destroy();

      resourceChartBudgetInstance = new Chart(ctx2, {
        type: 'doughnut',
        data: {
          labels: ['มัธยมศึกษาตอนต้น (ม.1 - ม.3)', 'มัธยมศึกษาตอนปลาย (ม.4 - ม.6)'],
          datasets: [{
            data: [data.totalGrantMTon, data.totalGrantMPlai],
            backgroundColor: ['#C28E38', '#10233F'],
            borderWidth: 2,
            borderColor: isDark ? '#1e1f22' : '#ffffff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '65%',
          plugins: {
            legend: {
              display: true,
              position: 'bottom',
              labels: {
                color: isDark ? '#f1f3f4' : '#202124',
                font: { family: 'Google Sans, Sarabun', size: 11 }
              }
            },
            tooltip: {
              callbacks: {
                label: (c) => ` ${c.label}: ${(c.parsed / 1e6).toFixed(2)} ล้านบาท (${((c.parsed / data.totalGrantDistrict) * 100).toFixed(1)}%)`
              }
            }
          }
        }
      });
    }
  }

  function exportResourceToExcel() {
    if (typeof XLSX === 'undefined') {
      alert('โมดูล Excel กำลังโหลด กรุณาลองใหม่อีกครั้ง');
      return;
    }
    const data = getResourceData();
    const rows = [
      ['รายงานการประมาณการเงินอุดหนุนรายหัวและโครงสร้างสถานศึกษา - สพม.สกลนคร'],
      ['วันที่จัดทำรายงาน:', new Date().toLocaleDateString('th-TH')],
      ['สรุปภาพรวมทั้งเขต:', `งบอุดหนุนรวม ${(data.totalGrantDistrict / 1e6).toFixed(2)} ล้านบาท (ม.ต้น ${(data.totalGrantMTon / 1e6).toFixed(2)} ล้านบาท / ม.ปลาย ${(data.totalGrantMPlai / 1e6).toFixed(2)} ล้านบาท), นักเรียนรวม ${data.totalStudentsAll.toLocaleString()} คน, ห้องเรียนรวม ${data.totalRoomsAll.toLocaleString()} ห้อง`],
      [],
      ['ลำดับ', 'รหัสโรงเรียน', 'ชื่อโรงเรียน', 'ขนาด', 'นักเรียนรวม (คน)', 'ห้องเรียน', 'เงินอุดหนุน ม.ต้น (บาท)', 'เงินอุดหนุน ม.ปลาย (บาท)', 'เงินอุดหนุนรวม (บาท)', 'เฉลี่ยต่อนักเรียน (บาท)']
    ];

    const sorted = [...data.records].sort((a, b) => b.grantTotal - a.grantTotal);
    sorted.forEach((r, idx) => {
      const avg = r.stdTotal > 0 ? Math.round(r.grantTotal / r.stdTotal) : 0;
      rows.push([
        idx + 1,
        r.id,
        r.fullName || r.name,
        r.size,
        r.stdTotal,
        r.roomsTotal,
        r.grantMTon,
        r.grantMPlai,
        r.grantTotal,
        avg
      ]);
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Capitation_Grant');
    XLSX.writeFile(wb, `Capitation_Grant_Report.xlsx`);
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
      S: 'ขนาดเล็ก (≤ 119 คน)',
      M: 'ขนาดกลาง (120 - 719 คน)',
      L: 'ขนาดใหญ่ (720 - 1,679 คน)',
      XL: 'ขนาดใหญ่พิเศษ (≥ 1,680 คน)'
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
        bullet2 = `โรงเรียนที่สูญเสียนักเรียนระหว่างเทอมสูงสุด: **รร.เตรียมอุดมศึกษา ภาคตะวันออกเฉียงเหนือ (-42 คน)**, **รร.ธาตุนารายณ์วิทยา (-39 คน)** และ **รร.มัธยมวานรนิวาส (-31 คน)**`;
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

  // ==========================================
  // Step 5: Executive Policy Brief & Decision Support Module
  // ==========================================
  function initExecutiveBriefModule() {
    const btnPrintPdf = document.getElementById('btnExecutivePrintPdf');
    if (btnPrintPdf) {
      btnPrintPdf.addEventListener('click', () => {
        window.print();
      });
    }

    const btnMasterExcel = document.getElementById('btnExecutiveMasterExcel');
    if (btnMasterExcel) {
      btnMasterExcel.addEventListener('click', () => {
        exportExecutiveMasterExcel();
      });
    }
  }

  function exportExecutiveMasterExcel() {
    if (typeof XLSX === 'undefined') {
      alert('โมดูล Excel กำลังโหลด กรุณาลองใหม่อีกครั้ง');
      return;
    }

    const wb = XLSX.utils.book_new();

    // Sheet 1: Executive Summary & Directives
    const summaryRows = [
      ['ศูนย์สารสนเทศและระบบสนับสนุนการตัดสินใจเชิงนโยบาย (DMC Intelligence Hub)'],
      ['สำนักงานเขตพื้นที่การศึกษามัธยมศึกษาสกลนคร (สพม.สกลนคร)'],
      ['บทสรุปเชิงนโยบายสำหรับผู้บริหารระดับสูง (Executive Policy Brief & Strategic Directives)'],
      [`วันที่จัดทำรายงาน: ${new Date().toLocaleDateString('th-TH')}`],
      [],
      ['=== 5 เสาหลักยุทธศาสตร์การศึกษา (5 Strategic Pillars) ==='],
      ['เสาหลักที่', 'มิติยุทธศาสตร์', 'ตัวชี้วัด / สถิติสำคัญ', 'หน่วยนับ', 'คำอธิบายเชิงกลยุทธ์'],
      [1, 'ประชากรนักเรียนรวม', 44566, 'คน', '45 โรงเรียนมัธยมศึกษา, 1,392 ห้องเรียน (ม.ต้น 24,002 คน / ม.ปลาย 20,564 คน)'],
      [2, 'อัตราคงอยู่ (Zero Dropout)', 99.44, '%', 'ลดลงระหว่างภาคเรียน -252 คน (-0.56%) ดีขึ้นกว่าปี 2568 ที่ลดลง -356 คน'],
      [3, 'การกระจายตัวเชิงพื้นที่', 34.16, '% (ในเมือง)', 'อำเภอเมือง 15,224 คน (34.2%) : 17 อำเภอรอบนอก 29,342 คน (65.8%)'],
      [4, 'คาดการณ์ประชากรปี 2570', 43899, 'คน', 'แบบจำลอง Demographic Cohort Progression ชี้แนวโน้มลดลง -667 คน (-1.50%)'],
      [5, 'งบประมาณอุดหนุนรวม', 179632800, 'บาท', 'ประมาณการเงินอุดหนุนรายหัว สพฐ. รวม 179.63 ล้านบาทต่อปี (ม.ต้น 91.21 ล้านบาท / ม.ปลาย 88.43 ล้านบาท) เฉลี่ย 4,031 บาท/คน'],
      [],
      ['=== ข้อสั่งการและทิศทางเชิงกลยุทธ์สำหรับผู้บริหาร สพม.สกลนคร (Actionable Directives) ==='],
      ['ข้อที่', 'มิตินโยบาย', 'แนวทางปฏิบัติและข้อสั่งการสำหรับสถานศึกษา'],
      [1, 'มาตรการ Zero Dropout เชิงรุก', 'มอบหมายกลุ่มส่งเสริมการจัดการศึกษาและระบบดูแลช่วยเหลือนักเรียน ลงพื้นที่ติดตามช่วยเหลือนักเรียนใน 3 โรงเรียนที่สถิติลดลงสูงสุดระหว่างภาคเรียน ได้แก่ รร.เตรียมอุดมศึกษา ภาคตะวันออกเฉียงเหนือ (-42 คน), รร.ธาตุนารายณ์วิทยา (-39 คน) และ รร.มัธยมวานรนิวาส (-31 คน)'],
      [2, 'การวางแผนรับนักเรียน ม.1 / ม.4 ปี 2570', 'กำหนดเป้าหมายรับนักเรียน ม.1 แรกเข้าที่ 7,120 คน (225 ห้อง) และ ม.4 แรกเข้าที่ 7,370 คน (235 ห้อง) ปรับขนาดห้องเรียนให้ได้มาตรฐาน 32-35 คน/ห้อง เพื่อป้องกันห้องเรียนแออัดและห้องเรียนต่ำกว่าเกณฑ์'],
      [3, 'การสนับสนุนการบริหารจัดการศึกษา', 'มอบหมายกลุ่มบริหารงานบุคคลและกลุ่มนโยบายและแผน นำข้อมูลสถิตินักเรียนและห้องเรียนไปใช้เป็นฐานข้อมูลในการวางแผนอัตรากำลังและจัดสรรงบประมาณสนับสนุนการจัดการเรียนการสอนอย่างทั่วถึงและเป็นธรรม'],
      [4, 'การเสริมสร้างเครือข่ายโรงเรียนขนาดเล็ก', 'ยกระดับสถานศึกษาขนาดเล็กและกลุ่มเปราะบาง (เกณฑ์ สพฐ. ล่าสุด ≤ 119 คน และกลุ่มเฝ้าระวังต่ำกว่า 150 คน เช่น รร.ลำปลาหางวิทยา 120 คน, รร.เทพสวัสดิ์วิทยา 124 คน) โดยนำโมเดลการใช้ทรัพยากรร่วมกัน (Resource Sharing) ภายในกลุ่มสหวิทยาเขตดำรงธรรม และโรงเรียนพี่เลี้ยงใกล้เคียง']
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Executive_Summary');

    // Sheet 2: Zero Dropout Tracker
    const retData = getRetentionModeData();
    const retRows = [
      ['ระบบติดตามอัตราคงอยู่และสถิติ Zero Dropout - สพม.สกลนคร'],
      ['รอบข้อมูลที่วิเคราะห์:', 'ปีการศึกษา 2569 (เทอม 1 ➔ เทอม 2)'],
      [`วันที่ส่งออก: ${new Date().toLocaleDateString('th-TH')}`],
      [],
      ['ลำดับ', 'รหัสโรงเรียน', 'ชื่อโรงเรียน', 'อำเภอ', 'ขนาด', 'เทอม 1/69 (คน)', 'เทอม 2/69 (คน)', 'ผลต่าง (คน)', 'อัตราคงอยู่ (%)', 'อัตราเปลี่ยนแปลง (%)', 'ระดับความเสี่ยง (Risk Radar)', 'มาตรการแนะนำ']
    ];
    const sortedRet = [...retData.records].sort((a, b) => a.diff - b.diff);
    sortedRet.forEach((r, idx) => {
      const orig = DASHBOARD_DATA.find(s => s.id === r.id);
      retRows.push([
        idx + 1,
        r.id,
        r.fullName || r.name,
        orig?.amphoe || orig?.district || '',
        orig ? getSchoolSize(orig) : '',
        r.baseVal,
        r.targetVal,
        r.diff,
        Number(r.rate.toFixed(2)),
        Number(r.pctChange.toFixed(2)),
        r.riskLevel === 'HIGH_RISK' ? 'เสี่ยงสูง (High Risk)' : (r.riskLevel === 'WATCHLIST' ? 'เฝ้าระวัง (Watchlist)' : 'ปกติ (Normal)'),
        r.policyAdvice
      ]);
    });
    const wsRet = XLSX.utils.aoa_to_sheet(retRows);
    XLSX.utils.book_append_sheet(wb, wsRet, 'Zero_Dropout_Tracker');

    // Sheet 3: District Analytics
    const clusterList = getDistrictData();
    const distRows = [
      ['รายงานสถิติข้อมูลเชิงพื้นที่ สหวิทยาเขต และรายอำเภอ - สพม.สกลนคร'],
      [`วันที่ส่งออก: ${new Date().toLocaleDateString('th-TH')}`],
      [],
      ['=== ส่วนที่ 1: วิเคราะห์รายสหวิทยาเขต (8 สหวิทยาเขต) ==='],
      ['ลำดับ', 'สหวิทยาเขต', 'จำนวนโรงเรียน (แห่ง)', 'นักเรียน 69/1 (คน)', 'นักเรียน 69/2 (คน)', 'ผลต่าง (คน)', '% เปลี่ยนแปลง', 'ห้องเรียน', 'นร./ห้อง เฉลี่ย', 'โรงเรียนแกนนำ (Hub School)']
    ];
    clusterList.forEach((g, idx) => {
      distRows.push([
        idx + 1,
        g.name,
        g.schoolCount,
        g.baseStudents,
        g.targetStudents,
        g.diff,
        Number(g.pctChange.toFixed(2)),
        g.rooms,
        Number(g.density.toFixed(1)),
        g.hubSchool
      ]);
    });

    distRows.push([], ['=== ส่วนที่ 2: วิเคราะห์รายอำเภอ (18 อำเภอ) ==='], ['ลำดับ', 'อำเภอ', 'จำนวนโรงเรียน (แห่ง)', 'นักเรียน 69/1 (คน)', 'นักเรียน 69/2 (คน)', 'ผลต่าง (คน)', '% เปลี่ยนแปลง', 'ห้องเรียน', 'นร./ห้อง เฉลี่ย']);
    
    const amphoeMap = {};
    DASHBOARD_DATA.forEach(s => {
      const amp = s.amphoe || s.district || 'ไม่ระบุ';
      if (!amphoeMap[amp]) amphoeMap[amp] = { name: amp, count: 0, sBase: 0, sTarget: 0, rooms: 0 };
      const p1 = s.y69_1?.total?.total || 0;
      const p2 = s.y69_2?.total?.total || 0;
      const ro = s.y69_2?.total?.rooms || 0;
      amphoeMap[amp].count += 1;
      amphoeMap[amp].sBase += p1;
      amphoeMap[amp].sTarget += p2;
      amphoeMap[amp].rooms += ro;
    });
    Object.values(amphoeMap).sort((a, b) => b.sTarget - a.sTarget).forEach((a, idx) => {
      const diff = a.sTarget - a.sBase;
      const pct = a.sBase > 0 ? (diff / a.sBase) * 100 : 0;
      const den = a.rooms > 0 ? a.sTarget / a.rooms : 0;
      distRows.push([
        idx + 1,
        a.name,
        a.count,
        a.sBase,
        a.sTarget,
        diff,
        Number(pct.toFixed(2)),
        a.rooms,
        Number(den.toFixed(1))
      ]);
    });
    const wsDist = XLSX.utils.aoa_to_sheet(distRows);
    XLSX.utils.book_append_sheet(wb, wsDist, 'District_Analytics');

    // Sheet 4: Forecast 2570
    const fcData = getForecastData();
    const fcRows = [
      ['รายงานคาดการณ์ประชากรนักเรียนปี 2570 (Demographic Cohort Progression) - สพม.สกลนคร'],
      ['แบบจำลอง:', `Demographic Cohort Progression (${forecastCurrentScenario})`],
      [`วันที่ส่งออก: ${new Date().toLocaleDateString('th-TH')}`],
      [],
      ['ลำดับ', 'รหัสโรงเรียน', 'ชื่อโรงเรียน', 'อำเภอ', 'ปี 2568 (คน)', 'ปี 2569 (คน)', 'คาดการณ์ 2570 (คน)', 'ผลต่างคาดการณ์ (คน)', 'อัตราเปลี่ยนแปลง (%)', 'ห้องเรียน 2569', 'แผนห้องเรียน 2570 แนะนำ', 'ข้อเสนอแนะเชิงบริหาร']
    ];
    const sortedFc = [...fcData.records].sort((a, b) => a.diffPred - b.diffPred);
    sortedFc.forEach((r, idx) => {
      const orig = DASHBOARD_DATA.find(s => s.id === r.id);
      fcRows.push([
        idx + 1,
        r.id,
        r.fullName || r.name,
        orig?.amphoe || orig?.district || '',
        r.s68,
        r.s69,
        r.pred_total,
        r.diffPred,
        Number(r.pctPred.toFixed(2)),
        r.rooms69,
        r.suggestedRooms,
        r.advice
      ]);
    });
    const wsFc = XLSX.utils.aoa_to_sheet(fcRows);
    XLSX.utils.book_append_sheet(wb, wsFc, 'Forecast_2570');

    // Sheet 5: Capitation Grant and Resources
    const resData = getResourceData();
    const resRows = [
      ['รายงานการประมาณการเงินอุดหนุนรายหัวและโครงสร้างสถานศึกษา - สพม.สกลนคร'],
      [`วันที่ส่งออก: ${new Date().toLocaleDateString('th-TH')}`],
      ['สรุปภาพรวมเขต:', `เงินอุดหนุนรวม ${resData.totalGrantDistrict.toLocaleString()} บาท (ม.ต้น ${resData.totalGrantMTon.toLocaleString()} บาท / ม.ปลาย ${resData.totalGrantMPlai.toLocaleString()} บาท), นักเรียนรวม ${resData.totalStudentsAll.toLocaleString()} คน, ห้องเรียนรวม ${resData.totalRoomsAll.toLocaleString()} ห้อง`],
      [],
      ['ลำดับ', 'รหัสโรงเรียน', 'ชื่อโรงเรียน', 'อำเภอ', 'ขนาด', 'ม.ต้น (คน)', 'ม.ปลาย (คน)', 'นักเรียนรวม (คน)', 'ห้องเรียน', 'เงินอุดหนุน ม.ต้น (บาท)', 'เงินอุดหนุน ม.ปลาย (บาท)', 'เงินอุดหนุนรวมต่อปี (บาท)', 'เฉลี่ยต่อนักเรียน (บาท)']
    ];
    const sortedRes = [...resData.records].sort((a, b) => b.grantTotal - a.grantTotal);
    sortedRes.forEach((r, idx) => {
      const orig = DASHBOARD_DATA.find(s => s.id === r.id);
      const avg = r.stdTotal > 0 ? Math.round(r.grantTotal / r.stdTotal) : 0;
      resRows.push([
        idx + 1,
        r.id,
        r.fullName || r.name,
        orig?.amphoe || orig?.district || '',
        r.size,
        r.stdMTon,
        r.stdMPlai,
        r.stdTotal,
        r.roomsTotal,
        r.grantMTon,
        r.grantMPlai,
        r.grantTotal,
        avg
      ]);
    });
    const wsRes = XLSX.utils.aoa_to_sheet(resRows);
    XLSX.utils.book_append_sheet(wb, wsRes, 'Capitation_Grant');

    // Sheet 6: Master 45 Schools Longitudinal Data
    const masterRows = [
      ['ฐานข้อมูลสถิตินักเรียน 5 รอบข้อมูลแบบสมบูรณ์ (Longitudinal Master Dataset) - สพม.สกลนคร'],
      ['รอบข้อมูล:', '2568 เทอม 1, 2568 เทอม 2, 2568 สิ้นปี, 2569 เทอม 1, 2569 เทอม 2'],
      [`วันที่ส่งออก: ${new Date().toLocaleDateString('th-TH')}`],
      [],
      [
        'ลำดับ', 'รหัสโรงเรียน', 'ชื่อโรงเรียน', 'อำเภอ', 'สหวิทยาเขต', 'ขนาด',
        'นร. 68/1', 'ห้อง 68/1',
        'นร. 68/2', 'ห้อง 68/2',
        'นร. 68/3 (สิ้นปี)', 'ห้อง 68/3',
        'นร. 69/1', 'ห้อง 69/1',
        'นร. 69/2', 'ห้อง 69/2',
        'ผลต่าง (69/1 ➔ 69/2)', '% เปลี่ยนแปลง (เทอม)',
        'ผลต่าง (68/1 ➔ 69/2)', '% เปลี่ยนแปลง (2 ปี)'
      ]
    ];

    let t68_1 = 0, r68_1 = 0;
    let t68_2 = 0, r68_2 = 0;
    let t68_3 = 0, r68_3 = 0;
    let t69_1 = 0, r69_1 = 0;
    let t69_2 = 0, r69_2 = 0;

    DASHBOARD_DATA.forEach((s, idx) => {
      const p68_1 = s.y68_1 || s.y68 || {};
      const p68_2 = s.y68_2 || p68_1;
      const p68_3 = s.y68_3 || p68_2;
      const p69_1 = s.y69_1 || {};
      const p69_2 = s.y69_2 || {};

      const s68_1 = p68_1.total?.total || 0; const ro68_1 = p68_1.total?.rooms || 0;
      const s68_2 = p68_2.total?.total || 0; const ro68_2 = p68_2.total?.rooms || 0;
      const s68_3 = p68_3.total?.total || 0; const ro68_3 = p68_3.total?.rooms || 0;
      const s69_1 = p69_1.total?.total || 0; const ro69_1 = p69_1.total?.rooms || 0;
      const s69_2 = p69_2.total?.total || 0; const ro69_2 = p69_2.total?.rooms || 0;

      const diffTerm = s69_2 - s69_1;
      const pctTerm = s69_1 > 0 ? (diffTerm / s69_1) * 100 : 0;
      const diff2Year = s69_2 - s68_1;
      const pct2Year = s68_1 > 0 ? (diff2Year / s68_1) * 100 : 0;

      t68_1 += s68_1; r68_1 += ro68_1;
      t68_2 += s68_2; r68_2 += ro68_2;
      t68_3 += s68_3; r68_3 += ro68_3;
      t69_1 += s69_1; r69_1 += ro69_1;
      t69_2 += s69_2; r69_2 += ro69_2;

      masterRows.push([
        idx + 1,
        s.id,
        s.name,
        s.amphoe || s.district || '',
        s.cluster || '',
        getSchoolSize(s),
        s68_1, ro68_1,
        s68_2, ro68_2,
        s68_3, ro68_3,
        s69_1, ro69_1,
        s69_2, ro69_2,
        diffTerm, Number(pctTerm.toFixed(2)),
        diff2Year, Number(pct2Year.toFixed(2))
      ]);
    });

    const sumDiffTerm = t69_2 - t69_1;
    const sumPctTerm = t69_1 > 0 ? (sumDiffTerm / t69_1) * 100 : 0;
    const sumDiff2Year = t69_2 - t68_1;
    const sumPct2Year = t68_1 > 0 ? (sumDiff2Year / t68_1) * 100 : 0;

    masterRows.push([
      '', '', 'รวมทั้งเขตพื้นที่การศึกษา (45 โรงเรียน)', '', '', '',
      t68_1, r68_1,
      t68_2, r68_2,
      t68_3, r68_3,
      t69_1, r69_1,
      t69_2, r69_2,
      sumDiffTerm, Number(sumPctTerm.toFixed(2)),
      sumDiff2Year, Number(sumPct2Year.toFixed(2))
    ]);

    const wsMaster = XLSX.utils.aoa_to_sheet(masterRows);
    XLSX.utils.book_append_sheet(wb, wsMaster, 'Master_45_Schools');

    XLSX.writeFile(wb, 'DMC_Hub_Executive_Policy_Master.xlsx');
  }

  // Hook modules inside init()
  initComparison();
  initRetentionModule();
  initDistrictModule();
  initForecastModule();
  initResourceModule();
  initExecutiveBriefModule();


    // ==========================================
    // Excel Export Feature (SheetJS + CSV Fallback)
    // ==========================================
    const btnExportExcel = document.getElementById('btnExportExcel');
    const excelDropdownMenu = document.getElementById('excelDropdownMenu');
    const exportActiveViewBtn = document.getElementById('exportActiveViewBtn');
    const exportY68_1Btn = document.getElementById('exportY68_1Btn');
    const exportY68_2Btn = document.getElementById('exportY68_2Btn');
    const exportY68_3Btn = document.getElementById('exportY68_3Btn');
    const exportY69_1Btn = document.getElementById('exportY69_1Btn');
    const exportY69_2Btn = document.getElementById('exportY69_2Btn');
    const exportAllPeriodsBtn = document.getElementById('exportAllPeriodsBtn');

    if (btnExportExcel && excelDropdownMenu) {
      btnExportExcel.addEventListener('click', (e) => {
        e.stopPropagation();
        excelDropdownMenu.classList.toggle('show');
      });

      document.addEventListener('click', () => {
        excelDropdownMenu.classList.remove('show');
      });

      excelDropdownMenu.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    }

    function downloadSingleSheetExcel(rows, filename, sheetName) {
      if (typeof XLSX !== 'undefined') {
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(rows);
        XLSX.utils.book_append_sheet(wb, ws, sheetName || 'Data');
        XLSX.writeFile(wb, filename);
      } else {
        const csvContent = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\r\n');
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename.replace('.xlsx', '.csv');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    }

    function getPeriodSheetRows(pKey, pTitle) {
      const rows = [
        ['สำนักงานเขตพื้นที่การศึกษามัธยมศึกษาสกลนคร (สพม.สกลนคร)'],
        [`รายงานสถิติจำนวนนักเรียนและห้องเรียนจำแนกรายระดับชั้น (ม.1 - ม.6) - ${pTitle}`],
        [`วันที่ส่งออกข้อมูล: ${new Date().toLocaleDateString('th-TH')} | จำนวนโรงเรียน: 45 โรงเรียน`],
        [],
        [
          'ลำดับ', 'ชื่อโรงเรียน', 'อำเภอ', 'ขนาด',
          'ม.1 (คน)', 'ม.1 (ห้อง)',
          'ม.2 (คน)', 'ม.2 (ห้อง)',
          'ม.3 (คน)', 'ม.3 (ห้อง)',
          'รวม ม.ต้น (คน)', 'รวม ม.ต้น (ห้อง)',
          'ม.4 (คน)', 'ม.4 (ห้อง)',
          'ม.5 (คน)', 'ม.5 (ห้อง)',
          'ม.6 (คน)', 'ม.6 (ห้อง)',
          'รวม ม.ปลาย (คน)', 'รวม ม.ปลาย (ห้อง)',
          'นักเรียนชาย (คน)',
          'นักเรียนหญิง (คน)',
          'รวมนักเรียนทั้งสิ้น (คน)',
          'รวมห้องเรียน (ห้อง)',
          'เฉลี่ย นร./ห้อง'
        ]
      ];

      let sum = {
        m1_s: 0, m1_r: 0, m2_s: 0, m2_r: 0, m3_s: 0, m3_r: 0, low_s: 0, low_r: 0,
        m4_s: 0, m4_r: 0, m5_s: 0, m5_r: 0, m6_s: 0, m6_r: 0, high_s: 0, high_r: 0,
        male: 0, female: 0, total_s: 0, total_r: 0
      };

      DASHBOARD_DATA.forEach((s, idx) => {
        const p = s[pKey] || {};
        const g = p.grades || {};
        const grp = p.groups || {};
        const tot = p.total || {};

        const m1_s = g.ม1?.total || 0; const m1_r = g.ม1?.rooms || 0;
        const m2_s = g.ม2?.total || 0; const m2_r = g.ม2?.rooms || 0;
        const m3_s = g.ม3?.total || 0; const m3_r = g.ม3?.rooms || 0;
        const low_s = grp.มต้น?.total || (m1_s + m2_s + m3_s);
        const low_r = grp.มต้น?.rooms || (m1_r + m2_r + m3_r);

        const m4_s = g.ม4?.total || 0; const m4_r = g.ม4?.rooms || 0;
        const m5_s = g.ม5?.total || 0; const m5_r = g.ม5?.rooms || 0;
        const m6_s = g.ม6?.total || 0; const m6_r = g.ม6?.rooms || 0;
        const high_s = grp.มปลาย?.total || (m4_s + m5_s + m6_s);
        const high_r = grp.มปลาย?.rooms || (m4_r + m5_r + m6_r);

        const male = tot.m || 0;
        const female = tot.f || 0;
        const total_s = tot.total || (male + female);
        const total_r = tot.rooms || (low_r + high_r);
        const ratio = total_r > 0 ? Number((total_s / total_r).toFixed(1)) : 0;

        sum.m1_s += m1_s; sum.m1_r += m1_r;
        sum.m2_s += m2_s; sum.m2_r += m2_r;
        sum.m3_s += m3_s; sum.m3_r += m3_r;
        sum.low_s += low_s; sum.low_r += low_r;
        sum.m4_s += m4_s; sum.m4_r += m4_r;
        sum.m5_s += m5_s; sum.m5_r += m5_r;
        sum.m6_s += m6_s; sum.m6_r += m6_r;
        sum.high_s += high_s; sum.high_r += high_r;
        sum.male += male; sum.female += female;
        sum.total_s += total_s; sum.total_r += total_r;

        rows.push([
          idx + 1,
          s.name,
          s.amphoe || s.district || '',
          s.size || '',
          m1_s, m1_r,
          m2_s, m2_r,
          m3_s, m3_r,
          low_s, low_r,
          m4_s, m4_r,
          m5_s, m5_r,
          m6_s, m6_r,
          high_s, high_r,
          male, female,
          total_s, total_r,
          ratio
        ]);
      });

      const sumRatio = sum.total_r > 0 ? Number((sum.total_s / sum.total_r).toFixed(1)) : 0;
      rows.push([
        '', 'รวมทั้งเขตพื้นที่การศึกษา (45 โรงเรียน)', '', '',
        sum.m1_s, sum.m1_r,
        sum.m2_s, sum.m2_r,
        sum.m3_s, sum.m3_r,
        sum.low_s, sum.low_r,
        sum.m4_s, sum.m4_r,
        sum.m5_s, sum.m5_r,
        sum.m6_s, sum.m6_r,
        sum.high_s, sum.high_r,
        sum.male, sum.female,
        sum.total_s, sum.total_r,
        sumRatio
      ]);

      return rows;
    }

    function exportActiveComparisonExcel() {
      const periodNames = {
        'y68': 'ปี 2568',
        'y69_1': '2569 เทอม 1',
        'y69_2': '2569 เทอม 2'
      };
      const bName = periodNames[basePeriod] || basePeriod;
      const tName = periodNames[targetPeriod] || targetPeriod;

      const rows = [
        ['ศูนย์สารสนเทศและระบบวิเคราะห์เปรียบเทียบสถิตินักเรียน สพม.สกลนคร (DMC Hub)'],
        [`รายงานเปรียบเทียบสถิตินักเรียนและห้องเรียน: ${bName} ➔ ${tName}`],
        [`วันที่ส่งออกข้อมูล: ${new Date().toLocaleDateString('th-TH')} | จำนวนโรงเรียน: 45 โรงเรียน`],
        [],
        [
          'ลำดับ',
          'ชื่อสถานศึกษา',
          'อำเภอ',
          'ขนาดโรงเรียน',
          `นักเรียน ${bName} (คน)`,
          `นักเรียน ${tName} (คน)`,
          'ผลต่าง (คน)',
          'ร้อยละการเปลี่ยนแปลง (%)',
          `จำนวนห้องเรียน ${tName} (ห้อง)`,
          `เฉลี่ย นร./ห้อง ${tName}`
        ]
      ];

      let totalB = 0, totalT = 0, totalRooms = 0;

      DASHBOARD_DATA.forEach((s, idx) => {
        const stats = getSchoolStats(s);
        totalB += stats.std1;
        totalT += stats.std2;
        totalRooms += stats.roomsActive;

        rows.push([
          idx + 1,
          s.name,
          s.amphoe || s.district || '',
          stats.sizeText,
          stats.std1,
          stats.std2,
          stats.diff,
          Number(stats.change.toFixed(2)),
          stats.roomsActive,
          Number(stats.ratioActive.toFixed(1))
        ]);
      });

      const totalDiff = totalT - totalB;
      const totalChange = totalB > 0 ? (totalDiff / totalB) * 100 : 0;
      const totalRatio = totalRooms > 0 ? totalT / totalRooms : 0;

      rows.push([
        '', 'รวมทั้งเขตพื้นที่การศึกษา (45 โรงเรียน)', '', '',
        totalB, totalT, totalDiff, Number(totalChange.toFixed(2)),
        totalRooms, Number(totalRatio.toFixed(1))
      ]);

      const filename = `DMC_Hub_Comparison_${basePeriod}_vs_${targetPeriod}.xlsx`;
      downloadSingleSheetExcel(rows, filename, `เทียบ_${basePeriod}_${targetPeriod}`);
      if (excelDropdownMenu) excelDropdownMenu.classList.remove('show');
    }

    function exportSpecificPeriodExcel(pKey, pTitle, filename) {
      const rows = getPeriodSheetRows(pKey, pTitle);
      downloadSingleSheetExcel(rows, filename, pTitle.replace(/[\/\*\[\]\?:]/g, '_'));
      if (excelDropdownMenu) excelDropdownMenu.classList.remove('show');
    }

    function exportAllPeriodsMasterExcel() {
      if (typeof XLSX === 'undefined') {
        exportActiveComparisonExcel();
        return;
      }

      const wb = XLSX.utils.book_new();

      // 1. Overview Comparison Sheet with 5 Periods
      const overviewRows = [
        ['ศูนย์สารสนเทศและระบบวิเคราะห์เปรียบเทียบสถิตินักเรียน สพม.สกลนคร (DMC Hub)'],
        ['รายงานสรุปเปรียบเทียบสถิตินักเรียนครบทุก 5 รอบข้อมูล (ปี 2568/1, 2568/2, 2568/3 สิ้นปี, 2569/1, 2569/2)'],
        [`วันที่ส่งออกข้อมูล: ${new Date().toLocaleDateString('th-TH')}`],
        [],
        [
          'ลำดับ', 'ชื่อโรงเรียน', 'อำเภอ', 'ขนาด',
          'นร. 68/1', 'ห้อง 68/1',
          'นร. 68/2', 'ห้อง 68/2',
          'นร. 68/3 (สิ้นปี)', 'ห้อง 68/3',
          'นร. 69/1', 'ห้อง 69/1',
          'นร. 69/2', 'ห้อง 69/2',
          'ผลต่าง (69/1 ➔ 69/2)', '% เปลี่ยนแปลง (เทอม)',
          'ผลต่าง (68/1 ➔ 69/2)', '% เปลี่ยนแปลง (2 ปี)'
        ]
      ];

      let t68_1 = 0, r68_1 = 0;
      let t68_2 = 0, r68_2 = 0;
      let t68_3 = 0, r68_3 = 0;
      let t69_1 = 0, r69_1 = 0;
      let t69_2 = 0, r69_2 = 0;

      DASHBOARD_DATA.forEach((s, idx) => {
        const p68_1 = s.y68_1 || s.y68 || {};
        const p68_2 = s.y68_2 || p68_1;
        const p68_3 = s.y68_3 || p68_2;
        const p69_1 = s.y69_1 || {};
        const p69_2 = s.y69_2 || {};

        const s68_1 = p68_1.total?.total || 0; const ro68_1 = p68_1.total?.rooms || 0;
        const s68_2 = p68_2.total?.total || 0; const ro68_2 = p68_2.total?.rooms || 0;
        const s68_3 = p68_3.total?.total || 0; const ro68_3 = p68_3.total?.rooms || 0;
        const s69_1 = p69_1.total?.total || 0; const ro69_1 = p69_1.total?.rooms || 0;
        const s69_2 = p69_2.total?.total || 0; const ro69_2 = p69_2.total?.rooms || 0;

        const diffTerm = s69_2 - s69_1;
        const pctTerm = s69_1 > 0 ? (diffTerm / s69_1) * 100 : 0;
        const diff2Year = s69_2 - s68_1;
        const pct2Year = s68_1 > 0 ? (diff2Year / s68_1) * 100 : 0;

        t68_1 += s68_1; r68_1 += ro68_1;
        t68_2 += s68_2; r68_2 += ro68_2;
        t68_3 += s68_3; r68_3 += ro68_3;
        t69_1 += s69_1; r69_1 += ro69_1;
        t69_2 += s69_2; r69_2 += ro69_2;

        overviewRows.push([
          idx + 1, s.name, s.amphoe || s.district || '', getSchoolSize(s),
          s68_1, ro68_1,
          s68_2, ro68_2,
          s68_3, ro68_3,
          s69_1, ro69_1,
          s69_2, ro69_2,
          diffTerm, Number(pctTerm.toFixed(2)),
          diff2Year, Number(pct2Year.toFixed(2))
        ]);
      });

      const sumDiffTerm = t69_2 - t69_1;
      const sumPctTerm = t69_1 > 0 ? (sumDiffTerm / t69_1) * 100 : 0;
      const sumDiff2Year = t69_2 - t68_1;
      const sumPct2Year = t68_1 > 0 ? (sumDiff2Year / t68_1) * 100 : 0;

      overviewRows.push([
        '', 'รวมทั้งเขตพื้นที่การศึกษา (45 โรงเรียน)', '', '',
        t68_1, r68_1,
        t68_2, r68_2,
        t68_3, r68_3,
        t69_1, r69_1,
        t69_2, r69_2,
        sumDiffTerm, Number(sumPctTerm.toFixed(2)),
        sumDiff2Year, Number(sumPct2Year.toFixed(2))
      ]);

      const wsOverview = XLSX.utils.aoa_to_sheet(overviewRows);
      XLSX.utils.book_append_sheet(wb, wsOverview, 'สรุปเปรียบเทียบทุกรอบ');

      // 2. Individual Period Sheets (5 Periods)
      const periods = [
        { key: 'y68_1', name: '2568 เทอม 1 (10 มิ.ย. 68)' },
        { key: 'y68_2', name: '2568 เทอม 2 (10 พ.ย. 68)' },
        { key: 'y68_3', name: '2568 สิ้นปี (30 เม.ย. 69)' },
        { key: 'y69_1', name: '2569 เทอม 1 (10 มิ.ย. 69)' },
        { key: 'y69_2', name: '2569 เทอม 2 (10 พ.ย. 69)' }
      ];

      periods.forEach(p => {
        const rows = getPeriodSheetRows(p.key, p.name);
        const ws = XLSX.utils.aoa_to_sheet(rows);
        const sheetName = p.name.replace(/[\/\*\[\]\?:]/g, '_').substring(0, 31);
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
      });

      XLSX.writeFile(wb, 'DMC_Hub_SakonNakhon_Master_5Periods.xlsx');
      if (excelDropdownMenu) excelDropdownMenu.classList.remove('show');
    }

    // Event Listeners for Excel Export Buttons
    if (exportActiveViewBtn) {
      exportActiveViewBtn.addEventListener('click', () => exportActiveComparisonExcel());
    }
    if (exportY68_1Btn) {
      exportY68_1Btn.addEventListener('click', () => exportSpecificPeriodExcel('y68_1', 'ปี 2568 เทอม 1 (10 มิ.ย. 68)', 'DMC_Hub_Year2568_Term1_Full.xlsx'));
    }
    if (exportY68_2Btn) {
      exportY68_2Btn.addEventListener('click', () => exportSpecificPeriodExcel('y68_2', 'ปี 2568 เทอม 2 (10 พ.ย. 68)', 'DMC_Hub_Year2568_Term2_Full.xlsx'));
    }
    if (exportY68_3Btn) {
      exportY68_3Btn.addEventListener('click', () => exportSpecificPeriodExcel('y68_3', 'ปี 2568 สิ้นปี (30 เม.ย. 69)', 'DMC_Hub_Year2568_EndYear_Full.xlsx'));
    }
    if (exportY69_1Btn) {
      exportY69_1Btn.addEventListener('click', () => exportSpecificPeriodExcel('y69_1', 'ปี 2569 เทอม 1 (10 มิ.ย. 69)', 'DMC_Hub_Year2569_Term1_Full.xlsx'));
    }
    if (exportY69_2Btn) {
      exportY69_2Btn.addEventListener('click', () => exportSpecificPeriodExcel('y69_2', 'ปี 2569 เทอม 2 (10 พ.ย. 69)', 'DMC_Hub_Year2569_Term2_Full.xlsx'));
    }
    if (exportAllPeriodsBtn) {
      exportAllPeriodsBtn.addEventListener('click', () => exportAllPeriodsMasterExcel());
    }

});
