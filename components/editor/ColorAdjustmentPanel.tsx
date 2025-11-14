

import React, { useState, useEffect } from 'react';
// FIX: Import fabric types
import type { fabric } from 'fabric';
import type { ColorAdjustmentController } from '../../services/editorControllers';

interface ColorAdjustmentPanelProps {
    controllers: { color: ColorAdjustmentController };
    activeObject: fabric.Object | null;
}

const Slider: React.FC<{ label: string; value: number; onChange: (val: number) => void; min: number; max: number; step: number; disabled: boolean }> = 
({ label, value, onChange, min, max, step, disabled }) => (
    <div>
        <label className="block text-xs font-medium text-gray-400 mb-1">{label}</label>
        <div className="flex items-center gap-2">
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                disabled={disabled}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500 disabled:opacity-50"
            />
            <span className="text-xs w-10 text-right">{Math.round(value * (label === 'Hue' ? 1 : 100))}</span>
        </div>
    </div>
);


export const ColorAdjustmentPanel: React.FC<ColorAdjustmentPanelProps> = ({ controllers, activeObject }) => {
    const [hue, setHue] = useState(0);
    const [saturation, setSaturation] = useState(0);
    const [brightness, setBrightness] = useState(0);
    const [contrast, setContrast] = useState(0);

    const isImage = activeObject?.type === 'image';

    const applyAdjustments = () => {
        if (!isImage) return;
        controllers.color.applyAdjustments(activeObject as fabric.Image, { hue, saturation, brightness, contrast });
    };
    
    const reset = () => {
        setHue(0);
        setSaturation(0);
        setBrightness(0);
        setContrast(0);
        if (isImage) {
            controllers.color.clearFilters(activeObject as fabric.Image);
        }
    };
    
    useEffect(reset, [activeObject]);

    return (
        <div className="p-4 space-y-4 text-sm">
            {!isImage && <p className="text-gray-500 text-xs text-center p-4">Select an image to see color adjustments.</p>}
            
            <Slider label="Hue" value={hue} onChange={setHue} min={-180} max={180} step={1} disabled={!isImage} />
            <Slider label="Saturation" value={saturation} onChange={setSaturation} min={-1} max={1} step={0.01} disabled={!isImage} />
            <Slider label="Brightness" value={brightness} onChange={setBrightness} min={-1} max={1} step={0.01} disabled={!isImage} />
            <Slider label="Contrast" value={contrast} onChange={setContrast} min={-1} max={1} step={0.01} disabled={!isImage} />

            <div className="pt-2">
                 <button onClick={applyAdjustments} disabled={!isImage} className="w-full px-4 py-2 text-xs font-bold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-600">
                    Apply Adjustments
                </button>
            </div>
            
            <div className="border-t border-gray-700 pt-4 space-y-2">
                 <h4 className="text-xs font-bold text-gray-400 uppercase">Presets</h4>
                 <div className="grid grid-cols-2 gap-2">
                     <button onClick={() => isImage && controllers.color.grayscale(activeObject as fabric.Image)} disabled={!isImage} className="px-2 py-2 text-xs text-white bg-gray-700 rounded-md hover:bg-gray-600 disabled:opacity-50">Grayscale</button>
                     <button onClick={() => isImage && controllers.color.sepia(activeObject as fabric.Image)} disabled={!isImage} className="px-2 py-2 text-xs text-white bg-gray-700 rounded-md hover:bg-gray-600 disabled:opacity-50">Sepia</button>
                     <button onClick={() => isImage && controllers.color.invert(activeObject as fabric.Image)} disabled={!isImage} className="px-2 py-2 text-xs text-white bg-gray-700 rounded-md hover:bg-gray-600 disabled:opacity-50">Invert</button>
                     <button onClick={() => isImage && controllers.color.vintageEffect(activeObject as fabric.Image)} disabled={!isImage} className="px-2 py-2 text-xs text-white bg-gray-700 rounded-md hover:bg-gray-600 disabled:opacity-50">Vintage</button>
                 </div>
            </div>

            <div className="border-t border-gray-700 pt-4">
                 <button onClick={reset} disabled={!isImage} className="w-full px-4 py-2 text-xs font-bold text-white bg-red-600/50 rounded-md hover:bg-red-600/80 disabled:bg-gray-600">
                    Reset All
                </button>
            </div>

        </div>
    );
};