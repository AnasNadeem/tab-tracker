export function truncate(str, n){
    return (str.length > n) ? str.slice(0, n-1) + '&hellip;' : str;
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
	const lastTabIndex = tab.tabTracker.length - 1;
	const lastTab = tab.tabTracker[lastTabIndex];
	if (lastTab === undefined){
		return tab.timeSpentInSec;
	}
	if((lastTab.userStartTime && lastTab.userEndTime) || (!lastTab.userStartTime && !lastTab.userEndTime)){
		return tab.timeSpentInSec;
	}else{
		return tab.timeSpentInSec + (currentTime - lastTab.userStartTime)/1000;
	}
}

export const totalTImeSpentOnVisitedURL = (visitedUrlInTab, currentTime) => {
    if((visitedUrlInTab.userStartTime && visitedUrlInTab.userEndTime) || (!visitedUrlInTab.userStartTime && !visitedUrlInTab.userEndTime)){
		return visitedUrlInTab.timeSpentInSec;
	}else{
		return visitedUrlInTab.timeSpentInSec + (currentTime - visitedUrlInTab.userStartTime)/1000;
	}
}

