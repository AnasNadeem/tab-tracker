import { truncate, formatTime, totalTimeSpent, totalTImeSpentOnVisitedURL } from "./utils.js";

class TabTracker {
    constructor() {
        this.activeTabList = document.getElementById('activeTabList');
        this.closedTabList = document.getElementById('closedTabList');
        this.modal = document.getElementById('detailModal');
        this.modalBody = document.getElementById('modalBody');
        this.modalTitle = document.getElementById('modalTitle');

        this.currentTheme = localStorage.getItem('tab-tracker-theme') || 'light';
        this.activeTabsCount = 0;
        this.totalTimeSpent = 0;
        this.sessionStartTime = this.getSessionStartTime();

        this.initializeTheme();
        this.setupEventListeners();
        this.loadExistingTabs();
    }

    initializeTheme() {
        document.documentElement.setAttribute('data-theme', this.currentTheme);
    }

    setupEventListeners() {
        // Theme toggle
        const themeToggle = document.getElementById('themeToggle');
        themeToggle.addEventListener('click', () => this.toggleTheme());

        // Navigation
        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const targetTab = e.currentTarget.dataset.tab;
                this.switchView(targetTab);
            });
        });

        // Clear history
        const clearBtn = document.getElementById('clearHistoryBtn');
        clearBtn.addEventListener('click', () => this.clearHistory());

        // Modal events
        const modalClose = document.getElementById('modalClose');
        const modalBackdrop = document.querySelector('.modal-backdrop');

        modalClose.addEventListener('click', () => this.closeModal());
        modalBackdrop.addEventListener('click', () => this.closeModal());

        // Copy URL functionality
        this.modalBody.addEventListener('click', (e) => {
            if (e.target.closest('.copy-url-btn')) {
                const button = e.target.closest('.copy-url-btn');
                const url = button.dataset.url;
                this.copyToClipboard(url, button);
            }
        });

        // Close modal on escape key and keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.classList.contains('show')) {
                this.closeModal();
            }

            // Global keyboard navigation
            this.handleKeyboardNavigation(e);
        });
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        localStorage.setItem('tab-tracker-theme', this.currentTheme);
    }

    switchView(viewType) {
        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === viewType);
        });

        // Update views
        document.querySelectorAll('.tab-view').forEach(view => {
            view.classList.toggle('active', view.id === `${viewType}View`);
        });
    }

    async loadExistingTabs() {
        // Show loading state
        this.showLoadingState();

        try {
            const result = await chrome.storage.local.get();
            const activeTabs = [];
            const closedTabs = [];

            for (const tabId in result) {
                const tab = result[tabId];
                if (tab.endTime !== null) {
                    // Closed tab
                    tab.timeDiff = Math.round((tab.endTime - tab.startTime) / 1000);
                    closedTabs.push(tab);
                } else {
                    // Active tab
                    try {
                        const chromeTab = await chrome.tabs.get(parseInt(tabId));
                        tab.title = chromeTab.title;
                        tab.url = chromeTab.url;
                        tab.active = chromeTab.active;

                        await chrome.storage.local.set({ [tabId]: tab });

                        const currentTime = new Date().getTime();
                        tab.timeDiff = (currentTime - tab.startTime) / 1000;
                        activeTabs.push(tab);
                    } catch (error) {
                        // Tab doesn't exist anymore, remove it
                        await chrome.storage.local.remove(tabId);
                    }
                }
            }

            this.renderActiveTabs(activeTabs);
            this.renderClosedTabs(closedTabs);
            this.updateStats(activeTabs);

        } catch (error) {
            console.error('Error loading tabs:', error);
        }
    }

    updateStats(activeTabs) {
        this.activeTabsCount = activeTabs.length;
        this.totalTimeSpent = activeTabs.reduce((total, tab) => {
            const currentTime = new Date().getTime();
            return total + totalTimeSpent(tab, currentTime);
        }, 0);

        document.getElementById('activeTabs').textContent = this.activeTabsCount;
        document.getElementById('totalTime').textContent = formatTime(this.totalTimeSpent);

        // Update session time
        this.updateSessionTime();
    }

    getSessionStartTime() {
        // Get session start time from localStorage or set current time
        const stored = localStorage.getItem('tab-tracker-session-start');
        if (stored) {
            const sessionStart = parseInt(stored);
            const now = new Date().getTime();
            // Reset if more than 24 hours ago (new session)
            if (now - sessionStart > 24 * 60 * 60 * 1000) {
                const newStart = now;
                localStorage.setItem('tab-tracker-session-start', newStart.toString());
                return newStart;
            }
            return sessionStart;
        } else {
            const now = new Date().getTime();
            localStorage.setItem('tab-tracker-session-start', now.toString());
            return now;
        }
    }

    updateSessionTime() {
        const currentTime = new Date().getTime();
        const sessionDuration = (currentTime - this.sessionStartTime) / 1000;
        document.getElementById('sessionTime').textContent = formatTime(sessionDuration);
    }

    renderActiveTabs(tabs) {
        if (tabs.length === 0) {
            this.activeTabList.innerHTML = this.getEmptyState(
                'No active tabs tracked yet',
                'Start browsing to see your tab time tracking here. The extension automatically tracks time spent on each tab.',
                'active'
            );
            return;
        }

        this.activeTabList.innerHTML = tabs.map(tab => this.createTabItem(tab, true)).join('');
        this.attachTabEventListeners('active');
    }

    renderClosedTabs(tabs) {
        if (tabs.length === 0) {
            this.closedTabList.innerHTML = this.getEmptyState(
                'No browsing history yet',
                'Your closed tab history will appear here. Close some tabs to see your browsing patterns and time spent.',
                'history'
            );
            return;
        }

        this.closedTabList.innerHTML = tabs.map(tab => this.createTabItem(tab, false)).join('');
        this.attachTabEventListeners('closed');
    }

    createTabItem(tab, isActive) {
        const currentTime = new Date().getTime();
        const timeSpent = totalTimeSpent(tab, currentTime);
        const totalTime = isActive ? tab.timeDiff : tab.timeDiff;

        const favicon = this.getFaviconUrl(tab.url);
        const domain = this.getDomain(tab.url);

        return `
            <div class="tab-item ${tab.active ? 'active-tab' : ''}" data-tab-id="${tab.id}" tabindex="0">
                <div class="tab-header">
                    <div class="tab-title" title="${tab.title}">
                        ${truncate(tab.title || 'Untitled Tab', 35)}
                    </div>
                    ${isActive ? `<span class="tab-status ${tab.active ? 'active' : 'inactive'}">${tab.active ? 'active' : 'inactive'}</span>` : ''}
                </div>

                <div class="tab-url" title="${tab.url}">
                    ${domain}
                </div>

                <div class="tab-stats">
                    <div class="time-stats">
                        <div class="time-stat">
                            <span class="time-value">${formatTime(timeSpent)}</span>
                            <span class="time-label">Spent</span>
                        </div>
                        <div class="time-stat">
                            <span class="time-value">${formatTime(totalTime)}</span>
                            <span class="time-label">Total</span>
                        </div>
                    </div>

                    ${tab.tabTracker && tab.tabTracker.length > 0 ? `
                        <button class="detail-btn" data-tab-id="${tab.id}">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="3"></circle>
                                <path d="M12 1v6m0 6v6"></path>
                                <path d="M1 12h6m6 0h6"></path>
                            </svg>
                            Details
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    getFaviconUrl(url) {
        try {
            const domain = new URL(url).origin;
            return `${domain}/favicon.ico`;
        } catch {
            return 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
        }
    }

    getDomain(url) {
        try {
            return new URL(url).hostname;
        } catch {
            return 'Unknown';
        }
    }

    attachTabEventListeners(type) {
        const container = type === 'active' ? this.activeTabList : this.closedTabList;

        // Tab click to switch to tab (active tabs only)
        if (type === 'active') {
            container.addEventListener('click', async (e) => {
                const tabItem = e.target.closest('.tab-item');
                if (tabItem && !e.target.closest('.detail-btn')) {
                    const tabId = parseInt(tabItem.dataset.tabId);
                    try {
                        const result = await chrome.storage.local.get(`${tabId}`);
                        const tab = result[tabId];
                        if (tab) {
                            await chrome.tabs.update(tab.id, { active: true });
                            await chrome.windows.update(tab.windowId, { focused: true });
                        }
                    } catch (error) {
                        console.error('Error switching to tab:', error);
                    }
                }
            });
        }

        // Detail button clicks
        container.addEventListener('click', (e) => {
            if (e.target.closest('.detail-btn')) {
                const tabId = e.target.closest('.detail-btn').dataset.tabId;
                this.showTabDetails(tabId);
            }
        });
    }

    async showTabDetails(tabId) {
        try {
            const result = await chrome.storage.local.get(tabId);
            const tab = result[tabId];

            if (!tab || !tab.tabTracker || tab.tabTracker.length === 0) {
                this.modalBody.innerHTML = '<div class="empty-state"><h3>No browsing history</h3><p>No URL history found for this tab.</p></div>';
                this.modalTitle.textContent = 'Tab Details';
                this.openModal();
                return;
            }

            this.modalTitle.textContent = truncate(tab.title || 'Tab Details', 30);
            this.modalBody.innerHTML = tab.tabTracker.map(urlData => this.createUrlItem(urlData)).join('');
            this.openModal();

        } catch (error) {
            console.error('Error showing tab details:', error);
        }
    }

    createUrlItem(urlData) {
        const currentTime = new Date().getTime();
        const timeSpent = totalTImeSpentOnVisitedURL(urlData, currentTime);
        const totalTime = urlData.timeDiffInSec || (currentTime - urlData.startTime) / 1000;
        const isCurrentUrl = !urlData.endTime;

        return `
            <div class="url-item">
                <div class="url-header">
                    <a href="${urlData.url}" target="_blank" class="url-title-link" title="${urlData.title} - Click to open">
                        <div class="url-title">
                            ${truncate(urlData.title || 'Untitled Page', 40)}
                        </div>
                    </a>
                </div>

                <div class="url-actions">
                    <a href="${urlData.url}" target="_blank" class="url-link-clickable" title="${urlData.url} - Click to open">
                        <div class="url-link">
                            ${this.getDomain(urlData.url)}
                            <svg class="external-link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                <polyline points="15,3 21,3 21,9"></polyline>
                                <line x1="10" y1="14" x2="21" y2="3"></line>
                            </svg>
                        </div>
                    </a>
                    <button class="copy-url-btn" data-url="${urlData.url}" title="Copy URL to clipboard">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                    </button>
                </div>

                <div class="url-times">
                    <span class="url-time-spent">
                        ${formatTime(timeSpent)} spent
                    </span>
                    <span class="url-time-total">
                        ${formatTime(totalTime)} total ${isCurrentUrl ? '(current)' : ''}
                    </span>
                </div>
            </div>
        `;
    }

    getEmptyState(title, description, type = 'default') {
        const icons = {
            active: `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                    <circle cx="8" cy="12" r="1"></circle>
                    <path d="M12 12h8"></path>
                </svg>
            `,
            history: `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                    <path d="M3 3v5h5"></path>
                    <path d="M12 7v5l4 2"></path>
                </svg>
            `,
            default: `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                    <path d="M7 15h0M7 11h0M11 11h4M11 15h6"></path>
                </svg>
            `
        };

        const tips = {
            active: [
                '💡 Tip: Click on any tab to switch to it instantly',
                '⏱️ Time updates automatically every 5 seconds',
                '🔍 Click "Details" to see URL-specific time breakdown',
                '⌨️ Use arrow keys to navigate, Enter to select'
            ],
            history: [
                '📊 Tip: Your most visited sites will appear here',
                '🗑️ Use "Clear All" to remove browsing history',
                '📈 Track your productivity patterns over time',
                '⌨️ Press 1/A for Active, 2/H for History, T for theme'
            ]
        };

        const currentTips = tips[type] || [];
        const randomTip = currentTips[Math.floor(Math.random() * currentTips.length)] || '';

        return `
            <div class="empty-state">
                ${icons[type] || icons.default}
                <h3>${title}</h3>
                <p>${description}</p>
                ${randomTip ? `<div class="empty-tip">${randomTip}</div>` : ''}
            </div>
        `;
    }

    openModal() {
        this.modal.classList.add('show');
        this.modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    closeModal() {
        this.modal.classList.remove('show');
        setTimeout(() => {
            this.modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }, 200);
    }

    async clearHistory() {
        if (!confirm('Are you sure you want to clear all browsing history? This action cannot be undone.')) {
            return;
        }

        try {
            const result = await chrome.storage.local.get();
            const toRemove = [];

            for (const tabId in result) {
                const tab = result[tabId];
                if (tab.endTime) {
                    toRemove.push(tabId);
                }
            }

            if (toRemove.length > 0) {
                await chrome.storage.local.remove(toRemove);
                this.loadExistingTabs(); // Refresh the display
            }

        } catch (error) {
            console.error('Error clearing history:', error);
        }
    }

    async refreshData() {
        // Smart refresh without full reload
        try {
            await this.loadExistingTabs();
        } catch (error) {
            console.error('Error refreshing data:', error);
        }
    }

    showLoadingState() {
        // Show skeleton screens for both views
        this.activeTabList.innerHTML = this.getSkeletonLoader(3);
        this.closedTabList.innerHTML = this.getSkeletonLoader(2);

        // Show loading stats
        document.getElementById('activeTabs').textContent = '⋯';
        document.getElementById('totalTime').textContent = '⋯';

        // Update session time even during loading
        this.updateSessionTime();
    }

    getSkeletonLoader(count = 3) {
        const skeletons = Array.from({ length: count }, () => `
            <div class="skeleton-item">
                <div class="skeleton-header">
                    <div class="skeleton-title"></div>
                    <div class="skeleton-badge"></div>
                </div>
                <div class="skeleton-url"></div>
                <div class="skeleton-stats">
                    <div class="skeleton-time"></div>
                    <div class="skeleton-time"></div>
                    <div class="skeleton-button"></div>
                </div>
            </div>
        `).join('');

        return `<div class="skeleton-container">${skeletons}</div>`;
    }

    async copyToClipboard(text, button) {
        try {
            await navigator.clipboard.writeText(text);

            // Visual feedback
            const originalHTML = button.innerHTML;
            button.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20,6 9,17 4,12"></polyline>
                </svg>
            `;
            button.classList.add('copied');

            // Reset after 2 seconds
            setTimeout(() => {
                button.innerHTML = originalHTML;
                button.classList.remove('copied');
            }, 2000);

        } catch (error) {
            console.error('Failed to copy URL:', error);

            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);

            // Visual feedback for fallback
            button.style.background = 'var(--success)';
            setTimeout(() => {
                button.style.background = '';
            }, 1000);
        }
    }

    handleKeyboardNavigation(e) {
        // Don't interfere with modal interactions
        if (this.modal.classList.contains('show')) return;

        // Handle keyboard shortcuts
        switch(e.key) {
            case '1':
            case 'a':
            case 'A':
                e.preventDefault();
                this.switchView('active');
                document.getElementById('activeBtn').focus();
                break;

            case '2':
            case 'h':
            case 'H':
                e.preventDefault();
                this.switchView('closed');
                document.getElementById('closedBtn').focus();
                break;

            case 't':
            case 'T':
                if (!e.ctrlKey && !e.metaKey) {
                    e.preventDefault();
                    document.getElementById('themeToggle').click();
                }
                break;

            case 'ArrowUp':
            case 'ArrowDown':
                e.preventDefault();
                this.navigateTabItems(e.key === 'ArrowUp' ? -1 : 1);
                break;

            case 'Enter':
                const focused = document.activeElement;
                if (focused && focused.classList.contains('tab-item')) {
                    e.preventDefault();
                    focused.click();
                }
                break;

            case ' ':
                const focusedSpace = document.activeElement;
                if (focusedSpace && focusedSpace.classList.contains('tab-item')) {
                    e.preventDefault();
                    const detailBtn = focusedSpace.querySelector('.detail-btn');
                    if (detailBtn) detailBtn.click();
                }
                break;
        }
    }

    navigateTabItems(direction) {
        const activeView = document.querySelector('.tab-view.active');
        const tabItems = activeView.querySelectorAll('.tab-item');

        if (tabItems.length === 0) return;

        const currentFocused = document.activeElement;
        let currentIndex = Array.from(tabItems).findIndex(item => item === currentFocused);

        if (currentIndex === -1) {
            // No tab item focused, focus first one
            currentIndex = direction > 0 ? 0 : tabItems.length - 1;
        } else {
            currentIndex += direction;
            if (currentIndex < 0) currentIndex = tabItems.length - 1;
            if (currentIndex >= tabItems.length) currentIndex = 0;
        }

        tabItems[currentIndex].focus();
    }
}

// Auto-refresh data functionality
let tabTracker = null;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    tabTracker = new TabTracker();
});

// Smart refresh when popup becomes visible
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && tabTracker) {
        // Refresh data without full reload
        tabTracker.refreshData();
    }
});

// Auto-refresh every 5 seconds when popup is open
setInterval(() => {
    if (tabTracker && !document.hidden) {
        tabTracker.refreshData();
    }
}, 5000);