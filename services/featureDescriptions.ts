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
        name: "Brand Kit Extractor",
        description: "A powerful tool for market research and brand identity creation. The user provides a website URL, and the AI analyzes it to extract its color palette, typography, and a description of its logo."
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
        name: "Image Editor",
        description: "An AI-powered photo editor. Users upload an image and use natural language prompts to make changes (e.g., 'change the background to a beach,' 'add a vintage film grain effect')."
    },
    {
        name: "Image & Code Generator",
        description: "A two-step tool based on Imagen 4. First, it generates a high-quality image from a text prompt. Second, if the image is a UI/UX design, the user can generate the corresponding HTML and CSS code."
    },
    {
        name: "Grounded Search",
        description: "A search engine powered by Google Search. It provides up-to-date answers to factual questions and cites its sources."
    }
];
