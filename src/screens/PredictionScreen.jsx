import React, { useState, useRef } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { geminiApiKey } from '../config/apiKeys';
import { fetchHistoricalData } from '../utils/stockService';
import { runMLForecast } from '../utils/mlModel'; 
import { Search, Loader2, TrendingUp, AlertTriangle, ArrowUpCircle, ArrowDownCircle, MinusCircle, BrainCircuit } from 'lucide-react';

const genAI = new GoogleGenerativeAI(geminiApiKey);
// Using flash model for speed, or pro if you prefer higher quality text
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

//Interactive Stock Chart Component
const StockChart = ({ history, prediction, verdict }) => {
    const [hoverData, setHoverData] = useState(null);
    const svgRef = useRef(null);

    if (!history || history.length === 0) return null;

    const allData = [...history];
    if (prediction && prediction.length > 0) {
        let lastDate = new Date(history[history.length - 1].date);
        prediction.forEach((price, index) => {
            const nextDate = new Date(lastDate);
            nextDate.setDate(lastDate.getDate() + (index + 1)); 
            allData.push({ date: nextDate.toISOString().split('T')[0], close: price, isPrediction: true });
        });
    }

    const isBuy = verdict === 'BUY';
    const isSell = verdict === 'SELL';
    const color = isBuy ? '#22c55e' : (isSell ? '#ef4444' : '#eab308'); 
    const gradientId = `chartGradient-${verdict}`;

    const prices = allData.map(d => d.close);
    const minPrice = Math.min(...prices) * 0.99; 
    const maxPrice = Math.max(...prices) * 1.01;
    const range = maxPrice - minPrice || 1;
    
    const width = 800; 
    const height = 300; 
    const padding = 40;
    const graphWidth = width - padding * 2;
    const graphHeight = height - padding * 2;

    const getX = (index) => padding + (index / (allData.length - 1)) * graphWidth;
    const getY = (price) => height - padding - ((price - minPrice) / range) * graphHeight;

    const historyPoints = allData.filter(d => !d.isPrediction);
    const predictionPoints = allData.filter(d => d.isPrediction || d === historyPoints[historyPoints.length-1]);

    let historyPath = `M ${getX(0)} ${getY(historyPoints[0].close)}`;
    historyPoints.forEach((point, i) => {
        historyPath += ` L ${getX(i)} ${getY(point.close)}`;
    });

    let predictionPath = "";
    if (predictionPoints.length > 1) {
        const startIndex = historyPoints.length - 1;
        predictionPath = `M ${getX(startIndex)} ${getY(predictionPoints[0].close)}`;
        predictionPoints.forEach((point, i) => {
             if(i > 0) predictionPath += ` L ${getX(startIndex + i)} ${getY(point.close)}`;
        });
    }

    const areaPath = `${historyPath} L ${getX(historyPoints.length - 1)} ${height - padding} L ${padding} ${height - padding} Z`;

    const handleMouseMove = (e) => {
        if (!svgRef.current) return;
        const rect = svgRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left; 
        const rawIndex = ((x - padding) / graphWidth) * (allData.length - 1);
        const index = Math.round(Math.max(0, Math.min(allData.length - 1, rawIndex)));
        
        setHoverData({
            x: getX(index),
            y: getY(allData[index].close),
            data: allData[index]
        });
    };

    return (
        <div className="w-full h-80 mt-6 mb-2 relative" onMouseLeave={() => setHoverData(null)}>
            <svg 
                ref={svgRef}
                viewBox={`0 0 ${width} ${height}`} 
                className="w-full h-full overflow-visible cursor-crosshair"
                onMouseMove={handleMouseMove}
            >
                <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.4" />
                        <stop offset="100%" stopColor={color} stopOpacity="0" />
                    </linearGradient>
                </defs>
                <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#e5e7eb" strokeWidth="1" />
                <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#e5e7eb" strokeWidth="1" />
                <path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />
                <path d={historyPath} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                {predictionPath && (
                    <path 
                        d={predictionPath} fill="none" stroke={color} strokeWidth="3" strokeDasharray="10,5" 
                        strokeLinecap="round" strokeLinejoin="round" opacity="0.7"
                    />
                )}
                {hoverData && (
                    <>
                        <line x1={hoverData.x} y1={padding} x2={hoverData.x} y2={height - padding} stroke="#9ca3af" strokeWidth="1" strokeDasharray="4,4" />
                        <circle cx={hoverData.x} cy={hoverData.y} r="6" fill={color} stroke="white" strokeWidth="2" />
                    </>
                )}
                <text x={5} y={getY(minPrice)} fill="#9ca3af" fontSize="12" dy="5">${minPrice.toFixed(0)}</text>
                <text x={5} y={getY(maxPrice)} fill="#9ca3af" fontSize="12" dy="5">${maxPrice.toFixed(0)}</text>
            </svg>
            {hoverData && (
                <div 
                    className="absolute bg-gray-900 text-white p-2 rounded shadow-xl text-xs pointer-events-none z-10 transform -translate-x-1/2 -translate-y-full mb-2"
                    style={{ left: `${(hoverData.x / width) * 100}%`, top: `${(hoverData.y / height) * 100}%` }}
                >
                    <div className="font-bold">{hoverData.data.date}</div>
                    <div className="text-lg">${hoverData.data.close.toFixed(2)}</div>
                    <div className={`uppercase text-[10px] ${hoverData.data.isPrediction ? 'text-yellow-400' : 'text-gray-400'}`}>
                        {hoverData.data.isPrediction ? 'Simulated' : 'History'}
                    </div>
                </div>
            )}
        </div>
    );
};

const PredictionScreen = () => {
    const [symbol, setSymbol] = useState('');
    const [timeHorizon, setTimeHorizon] = useState('30'); 
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const handleAnalyze = async (e) => {
        e.preventDefault();
        if (!symbol) return;

        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            // 1. Fetch Data
            const history = await fetchHistoricalData(symbol);
            if (!history || history.length < 50) throw new Error("Not enough data to analyze.");

            // 2. Run Simulation (Monte Carlo)
            const daysToPredict = parseInt(timeHorizon);
            const mlResult = await runMLForecast(history, daysToPredict);

            // 3. Get Reasoning from Gemini 
            const currentPrice = history[history.length - 1].close; 
            const endPrice = mlResult.predictedPrices[mlResult.predictedPrices.length - 1];
            const changePct = ((endPrice - currentPrice) / currentPrice * 100).toFixed(2);
            
            const prompt = `
                I ran a Monte Carlo statistical simulation for ${symbol}.
                - Current Price: $${currentPrice.toFixed(2)}
                - ${daysToPredict}-Day Forecast: $${endPrice.toFixed(2)} (${changePct}%)
                - Simulation Verdict: ${mlResult.verdict}
                
                Explain this forecast. Why might the simulation be projecting this result based on historical volatility and drift? Keep it short and professional.
            `;
            
            let reasoning = "Statistical simulation complete.";
            try {
                const aiResult = await model.generateContent(prompt);
                reasoning = aiResult.response.text();
            } catch (aiErr) {
                console.error("Gemini AI Error:", aiErr);
            }

            // 4. Update State
            setResult({
                verdict: mlResult.verdict,
                confidence: mlResult.confidence,
                reasoning: reasoning,
                predictedPrices: mlResult.predictedPrices,
                history: history.slice(-90), 
                technical: { currentPrice } 
            });

        } catch (err) {
            console.error(err);
            setError(err.message || "Analysis Failed.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Statistical Market Simulator</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8">Forecasting via Monte Carlo Simulation (Geometric Brownian Motion).</p>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 mb-8">
                <form onSubmit={handleAnalyze} className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Stock Symbol</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={symbol}
                                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                                placeholder="e.g. SPY"
                                className="w-full pl-10 p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white font-bold uppercase"
                            />
                            <Search className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
                        </div>
                    </div>
                    <div className="w-full md:w-48">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Forecast Horizon</label>
                        <select 
                            value={timeHorizon}
                            onChange={(e) => setTimeHorizon(e.target.value)}
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        >
                            <option value="7">7 Days</option>
                            <option value="30">1 Month</option>
                            <option value="90">3 Months</option>
                            <option value="365">1 Year</option>
                        </select>
                    </div>
                    <div className="flex items-end">
                        <button 
                            type="submit" 
                            disabled={isLoading || !symbol}
                            className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-colors disabled:bg-gray-400 flex items-center justify-center gap-2"
                        >
                            {isLoading ? <Loader2 className="animate-spin" /> : <BrainCircuit />}
                            {isLoading ? 'Simulating...' : 'Run Simulation'}
                        </button>
                    </div>
                </form>
                {error && (
                    <div className="mt-4 p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-lg flex items-center">
                        <AlertTriangle className="w-5 h-5 mr-2" />
                        {error}
                    </div>
                )}
            </div>

            {result && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className={`p-6 rounded-2xl shadow-lg border-l-8 mb-6 ${
                        result.verdict === 'BUY' ? 'bg-green-50 border-green-500 dark:bg-green-900/20' : 
                        result.verdict === 'SELL' ? 'bg-red-50 border-red-500 dark:bg-red-900/20' : 
                        'bg-yellow-50 border-yellow-500 dark:bg-yellow-900/20'
                    }`}>
                        <div className="flex flex-col md:flex-row justify-between items-start mb-4">
                            <div>
                                <h3 className="text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider text-sm flex items-center gap-2">
                                    Simulation Verdict
                                    {result.verdict === 'BUY' && <ArrowUpCircle className="text-green-500 w-5 h-5"/>}
                                    {result.verdict === 'SELL' && <ArrowDownCircle className="text-red-500 w-5 h-5"/>}
                                    {result.verdict === 'HOLD' && <MinusCircle className="text-yellow-500 w-5 h-5"/>}
                                </h3>
                                <p className={`text-5xl font-black mt-2 tracking-tight ${
                                    result.verdict === 'BUY' ? 'text-green-600 dark:text-green-400' : 
                                    result.verdict === 'SELL' ? 'text-red-600 dark:text-red-400' : 
                                    'text-yellow-600 dark:text-yellow-400'
                                }`}>{result.verdict}</p>
                            </div>
                            <div className="text-right mt-4 md:mt-0">
                                <h3 className="text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider text-sm">Confidence</h3>
                                <div className="flex items-center justify-end mt-1">
                                    <div className="text-3xl font-bold dark:text-white">{result.confidence}%</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/50 dark:bg-black/20 rounded-xl p-4 backdrop-blur-sm shadow-inner">
                             <div className="flex justify-between items-center mb-2">
                                <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">Price Projection</p>
                                <div className="flex items-center gap-3 text-xs">
                                    <div className="flex items-center"><div className="w-3 h-1 bg-current opacity-40 mr-1"></div> History</div>
                                    <div className="flex items-center"><div className="w-3 h-1 border-t-2 border-dashed border-current mr-1"></div> Projected Path</div>
                                </div>
                             </div>
                             <StockChart 
                                history={result.history} 
                                prediction={result.predictedPrices} 
                                verdict={result.verdict} 
                             />
                        </div>

                        <p className="text-lg text-gray-800 dark:text-gray-200 leading-relaxed mt-6 italic">
                            "{result.reasoning}"
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PredictionScreen;