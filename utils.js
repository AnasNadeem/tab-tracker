export function truncate(str, n) {
    return (str.length > n) ? str.slice(0, n - 1) + '&hellip;' : str;
};

export function formatTime(timeInSec) {
    if (!timeInSec || timeInSec < 0) return '0s';

    const hours = Math.floor(timeInSec / 3600);
    const minutes = Math.floor((timeInSec % 3600) / 60);
    const seconds = Math.floor(timeInSec % 60);

    if (hours > 0) {
        if (minutes > 0) return `${hours}h ${minutes}m`;
        return `${hours}h`;
    }

    if (minutes > 0) {
        if (seconds > 0 && minutes < 10) return `${minutes}m ${seconds}s`;
        return `${minutes}m`;
    }

    return `${seconds}s`;
}

export const totalTimeSpent = (tab, currentTime) => {
    // FIX: Add defensive checks to prevent NaN
    if (!tab) {
        return 0;
    }

    const timeSpent = tab.timeSpentInSec || 0;

    if (!currentTime || !tab.tabTracker || !Array.isArray(tab.tabTracker) || tab.tabTracker.length === 0) {
        return timeSpent;
    }

    const lastTab = tab.tabTracker[tab.tabTracker.length - 1];

    // If tab is currently active, add time since userStartTime
    if (lastTab && lastTab.userStartTime && !lastTab.userEndTime) {
        return timeSpent + (currentTime - lastTab.userStartTime) / 1000;
    }

    return timeSpent;
}

export const totalTImeSpentOnVisitedURL = (visitedUrlInTab, currentTime) => {
    // FIX: Add defensive checks to prevent NaN
    if (!visitedUrlInTab) {
        return 0;
    }

    const timeSpent = visitedUrlInTab.timeSpentInSec || 0;

    if (currentTime && visitedUrlInTab.userStartTime && !visitedUrlInTab.userEndTime) {
        return timeSpent + (currentTime - visitedUrlInTab.userStartTime) / 1000;
    }

    return timeSpent;
}

