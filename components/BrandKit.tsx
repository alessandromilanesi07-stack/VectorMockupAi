import React, { useState, useCallback } from 'react';
import { extractBrandKit } from '../services/geminiService';
import { Spinner } from './Spinner';
import type { BrandKitData } from '../types';

const ColorSwatch: React.FC<{ color?: string; name: string }> = ({ color, name }) => (
    <div className="flex flex-col items-center space-y-2">
        <div 
            className="w-16 h-16 rounded-full border-2 border-gray-500 bg-gray-700 flex items-center justify-center" 
            style={{ backgroundColor: color || undefined }}
        >
            {!color && <span className="text-gray-400 text-xs">N/A</span>}
        </div>
        <div className="text-center">
            <p className="font-medium text-sm text-white">{name}</p>
            <p className="font-mono text-xs text-gray-400">{color || 'Not found'}</p>
        </div>
    </div>
);

export const BrandKit: React.FC = () => {
    const [url, setUrl] = useState<string>('');
    const [brandKit, setBrandKit] = useState<BrandKitData | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = useCallback(async () => {
        if (!url) {
            setError('Please enter a website URL.');
            return;
        }

        setLoading(true);
        setError(null);
        setBrandKit(null);

        try {
            // A simple check for a valid-looking URL
            const fullUrl = url.startsWith('http') ? url : `https://${url}`;
            const result = await extractBrandKit(fullUrl);
            setBrandKit(result);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to extract brand kit. The website may be inaccessible or the format is not recognized.');
        } finally {
            setLoading(false);
        }
    }, [url]);

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center">
                <h2 className="text-3xl font-extrabold text-white sm:text-4xl">Brand Kit Extractor</h2>
                <p className="mt-4 text-lg text-gray-400">Instantly generate a brand kit from any website URL.</p>
            </div>

            <div className="bg-gray-800 p-8 rounded-xl shadow-2xl space-y-6">
                <div className="relative">
                    <input
                        type="text"
                        className="w-full bg-gray-700 border border-gray-600 rounded-full py-3 pl-5 pr-32 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., google.com"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                    />
                    <button
                        onClick={handleSubmit}
                        disabled={loading || !url}
                        className="absolute inset-y-0 right-0 flex items-center justify-center px-6 my-1.5 mr-1.5 text-sm font-medium rounded-full text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500"
                    >
                        {loading ? <Spinner /> : 'Extract'}
                    </button>
                </div>
            </div>

            {error && <div className="bg-red-900/50 text-red-300 p-4 rounded-lg text-center">{error}</div>}

            {loading && <div className="text-center text-lg text-gray-300">Analyzing website...</div>}

            {brandKit && (
                <div className="bg-gray-800 p-6 rounded-xl shadow-2xl space-y-8">
                    <div>
                        <h3 className="text-xl font-bold mb-6 text-center text-white">Color Palette</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 justify-items-center">
                            <ColorSwatch color={brandKit.colors?.primary} name="Primary" />
                            <ColorSwatch color={brandKit.colors?.secondary} name="Secondary" />
                            <ColorSwatch color={brandKit.colors?.accent} name="Accent" />
                            <ColorSwatch color={brandKit.colors?.neutral} name="Neutral" />
                        </div>
                    </div>
                    <div className="border-t border-gray-700 my-6"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-xl font-bold mb-4 text-white">Typography</h3>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-sm text-gray-400">Heading Font</p>
                                    <p className="text-lg font-semibold text-white">{brandKit.fonts?.heading || 'Not found'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400">Body Font</p>
                                    <p className="text-lg font-semibold text-white">{brandKit.fonts?.body || 'Not found'}</p>
                                </div>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold mb-4 text-white">Logo Description</h3>
                            <p className="text-gray-300">{brandKit.logoDescription || 'No description could be generated.'}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};