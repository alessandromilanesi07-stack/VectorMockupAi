
import React, { useState, useCallback } from 'react';
import { editImage } from '../services/geminiService';
import { Spinner } from './Spinner';
import { UploadIcon } from './Icons';

export const ImageEditor: React.FC = () => {
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [prompt, setPrompt] = useState<string>('');
    const [originalImage, setOriginalImage] = useState<string | null>(null);
    const [editedImage, setEditedImage] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setOriginalImage(URL.createObjectURL(file));
            setEditedImage(null);
        }
    };

    const handleSubmit = useCallback(async () => {
        if (!imageFile || !prompt) {
            setError('Please upload an image and provide an edit prompt.');
            return;
        }

        setLoading(true);
        setError(null);
        setEditedImage(null);

        try {
            const result = await editImage(imageFile, prompt);
            setEditedImage(result);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'An unknown error occurred.');
        } finally {
            setLoading(false);
        }
    }, [imageFile, prompt]);

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="text-center">
                <h2 className="text-3xl font-extrabold text-white sm:text-4xl">AI Image Editor</h2>
                <p className="mt-4 text-lg text-gray-400">Describe your desired changes and let AI do the work.</p>
            </div>
            
            {!originalImage && (
                 <div className="w-full max-w-lg mx-auto">
                    <label htmlFor="image-upload" className="w-full flex flex-col items-center justify-center px-4 py-12 bg-gray-800 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors">
                        <UploadIcon />
                        <span className="mt-4 text-lg text-gray-300">Upload an image to start editing</span>
                        <input id="image-upload" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                    </label>
                </div>
            )}

            {originalImage && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-white">Your Image</h3>
                        <img src={originalImage} alt="Original" className="w-full h-auto object-contain rounded-lg shadow-lg" />
                        <label htmlFor="prompt" className="block text-sm font-medium text-gray-300">Edit Prompt</label>
                        <input
                            type="text"
                            id="prompt"
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="e.g., 'Add a retro filter' or 'Make the sky purple'"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                        />
                         <button
                            onClick={handleSubmit}
                            disabled={loading || !imageFile || !prompt}
                            className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500"
                        >
                            {loading ? <Spinner /> : 'Apply Edit'}
                        </button>
                    </div>
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-white">Edited Image</h3>
                        <div className="w-full aspect-square bg-gray-800 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-600">
                           {loading && <Spinner large={true} />}
                           {error && <div className="text-red-400 p-4">{error}</div>}
                           {editedImage && <img src={editedImage} alt="Edited" className="w-full h-auto object-contain rounded-lg shadow-lg" />}
                           {!loading && !error && !editedImage && <div className="text-gray-400">Your edited image will appear here</div>}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
