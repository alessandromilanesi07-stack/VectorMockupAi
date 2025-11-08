import React, { useState, useCallback } from 'react';
import { sketchToMockup } from '../services/geminiService';
import { Spinner } from './Spinner';
import { UploadIcon, PlusIcon } from './Icons';

export const SketchToMockup: React.FC = () => {
    const [sketchFile, setSketchFile] = useState<File | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [prompt, setPrompt] = useState<string>('Create a front-view technical flat sketch of these jeans, in a simple black and white line-art style.');
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSketchFile(file);
            setPreviewImage(URL.createObjectURL(file));
            setResultImage(null);
            setError(null);
        }
    };

    const handleSubmit = useCallback(async () => {
        if (!sketchFile || !prompt) {
            setError('Please upload a sketch and provide a creative prompt.');
            return;
        }

        setLoading(true);
        setError(null);
        setResultImage(null);

        try {
            const result = await sketchToMockup(sketchFile, prompt);
            setResultImage(result);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'An unknown error occurred.');
        } finally {
            setLoading(false);
        }
    }, [sketchFile, prompt]);

    const handleReset = useCallback(() => {
        setSketchFile(null);
        setPreviewImage(null);
        setResultImage(null);
        setError(null);
        setLoading(false);
        setPrompt('Create a front-view technical flat sketch of these jeans, in a simple black and white line-art style.');
        const fileInput = document.getElementById('sketch-upload') as HTMLInputElement;
        if (fileInput) {
            fileInput.value = '';
        }
    }, []);

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="text-center">
                <h2 className="text-3xl font-extrabold text-white sm:text-4xl">Sketch to Mockup</h2>
                <p className="mt-4 text-lg text-gray-400">Transform your rough ideas into polished designs. Upload a sketch and let AI build it.</p>
            </div>
            
            {!previewImage ? (
                 <div className="bg-gray-800 p-8 rounded-xl shadow-2xl">
                    <label htmlFor="sketch-upload" className="w-full flex flex-col items-center justify-center px-4 py-12 bg-gray-700 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors">
                        <UploadIcon />
                        <span className="mt-4 text-lg text-gray-300">Upload your sketch or wireframe</span>
                        <input id="sketch-upload" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                    </label>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                    {/* Left Panel: Sketch + Controls */}
                    <div className="bg-gray-800 p-6 rounded-xl shadow-2xl space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Your Sketch</label>
                            <img src={previewImage} alt="Sketch preview" className="w-full h-auto object-contain rounded-lg shadow-lg bg-gray-700 p-2"/>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="sketch-prompt" className="block text-sm font-medium text-gray-300 mb-2">Creative Direction</label>
                                <textarea
                                    id="sketch-prompt"
                                    rows={5}
                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                    placeholder="e.g., 'Make it a dark mode theme for a music app'"
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                />
                            </div>
                             <button
                                onClick={handleSubmit}
                                disabled={loading || !sketchFile}
                                className="w-full inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
                            >
                                {loading ? <Spinner /> : 'Generate Mockup'}
                            </button>
                        </div>
                    </div>

                    {/* Right Panel: Result */}
                     <div className="bg-gray-800 p-6 rounded-xl shadow-2xl space-y-4">
                        <h3 className="text-lg font-bold text-white text-center">Generated Mockup</h3>
                        <div className="w-full aspect-square bg-gray-900 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-600 overflow-hidden">
                            {loading && (
                                <div className="text-center">
                                    <Spinner large={true} />
                                    <p className="mt-4 text-gray-300">Generating...</p>
                                </div>
                            )}
                            {error && <div className="text-red-400 p-4 text-center">{error}</div>}
                            {resultImage && <img src={resultImage} alt="Generated Mockup" className="w-full h-full object-contain" />}
                            {!loading && !resultImage && !error && <p className="text-gray-400">Your result will appear here.</p>}
                        </div>
                        {resultImage && !loading && (
                            <div className="text-center pt-4 border-t border-gray-700">
                                <button
                                    onClick={handleReset}
                                    className="inline-flex items-center justify-center gap-2 px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
                                >
                                    <PlusIcon />
                                    Create Another Mockup
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};