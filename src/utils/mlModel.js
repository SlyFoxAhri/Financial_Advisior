// Statistical Forecast Engine using Geometric Brownian Motion (Monte Carlo)

/**
 * Runs a Monte Carlo Simulation to forecast future stock prices.
 * Formula: Price(t) = Price(t-1) * e^( (drift) + (volatility * z) )
 * * @param {Array} history - Array of price objects { close: 150.20, ... }
 * @param {number} daysToPredict - How many days into the future to forecast
 */
export const runMLForecast = async (history, daysToPredict) => {
    try {
        console.log(`[MC] Starting simulation for ${daysToPredict} days...`);

        // 1. Validate History
        if (!history || history.length === 0) {
            console.error("[MC] History is empty!");
            throw new Error("No historical data provided.");
        }

        const closes = history.map(d => d.close);
        const lastRealPrice = closes[closes.length - 1];
        
        console.log(`[MC] Last Real Price from History: $${lastRealPrice}`);

        // 2. Calculate Drift & Volatility (Log Returns)
        const returns = [];
        for (let i = 1; i < closes.length; i++) {
            // Log Return: ln(Pt / Pt-1)
            const r = Math.log(closes[i] / closes[i-1]);
            returns.push(r);
        }

        // Analyze last 100 days OR all available history if less than 100
        const lookback = Math.min(100, returns.length);
        const analysisWindow = returns.slice(-lookback); 
        
        const drift = analysisWindow.reduce((sum, val) => sum + val, 0) / analysisWindow.length;
        
        const variance = analysisWindow.reduce((sum, val) => sum + Math.pow(val - drift, 2), 0) / analysisWindow.length;
        const volatility = Math.sqrt(variance);
        
        console.log(`[MC] Daily Drift: ${(drift*100).toFixed(4)}%, Volatility: ${(volatility*100).toFixed(4)}%`);

        // 3. Monte Carlo Loop
        const predictions = [lastRealPrice]; 

        for (let t = 1; t <= daysToPredict; t++) {
            // Random Z-Score
            const u1 = Math.random();
            const u2 = Math.random();
            const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);

            // GBM Step
            const growthFactor = Math.exp(drift + (volatility * z));
            
            const nextPrice = predictions[predictions.length - 1] * growthFactor;
            predictions.push(nextPrice);
        }

        const forecast = predictions.slice(1);
        const finalPrice = forecast[forecast.length - 1];

        console.log(`[MC] Final Predicted Price: $${finalPrice.toFixed(2)}`);

        // 4. Verdict Logic
        const totalReturnPct = ((finalPrice - lastRealPrice) / lastRealPrice) * 100;
        
        // Thresholds
        let verdict = "HOLD";
        if (totalReturnPct > 2) verdict = "BUY";
        if (totalReturnPct < -2) verdict = "SELL";

        // Confidence
        let confidence = Math.max(10, Math.min(95, 100 - (volatility * 1000)));

        return {
            predictedPrices: forecast,
            verdict: verdict,
            confidence: confidence.toFixed(0)
        };

    } catch (error) {
        console.error("Monte Carlo Error:", error);
        return {
            predictedPrices: [],
            verdict: "HOLD",
            confidence: 0
        };
    }
};