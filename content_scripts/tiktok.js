(function() {
    async function applyTikTokRestrictions() {
        const { settings } = await chrome.storage.local.get("settings");
        if (!settings || !settings.platforms.tiktok || !settings.platforms.tiktok.enabled) return;

        // If enabled means "blocked" in this context
        window.stop();
        document.documentElement.innerHTML = `
            <div style="background: #000; color: #fff; padding: 50px; font-family: sans-serif; height: 100vh; text-align: center;">
                <h1>TikTok is Restricted</h1>
                <p>Access to TikTok has been limited by your parents.</p>
                <button onclick="history.back()" style="padding: 10px 20px; cursor: pointer;">Go Back</button>
            </div>
        `;
    }

    applyTikTokRestrictions();
})();
