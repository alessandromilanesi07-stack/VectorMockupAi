// types.ts

// Fix: Add all missing type exports
export type View = 'studio' | 'editor' | 'generator' | 'thinking' | 'search' | 'sketch' | 'brandHub' | 'trends' | 'copywriter' | 'sourcing';

export type ApplicationType = 'Print' | 'Embroidery';

export type MockupView = 'frontal' | 'retro';

export interface ColorKit {
    primary?: string;
    secondary?: string;
    accent?: string;
    neutral?: string;
}

export interface FontKit {
    heading?: string;
    body?: string;
}

export interface BrandKitData {
    colors: ColorKit;
    fonts: FontKit;
    logoDescription?: string;
    toneOfVoice?: string;
}

export interface Brand {
    id: string;
    name: string;
    kit: BrandKitData;
    logoImage?: string;
}

export interface CustomizationOption {
    id: string;
    name: string;
    description: string;
}

export interface MockupCustomization {
    id: string;
    name: string;
    defaultOptionId: string;
    options: CustomizationOption[];
}

export interface MockupProduct {
    id: string;
    name: string;
    category: 'Tops' | 'Felpe' | 'Outerwear' | 'Pantaloni' | 'Accessori';
    description: string;
    fit: string;
    printArea: string;
    icon: string;
    customizations?: MockupCustomization[];
}

export interface GroundingChunk {
    web?: {
        uri: string;
        title: string;
    };
    maps?: any;
}

export interface OrderDetails {
    productId: string;
    productName: string;
    color: string;
    size: string;
    quantity: number;
    designUrl: string;
}

export interface OrderConfirmation {
    orderId: string;
    estimatedDelivery: string;
    cost: number;
}

export interface MarketingCopy {
    productDescription: string;
    instagramCaption: string;
    emailSubject: string;
}

export interface Manufacturer {
    id: string;
    name: string;
    country: string;
    city: string;
    region: 'Europe' | 'Asia' | 'America';
    yearFounded: number;
    employees: string;
    certifications: string[];
    specializations: {
        productCategories: string[];
        productionTechniques: string[];
        materials: string[];
    };
    productionData: {
        moq: {
            value: number;
            category: 'Startup Friendly' | 'Small Batch' | 'Standard Production' | 'Large Scale';
        };
        leadTime: string;
        monthlyCapacity: string;
        sampleTime: string;
    };
    pricing: {
        range: string;
        examples: { item: string; cost: string }[];
        paymentTerms: string;
    };
    brandReferences: { tier: 1 | 2 | 3; name: string }[];
    contact: {
        email: string;
        website: string;
        whatsapp?: string;
    };
}


// Step 1: Base Construction
// FIX: Expanded GarmentType to include all possible garment types from data/techPackData.ts to fix comparison errors.
export type GarmentType = 'T-Shirt' | 'Polo' | 'Longsleeve' | 'Canotta' | 'Hoodie' | 'Zip Hoodie' | 'Sweatshirt' | 'Zip Sweatshirt' | 'Puffer Jacket' | 'Parka' | 'Trench Coat' | 'Leather Jacket' | 'Blazer' | 'Jeans - Skinny' | 'Jeans - Slim' | 'Jeans - Regular' | 'Jeans - Bootcut' | 'Jeans - Flare' | 'Jeans - Baggy';
export type CollarType = 'Girocollo' | 'Scollo a V' | 'Collo Alto' | 'Henley' | 'Collo Polo';
export type SleeveType = 'Standard' | 'Raglan' | 'Drop Shoulder' | 'Senza Maniche' | 'Manica Lunga Standard';
export type FitType = 'Slim Fit' | 'Regular Fit' | 'Relaxed Fit' | 'Oversized' | 'Athletic Fit' | 'Boxy Fit' | 'Crop Fit';

export interface BaseConstruction {
    garmentType: GarmentType;
    collarType: CollarType;
    sleeveType: SleeveType;
    fitType: FitType;
}

// Step 2: Specifications
export interface BillOfMaterials {
    mainFabric: string;
    fabricWeight: number; // in GSM
    baseColor: {
        pantone: string;
        hex: string;
        name: string;
    };
    fabricComposition: string;
}

export interface ConstructionDetails {
    collarConstruction: string;
    collarWidth: number; // in cm
    shoulderSeam: string;
    hemSeam: string;
    hemHeight: number; // in cm
    sleeveHemSeam: string;
    sideSeam: string;
}

export interface LabelsAndFinishes {
    careLabelType: string;
    careLabelPosition: string;
    careLabelContent: string;
    hasLogo: boolean;
    logoApplication?: string;
    logoPosition?: string;
    logoWidth?: number; // in cm
    logoHeight?: number; // in cm
    logoFile?: File | null;
    logoFileName?: string;
    extras: {
        pockets: string;
        drawstrings: string;
        zipper: string;
        buttons: string;
    };
}

// Step 3: Grading
export type Size = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';
export const SIZES: Size[] = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export type MeasurementPoint = 'A. Chest Width' | 'B. Body Length' | 'C. Shoulder' | 'D. Sleeve Length' | 'E. Armhole' | 'F. Neck Width' | 'G. Hem Width';
export const MEASUREMENT_POINTS: MeasurementPoint[] = ['A. Chest Width', 'B. Body Length', 'C. Shoulder', 'D. Sleeve Length', 'E. Armhole', 'F. Neck Width', 'G. Hem Width'];


export type GradingTable = Record<Size, Record<MeasurementPoint, number | string>>;

export interface Grading {
    sizes: Size[];
    table: GradingTable;
    tolerance: number; // in cm
    unit: 'cm' | 'in';
}

// Step 4: Project Info
export interface ProjectInfo {
    projectName: string;
    sku: string;
    designer: string;
    date: string;
    notes: string;
}

// Main Data Structure
export interface TechPack {
    project: ProjectInfo;
    base: BaseConstruction;
    bom: BillOfMaterials;
    construction: ConstructionDetails;
    finishes: LabelsAndFinishes;
    grading: Grading;
    flatSketches: {
        front: string; // SVG string
        back: string; // SVG string
    } | null;
}