import type { TechPack, GradingTable, Size, MeasurementPoint } from '../types';
import { SIZES, MEASUREMENT_POINTS } from '../types';

// Step 1 Data
export const GROUPED_GARMENT_TYPES = [
  {
    groupName: 'T-shirt e Top',
    items: [
      { id: 'T-Shirt', name: 'T-Shirt', description: "Capo casual, leggero" },
      { id: 'Polo', name: 'Polo', description: "Colletto con bottoni" },
      { id: 'Longsleeve', name: 'Longsleeve', description: "T-shirt a maniche lunghe" },
      { id: 'Canotta', name: 'Canotta', description: "Senza maniche" },
    ],
  },
  {
    groupName: 'Felpe',
    items: [
      { id: 'Hoodie', name: 'Hoodie', description: "Felpa con cappuccio (pullover)" },
      { id: 'Zip Hoodie', name: 'Zip Hoodie', description: "Felpa con zip e cappuccio" },
      { id: 'Sweatshirt', name: 'Sweatshirt', description: "Felpa girocollo" },
      { id: 'Zip Sweatshirt', name: 'Zip Sweatshirt', description: "Felpa con zip senza cappuccio" },
    ],
  },
  {
    groupName: 'Giacche e Cappotti',
    items: [
      { id: 'Puffer Jacket', name: 'Puffer Jacket', description: "Giacca imbottita (piumino)" },
      { id: 'Parka', name: 'Parka', description: "Giacca lunga con cappuccio" },
      { id: 'Trench Coat', name: 'Trench Coat', description: "Impermeabile classico con cintura" },
      { id: 'Leather Jacket', name: 'Leather Jacket', description: "Giacca in pelle" },
      { id: 'Blazer', name: 'Blazer', description: "Giacca formale destrutturata" },
    ],
  },
  {
    groupName: 'Pantaloni e Jeans',
    items: [
      { id: 'Jeans - Skinny', name: 'Jeans - Skinny', description: "Molto aderenti" },
      { id: 'Jeans - Slim', name: 'Jeans - Slim', description: "Aderenti ma non stretti" },
      { id: 'Jeans - Regular', name: 'Jeans - Regular', description: "Taglio dritto classico" },
      { id: 'Jeans - Bootcut', name: 'Jeans - Bootcut', description: "Leggermente svasati in fondo" },
      { id: 'Jeans - Flare', name: 'Jeans - Flare', description: "Svasati a zampa d'elefante" },
      { id: 'Jeans - Baggy', name: 'Jeans - Baggy', description: "Molto larghi e comodi" },
    ],
  },
];


export const COLLAR_TYPES = [
    { id: 'Girocollo', name: 'Girocollo (Crewneck)', description: "Colletto tondo standard" },
    { id: 'Scollo a V', name: 'Scollo a V (V-Neck)', description: "Apertura a V" },
    { id: 'Collo Alto', name: 'Collo Alto (Mock Neck)', description: "Colletto rialzato" },
    { id: 'Henley', name: 'Henley', description: "Con 3-4 bottoni" },
    { id: 'Collo Polo', name: 'Collo Polo', description: "Con bottoni, risvoltato" },
];

export const SLEEVE_TYPES = [
    { id: 'Standard', name: 'Standard (Set-in)', description: "Manica cucita alla giromanica" },
    { id: 'Raglan', name: 'Raglan', description: "Cucitura diagonale da collo a ascella" },
    { id: 'Drop Shoulder', name: 'Drop Shoulder', description: "Spalla cadente, oversized" },
    { id: 'Senza Maniche', name: 'Senza Maniche', description: "Canotta/Tank top" },
];

export const FIT_TYPES = [
    { id: 'Slim Fit', name: 'Slim Fit', description: "Aderente al corpo" },
    { id: 'Regular Fit', name: 'Regular Fit', description: "Vestibilità standard" },
    { id: 'Athletic Fit', name: 'Athletic Fit', description: "Più spazio su petto e spalle, vita affusolata" },
    { id: 'Relaxed Fit', name: 'Relaxed Fit', description: "Comodo, non aderente" },
    { id: 'Oversized', name: 'Oversized', description: "Volutamente grande e largo" },
    { id: 'Boxy Fit', name: 'Boxy Fit', description: "Taglio dritto e squadrato, corto in lunghezza" },
    { id: 'Crop Fit', name: 'Crop Fit', description: "Taglio corto, finisce sopra la vita" },
];

// Step 2 Data
export const FABRIC_OPTIONS = ["Jersey Single (100% Cotone)", "Jersey Pettinato", "Piqué", "French Terry", "Fleece (Felpa)", "Interlock", "Rib Knit"];
export const COLLAR_CONSTRUCTION_OPTIONS = ["1x1 Rib", "2x2 Rib", "Self-Fabric", "Binding (Striscia)"];
export const SEAM_OPTIONS = ["Overlock 3-thread", "Flat-lock 4-thread", "Tape su spalla", "Coverstitch", "Blind Stitch", "Lockstitch", "Rollhem", "French Seam"];
export const LABEL_TYPE_OPTIONS = ["Stampata (Pad Print)", "Tessuta", "Trasferibile a caldo", "Strappabile (Tearaway)"];
export const LABEL_POSITION_OPTIONS = ["Retro collo (standard)", "Cucitura laterale sinistra"];
export const LOGO_APPLICATION_OPTIONS = ["Serigrafia (Screen Print)", "DTG (Direct-to-Garment)", "Transfer", "Ricamo", "Patch applicato"];
export const LOGO_POSITION_OPTIONS = ["Petto Sinistro (piccolo)", "Centro Petto (grande)", "Retro Collo", "Schiena Centro (grande)", "Manica Sinistra"];

// Default Grading Table for a Regular Fit T-Shirt in CM
const defaultGradingTable: GradingTable = {
    'XS': { 'A. Chest Width': 45, 'B. Body Length': 68, 'C. Shoulder': 42, 'D. Sleeve Length': 20, 'E. Armhole': 21, 'F. Neck Width': 18, 'G. Hem Width': 44 },
    'S':  { 'A. Chest Width': 48, 'B. Body Length': 70, 'C. Shoulder': 44, 'D. Sleeve Length': 21, 'E. Armhole': 22, 'F. Neck Width': 19, 'G. Hem Width': 47 },
    'M':  { 'A. Chest Width': 51, 'B. Body Length': 72, 'C. Shoulder': 46, 'D. Sleeve Length': 22, 'E. Armhole': 23, 'F. Neck Width': 20, 'G. Hem Width': 50 },
    'L':  { 'A. Chest Width': 54, 'B. Body Length': 74, 'C. Shoulder': 48, 'D. Sleeve Length': 23, 'E. Armhole': 24, 'F. Neck Width': 21, 'G. Hem Width': 53 },
    'XL': { 'A. Chest Width': 57, 'B. Body Length': 76, 'C. Shoulder': 50, 'D. Sleeve Length': 24, 'E. Armhole': 25, 'F. Neck Width': 22, 'G. Hem Width': 56 },
    'XXL':{ 'A. Chest Width': 60, 'B. Body Length': 78, 'C. Shoulder': 52, 'D. Sleeve Length': 25, 'E. Armhole': 26, 'F. Neck Width': 23, 'G. Hem Width': 59 },
};

// Initial state for the entire tech pack
export const INITIAL_TECH_PACK_DATA: TechPack = {
    project: {
        projectName: 'T-Shirt Estate 2025 - Linea Basic',
        sku: 'TSH-001-BLK',
        designer: 'VectorCraft AI User',
        date: new Date().toLocaleDateString('it-IT'),
        notes: 'Pre-lavaggio tessuto obbligatorio per evitare shrinkage. Controllo qualità su campione approvato prima di produzione di massa.',
    },
    base: {
        garmentType: 'T-Shirt',
        collarType: 'Girocollo',
        sleeveType: 'Standard',
        fitType: 'Regular Fit',
    },
    bom: {
        mainFabric: 'Jersey Single (100% Cotone)',
        fabricWeight: 180,
        baseColor: {
            pantone: '19-4006 TCX',
            hex: '#000000',
            name: 'Nero',
        },
        fabricComposition: '100% Cotone',
    },
    construction: {
        collarConstruction: '1x1 Rib',
        collarWidth: 2,
        shoulderSeam: 'Overlock 3-thread',
        hemSeam: 'Coverstitch',
        hemHeight: 2,
        sleeveHemSeam: 'Coverstitch',
        sideSeam: 'Flat-lock',
    },
    finishes: {
        careLabelType: 'Stampata (Pad Print)',
        careLabelPosition: 'Retro collo (standard)',
        careLabelContent: 'Machine wash 30°C\nDo not bleach\n100% Cotton\nMade in Portugal',
        hasLogo: false,
        logoApplication: 'Serigrafia (Screen Print)',
        logoPosition: 'Petto Sinistro (piccolo)',
        logoWidth: 8,
        logoHeight: 5,
        logoFile: null,
        logoFileName: '',
        extras: {
            pockets: 'No',
            drawstrings: 'No',
            zipper: 'No',
            buttons: 'No',
        },
    },
    grading: {
        sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
        table: defaultGradingTable,
        tolerance: 0.5,
        unit: 'cm',
    },
    flatSketches: null,
};