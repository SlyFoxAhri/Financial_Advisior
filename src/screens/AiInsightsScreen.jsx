import React, { useState, useEffect, useRef } from 'react';
//Import the new API key from config
import { geminiApiKey, newsApiKey, twelveDataApiKey } from '../config/apiKeys.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';
import { Bot, User, Send, Loader2, FileText, Sparkles, ShieldCheck, SearchCheck } from 'lucide-react';

//Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(geminiApiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

//Helper function to format AI responses
const FormattedAiResponse = ({ text }) => {
    const createMarkup = (text) => {
        if (!text) return { __html: '' };
        let html = text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/^\s*[*-]\s*(.*)/gm, '<li>$1</li>');
        if (html.includes('<li>')) {
            html = `<ul>${html}</ul>`.replace(/<\/ul>\s*<li>/g, '<li>').replace(/<\/li>\s*<ul>/g, '</li>');
        }
        return { __html: html };
    };
    return <div className="prose prose-sm dark:prose-invert" dangerouslySetInnerHTML={createMarkup(text)} />;
};

//AI Insights Screen Component
const AiInsightsScreen = () => {
    const [activeTab, setActiveTab] = useState('chat');
    return (
        <div>
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">AI Insights</h2>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="flex border-b border-gray-200 dark:border-gray-600 mb-6">
                    <TabButton title="Conversational Advice" isActive={activeTab === 'chat'} onClick={() => setActiveTab('chat')} />
                    <TabButton title="Document Analyzer" isActive={activeTab === 'analyzer'} onClick={() => setActiveTab('analyzer')} />
                    <TabButton title="Risk Modeling" isActive={activeTab === 'risk'} onClick={() => setActiveTab('risk')} />
                </div>
                <div>
                    {activeTab === 'chat' && <ConversationalAdvice />}
                    {activeTab === 'analyzer' && <DocumentAnalyzer />}
                    {activeTab === 'risk' && <RiskModeling />}
                </div>
            </div>
        </div>
    );
};

//Sub-Components for each tab
const TabButton = ({ title, isActive, onClick }) => (
    <button onClick={onClick} className={`py-3 px-6 font-semibold text-lg transition-colors duration-300 ${isActive ? 'border-b-4 border-blue-600 text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-blue-600 dark:hover:text-blue-400'}`}>
        {title}
    </button>
);

const ConversationalAdvice = () => {
    const [conversation, setConversation] = useState([{ role: 'model', text: 'Hello! How can I help you with your financial questions today?' }]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [analysisMode, setAnalysisMode] = useState(false);
    const chatEndRef = useRef(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [conversation]);

    const handleSendMessage = async () => {
        if (!userInput.trim()) return;

        const userMessage = { role: 'user', text: userInput };
        setIsLoading(true);
        setUserInput('');
        setConversation(prev => [...prev, userMessage]);

        if (analysisMode) {
            await handleAnalysisMode(userInput);
        } else {
            await handleStandardChat(userInput);
        }
        setIsLoading(false);
    };
    
    const handleStandardChat = async (message) => {
        const updatedConversation = [...conversation, { role: 'user', text: message }];
        try {
            const chatHistory = updatedConversation.map(msg => ({
                role: msg.role === 'model' ? 'model' : 'user',
                parts: [{ text: msg.text }]
            }));
            const result = await model.generateContent({ contents: chatHistory });
            const response = result.response;
            const aiText = response.text();
            setConversation(prev => [...prev, { role: 'model', text: aiText }]);
        } catch (error) {
            console.error("Error in standard chat:", error);
            setConversation(prev => [...prev, { role: 'model', text: 'Sorry, I encountered an error.' }]);
        }
    };

    const handleAnalysisMode = async (message) => {
        const entityPrompt = `Analyze the user's request. Identify the core company or product they are asking about. Return a JSON object with two keys: "searchQuery" for the News API (e.g., 'Take-Two Interactive OR GTA VI') and "stockSymbol" for the Market Data API (e.g., 'TTWO'). If you can't determine a stock symbol, return null for that key. User Request: '${message}'`;
        
        setConversation(prev => [...prev, { role: 'model', text: 'Analyzing your request and gathering real-time data...', isStatus: true }]);

        try {
            const entityResult = await model.generateContent(entityPrompt);
            const entityText = entityResult.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
            const entities = JSON.parse(entityText);

            if (!entities.stockSymbol) {
                setConversation(prev => [...prev, { role: 'model', text: "I couldn't identify a specific stock for analysis. Could you be more specific?" }]);
                return;
            }

            const newsUrl = `https://newsapi.org/v2/everything?q=${encodeURIComponent(entities.searchQuery)}&sortBy=relevancy&pageSize=5&apiKey=${newsApiKey}`;
            //New API endpoint structure for Twelve Data
            const stockUrl = `https://api.twelvedata.com/quote?symbol=${entities.stockSymbol}&apikey=${twelveDataApiKey}`;

            const [newsResponse, stockResponse] = await Promise.all([
                axios.get(newsUrl),
                axios.get(stockUrl)
            ]);

            const headlines = newsResponse.data.articles.map(a => a.title);
            const stockData = stockResponse.data;
            //Parsing the new response structure
            const price = (stockData && stockData.close) ? stockData.close : 'Not found';
            
            setConversation(prev => [...prev, { role: 'model', text: `Found data for ${entities.stockSymbol}. Now generating analysis...`, isStatus: true }]);

            const analysisPrompt = `You are a concise financial analyst. Based ONLY on the following real-time data, provide an investment analysis for the user's request: "${message}".
            
            Real-time Data:
            - Current Stock Price of ${entities.stockSymbol}: $${price}
            - Recent News Headlines:
                - "${headlines.join('"\n                - "')}"
            
            Return a JSON object with two keys: "analysisText" (a brief, to-the-point summary with pros and cons, formatted using markdown) and "overallSentiment" (one word: "Positive", "Negative", or "Neutral").`;
            
            const finalResult = await model.generateContent(analysisPrompt);
            const finalText = finalResult.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
            const analysisData = JSON.parse(finalText);
            
            setConversation(prev => [...prev, { 
                role: 'model', 
                text: analysisData.analysisText, 
                sentiment: analysisData.overallSentiment 
            }]);

        } catch (error) {
            console.error("Error in analysis mode:", error);
            setConversation(prev => [...prev, { role: 'model', text: 'Sorry, I failed to gather data or perform the analysis. The company might not be publicly traded or an API limit was reached.' }]);
        }
    };

    return (
        <div className="flex flex-col h-[60vh]">
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-700 rounded-lg custom-scrollbar">
                {conversation.map((msg, index) => (
                    <div key={index} className={`flex items-end gap-3 my-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role === 'model' && !msg.isStatus && <Bot className="w-8 h-8 text-blue-500 flex-shrink-0" />}
                        {msg.isStatus && <SearchCheck className="w-8 h-8 text-purple-500 flex-shrink-0 animate-pulse" />}
                        
                        <div className={`p-4 rounded-2xl max-w-lg ${msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white'} ${msg.isStatus ? 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200' : ''}`}>
                            {msg.role === 'model' ? <FormattedAiResponse text={msg.text} /> : msg.text}
                        </div>

                        {msg.sentiment && (
                            <div title={`Overall Sentiment: ${msg.sentiment}`} className={`w-5 h-5 rounded-full shadow-lg flex-shrink-0
                                ${msg.sentiment === 'Positive' ? 'bg-green-500' : ''}
                                ${msg.sentiment === 'Negative' ? 'bg-red-500' : ''}
                                ${msg.sentiment === 'Neutral' ? 'bg-gray-500' : ''}
                            `}></div>
                        )}
                        
                        {msg.role === 'user' && <User className="w-8 h-8 text-gray-500 flex-shrink-0" />}
                    </div>
                ))}
                <div ref={chatEndRef} />
            </div>
            <div className="mt-4">
                <div className="flex justify-end mb-2">
                    <label htmlFor="analysis-toggle" className="flex items-center cursor-pointer">
                        <span className="mr-3 text-sm font-medium text-gray-900 dark:text-gray-300">Analysis Mode</span>
                        <div className="relative">
                            <input type="checkbox" id="analysis-toggle" className="sr-only" checked={analysisMode} onChange={() => setAnalysisMode(!analysisMode)} />
                            <div className="block bg-gray-600 w-14 h-8 rounded-full"></div>
                            <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition ${analysisMode ? 'transform translate-x-6 bg-green-400' : ''}`}></div>
                        </div>
                    </label>
                </div>
                <div className="flex items-center gap-4">
                    <input type="text" value={userInput} onChange={(e) => setUserInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()} placeholder="Ask a financial question..." className="flex-1 p-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white" disabled={isLoading} />
                    <button onClick={handleSendMessage} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold p-4 rounded-lg shadow-md transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center w-24">
                        {isLoading ? <Loader2 className="animate-spin" /> : <Send />}
                    </button>
                </div>
            </div>
        </div>
    );
};

const DocumentAnalyzer = () => {
    return (
        <div className="flex flex-col lg:flex-row gap-6 h-[60vh]">
            <div className="flex-1 flex flex-col">
                <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-white flex items-center"><FileText className="mr-2"/> Paste Your Document Here</h3>
                <textarea
                    placeholder="Paste the content of a financial report, news article, or earnings call transcript..."
                    className="flex-1 p-4 border border-gray-300 dark:border-gray-600 rounded-lg resize-none custom-scrollbar focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
                <button
                    className="mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg shadow-md transition-all duration-200 disabled:bg-gray-400 flex items-center justify-center"
                >
                     <Sparkles className="mr-2" />
                     Generate Summary
                </button>
            </div>
            <div className="flex-1 flex flex-col">
                <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-white flex items-center"><Sparkles className="mr-2 text-yellow-500"/> AI Summary</h3>
                <div className="flex-1 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 custom-scrollbar">
                    <p className="text-gray-400">Your summary will appear here.</p>
                </div>
            </div>
        </div>
    );
};

const RiskModeling = () => {
    return (
        <div className="flex flex-col h-[60vh]">
            <div className="space-y-4 mb-4">
                <div>
                    <label htmlFor="inflation-rate" className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">Target Inflation Rate (%)</label>
                    <input 
                        type="number"
                        id="inflation-rate"
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                </div>
                 <div>
                    <label htmlFor="scenario" className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">Economic Scenario</label>
                    <select 
                        id="scenario"
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                        <option>Recession</option>
                        <option>Stable Growth</option>
                        <option>High Inflation</option>
                        <option>Market Crash</option>
                    </select>
                </div>
                <button
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg shadow-md transition-all duration-200 disabled:bg-gray-400 flex items-center justify-center"
                >
                    <ShieldCheck className="mr-2" />
                    Run Risk Model
                </button>
            </div>
            <div className="flex-1 flex flex-col">
                <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-white flex items-center"><Sparkles className="mr-2 text-yellow-500"/> AI Analysis</h3>
                <div className="flex-1 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 custom-scrollbar">
                    <p className="text-gray-400">Your risk analysis will appear here.</p>
                </div>
            </div>
        </div>
    );
};

export default AiInsightsScreen;

