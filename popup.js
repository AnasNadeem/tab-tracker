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

        // Close modal on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.classList.contains('show')) {
                this.closeModal();
            }
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
    }

    renderActiveTabs(tabs) {
        if (tabs.length === 0) {
            this.activeTabList.innerHTML = this.getEmptyState('No active tabs', 'Open some browser tabs to start tracking your time.');
            return;
        }

        this.activeTabList.innerHTML = tabs.map(tab => this.createTabItem(tab, true)).join('');
        this.attachTabEventListeners('active');
    }

    renderClosedTabs(tabs) {
        if (tabs.length === 0) {
            this.closedTabList.innerHTML = this.getEmptyState('No browsing history', 'Your closed tabs will appear here once you start browsing.');
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
            <div class="tab-item ${tab.active ? 'active-tab' : ''}" data-tab-id="${tab.id}">
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

    getEmptyState(title, description) {
        return `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                    <path d="M7 15h0M7 11h0M11 11h4M11 15h6"></path>
                </svg>
                <h3>${title}</h3>
                <p>${description}</p>
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
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TabTracker();
});

// Refresh data when popup is opened
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        // Reload data when popup becomes visible
        setTimeout(() => {
            window.location.reload();
        }, 100);
    }
});