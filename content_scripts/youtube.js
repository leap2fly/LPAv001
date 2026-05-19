(function() {
    async function applyYouTubeRestrictions() {
        const { settings } = await chrome.storage.local.get("settings");
        if (!settings || !settings.platforms.youtube) return;

        const ytSettings = settings.platforms.youtube;
        const styleId = 'pc-yt-styles';
        let styleEl = document.getElementById(styleId);

        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = styleId;
            document.head.appendChild(styleEl);
        }

        let css = '';
        if (ytSettings.shorts) {
            css += `
                /* Hide Shorts in various locations using more robust selectors */
                [is-shorts],
                ytd-grid-video-renderer:has(a[href^="/shorts"]),
                ytd-reel-shelf-renderer,
                ytd-rich-shelf-renderer[is-shorts],
                a[href^="/shorts"],
                [aria-label="Shorts"] { display: none !important; }
            `;
        }
        if (ytSettings.comments) {
            css += `ytd-comments, #comments { display: none !important; }`;
        }
        if (ytSettings.videos) {
            css += `ytd-browse, ytd-watch-flexy, #page-manager { display: none !important; }`;
        }

        styleEl.textContent = css;
    }

    applyYouTubeRestrictions();
    window.addEventListener('yt-navigate-finish', applyYouTubeRestrictions);

    const observer = new MutationObserver(applyYouTubeRestrictions);
    observer.observe(document.head, { childList: true });
})();
