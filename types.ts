// This file is intentionally left sparse for the MVP.
// As the application grows, shared types can be defined here.

export type ApplicationType = 'Print' | 'Embroidery';

// FIX: Define and export all missing shared types.
export type View =
  | 'studio'
  | 'editor'
  | 'generator'
  | 'thinking'
  | 'search'
  | 'sketch'
  | 'brandHub'
  | 'trends'
  | 'copywriter'
  | 'sourcing';


export interface BrandKitData {
    colors: {
        primary?: string;
        secondary?: string;
        accent?: string;
        neutral?: string;
    };
    fonts: {
        heading?: string;
        body?: string;
    };
    logoDescription?: string;
    toneOfVoice?: string;
}

export interface Brand {
    id: string;
    name: string;
    kit: BrandKitData;
    logoImage?: string;
}

export interface GroundingChunk {
    web?: {
        uri: string;
        title: string;
    };
    maps?: {
        uri: string;
        title: string;
        placeAnswerSources?: {
            reviewSnippets?: any[];
        };
    };
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
  region: string;
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
  brandReferences: {
    tier: 1 | 2 | 3;
    name: string;
  }[];
  contact: {
    email: string;
    website: string;
    whatsapp?: string;
  };
}
