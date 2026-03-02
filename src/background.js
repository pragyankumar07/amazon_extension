/**
 * Amazon Rufus AI Assistant - Background Service Worker
 */

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'PROCESS_QUERY') {
        processAiQuery(request.query, request.products)
            .then(response => sendResponse(response))
            .catch(error => sendResponse({ error: error.message }));
        return true; // Keep channel open for async response
    }
});

async function processAiQuery(query, products) {
    console.log('Processing query:', query);

    // In a production environment, this would call an LLM API (OpenAI/Claude)
    // Here we implement a robust heuristic-based parser that mimics AI intent extraction

    const intent = {
        filters: {},
        summary: ""
    };

    // Extract Price
    const priceMatch = query.match(/(?:under|below|less than|max|maximum)\s*(?:[\$\₹\£])?\s*(\d+)/i);
    if (priceMatch) {
        intent.filters.maxPrice = parseFloat(priceMatch[1]);
        intent.summary += `Price < ${priceMatch[1]}, `;
    }

    const minPriceMatch = query.match(/(?:above|over|more than|min|minimum)\s*(?:[\$\₹\£])?\s*(\d+)/i);
    if (minPriceMatch) {
        intent.filters.minPrice = parseFloat(minPriceMatch[1]);
        intent.summary += `Price > ${minPriceMatch[1]}, `;
    }

    // Extract Stars
    const starMatch = query.match(/(\d+(?:\.\d+)?)\s*(?:\+)?\s*(?:star|rating)/i);
    if (starMatch) {
        intent.filters.minRating = parseFloat(starMatch[1]);
        intent.summary += `${starMatch[1]}+ stars, `;
    }

    // Extract Reviews
    const reviewMatch = query.match(/(\d+)\s*(?:\+)?\s*(?:review|rating|count)/i);
    if (reviewMatch && !query.includes('star')) {
        intent.filters.minReviews = parseInt(reviewMatch[1]);
        intent.summary += `${reviewMatch[1]}+ reviews, `;
    }

    // Keyword Match (Conceptual)
    const keywords = query.toLowerCase().split(' ').filter(w => w.length > 3 && !['under', 'with', 'stars', 'best', 'more'].includes(w));
    if (keywords.length > 0) {
        intent.filters.keywords = keywords;
    }

    // Clean up summary
    intent.summary = intent.summary.replace(/,\s*$/, "") || "Custom filters";

    // Simulate "Thinking" time for AI feel
    await new Promise(resolve => setTimeout(resolve, 800));

    return intent;
}
