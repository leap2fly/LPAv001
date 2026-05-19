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
    const data = await chrome.storage.local.get(["settings", "usage", "logs"]);
    currentSettings = data.settings;

    const used = data.usage ? data.usage.minutes : 0;
    document.getElementById('usage').textContent = used;
    document.getElementById('remaining').textContent = currentSettings.timeLimits.dailyQuota - used;

    document.getElementById('dailyQuota').value = currentSettings.timeLimits.dailyQuota;
    document.getElementById('offStart').value = currentSettings.timeLimits.offHours.start;
    document.getElementById('offEnd').value = currentSettings.timeLimits.offHours.end;

    document.getElementById('log-list').innerHTML = (data.logs || []).slice(0, 10).map(l => `
        <div style="padding: 8px 0; border-bottom: 1px solid rgba(0,0,0,0.1);">${l.url.substring(0, 40)}...</div>
    `).join('');
}

document.getElementById('save-settings').onclick = () => {
    currentSettings.timeLimits.dailyQuota = parseInt(document.getElementById('dailyQuota').value);
    currentSettings.timeLimits.offHours.start = document.getElementById('offStart').value;
    currentSettings.timeLimits.offHours.end = document.getElementById('offEnd').value;
    chrome.storage.local.set({ settings: currentSettings }).then(() => {
        alert("Grid Synchronized");
        loadSettings();
    });
};
