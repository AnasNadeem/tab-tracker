export function truncate(str, n){
    return (str.length > n) ? str.slice(0, n-1) + '&hellip;' : str;
};

export function formatTime(timeInSec){
    if(timeInSec>60){
        const timeInMin = Math.round(((timeInSec/60) + Number.EPSILON)*100)/100;
        return timeInMin + ' min';
    }else{
        return Math.round((timeInSec*100) +  Number.EPSILON)/100 + ' sec';
    }
}

export const totalTimeSpent = (tab, currentTime) => {
	const lastTabIndex = tab.tabTracker.length - 1;
	const lastTab = tab.tabTracker[lastTabIndex];
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

export const increaseTbody = (tbody) => {
	if (tbody.scrollHeight > tbody.clientHeight){
		tbody.style.width = 'calc(100% + 1rem)';
	}else{
		tbody.style.width = '100%';
	}
}