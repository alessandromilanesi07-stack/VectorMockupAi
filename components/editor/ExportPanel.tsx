
import React, { useState } from 'react';
import type { ExportController } from '../../services/editorControllers';

interface ExportPanelProps {
    controllers: { export: ExportController };
}

export const ExportPanel: React.FC<ExportPanelProps> = ({ controllers }) => {
    const [format, setFormat] = useState('png');
    const [multiplier, setMultiplier] = useState(1);

    const handleExport = () => {
        const filename = `vectocraft-export-${Date.now()}`;
        if (format === 'png') {
            controllers.export.exportPNG({ multiplier, filename: `${filename}.png` });
        } else if (format === 'svg') {
            controllers.export.exportSVG(`${filename}.svg`);
        } else if (format === 'json') {
            controllers.export.exportJSON(`${filename}.json`);
        }
    };

    return (
        <div className="p-4 space-y-4 text-sm">
            <div>
                <label htmlFor="format" className="text-xs font-medium text-gray-400">Format</label>
                <select id="format" value={format} onChange={e => setFormat(e.target.value)} className="w-full mt-1 bg-gray-700 border border-gray-600 rounded-md p-2 text-xs">
                    <option value="png">PNG</option>
                    <option value="svg">SVG</option>
                    <option value="json">JSON (Project File)</option>
                </select>
            </div>

            {format === 'png' && (
                <div>
                    <label htmlFor="resolution" className="text-xs font-medium text-gray-400">Resolution</label>
                     <select id="resolution" value={multiplier} onChange={e => setMultiplier(Number(e.target.value))} className="w-full mt-1 bg-gray-700 border border-gray-600 rounded-md p-2 text-xs">
                        <option value="1">1x (Standard)</option>
                        <option value="2">2x (Retina)</option>
                        <option value="4">4x (Print)</option>
                    </select>
                </div>
            )}
            
            <button onClick={handleExport} className="w-full px-4 py-2 font-bold text-white bg-blue-600 rounded-md hover:bg-blue-700">
                Export File
            </button>

            <div className="border-t border-gray-700 pt-4 mt-4">
                 <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Quick Exports</h4>
                 <div className="space-y-2">
                     <button onClick={() => controllers.export.exportPNG({ multiplier: 1, filename: 'export-web.png' })} className="w-full text-left px-3 py-2 text-xs text-white bg-gray-700 rounded-md hover:bg-gray-600">
                        Export for Web (1x PNG)
                    </button>
                    <button onClick={() => controllers.export.exportPNG({ multiplier: 4, filename: 'export-print.png' })} className="w-full text-left px-3 py-2 text-xs text-white bg-gray-700 rounded-md hover:bg-gray-600">
                        Export for Print (4x PNG)
                    </button>
                     <button onClick={() => controllers.export.exportSVG('export-vector.svg')} className="w-full text-left px-3 py-2 text-xs text-white bg-gray-700 rounded-md hover:bg-gray-600">
                        Export Vector (SVG)
                    </button>
                 </div>
            </div>
        </div>
    );
};
