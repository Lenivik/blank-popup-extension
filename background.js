let popupId = null;
let shouldClosePopup = false;
let popupJustOpened = false;
let openerTabId = null; // To track the ID of the tab that opened the popup
let popupCreationTime = 0; // To track when the popup was created

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  let windowInfo = request.windowInfo;

  // Calculate the dimensions and position for the centered popup
  const popupWidth = Math.round(windowInfo.outerWidth * 0.8);
  const popupHeight = Math.round(windowInfo.outerHeight * 0.8);
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
    popupCreationTime = Date.now();

    // Send message to content script to blur the page
    chrome.tabs.sendMessage(openerTabId, { action: "blurPage" });

    popupJustOpened = true;
    setTimeout(() => {
      popupJustOpened = false;
      shouldClosePopup = true;
    }, 1000); // Delay of 1000 ms
  });
});

chrome.tabs.onActivated.addListener(activeInfo => {
  if (Date.now() - popupCreationTime < 2000) { // 2-second delay
    return; // Do nothing if the popup was recently created
  }

  if (activeInfo.tabId === openerTabId) {
    if (popupId !== null) {
      chrome.windows.update(popupId, { focused: true });
    }
  } else {
    if (popupId !== null) {
      chrome.windows.update(popupId, { state: "minimized" });
    }
  }
});

chrome.windows.onFocusChanged.addListener(focusedWindowId => {
  if (focusedWindowId === chrome.windows.WINDOW_ID_NONE) {
    return; // No window is currently focused
  }

  chrome.tabs.query({windowId: focusedWindowId, active: true}, (tabs) => {
    if (chrome.runtime.lastError || !tabs || tabs.length === 0) {
      return;
    }

    const activeTab = tabs[0];
    if (activeTab.id === openerTabId && popupId !== null && shouldClosePopup && !popupJustOpened) {
      chrome.windows.remove(popupId);
      popupId = null;
      shouldClosePopup = false;
      openerTabId = null;

      // Send message to content script to unblur the page
      chrome.tabs.sendMessage(activeTab.id, { action: "unblurPage" });
    }
  });
});
