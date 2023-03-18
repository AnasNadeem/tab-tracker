import { truncate, formatTime } from "./utils.js";

const activeTbody = document.getElementById('activeTbody');
const closedTbody = document.getElementById('closedTbody');
const modal = document.getElementById("myModal");
const modalBody = document.getElementById('modalBody');
const modelContent = document.getElementsByClassName("modal-content")[0];

const existingTabs = () => {
	chrome.storage.local.get().then(result => {
		for (const tabId in result) {
			let tabMap = {};
			let tab = result[tabId];
			if(tab.endTime){
				tab['timeDiff'] = Math.round(((tab.endTime - tab.startTime)/1000)/60);
				closedTbody.innerHTML += displayInTbody(tab);;
			}else{
				chrome.tabs.get(parseInt(tabId))
				.then( chromeTab => {
					const timeDiffInSec = (new Date().getTime() - tab.startTime)/1000;
					tab['title'] = chromeTab.title;
					tab['url'] = chromeTab.url;
					tab['active'] = chromeTab.active;
					// tab = {...tab, ...chromeTab};
					tabMap[tabId] = tab;
					chrome.storage.local.set(tabMap);
					tab['timeDiff'] = Math.round(timeDiffInSec/60);
					const tabRow = displayInTbody(tab);
					activeTbody.innerHTML += tabRow;
				})
				.catch( error => {
					chrome.storage.local.remove(tabId)
					.then(() => console.log('Removed', tabId));
				});
			}
		}
	});
}

existingTabs();

const displayInTbody = (tab) => {
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
	td2.innerHTML = tab.timeDiff + " min";
	td2.innerHTML += `<span id="modalBtn">
		<i class="fa fa-info-circle" title="Show time breakdown" aria-hidden="true"></i>
	</span>`;
	tr.appendChild(td1);
	tr.appendChild(td2);

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

	const td2 = document.createElement('td');
	if(visitedUrlInTab.timeDiffInSec){
		td2.innerHTML = formatTime(visitedUrlInTab.timeDiffInSec);
	}else{
		const endTime = new Date().getTime();
		const timeDiffInSec = (endTime - visitedUrlInTab.startTime)/1000;
		td2.innerHTML = formatTime(timeDiffInSec) + ' (current)';
	}
	tr.appendChild(td1);
	tr.appendChild(td2);

	return tr.outerHTML;
}

const openTab = (tab) => {
	chrome.tabs.update(tab.id, { active: true });
    chrome.windows.update(tab.windowId, { focused: true });
}

activeTbody.addEventListener("click", (e) => {
	if (e.target.nodeName === "I") {
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
	if (e.target.nodeName === "I") {
		openModelOnClick(e);
	}
});

const openModelOnClick = (e) => {
	modal.style.display = "block";
	const currentTabId = e.target.parentElement.parentElement.parentElement.id;
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
let toggleBtn = document.getElementById("toggleBtn")

function closed(){
	activeDiv.style = "display: none";
	closedDiv.style = "display: block";
	closedDiv.style.left = "50px";
	toggleBtn.style.left = "120px"
}
function active(){
	closedDiv.style = "display: none";
	activeDiv.style = "display: block";
	toggleBtn.style.left = "0px"
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
