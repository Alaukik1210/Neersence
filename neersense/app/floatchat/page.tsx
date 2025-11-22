"use client";

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Search, Loader2, MapPin, Calendar, Thermometer, Waves, Activity, MessageCircle, LayoutPanelLeft, Home, Plus } from 'lucide-react';

// --- TypeScript Interfaces ---
interface ProfileMatch {
    rank: number;
    platform_number: string | null;
    cycle_number: string | null;
    date: string | null;
    latitude: number | null;
    longitude: number | null;
    avg_temperature: number | null;
    avg_salinity: number | null;
    distance: number;
}

interface ProfileDataPoint {
    depth: number;
    temperature: number;
    salinity: number;
}

interface QueryResponse {
    query: string;
    parsed_year: number | null;
    parsed_month: number | null;
    matches_found: boolean;
    raw_matches: ProfileMatch[];
    gemini_summary: string;
    llm_context: string;
    plot_requested: boolean; 
    plot_data_points: ProfileDataPoint[] | null;
    total_results?: number;
}

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    rawResponse?: QueryResponse;
}

interface ChatSession {
    id: string;
    name: string;
    history: ChatMessage[];
    createdAt: Date;
}

// --- Constants ---
const API_URL = 'http://localhost:8000/query';

// --- Helper Functions ---
const generateSessionId = () => Math.random().toString(36).substr(2, 9);

const getInitialSessions = (): ChatSession[] => {
    return [{
        id: generateSessionId(),
        name: "New Chat 1",
        history: [],
        createdAt: new Date()
    }];
};

// --- Helper Components ---

// Match Display Component
const ThemedMatchDisplay: React.FC<{ match: ProfileMatch }> = ({ match }) => {
    const formatCoordinate = (value: number | null, decimals = 2) => value !== null ? value.toFixed(decimals) : 'N/A';
    const formatValue = (value: number | null, decimals = 2) => value !== null ? value.toFixed(decimals) : 'N/A';
    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return 'N/A';
        try {
            return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        } catch {
            return dateStr;
        }
    };

    return (
        <div className="bg-gray-700/50 rounded-lg p-4 hover:border-cyan-500 border border-transparent transition-all">
            <div className="flex items-center justify-between mb-3 border-b border-gray-600 pb-2">
                <div className="flex items-center space-x-3">
                    <div className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                        Rank #{match.rank}
                    </div>
                    <div className="text-gray-400 text-xs">
                        Distance: {match.distance.toFixed(4)}
                    </div>
                </div>
                <div className="text-right">
                    <p className="font-semibold text-white text-sm">
                        Platform {match.platform_number?.trim() || 'N/A'}
                    </p>
                    <p className="text-gray-400 text-xs">
                        Cycle {match.cycle_number || 'N/A'}
                    </p>
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex items-center space-x-2">
                    <Calendar className="w-3 h-3 text-cyan-400" />
                    <div>
                        <p className="text-gray-500">Date</p>
                        <p className="text-white font-medium">{formatDate(match.date)}</p>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <MapPin className="w-3 h-3 text-cyan-400" />
                    <div>
                        <p className="text-gray-500">Location</p>
                        <p className="text-white font-medium">
                            {formatCoordinate(match.latitude, 2)}°, {formatCoordinate(match.longitude, 2)}°
                        </p>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <Thermometer className="w-3 h-3 text-cyan-400" />
                    <div>
                        <p className="text-gray-500">Avg Temp</p>
                        <p className="text-white font-medium">{formatValue(match.avg_temperature)}°C</p>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <Waves className="w-3 h-3 text-cyan-400" />
                    <div>
                        <p className="text-gray-500">Avg Salinity</p>
                        <p className="text-white font-medium">{formatValue(match.avg_salinity)} PSU</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Quick Actions Component
const QuickActions: React.FC<{ onQuery: (query: string) => void }> = ({ onQuery }) => {
    const quickQueries = [
        { label: "Plot Profile", query: "plot temperature and salinity profile with 100 data points", icon: "" },
        { label: "Recent Data", query: "give me data from 2024", icon: "" },
        { label: "High Temp", query: "show profiles with highest average temperature", icon: "" },
    ];

    return (
        <div className="flex flex-wrap gap-2 mt-4 justify-center">
            {quickQueries.map((action, idx) => (
                <button
                    key={idx}
                    onClick={() => onQuery(action.query)}
                    className="px-3 py-2 bg-primary1 hover:bg-gray-600 text-white cursor-pointer text-xs rounded-full transition duration-200 flex items-center gap-1 "
                >
                    <span>{action.icon}</span>
                    {action.label}
                </button>
            ))}
        </div>
    );
};

// Ocean Profile Charts Component
const ChartDisplay: React.FC<{ data: ProfileDataPoint[], platformId: string }> = ({ data, platformId }) => {
    // Clean and validate data
    const chartData = data.filter(d => 
        !isNaN(d.depth) && 
        !isNaN(d.temperature) && 
        !isNaN(d.salinity) &&
        d.depth >= 0
    ).sort((a, b) => a.depth - b.depth);

    if (chartData.length === 0) {
        return <p className="text-red-400 text-sm">No valid data points found for plotting.</p>;
    }

    // Transform data for scatter plots
    const tempChartData = chartData.map(d => ({
        x: d.temperature,
        y: d.depth,
        depth: d.depth,
        temperature: d.temperature
    }));

    const salinityChartData = chartData.map(d => ({
        x: d.salinity,
        y: d.depth,
        depth: d.depth,
        salinity: d.salinity
    }));

    const maxDepth = Math.max(...chartData.map(d => d.depth));
    const minTemp = Math.min(...chartData.map(d => d.temperature));
    const maxTemp = Math.max(...chartData.map(d => d.temperature));
    const minSalinity = Math.min(...chartData.map(d => d.salinity));
    const maxSalinity = Math.max(...chartData.map(d => d.salinity));

    return (
        <div className="space-y-4">
            <h4 className="text-lg font-bold text-white text-center border-b border-gray-700 pb-2">
                Ocean Profile - Platform {platformId} ({chartData.length} points)
            </h4>
            
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
                {/* Temperature Chart */}
                <div className="bg-gray-800/70 p-4 rounded-xl border border-gray-700">
                    <div className="flex items-center gap-2 mb-3">
                        <Thermometer className="w-4 h-4 text-orange-400" />
                        <h5 className="text-sm font-semibold text-orange-400">Temperature vs Depth</h5>
                    </div>
                    
                    <div className="w-full h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart data={tempChartData} margin={{ top: 10, right: 20, left: 40, bottom: 40 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis
                                    type="number"
                                    dataKey="x"
                                    domain={[minTemp - 0.5, maxTemp + 0.5]}
                                    label={{ value: 'Temperature (°C)', position: 'insideBottom', offset: -5, fill: '#9CA3AF' }}
                                    stroke="#9CA3AF"
                                    tick={{ fill: '#E5E7EB', fontSize: 11 }}
                                />
                                <YAxis
                                    type="number"
                                    dataKey="y"
                                    reversed={true}
                                    domain={[0, maxDepth * 1.05]}
                                    label={{ value: 'Depth (m)', angle: -90, position: 'insideLeft', fill: '#9CA3AF', style: { textAnchor: 'middle' } }}
                                    stroke="#9CA3AF"
                                    tick={{ fill: '#E5E7EB', fontSize: 11 }}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px', color: '#E5E7EB' }}
                                    formatter={() => []}
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length > 0) {
                                            const data = payload[0].payload;
                                            return (
                                                <div className="bg-gray-800 border border-gray-600 rounded p-2 text-xs">
                                                    <p className="text-orange-400">{`${data.temperature.toFixed(2)}°C`}</p>
                                                    <p className="text-blue-400">{`${data.depth.toFixed(1)}m`}</p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Scatter dataKey="x" fill="#F97316" line={{ stroke: '#F97316', strokeWidth: 2 }} lineType="joint" />
                            </ScatterChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Salinity Chart */}
                <div className="bg-gray-800/70 p-4 rounded-xl border border-gray-700">
                    <div className="flex items-center gap-2 mb-3">
                        <Waves className="w-4 h-4 text-blue-400" />
                        <h5 className="text-sm font-semibold text-blue-400">Salinity vs Depth</h5>
                    </div>
                    
                    <div className="w-full h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart data={salinityChartData} margin={{ top: 10, right: 20, left: 40, bottom: 40 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis
                                    type="number"
                                    dataKey="x"
                                    domain={[minSalinity - 0.1, maxSalinity + 0.1]}
                                    label={{ value: 'Salinity (PSU)', position: 'insideBottom', offset: -5, fill: '#9CA3AF' }}
                                    stroke="#9CA3AF"
                                    tick={{ fill: '#E5E7EB', fontSize: 11 }}
                                />
                                <YAxis
                                    type="number"
                                    dataKey="y"
                                    reversed={true}
                                    domain={[0, maxDepth * 1.05]}
                                    label={{ value: 'Depth (m)', angle: -90, position: 'insideLeft', fill: '#9CA3AF', style: { textAnchor: 'middle' } }}
                                    stroke="#9CA3AF"
                                    tick={{ fill: '#E5E7EB', fontSize: 11 }}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px', color: '#E5E7EB' }}
                                    formatter={() => []}
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length > 0) {
                                            const data = payload[0].payload;
                                            return (
                                                <div className="bg-gray-800 border border-gray-600 rounded p-2 text-xs">
                                                    <p className="text-blue-400">{`${data.salinity.toFixed(2)} PSU`}</p>
                                                    <p className="text-blue-400">{`${data.depth.toFixed(1)}m`}</p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Scatter dataKey="x" fill="#3B82F6" line={{ stroke: '#3B82F6', strokeWidth: 2 }} lineType="joint" />
                            </ScatterChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Main Component ---
const OceanDataChatInterface: React.FC = () => {
    const [sessions, setSessions] = useState<ChatSession[]>(getInitialSessions);
    const [activeSessionIndex, setActiveSessionIndex] = useState(0);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const chatEndRef = useRef<HTMLDivElement>(null);

    const activeSession = useMemo(() => sessions[activeSessionIndex] || sessions[0], [sessions, activeSessionIndex]);

    useEffect(() => { 
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); 
    }, [activeSession.history]);

    // Session Handlers
    const handleNewChat = () => {
        const newSession: ChatSession = { 
            id: generateSessionId(),
            name: `Chat ${sessions.length + 1}`, 
            history: [],
            createdAt: new Date()
        };
        setSessions(prev => [...prev, newSession]);
        setActiveSessionIndex(sessions.length);
        setInput('');
    };

    const handleSelectChat = (index: number) => {
        setActiveSessionIndex(index);
    };

    const handleBackHome = () => {
        window.location.href = '/'; // Redirect to home page
    };

    const handleQuery = async (query: string) => {
        if (!query.trim() || isLoading) return;

        const historyToSend = activeSession.history.map(msg => ({
            role: msg.role,
            content: msg.content,
        }));

        const userMessage: ChatMessage = { role: 'user', content: query };

        // Optimistically update history with user message
        const newHistoryWithUser = [...activeSession.history, userMessage];
        setSessions(sessions.map((s, i) => i === activeSessionIndex ? { ...s, history: newHistoryWithUser } : s));

        setInput('');
        setIsLoading(true);

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    query: query, 
                    n_results: 5,
                    chat_history: historyToSend,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API returned status ${response.status}: ${errorText.substring(0, 100)}...`);
            }
            
            const data: QueryResponse = await response.json();

            const assistantMessage: ChatMessage = {
                role: 'assistant',
                content: data.gemini_summary,
                rawResponse: data,
            };

            // Update state with API response
            setSessions(prevSessions => prevSessions.map((s, i) => 
                i === activeSessionIndex ? { ...s, history: [...s.history.slice(0, -1), userMessage, assistantMessage] } : s
            ));

        } catch (error) {
            console.error('API Error:', error);
            const errorMessage: ChatMessage = {
                content: `Error: Failed to connect to API. Is the FastAPI server running on port 8000? (${error instanceof Error ? error.message : 'Unknown error'})`,
                role: 'assistant',
            };
            setSessions(prevSessions => prevSessions.map((s, i) => 
                i === activeSessionIndex ? { ...s, history: [...s.history.slice(0, -1), userMessage, errorMessage] } : s
            ));
        } finally {
            setIsLoading(false);
        }
    };

    const renderMessage = (msg: ChatMessage, index: number) => {
        const isUser = msg.role === 'user';
        const rawData = msg.rawResponse;

        return (
            <div key={index} className={`flex mb-6 max-w-5xl mx-auto w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${isUser ? 'ml-2 bg-blue-500 order-2' : 'mr-3 bg-gradient-to-r from-cyan-500 to-blue-500 order-1'}`}>
                    {isUser ? <Search className='w-4 h-4'/> : <Activity className='w-4 h-4'/>}
                </div>
                
                <div className={`p-4 rounded-xl shadow-lg max-w-[85%] transition duration-300 ${
                    isUser
                        ? 'bg-gray-800/70 border border-gray-700 text-gray-200 rounded-br-none order-1'
                        : 'bg-gray-800/70 border border-gray-700 rounded-bl-none order-2 text-white'
                }`}>
                    
                    {isUser && <p className='whitespace-pre-wrap text-sm'>{msg.content}</p>}

                    {!isUser && rawData && (
                        <div className="space-y-6">
                            
                            {/* 1. AI SUMMARY FIRST */}
                            <div>
                                <h3 className="text-md font-bold text-primary4 border-b border-gray-700 pb-1 mb-3 flex items-center gap-2">
                                    <MessageCircle className='w-4 h-4'/>Floatchat Summary
                                </h3>
                                <p className="whitespace-pre-wrap text-gray-200 text-sm leading-relaxed">{msg.content}</p>
                            </div>

                            {/* 2. CHARTS SECOND (if available) */}
                            {(rawData.plot_data_points && rawData.plot_data_points.length > 0) && (
                                <div className="p-4 bg-gray-900/50 border border-gray-700 rounded-lg">
                                    <ChartDisplay 
                                        data={rawData.plot_data_points} 
                                        platformId={rawData.raw_matches[0]?.platform_number || 'N/A'}
                                    />
                                </div>
                            )}

                            {/* 3. RAW PLATFORM DATA THIRD */}
                            <details className="p-3 bg-gray-900/50 border border-gray-700 rounded-lg group">
                                <summary className="font-semibold text-sm cursor-pointer text-blue-400 hover:text-blue-200 transition">
                                    Platform Data & Context ({rawData.raw_matches.length} Matches)
                                </summary>
                                
                                <div className="mt-4 space-y-3">
                                    {rawData.raw_matches.length > 0 ? (
                                        rawData.raw_matches.map((match, i) => (
                                            <ThemedMatchDisplay key={i} match={match} />
                                        ))
                                    ) : (
                                        <p className="text-sm text-gray-500">No platform matches found.</p>
                                    )}
                                </div>

                                <h4 className="mt-4 text-sm font-semibold text-gray-300">Raw Context:</h4>
                                <pre className="mt-2 p-3 text-xs bg-gray-900 rounded-md overflow-x-auto whitespace-pre-wrap max-h-32 text-gray-400 border border-gray-700">
                                    {rawData.llm_context}
                                </pre>
                            </details>

                            {/* Quick Action Buttons */}
                            {rawData.raw_matches.length > 0 && (
                                <QuickActions onQuery={handleQuery} />
                            )}
                        </div>
                    )}
                    {!isUser && !rawData && (
                        <p className="font-medium text-red-400 text-sm" dangerouslySetInnerHTML={{ __html: msg.content }} />
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="flex h-screen bg-primary3 text-white font-sans">
            
            {/* LEFT SIDEBAR */}
            <div className={`flex flex-col bg-primary3 border-r border-gray-700 shadow-2xl transition-all duration-300 ${isSidebarOpen ? 'w-80' : 'w-20'}`}>
                
                {/* Header */}
                <div className="p-4 border-b border-gray-700 flex justify-between items-center flex-shrink-0">
                    {isSidebarOpen && <h2 className="text-lg font-bold text-white">FloatChat AI</h2>}
                    <button 
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className={`p-2 rounded-full hover:bg-gray-700 transition duration-300 ${isSidebarOpen ? 'text-gray-400' : 'text-cyan-400'}`}
                        title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
                    >
                        <LayoutPanelLeft className={`w-5 h-5 transition-transform ${isSidebarOpen ? 'rotate-0' : 'rotate-180'}`} />
                    </button>
                </div>

                {/* New Chat Button */}
                {isSidebarOpen && (
                    <div className="p-4 flex-shrink-0">
                        <button 
                            onClick={handleNewChat}
                            className="w-full py-2 bg-gray-700 rounded-lg text-sm font-semibold flex items-center justify-center transition duration-300 transform hover:scale-[1.02]"
                        >
                            <Plus className="w-4 h-4 mr-1" />
                            New Chat
                        </button>
                    </div>
                )}
                
                {/* Chat Sessions */}
                <div className={`flex-grow overflow-y-auto ${isSidebarOpen ? 'px-4' : 'px-1'} space-y-2 pb-4`}>
                    {isSidebarOpen && <p className="pt-2 text-sm font-bold text-gray-400">RECENT CHATS</p>}
                    {sessions.map((session, index) => (
                        <button
                            key={session.id}
                            onClick={() => handleSelectChat(index)}
                            className={`w-full text-left p-2 rounded-md transition duration-150 text-sm ${isSidebarOpen ? 'truncate' : 'flex items-center justify-center' } ${
                                index === activeSessionIndex 
                                    ? 'bg-gray-700 text-white font-semibold shadow-inner ' 
                                    : 'hover:bg-gray-700 text-gray-300'
                            }`}
                            title={session.name}
                        >
                            {isSidebarOpen ? session.name : <MessageCircle className='w-5 h-5 text-cyan-400' />}
                        </button>
                    ))}
                </div>

                {/* Back to Home Button */}
                <div className="p-4 border-t border-gray-700 flex-shrink-0">
                    <button 
                        onClick={handleBackHome}
                        className={`${isSidebarOpen ? 'w-full' : 'w-12'} py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-semibold flex items-center justify-center transition duration-300`}
                    >
                        <Home className="w-4 h-4" />
                        {isSidebarOpen && <span className="ml-2">Back to Home</span>}
                    </button>
                </div>
            </div>

            {/* MAIN CHAT AREA */}
            <div className="flex flex-col flex-grow bg-gray-900">
                
                {/* Chat History Display */}
                <div className="flex-grow p-6 overflow-y-auto bg-gray-900/95 backdrop-blur-sm">
                    {activeSession.history.length === 0 && (
                        <div className="p-8 text-center text-gray-500 mt-20">
                            <h1 className="text-5xl  font-unbounded font-bold text-white mb-4">
                                FloatChat AI
                            </h1>
                            <p className="mb-4 text-lg font-light text-gray-300">
                                Explore Argo oceanographic data with AI-powered search and visualization.
                            </p>
                            <p className="text-sm mb-6 max-w-xl mx-auto text-gray-400">
                                Ask questions about ocean temperatures, salinity profiles, or request data visualizations.
                            </p>
                            <QuickActions onQuery={handleQuery} />
                        </div>
                    )}
                    {activeSession.history.map(renderMessage)}
                    
                    {isLoading && (
                        <div className="flex justify-start mb-4 max-w-4xl mx-auto w-full">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 mr-3 order-1 flex items-center justify-center">
                                <Activity className='w-4 h-4 text-white'/>
                            </div>
                            <div className="p-4 bg-gray-800/70 border border-gray-700 rounded-xl rounded-bl-none shadow-md order-2 max-w-[85%]">
                                <p className="animate-pulse text-cyan-400 flex items-center gap-2 text-sm">
                                    <Loader2 className='w-4 h-4 animate-spin'/> Analyzing ocean data and generating insights...
                                </p>
                            </div>
                        </div>
                    )}
                    <div ref={chatEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-6 pb-10 flex-shrink-0">
                    <div className="flex justify-center">
                        <div className="w-full max-w-4xl flex items-center p-2 rounded-4xl shadow-xl bg-white transition duration-300">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleQuery(input)}
                                placeholder="Ask about ocean data: 'plot temperature profile', 'show data from 2024', etc..."
                                disabled={isLoading}
                                className="flex-grow p-1 px-3 focus:outline-none disabled:bg-white  text-base bg-transparent text-gray-800 placeholder-gray-500"
                            />
                            <button 
                                onClick={() => handleQuery(input)} 
                                disabled={isLoading || !input.trim()}
                                className="w-10 h-10 flex items-center justify-center bg-white text-black cursor-pointer rounded-full  transition duration-300 disabled:bg-gray-600 disabled:opacity-50 transform hover:scale-105"
                                title="Send Query"
                            >
                                <Search className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                   
                </div>
            </div>
        </div>
    );
};

export default OceanDataChatInterface;