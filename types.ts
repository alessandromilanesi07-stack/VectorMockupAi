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