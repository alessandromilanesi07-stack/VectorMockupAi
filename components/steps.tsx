import React, { useState, useRef, useEffect } from 'react';
import type { TechPack, Grading, Size } from '../types';
import { SIZES, MEASUREMENT_POINTS } from '../types';
import {
    GROUPED_GARMENT_TYPES, COLLAR_TYPES, SLEEVE_TYPES, FIT_TYPES,
    FABRIC_OPTIONS, COLLAR_CONSTRUCTION_OPTIONS, SEAM_OPTIONS, LABEL_TYPE_OPTIONS, LABEL_POSITION_OPTIONS,
    LOGO_APPLICATION_OPTIONS, LOGO_POSITION_OPTIONS
} from '../data/techPackData';
import { Spinner } from './Spinner';
import { getColorInformation } from '../services/geminiService';

// --- SHARED COMPONENTS ---

const Tooltip: React.FC<{ text: string }> = ({ text }) => (
    <span className="group relative inline-block ml-2">
        <span className="text-xs font-bold text-gray-500 cursor-help">[?]</span>
        <div className="absolute bottom-full mb-2 w-64 bg-gray-900 text-white text-xs rounded-lg p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 shadow-lg border border-gray-600">
            {text}
        </div>
    </span>
);

const StepHeader: React.FC<{ title: string, subtitle: string }> = ({ title, subtitle }) => (
    <div className="text-center mb-8">
        <h2 className="text-3xl font-extrabold text-white sm:text-4xl tracking-tight">{title}</h2>
        <p className="mt-2 text-gray-400">{subtitle}</p>
    </div>
);

const NavButtons: React.FC<{ onBack?: () => void, onNext: () => void, nextLabel?: string, isLoading?: boolean }> = ({ onBack, onNext, nextLabel = 'Continua', isLoading = false }) => (
    <div className={`flex mt-10 ${onBack ? 'justify-between' : 'justify-end'}`}>
        {onBack && <button onClick={onBack} className="btn bg-gray-600 hover:bg-gray-500">← Indietro</button>}
        <button onClick={onNext} className="btn btn-primary" disabled={isLoading}>
            {isLoading ? <Spinner /> : `${nextLabel} →`}
        </button>
    </div>
);


// --- STEP 0: WELCOME ---
export const WelcomeScreen: React.FC<{ onNext: () => void }> = ({ onNext }) => (
    <div className="text-center flex flex-col items-center justify-center h-full py-16">
        <h1 className="text-4xl font-bold mb-4">Benvenuto nel Tech Pack Builder</h1>
        <p className="text-lg text-gray-400 max-w-2xl mb-8">
            Stai per creare un Tech Pack professionale. Un Tech Pack è il documento che i produttori usano per realizzare il tuo capo. Ti guideremo passo dopo passo.
        </p>
        <button onClick={onNext} className="btn btn-primary text-lg !px-10 !py-4">
            Inizia il Tuo Primo Tech Pack
        </button>
    </div>
);

// --- STEP 1: BASE CONSTRUCTION ---
const GarmentSelector: React.FC<{
  data: TechPack;
  onUpdate: (path: (string|number)[], value: any) => void;
}> = ({ data, onUpdate }) => {
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedGroup = GROUPED_GARMENT_TYPES.find(group => 
    group.items.some(item => item.id === data.base.garmentType)
  )?.groupName;
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpenCategory(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [containerRef]);

  return (
    <div ref={containerRef} className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {GROUPED_GARMENT_TYPES.map(group => {
        const isSelectedGroup = group.groupName === selectedGroup;
        const currentItemInGroup = group.items.find(item => item.id === data.base.garmentType);
        
        return (
          <div key={group.groupName} className="relative">
            <button
              onClick={() => setOpenCategory(openCategory === group.groupName ? null : group.groupName)}
              className={`w-full p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                isSelectedGroup
                  ? 'bg-blue-600/20 border-blue-500'
                  : 'bg-gray-800 border-gray-700 hover:border-gray-500'
              }`}
            >
              <span className="text-xs text-gray-400">{group.groupName}</span>
              <h4 className="font-bold text-white truncate">
                {currentItemInGroup ? currentItemInGroup.name : 'Select...'}
              </h4>
            </button>
            {openCategory === group.groupName && (
              <div className="absolute top-full mt-2 w-full bg-gray-700 border border-gray-600 rounded-lg shadow-xl z-20 max-h-60 overflow-y-auto">
                {group.items.map(item => (
                  <button
                    key={item.id}
                    onClick={() => {
                      onUpdate(['base', 'garmentType'], item.id);
                      setOpenCategory(null);
                    }}
                    className="w-full text-left px-4 py-3 text-sm hover:bg-gray-600 transition-colors data-[selected=true]:bg-blue-600/50"
                    data-selected={item.id === data.base.garmentType}
                  >
                    <p className="font-semibold text-white">{item.name}</p>
                    <p className="text-xs text-gray-400">{item.description}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

interface CardProps {
    item: { id: any; name: string; description: string };
    isSelected: boolean;
    onSelect: () => void;
}
const SelectionCard: React.FC<CardProps> = ({ item, isSelected, onSelect }) => (
    <div
        onClick={onSelect}
        className={`p-4 rounded-lg cursor-pointer border-2 transition-all duration-200 ${isSelected ? 'bg-blue-600/20 border-blue-500' : 'bg-gray-800 border-gray-700 hover:border-gray-500'}`}
    >
        <h4 className="font-bold text-white">{item.name}</h4>
        <p className="text-xs text-gray-400">{item.description}</p>
    </div>
);

interface Step1Props {
    data: TechPack;
    onUpdate: (path: (string|number)[], value: any) => void;
    onNext: (data: TechPack) => void;
    isLoading: boolean;
}
export const Step1_BaseConstruction: React.FC<Step1Props> = ({ data, onUpdate, onNext, isLoading }) => {
    const [isFetchingColor, setIsFetchingColor] = useState(false);
    const debounceTimeoutRef = useRef<number | null>(null);

    const handleColorChange = (newHexValue: string) => {
        let newHex = newHexValue;
        if (!newHex.startsWith('#')) {
            newHex = '#' + newHex;
        }

        onUpdate(['bom', 'baseColor', 'hex'], newHex);

        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }

        const isValidHex = /^#([A-Fa-f0-9]{6})$/i.test(newHex);
        if (!isValidHex) {
            return;
        }

        debounceTimeoutRef.current = window.setTimeout(async () => {
            setIsFetchingColor(true);
            onUpdate(['bom', 'baseColor', 'pantone'], '...');
            onUpdate(['bom', 'baseColor', 'name'], '...');
            try {
                const colorInfo = await getColorInformation(newHex);
                onUpdate(['bom', 'baseColor', 'pantone'], colorInfo.pantone);
                onUpdate(['bom', 'baseColor', 'name'], colorInfo.name);
            } catch (error) {
                console.error("Failed to fetch color information", error);
                onUpdate(['bom', 'baseColor', 'pantone'], 'N/A');
                onUpdate(['bom', 'baseColor', 'name'], 'Custom Color');
            } finally {
                setIsFetchingColor(false);
            }
        }, 600);
    };


    const handleNext = () => onNext(data);

    return (
        <div>
            <StepHeader title="Step 1: Costruzione Base" subtitle="Definisci la struttura e il colore del tuo capo" />
            <div className="space-y-6">
                <div>
                    <h3 className="font-bold text-lg mb-2">1.1 - Cosa stai costruendo?</h3>
                    <GarmentSelector data={data} onUpdate={onUpdate} />
                </div>
                <div>
                    <h3 className="font-bold text-lg mb-2">1.2 - Scegli lo stile del collo.</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {COLLAR_TYPES.map(item => <SelectionCard key={item.id} item={item} isSelected={data.base.collarType === item.id} onSelect={() => onUpdate(['base', 'collarType'], item.id)} />)}
                    </div>
                </div>
                <div>
                    <h3 className="font-bold text-lg mb-2">1.3 - Scegli lo stile delle maniche.</h3>
                    <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                        {SLEEVE_TYPES.map(item => <SelectionCard key={item.id} item={item} isSelected={data.base.sleeveType === item.id} onSelect={() => onUpdate(['base', 'sleeveType'], item.id)} />)}
                    </div>
                </div>
                 <div>
                    <h3 className="font-bold text-lg mb-2">1.4 - Come deve vestire il capo?</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {FIT_TYPES.map(item => <SelectionCard key={item.id} item={item} isSelected={data.base.fitType === item.id} onSelect={() => onUpdate(['base', 'fitType'], item.id)} />)}
                    </div>
                </div>
                 <div>
                    <h3 className="font-bold text-lg mb-2">1.5 - Scegli il colore base del capo.</h3>
                    <div className="bg-gray-800 p-4 rounded-lg grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div>
                            <label className="text-sm font-medium text-gray-300 flex items-center">Colore Base</label>
                            <div className="flex items-center gap-2 mt-1">
                                <input 
                                    type="color" 
                                    value={data.bom.baseColor.hex} 
                                    onChange={e => handleColorChange(e.target.value)}
                                    className="w-10 h-10 p-1 bg-gray-700 border border-gray-600 rounded-lg cursor-pointer"
                                />
                                <input 
                                    type="text" 
                                    value={data.bom.baseColor.hex.toUpperCase()} 
                                    onChange={e => handleColorChange(e.target.value)}
                                    placeholder="#000000"
                                    className="custom-input w-full p-2 font-mono"
                                />
                            </div>
                        </div>

                        <Input label="Pantone" type="text" placeholder={isFetchingColor ? "Ricerca..." : "e.g. 19-4006 TCX"} value={data.bom.baseColor.pantone} onChange={v => onUpdate(['bom', 'baseColor', 'pantone'], v)} tooltip="Codice colore standard industria" disabled={isFetchingColor} />
                        <Input label="Nome Colore" type="text" placeholder={isFetchingColor ? "Ricerca..." : "e.g. Nero"} value={data.bom.baseColor.name} onChange={v => onUpdate(['bom', 'baseColor', 'name'], v)} disabled={isFetchingColor}/>
                    </div>
                </div>
            </div>
            <NavButtons onNext={handleNext} nextLabel="Crea Flat Sketches e Continua" isLoading={isLoading} />
        </div>
    );
};


// --- STEP 2: SPECIFICATIONS ---
interface Step2Props {
    data: TechPack;
    onUpdate: (path: (string|number)[], value: any) => void;
    onNext: () => void;
    onBack: () => void;
}
export const Step2_Specifications: React.FC<Step2Props> = ({ data, onUpdate, onNext, onBack }) => {
    const { bom, construction, finishes, flatSketches } = data;

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onUpdate(['finishes', 'logoFile'], file);
            onUpdate(['finishes', 'logoFileName'], file.name);
        }
    };
    
    return (
        <div>
            <StepHeader title="Step 2: Specifiche Tecniche" subtitle="Definisci COME sarà fatto il capo" />
             <div className="sticky top-0 bg-gray-800/80 backdrop-blur-sm z-10 py-4 mb-6 grid grid-cols-4 gap-4">
                <div className="col-span-2 text-center">
                    <h4 className="font-bold text-sm mb-2">FRONT VIEW</h4>
                    {flatSketches?.front ? <img src={flatSketches.front} alt="Front sketch" className="w-full h-auto object-contain bg-gray-900 rounded-md border border-gray-700 p-2"/> : <div className="aspect-square bg-gray-700 rounded-md flex items-center justify-center text-xs text-gray-500">Loading...</div>}
                </div>
                <div className="col-span-2 text-center">
                     <h4 className="font-bold text-sm mb-2">BACK VIEW</h4>
                    {flatSketches?.back ? <img src={flatSketches.back} alt="Back sketch" className="w-full h-auto object-contain bg-gray-900 rounded-md border border-gray-700 p-2"/> : <div className="aspect-square bg-gray-700 rounded-md flex items-center justify-center text-xs text-gray-500">Loading...</div>}
                </div>
             </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column */}
                <div className="space-y-6">
                     <Section title="📦 SEZIONE 1: MATERIALI (BOM - Bill of Materials)">
                        <Input label="Tessuto Principale" type="select" options={FABRIC_OPTIONS} value={bom.mainFabric} onChange={v => onUpdate(['bom', 'mainFabric'], v)} tooltip="Classico per t-shirt" />
                        <Input label="Peso Tessuto (GSM)" type="slider" min={120} max={400} value={bom.fabricWeight} onChange={v => onUpdate(['bom', 'fabricWeight'], v)} tooltip="Grammi per Metro Quadro. 120-160: Leggero, 180-220: Standard, 250-400: Pesante." />
                        <Input label="Colore Base" type="color" value={bom.baseColor.hex} onChange={v => onUpdate(['bom', 'baseColor', 'hex'], v)} />
                        <Input label="Pantone" type="text" placeholder="e.g. 19-4006 TCX" value={bom.baseColor.pantone} onChange={v => onUpdate(['bom', 'baseColor', 'pantone'], v)} tooltip="Codice colore standard industria" />
                        <Input label="Nome Colore" type="text" placeholder="e.g. Nero" value={bom.baseColor.name} onChange={v => onUpdate(['bom', 'baseColor', 'name'], v)} />
                        <Input label="Composizione Tessuto" type="text" placeholder="e.g. 100% Cotone" value={bom.fabricComposition} onChange={v => onUpdate(['bom', 'fabricComposition'], v)} />
                    </Section>
                    <Section title="🔧 SEZIONE 2: COSTRUZIONE & CUCITURE">
                        <Input label="Colletto/Collo" type="select" options={COLLAR_CONSTRUCTION_OPTIONS} value={construction.collarConstruction} onChange={v => onUpdate(['construction', 'collarConstruction'], v)} tooltip="Costina singola, più sottile" />
                        <Input label="Larghezza Colletto (cm)" type="number" value={construction.collarWidth} onChange={v => onUpdate(['construction', 'collarWidth'], v)} />
                        <Input label="Cucitura Spalle" type="select" options={SEAM_OPTIONS} value={construction.shoulderSeam} onChange={v => onUpdate(['construction', 'shoulderSeam'], v)} tooltip="Standard, economica" />
                        <Input label="Cucitura Orlo Corpo" type="select" options={SEAM_OPTIONS} value={construction.hemSeam} onChange={v => onUpdate(['construction', 'hemSeam'], v)} tooltip="Doppia linea visibile (standard t-shirt)" />
                        <Input label="Altezza Orlo (cm)" type="number" value={construction.hemHeight} onChange={v => onUpdate(['construction', 'hemHeight'], v)} />
                         <Input label="Cucitura Orlo Maniche" type="select" options={SEAM_OPTIONS} value={construction.sleeveHemSeam} onChange={v => onUpdate(['construction', 'sleeveHemSeam'], v)} />
                        <Input label="Cucitura Laterali" type="select" options={SEAM_OPTIONS} value={construction.sideSeam} onChange={v => onUpdate(['construction', 'sideSeam'], v)} />
                    </Section>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    <Section title="🏷️ SEZIONE 3: ETICHETTE & FINITURE">
                         <Input label="Etichetta Interna (Care Label)" type="select" options={LABEL_TYPE_OPTIONS} value={finishes.careLabelType} onChange={v => onUpdate(['finishes', 'careLabelType'], v)} tooltip="Stampata direttamente nel capo" />
                        <Input label="Posizione Etichetta" type="select" options={LABEL_POSITION_OPTIONS} value={finishes.careLabelPosition} onChange={v => onUpdate(['finishes', 'careLabelPosition'], v)} />
                        <Input label="Contenuto Etichetta" type="textarea" placeholder="Machine wash 30°C..." value={finishes.careLabelContent} onChange={v => onUpdate(['finishes', 'careLabelContent'], v)} tooltip="Es: Machine wash 30°C, Do not bleach, 100% Cotton, Made in..." />
                    </Section>
                     <Section title="🎨 Logo/Grafica">
                        <Input label="Logo/Grafica" type="checkbox" checked={finishes.hasLogo} onChange={v => onUpdate(['finishes', 'hasLogo'], v)} />
                        {finishes.hasLogo && (
                            <div className="space-y-3 mt-3 pl-4 border-l-2 border-gray-700">
                                <Input label="Tecnica di Applicazione" type="select" options={LOGO_APPLICATION_OPTIONS} value={finishes.logoApplication} onChange={v => onUpdate(['finishes', 'logoApplication'], v)} tooltip="Economica per grandi quantità" />
                                <Input label="Posizione Logo" type="select" options={LOGO_POSITION_OPTIONS} value={finishes.logoPosition} onChange={v => onUpdate(['finishes', 'logoPosition'], v)} />
                                <div className="grid grid-cols-2 gap-4">
                                    <Input label="Larghezza (cm)" type="number" value={finishes.logoWidth} onChange={v => onUpdate(['finishes', 'logoWidth'], v)} />
                                    <Input label="Altezza (cm)" type="number" value={finishes.logoHeight} onChange={v => onUpdate(['finishes', 'logoHeight'], v)} />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-300 block mb-2">Carica file logo (.AI, .EPS, .SVG, .PNG)</label>
                                    <input type="file" onChange={handleFileUpload} className="text-xs file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600/20 file:text-blue-300 hover:file:bg-blue-600/40" />
                                     {finishes.logoFileName && <p className="text-xs text-gray-400 mt-1">File: {finishes.logoFileName}</p>}
                                </div>
                            </div>
                        )}
                    </Section>
                </div>
            </div>
            <NavButtons onBack={onBack} onNext={onNext} />
        </div>
    )
};

const Section: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-gray-800 p-4 rounded-lg">
        <h3 className="font-bold text-white mb-4 border-b border-gray-700 pb-2">{title}</h3>
        <div className="space-y-3">{children}</div>
    </div>
);

const Input: React.FC<{
    label: string,
    type: 'text' | 'number' | 'select' | 'textarea' | 'color' | 'slider' | 'checkbox',
    value?: any,
    onChange?: (value: any) => void,
    placeholder?: string,
    options?: string[],
    tooltip?: string,
    min?: number,
    max?: number,
    checked?: boolean,
    disabled?: boolean,
}> = ({ label, type, value, onChange, placeholder, options, tooltip, min, max, checked, disabled = false }) => (
    <div>
        <label className="text-sm font-medium text-gray-300 flex items-center">
            {label}
            {tooltip && <Tooltip text={tooltip} />}
        </label>
        {type === 'text' && <input type="text" value={value} onChange={e => onChange?.(e.target.value)} placeholder={placeholder} disabled={disabled} className="custom-input w-full p-2 mt-1 disabled:opacity-50 disabled:cursor-not-allowed" />}
        {type === 'number' && <input type="number" value={value} onChange={e => onChange?.(Number(e.target.value))} disabled={disabled} className="custom-input w-full p-2 mt-1 disabled:opacity-50 disabled:cursor-not-allowed" />}
        {type === 'select' && <select value={value} onChange={e => onChange?.(e.target.value)} disabled={disabled} className="custom-select w-full p-2 mt-1 disabled:opacity-50 disabled:cursor-not-allowed">{options?.map(o => <option key={o} value={o}>{o}</option>)}</select>}
        {type === 'textarea' && <textarea value={value} onChange={e => onChange?.(e.target.value)} placeholder={placeholder} rows={4} disabled={disabled} className="custom-textarea w-full p-2 mt-1 disabled:opacity-50 disabled:cursor-not-allowed" />}
        {type === 'color' && <input type="color" value={value} onChange={e => onChange?.(e.target.value)} disabled={disabled} className="w-full h-10 p-1 mt-1 bg-gray-700 border border-gray-600 rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" />}
        {type === 'checkbox' && <input type="checkbox" checked={checked} onChange={e => onChange?.(e.target.checked)} disabled={disabled} className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed" />}
        {type === 'slider' && (
             <div className="flex items-center gap-2 mt-1">
                <input type="range" min={min} max={max} value={value} onChange={e => onChange?.(Number(e.target.value))} disabled={disabled} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500 disabled:opacity-50 disabled:cursor-not-allowed" />
                <span className="text-xs w-12 text-center bg-gray-900 p-1 rounded-md">{value}</span>
             </div>
        )}
    </div>
);


// --- STEP 3: GRADING TABLE ---
interface Step3Props {
    data: Grading;
    onUpdate: (path: (string|number)[], value: any) => void;
    onNext: () => void;
    onBack: () => void;
}
export const Step3_GradingTable: React.FC<Step3Props> = ({ data, onUpdate, onNext, onBack }) => {

    const handleCellChange = (size: Size, point: string, value: string) => {
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
            onUpdate(['grading', 'table', size, point], numValue);
        }
    };
    
    return (
        <div>
            <StepHeader title="Step 3: Tabella Misure (Grading)" subtitle="Definisci le taglie del tuo capo" />
             <p className="text-center text-gray-400 text-sm mb-4">💡 Tip: Queste sono misure STANDARD per un Regular Fit T-Shirt. Puoi modificarle liberamente.</p>
            <div className="overflow-x-auto bg-gray-800 p-4 rounded-lg">
                <table className="w-full text-sm text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-700">
                            <th className="p-2 border border-gray-600 font-semibold w-1/4">MISURA</th>
                             {data.sizes.map(size => <th key={size} className="p-2 border border-gray-600 font-semibold text-center">{size}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {MEASUREMENT_POINTS.map(point => (
                             <tr key={point} className="hover:bg-gray-700/50">
                                <td className="p-2 border border-gray-600 font-medium">{point}</td>
                                 {data.sizes.map(size => (
                                     <td key={`${point}-${size}`} className="p-0 border border-gray-600">
                                         <input
                                            type="number"
                                            value={data.table[size][point]}
                                            onChange={e => handleCellChange(size, point, e.target.value)}
                                            className="w-full h-full bg-transparent text-center p-2 focus:bg-gray-900 focus:ring-1 focus:ring-blue-500 outline-none"
                                         />
                                     </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
             <div className="mt-4">
                <Input label="Tolerance (Tolleranza)" type="number" value={data.tolerance} onChange={v => onUpdate(['grading', 'tolerance'], v)} tooltip="Margine di errore accettabile in produzione" />
            </div>
            <NavButtons onBack={onBack} onNext={onNext} nextLabel="Salva e Continua" />
        </div>
    );
};


// --- STEP 4: REVIEW & EXPORT ---
interface Step4Props {
    data: TechPack;
    onUpdate: (path: (string|number)[], value: any) => void;
    onGenerate: () => void;
    onBack: () => void;
    setStep: (step: number) => void;
}
export const Step4_ReviewExport: React.FC<Step4Props> = ({ data, onUpdate, onGenerate, onBack, setStep }) => {
    return (
        <div>
            <StepHeader title="Step 4: Review & Export" subtitle="Controlla tutto prima di generare il tuo Tech Pack" />
            
            <Section title="✏️ Informazioni Progetto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <Input label="Nome Progetto" type="text" value={data.project.projectName} onChange={v => onUpdate(['project', 'projectName'], v)} tooltip="Es: 'T-Shirt Estate 2025 - Linea Basic'" />
                     <Input label="Codice Articolo/SKU" type="text" value={data.project.sku} onChange={v => onUpdate(['project', 'sku'], v)} tooltip="Codice interno per identificare il capo" />
                     <Input label="Designer/Brand" type="text" value={data.project.designer} onChange={v => onUpdate(['project', 'designer'], v)} />
                     <Input label="Data" type="text" value={data.project.date} onChange={v => onUpdate(['project', 'date'], v)} />
                </div>
                 <div className="mt-4">
                     <Input label="Note al Produttore" type="textarea" value={data.project.notes} onChange={v => onUpdate(['project', 'notes'], v)} />
                 </div>
            </Section>

            <div className="mt-8 flex justify-between items-center bg-gray-900/50 p-4 rounded-lg">
                 <div>
                    <button onClick={() => setStep(2)} className="text-sm text-blue-400 hover:underline">← Modifica Specifiche</button>
                    <span className="mx-2 text-gray-600">|</span>
                    <button onClick={() => setStep(3)} className="text-sm text-blue-400 hover:underline">← Modifica Misure</button>
                 </div>
                <button onClick={onGenerate} className="btn btn-primary btn-lg !px-10 !py-4">
                    GENERA TECH PACK (PDF)
                </button>
            </div>
        </div>
    );
};