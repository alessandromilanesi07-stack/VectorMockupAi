interface Feature {
    name: string;
    description: string;
    subFeatures?: { name: string; description: string }[];
}

export const FEATURE_DESCRIPTIONS: Feature[] = [
    {
        name: "Mockup Studio",
        description: "This is the core feature. Users can generate photorealistic, vector-style mockups for a wide range of products (T-shirts, hoodies, jackets, etc.). A user selects a product, style, color, and views to generate blank mockups. They can then upload their own design, and the AI applies it to the mockup.",
        subFeatures: [
            {
                name: "AI Design Variations",
                description: "After applying a design, users can ask the AI to generate several creative variations, altering color schemes, scale, or placement to spark new ideas."
            },
            {
                name: "Tech Pack Generator",
                description: "From a finalized mockup, users can generate a basic technical sheet that includes product views, color codes, and graphic placement notes, bridging the gap to manufacturing."
            },
            {
                name: "Print-on-Demand Ordering",
                description: "Users can download the final image or proceed to a simulated integrated print-on-demand service to order physical products directly from the app."
            }
        ]
    },
    {
        name: "Sourcing Database",
        description: "An integrated database of vetted apparel manufacturers from around the globe. Users can filter by location, Minimum Order Quantity (MOQ), product specialization, and certifications to find the perfect production partner. It provides a seamless workflow from design to sourcing."
    },
    {
        name: "Sketch to Mockup",
        description: "Transforms a user's rough hand-drawn sketch or digital wireframe into a polished, clean mockup. For example, a drawing of a pair of jeans can become a technical flat sketch."
    },
    {
        name: "Brand Hub",
        description: "A central dashboard to manage all brand identities. Users can view and select saved brands, or add a new one by providing a website URL or logo image. The AI then extracts the color palette, typography, and tone of voice. The active brand's assets (like colors and fonts) are then available throughout the app for a consistent workflow."
    },
     {
        name: "AI Trend Forecaster",
        description: "A proactive market analysis tool. Users can input a topic (e.g., 'streetwear for Summer 2025'), and the AI uses Google Search to analyze real-time data from social media, fashion blogs, and e-commerce sites. It then generates a detailed report on emerging color palettes, trending styles, and key garments, giving users a competitive edge."
    },
    {
        name: "AI Brand Copywriter",
        description: "An AI-powered copywriter that generates on-brand text. Users upload a product image, specify the product name, and describe their brand's tone of voice. The AI then produces marketing copy, including product descriptions for e-commerce, Instagram captions, and email subject lines."
    },
    {
        name: "Advanced Editor",
        description: "A canvas-based, layer-aware image editor. Users can add images, text, and shapes, apply clipping masks, adjust colors, and transform objects with precision. It's like a simplified Photoshop/Figma inside the app."
    },
    {
        name: "Image & Code Generator",
        description: "A two-step tool based on Imagen 4. First, it generates a high-quality image from a text prompt. Second, if the image is a UI/UX design, the user can generate the corresponding HTML and CSS code."
    },
    {
        name: "AI Assistant (Thinking Mode)",
        description: "You are this feature. An AI-powered assistant that has deep knowledge of all VectorCraft AI functionalities. Users can ask complex questions, request strategies, or seek guidance on how to best use the app to achieve their goals."
    }
];