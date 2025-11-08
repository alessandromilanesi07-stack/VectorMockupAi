export interface MockupProduct {
  id: string;
  name: string;
  category: 'Tops' | 'Felpe' | 'Giacche & Outerwear' | 'Pantaloni' | 'Accessori';
  description: string;
  fit: 'regular' | 'oversize' | 'slim' | 'comfy';
  printArea: string;
  icon: string;
}

export interface MockupStyle {
  id: string;
  name: string;
  aesthetic: string;
  characteristics: string[];
  background: string;
  lighting: string;
  references: string[];
  tooltip: string;
}

export const productCategories: MockupProduct['category'][] = ['Tops', 'Felpe', 'Giacche & Outerwear', 'Pantaloni', 'Accessori'];

export const products: MockupProduct[] = [
  // Tops
  { id: 't-shirt-basic', name: 'T-shirt Basica', category: 'Tops', description: 'Classic regular fit crew neck t-shirt', fit: 'regular', printArea: 'chest', icon: 'TshirtIcon' },
  { id: 't-shirt-oversize', name: 'T-shirt Oversize', category: 'Tops', description: 'Oversized t-shirt with dropped shoulders and a boxy fit', fit: 'oversize', printArea: 'chest', icon: 'OversizeTshirtIcon' },
  { id: 't-shirt-crop', name: 'T-shirt Crop', category: 'Tops', description: 'Cropped length t-shirt with a streetwear fit', fit: 'regular', printArea: 'chest', icon: 'CropTopIcon' },
  { id: 'polo', name: 'Polo', category: 'Tops', description: 'Classic polo shirt with a collar and button placket', fit: 'regular', printArea: 'left chest', icon: 'PoloIcon' },
  { id: 'tank-top', name: 'Canotta', category: 'Tops', description: 'Sleeveless tank top with a regular fit', fit: 'regular', printArea: 'chest', icon: 'TankTopIcon' },
  { id: 'longsleeve', name: 'Maniche Lunghe', category: 'Tops', description: 'Slim or regular fit long-sleeve t-shirt', fit: 'slim', printArea: 'chest', icon: 'LongsleeveIcon' },
  { id: 'longsleeve-oversize', name: 'Longsleeve Oversize', category: 'Tops', description: 'Oversized long-sleeve t-shirt with a streetwear fit', fit: 'oversize', printArea: 'chest', icon: 'OversizeLongsleeveIcon' },
  
  // Felpe
  { id: 'crewneck', name: 'Felpa Girocollo', category: 'Felpe', description: 'Classic crewneck sweatshirt without a hood', fit: 'regular', printArea: 'chest', icon: 'CrewneckIcon' },
  { id: 'hoodie', name: 'Hoodie', category: 'Felpe', description: 'Classic hoodie with a kangaroo pocket and drawstring hood', fit: 'regular', printArea: 'chest', icon: 'HoodieIcon' },
  { id: 'hoodie-oversize', name: 'Hoodie Oversize', category: 'Felpe', description: 'Oversized hoodie with a loose fit and extended length', fit: 'oversize', printArea: 'chest', icon: 'OversizeHoodieIcon' },
  { id: 'hoodie-zip-up', name: 'Hoodie Zip-up', category: 'Felpe', description: 'Full zip-up hoodie', fit: 'regular', printArea: 'left chest or back', icon: 'ZipHoodieIcon' },
  { id: 'half-zip', name: 'Half-zip Sweatshirt', category: 'Felpe', description: 'Sweatshirt with a short zipper at the neck', fit: 'regular', printArea: 'left chest', icon: 'HalfZipIcon' },
  
  // Giacche & Outerwear
  { id: 'bomber-jacket', name: 'Bomber Jacket', category: 'Giacche & Outerwear', description: 'Classic bomber jacket with a front zip and elastic cuffs', fit: 'regular', printArea: 'back', icon: 'BomberJacketIcon' },
  { id: 'denim-jacket', name: 'Denim Jacket', category: 'Giacche & Outerwear', description: 'Classic denim jacket with front buttons', fit: 'regular', printArea: 'back', icon: 'DenimJacketIcon' },
  { id: 'coach-jacket', name: 'Coach Jacket', category: 'Giacche & Outerwear', description: 'Sporty coach jacket with snap buttons', fit: 'regular', printArea: 'back', icon: 'CoachJacketIcon' },
  { id: 'windbreaker', name: 'Windbreaker', category: 'Giacche & Outerwear', description: 'Lightweight nylon windbreaker jacket', fit: 'regular', printArea: 'chest or back', icon: 'WindbreakerIcon' },
  { id: 'puffer-jacket', name: 'Puffer Jacket', category: 'Giacche & Outerwear', description: 'Quilted, insulated puffer jacket', fit: 'regular', printArea: 'left chest', icon: 'PufferJacketIcon' },
  { id: 'varsity-jacket', name: 'Varsity Jacket', category: 'Giacche & Outerwear', description: 'College-style varsity jacket with contrasting sleeves', fit: 'regular', printArea: 'left chest and back', icon: 'VarsityJacketIcon' },
  
  // Pantaloni
  { id: 'cargo-pants', name: 'Cargo Pants', category: 'Pantaloni', description: 'Comfortable fit cargo pants with multiple side pockets', fit: 'comfy', printArea: 'side pocket', icon: 'CargoPantsIcon' },
  { id: 'joggers', name: 'Joggers', category: 'Pantaloni', description: 'Sporty joggers with elastic ankle cuffs', fit: 'comfy', printArea: 'thigh', icon: 'JoggersIcon' },
  { id: 'sweatpants', name: 'Sweatpants', category: 'Pantaloni', description: 'Classic cotton fleece sweatpants', fit: 'comfy', printArea: 'thigh', icon: 'SweatpantsIcon' },
  { id: 'jeans-straight', name: 'Jeans Straight', category: 'Pantaloni', description: 'Classic straight-cut jeans', fit: 'regular', printArea: 'back pocket', icon: 'JeansIcon' },
  { id: 'jeans-slim', name: 'Jeans Slim', category: 'Pantaloni', description: 'Slim fit jeans, not skinny', fit: 'slim', printArea: 'back pocket', icon: 'SlimJeansIcon' },
  { id: 'shorts-cargo', name: 'Shorts Cargo', category: 'Pantaloni', description: 'Shorts with multiple side pockets', fit: 'comfy', printArea: 'side pocket', icon: 'CargoShortsIcon' },
  { id: 'shorts-basketball', name: 'Basketball Shorts', category: 'Pantaloni', description: 'Wide, technical fabric basketball shorts', fit: 'comfy', printArea: 'lower leg', icon: 'BasketballShortsIcon' },

  // Accessori
  { id: 'dad-hat', name: 'Cappellino Baseball', category: 'Accessori', description: 'Classic curved-brim baseball cap', fit: 'regular', printArea: 'front panel', icon: 'DadHatIcon' },
  { id: 'beanie', name: 'Beanie', category: 'Accessori', description: 'Cotton or wool beanie', fit: 'regular', printArea: 'front cuff', icon: 'BeanieIcon' },
  { id: 'bucket-hat', name: 'Bucket Hat', category: 'Accessori', description: 'Trendy bucket hat', fit: 'regular', printArea: 'front', icon: 'BucketHatIcon' },
  { id: 'snapback', name: 'Snapback', category: 'Accessori', description: 'Flat-brim snapback cap', fit: 'regular', printArea: 'front panel', icon: 'SnapbackIcon' },
  { id: 'backpack', name: 'Zaino', category: 'Accessori', description: 'Urban streetwear backpack', fit: 'regular', printArea: 'front panel', icon: 'BackpackIcon' },
  { id: 'crossbody-bag', name: 'Borsa Tracolla', category: 'Accessori', description: 'Crossbody or messenger bag', fit: 'regular', printArea: 'front', icon: 'CrossbodyBagIcon' },
  { id: 'tote-bag', name: 'Tote Bag', category: 'Accessori', description: 'Unisex shopper tote bag', fit: 'regular', printArea: 'main side', icon: 'ToteBagIcon' },
];

export const styles: MockupStyle[] = [
  { id: 'streetwear', name: 'Streetwear', aesthetic: 'Urban, hype culture, bold graphics-ready', characteristics: ['Large logos', 'Bold graphics', 'Oversized fits'], background: 'Urban environment, graffiti wall, or minimal studio', lighting: 'Harsh studio lighting with strong shadows', references: ['Supreme', 'Off-White', 'Stüssy'], tooltip: 'Bold and urban. Perfect for hype brands.' },
  { id: 'minimalist', name: 'Minimalist / Essentials', aesthetic: 'Clean, logoless, neutral palette', characteristics: ['No visible branding', 'Clean cuts', 'Focus on fabric quality'], background: 'White or grey seamless backdrop', lighting: 'Soft, diffused lighting with no harsh shadows', references: ['COS', 'Uniqlo U', 'The Row'], tooltip: 'Clean and timeless. For high-quality basics.' },
  { id: 'techwear', name: 'Techwear / Utility', aesthetic: 'Functional, futuristic, tactical', characteristics: ['Multiple pockets', 'Zippers and straps', 'Technical materials'], background: 'Industrial or dark, moody environment', lighting: 'Dramatic, focused lighting', references: ['Acronym', 'Nike ACG', 'Guerrilla Group'], tooltip: 'Futuristic and functional. For performance-focused brands.' },
  { id: 'y2k', name: 'Y2K Revival', aesthetic: 'Nostalgic 2000s, bold, shiny', characteristics: ['Retro tech graphics', 'Chunky fonts', 'Chrome effects'], background: 'Colorful gradients, digital abstract patterns', lighting: 'Bright, high-contrast lighting', references: ['Early 2000s MTV', 'Cyber Y2K fashion'], tooltip: 'Nostalgic and loud. For retro-inspired designs.' },
  { id: 'vintage', name: 'Vintage / Thrifted', aesthetic: 'Worn-in, retro, unique look', characteristics: ['Washed out, faded textures', 'Retro graphics', 'Classic fits'], background: 'Grunge texture or aged paper effect', lighting: 'Natural, slightly faded light', references: ['80s band tees', '90s workwear'], tooltip: 'Aged and authentic. For retro and band merch.' },
  { id: 'athletic', name: 'Athletic / Sportswear', aesthetic: 'Performance, dynamic, sporty', characteristics: ['Dynamic lines', 'Sporty logos', 'Technical fabrics'], background: 'Clean studio or sports-related setting (track, court)', lighting: 'Clean, bright studio lighting', references: ['Nike', 'Adidas', 'Puma'], tooltip: 'Dynamic and performance-oriented. For sports brands.' },
  { id: 'skate', name: 'Skate Culture', aesthetic: 'Rebellious, casual, DIY vibe', characteristics: ['Underground graphics', 'Comfortable, durable fits', 'Checker patterns'], background: 'Skatepark or urban decay setting', lighting: 'Natural daylight or harsh flash', references: ['Vans', 'Thrasher', 'Palace'], tooltip: 'Casual and rebellious. For skate and counter-culture brands.' },
  { id: 'anime', name: 'Anime / Gaming', aesthetic: 'Pop culture, fandom, statement piece', characteristics: ['Character art', 'References to series/games', 'Detailed graphics'], background: 'Neon/cyberpunk city or clean to focus on graphic', lighting: 'Vibrant, colorful, neon-tinged lighting', references: ['Otaku culture', 'Esports merch'], tooltip: 'Vibrant and expressive. For pop culture and fandoms.' },
  { id: 'gorpcore', name: 'Gorpcore / Outdoor', aesthetic: 'Urban hiking style, functional fashion', characteristics: ['Outdoor materials', 'Zippers and technical details', 'Earthy tones'], background: 'Natural landscape or studio with natural elements', lighting: 'Clean, natural daylight', references: ['Patagonia', 'Arc\'teryx', 'Salomon'], tooltip: 'Functional and outdoorsy. For nature-inspired brands.' },
  { id: 'luxury-streetwear', name: 'Luxury Streetwear', aesthetic: 'High-end street, logomania, status', characteristics: ['Premium branding', 'Curated oversized fits', 'Monochromatic colors'], background: 'High-end studio, marble, luxury setting', lighting: 'Polished, high-end studio lighting', references: ['Balenciaga', 'Gucci', 'Fear of God'], tooltip: 'Premium and curated. For high-fashion streetwear.' },
];
