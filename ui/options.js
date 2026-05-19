let currentSettings = {};

document.getElementById('login-btn').addEventListener('click', async () => {
    const pin = document.getElementById('pin-input').value;
    const { settings } = await chrome.storage.local.get("settings");
    if (pin === settings.masterPin) {
        document.getElementById('login-overlay').classList.add('hidden');
        document.getElementById('main-content').classList.remove('hidden');
        loadSettings();
    }
});

async function loadSettings() {
    const data = await chrome.storage.local.get(["settings", "usage"]);
    currentSettings = data.settings;

    document.getElementById('usage').textContent = data.usage ? data.usage.minutes : 0;
    document.getElementById('dailyQuota').value = currentSettings.timeLimits.dailyQuota;
    document.getElementById('offStart').value = currentSettings.timeLimits.offHours.start;
    document.getElementById('offEnd').value = currentSettings.timeLimits.offHours.end;

    renderList('url-list', currentSettings.blockedUrls || [], 'blockedUrls');
}

function renderList(elementId, items, settingsKey) {
    const container = document.getElementById(elementId);
    container.innerHTML = items.map((item, idx) => `
        <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:0.5px solid var(--separator);">
            <span>${item}</span>
            <span style="color:red; cursor:pointer;" onclick="removeItem('${settingsKey}', ${idx})">Delete</span>
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

document.getElementById('save-all').onclick = () => {
    currentSettings.timeLimits.dailyQuota = parseInt(document.getElementById('dailyQuota').value);
    currentSettings.timeLimits.offHours.start = document.getElementById('offStart').value;
    currentSettings.timeLimits.offHours.end = document.getElementById('offEnd').value;
    chrome.storage.local.set({ settings: currentSettings }).then(() => alert("Configuration Updated"));
};
