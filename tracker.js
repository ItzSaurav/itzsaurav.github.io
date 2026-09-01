/**
 * Saurav Mishra Portfolio - Visitor Tracker
 * Privacy-conscious visitor logging with 24-hour IP/visitor de-duplication.
 */

(function() {
    'use strict';

    // Helper: Generate or retrieve persistent anonymous Visitor ID
    function getVisitorId() {
        let visitorId = localStorage.getItem('portfolio_visitor_id');
        let isNew = false;
        if (!visitorId) {
            visitorId = 'v_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36);
            localStorage.setItem('portfolio_visitor_id', visitorId);
            isNew = true;
        }
        return { visitorId, isNew };
    }

    // Helper: Compute ISO 8601 Week Number
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

    // Helper: Parse Referrer Domain
    function parseReferrer(refUrl) {
        if (!refUrl || refUrl === '') return { source: 'Direct', domain: 'Direct' };
        try {
            const url = new URL(refUrl);
            const host = url.hostname.toLowerCase();
            if (host.includes('localhost') || host.includes('127.0.0.1') || host.includes('itzsaurav.github.io')) {
                return { source: 'Internal', domain: host };
            }
            if (host.includes('linkedin')) return { source: 'LinkedIn', domain: host };
            if (host.includes('github')) return { source: 'GitHub', domain: host };
            if (host.includes('google')) return { source: 'Google', domain: host };
            if (host.includes('twitter') || host.includes('t.co') || host.includes('x.com')) return { source: 'X / Twitter', domain: host };
            if (host.includes('reddit')) return { source: 'Reddit', domain: host };
            if (host.includes('bing') || host.includes('duckduckgo') || host.includes('ecosia')) return { source: 'Search Engine', domain: host };
            return { source: host.replace('www.', ''), domain: host };
        } catch (e) {
            return { source: 'Referral', domain: refUrl };
        }
    }

    // Helper: Detect Device, OS, and Browser
    function getClientEnvironment() {
        const ua = navigator.userAgent;
        let device = 'Desktop';
        if (/Mobi|Android/i.test(ua)) {
            device = 'Mobile';
        } else if (/iPad|Tablet/i.test(ua)) {
            device = 'Tablet';
        } else if (window.innerWidth <= 768) {
            device = 'Mobile';
        }

        let os = 'Unknown OS';
        if (/Win/i.test(ua)) os = 'Windows';
        else if (/Mac/i.test(ua)) os = 'macOS';
        else if (/Linux/i.test(ua)) os = 'Linux';
        else if (/Android/i.test(ua)) os = 'Android';
        else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS';

        let browser = 'Unknown';
        if (/Edg/i.test(ua)) browser = 'Edge';
        else if (/Chrome/i.test(ua) && !/Edg/i.test(ua)) browser = 'Chrome';
        else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari';
        else if (/Firefox/i.test(ua)) browser = 'Firefox';
        else if (/OPR|Opera/i.test(ua)) browser = 'Opera';

        return { device, os, browser };
    }

    // Helper: Fast Geo & IP lookup with timeout (Non-blocking)
    async function fetchGeoLocation() {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2200);
        try {
            const res = await fetch('https://freeipapi.com/api/json', { signal: controller.signal });
            clearTimeout(timeoutId);
            if (res.ok) {
                const data = await res.json();
                return {
                    ip: data.ipAddress || '',
                    country: data.countryName || 'Unknown',
                    countryCode: data.countryCode || 'UN',
                    city: data.cityName || 'Unknown'
                };
            }
        } catch (e) {
            // Fallback
        }
        return { ip: '', country: 'Unknown', countryCode: 'UN', city: 'Unknown' };
    }

    // Main Log Visit Function with 1-Day IP De-duplication
    async function logVisit() {
        const now = new Date();
        const todayDateStr = now.toISOString().slice(0, 10); // YYYY-MM-DD
        const { visitorId, isNew } = getVisitorId();

        // 1. Fetch IP & Geo
        const geo = await fetchGeoLocation();

        // Build a unique daily identifier (IP-based or VisitorID-based)
        const ipKeySegment = geo.ip ? 'ip_' + geo.ip.replace(/[^a-zA-Z0-9]/g, '_') : visitorId;
        const dailyUniqueId = `${ipKeySegment}_${todayDateStr}`;

        // 2. Check Daily De-duplication in Local Cache
        const lastLoggedDate = localStorage.getItem('portfolio_last_log_date_' + ipKeySegment);
        if (lastLoggedDate === todayDateStr) {
            // Already counted this IP/visitor today. Skip duplicate counting.
            return;
        }

        const isoWeek = getISOWeekInfo(now);
        const refInfo = parseReferrer(document.referrer);
        const env = getClientEnvironment();
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayOfWeek = days[now.getDay()];

        const visitRecord = {
            id: dailyUniqueId,
            visitorId: visitorId,
            isNewVisitor: isNew,
            timestamp: now.toISOString(),
            date: todayDateStr,
            year: isoWeek.year,
            week: isoWeek.week,
            yearWeek: isoWeek.yearWeek,
            dayOfWeek: dayOfWeek,
            path: window.location.pathname || '/',
            referrer: refInfo.source,
            referrerDomain: refInfo.domain,
            device: env.device,
            os: env.os,
            browser: env.browser,
            screenWidth: window.screen.width,
            screenHeight: window.screen.height,
            language: navigator.language || 'en',
            country: geo.country,
            countryCode: geo.countryCode,
            city: geo.city
        };

        // Mark as counted for today
        localStorage.setItem('portfolio_last_log_date_' + ipKeySegment, todayDateStr);

        // Determine if Firebase is configured
        const activeFirebaseConfig = window.isFirebaseConfigured ? window.isFirebaseConfigured() : null;

        if (activeFirebaseConfig && typeof firebase !== 'undefined') {
            try {
                if (!firebase.apps.length) {
                    firebase.initializeApp(activeFirebaseConfig);
                }
                const db = firebase.firestore();
                // Use dailyUniqueId as document ID so the same IP can never have duplicate docs on the same day
                await db.collection('portfolio_visits').doc(dailyUniqueId).set(visitRecord);
                console.log('[Tracker] Unique daily visit logged to Firebase Firestore.');
            } catch (err) {
                console.warn('[Tracker] Firebase write fallback to local storage:', err.message);
                saveToLocalStorage(visitRecord);
            }
        } else {
            saveToLocalStorage(visitRecord);
        }
    }

    function saveToLocalStorage(record) {
        try {
            const raw = localStorage.getItem('local_portfolio_visits');
            const list = raw ? JSON.parse(raw) : [];
            
            // Check if record for this dailyUniqueId already exists
            const exists = list.some(item => item.id === record.id);
            if (!exists) {
                list.unshift(record);
                if (list.length > 200) list.pop();
                localStorage.setItem('local_portfolio_visits', JSON.stringify(list));
            }
        } catch (e) {
            console.error('[Tracker] Local storage write failed:', e);
        }
    }

    // Auto-run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', logVisit);
    } else {
        logVisit();
    }

    window.logPortfolioVisit = logVisit;
})();
