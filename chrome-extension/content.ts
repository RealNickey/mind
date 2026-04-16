import { extractMetadata } from './utils';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extract') {
    const data = extractMetadata();
    sendResponse({ data });
  }
  return true;
});