const tabBody = document.getElementById('tabBody');
// const tabs = chrome.tabs.query({
//   currentWindow: true, 
// });

const existingTabs = () => {
	chrome.tabs.query({currentWindow: true}, (tabs) => {
		for (const tab of tabs) {
			console.log(tab);
			displanInTabBody(tab);
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
				${tab.title}
			</a>
		</td>
		<td>${tab.active}</td>
		<td></td>
	</tr>`
  	tabBody.innerHTML += tabRow;
}
