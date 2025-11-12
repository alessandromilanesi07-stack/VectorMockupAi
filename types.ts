export type View = 'studio' | 'editor' | 'generator' | 'thinking' | 'search' | 'sketch' | 'brand' | 'trends' | 'copywriter';

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
    imageUrl: string;
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