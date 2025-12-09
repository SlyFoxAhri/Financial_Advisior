import axios from 'axios';
import { twelveDataApiKey } from '../config/apiKeys';

// ──────────────────────────────────────────
// NEW: Fetch real-time quote from Twelve Data
// Endpoint: /quote
// ──────────────────────────────────────────
export const fetchQuote = async (symbol) => {
    try {
        // Handle Crypto Symbols (same mapping logic as historical data)
        let querySymbol = symbol;
        const cryptoMap = {
            'BTC': 'BTC/USD',
            'ETH': 'ETH/USD',
            'SOL': 'SOL/USD',
            'DOGE': 'DOGE/USD',
            'XRP': 'XRP/USD',
            'ADA': 'ADA/USD',
            'BNB': 'BNB/USD'
        };
        if (cryptoMap[symbol]) {
            querySymbol = cryptoMap[symbol];
        }

        const url = `https://api.twelvedata.com/quote?symbol=${querySymbol}&apikey=${twelveDataApiKey}`;

        const response = await axios.get(url);
        const data = response.data;

        // Error handling (Twelve Data uses 'status' for errors here)
        if (data.status === "error") {
            console.error("Quote API Error:", data.message);
            return null;
        }

        // Return cleaned data in consistent format
        return {
            symbol: data.symbol,
            name: data.name,
            price: parseFloat(data.price),
            change: parseFloat(data.change),
            percent_change: parseFloat(data.percent_change),
            open: parseFloat(data.open),
            high: parseFloat(data.high),
            low: parseFloat(data.low),
            previous_close: parseFloat(data.previous_close),
            volume: data.volume ? parseFloat(data.volume) : null,
            timestamp: data.datetime
        };

    } catch (error) {
        console.error("Network or Server Error (quote):", error);
        return null;
    }
};

// ──────────────────────────────────────────
// ORIGINAL: Fetch historical data (unchanged)
// ──────────────────────────────────────────
export const fetchHistoricalData = async (symbol) => {
    try {
        // 1. Handle Crypto Symbols automatically
        let querySymbol = symbol;
        const cryptoMap = {
            'BTC': 'BTC/USD',
            'ETH': 'ETH/USD',
            'SOL': 'SOL/USD',
            'DOGE': 'DOGE/USD',
            'XRP': 'XRP/USD',
            'ADA': 'ADA/USD',
            'BNB': 'BNB/USD'
        };
        if (cryptoMap[symbol]) {
            querySymbol = cryptoMap[symbol];
        }

        // 2. Construct the API URL
        const url = `https://api.twelvedata.com/time_series?symbol=${querySymbol}&interval=1day&outputsize=5000&apikey=${twelveDataApiKey}`;

        console.log(`Fetching history for ${querySymbol}...`);

        // 3. Make the request
        const response = await axios.get(url);
        const data = response.data;

        // 4. Check for API errors 
        if (data.code && data.code !== 200) {
            console.error("API Error:", data.message);
            return null; 
        }

        if (!data.values || data.values.length === 0) {
            console.warn(`No data values returned for ${querySymbol}`);
            return null;
        }

        // 5. Transform the data
        const cleanData = data.values.map(day => ({
            date: day.datetime,
            close: parseFloat(day.close)
        })).reverse();

        return cleanData;

    } catch (error) {
        console.error("Network or Server Error:", error);
        return null;
    }
};
