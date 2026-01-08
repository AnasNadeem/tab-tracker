// Debounce timers for preventing excessive storage writes
let activatedDebounceTimer = null;
let updateDebounceTimers = {};

chrome.tabs.onCreated.addListener((tab) => {
	let tabMap = {};
	const time = new Date().getTime();
	tabMap[tab.id] = {
		id: tab.id,
		startTime: time,
		endTime: null,
		title: tab.title,
		url: tab.url,
		active: tab.active,
		timeSpentInSec: 0,
		tabTracker: []
	}
	chrome.storage.local.set(tabMap)
});

chrome.tabs.onActivated.addListener((activeInfo) => {
	const tabIdString = `${activeInfo.tabId}`;
	const currentTime = new Date().getTime();
	
	// Debounce to prevent rapid-fire storage writes during quick tab switches
	if (activatedDebounceTimer) {
		clearTimeout(activatedDebounceTimer);
	}
	
	activatedDebounceTimer = setTimeout(() => {
		chrome.storage.local.get(tabIdString)
		.then(result => {
			if (!result || !result[tabIdString]) {
				return;
			}
			result[tabIdString]['active'] = true;
			chrome.storage.local.set(result);
			if(result[tabIdString]['tabTracker'].length === 0){
				return;
			}
			const lastTabIndex = result[tabIdString]['tabTracker'].length - 1;
			result[tabIdString]['tabTracker'][lastTabIndex]['userStartTime'] = currentTime;
			result[tabIdString]['tabTracker'][lastTabIndex]['userEndTime'] = null;
			chrome.storage.local.set(result);
		})
		.catch(error => console.log(error));
		updateOtherTabs(tabIdString, currentTime);
	}, 100);
});

const updateOtherTabs = (activeTabId, currentTime) => {
	chrome.storage.local.get().then((result) => {
		if (!result){
			return;
		}
		for (const tabId in result) {
			if (tabId === activeTabId){
				continue;
			}

			if (!result[tabId]['active']){
				continue;
			}

			chrome.tabs.get(parseInt(tabId))
			.then( chromeTab => {
				let tabMap = {};
				tabMap[tabId] = result[tabId];
				tabMap[tabId]['active'] = chromeTab.active;
				chrome.storage.local.set(tabMap);

				if(tabMap[tabId]['tabTracker'].length === 0){
					return;
				}
				const lastTabIndex = tabMap[tabId]['tabTracker'].length - 1;
				const userStartTime = tabMap[tabId]['tabTracker'][lastTabIndex]['userStartTime'];
				const userEndTime = tabMap[tabId]['tabTracker'][lastTabIndex]['userEndTime'];
				if(userEndTime){
					return;
				}
				// FIX: Add null check for userStartTime to prevent NaN
				if (!userStartTime) {
					return;
				}
				const timeSpentInSec = (currentTime - userStartTime)/1000;
				tabMap[tabId]['tabTracker'][lastTabIndex]['userEndTime'] = currentTime;
				// FIX: Changed += to = to prevent double-counting
				tabMap[tabId]['tabTracker'][lastTabIndex]['timeSpentInSec'] = (tabMap[tabId]['tabTracker'][lastTabIndex]['timeSpentInSec'] || 0) + timeSpentInSec;
				tabMap[tabId]['timeSpentInSec'] = (tabMap[tabId]['timeSpentInSec'] || 0) + timeSpentInSec;
				chrome.storage.local.set(tabMap);
			})
			.catch(error => console.log(error));
		}
	});
};

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
	const tabIdString = `${tabId}`;
	if(changeInfo.status !== 'complete'){
		return;
	}
	
	// Debounce to prevent excessive writes during page loads
	if (updateDebounceTimers[tabIdString]) {
		clearTimeout(updateDebounceTimers[tabIdString]);
	}
	
	updateDebounceTimers[tabIdString] = setTimeout(() => {
		chrome.storage.local.get(tabIdString)
		.then(result => {
			if (!result || !result[tabIdString]) {
				return;
			}
			result[tabIdString]['title'] = tab.title;
			result[tabIdString]['url'] = tab.url;
			result[tabIdString]['active'] = tab.active;
			const currentTime = new Date().getTime();

			// Update the last tabTracker
			if(result[tabIdString]['tabTracker'].length > 0){
				const lastTabIndex = result[tabIdString]['tabTracker'].length - 1;
				// Skip if the current tab url is same as the last tabTracker url
				if(result[tabIdString]['tabTracker'][lastTabIndex]['url'] === tab.url){
					return;
				}
				const startTime = result[tabIdString]['tabTracker'][lastTabIndex]['startTime'];
				const userStartTime = result[tabIdString]['tabTracker'][lastTabIndex]['userStartTime'];
				const timeDiffInSec = (currentTime - startTime)/1000;
				// FIX: Add null check for userStartTime and only calculate if tab was active
				let timeSpentInSec = 0;
				if (userStartTime) {
					timeSpentInSec = (currentTime - userStartTime)/1000;
				}
				result[tabIdString]['tabTracker'][lastTabIndex]['endTime'] = currentTime;
				result[tabIdString]['tabTracker'][lastTabIndex]['userEndTime'] = userStartTime ? currentTime : null;
				// FIX: Changed += to = to prevent double-counting
				result[tabIdString]['tabTracker'][lastTabIndex]['timeSpentInSec'] = (result[tabIdString]['tabTracker'][lastTabIndex]['timeSpentInSec'] || 0) + timeSpentInSec;
				result[tabIdString]['tabTracker'][lastTabIndex]['timeDiffInSec'] = timeDiffInSec;
				result[tabIdString]['timeSpentInSec'] = (result[tabIdString]['timeSpentInSec'] || 0) + timeSpentInSec;
			}

		// Add a new tabTracker
		result[tabIdString]['tabTracker'].push({
			startTime: currentTime,
			endTime: null,
			...(tab.active ? {userStartTime: currentTime}: {userStartTime: null}),
			userEndTime: null,
			timeSpentInSec: 0,
			title: tab.title,
			url: tab.url
		});
		chrome.storage.local.set(result);
	})
	.catch(error => console.log(error));
	}, 200);
});

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
	const tabIdString = `${tabId}`;
	chrome.storage.local.get(tabIdString).then(result => {
		if (!result){
			return;
		}
		let tabMap = {};
		tabMap[tabId] = result[tabIdString]
		const currentTime = new Date().getTime();
		const wasTabActive = result[tabIdString]['active'];
		tabMap[tabId]['endTime'] = currentTime;
		tabMap[tabId]['active'] = false;
		chrome.storage.local.set(tabMap);

		// Updating the last tabTracker
		const tabTracker = result[tabIdString]['tabTracker']
		if(tabTracker.length === 0){
			return;
		}
		if(tabTracker.length > 0){
			const lastTabIndex = tabTracker.length - 1;
			const lastTabStartTime = tabTracker[lastTabIndex]['startTime'];
			tabMap[tabId]['tabTracker'][lastTabIndex]['endTime'] = currentTime;
			const timeDiffInSec = (currentTime - lastTabStartTime)/1000;
			tabMap[tabId]['tabTracker'][lastTabIndex]['timeDiffInSec'] = timeDiffInSec;

			const lastTabUserStartTime = tabTracker[lastTabIndex]['userStartTime'];
			const lastTabUserEndTime = tabTracker[lastTabIndex]['userEndTime'];
			tabMap[tabId]['tabTracker'][lastTabIndex]['userEndTime'] = wasTabActive ? currentTime : lastTabUserEndTime;
			// FIX: Add null check for userStartTime and only calculate if tab was active
			let timeSpentInSec = 0;
			if (lastTabUserStartTime && tabMap[tabId]['tabTracker'][lastTabIndex]['userEndTime']) {
				timeSpentInSec = (tabMap[tabId]['tabTracker'][lastTabIndex]['userEndTime'] - lastTabUserStartTime)/1000;
			}
			// FIX: Changed += to = to prevent double-counting
			tabMap[tabId]['tabTracker'][lastTabIndex]['timeSpentInSec'] = (tabMap[tabId]['tabTracker'][lastTabIndex]['timeSpentInSec'] || 0) + timeSpentInSec;
			tabMap[tabId]['timeSpentInSec'] = (tabMap[tabId]['timeSpentInSec'] || 0) + timeSpentInSec;
			chrome.storage.local.set(tabMap);
		}
	});
});

chrome.windows.onRemoved.addListener((windowId) => {
	chrome.storage.local.get().then((result) => {
		if (!result){
			return;
		}
		for (const tabId in result) {
			if (tabId.windowId !== windowId){
				continue;
			}
			const time = new Date().getTime();
			if (result[tabId]['endTime']){
				continue;
			}
			result[tabId]['endTime'] = time;
			result[tabId]['active'] = false;
			chrome.storage.local.set(result);
		}
	});
});

// Cleanup old entries to prevent unbounded storage growth
function cleanupOldEntries() {
	const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
	const currentTime = new Date().getTime();
	
	chrome.storage.local.get().then((result) => {
		if (!result) {
			return;
		}
		
		const toRemove = [];
		for (const tabId in result) {
			const tab = result[tabId];
			// Remove closed tabs older than 7 days
			if (tab.endTime && (currentTime - tab.endTime) > SEVEN_DAYS_MS) {
				toRemove.push(tabId);
			}
			// Also cleanup tabTracker entries older than 7 days
			else if (tab.tabTracker && tab.tabTracker.length > 0) {
				tab.tabTracker = tab.tabTracker.filter(tracker => {
					return !tracker.endTime || (currentTime - tracker.endTime) <= SEVEN_DAYS_MS;
				});
				// Update the tab with cleaned tracker
				let updateMap = {};
				updateMap[tabId] = tab;
				chrome.storage.local.set(updateMap);
			}
		}
		
		if (toRemove.length > 0) {
			chrome.storage.local.remove(toRemove);
			console.log(`Cleaned up ${toRemove.length} old tab entries`);
		}
	}).catch(error => console.log('Cleanup error:', error));
}

// Run cleanup daily
setInterval(cleanupOldEntries, 24 * 60 * 60 * 1000);
// Also run cleanup on extension load
cleanupOldEntries();
