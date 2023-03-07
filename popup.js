import { truncate } from "./utils.js";

const tabBody = document.getElementById('tabBody');

const existingTabs = () => {
	chrome.storage.local.get().then(result => {
		for (const tabId in result) {
			let tabMap = {};
			let tab = result[tabId];
			if(tab.endTime){
				tab['timeDiff'] = Math.round(((tab.endTime - tab.startTime)/1000)/60);
				displanInTabBody(tab);
			}else{
				chrome.tabs.get(parseInt(tabId)).then( chromeTab => {
					const timeDiffInSec = (new Date().getTime() - tab.startTime)/1000;
					tab['timeDiff'] = Math.round(timeDiffInSec/60);
					tab = {...tab, ...chromeTab};
					tabMap[tabId] = tab;
					chrome.storage.local.set(tabMap);
					displanInTabBody(tab);
				})
			}
		}
	});
}

existingTabs();

const displanInTabBody = (tab) => {
	// const pathname = new URL(tab.url);
	const tabId = tab.id;
	const tabRow = `<tr>
		<td id="${tabId}">
			<a>
				${truncate(tab.title, 20)}
			</a>
		</td>
		<td>${tab.timeDiff} min</td>
	</tr>`
  	tabBody.innerHTML += tabRow;
}
