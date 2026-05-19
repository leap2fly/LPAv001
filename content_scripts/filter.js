(function() {
    let timeout = null;

    async function checkKeywords() {
        const { settings } = await chrome.storage.local.get("settings");
        if (!settings || !settings.blockedKeywords || settings.blockedKeywords.length === 0) return;

        // Optimization: use textContent and only on specific elements if possible,
        // but for full page block we need the whole body.
        // Also avoid innerText to prevent layout thrashing.
        const bodyText = document.body.textContent.toLowerCase();

        for (const keyword of settings.blockedKeywords) {
            if (bodyText.includes(keyword.toLowerCase())) {
                blockPage(keyword);
                break;
            }
        }
    }

    function blockPage(reason) {
        window.stop();
        document.documentElement.innerHTML = `
            <div style="background: #f8d7da; color: #721c24; padding: 50px; font-family: sans-serif; height: 100vh; text-align: center; z-index: 999999; position: relative;">
                <h1>Access Blocked by Parental Control</h1>
                <p>This page contains restricted content.</p>
                <button onclick="history.back()" style="padding: 10px 20px; cursor: pointer;">Go Back</button>
            </div>
        `;
    }

    // Debounced check
    function debouncedCheck() {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(checkKeywords, 500);
    }

    if (document.body) {
        debouncedCheck();
        const observer = new MutationObserver(debouncedCheck);
        observer.observe(document.body, { childList: true, subtree: true });
    } else {
        window.addEventListener('DOMContentLoaded', () => {
            debouncedCheck();
            const observer = new MutationObserver(debouncedCheck);
            observer.observe(document.body, { childList: true, subtree: true });
        });
    }
})();
