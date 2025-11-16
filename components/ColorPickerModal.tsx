import React, { useState, useEffect } from 'react';

interface ColorPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentColor: string;
  onSetColor: (color: string) => void;
}

const PRESET_COLORS = [
  '#FF3B30', '#FF9500', '#FFCC00', '#34C759',
  '#00C7BE', '#30B0C7', '#32ADE6', '#007AFF',
  '#5856D6', '#AF52DE', '#FF2D55', '#8E8E93',
  '#FFFFFF', '#000000', '#1F2937', '#6B7280',
];


export const ColorPickerModal: React.FC<ColorPickerModalProps> = ({ isOpen, onClose, currentColor, onSetColor }) => {
  const [selectedColor, setSelectedColor] = useState(currentColor);

  useEffect(() => {
    if (isOpen) {
      setSelectedColor(currentColor);
    }
  }, [currentColor, isOpen]);

  const handleSet = () => {
    onSetColor(selectedColor);
    onClose();
  };
  
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50 animate-fade-in" onClick={onClose}>
      <div 
        className="bg-gray-800 text-white rounded-xl shadow-2xl w-full max-w-xs p-6 border border-gray-700 transition-transform duration-300"
        onClick={(e) => e.stopPropagation()}
        style={{ transform: isOpen ? 'scale(1)' : 'scale(0.95)' }}
      >
        <h2 className="text-xl font-bold text-center mb-6">Seleziona Colore</h2>
        
        <div className="grid grid-cols-4 gap-4 mb-6">
          {PRESET_COLORS.map(color => (
            <button 
              key={color}
              onClick={() => setSelectedColor(color)}
              className={`w-full aspect-square rounded-full transition-all duration-200 ring-offset-2 ring-offset-gray-800 ${selectedColor.toUpperCase() === color.toUpperCase() ? 'ring-2 ring-blue-500 scale-110' : 'ring-0 hover:scale-110'}`}
              style={{ backgroundColor: color }}
              aria-label={`Select color ${color}`}
            />
          ))}
        </div>

        <div className="border-t border-gray-700 pt-4">
          <div className="flex items-center gap-4">
            <div className="relative w-14 h-14 rounded-lg overflow-hidden border-2 border-gray-600 shrink-0">
              <div className="w-full h-full" style={{ backgroundColor: selectedColor }} />
              <input 
                type="color"
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
                className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
            <div className="flex-1">
                <label htmlFor="hex-color" className="text-xs text-gray-400">HEX</label>
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">#</span>
                    <input
                        id="hex-color"
                        type="text"
                        value={selectedColor.substring(1).toUpperCase()}
                        onChange={(e) => setSelectedColor('#' + e.target.value)}
                        className="custom-input w-full p-2 pl-6 mt-1 font-mono"
                        maxLength={6}
                    />
                </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm font-semibold">
            Annulla
          </button>
          <button onClick={handleSet} className="btn btn-primary px-6">
            Imposta
          </button>
        </div>
      </div>
    </div>
  );
};
