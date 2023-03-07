let tabTime = {};

chrome.tabs.onCreated.addListener((tab) => {
	const time = new Date().getTime();
	tabTime[tab.id] = {startTime: time, endTime: null}
	chrome.storage.local.set(tabTime)
});

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
	const tabIdString = `${tabId}`;
	chrome.storage.local.get(tabIdString, (result) => {
		const time = new Date().getTime();
		result[tabIdString]['endTime'] = time;
		chrome.storage.local.set(result)
	});
});
