/**
 * Amazon Rufus AI Assistant - Background Service Worker
 */

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'PROCESS_QUERY') {
        chrome.storage.sync.get(['gemini_api_key'], (data) => {
            if (!data.gemini_api_key) {
                console.error('Gemini API Key missing');
                sendResponse({
                    error: 'API_KEY_MISSING',
                    message: 'Please set your Gemini API Key in the extension settings.'
                });
                return;
            }

            processAiQuery(request.query, request.products, data.gemini_api_key)
                .then(response => sendResponse(response))
                .catch(error => {
                    console.error('Gemini Error:', error);
                    const fallback = heuristicParse(request.query);
                    sendResponse(fallback);
                });
        });
        return true;
    }
});

async function processAiQuery(query, products, apiKey) {
    console.log('Processing query with Gemini:', query);
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const prompt = `
        You are an AI Shopping Assistant named RapidBrowse. Extract filtering criteria from this user query: "${query}"
        Return ONLY a JSON object with these keys: 
        - minRating (number or null)
        - maxPrice (number or null)
        - minPrice (number or null)
        - minReviews (number or null)
        - summary (short string describing filters)
        
        Example: "under $2000 and 4 star" -> {"minRating": 4, "maxPrice": 2000, "minPrice": null, "minReviews": null, "summary": "Under $2000, 4+ stars"}
    `;

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const data = await response.json();
        const textResponse = data.candidates[0].content.parts[0].text;
        const jsonMatch = textResponse.match(/\{.*\}/s);

        if (jsonMatch) {
            const result = JSON.parse(jsonMatch[0]);
            return { filters: result, summary: result.summary };
        }
    } catch (e) {
        console.warn('AI Parsing failed, using heuristic fallback', e);
    }

    return heuristicParse(query);
}

function heuristicParse(query) {
    const intent = {
        filters: {},
        summary: ""
    };

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

    const starMatch = query.match(/(\d+(?:\.\d+)?)\s*(?:\+)?\s*(?:star|rating)/i);
    if (starMatch) {
        intent.filters.minRating = parseFloat(starMatch[1]);
        intent.summary += `${starMatch[1]}+ stars, `;
    }

    const reviewMatch = query.match(/(\d+)\s*(?:\+)?\s*(?:review|rating|count)/i);
    if (reviewMatch && !query.includes('star')) {
        intent.filters.minReviews = parseInt(reviewMatch[1]);
        intent.summary += `${reviewMatch[1]}+ reviews, `;
    }

    intent.summary = intent.summary.replace(/,\s*$/, "") || "Custom filters";
    return intent;
}
