import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { editImage } from '../services/geminiService';
import { Spinner } from './Spinner';
import { UploadIcon } from './Icons';
import type { Brand } from '../types';

interface ImageEditorProps {
    imageForEditing: string | null;
    setImageForEditing: (image: string | null) => void;
    activeBrand: Brand | null;
}

const base64ToFile = async (base64: string, filename: string): Promise<File> => {
    const res = await fetch(base64);
    const blob = await res.blob();
    return new File([blob], filename, { type: blob.type });
};


export const ImageEditor: React.FC<ImageEditorProps> = ({ imageForEditing, setImageForEditing, activeBrand }) => {
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [originalImage, setOriginalImage] = useState<string | null>(null);
    const [editedImage, setEditedImage] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Social Post Composer State
    const [backgroundColor, setBackgroundColor] = useState<string>('#111827');
    const [aspectRatio, setAspectRatio] = useState<string>('original');

    useEffect(() => {
        if (imageForEditing) {
            setOriginalImage(imageForEditing);
            base64ToFile(imageForEditing, 'editing.png').then(file => {
                setImageFile(file);
            });
            setEditedImage(null);
            setError(null);
            // Cleanup state so it doesn't re-trigger
            setImageForEditing(null);
        }
    }, [imageForEditing, setImageForEditing]);
    
    const brandColors = useMemo(() => {
        if (!activeBrand) return [];
        const { primary, secondary, accent, neutral } = activeBrand.kit.colors;
        return [primary, secondary, accent, neutral].filter((c): c is string => !!c);
    }, [activeBrand]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setOriginalImage(URL.createObjectURL(file));
            setEditedImage(null);
        }
    };

    const buildEditPrompt = useCallback((): string => {
        const prompts: string[] = [];
        prompts.push("You are an expert social media image editor. You will receive an image of a product on a neutral background.");
        
        prompts.push(`Change the background to a solid color: ${backgroundColor}. Keep the product's original lighting and shadows as much as possible.`);

        if (aspectRatio !== 'original') {
            prompts.push(`Then, crop the resulting image to a ${aspectRatio} aspect ratio, ensuring the main product is perfectly centered and fully visible.`);
        }
        
        prompts.push("The final output should be a clean, professional image ready for a social media post.");

        return prompts.join(' ');
    }, [backgroundColor, aspectRatio]);

    const handleSubmit = useCallback(async () => {
        if (!imageFile) {
            setError('Please upload an image to edit.');
            return;
        }
        
        const prompt = buildEditPrompt();
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
    }, [imageFile, buildEditPrompt]);

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="text-center">
                <h2 className="text-3xl font-extrabold text-white sm:text-4xl">Social Post Composer</h2>
                <p className="mt-4 text-lg text-gray-400">Prepare your mockups for social media. Change backgrounds, crop, and more.</p>
            </div>
            
            {!originalImage && (
                 <div className="w-full max-w-lg mx-auto">
                    <label htmlFor="image-upload" className="w-full flex flex-col items-center justify-center px-4 py-12 bg-gray-800 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors">
                        <UploadIcon />
                        <span className="mt-4 text-lg text-gray-300">Upload an image or create one in the Mockup Studio</span>
                        <input id="image-upload" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                    </label>
                </div>
            )}

            {originalImage && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                    <div className="space-y-6 bg-gray-800 p-6 rounded-xl">
                        <h3 className="text-xl font-bold text-white">Your Image</h3>
                        <img src={originalImage} alt="Original" className="w-full h-auto object-contain rounded-lg shadow-lg bg-gray-700" />
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Background Color</label>
                                <div className="flex items-center gap-2">
                                     <div className="relative w-12 h-12">
                                        <div className="custom-color-picker-wrapper w-12 h-12">
                                            <div className="color-swatch" style={{ backgroundColor: backgroundColor }}></div>
                                            <input type="color" value={backgroundColor} onChange={e => setBackgroundColor(e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {brandColors.map((color, index) => (
                                            <button
                                                key={index}
                                                onClick={() => setBackgroundColor(color)}
                                                className="w-8 h-8 rounded-full border-2 border-gray-600 hover:border-white transition-colors"
                                                style={{ backgroundColor: color }}
                                                title={`Set background to ${color}`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Aspect Ratio</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['original', '1:1', '4:5', '9:16'].map(ratio => (
                                        <button key={ratio} onClick={() => setAspectRatio(ratio)} className={`p-2 rounded-md text-sm transition-colors ${aspectRatio === ratio ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>
                                            {ratio === 'original' ? 'Original' : ratio}
                                            {ratio === '1:1' && <span className="block text-xs text-gray-400">Post</span>}
                                            {ratio === '4:5' && <span className="block text-xs text-gray-400">Portrait</span>}
                                            {ratio === '9:16' && <span className="block text-xs text-gray-400">Story</span>}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                         <button
                            onClick={handleSubmit}
                            disabled={loading || !imageFile}
                            className="w-full btn btn-primary mt-4"
                        >
                            {loading ? <Spinner /> : 'Generate Post'}
                        </button>
                    </div>
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-white">Result</h3>
                        <div className="w-full aspect-square bg-gray-800 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-600">
                           {loading && <Spinner large={true} />}
                           {error && <div className="text-red-400 p-4">{error}</div>}
                           {editedImage && <img src={editedImage} alt="Edited" className="w-full h-auto object-contain rounded-lg" />}
                           {!loading && !error && !editedImage && <div className="text-gray-400">Your edited post will appear here</div>}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
