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
        document.getElementById('login-error').textContent = "Incorrect PIN";
    }
});

async function loadSettings() {
    const data = await chrome.storage.local.get(["settings", "usage", "logs"]);
    currentSettings = data.settings;
    const usage = data.usage;
    const logs = data.logs || [];

    document.getElementById('safeSearch').checked = currentSettings.safeSearch;
    document.getElementById('timeEnabled').checked = currentSettings.timeLimits.enabled;
    document.getElementById('dailyQuota').value = currentSettings.timeLimits.dailyQuota;
    document.getElementById('offStart').value = currentSettings.timeLimits.offHours.start;
    document.getElementById('offEnd').value = currentSettings.timeLimits.offHours.end;

    document.getElementById('ytShorts').checked = currentSettings.platforms.youtube.shorts;
    document.getElementById('ytComments').checked = currentSettings.platforms.youtube.comments;
    document.getElementById('ytVideos').checked = currentSettings.platforms.youtube.videos;
    document.getElementById('ttEnabled').checked = currentSettings.platforms.tiktok.enabled;

    document.getElementById('current-usage').textContent = usage ? usage.minutes : 0;

    renderList('url-list', currentSettings.blockedUrls || [], 'blockedUrls');
    renderList('allowed-url-list', currentSettings.allowedUrls || [], 'allowedUrls');
    renderList('keyword-list', currentSettings.blockedKeywords || [], 'blockedKeywords');
    renderLogs(logs);
}

function renderList(elementId, items, settingsKey) {
    const container = document.getElementById(elementId);
    container.innerHTML = '';
    items.forEach((item, index) => {
        const tag = document.createElement('div');
        tag.className = 'tag';
        tag.textContent = item;
        const removeBtn = document.createElement('span');
        removeBtn.textContent = '×';
        removeBtn.onclick = () => {
            currentSettings[settingsKey].splice(index, 1);
            saveSettings();
        };
        tag.appendChild(removeBtn);
        container.appendChild(tag);
    });
}

function renderLogs(logs) {
    const container = document.getElementById('log-container');
    container.innerHTML = logs.map(log => `
        <div>[${new Date(log.timestamp).toLocaleString()}] ${log.url}</div>
    `).join('');
}

async function saveSettings() {
    await chrome.storage.local.set({ settings: currentSettings });
    loadSettings();
    // Notify background to update rules
    chrome.runtime.sendMessage({ action: "updateRules" });
}

// Event Listeners for UI updates
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
        alert("PIN Updated");
    }
};

document.getElementById('save-time').onclick = () => {
    currentSettings.timeLimits.enabled = document.getElementById('timeEnabled').checked;
    currentSettings.timeLimits.dailyQuota = parseInt(document.getElementById('dailyQuota').value);
    currentSettings.timeLimits.offHours.start = document.getElementById('offStart').value;
    currentSettings.timeLimits.offHours.end = document.getElementById('offEnd').value;
    saveSettings();
};

document.getElementById('reset-usage').onclick = () => {
    chrome.runtime.sendMessage({ action: "resetUsage" }, () => {
        loadSettings();
    });
};

document.getElementById('clear-logs').onclick = async () => {
    await chrome.storage.local.set({ logs: [] });
    loadSettings();
};

// Platform toggles
['ytShorts', 'ytComments', 'ytVideos'].forEach(id => {
    document.getElementById(id).onchange = (e) => {
        const key = id.replace('yt', '').toLowerCase();
        currentSettings.platforms.youtube[key] = e.target.checked;
        saveSettings();
    };
});

document.getElementById('ttEnabled').onchange = (e) => {
    currentSettings.platforms.tiktok.enabled = e.target.checked;
    saveSettings();
};
