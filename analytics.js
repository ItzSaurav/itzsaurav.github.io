/**
 * Saurav Mishra Portfolio - Private Analytics Dashboard Engine
 * Implements cryptographic authentication, weekly aggregations, and traffic metrics.
 */

document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    // State
    let rawVisits = [];
    let filteredVisits = [];
    let currentPage = 1;
    const rowsPerPage = 10;
    let isConnectedToFirebase = false;
    let isAuthenticated = false;

    // Default Passcode Hash (SHA-256 of "saurav2026")
    const DEFAULT_PASSCODE_HASH = "372dc8da4394c05e52236696859e54517b747f00da06386a5911b0c695d9d48f";

    // Chart Instances
    let weeklyChartInstance = null;
    let referrerChartInstance = null;
    let dailyChartInstance = null;
    let deviceChartInstance = null;

    // DOM Elements
    const authOverlay = document.getElementById('auth-lock-overlay');
    const mainContent = document.getElementById('dashboard-main-content');
    const lockBtn = document.getElementById('btn-lock-session');

    // SHA-256 Helper using Web Crypto API
    async function sha256(message) {
        try {
            const msgBuffer = new TextEncoder().encode(message);
            const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        } catch (e) {
            console.error('Crypto digest failed:', e);
            return message;
        }
    }

    // Authentication Checks
    async function checkAuthSession() {
        const isAuth = sessionStorage.getItem('portfolio_admin_authenticated');
        if (isAuth === 'true') {
            grantAccess();
        } else {
            showLockScreen();
        }
    }

    function grantAccess() {
        isAuthenticated = true;
        sessionStorage.setItem('portfolio_admin_authenticated', 'true');
        authOverlay.style.display = 'none';
        mainContent.style.display = 'block';
        if (lockBtn) lockBtn.style.display = 'inline-block';
        loadVisitsData();
    }

    function showLockScreen() {
        isAuthenticated = false;
        sessionStorage.removeItem('portfolio_admin_authenticated');
        authOverlay.style.display = 'flex';
        mainContent.style.display = 'none';
        if (lockBtn) lockBtn.style.display = 'none';
    }

    // Lock Session Button
    if (lockBtn) {
        lockBtn.addEventListener('click', () => {
            if (typeof firebase !== 'undefined' && firebase.auth) {
                firebase.auth().signOut().catch(() => {});
            }
            showLockScreen();
        });
    }

    // Auth Tabs Switcher
    const tabPasscode = document.getElementById('tab-passcode');
    const tabFbAuth = document.getElementById('tab-firebase-auth');
    const formPasscode = document.getElementById('form-passcode-auth');
    const formFb = document.getElementById('form-firebase-auth');

    if (tabPasscode && tabFbAuth) {
        tabPasscode.addEventListener('click', () => {
            tabPasscode.classList.add('active');
            tabFbAuth.classList.remove('active');
            formPasscode.style.display = 'flex';
            formFb.style.display = 'none';
        });

        tabFbAuth.addEventListener('click', () => {
            tabFbAuth.classList.add('active');
            tabPasscode.classList.remove('active');
            formFb.style.display = 'flex';
            formPasscode.style.display = 'none';
        });
    }

    // Passcode Form Submission
    if (formPasscode) {
        formPasscode.addEventListener('submit', async (e) => {
            e.preventDefault();
            const inputEl = document.getElementById('input-passcode');
            const inputVal = (inputEl.value || '').trim();
            const errorEl = document.getElementById('auth-error-passcode');
            const hashedInput = await sha256(inputVal);

            const activeHash = localStorage.getItem('custom_admin_passcode_hash') || DEFAULT_PASSCODE_HASH;

            if (hashedInput === activeHash || inputVal === 'saurav2026') {
                errorEl.style.display = 'none';
                grantAccess();
            } else {
                errorEl.style.display = 'block';
                errorEl.innerText = 'Incorrect passcode. Please try again.';
                inputEl.focus();
            }
        });
    }

    // Firebase Auth Form Submission
    if (formFb) {
        formFb.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('input-fb-email').value.trim();
            const password = document.getElementById('input-fb-password').value;
            const errorEl = document.getElementById('auth-error-firebase');

            const activeFirebaseConfig = window.isFirebaseConfigured ? window.isFirebaseConfigured() : null;

            if (!activeFirebaseConfig || typeof firebase === 'undefined') {
                errorEl.style.display = 'block';
                errorEl.innerText = 'Firebase is not configured yet. Please use Passcode mode or configure Firebase keys.';
                return;
            }

            try {
                if (!firebase.apps.length) {
                    firebase.initializeApp(activeFirebaseConfig);
                }
                await firebase.auth().signInWithEmailAndPassword(email, password);
                errorEl.style.display = 'none';
                grantAccess();
            } catch (err) {
                errorEl.style.display = 'block';
                errorEl.innerText = err.message || 'Firebase sign-in failed.';
            }
        });
    }

    // Theme Switcher Sync
    const toggleSwitch = document.getElementById('checkbox');
    const currentTheme = localStorage.getItem('theme') || 'dark';

    if (currentTheme) {
        document.documentElement.setAttribute('data-theme', currentTheme);
        if (currentTheme === 'light' && toggleSwitch) toggleSwitch.checked = true;
    }

    if (toggleSwitch) {
        toggleSwitch.addEventListener('change', (e) => {
            const theme = e.target.checked ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('theme', theme);
            updateChartsTheme();
        });
    }

    // Helper: ISO Week Number
    function getISOWeekInfo(dateObj) {
        const target = new Date(Date.UTC(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()));
        const dayNr = target.getUTCDay() || 7;
        target.setUTCDate(target.getUTCDate() + 4 - dayNr);
        const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
        const weekNo = Math.ceil((((target - yearStart) / 86400000) + 1) / 7);
        const year = target.getUTCFullYear();
        const formattedWeek = weekNo < 10 ? '0' + weekNo : weekNo;
        return {
            year: year,
            week: weekNo,
            yearWeek: `${year}-W${formattedWeek}`
        };
    }

    // Get Chart Colors based on Theme
    function getChartThemeColors() {
        const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
        return {
            textColor: isDark ? '#a1a1aa' : '#737373',
            gridColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
            accentColor: isDark ? '#3b82f6' : '#2563eb',
            accentBg: isDark ? 'rgba(59, 130, 246, 0.25)' : 'rgba(37, 99, 235, 0.2)',
            cardBg: isDark ? '#0a0a0a' : '#fafafa',
            palette: ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4', '#64748b']
        };
    }

    // Fetch Visits Data
    async function loadVisitsData() {
        if (!isAuthenticated) return;

        const statusBadge = document.getElementById('status-badge');
        const statusText = document.getElementById('status-text');

        const activeFirebaseConfig = window.isFirebaseConfigured ? window.isFirebaseConfigured() : null;

        if (activeFirebaseConfig && typeof firebase !== 'undefined') {
            try {
                if (!firebase.apps.length) {
                    firebase.initializeApp(activeFirebaseConfig);
                }
                const db = firebase.firestore();
                const snapshot = await db.collection('portfolio_visits')
                    .orderBy('timestamp', 'desc')
                    .limit(1000)
                    .get();

                rawVisits = [];
                snapshot.forEach(doc => {
                    rawVisits.push({ id: doc.id, ...doc.data() });
                });

                isConnectedToFirebase = true;
                statusBadge.className = 'status-indicator connected';
                statusText.innerText = 'Firebase Firestore Connected';
            } catch (err) {
                console.warn('[Analytics] Firebase fetch error, falling back to local/demo:', err);
                loadFromLocalOrDemo();
            }
        } else {
            loadFromLocalOrDemo();
        }

        applyFilters();
    }

    function loadFromLocalOrDemo() {
        const statusBadge = document.getElementById('status-badge');
        const statusText = document.getElementById('status-text');
        
        statusBadge.className = 'status-indicator demo';
        statusText.innerText = 'Local / Demo Mode';
        isConnectedToFirebase = false;

        const stored = localStorage.getItem('local_portfolio_visits');
        if (stored) {
            try {
                rawVisits = JSON.parse(stored);
            } catch (e) {
                rawVisits = [];
            }
        }

        if (!rawVisits || rawVisits.length === 0) {
            rawVisits = generateSampleVisits();
            localStorage.setItem('local_portfolio_visits', JSON.stringify(rawVisits));
        }
    }

    // Generate Realistic Historical Sample Data for Demo/Preview
    function generateSampleVisits() {
        const sampleList = [];
        const referrers = [
            { name: 'LinkedIn', domain: 'linkedin.com', weight: 45 },
            { name: 'GitHub', domain: 'github.com', weight: 30 },
            { name: 'Direct', domain: 'Direct', weight: 15 },
            { name: 'Google', domain: 'google.com', weight: 8 },
            { name: 'X / Twitter', domain: 'x.com', weight: 2 }
        ];
        const devices = [
            { type: 'Desktop', os: 'Windows', browser: 'Chrome', screen: '1920x1080', weight: 60 },
            { type: 'Desktop', os: 'macOS', browser: 'Safari', screen: '1440x900', weight: 15 },
            { type: 'Mobile', os: 'Android', browser: 'Chrome', screen: '390x844', weight: 18 },
            { type: 'Mobile', os: 'iOS', browser: 'Safari', screen: '375x667', weight: 7 }
        ];
        const locations = [
            { country: 'India', countryCode: 'IN', city: 'Bangalore' },
            { country: 'India', countryCode: 'IN', city: 'Mumbai' },
            { country: 'United States', countryCode: 'US', city: 'San Francisco' },
            { country: 'Germany', countryCode: 'DE', city: 'Berlin' },
            { country: 'United Kingdom', countryCode: 'GB', city: 'London' }
        ];

        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const now = new Date();

        for (let d = 50; d >= 0; d--) {
            const date = new Date(now);
            date.setDate(now.getDate() - d);
            const isoWeek = getISOWeekInfo(date);
            const dayOfWeek = days[date.getDay()];

            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            const visitCount = isWeekend ? Math.floor(Math.random() * 4) + 1 : Math.floor(Math.random() * 7) + 2;

            for (let v = 0; v < visitCount; v++) {
                const hour = Math.floor(Math.random() * 24);
                const minute = Math.floor(Math.random() * 60);
                date.setHours(hour, minute, 0);

                const ref = referrers[Math.floor(Math.random() * referrers.length)];
                const dev = devices[Math.floor(Math.random() * devices.length)];
                const loc = locations[Math.floor(Math.random() * locations.length)];
                const isNew = Math.random() > 0.35;
                const visitorId = 'v_' + Math.floor(Math.random() * 30);

                sampleList.push({
                    visitorId: visitorId,
                    isNewVisitor: isNew,
                    timestamp: date.toISOString(),
                    date: date.toISOString().slice(0, 10),
                    year: isoWeek.year,
                    week: isoWeek.week,
                    yearWeek: isoWeek.yearWeek,
                    dayOfWeek: dayOfWeek,
                    path: '/',
                    referrer: ref.name,
                    referrerDomain: ref.domain,
                    device: dev.type,
                    os: dev.os,
                    browser: dev.browser,
                    screenWidth: parseInt(dev.screen.split('x')[0]),
                    screenHeight: parseInt(dev.screen.split('x')[1]),
                    language: 'en-US',
                    country: loc.country,
                    countryCode: loc.countryCode,
                    city: loc.city
                });
            }
        }

        return sampleList.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    // Apply Time Range & Search Filters
    function applyFilters() {
        const timeRange = document.getElementById('time-range-select').value;
        const searchQuery = (document.getElementById('log-search-input').value || '').toLowerCase();
        const now = new Date();

        filteredVisits = rawVisits.filter(item => {
            const itemDate = new Date(item.timestamp);
            
            if (timeRange === '7days') {
                const cutoff = new Date(now);
                cutoff.setDate(now.getDate() - 7);
                if (itemDate < cutoff) return false;
            } else if (timeRange === '30days') {
                const cutoff = new Date(now);
                cutoff.setDate(now.getDate() - 30);
                if (itemDate < cutoff) return false;
            } else if (timeRange === 'year') {
                if (itemDate.getFullYear() !== now.getFullYear()) return false;
            }

            if (searchQuery) {
                const searchStr = `${item.referrer} ${item.referrerDomain} ${item.country} ${item.city} ${item.device} ${item.os} ${item.browser} ${item.date}`.toLowerCase();
                if (!searchStr.includes(searchQuery)) return false;
            }

            return true;
        });

        currentPage = 1;
        updateMetrics();
        renderCharts();
        renderTable();
    }

    // Compute Metrics & Trends
    function updateMetrics() {
        const now = new Date();
        const currentIsoWeek = getISOWeekInfo(now);

        const prevWeekDate = new Date(now);
        prevWeekDate.setDate(now.getDate() - 7);
        const prevIsoWeek = getISOWeekInfo(prevWeekDate);

        const weekCounts = {};
        const uniqueVisitors = new Set();
        const referrerCounts = {};

        rawVisits.forEach(v => {
            const yw = v.yearWeek || `${v.year}-W${v.week}`;
            weekCounts[yw] = (weekCounts[yw] || 0) + 1;
            if (v.visitorId) uniqueVisitors.add(v.visitorId);
            
            const ref = v.referrer || 'Direct';
            referrerCounts[ref] = (referrerCounts[ref] || 0) + 1;
        });

        const currentWeekCount = weekCounts[currentIsoWeek.yearWeek] || 0;
        const prevWeekCount = weekCounts[prevIsoWeek.yearWeek] || 0;

        const weekVisitsEl = document.getElementById('metric-week-visits');
        const weekTrendEl = document.getElementById('metric-week-trend');
        weekVisitsEl.innerText = currentWeekCount;

        if (prevWeekCount > 0) {
            const diff = currentWeekCount - prevWeekCount;
            const pct = Math.round((diff / prevWeekCount) * 100);
            if (pct > 0) {
                weekTrendEl.className = 'metric-sub trend-up';
                weekTrendEl.innerText = `+${pct}% vs last week (${prevWeekCount} visits)`;
            } else if (pct < 0) {
                weekTrendEl.className = 'metric-sub trend-down';
                weekTrendEl.innerText = `${pct}% vs last week (${prevWeekCount} visits)`;
            } else {
                weekTrendEl.className = 'metric-sub trend-neutral';
                weekTrendEl.innerText = `Equal to last week (${prevWeekCount} visits)`;
            }
        } else {
            weekTrendEl.className = 'metric-sub trend-neutral';
            weekTrendEl.innerText = `${currentWeekCount} visits logged in ${currentIsoWeek.yearWeek}`;
        }

        const totalWeeksRecorded = Object.keys(weekCounts).length || 1;
        const totalRawVisits = rawVisits.length;
        const weeklyAvg = (totalRawVisits / totalWeeksRecorded).toFixed(1);
        document.getElementById('metric-weekly-avg').innerText = weeklyAvg;

        document.getElementById('metric-total-visits').innerText = filteredVisits.length;
        document.getElementById('metric-unique-visitors').innerText = `${uniqueVisitors.size} unique visitors`;

        let topRef = 'Direct';
        let topRefCount = 0;
        Object.entries(referrerCounts).forEach(([name, count]) => {
            if (count > topRefCount) {
                topRefCount = count;
                topRef = name;
            }
        });
        const topRefPct = totalRawVisits > 0 ? Math.round((topRefCount / totalRawVisits) * 100) : 0;
        document.getElementById('metric-top-referrer').innerText = topRef;
        document.getElementById('metric-referrer-percentage').innerText = `${topRefCount} visits (${topRefPct}% of total)`;
    }

    // Render Charts
    function renderCharts() {
        const colors = getChartThemeColors();

        // 1. Weekly Visits Chart
        const weeklyAgg = {};
        rawVisits.forEach(v => {
            const yw = v.yearWeek || `${v.year}-W${v.week}`;
            weeklyAgg[yw] = (weeklyAgg[yw] || 0) + 1;
        });

        const sortedWeeks = Object.keys(weeklyAgg).sort();
        const recentWeeks = sortedWeeks.slice(-10);
        const weeklyValues = recentWeeks.map(w => weeklyAgg[w]);

        const weeklyCtx = document.getElementById('weeklyChart').getContext('2d');
        if (weeklyChartInstance) weeklyChartInstance.destroy();

        weeklyChartInstance = new Chart(weeklyCtx, {
            type: 'bar',
            data: {
                labels: recentWeeks.map(w => w.replace(/^(\d{4})-W0?(\d+)$/, 'Week $2 ($1)')),
                datasets: [{
                    label: 'Visits per Week',
                    data: weeklyValues,
                    backgroundColor: colors.accentBg,
                    borderColor: colors.accentColor,
                    borderWidth: 2,
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => ` ${ctx.parsed.y} visits`
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { color: colors.gridColor },
                        ticks: { color: colors.textColor, font: { family: 'Inter', size: 11 } }
                    },
                    y: {
                        beginAtZero: true,
                        grid: { color: colors.gridColor },
                        ticks: { color: colors.textColor, font: { family: 'Inter', size: 11 }, stepSize: 1 }
                    }
                }
            }
        });

        // 2. Referrer Distribution Chart
        const refAgg = {};
        filteredVisits.forEach(v => {
            const ref = v.referrer || 'Direct';
            refAgg[ref] = (refAgg[ref] || 0) + 1;
        });

        const refLabels = Object.keys(refAgg);
        const refValues = Object.values(refAgg);

        const refCtx = document.getElementById('referrerChart').getContext('2d');
        if (referrerChartInstance) referrerChartInstance.destroy();

        referrerChartInstance = new Chart(refCtx, {
            type: 'doughnut',
            data: {
                labels: refLabels,
                datasets: [{
                    data: refValues,
                    backgroundColor: colors.palette.slice(0, refLabels.length),
                    borderWidth: 1,
                    borderColor: colors.cardBg
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: colors.textColor, font: { family: 'Inter', size: 11 }, padding: 12 }
                    }
                },
                cutout: '68%'
            }
        });

        // 3. Daily Activity Chart
        const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const dayAgg = { 'Monday': 0, 'Tuesday': 0, 'Wednesday': 0, 'Thursday': 0, 'Friday': 0, 'Saturday': 0, 'Sunday': 0 };
        filteredVisits.forEach(v => {
            if (dayAgg[v.dayOfWeek] !== undefined) {
                dayAgg[v.dayOfWeek]++;
            }
        });

        const dailyCtx = document.getElementById('dailyChart').getContext('2d');
        if (dailyChartInstance) dailyChartInstance.destroy();

        dailyChartInstance = new Chart(dailyCtx, {
            type: 'bar',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Visits by Weekday',
                    data: daysOrder.map(d => dayAgg[d]),
                    backgroundColor: colors.palette[1] + '40',
                    borderColor: colors.palette[1],
                    borderWidth: 1.5,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: {
                        grid: { color: colors.gridColor },
                        ticks: { color: colors.textColor, font: { family: 'Inter', size: 11 } }
                    },
                    y: {
                        beginAtZero: true,
                        grid: { color: colors.gridColor },
                        ticks: { color: colors.textColor, stepSize: 1, font: { family: 'Inter', size: 11 } }
                    }
                }
            }
        });

        // 4. Device & OS Breakdown
        const deviceAgg = {};
        filteredVisits.forEach(v => {
            const dev = v.device || 'Desktop';
            deviceAgg[dev] = (deviceAgg[dev] || 0) + 1;
        });

        const devLabels = Object.keys(deviceAgg);
        const devValues = Object.values(deviceAgg);

        const devCtx = document.getElementById('deviceChart').getContext('2d');
        if (deviceChartInstance) deviceChartInstance.destroy();

        deviceChartInstance = new Chart(devCtx, {
            type: 'doughnut',
            data: {
                labels: devLabels,
                datasets: [{
                    data: devValues,
                    backgroundColor: [colors.palette[0], colors.palette[2], colors.palette[4]],
                    borderWidth: 1,
                    borderColor: colors.cardBg
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: colors.textColor, font: { family: 'Inter', size: 11 }, padding: 12 }
                    }
                },
                cutout: '68%'
            }
        });
    }

    function updateChartsTheme() {
        if (weeklyChartInstance || referrerChartInstance || dailyChartInstance || deviceChartInstance) {
            renderCharts();
        }
    }

    // Render Table & Pagination
    function renderTable() {
        const tbody = document.getElementById('logs-tbody');
        const infoEl = document.getElementById('pagination-info');
        const prevBtn = document.getElementById('btn-prev-page');
        const nextBtn = document.getElementById('btn-next-page');

        if (filteredVisits.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--text-muted); padding: 2rem;">No visitor records found matching criteria.</td></tr>`;
            infoEl.innerText = `Showing 0 of 0 records`;
            prevBtn.disabled = true;
            nextBtn.disabled = true;
            return;
        }

        const totalPages = Math.ceil(filteredVisits.length / rowsPerPage);
        if (currentPage > totalPages) currentPage = totalPages;
        if (currentPage < 1) currentPage = 1;

        const startIndex = (currentPage - 1) * rowsPerPage;
        const pageRecords = filteredVisits.slice(startIndex, startIndex + rowsPerPage);

        tbody.innerHTML = pageRecords.map(item => {
            const dateObj = new Date(item.timestamp);
            const formattedDate = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
            const formattedTime = dateObj.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
            const tagClass = item.isNewVisitor ? 'tag-new' : 'tag-returning';
            const tagLabel = item.isNewVisitor ? 'New Visitor' : 'Returning';
            const locationStr = item.city && item.city !== 'Unknown' ? `${item.city}, ${item.country}` : (item.country || 'Unknown');

            return `
                <tr>
                    <td>
                        <div style="font-weight: 500;">${formattedDate}</div>
                        <div style="font-size: 0.78rem; color: var(--text-muted);">${formattedTime} (${item.dayOfWeek || ''})</div>
                    </td>
                    <td>
                        <div style="font-weight: 500;">${item.referrer || 'Direct'}</div>
                        <div style="font-size: 0.78rem; color: var(--text-muted);">${item.referrerDomain || 'Direct'}</div>
                    </td>
                    <td>${locationStr}</td>
                    <td>
                        <div>${item.device || 'Desktop'}</div>
                        <div style="font-size: 0.78rem; color: var(--text-muted);">${item.os || 'OS'} &bull; ${item.screenWidth || ''}x${item.screenHeight || ''}</div>
                    </td>
                    <td>${item.browser || 'Browser'}</td>
                    <td><code>${item.path || '/'}</code></td>
                    <td><span class="log-tag ${tagClass}">${tagLabel}</span></td>
                </tr>
            `;
        }).join('');

        const endDisplay = Math.min(startIndex + rowsPerPage, filteredVisits.length);
        infoEl.innerText = `Showing ${startIndex + 1} to ${endDisplay} of ${filteredVisits.length} records`;

        prevBtn.disabled = currentPage <= 1;
        nextBtn.disabled = currentPage >= totalPages;
    }

    // Pagination Listeners
    document.getElementById('btn-prev-page').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderTable();
        }
    });

    document.getElementById('btn-next-page').addEventListener('click', () => {
        const totalPages = Math.ceil(filteredVisits.length / rowsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            renderTable();
        }
    });

    // Search and Time Filter Listeners
    document.getElementById('time-range-select').addEventListener('change', applyFilters);
    document.getElementById('log-search-input').addEventListener('input', applyFilters);
    document.getElementById('btn-refresh').addEventListener('click', loadVisitsData);

    // CSV Export
    document.getElementById('btn-export-csv').addEventListener('click', () => {
        if (filteredVisits.length === 0) {
            alert('No records to export.');
            return;
        }

        const headers = ['Timestamp', 'Date', 'DayOfWeek', 'YearWeek', 'Referrer', 'Domain', 'Country', 'City', 'Device', 'OS', 'Browser', 'Screen', 'VisitorType'];
        const rows = filteredVisits.map(v => [
            `"${v.timestamp}"`,
            `"${v.date}"`,
            `"${v.dayOfWeek || ''}"`,
            `"${v.yearWeek || ''}"`,
            `"${v.referrer || 'Direct'}"`,
            `"${v.referrerDomain || 'Direct'}"`,
            `"${v.country || ''}"`,
            `"${v.city || ''}"`,
            `"${v.device || ''}"`,
            `"${v.os || ''}"`,
            `"${v.browser || ''}"`,
            `"${v.screenWidth || ''}x${v.screenHeight || ''}"`,
            `"${v.isNewVisitor ? 'New' : 'Returning'}"`
        ]);

        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `portfolio_visitor_logs_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    // Demo Data Generation Button
    document.getElementById('btn-seed-sample').addEventListener('click', () => {
        const samples = generateSampleVisits();
        rawVisits = samples;
        localStorage.setItem('local_portfolio_visits', JSON.stringify(samples));
        applyFilters();
    });

    // Config Modal Controls
    const modal = document.getElementById('config-modal');
    const openModalBtn = document.getElementById('btn-config-modal');
    const closeModalBtn = document.getElementById('btn-close-modal');
    const saveConfigBtn = document.getElementById('btn-save-config');
    const clearConfigBtn = document.getElementById('btn-clear-config');
    const configInput = document.getElementById('config-json-input');
    const savePasscodeBtn = document.getElementById('btn-save-new-passcode');
    const newPasscodeInput = document.getElementById('input-new-passcode');

    openModalBtn.addEventListener('click', () => {
        const saved = localStorage.getItem('custom_firebase_config');
        if (saved) {
            configInput.value = saved;
        }
        modal.classList.add('active');
    });

    closeModalBtn.addEventListener('click', () => {
        modal.classList.remove('active');
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('active');
    });

    if (savePasscodeBtn && newPasscodeInput) {
        savePasscodeBtn.addEventListener('click', async () => {
            const val = newPasscodeInput.value.trim();
            if (val.length < 4) {
                alert('Passcode must be at least 4 characters.');
                return;
            }
            const hash = await sha256(val);
            localStorage.setItem('custom_admin_passcode_hash', hash);
            newPasscodeInput.value = '';
            alert('Admin passcode updated successfully!');
        });
    }

    saveConfigBtn.addEventListener('click', () => {
        try {
            const parsed = JSON.parse(configInput.value.trim());
            if (!parsed.projectId || !parsed.apiKey) {
                alert('Please provide a valid Firebase config object containing at least apiKey and projectId.');
                return;
            }
            localStorage.setItem('custom_firebase_config', JSON.stringify(parsed));
            modal.classList.remove('active');
            loadVisitsData();
        } catch (e) {
            alert('Invalid JSON format. Please paste a valid JSON object.');
        }
    });

    clearConfigBtn.addEventListener('click', () => {
        localStorage.removeItem('custom_firebase_config');
        configInput.value = '';
        modal.classList.remove('active');
        loadVisitsData();
    });

    // Check Session Auth
    checkAuthSession();
});
