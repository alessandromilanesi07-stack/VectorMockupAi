import React, { useState, useCallback, useReducer } from 'react';
import { produce } from 'immer';
import type { TechPack } from '../types';
import { INITIAL_TECH_PACK_DATA } from '../data/techPackData';
import * as Steps from './steps';
import { TechPackPDF } from './TechPackPDF';
import { generateFlatSketches } from '../services/geminiService';

type BuilderState = {
    currentStep: number;
    techPackData: TechPack;
    isLoading: boolean;
    error: string | null;
};

type BuilderAction =
    | { type: 'NEXT_STEP' }
    | { type: 'PREV_STEP' }
    | { type: 'SET_STEP'; payload: number }
    | { type: 'UPDATE_DATA'; payload: Partial<TechPack> }
    | { type: 'UPDATE_NESTED'; payload: { path: (string | number)[]; value: any } }
    | { type: 'START_LOADING' }
    | { type: 'SET_SUCCESS' }
    | { type: 'SET_ERROR'; payload: string };

const builderReducer = (state: BuilderState, action: BuilderAction): BuilderState => {
    return produce(state, draft => {
        switch (action.type) {
            case 'NEXT_STEP':
                if (state.currentStep < 4) draft.currentStep++;
                break;
            case 'PREV_STEP':
                if (state.currentStep > 0) draft.currentStep--;
                break;
            case 'SET_STEP':
                draft.currentStep = action.payload;
                break;
            case 'UPDATE_DATA':
                draft.techPackData = { ...draft.techPackData, ...action.payload };
                break;
            case 'UPDATE_NESTED':
                let current: any = draft.techPackData;
                for (let i = 0; i < action.payload.path.length - 1; i++) {
                    current = current[action.payload.path[i]];
                }
                current[action.payload.path[action.payload.path.length - 1]] = action.payload.value;
                break;
            case 'START_LOADING':
                draft.isLoading = true;
                draft.error = null;
                break;
            case 'SET_SUCCESS':
                draft.isLoading = false;
                draft.error = null;
                break;
            case 'SET_ERROR':
                draft.isLoading = false;
                draft.error = action.payload;
                break;
        }
    });
};


export const TechPackBuilder: React.FC = () => {
    const [state, dispatch] = useReducer(builderReducer, {
        currentStep: 0,
        techPackData: INITIAL_TECH_PACK_DATA,
        isLoading: false,
        error: null,
    });

    const handleGenerateSketches = useCallback(async (data: TechPack) => {
        dispatch({ type: 'START_LOADING' });
        try {
            const sketches = await generateFlatSketches(data.base, data.bom.baseColor.hex);
            dispatch({ type: 'UPDATE_DATA', payload: { flatSketches: sketches } });
            dispatch({ type: 'SET_SUCCESS' });
            dispatch({ type: 'NEXT_STEP' });
        } catch (e) {
            const errorMsg = e instanceof Error ? e.message : 'An unknown error occurred';
            dispatch({ type: 'SET_ERROR', payload: errorMsg });
        }
    }, []);

    const handlePrint = () => {
        const printableElement = document.getElementById('tech-pack-printable');
        if (printableElement) {
            const printWindow = window.open('', '_blank');
            printWindow?.document.write('<html><head><title>Tech Pack</title>');
            // Link to tailwind for basic utility classes
            printWindow?.document.write('<script src="https://cdn.tailwindcss.com"></script>');
            printWindow?.document.write('<style>@media print { @page { size: A4; margin: 0; } body { margin: 1cm; } .break-after-page { page-break-after: always; } }</style>');
            printWindow?.document.write('</head><body>');
            printWindow?.document.write(printableElement.innerHTML);
            printWindow?.document.write('</body></html>');
            printWindow?.document.close();
            setTimeout(() => { // Timeout to allow content to load
                printWindow?.print();
            }, 500);
        }
    };

    const renderStep = () => {
        switch (state.currentStep) {
            case 0:
                return <Steps.WelcomeScreen onNext={() => dispatch({ type: 'NEXT_STEP' })} />;
            case 1:
                return <Steps.Step1_BaseConstruction
                    data={state.techPackData}
                    onUpdate={(path, value) => dispatch({ type: 'UPDATE_NESTED', payload: { path, value } })}
                    onNext={handleGenerateSketches}
                    isLoading={state.isLoading}
                />;
            case 2:
                return <Steps.Step2_Specifications
                    data={state.techPackData}
                    onUpdate={(path, value) => dispatch({ type: 'UPDATE_NESTED', payload: { path, value } })}
                    onNext={() => dispatch({ type: 'NEXT_STEP' })}
                    onBack={() => dispatch({ type: 'PREV_STEP' })}
                />;
            case 3:
                return <Steps.Step3_GradingTable
                    data={state.techPackData.grading}
                    onUpdate={(path, value) => dispatch({ type: 'UPDATE_NESTED', payload: { path, value } })}
                    onNext={() => dispatch({ type: 'NEXT_STEP' })}
                    onBack={() => dispatch({ type: 'PREV_STEP' })}
                />;
            case 4:
                return <Steps.Step4_ReviewExport
                    data={state.techPackData}
                    onUpdate={(path, value) => dispatch({ type: 'UPDATE_NESTED', payload: { path, value } })}
                    onBack={() => dispatch({ type: 'PREV_STEP' })}
                    onGenerate={handlePrint}
                    setStep={(step) => dispatch({ type: 'SET_STEP', payload: step })}
                />;
            default:
                return <div>Invalid Step</div>;
        }
    };

    return (
        <div className="w-full max-w-7xl mx-auto">
            <div className="bg-gray-800/50 p-6 rounded-xl shadow-2xl border border-gray-700 min-h-[80vh]">
                {state.error && (
                     <div className="bg-red-900/50 text-red-300 p-4 rounded-lg text-center mb-4">
                        <p><strong>Error:</strong> {state.error}</p>
                        <button onClick={() => dispatch({type: 'SET_ERROR', payload: null})} className="mt-2 text-xs underline">Dismiss</button>
                    </div>
                )}
                {renderStep()}
            </div>
            <div style={{ display: 'none' }}>
                <TechPackPDF data={state.techPackData} />
            </div>
        </div>
    );
};