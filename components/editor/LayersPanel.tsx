
import React, { useState, useEffect, useCallback } from 'react';
import type { LayerManager } from '../../services/editorControllers';
import { EyeOpenIcon, EyeClosedIcon, LockIcon, UnlockIcon, TrashIcon, DuplicateIcon } from '../Icons';

interface LayersPanelProps {
    controllers: { layer: LayerManager };
}

interface Layer {
    id: string;
    name: string;
    type: string;
    visible: boolean;
    locked: boolean;
    opacity: number;
    blendMode: string;
    thumbnail: string | null;
    zIndex: number;
}

export const LayersPanel: React.FC<LayersPanelProps> = ({ controllers }) => {
    const [layers, setLayers] = useState<Layer[]>([]);
    const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);

    const updateLayers = useCallback(() => {
        setLayers(controllers.layer.getAllLayers().reverse());
    }, [controllers.layer]);
    
    useEffect(() => {
        const canvas = controllers.layer.canvas;
        
        canvas.on('object:added', updateLayers);
        canvas.on('object:removed', updateLayers);
        canvas.on('object:modified', updateLayers);
        canvas.on('selection:created', (e) => setSelectedLayerId(controllers.layer.getObjectId(e.selected[0])));
        canvas.on('selection:updated', (e) => setSelectedLayerId(controllers.layer.getObjectId(e.selected[0])));
        canvas.on('selection:cleared', () => setSelectedLayerId(null));
        
        updateLayers();
        
        return () => {
            canvas.off('object:added', updateLayers);
            canvas.off('object:removed', updateLayers);
            canvas.off('object:modified', updateLayers);
            canvas.off('selection:created');
            canvas.off('selection:updated');
            canvas.off('selection:cleared');
        };
    }, [controllers.layer, updateLayers]);

    const handleSelectLayer = (layer: Layer) => {
        setSelectedLayerId(layer.id);
        controllers.layer.selectLayer(layer.id);
    };

    return (
        <div className="text-white text-sm">
            <div className="p-2 flex justify-between items-center bg-gray-700/50">
                <h3 className="font-bold">Layers</h3>
                <div className="flex gap-2">
                    <button onClick={() => selectedLayerId && controllers.layer.duplicateLayer(selectedLayerId)} title="Duplicate Layer" className="text-gray-400 hover:text-white disabled:opacity-50" disabled={!selectedLayerId}>
                        <DuplicateIcon className="w-4 h-4" />
                    </button>
                    <button onClick={() => selectedLayerId && window.confirm('Are you sure?') && controllers.layer.deleteLayer(selectedLayerId)} title="Delete Layer" className="text-gray-400 hover:text-white disabled:opacity-50" disabled={!selectedLayerId}>
                        <TrashIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>
            <div className="layers-list space-y-1 p-1">
                {layers.map(layer => (
                    <div
                        key={layer.id}
                        onClick={() => handleSelectLayer(layer)}
                        className={`flex items-center gap-2 p-2 rounded-md cursor-pointer ${selectedLayerId === layer.id ? 'bg-blue-600/30' : 'hover:bg-gray-700'}`}
                    >
                        <div className="w-10 h-10 bg-gray-900/50 border border-gray-600 rounded-md flex items-center justify-center overflow-hidden">
                            {layer.thumbnail && <img src={layer.thumbnail} alt={layer.name} className="max-w-full max-h-full" />}
                        </div>
                        <div className="flex-1 truncate">
                            <input
                                type="text"
                                value={layer.name}
                                onFocus={() => handleSelectLayer(layer)}
                                onChange={(e) => {
                                    controllers.layer.renameLayer(layer.id, e.target.value);
                                    updateLayers();
                                }}
                                className="bg-transparent w-full focus:bg-gray-900 focus:ring-1 focus:ring-blue-500 rounded p-1"
                            />
                        </div>
                        <div className="flex gap-2 text-gray-400">
                           <button onClick={(e) => { e.stopPropagation(); controllers.layer.toggleVisibility(layer.id); updateLayers(); }} title="Toggle Visibility">
                                {layer.visible ? <EyeOpenIcon className="w-4 h-4" /> : <EyeClosedIcon className="w-4 h-4" />}
                           </button>
                           <button onClick={(e) => { e.stopPropagation(); controllers.layer.toggleLock(layer.id); updateLayers(); }} title="Toggle Lock">
                                {layer.locked ? <LockIcon className="w-4 h-4 text-blue-400" /> : <UnlockIcon className="w-4 h-4" />}
                           </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
