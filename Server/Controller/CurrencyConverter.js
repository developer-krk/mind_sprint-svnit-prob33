const axios = require('axios');

// Cache for exchange rates (reduces API calls)
const exchangeRateCache = new Map();
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

// Get exchange rate from cache or API
const getExchangeRate = async (fromCurrency, toCurrency) => {
    const cacheKey = `${fromCurrency}_${toCurrency}`;
    const cached = exchangeRateCache.get(cacheKey);
    
    // Return cached rate if still valid
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
        return cached.rate;
    }
    
    try {
        // Fetch fresh exchange rates
        const response = await axios.get(
            `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${fromCurrency.toLowerCase()}.json`,
            { timeout: 5000 } // 5 second timeout
        );
        
        const rates = response.data[fromCurrency.toLowerCase()];
        if (!rates || !rates[toCurrency.toLowerCase()]) {
            throw new Error(`Exchange rate not found for ${fromCurrency} to ${toCurrency}`);
        }
        
        const rate = rates[toCurrency.toLowerCase()];
        
        // Cache the result
        exchangeRateCache.set(cacheKey, {
            rate,
            timestamp: Date.now()
        });
        
        return rate;
        
    } catch (error) {
        console.error(`Currency API error for ${fromCurrency} to ${toCurrency}:`, error.message);
        
        // If we have cached data (even if expired), use it as fallback
        if (cached) {
            console.warn(`Using expired cached rate for ${fromCurrency} to ${toCurrency}`);
            return cached.rate;
        }
        
        throw new Error(`Failed to get exchange rate from ${fromCurrency} to ${toCurrency}`);
    }
};

// Convert price from one currency to another
const price = async (amount, fromCurrency, toCurrency) => {
    try {
        // Validate inputs
        if (typeof amount !== 'number' || amount < 0) {
            throw new Error('Amount must be a positive number');
        }
        
        if (!fromCurrency || !toCurrency) {
            throw new Error('Both source and target currencies are required');
        }
        
        // If currencies are the same, return original amount
        if (fromCurrency.toLowerCase() === toCurrency.toLowerCase()) {
            return parseFloat(amount.toFixed(2));
        }
        
        const rate = await getExchangeRate(fromCurrency, toCurrency);
        const convertedAmount = amount * rate;
        
        return parseFloat(convertedAmount.toFixed(2));
        
    } catch (error) {
        console.error('Currency conversion error:', error.message);
        throw error;
    }
};

// Get multiple exchange rates at once
const getMultipleRates = async (fromCurrency, toCurrencies) => {
    try {
        const rates = {};
        
        for (const toCurrency of toCurrencies) {
            try {
                rates[toCurrency] = await getExchangeRate(fromCurrency, toCurrency);
            } catch (error) {
                console.error(`Failed to get rate for ${fromCurrency} to ${toCurrency}:`, error.message);
                rates[toCurrency] = null;
            }
        }
        
        return rates;
        
    } catch (error) {
        console.error('Multiple rates fetch error:', error.message);
        throw error;
    }
};

// Get supported currencies (cached)
let supportedCurrencies = null;
const getSupportedCurrencies = async () => {
    if (supportedCurrencies) {
        return supportedCurrencies;
    }
    
    try {
        const response = await axios.get(
            'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies.json',
            { timeout: 5000 }
        );
        
        supportedCurrencies = Object.keys(response.data);
        return supportedCurrencies;
        
    } catch (error) {
        console.error('Failed to fetch supported currencies:', error.message);
        // Return common currencies as fallback
        return ['usd', 'eur', 'gbp', 'jpy', 'cad', 'aud', 'chf', 'cny', 'inr'];
    }
};

// Clear cache (useful for testing or manual refresh)
const clearCache = () => {
    exchangeRateCache.clear();
    console.log('Exchange rate cache cleared');
};

module.exports = {
    price,
    getExchangeRate,
    getMultipleRates,
    getSupportedCurrencies,
    clearCache
};