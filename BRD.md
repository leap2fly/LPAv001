# Business Requirements Document (BRD): Parental Control Extension v1.0

## 1. Project Overview
The Parental Control Extension is a Chrome-based browser extension designed to provide parents with robust tools to monitor, manage, and restrict their children's online activity. Version 1.0 focuses on high performance, local data privacy, and core safety features suitable for kids and teens.

## 2. Business Objectives
- **Safety**: Ensure a safe browsing environment by enforcing SafeSearch and blocking harmful content.
- **Balance**: Provide tools to manage screen time through daily quotas and off-hours.
- **Privacy**: Keep all monitoring data and configuration local to the user's browser (v1.0).
- **Performance**: Maintain a seamless browsing experience with minimal resource overhead.

## 3. Target Audience
- Parents/Guardians looking to supervise their children's internet usage on shared or dedicated computers.
- Educational environments requiring lightweight web filtering.

## 4. Functional Requirements

### 4.1 Content Filtering
- **URL Blacklisting**: Ability to block specific domains or full URLs.
- **URL Whitelisting**: Ability to allow specific domains that take precedence over block rules.
- **Keyword Filtering**: Real-time scanning of page text for restricted keywords.
- **SafeSearch Enforcement**: Automatic enforcement of "Safe Mode" on major search engines (Google, Bing) and YouTube.

### 4.2 Time Management
- **Daily Quota**: Set a maximum number of minutes for total browsing per day.
- **Off-Hours**: Define a specific time window (e.g., 10 PM to 7 AM) where all browsing is disabled.
- **Blocked Page**: A custom landing page redirected to when limits are reached.

### 4.3 Platform-Specific Controls
- **YouTube**:
    - Toggle for hiding "Shorts".
    - Toggle for disabling "Comments".
    - Option to block the entire platform.
- **TikTok**:
    - Option to block the entire platform.

### 4.4 Monitoring & Administration
- **Activity Logs**: Record a history of visited URLs (stored locally).
- **Master PIN**: A 4-digit PIN required to access the Management Dashboard and modify settings.
- **Dashboard**: A clean, internal UI for configuring all extension settings.

## 5. Non-Functional Requirements

### 5.1 Performance
- **Low Latency**: Use of `declarativeNetRequest` for browser-level blocking to avoid network delay.
- **Efficient Filtering**: Debounced content scripts to prevent CPU spikes and layout thrashing.
- **Lightweight**: Minimal background process memory footprint.

### 5.2 Security
- **Local Protection**: Settings and logs are stored in `chrome.storage.local`.
- **Integrity**: Separation of logs and settings storage to prevent data loss during concurrent writes.

### 5.3 Reliability
- **Persistence**: Usage statistics and limits persist across browser restarts.
- **Conflict Resolution**: Whitelists always override blacklists.

## 6. System Architecture (v1.0)
- **Frontend**: HTML5, CSS3, Vanilla JavaScript.
- **Extension API**: Chrome Extension Manifest V3.
- **Logic**:
    - `background.js`: Service worker for session management, alarm triggers, and rule updates.
    - `content_scripts/`: Domain-specific scripts for DOM manipulation (YouTube/TikTok) and general keyword scanning.
    - `ui/`: PIN-protected options page and status popup.

## 7. Future Scope (v2.0+)
- **Email-based 2FA**: Integration with a backend service to send authentication codes for uninstallation/configuration changes.
- **Remote Dashboard**: A web-based portal for parents to manage settings and view logs from any device.
- **Uninstall Notifications**: Alerting parents if the extension is tampered with or removed.
- **Advanced Categories**: AI-based URL categorization (Pornography, Gambling, etc.).
- **Multiple Child Profiles**: Different rulesets based on individual child logins.
