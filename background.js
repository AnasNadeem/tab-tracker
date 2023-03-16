let tabMap = {};

chrome.tabs.onCreated.addListener((tab) => {
	const time = new Date().getTime();
	tabMap[tab.id] = {
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
		if (result[tabIdString]){
			result[tabIdString]['title'] = tab.title;
			result[tabIdString]['url'] = tab.url;

			// Update the last tabTracker
			if(result[tabIdString]['tabTracker'].length > 0){
				const lastTabIndex = result[tabIdString]['tabTracker'].length - 1;
				result[tabIdString]['tabTracker'][lastTabIndex]['endTime'] = new Date().getTime();
				const endTime = result[tabIdString]['tabTracker'][lastTabIndex]['endTime'];
				const startTime = result[tabIdString]['tabTracker'][lastTabIndex]['startTime'];
				const timeDiffInSec = (endTime - startTime)/1000;
				result[tabIdString]['tabTracker'][lastTabIndex]['timeDiff'] = timeDiffInSec;
			}
			// Add a new tabTracker
			result[tabIdString]['tabTracker'].push({
				startTime: new Date().getTime(),
				endTime: null,
				title: tab.title,
				url: tab.url
			});
			chrome.storage.local.set(result);
		}
	})
	.catch(error => console.log(error));
});

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
	const tabIdString = `${tabId}`;
	chrome.storage.local.get(tabIdString, (result) => {
		const time = new Date().getTime();
		result[tabIdString]['endTime'] = time;
		chrome.storage.local.set(result);
	});
});

chrome.windows.onRemoved.addListener((windowId) => {
	chrome.storage.local.get().then((result) => {
		for (const tabId in result) {
			const time = new Date().getTime();
			if (result[tabId]['endTime']){
				continue;
			}
			result[tabId]['endTime'] = time;
			chrome.storage.local.set(result);
		}
	});
});
