/**
 * Amazon Rufus AI Assistant - Content Script
 */

const panelHTML = `
<div id="rufus-ai-panel" class="collapsed">
    <div class="rufus-header" id="rufus-header">
        <div class="rufus-title">
            <div class="rufus-logo">R</div>
            RapidBrowse AI
        </div>
        <div class="rufus-toggle">▲</div>
    </div>
    <div class="rufus-content">
        <div class="rufus-chat-history" id="rufus-chat-history">
            <div class="rufus-message ai">
                Hello! I'm RapidBrowse. Search for something and tell me your preferences (e.g., "under $2000, 4.5+ stars").
            </div>
        </div>
    </div>
    <div class="rufus-footer">
        <div class="rufus-input-container">
            <input type="text" class="rufus-input" id="rufus-input" placeholder="Ask RapidBrowse to filter...">
            <button class="rufus-send-btn" id="rufus-send-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                </svg>
            </button>
        </div>
    </div>
</div>
`;

function injectPanel() {
    if (document.getElementById('rufus-ai-panel')) return;

    const div = document.createElement('div');
    div.innerHTML = panelHTML.trim();
    document.body.appendChild(div.firstChild);

    // Event Listeners
    const header = document.getElementById('rufus-header');
    const panel = document.getElementById('rufus-ai-panel');
    const input = document.getElementById('rufus-input');
    const sendBtn = document.getElementById('rufus-send-btn');

    header.addEventListener('click', () => {
        panel.classList.toggle('collapsed');
        header.querySelector('.rufus-toggle').textContent = panel.classList.contains('collapsed') ? '▲' : '▼';
    });

    sendBtn.addEventListener('click', handleUserQuery);
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleUserQuery();
    });
}

function handleUserQuery() {
    const input = document.getElementById('rufus-input');
    const query = input.value.trim();
    if (!query) return;

    addChatMessage('user', query);
    input.value = '';

    // Send to background script for AI processing
    chrome.runtime.sendMessage({
        type: 'PROCESS_QUERY',
        query: query,
        products: scrapeSearchResults()
    }, (response) => {
        if (response && response.filters) {
            applyFilters(response.filters);
            addChatMessage('ai', `I've filtered the results based on: ${response.summary}`);

            // Save as preset
            chrome.storage.sync.set({ 'lastFilter': response.filters, 'lastSummary': response.summary });
        } else {
            addChatMessage('ai', "I couldn't parse that request. Try specifying price, stars, or review counts.");
        }
    });
}

// Load last filter on startup
function loadLastFilter() {
    chrome.storage.sync.get(['lastFilter', 'lastSummary'], (data) => {
        if (data.lastFilter) {
            applyFilters(data.lastFilter);
            addChatMessage('ai', `Welcome back! applied your last filters: ${data.lastSummary}`);
        }
    });
}

function addChatMessage(role, text) {
    const history = document.getElementById('rufus-chat-history');
    const msg = document.createElement('div');
    msg.className = `rufus-message ${role}`;
    msg.textContent = text;
    history.appendChild(msg);
    history.scrollTop = history.scrollHeight;
}

function scrapeSearchResults() {
    const products = [];
    const cards = document.querySelectorAll('.s-result-item[data-asin]');

    cards.forEach(card => {
        const asin = card.getAttribute('data-asin');
        if (!asin) return;

        const title = card.querySelector('h2')?.textContent?.trim();
        const priceElement = card.querySelector('.a-price-whole');
        const ratingElement = card.querySelector('.a-icon-star-small, .a-icon-star');
        const reviewsElement = card.querySelector('span[aria-label*="ratings"], span[aria-label*="reviews"]');
        const badgeElement = card.querySelector('.a-badge-text, .s-badge-text');

        products.push({
            asin,
            title,
            price: priceElement ? parseFloat(priceElement.textContent.replace(/[,]/g, '')) : null,
            rating: ratingElement ? parseFloat(ratingElement.getAttribute('aria-label') || ratingElement.textContent) : null,
            reviews: reviewsElement ? parseInt(reviewsElement.getAttribute('aria-label')?.replace(/[,]/g, '') || reviewsElement.textContent.replace(/[,]/g, '')) : 0,
            badge: badgeElement?.textContent?.trim() || null,
            element: card
        });
    });

    return products;
}

function applyFilters(filters) {
    const products = scrapeSearchResults();
    const scoredProducts = [];

    products.forEach(p => {
        let visible = true;

        if (filters.minRating && p.rating < filters.minRating) visible = false;
        if (filters.minReviews && p.reviews < filters.minReviews) visible = false;
        if (filters.maxPrice && p.price > filters.maxPrice) visible = false;
        if (filters.minPrice && p.price < filters.minPrice) visible = false;

        p.element.style.display = visible ? 'block' : 'none';

        // Remove previous Best Match highlights
        p.element.classList.remove('rufus-best-match');
        const oldBadge = p.element.querySelector('.rufus-match-badge');
        if (oldBadge) oldBadge.remove();

        if (visible) {
            const score = calculateAndApplyScore(p);
            scoredProducts.push({ ...p, score });
        }
    });

    // Handle "Best Match" (Top 3)
    if (scoredProducts.length > 0) {
        scoredProducts.sort((a, b) => b.score - a.score);
        scoredProducts.slice(0, 3).forEach((p, index) => {
            p.element.classList.add('rufus-best-match');
            const badge = document.createElement('div');
            badge.className = 'rufus-match-badge';
            badge.textContent = index === 0 ? '🏆 RapidBrowse Top Pick' : `Match #${index + 1}`;
            p.element.appendChild(badge);
        });
    }
}

function calculateAndApplyScore(product) {
    // Scoring Logic
    const ratingScore = (product.rating || 0) * 1.2;
    const reviewScore = Math.log10(product.reviews + 1) * 0.8;
    const badgeBonus = product.badge ? 1.5 : 0;

    // Delivery bonus
    const isPrime = product.element.querySelector('.a-icon-prime, .s-prime');
    const deliveryBonus = isPrime ? 0.5 : 0;

    const totalScore = (ratingScore + reviewScore + badgeBonus + deliveryBonus).toFixed(1);

    let scoreBadge = product.element.querySelector('.rufus-ranking-score');
    if (!scoreBadge) {
        scoreBadge = document.createElement('div');
        scoreBadge.className = 'rufus-ranking-score';
        product.element.style.position = 'relative';
        product.element.appendChild(scoreBadge);
    }
    scoreBadge.textContent = `RapidBrowse Score: ${totalScore}`;
    return parseFloat(totalScore);
}

// Initialize
injectPanel();
loadLastFilter();

// Handle dynamic loading
const observer = new MutationObserver(() => {
    // Re-inject if removed or handle new items
    if (!document.getElementById('rufus-ai-panel')) injectPanel();
});

observer.observe(document.body, { childList: true, subtree: true });
