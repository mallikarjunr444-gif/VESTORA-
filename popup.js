// VESTORA Extension Popup Controller
document.getElementById("open-widget")?.addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]?.id) {
      chrome.tabs.sendMessage(tabs[0].id, { type: "VESTORA_OPEN_FITTING_ROOM" });
    }
  });
  window.close();
});

document.getElementById("open-onboarding")?.addEventListener("click", () => {
  chrome.tabs.create({ url: "https://vestora.ai" });
  window.close();
});