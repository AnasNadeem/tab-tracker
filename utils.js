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

export const totalTimeSpent = (tab) => {
	const lastTabIndex = tab.tabTracker.length - 1;
	const lastTab = tab.tabTracker[lastTabIndex];
	if(lastTab.userEndTime){
		return tab.timeSpentInSec;
	}else{
		return tab.timeSpentInSec + (new Date().getTime() - lastTab.userStartTime)/1000;
	}
}