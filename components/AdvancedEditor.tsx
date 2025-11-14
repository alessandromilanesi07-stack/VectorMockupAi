

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { fabric } from 'fabric';
import type { Brand } from '../types';
import { LayersPanel } from './editor/LayersPanel';
import { TransformToolbar } from './editor/TransformToolbar';
import { ColorAdjustmentPanel } from './editor/ColorAdjustmentPanel';
import { TextPanel } from './editor/TextPanel';
import { ExportPanel } from './editor/ExportPanel';
import { Spinner } from './Spinner';
import { LayersIcon, AdjustmentsIcon, TextIcon, ExportIcon, UploadIcon, ShapeIcon } from './Icons';

// Import controllers
import { 
    LayerManager, 
    TransformController, 
    ColorAdjustmentController, 
    TextController, 
    ClippingMaskController, 
    ExportController 
} from '../services/editorControllers';


interface AdvancedEditorProps {
    imageForEditing: string | null;
    setImageForEditing: (image: string | null) => void;
    activeBrand: Brand | null;
}

export const AdvancedEditor: React.FC<AdvancedEditorProps> = ({ imageForEditing, setImageForEditing, activeBrand }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
    const [controllers, setControllers] = useState<any>(null);

    const [loading, setLoading] = useState(true);
    const [leftPanel, setLeftPanel] = useState<'layers' | 'adjustments'>('layers');
    const [rightPanel, setRightPanel] = useState<'text' | 'export'>('text');
    const [activeObject, setActiveObject] = useState<fabric.Object | null>(null);
    const [canvasSize, setCanvasSize] = useState({ width: 1000, height: 1200 });

    const updateActiveObject = useCallback(() => {
        setActiveObject(fabricCanvasRef.current?.getActiveObject() || null);
    }, []);

    // Initialize Fabric canvas
    useEffect(() => {
        if (!canvasRef.current) return;

        const canvas = new fabric.Canvas(canvasRef.current, {
            width: canvasSize.width,
            height: canvasSize.height,
            backgroundColor: '#1f2937',
            preserveObjectStacking: true,
            selection: true
        });
        fabricCanvasRef.current = canvas;

        // Initialize controllers
        setControllers({
            layer: new LayerManager(canvas),
            transform: new TransformController(canvas),
            color: new ColorAdjustmentController(canvas),
            text: new TextController(canvas),
            mask: new ClippingMaskController(canvas),
            export: new ExportController(canvas),
        });

        if (imageForEditing) {
            fabric.Image.fromURL(imageForEditing, (img) => {
                img.scaleToWidth(canvas.getWidth() * 0.8);
                canvas.add(img);
                canvas.centerObject(img);
                img.setCoords();
                canvas.renderAll();
                setImageForEditing(null); // Clear the image prop
            });
        }

        setLoading(false);

        // Event listeners
        canvas.on('selection:created', updateActiveObject);
        canvas.on('selection:updated', updateActiveObject);
        canvas.on('selection:cleared', updateActiveObject);
        canvas.on('object:modified', updateActiveObject);

        return () => {
            canvas.dispose();
        };
    }, [imageForEditing, setImageForEditing, updateActiveObject]);
    
    // Effect for resizing canvas
    useEffect(() => {
        if (fabricCanvasRef.current) {
            fabricCanvasRef.current.setDimensions({ 
                width: canvasSize.width, 
                height: canvasSize.height 
            });
            fabricCanvasRef.current.renderAll();
        }
    }, [canvasSize]);

    const handleGraphicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !fabricCanvasRef.current) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
          fabric.Image.fromURL(event.target?.result as string, (img) => {
            img.scaleToWidth(fabricCanvasRef.current!.getWidth() * 0.5);
            fabricCanvasRef.current!.add(img);
            fabricCanvasRef.current!.centerObject(img);
            img.setCoords();
            fabricCanvasRef.current!.setActiveObject(img);
            fabricCanvasRef.current!.renderAll();
          });
        };
        reader.readAsDataURL(file);
    };

    return (
        <div className="flex flex-col h-full bg-gray-900 text-white rounded-lg overflow-hidden">
            {/* Top Toolbar */}
            <header className="bg-gray-800 p-2 flex justify-between items-center border-b border-gray-700">
                <div className="flex items-center gap-4">
                    <h2 className="text-lg font-bold">Advanced Editor</h2>
                    <div className="flex items-center gap-2 text-sm text-gray-400 border-l border-gray-700 pl-4">
                        <span>Canvas:</span>
                        <label htmlFor="canvas-width" className="sr-only">Width</label>
                        <input
                            id="canvas-width"
                            type="number"
                            value={canvasSize.width}
                            onChange={(e) => setCanvasSize(s => ({ ...s, width: Math.max(100, Number(e.target.value)) }))}
                            className="w-20 bg-gray-900 border border-gray-600 rounded-md p-1 text-xs text-white"
                            aria-label="Canvas Width"
                        />
                        <span>&times;</span>
                        <label htmlFor="canvas-height" className="sr-only">Height</label>
                        <input
                            id="canvas-height"
                            type="number"
                            value={canvasSize.height}
                            onChange={(e) => setCanvasSize(s => ({ ...s, height: Math.max(100, Number(e.target.value)) }))}
                            className="w-20 bg-gray-900 border border-gray-600 rounded-md p-1 text-xs text-white"
                            aria-label="Canvas Height"
                        />
                        <span>px</span>
                    </div>
                </div>
                <div className="flex-1">
                    {controllers && <TransformToolbar controllers={controllers} activeObject={activeObject} />}
                </div>
                <div className="flex items-center gap-2">
                    <input id="graphic-upload" type="file" accept="image/*" onChange={handleGraphicUpload} className="hidden" />
                    <label htmlFor="graphic-upload" className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-700 hover:bg-gray-600 rounded-md cursor-pointer">
                        <UploadIcon className="w-4 h-4 text-white"/> Upload
                    </label>
                     <button onClick={() => controllers?.text.addText('Your Text')} className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-700 hover:bg-gray-600 rounded-md">
                        <TextIcon className="w-4 h-4" /> Text
                    </button>
                </div>
            </header>

            {/* Main Editor Area */}
            <div className="flex flex-1 overflow-hidden">
                {/* Left Sidebar */}
                <aside className="w-72 bg-gray-800 flex flex-col border-r border-gray-700">
                    <div className="flex border-b border-gray-700">
                        <button onClick={() => setLeftPanel('layers')} className={`flex-1 p-3 text-sm flex items-center justify-center gap-2 ${leftPanel === 'layers' ? 'bg-gray-900 text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:bg-gray-700'}`}>
                            <LayersIcon className="w-5 h-5"/> Layers
                        </button>
                        <button onClick={() => setLeftPanel('adjustments')} className={`flex-1 p-3 text-sm flex items-center justify-center gap-2 ${leftPanel === 'adjustments' ? 'bg-gray-900 text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:bg-gray-700'}`}>
                           <AdjustmentsIcon className="w-5 h-5"/> Adjustments
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {controllers && leftPanel === 'layers' && <LayersPanel controllers={controllers} />}
                        {controllers && leftPanel === 'adjustments' && <ColorAdjustmentPanel controllers={controllers} activeObject={activeObject} />}
                    </div>
                </aside>

                {/* Center Canvas */}
                <main className="flex-1 flex items-center justify-center bg-gray-900 p-4 relative overflow-auto">
                    {loading ? <Spinner large /> : <canvas ref={canvasRef} />}
                </main>

                {/* Right Sidebar */}
                 <aside className="w-72 bg-gray-800 flex flex-col border-l border-gray-700">
                    <div className="flex border-b border-gray-700">
                        <button onClick={() => setRightPanel('text')} className={`flex-1 p-3 text-sm flex items-center justify-center gap-2 ${rightPanel === 'text' ? 'bg-gray-900 text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:bg-gray-700'}`}>
                            <TextIcon className="w-5 h-5"/> Text
                        </button>
                         <button onClick={() => setRightPanel('export')} className={`flex-1 p-3 text-sm flex items-center justify-center gap-2 ${rightPanel === 'export' ? 'bg-gray-900 text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:bg-gray-700'}`}>
                           <ExportIcon className="w-5 h-5"/> Export
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {controllers && rightPanel === 'text' && <TextPanel controllers={controllers} activeObject={activeObject} />}
                        {controllers && rightPanel === 'export' && <ExportPanel controllers={controllers} />}
                    </div>
                </aside>
            </div>
        </div>
    );
};
