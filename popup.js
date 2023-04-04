import { truncate, formatTime, totalTimeSpent, totalTImeSpentOnVisitedURL, increaseTbody } from "./utils.js";

const activeTbody = document.getElementById('activeTbody');
const closedTbody = document.getElementById('closedTbody');
const modal = document.getElementById("myModal");
const modalBody = document.getElementById('modalBody');

const existingTabs = () => {
	chrome.storage.local.get().then(result => {
		for (const tabId in result) {
			let tabMap = {};
			let tab = result[tabId];
			if(tab['endTime'] !== null){
				tab['timeDiff'] = Math.round((tab.endTime - tab.startTime)/1000);
				closedTbody.innerHTML += displayInTbody(tab);;
			}else{
				chrome.tabs.get(parseInt(tabId))
				.then( chromeTab => {
					const currentTime = new Date().getTime();
					tab['title'] = chromeTab.title;
					tab['url'] = chromeTab.url;
					tab['active'] = chromeTab.active;
					// tab = {...tab, ...chromeTab};
					tabMap[tabId] = tab;
					chrome.storage.local.set(tabMap);
					tab['timeDiff'] = (currentTime- tab.startTime)/1000;;
					const tabRow = displayInTbody(tab, currentTime);
					activeTbody.innerHTML += tabRow;
				})
				.catch( error => {
					chrome.storage.local.remove(tabId)
					.then(() => console.log('Removed', tabId));
				});
			}
		}
	});
	increaseTbody(activeTbody);
}

existingTabs();

const displayInTbody = (tab, currentTime) => {
	const tabId = tab.id;
	const tr = document.createElement('tr');
	tr.id = tabId;

	const td1 = document.createElement('td');
	td1.title = tab.title;
	td1.innerHTML = `
		<a class="tab-${tab.active}" href="${tab.url}" title="${tab.title}">
			${truncate(tab.title, 14)}
		</a>
	`;

	const td2 = document.createElement('td');
	td2.innerHTML = formatTime(totalTimeSpent(tab, currentTime));

	const td3 = document.createElement('td');
	// td3.className = 'time-td';
	td3.innerHTML = formatTime(tab.timeDiff);
	td3.innerHTML += `<img src="images/info_icon.png" class="info-icon" title="Show time breakdown" />`;

	tr.appendChild(td1);
	tr.appendChild(td2);
	tr.appendChild(td3);

	return tr.outerHTML;
}

const displayInModalBody = (visitedUrlInTab) => {
	const tr = document.createElement('tr');
	const td1 = document.createElement('td');
	td1.title = visitedUrlInTab.title;
	td1.innerHTML = `
		<a class="tab-false" href="${visitedUrlInTab.url}" title="${visitedUrlInTab.url}">
			${truncate(visitedUrlInTab.title, 14)}
		</a>
	`;

	const currentTime = new Date().getTime();
	const td2 = document.createElement('td');
	td2.innerHTML = formatTime(totalTImeSpentOnVisitedURL(visitedUrlInTab, currentTime));

	const td3 = document.createElement('td');
	let td2TimeText = '';
	if(visitedUrlInTab.timeDiffInSec){
		td2TimeText += formatTime(visitedUrlInTab.timeDiffInSec);
	}else{
		const timeDiffInSec = (currentTime - visitedUrlInTab.startTime)/1000;
		td2TimeText += formatTime(timeDiffInSec) + ' (current)';
	}
	td3.innerHTML = td2TimeText;

	tr.appendChild(td1);
	tr.appendChild(td2);
	tr.appendChild(td3);

	return tr.outerHTML;
}

const openTab = (tab) => {
	chrome.tabs.update(tab.id, { active: true });
    chrome.windows.update(tab.windowId, { focused: true });
}

activeTbody.addEventListener("click", (e) => {
	if (e.target.nodeName === "IMG") {
		openModelOnClick(e);
	}
	if(e.target.nodeName === "A"){
		const tabId = e.target.parentElement.parentElement.id;
		chrome.storage.local.get(tabId, (result) => {
			const tab = result[tabId];
			openTab(tab);
		});
	}
});

closedTbody.addEventListener("click", (e) => {
	if (e.target.nodeName === "IMG") {
		openModelOnClick(e);
	}
});

const openModelOnClick = (e) => {
	modal.style.display = "block";
	const currentTabId = e.target.parentElement.parentElement.id;
	chrome.storage.local.get(currentTabId, (result) => {
		const currentTab = result[currentTabId];
		const tabTracker = currentTab.tabTracker;
		modalBody.innerHTML = '';
		if(tabTracker.length===0){
			modalBody.innerHTML = '<h2>No history found</h2>';
			return;
		}
		for (const visitedUrlInTab of tabTracker){
			modalBody.innerHTML += displayInModalBody(visitedUrlInTab);
		}
		increaseTbody(modalBody);
	});
};

const activeBtn = document.getElementById('activeBtn');
const closeBtn = document.getElementById("closeBtn")

activeBtn.addEventListener("click", function(){
	active()
})

closeBtn.addEventListener("click", function(){
	closed()
})

let activeDiv = document.getElementById("active")
let closedDiv = document.getElementById("closed")
let clearHistoryBtn = document.getElementById("clearHistoryBtn")
let toggleBtn = document.getElementById("toggleBtn")

function closed(){
	activeDiv.style = "display: none";
	closedDiv.style = "display: block";
	clearHistoryBtn.style = "display: block";
	toggleBtn.style.left = "120px"
	increaseTbody(closedTbody);
}
function active(){
	closedDiv.style = "display: none";
	clearHistoryBtn.style = "display: none";
	activeDiv.style = "display: block";
	toggleBtn.style.left = "0px";
	increaseTbody(activeTbody);
}

const clearHistory = document.getElementById("clearHistory");
clearHistory.addEventListener("click", function(){
	chrome.storage.local.get().then((tabs) => {
		for (const tabId in tabs) {
			let tab = tabs[tabId];
			if(tab.endTime){
				chrome.storage.local.remove(tabId)
				.then(() => console.log('Removed', tabId));
			}
		}
	});
	location.reload();
})


const modalClose = document.getElementsByClassName("modal-close")[0];

modalClose.onclick = function() {
  modal.style.display = "none";
}

document.onclick = function(event) {
	if (event.target == modal) {
		modal.style.display = "none";
  }
}
