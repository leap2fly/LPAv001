let currentSettings = {};

// Auth
document.getElementById('login-btn').addEventListener('click', async () => {
    const pin = document.getElementById('pin-input').value;
    const { settings } = await chrome.storage.local.get("settings");
    if (pin === settings.masterPin) {
        document.getElementById('login-overlay').classList.add('hidden');
        document.getElementById('main-content').classList.remove('hidden');
        document.getElementById('nav-bar').classList.remove('hidden');
        loadSettings();
    }
});

// Navigation
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        if (btn.id === 'open-settings-full') {
            // In a real mobile app, this might open a sheet or more options
            alert("More settings: YouTube/TikTok filters can be configured in the extension's full options.");
            return;
        }
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const tabId = btn.getAttribute('data-tab');
        document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
        document.getElementById(tabId).classList.remove('hidden');
    });
});

async function loadSettings() {
    const data = await chrome.storage.local.get(["settings", "usage", "logs"]);
    currentSettings = data.settings;
    const usage = data.usage;
    const logs = data.logs || [];

    // Summary
    const quota = currentSettings.timeLimits.dailyQuota;
    const used = usage ? usage.minutes : 0;
    document.getElementById('remaining-display').textContent = currentSettings.timeLimits.enabled ? (quota - used) + 'm' : '∞';

    // Form values
    document.getElementById('dailyQuota').value = quota;
    document.getElementById('offStart').value = currentSettings.timeLimits.offHours.start;
    document.getElementById('offEnd').value = currentSettings.timeLimits.offHours.end;

    renderLogs(logs);
    renderList('url-list', currentSettings.blockedUrls || [], 'blockedUrls');
    renderList('keyword-list', currentSettings.blockedKeywords || [], 'blockedKeywords');
}

function renderLogs(logs) {
    const container = document.getElementById('log-feed');
    container.innerHTML = logs.slice(0, 20).map(log => `
        <div class="feed-item">
            <div class="feed-item-title">${new URL(log.url).hostname}</div>
            <div class="feed-item-meta">${new Date(log.timestamp).toLocaleTimeString()}</div>
        </div>
    `).join('');
}

function renderList(elementId, items, settingsKey) {
    const container = document.getElementById(elementId);
    container.innerHTML = items.map((item, idx) => `
        <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid var(--border-color);">
            <span>${item}</span>
            <span style="color:var(--danger-color); cursor:pointer;" onclick="removeItem('${settingsKey}', ${idx})">Remove</span>
        </div>
    `).join('');
}

window.removeItem = async (key, idx) => {
    currentSettings[key].splice(idx, 1);
    await chrome.storage.local.set({ settings: currentSettings });
    loadSettings();
    chrome.runtime.sendMessage({ action: "updateRules" });
};

document.getElementById('add-url').onclick = () => {
    const val = document.getElementById('url-input').value.trim();
    if (val) {
        currentSettings.blockedUrls.push(val);
        chrome.storage.local.set({ settings: currentSettings }).then(loadSettings);
        document.getElementById('url-input').value = '';
        chrome.runtime.sendMessage({ action: "updateRules" });
    }
};

document.getElementById('save-time').onclick = () => {
    currentSettings.timeLimits.dailyQuota = parseInt(document.getElementById('dailyQuota').value);
    currentSettings.timeLimits.offHours.start = document.getElementById('offStart').value;
    currentSettings.timeLimits.offHours.end = document.getElementById('offEnd').value;
    chrome.storage.local.set({ settings: currentSettings }).then(() => alert("Saved"));
};
