import { truncate } from "./utils.js";

const tabBody = document.getElementById('tabBody');

const existingTabs = () => {
	chrome.tabs.query({currentWindow: true}, (tabs) => {
		for (const tab of tabs) {
			const tabIdString = `${tab.id}`;
			chrome.storage.local.get(tabIdString).then(result => {
				if(result[tabIdString].endTime){
					tab['timeDiff'] = (result[tabIdString].endTime - result[tabIdString].startTime)/1000;
				}else{
					tab['timeDiff'] = (new Date().getTime() - result[tabIdString].startTime)/1000;
				}
				tab['timeDiff'] = Math.round(tab['timeDiff']/60);
				displanInTabBody(tab);
			});
		}
	});
}
existingTabs();

const displanInTabBody = (tab) => {
	// const pathname = new URL(tab.url);
	const tabId = tab.id;
	const title = truncate(tab.title, 30);
	console.log(title)
	const tabRow = `<tr>
		<td id="${tabId}">
			<a>
				${truncate(tab.title, 20)}
			</a>
		</td>
		<td>${tab.active}</td>
		<td>${tab.timeDiff} min</td>
	</tr>`
  	tabBody.innerHTML += tabRow;
}
