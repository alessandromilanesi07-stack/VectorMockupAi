import React from 'react';
import type { TechPack, Size } from '../types';

interface TechPackPDFProps {
    data: TechPack | null;
}

// FIX: Pass `data` as a prop to the Page component.
const Page: React.FC<{title: string, sku: string, children: React.ReactNode, data: TechPack}> = ({ title, sku, data, children }) => (
    <div className="bg-white text-black p-8 shadow-lg break-after-page">
        <header className="flex justify-between items-start pb-4 border-b border-gray-300">
            <div>
                <h1 className="text-2xl font-bold">{title}</h1>
                <p className="text-gray-500">SKU: {sku}</p>
            </div>
            <div className="text-right">
                <p className="font-bold text-lg">{data.project.designer || 'VectorCraft AI'}</p>
                <p className="text-sm text-gray-500">Data: {data.project.date}</p>
            </div>
        </header>
        <main className="mt-6">
            {children}
        </main>
    </div>
);

const Section: React.FC<{title: string, children: React.ReactNode, className?: string}> = ({ title, children, className }) => (
    <div className={className}>
        <h2 className="text-lg font-semibold uppercase tracking-wider text-gray-700 border-b-2 border-gray-300 pb-1 mb-3">{title}</h2>
        {children}
    </div>
);

const SpecItem: React.FC<{label: string, value: React.ReactNode}> = ({ label, value }) => (
    <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-gray-200">
        <strong className="text-gray-600 col-span-1">{label}:</strong>
        <span className="col-span-2">{value}</span>
    </div>
);


export const TechPackPDF: React.FC<TechPackPDFProps> = ({ data }) => {
    if (!data) return null;

    const { project, base, bom, construction, finishes, grading, flatSketches } = data;

    return (
        <div id="tech-pack-printable" className="tech-pack-printable">
            {/* PAGE 1: SKETCHES */}
            <Page title={`${project.projectName}`} sku={project.sku} data={data}>
                 <div className="grid grid-cols-2 gap-8">
                     <div className="text-center">
                         <h3 className="font-bold mb-2">FRONT VIEW</h3>
                         {flatSketches?.front ? (
                             <div className="bg-gray-100 p-4 border border-gray-300">
                                <img src={flatSketches.front} alt="Front View Sketch" className="w-full h-auto object-contain" />
                             </div>
                         ) : <div className="h-96 bg-gray-200 flex items-center justify-center">No Sketch</div>}
                     </div>
                     <div className="text-center">
                          <h3 className="font-bold mb-2">BACK VIEW</h3>
                         {flatSketches?.back ? (
                            <div className="bg-gray-100 p-4 border border-gray-300">
                                <img src={flatSketches.back} alt="Back View Sketch" className="w-full h-auto object-contain" />
                            </div>
                         ) : <div className="h-96 bg-gray-200 flex items-center justify-center">No Sketch</div>}
                     </div>
                </div>
                <div className="mt-8">
                    <Section title="Construction Callouts">
                        <ul className="list-disc list-inside text-sm space-y-1">
                            <li><strong>A. Collar:</strong> {construction.collarConstruction} ({construction.collarWidth} cm width)</li>
                            <li><strong>B. Shoulder Seam:</strong> {construction.shoulderSeam}</li>
                            <li><strong>C. Side Seam:</strong> {construction.sideSeam}</li>
                            <li><strong>D. Body Hem:</strong> {construction.hemSeam} ({construction.hemHeight} cm height)</li>
                             <li><strong>E. Sleeve Hem:</strong> {construction.sleeveHemSeam}</li>
                        </ul>
                    </Section>
                </div>
            </Page>

            {/* PAGE 2: SPECIFICATIONS */}
            <Page title="Technical Specifications" sku={project.sku} data={data}>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <Section title="Bill of Materials (BOM)">
                            <SpecItem label="Main Fabric" value={bom.mainFabric} />
                            <SpecItem label="Fabric Weight" value={`${bom.fabricWeight} GSM`} />
                            <SpecItem label="Base Color" value={
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded-full border border-gray-400" style={{backgroundColor: bom.baseColor.hex}}></div>
                                    <span>{bom.baseColor.name}</span>
                                    <span className="font-mono text-xs text-gray-500">{bom.baseColor.hex}</span>
                                </div>
                            } />
                             <SpecItem label="Pantone®" value={bom.baseColor.pantone} />
                            <SpecItem label="Composition" value={bom.fabricComposition} />
                        </Section>

                        <Section title="Construction">
                             <SpecItem label="Fit / Silhouette" value={base.fitType} />
                             <SpecItem label="Collar" value={`${construction.collarConstruction} (${construction.collarWidth} cm width)`} />
                             <SpecItem label="Shoulder Seam" value={construction.shoulderSeam} />
                             <SpecItem label="Side Seam" value={construction.sideSeam} />
                             <SpecItem label="Body Hem" value={`${construction.hemSeam} (${construction.hemHeight} cm height)`} />
                             <SpecItem label="Sleeve Type" value={base.sleeveType} />
                             <SpecItem label="Sleeve Hem" value={construction.sleeveHemSeam} />
                        </Section>
                    </div>
                     <div className="space-y-6">
                         <Section title="Labels & Finishing">
                             <SpecItem label="Care Label Type" value={finishes.careLabelType} />
                             <SpecItem label="Care Label Pos." value={finishes.careLabelPosition} />
                             <SpecItem label="Care Label Text" value={<pre className="whitespace-pre-wrap text-xs font-sans">{finishes.careLabelContent}</pre>} />
                        </Section>
                        {finishes.hasLogo && (
                            <Section title="Logo / Graphic Application">
                                <SpecItem label="Application" value={finishes.logoApplication || 'N/A'} />
                                <SpecItem label="Position" value={finishes.logoPosition || 'N/A'} />
                                <SpecItem label="Dimensions" value={`${finishes.logoWidth || 'N/A'} cm x ${finishes.logoHeight || 'N/A'} cm`} />
                                <SpecItem label="Artwork File" value={finishes.logoFileName || 'N/A'} />
                            </Section>
                        )}
                        <Section title="Notes for Manufacturer">
                             <p className="text-sm bg-gray-100 p-3 rounded">{project.notes || "Nessuna nota aggiuntiva."}</p>
                        </Section>
                    </div>
                 </div>
            </Page>
            
             {/* PAGE 3: GRADING */}
            <Page title="Size Chart & Grading" sku={project.sku} data={data}>
                 <p className="text-sm text-gray-600 mb-4">All measurements in <strong>{grading.unit.toUpperCase()}</strong>. Tolerance: <strong>±{grading.tolerance} {grading.unit}</strong>.</p>
                 <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="p-2 border border-gray-300 font-semibold">Measurement Point</th>
                                {grading.sizes.map(size => <th key={size} className="p-2 border border-gray-300 font-semibold text-center">{size}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(grading.table[grading.sizes[0]]).map(([point]) => (
                                <tr key={point}>
                                    <td className="p-2 border border-gray-300 font-medium">{point}</td>
                                    {grading.sizes.map(size => (
                                        <td key={`${point}-${size}`} className="p-2 border border-gray-300 text-center">{grading.table[size][point as keyof typeof grading.table[Size]]}</td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                 </div>
                 <div className="mt-6">
                    <h4 className="font-bold mb-2">Measurement Key</h4>
                     <ul className="text-xs text-gray-600 list-disc list-inside">
                        <li>A. Chest Width (1/2): Metà larghezza petto</li>
                        <li>B. Body Length: Lunghezza da HPS a orlo</li>
                        <li>C. Shoulder Width: Larghezza spalle edge-to-edge</li>
                        <li>D. Sleeve Length: Lunghezza manica da spalla</li>
                        <li>E. Armhole: Profondità giromanica (linea dritta)</li>
                        <li>F. Neck Width: Larghezza colletto</li>
                        <li>G. Hem Width (1/2): Metà larghezza orlo</li>
                    </ul>
                 </div>
            </Page>
        </div>
    );
};