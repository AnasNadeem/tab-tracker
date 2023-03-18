
chrome.tabs.onCreated.addListener((tab) => {
	let tabMap = {};
	const time = new Date().getTime();
	tabMap[tab.id] = {
		id: tab.id,
		startTime: time,
		endTime: null,
		title: tab.title,
		url: tab.url,
		tabTracker: []
	}
	chrome.storage.local.set(tabMap)
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
	const tabIdString = `${tabId}`;
	if(changeInfo.status !== 'complete'){
		return;
	}
	chrome.storage.local.get(tabIdString)
	.then(result => {
		result[tabIdString]['title'] = tab.title;
		result[tabIdString]['url'] = tab.url;
		result[tabIdString]['active'] = tab.active;
		// Update the last tabTracker
		if(result[tabIdString]['tabTracker'].length > 0){
			const lastTabIndex = result[tabIdString]['tabTracker'].length - 1;
			// Skip if the current tab url is same as the last tabTracker url
			if(result[tabIdString]['tabTracker'][lastTabIndex]['url'] === tab.url){
				return;
			}
			result[tabIdString]['tabTracker'][lastTabIndex]['endTime'] = new Date().getTime();
			const endTime = result[tabIdString]['tabTracker'][lastTabIndex]['endTime'];
			const startTime = result[tabIdString]['tabTracker'][lastTabIndex]['startTime'];
			const timeDiffInSec = (endTime - startTime)/1000;
			result[tabIdString]['tabTracker'][lastTabIndex]['timeDiffInSec'] = timeDiffInSec;
		}
		// Add a new tabTracker
		result[tabIdString]['tabTracker'].push({
			startTime: new Date().getTime(),
			endTime: null,
			title: tab.title,
			url: tab.url
		});
		chrome.storage.local.set(result);
	})
	.catch(error => console.log(error));
});

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
	const tabIdString = `${tabId}`;
	chrome.storage.local.get(tabIdString, (result) => {
		const time = new Date().getTime();
		result[tabIdString]['endTime'] = time;
		result[tabIdString]['active'] = false;
		// Updating the last tabTracker
		const tabTracker = result[tabIdString]['tabTracker']
		if(tabTracker.length > 0){
			result[tabIdString]['tabTracker'][tabTracker.length - 1]['endTime'] = time;
			const lastTabStartTime = tabTracker[tabTracker.length - 1]['startTime'];
			const timeDiffInSec = (time - lastTabStartTime)/1000;
			result[tabIdString]['tabTracker'][tabTracker.length - 1]['timeDiffInSec'] = timeDiffInSec;
		}
		chrome.storage.local.set(result);
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
