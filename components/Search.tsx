
import React, { useState, useCallback } from 'react';
import { searchWithGrounding } from '../services/geminiService';
import { Spinner } from './Spinner';
import type { GroundingChunk } from '../types';

export const Search: React.FC = () => {
    const [prompt, setPrompt] = useState<string>('');
    const [response, setResponse] = useState<{ text: string; sources: GroundingChunk[] } | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = useCallback(async () => {
        if (!prompt) {
            setError('Please enter a search query.');
            return;
        }

        setLoading(true);
        setError(null);
        setResponse(null);

        try {
            const result = await searchWithGrounding(prompt);
            setResponse(result);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'An unknown error occurred.');
        } finally {
            setLoading(false);
        }
    }, [prompt]);

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center">
                <h2 className="text-3xl font-extrabold text-white sm:text-4xl">Grounded Search</h2>
                <p className="mt-4 text-lg text-gray-400">Get up-to-date and accurate information, grounded in Google Search.</p>
            </div>

            <div className="bg-gray-800 p-8 rounded-xl shadow-2xl space-y-6">
                <div className="relative">
                    <input
                        type="text"
                        className="custom-input w-full rounded-full py-3 pl-5 pr-28"
                        placeholder="Ask anything..."
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                    />
                    <button
                        onClick={handleSubmit}
                        disabled={loading || !prompt}
                        className="absolute inset-y-0 right-0 my-1.5 mr-1.5 btn btn-primary !rounded-full !px-6"
                    >
                        {loading ? <Spinner /> : 'Search'}
                    </button>
                </div>
            </div>

            {error && <div className="bg-red-900/50 text-red-300 p-4 rounded-lg text-center">{error}</div>}

            {loading && <div className="text-center text-lg text-gray-300">Searching the web for the latest information...</div>}

            {response && (
                <div className="bg-gray-800 p-6 rounded-xl shadow-2xl space-y-6">
                    <div>
                        <h3 className="text-xl font-bold mb-4">Answer</h3>
                        <p className="text-gray-300 whitespace-pre-wrap">{response.text}</p>
                    </div>
                    {response.sources.length > 0 && (
                        <div>
                            <h4 className="text-lg font-semibold mb-3">Sources</h4>
                            <ul className="list-disc list-inside space-y-2">
                                {response.sources.map((source, index) => source.web && (
                                    <li key={index}>
                                        <a href={source.web.uri} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 hover:underline">
                                            {source.web.title || source.web.uri}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
