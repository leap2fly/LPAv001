let currentSettings = {};

// Auth Logic
document.getElementById('login-btn').addEventListener('click', async () => {
    const pin = document.getElementById('pin-input').value;
    const { settings } = await chrome.storage.local.get("settings");
    if (pin === settings.masterPin) {
        document.getElementById('login-overlay').classList.add('hidden');
        document.getElementById('main-content').classList.remove('hidden');
        loadSettings();
    } else {
        const err = document.getElementById('login-error');
        err.textContent = "Incorrect PIN";
        err.style.animation = "shake 0.2s";
        setTimeout(() => err.style.animation = "", 200);
    }
});

// Tab Switching Logic
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
        // Update Nav UI
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');

        // Update Content UI
        const tabId = item.getAttribute('data-tab');
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.add('hidden');
        });
        document.getElementById(tabId).classList.remove('hidden');
    });
});

async function loadSettings() {
    const data = await chrome.storage.local.get(["settings", "usage", "logs"]);
    currentSettings = data.settings;
    const usage = data.usage;
    const logs = data.logs || [];

    // General
    document.getElementById('safeSearch').checked = currentSettings.safeSearch;
    document.getElementById('ss-status').textContent = currentSettings.safeSearch ? "On" : "Off";

    // Time
    document.getElementById('timeEnabled').checked = currentSettings.timeLimits.enabled;
    document.getElementById('dailyQuota').value = currentSettings.timeLimits.dailyQuota;
    document.getElementById('quota-display').textContent = currentSettings.timeLimits.dailyQuota;
    document.getElementById('offStart').value = currentSettings.timeLimits.offHours.start;
    document.getElementById('offEnd').value = currentSettings.timeLimits.offHours.end;
    document.getElementById('current-usage').textContent = usage ? usage.minutes : 0;

    // Apps
    document.getElementById('ytShorts').checked = currentSettings.platforms.youtube.shorts;
    document.getElementById('ytComments').checked = currentSettings.platforms.youtube.comments;
    document.getElementById('ytVideos').checked = currentSettings.platforms.youtube.videos;
    document.getElementById('ttEnabled').checked = currentSettings.platforms.tiktok.enabled;

    // Web Lists
    renderList('url-list', currentSettings.blockedUrls || [], 'blockedUrls');
    renderList('allowed-url-list', currentSettings.allowedUrls || [], 'allowedUrls');
    renderList('keyword-list', currentSettings.blockedKeywords || [], 'blockedKeywords');

    // Logs
    renderLogs(logs);
}

function renderList(elementId, items, settingsKey) {
    const container = document.getElementById(elementId);
    container.innerHTML = '';
    items.forEach((item, index) => {
        const tag = document.createElement('div');
        tag.className = 'tag';
        tag.innerHTML = `
            ${item}
            <span data-index="${index}" data-key="${settingsKey}">&times;</span>
        `;
        tag.querySelector('span').onclick = (e) => {
            const idx = e.target.getAttribute('data-index');
            const key = e.target.getAttribute('data-key');
            currentSettings[key].splice(idx, 1);
            saveSettings();
        };
        container.appendChild(tag);
    });
}

function renderLogs(logs) {
    const container = document.getElementById('log-container');
    container.innerHTML = logs.map(log => `
        <tr>
            <td style="color: var(--text-muted)">${new Date(log.timestamp).toLocaleTimeString()}</td>
            <td title="${log.url}">${log.url}</td>
        </tr>
    `).join('');
}

async function saveSettings() {
    await chrome.storage.local.set({ settings: currentSettings });
    loadSettings();
    chrome.runtime.sendMessage({ action: "updateRules" });
}

// Global Event Listeners
document.getElementById('safeSearch').onchange = (e) => {
    currentSettings.safeSearch = e.target.checked;
    saveSettings();
};

document.getElementById('add-url').onclick = () => {
    const val = document.getElementById('url-input').value.trim();
    if (val) {
        if (!currentSettings.blockedUrls) currentSettings.blockedUrls = [];
        currentSettings.blockedUrls.push(val);
        document.getElementById('url-input').value = '';
        saveSettings();
    }
};

document.getElementById('add-allowed-url').onclick = () => {
    const val = document.getElementById('allowed-url-input').value.trim();
    if (val) {
        if (!currentSettings.allowedUrls) currentSettings.allowedUrls = [];
        currentSettings.allowedUrls.push(val);
        document.getElementById('allowed-url-input').value = '';
        saveSettings();
    }
};

document.getElementById('add-keyword').onclick = () => {
    const val = document.getElementById('keyword-input').value.trim();
    if (val) {
        if (!currentSettings.blockedKeywords) currentSettings.blockedKeywords = [];
        currentSettings.blockedKeywords.push(val);
        document.getElementById('keyword-input').value = '';
        saveSettings();
    }
};

document.getElementById('save-pin').onclick = () => {
    const newPin = document.getElementById('new-pin').value;
    if (newPin.length >= 4) {
        currentSettings.masterPin = newPin;
        saveSettings();
        alert("PIN Updated successfully");
        document.getElementById('new-pin').value = '';
    } else {
        alert("PIN must be at least 4 digits");
    }
};

document.getElementById('save-time').onclick = () => {
    currentSettings.timeLimits.enabled = document.getElementById('timeEnabled').checked;
    currentSettings.timeLimits.dailyQuota = parseInt(document.getElementById('dailyQuota').value) || 0;
    currentSettings.timeLimits.offHours.start = document.getElementById('offStart').value;
    currentSettings.timeLimits.offHours.end = document.getElementById('offEnd').value;
    saveSettings();
    alert("Time settings saved");
};

document.getElementById('reset-usage').onclick = () => {
    if (confirm("Are you sure you want to reset today's usage stats?")) {
        chrome.runtime.sendMessage({ action: "resetUsage" }, () => {
            loadSettings();
        });
    }
};

document.getElementById('clear-logs').onclick = async () => {
    if (confirm("Clear all activity logs?")) {
        await chrome.storage.local.set({ logs: [] });
        loadSettings();
    }
};

// App Toggle Listener
['ytShorts', 'ytComments', 'ytVideos', 'ttEnabled', 'timeEnabled'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.onchange = (e) => {
        if (id === 'timeEnabled') {
            currentSettings.timeLimits.enabled = e.target.checked;
        } else if (id === 'ttEnabled') {
            currentSettings.platforms.tiktok.enabled = e.target.checked;
        } else {
            const key = id.replace('yt', '').toLowerCase();
            currentSettings.platforms.youtube[key] = e.target.checked;
        }
        saveSettings();
    };
});
