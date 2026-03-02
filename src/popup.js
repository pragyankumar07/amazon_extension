/**
 * RapidBrowse AI Shopping Assistant - Popup Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    const apiKeyInput = document.getElementById('api-key');
    const saveBtn = document.getElementById('save-key');
    const saveStatus = document.getElementById('save-status');
    const openAmazonBtn = document.getElementById('open-amazon');

    // Load existing key
    chrome.storage.sync.get(['gemini_api_key'], (data) => {
        if (data.gemini_api_key) {
            apiKeyInput.value = data.gemini_api_key;
        }
    });

    // Save key
    saveBtn.addEventListener('click', () => {
        const key = apiKeyInput.value.trim();
        if (!key) {
            showStatus('Please enter a key', '#f44336');
            return;
        }

        chrome.storage.sync.set({ 'gemini_api_key': key }, () => {
            showStatus('Key saved successfully!', '#4caf50');
        });
    });

    // Open Amazon
    openAmazonBtn.addEventListener('click', () => {
        window.open('https://www.amazon.com/s?k=laptop', '_blank');
    });

    function showStatus(message, color) {
        saveStatus.textContent = message;
        saveStatus.style.color = color;
        setTimeout(() => {
            saveStatus.textContent = '';
        }, 3000);
    }
});
