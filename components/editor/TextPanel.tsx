

import React, { useState, useEffect, useCallback } from 'react';
// FIX: Import fabric types
import type { fabric } from 'fabric';
import type { TextController } from '../../services/editorControllers';
import { BoldIcon, ItalicIcon, UnderlineIcon, AlignTextLeftIcon, AlignTextCenterIcon, AlignTextRightIcon, AlignTextJustifyIcon } from '../Icons';

interface TextPanelProps {
    controllers: { text: TextController };
    activeObject: fabric.Object | null;
}

export const TextPanel: React.FC<TextPanelProps> = ({ controllers, activeObject }) => {
    const isText = controllers.text.isText(activeObject);
    const [props, setProps] = useState({
        fontFamily: 'Arial',
        fontSize: 48,
        fontWeight: 'normal',
        fontStyle: 'normal',
        underline: false,
        textAlign: 'left',
        fill: '#ffffff',
        charSpacing: 0,
        lineHeight: 1.16,
    });

    const updateStateFromObject = useCallback(() => {
        if (isText) {
            const textObject = activeObject as fabric.IText;
            setProps({
                fontFamily: textObject.fontFamily || 'Arial',
                fontSize: textObject.fontSize || 48,
                fontWeight: textObject.fontWeight || 'normal',
                fontStyle: textObject.fontStyle || 'normal',
                underline: textObject.underline || false,
                textAlign: textObject.textAlign || 'left',
                fill: (textObject.fill as string) || '#ffffff',
                charSpacing: textObject.charSpacing || 0,
                lineHeight: textObject.lineHeight || 1.16,
            });
        }
    }, [isText, activeObject]);

    useEffect(updateStateFromObject, [activeObject, updateStateFromObject]);
    
    const handlePropChange = (prop: keyof typeof props, value: any) => {
        if (!isText) return;
        setProps(p => ({ ...p, [prop]: value }));
        (activeObject as fabric.IText).set(prop, value);
        controllers.text.canvas.renderAll();
    };

    const toggleStyle = (prop: 'fontWeight' | 'fontStyle', value: string, normalValue: string) => {
        const current = props[prop];
        handlePropChange(prop, current === value ? normalValue : value);
    };

    return (
        <div className="p-4 space-y-4 text-sm">
             {!isText && <p className="text-gray-500 text-xs text-center p-4">Select a text object to see properties.</p>}
            <div className={`grid grid-cols-1 gap-4 ${!isText ? 'opacity-50 pointer-events-none' : ''}`}>
                <div>
                    <label className="text-xs font-medium text-gray-400">Font</label>
                    <div className="flex gap-2 mt-1">
                        <select
                            value={props.fontFamily}
                            onChange={(e) => handlePropChange('fontFamily', e.target.value)}
                            className="flex-grow bg-gray-700 border border-gray-600 rounded-md p-2 text-xs"
                        >
                            {controllers.text.availableFonts.map(font => <option key={font} value={font}>{font}</option>)}
                        </select>
                        <input
                            type="number"
                            value={props.fontSize}
                            onChange={(e) => handlePropChange('fontSize', parseInt(e.target.value, 10))}
                            className="w-16 bg-gray-700 border border-gray-600 rounded-md p-2 text-xs"
                        />
                    </div>
                </div>

                <div>
                    <label className="text-xs font-medium text-gray-400">Style</label>
                    <div className="flex items-center gap-1 mt-1 bg-gray-700 rounded-md p-1">
                        <button onClick={() => toggleStyle('fontWeight', 'bold', 'normal')} className={`p-2 rounded ${props.fontWeight === 'bold' ? 'bg-blue-600 text-white' : 'hover:bg-gray-600'}`}><BoldIcon className="w-4 h-4" /></button>
                        <button onClick={() => toggleStyle('fontStyle', 'italic', 'normal')} className={`p-2 rounded ${props.fontStyle === 'italic' ? 'bg-blue-600 text-white' : 'hover:bg-gray-600'}`}><ItalicIcon className="w-4 h-4" /></button>
                        <button onClick={() => handlePropChange('underline', !props.underline)} className={`p-2 rounded ${props.underline ? 'bg-blue-600 text-white' : 'hover:bg-gray-600'}`}><UnderlineIcon className="w-4 h-4" /></button>
                    </div>
                </div>

                <div>
                    <label className="text-xs font-medium text-gray-400">Alignment</label>
                     <div className="flex items-center gap-1 mt-1 bg-gray-700 rounded-md p-1">
                        <button onClick={() => handlePropChange('textAlign', 'left')} className={`p-2 rounded ${props.textAlign === 'left' ? 'bg-blue-600 text-white' : 'hover:bg-gray-600'}`}><AlignTextLeftIcon className="w-4 h-4" /></button>
                        <button onClick={() => handlePropChange('textAlign', 'center')} className={`p-2 rounded ${props.textAlign === 'center' ? 'bg-blue-600 text-white' : 'hover:bg-gray-600'}`}><AlignTextCenterIcon className="w-4 h-4" /></button>
                        <button onClick={() => handlePropChange('textAlign', 'right')} className={`p-2 rounded ${props.textAlign === 'right' ? 'bg-blue-600 text-white' : 'hover:bg-gray-600'}`}><AlignTextRightIcon className="w-4 h-4" /></button>
                         <button onClick={() => handlePropChange('textAlign', 'justify')} className={`p-2 rounded ${props.textAlign === 'justify' ? 'bg-blue-600 text-white' : 'hover:bg-gray-600'}`}><AlignTextJustifyIcon className="w-4 h-4" /></button>
                    </div>
                </div>
                
                <div>
                     <label className="text-xs font-medium text-gray-400">Color</label>
                     <input type="color" value={props.fill} onChange={e => handlePropChange('fill', e.target.value)} className="w-full h-8 mt-1 bg-gray-700 border border-gray-600 rounded-md p-1"/>
                </div>

                <div>
                    <label className="text-xs font-medium text-gray-400">Letter Spacing</label>
                    <input type="range" min="-200" max="800" value={props.charSpacing} onChange={e => handlePropChange('charSpacing', parseInt(e.target.value, 10))} className="w-full h-2 mt-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"/>
                </div>

                <div>
                    <label className="text-xs font-medium text-gray-400">Line Height</label>
                    <input type="range" min="0.5" max="3" step="0.1" value={props.lineHeight} onChange={e => handlePropChange('lineHeight', parseFloat(e.target.value))} className="w-full h-2 mt-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"/>
                </div>
            </div>
        </div>
    );
};