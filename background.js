let popupId = null;
let shouldClosePopup = false;
let popupJustOpened = false;
let openerTabId = null; // To track the ID of the tab that opened the popup

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  let windowInfo = request.windowInfo;

  // Calculate the dimensions and position for the centered popup
  const popupWidth = Math.round(windowInfo.outerWidth * 0.8); // 80% of the original window width
  const popupHeight = Math.round(windowInfo.outerHeight * 0.8); // 80% of the original window height
  const left = windowInfo.screenX + (windowInfo.outerWidth - popupWidth) / 2;
  const top = windowInfo.screenY + (windowInfo.outerHeight - popupHeight) / 2 + 50;

  chrome.windows.create({
    url: request.url,
    type: 'popup',
    width: popupWidth,
    height: popupHeight,
    left: Math.round(left),
    top: Math.round(top)
  }, (window) => {
    popupId = window.id;
    openerTabId = sender.tab.id;

    // Send message to content script to blur the page
    chrome.tabs.sendMessage(openerTabId, { action: "blurPage" });
    
    popupJustOpened = true;
    setTimeout(() => {
      popupJustOpened = false;
      shouldClosePopup = true;
    }, 1000); // Delay of 1000 ms
  });
});

chrome.windows.onFocusChanged.addListener(focusedWindowId => {
  if (focusedWindowId === chrome.windows.WINDOW_ID_NONE) {
    return; // No window is currently focused
  }

  chrome.tabs.get(openerTabId, (tab) => {
    if (chrome.runtime.lastError || !tab) {
      return;
    }

    if (tab.windowId === focusedWindowId && popupId !== null && shouldClosePopup && !popupJustOpened) {
      chrome.windows.remove(popupId);
      popupId = null;
      shouldClosePopup = false;
      openerTabId = null;

      // Send message to content script to unblur the page
      chrome.tabs.sendMessage(tab.id, { action: "unblurPage" });
    }
  });
});
