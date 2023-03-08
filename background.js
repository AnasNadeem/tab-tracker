let tabMap = {};

chrome.tabs.onCreated.addListener((tab) => {
	const time = new Date().getTime();
	tabMap[tab.id] = {
		startTime: time,
		endTime: null,
		title: tab.title,
		url: tab.url
	}
	chrome.storage.local.set(tabMap)
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
