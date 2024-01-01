chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  let windowInfo = request.windowInfo;

  // Calculate the dimensions and position for the centered popup
  const popupWidth = Math.round(windowInfo.outerWidth * 0.8); // 80% of the original window width
  const popupHeight = Math.round(windowInfo.outerHeight * 0.8); // 80% of the original window height
  const left = windowInfo.screenX + (windowInfo.outerWidth - popupWidth) / 2;
  const top = windowInfo.screenY + (windowInfo.outerHeight - popupHeight) / 2;

  chrome.windows.create({
    url: request.url,
    type: 'popup',
    width: popupWidth,
    height: popupHeight,
    left: Math.round(left),
    top: Math.round(top)
  }, (window) => {
    popupId = window.id;
    popupJustOpened = true;
    // Set a timeout to allow user interaction with the popup
    setTimeout(() => {
      popupJustOpened = false;
      shouldClosePopup = true;
    }, 1000); // Delay of 1000 ms
  });
});

chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId !== popupId && popupId !== null && shouldClosePopup && !popupJustOpened) {
    chrome.windows.remove(popupId);
    popupId = null;
    shouldClosePopup = false;
  }
});
