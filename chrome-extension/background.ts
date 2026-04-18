chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "save-to-mymind",
    title: "Save to MyMind",
    contexts: ["page", "selection", "image", "link"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "save-to-mymind") {
    if (info.pageUrl) {
      // Just save the URL for now as it’s simple, or inject a content script
      chrome.storage.local.get(['token'], (result) => {
        if (result.token) {
          fetch('http://localhost:3000/api/items/create', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${result.token}`
            },
            body: JSON.stringify({
              url: info.linkUrl || info.srcUrl || info.pageUrl,
              text: info.selectionText || '',
              type: info.selectionText ? 'note' : (info.srcUrl ? 'image' : 'article'),
              title: info.selectionText ? 'Clipped Text' : tab?.title || 'Saved Item'
            })
          }).then((res) => res.json())
            .then(() => {
              chrome.notifications.create({
                type: 'basic',
                iconUrl: 'icons/icon48.png',
                title: 'Saved to MyMind',
                message: `Successfully saved ${tab?.title || 'item'}`
              });
            }).catch(console.error);
        } else {
          chrome.tabs.create({ url: 'http://localhost:3000/dashboard' }); // to prompt login theoretically
        }
      });
    }
  }
});