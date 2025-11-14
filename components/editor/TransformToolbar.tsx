

import React from 'react';
// FIX: Import fabric types
import type { fabric } from 'fabric';
import type { TransformController } from '../../services/editorControllers';
import { 
    AlignLeftIcon, AlignCenterHorizontalIcon, AlignRightIcon, 
    AlignTopIcon, AlignCenterVerticalIcon, AlignBottomIcon,
    FlipHorizontalIcon, FlipVerticalIcon, ResetIcon
} from '../Icons';

interface TransformToolbarProps {
    controllers: { transform: TransformController };
    activeObject: fabric.Object | null;
}

const ToolButton: React.FC<{ onClick: () => void; title: string; disabled?: boolean; children: React.ReactNode }> = 
({ onClick, title, disabled, children }) => (
    <button
        onClick={onClick}
        title={title}
        disabled={disabled}
        className="p-2 rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-gray-300 hover:text-white"
    >
        {children}
    </button>
);

export const TransformToolbar: React.FC<TransformToolbarProps> = ({ controllers, activeObject }) => {
    const isSelection = activeObject !== null;
    const isGroup = activeObject?.type === 'activeSelection';

    return (
        <div className="flex justify-center items-center gap-2 h-full">
            <div className="flex items-center bg-gray-700/50 rounded-md p-1">
                <ToolButton onClick={() => controllers.transform.flipHorizontal()} title="Flip Horizontal" disabled={!isSelection}>
                    <FlipHorizontalIcon className="w-5 h-5" />
                </ToolButton>
                <ToolButton onClick={() => controllers.transform.flipVertical()} title="Flip Vertical" disabled={!isSelection}>
                    <FlipVerticalIcon className="w-5 h-5" />
                </ToolButton>
            </div>
            
            <div className="w-px h-6 bg-gray-600" />

            <div className="flex items-center bg-gray-700/50 rounded-md p-1">
                <ToolButton onClick={() => controllers.transform.alignObjects(null, 'left')} title="Align Left" disabled={!isGroup}>
                    <AlignLeftIcon className="w-5 h-5" />
                </ToolButton>
                 <ToolButton onClick={() => controllers.transform.alignObjects(null, 'center')} title="Align Center" disabled={!isGroup}>
                    <AlignCenterHorizontalIcon className="w-5 h-5" />
                </ToolButton>
                 <ToolButton onClick={() => controllers.transform.alignObjects(null, 'right')} title="Align Right" disabled={!isGroup}>
                    <AlignRightIcon className="w-5 h-5" />
                </ToolButton>
            </div>
            <div className="flex items-center bg-gray-700/50 rounded-md p-1">
                <ToolButton onClick={() => controllers.transform.alignObjects(null, 'top')} title="Align Top" disabled={!isGroup}>
                    <AlignTopIcon className="w-5 h-5" />
                </ToolButton>
                <ToolButton onClick={() => controllers.transform.alignObjects(null, 'middle')} title="Align Middle" disabled={!isGroup}>
                    <AlignCenterVerticalIcon className="w-5 h-5" />
                </ToolButton>
                <ToolButton onClick={() => controllers.transform.alignObjects(null, 'bottom')} title="Align Bottom" disabled={!isGroup}>
                    <AlignBottomIcon className="w-5 h-5" />
                </ToolButton>
            </div>
            
            <div className="w-px h-6 bg-gray-600" />

            <div className="flex items-center bg-gray-700/50 rounded-md p-1">
                <ToolButton onClick={() => controllers.transform.resetTransform()} title="Reset Transform" disabled={!isSelection}>
                    <ResetIcon className="w-5 h-5" />
                </ToolButton>
            </div>
        </div>
    );
};