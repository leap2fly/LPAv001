const DEFAULT_SETTINGS = {
  masterPin: "1234",
  blockedUrls: [],
  allowedUrls: [],
  blockedKeywords: [],
  safeSearch: true,
  timeLimits: {
    dailyQuota: 120, // minutes
    offHours: { start: "22:00", end: "07:00" },
    enabled: false
  },
  platforms: {
    youtube: { shorts: true, comments: true, videos: false },
    tiktok: { enabled: false }
  }
};

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(["settings", "logs"], (data) => {
    if (!data.settings) {
      chrome.storage.local.set({
        settings: DEFAULT_SETTINGS,
        usage: { date: new Date().toLocaleDateString(), minutes: 0 },
        logs: []
      });
    }
    updateBlockingRules();
  });
});

async function updateBlockingRules() {
  const { settings } = await chrome.storage.local.get("settings");
  if (!settings) return;

  const rules = [];

  // URL blocking rules (Priority 2)
  (settings.blockedUrls || []).forEach((url, index) => {
    rules.push({
      id: 1000 + index,
      priority: 2,
      action: { type: "block" },
      condition: { urlFilter: url, resourceTypes: ["main_frame"] }
    });
  });

  // URL allowed rules (Whitelist - Priority 3)
  (settings.allowedUrls || []).forEach((url, index) => {
    rules.push({
      id: 5000 + index,
      priority: 3,
      action: { type: "allow" },
      condition: { urlFilter: url, resourceTypes: ["main_frame"] }
    });
  });

  // Safe Search for Google
  if (settings.safeSearch) {
    rules.push({
      id: 1,
      priority: 1,
      action: {
        type: "redirect",
        redirect: {
          // Using regexSubstitution as a robust alternative to queryTransform
          regexSubstitution: "https://www.google.com/search?safe=active&\\1"
        }
      },
      condition: {
        regexFilter: "^https://www\\.google\\.com/search\\?(.*)",
        resourceTypes: ["main_frame"]
      }
    });
    // Safe Search for Bing
    rules.push({
      id: 3,
      priority: 1,
      action: {
        type: "redirect",
        redirect: { regexSubstitution: "https://www.bing.com/search?adlt=strict&\\1" }
      },
      condition: {
        regexFilter: "^https://www\\.bing\\.com/search\\?(.*)",
        resourceTypes: ["main_frame"]
      }
    });
    // YouTube Restricted Mode
    rules.push({
        id: 2,
        priority: 1,
        action: {
            type: "modifyHeaders",
            requestHeaders: [{ header: "YouTube-Restrict", operation: "set", value: "Strict" }]
        },
        condition: { urlFilter: "youtube.com", resourceTypes: ["main_frame", "sub_frame", "xmlhttprequest"] }
    });
  }

  const oldRules = await chrome.declarativeNetRequest.getDynamicRules();
  const oldRuleIds = oldRules.map(r => r.id);

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: oldRuleIds,
    addRules: rules
  });

  // Ensure we are not stuck in "Blocked" mode if usage was just reset or it's a new day
  const { usage } = await chrome.storage.local.get("usage");
  const now = new Date();
  if (usage && usage.date === now.toLocaleDateString() && usage.minutes < settings.timeLimits.dailyQuota) {
      unblockAllBrowsing();
  }
}

// Listen for settings changes
chrome.storage.onChanged.addListener((changes) => {
  if (changes.settings) {
    updateBlockingRules();
  }
});

// Activity Logging
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && !tab.url.startsWith('chrome://')) {
    logActivity(tab.url);
  }
});

async function logActivity(url) {
  const data = await chrome.storage.local.get("logs");
  const logs = data.logs || [];

  const logEntry = { url, timestamp: new Date().toISOString() };
  logs.unshift(logEntry);
  if (logs.length > 1000) logs.pop();

  chrome.storage.local.set({ logs });
}

// Time Limit Logic
chrome.alarms.create("checkTimeLimits", { periodInMinutes: 1 });
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "checkTimeLimits") {
    checkAndEnforceTimeLimits();
  }
});

async function checkAndEnforceTimeLimits() {
    const { settings, usage } = await chrome.storage.local.get(["settings", "usage"]);
    if (!settings || !settings.timeLimits.enabled) return;

    const now = new Date();
    const today = now.toLocaleDateString();

    let currentUsage = usage || { date: today, minutes: 0 };
    if (currentUsage.date !== today) {
        currentUsage = { date: today, minutes: 0 };
    }

    // Check Off-Hours
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [startH, startM] = settings.timeLimits.offHours.start.split(":").map(Number);
    const [endH, endM] = settings.timeLimits.offHours.end.split(":").map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    let isOffHours = false;
    if (startMinutes > endMinutes) { // Over midnight
        isOffHours = currentTime >= startMinutes || currentTime < endMinutes;
    } else {
        isOffHours = currentTime >= startMinutes && currentTime < endMinutes;
    }

    // Check Quota
    const isOverQuota = currentUsage.minutes >= settings.timeLimits.dailyQuota;

    if (isOffHours || isOverQuota) {
        blockAllBrowsing();
    } else {
        // Increment usage if active (simplified)
        chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
            if (tabs.length > 0) {
                currentUsage.minutes += 1;
                chrome.storage.local.set({ usage: currentUsage });
            }
        });
    }
}

async function blockAllBrowsing() {
    const rules = [{
        id: 9999, // High ID for block rule
        priority: 10,
        action: { type: "redirect", redirect: { extensionPath: "/ui/blocked.html" } },
        condition: {
            urlFilter: "*",
            resourceTypes: ["main_frame"],
            excludedInitiatorDomains: [chrome.runtime.id]
        }
    }];

    await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: [9999],
        addRules: rules
    });
}

async function unblockAllBrowsing() {
    await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: [9999]
    });
}

// Message Listener for on-demand actions
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "updateRules") {
        updateBlockingRules().then(() => sendResponse({ success: true }));
        return true;
    }
    if (request.action === "resetUsage") {
        chrome.storage.local.set({ usage: { date: new Date().toLocaleDateString(), minutes: 0 } })
            .then(() => {
                unblockAllBrowsing();
                sendResponse({ success: true });
            });
        return true;
    }
});
