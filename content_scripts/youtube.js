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
                /* Hide Shorts in sidebars, guide, and search */
                ytd-guide-entry-renderer:has(a[href^="/shorts"]),
                ytd-mini-guide-entry-renderer[aria-label="Shorts"],
                ytd-reel-shelf-renderer,
                ytd-rich-shelf-renderer[is-shorts],
                a[href^="/shorts"],
                [title="Shorts"],
                [aria-label="Shorts"],
                /* Hide the Shorts video player/page if they somehow get there */
                ytd-shorts,
                /* Hide Shorts shelf on home and search results */
                ytd-rich-section-renderer:has(ytd-rich-shelf-renderer[is-shorts])
                { display: none !important; }
            `;

            // If the user is currently ON a shorts URL, redirect them home
            if (window.location.pathname.startsWith('/shorts/')) {
                window.location.href = 'https://www.youtube.com/';
            }
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

    // Use multiple triggers for YouTube SPA navigation
    window.addEventListener('yt-navigate-finish', applyYouTubeRestrictions);
    window.addEventListener('popstate', applyYouTubeRestrictions);

    // More aggressive observer for the dynamic content
    const observer = new MutationObserver((mutations) => {
        // Only re-apply if we don't see our style tag or on URL change
        if (!document.getElementById('pc-yt-styles')) {
            applyYouTubeRestrictions();
        }
    });

    if (document.head) {
        observer.observe(document.head, { childList: true });
    } else {
        window.addEventListener('DOMContentLoaded', () => {
            observer.observe(document.head, { childList: true });
        });
    }

    // Periodic check as a failsafe for the SPA
    setInterval(applyYouTubeRestrictions, 2000);
})();
