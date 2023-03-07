import { truncate } from "./utils.js";

const activeTbody = document.getElementById('activeTbody');
const closedTbody = document.getElementById('closedTbody');

const existingTabs = () => {
	chrome.storage.local.get().then(result => {
		for (const tabId in result) {
			let tabMap = {};
			let tab = result[tabId];
			if(tab.endTime){
				tab['timeDiff'] = Math.round(((tab.endTime - tab.startTime)/1000)/60);
				const tabRow = displanInTBody(tab);
				closedTbody.innerHTML += tabRow;
			}else{
				chrome.tabs.get(parseInt(tabId)).then( chromeTab => {
					const timeDiffInSec = (new Date().getTime() - tab.startTime)/1000;
					tab['timeDiff'] = Math.round(timeDiffInSec/60);
					tab = {...tab, ...chromeTab};
					tabMap[tabId] = tab;
					chrome.storage.local.set(tabMap);
					const tabRow = displanInTBody(tab);
					activeTbody.innerHTML += tabRow;
				})
			}
		}
	});
}

existingTabs();

const displanInTBody = (tab) => {
	// const pathname = new URL(tab.url);
	const tabId = tab.id;
	return `<tr>
		<td id="${tabId}">
			<a>
				${truncate(tab.title, 20)}
			</a>
		</td>
		<td>${tab.timeDiff} min</td>
	</tr>`
}


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
	activeDiv.style.left = "-400px"
	closedDiv.style.left = "50px"
	toggleBtn.style.left = "120px"
}
function active(){
	activeDiv.style.left = "50px"
	closedDiv.style.left = "400px"
	toggleBtn.style.left = "0px"
}

let clearHistory = document.getElementById("clearHistory");
clearHistory.addEventListener("click", function(){
	chrome.storage.local.get().then((tabs) => {
		for (const tabId in tabs) {
			let tab = tabs[tabId];
			if(tab.endTime){
				chrome.storage.local.remove(tabId);
			}
		}
	});
	location.reload();
})
