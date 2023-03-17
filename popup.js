import { truncate } from "./utils.js";

const activeTbody = document.getElementById('activeTbody');
const closedTbody = document.getElementById('closedTbody');
const modalBody = document.getElementById('modalBody');

const existingTabs = () => {
	chrome.storage.local.get().then(result => {
		for (const tabId in result) {
			let tabMap = {};
			let tab = result[tabId];
			if(tab.endTime){
				tab['timeDiff'] = Math.round(((tab.endTime - tab.startTime)/1000)/60);
				const tabRow = displayInTbody(tab);
				closedTbody.innerHTML += tabRow;
			}else{
				chrome.tabs.get(parseInt(tabId))
				.then( chromeTab => {
					const timeDiffInSec = (new Date().getTime() - tab.startTime)/1000;
					tab['timeDiff'] = Math.round(timeDiffInSec/60);
					tab = {...tab, ...chromeTab};
					tabMap[tabId] = tab;
					chrome.storage.local.set(tabMap);
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
	td1.innerHTML = truncate(tab.title, 14);

	const td2 = document.createElement('td');
	td2.innerHTML = tab.timeDiff + " min";
	td2.innerHTML += `<span id="modalBtn">
		<i class="fa fa-info-circle" aria-hidden="true"></i>
	</span>`;
	tr.appendChild(td1);
	tr.appendChild(td2);

	return tr.outerHTML;
}

const displayInModalBody = (tab) => {
	const tr = document.createElement('tr');
	const td1 = document.createElement('td');
	td1.title = tab.title;
	td1.innerHTML = truncate(tab.title, 14);

	const td2 = document.createElement('td');
	if(tab.timeDiffInSec){
		td2.innerHTML = tab.timeDiffInSec + " sec";
	}else{
		const endTime = new Date().getTime();
		const timeDiffInSec = (endTime - tab.startTime)/1000;
		td2.innerHTML = timeDiffInSec + ' sec (current)';
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
		const currentTabId = e.target.parentElement.parentElement.parentElement.id;
		chrome.storage.local.get(currentTabId, (result) => {
			const currentTab = result[currentTabId];
			const tabTracker = currentTab.tabTracker;
			console.log(tabTracker);
			for (const visitedTab of tabTracker){
				const visitedTabRow = displayInModalBody(visitedTab);
				modalBody.innerHTML += visitedTabRow;
			}
			modal.style.display = "block";
		});
	}
	if(e.target.nodeName === "TD"){
		const tabId = e.target.parentElement.id;
		chrome.storage.local.get(tabId, (result) => {
			const tab = result[tabId];
			openTab(tab);
		});
	}
});
let activeBtn = document.getElementById("activeBtn")
let closeBtn = document.getElementById("closeBtn")

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

let clearHistory = document.getElementById("clearHistory");
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


// Modal
let modal = document.getElementById("myModal");
let modalBtn = document.getElementById("modalBtn");
let modalClose = document.getElementsByClassName("modal-close")[0];

modalBtn.onclick = function() {
  modal.style.display = "block";
}

modalClose.onclick = function() {
  modal.style.display = "none";
}

document.onclick = function(event) {
	if (event.target == modal) {
		modal.style.display = "none";
  }
}
