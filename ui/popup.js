async function updateStats() {
    const data = await chrome.storage.local.get(["settings", "usage"]);
    if (!data.settings) return;

    const usage = data.usage ? data.usage.minutes : 0;
    const quota = data.settings.timeLimits.enabled ? data.settings.timeLimits.dailyQuota : 0;

    document.getElementById('usage').textContent = usage;

    if (quota > 0) {
        const remaining = Math.max(0, quota - usage);
        document.getElementById('remaining').textContent = remaining + 'm';
        const percent = Math.min(100, (usage / quota) * 100);
        document.getElementById('progress').style.width = percent + '%';
        if (percent > 90) {
            document.getElementById('progress').style.backgroundColor = '#ef4444';
        }
    } else {
        document.getElementById('remaining').textContent = 'No Limit';
        document.getElementById('progress').style.width = '0%';
    }
}

document.getElementById('open-settings').onclick = () => {
    chrome.runtime.openOptionsPage();
};

updateStats();
// Update every 30 seconds if popup is open
setInterval(updateStats, 30000);
