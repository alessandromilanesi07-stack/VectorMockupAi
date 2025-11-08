
import React, { useState, useCallback } from 'react';
import { generateWithThinking } from '../services/geminiService';
import { Spinner } from './Spinner';

export const ThinkingMode: React.FC = () => {
    const [prompt, setPrompt] = useState<string>('');
    const [response, setResponse] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = useCallback(async () => {
        if (!prompt) {
            setError('Please enter a prompt.');
            return;
        }

        setLoading(true);
        setError(null);
        setResponse('');

        try {
            const result = await generateWithThinking(prompt);
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
                <h2 className="text-3xl font-extrabold text-white sm:text-4xl">Thinking Mode</h2>
                <p className="mt-4 text-lg text-gray-400">Tackle your most complex problems with Gemini 2.5 Pro's advanced reasoning capabilities.</p>
            </div>

            <div className="bg-gray-800 p-8 rounded-xl shadow-2xl space-y-6">
                <div>
                    <label htmlFor="think-prompt" className="block text-sm font-medium text-gray-300 mb-2">Your Complex Query</label>
                    <textarea
                        id="think-prompt"
                        rows={6}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="e.g., 'Develop a comprehensive business plan for a sustainable energy startup focusing on tidal power...'"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                    />
                </div>
                 <div className="text-center">
                     <button
                        onClick={handleSubmit}
                        disabled={loading || !prompt}
                        className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? <Spinner /> : 'Engage AI'}
                    </button>
                </div>
            </div>

            {error && <div className="bg-red-900/50 text-red-300 p-4 rounded-lg text-center">{error}</div>}

            {loading && <div className="text-center text-lg text-gray-300">AI is thinking deeply... This might take a moment.</div>}

            {response && (
                <div className="bg-gray-800 p-6 rounded-xl shadow-2xl">
                    <h3 className="text-xl font-bold mb-4">AI Response</h3>
                    <div className="prose prose-invert max-w-none text-gray-300 whitespace-pre-wrap">{response}</div>
                </div>
            )}
        </div>
    );
};
