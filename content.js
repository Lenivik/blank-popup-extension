document.addEventListener('click', function(event) {
  var target = event.target;
  if (target.tagName === 'A' && target.getAttribute('target') === '_blank') {
    event.preventDefault();

    // Capture the current window size and position
    var windowInfo = {
      screenX: window.screenX,
      screenY: window.screenY,
      outerWidth: window.outerWidth,
      outerHeight: window.outerHeight
    };

    chrome.runtime.sendMessage({
      url: target.href,
      windowInfo: windowInfo
    });
  }
});

// Listen for messages from the background script
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "blurPage") {
    document.body.style.filter = "blur(5px)";
  } else if (request.action === "unblurPage") {
    document.body.style.filter = "none";
  }
});
