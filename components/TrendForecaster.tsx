import React, { useState, useCallback } from 'react';
import { generateTrendReport } from '../services/geminiService';
import { Spinner } from './Spinner';

export const TrendForecaster: React.FC = () => {
    const [topic, setTopic] = useState<string>('Streetwear trends for Summer 2025');
    const [report, setReport] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = useCallback(async () => {
        if (!topic) {
            setError('Please enter a topic to analyze.');
            return;
        }

        setLoading(true);
        setError(null);
        setReport('');

        try {
            const result = await generateTrendReport(topic);
            setReport(result);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'An unknown error occurred.');
        } finally {
            setLoading(false);
        }
    }, [topic]);

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center">
                <h2 className="text-3xl font-extrabold text-white sm:text-4xl">AI Trend Forecaster</h2>
                <p className="mt-4 text-lg text-gray-400">Get a competitive edge with AI-powered market analysis.</p>
            </div>

            <div className="bg-gray-800 p-8 rounded-xl shadow-2xl space-y-6">
                <div>
                    <label htmlFor="trend-topic" className="block text-sm font-medium text-gray-300 mb-2">Market or Topic to Analyze</label>
                    <input
                        id="trend-topic"
                        type="text"
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="e.g., 'Gorpcore color palettes for FW25'"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                    />
                </div>
                 <div className="text-center">
                     <button
                        onClick={handleSubmit}
                        disabled={loading || !topic}
                        className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? <Spinner /> : 'Analyze Trends'}
                    </button>
                </div>
            </div>

            {error && <div className="bg-red-900/50 text-red-300 p-4 rounded-lg text-center">{error}</div>}

            {loading && 
                <div className="text-center p-8">
                    <Spinner large={true} />
                    <p className="mt-4 text-lg text-gray-300">Scanning the web for the latest trends... This may take a moment.</p>
                </div>
            }

            {report && (
                <div className="bg-gray-800 p-6 rounded-xl shadow-2xl">
                    <h3 className="text-xl font-bold mb-4 text-white">Trend Report: {topic}</h3>
                    <div className="prose prose-invert max-w-none text-gray-300 whitespace-pre-wrap">{report}</div>
                </div>
            )}
        </div>
    );
};
