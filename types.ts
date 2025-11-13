
export type View = 'studio' | 'editor' | 'generator' | 'sketch' | 'brand' | 'trends' | 'copywriter' | 'sourcing';

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export interface BrandKitData {
    colors: {
        primary: string;
        secondary: string;
        accent: string;
        neutral: string;
    };
    fonts: {
        heading: string;
        body: string;
    };
    logoDescription: string;
    toneOfVoice?: string;
}

export interface SavedProductCustomization {
    name: string;
    option: string;
}

export interface SavedProduct {
    id: string;
    productName: string;
    color: string;
    imageUrl: string; // Can be base64 SVG or raster
    customizations: SavedProductCustomization[];
}

export interface Brand {
    id: string;
    name: string;
    kit: BrandKitData;
    products?: SavedProduct[];
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

// Sourcing Module Types
export interface BrandReference {
    tier: 1 | 2 | 3;
    name: string;
}

export interface Manufacturer {
    id: string;
    name: string;
    country: string;
    city: string;
    region: 'Asia' | 'Europe' | 'America' | 'Middle East' | 'Africa';
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
        leadTime: string; // e.g., "45-60 days"
        monthlyCapacity: string; // e.g., "50,000 pcs/month"
        sampleTime: string; // e.g., "7-10 days"
    };
    pricing: {
        range: '$' | '$$' | '$$$';
        examples: { item: string, cost: string }[];
        paymentTerms: string;
    };
    brandReferences: BrandReference[];
    contact: {
        email: string;
        website: string;
        whatsapp?: string;
        b2bProfile?: string;
    };
}
