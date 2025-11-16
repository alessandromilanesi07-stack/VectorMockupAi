import type { MockupProduct, MockupCustomization, CustomizationOption } from '../../types';

// FIX: Align product categories with the type definition in types.ts.
export const productCategories: MockupProduct['category'][] = ['Tops', 'Felpe', 'Outerwear', 'Pantaloni', 'Accessori'];

const fitCustomization: MockupCustomization = {
    id: 'fit',
    name: 'Fit',
    defaultOptionId: 'tailored',
    options: [
        { id: 'tailored', name: 'Regular Fit', 'description': 'Structured, shaped waist, classic standard fit' },
        { id: 'baggy', name: 'Oversized Fit', description: 'Very loose, drop shoulder, oversized silhouette' },
        { id: 'boxy', name: 'Boxy Fit', 'description': 'Straight, squared-off cut, often shorter in length' },
        { id: 'athletic', name: 'Athletic Fit', 'description': 'Tapered body with more room in chest and shoulders' },
        { id: 'crop', name: 'Crop Fit', 'description': 'Shortened length, ends above the waist' },
        { id: 'skinny', name: 'Skinny Fit', 'description': 'Stretchy, form-fitting, follows the body shape' },
    ]
};

const sleeveCustomization: MockupCustomization = {
    id: 'sleeve',
    name: 'Sleeve Style',
    defaultOptionId: 'set-in',
    options: [
        { id: 'set-in', name: 'Set-in', description: 'Standard set-in sleeves, attached at the shoulder' },
        { id: 'raglan', name: 'Raglan', description: 'Sporty raglan sleeves with diagonal seams from the collar to the underarm' },
        { id: 'drop-shoulder', name: 'Drop Shoulder', description: 'Relaxed drop shoulder seams, positioned lower on the arm' },
    ]
};


export const products: MockupProduct[] = [
  // T-SHIRT & CANOTTE
  // FIX: Updated category to 'Tops' to match type definition.
  { id: 't-shirt-basic', name: 'Basic T-Shirt', category: 'Tops', description: 'Classic crew neck t-shirt', fit: 'Tailored', printArea: 'Chest, Back', icon: 'TshirtIcon', customizations: [fitCustomization] },
  // FIX: Updated category to 'Tops' to match type definition.
  { id: 't-shirt-oversize', name: 'Oversize T-Shirt', category: 'Tops', description: 'Oversized, drop-shoulder t-shirt', fit: 'Baggy', printArea: 'Chest, Back', icon: 'OversizeTshirtIcon', customizations: [fitCustomization] },
  // FIX: Updated category to 'Tops' to match type definition.
  { id: 't-shirt-crop', name: 'Crop Top', category: 'Tops', description: 'Shortened crop-style t-shirt', fit: 'Crop', printArea: 'Chest', icon: 'CropTopIcon', customizations: [fitCustomization] },
  // FIX: Updated category to 'Tops' to match type definition.
  { id: 't-shirt-longsleeve', name: 'Longsleeve T-Shirt', category: 'Tops', description: 'Long-sleeve crew neck t-shirt', fit: 'Tailored', printArea: 'Chest, Back, Sleeves', icon: 'LongsleeveIcon', customizations: [fitCustomization, sleeveCustomization] },
  // FIX: Updated category to 'Tops' to match type definition.
  { id: 'polo-shirt', name: 'Polo Shirt', category: 'Tops', description: 'Collared polo shirt with button placket', fit: 'Tailored', printArea: 'Left Chest', icon: 'PoloIcon', customizations: [fitCustomization] },
  // FIX: Updated category to 'Tops' to match type definition.
  { id: 'tank-top', name: 'Tank Top', category: 'Tops', description: 'Sleeveless tank top', fit: 'Skinny', printArea: 'Chest', icon: 'TankTopIcon', customizations: [fitCustomization] },
  // FIX: Updated category to 'Tops' to match type definition.
  { id: 'button-up-shirt', name: 'Button-Up Shirt', category: 'Tops', description: 'Classic long-sleeve button-up shirt', fit: 'Tailored', printArea: 'Pocket, Back', icon: 'OversizeLongsleeveIcon', customizations: [fitCustomization] },
  
  // FELPE
  { id: 'crewneck-classic', name: 'Classic Crewneck', category: 'Felpe', description: 'Classic crewneck sweatshirt', fit: 'Tailored', printArea: 'Chest, Back', icon: 'CrewneckIcon', customizations: [fitCustomization, sleeveCustomization] },
  { id: 'hoodie-classic', name: 'Classic Hoodie', category: 'Felpe', description: 'Classic pullover hoodie with kangaroo pocket', fit: 'Tailored', printArea: 'Chest, Back', icon: 'HoodieIcon', customizations: [fitCustomization, sleeveCustomization] },
  { id: 'hoodie-oversize', name: 'Oversize Hoodie', category: 'Felpe', description: 'Oversized, drop-shoulder hoodie', fit: 'Baggy', printArea: 'Chest, Back', icon: 'OversizeHoodieIcon', customizations: [fitCustomization] },
  { id: 'hoodie-zip-up', name: 'Zip-Up Hoodie', category: 'Felpe', description: 'Full zip-up hoodie', fit: 'Tailored', printArea: 'Left Chest, Back', icon: 'ZipHoodieIcon', customizations: [fitCustomization] },
  { id: 'sweatshirt-zip-up', name: 'Zip-Up Sweatshirt', category: 'Felpe', description: 'Full zip-up sweatshirt without hood', fit: 'Tailored', printArea: 'Left Chest, Back', icon: 'HalfZipIcon', customizations: [fitCustomization] },
  { id: 'hoodie-half-zip', name: 'Half-Zip Sweatshirt', category: 'Felpe', description: 'Pullover with a half-zip collar', fit: 'Tailored', printArea: 'Left Chest', icon: 'HalfZipIcon', customizations: [fitCustomization] },

  // PANTALONI & JEANS
  // FIX: Updated category to 'Pantaloni' to match type definition.
  { id: 'pants-cargo', name: 'Cargo Pants', category: 'Pantaloni', description: 'Pants with large side pockets', fit: 'Baggy', printArea: 'Side Pocket, Thigh', icon: 'CargoPantsIcon', customizations: [fitCustomization] },
  // FIX: Updated category to 'Pantaloni' to match type definition.
  { id: 'pants-sweatpants', name: 'Sweatpants', category: 'Pantaloni', description: 'Classic sweatpants', fit: 'Baggy', printArea: 'Thigh', icon: 'SweatpantsIcon', customizations: [fitCustomization] },
  // FIX: Updated category to 'Pantaloni' to match type definition.
  { id: 'pants-track', name: 'Trackpants', category: 'Pantaloni', description: 'Athletic-style trackpants or joggers', fit: 'Tailored', printArea: 'Thigh', icon: 'JoggersIcon', customizations: [fitCustomization] },
  // FIX: Updated category to 'Pantaloni' to match type definition.
  { id: 'pants-denim-straight', name: 'Straight Jeans', category: 'Pantaloni', description: 'Classic straight-leg denim jeans', fit: 'Tailored', printArea: 'Back Pocket, Thigh', icon: 'JeansIcon', customizations: [fitCustomization] },
  // FIX: Updated category to 'Pantaloni' to match type definition.
  { id: 'pants-denim-skinny', name: 'Skinny Jeans', category: 'Pantaloni', description: 'Tight-fitting from waist to ankle', fit: 'Skinny', printArea: 'Back Pocket', icon: 'SlimJeansIcon', customizations: [fitCustomization] },
  // FIX: Updated category to 'Pantaloni' to match type definition.
  { id: 'pants-denim-slim', name: 'Slim-Fit Jeans', category: 'Pantaloni', description: 'Slim-fit denim jeans', fit: 'Skinny', printArea: 'Back Pocket', icon: 'SlimJeansIcon', customizations: [fitCustomization] },
  // FIX: Updated category to 'Pantaloni' to match type definition.
  { id: 'pants-denim-bootcut', name: 'Bootcut Jeans', category: 'Pantaloni', description: 'Slightly flared from the knee to accommodate boots', fit: 'Tailored', printArea: 'Back Pocket', icon: 'JeansIcon', customizations: [fitCustomization] },
  // FIX: Updated category to 'Pantaloni' to match type definition.
  { id: 'pants-denim-flare', name: 'Flare Jeans', category: 'Pantaloni', description: 'Denim jeans with a flared leg from the knee down', fit: 'Tailored', printArea: 'Back Pocket', icon: 'JeansIcon', customizations: [fitCustomization] },
  // FIX: Updated category to 'Pantaloni' to match type definition.
  { id: 'pants-denim-baggy', name: 'Baggy Jeans', category: 'Pantaloni', description: 'Very loose fitting baggy denim jeans', fit: 'Baggy', printArea: 'Back Pocket, Thigh', icon: 'JeansIcon', customizations: [fitCustomization] },
  // FIX: Updated category to 'Pantaloni' to match type definition.
  { id: 'pants-denim-wide', name: 'Wide-Leg Jeans', category: 'Pantaloni', description: 'Denim jeans with a wide-leg cut', fit: 'Baggy', printArea: 'Back Pocket', icon: 'JeansIcon', customizations: [fitCustomization] },
  // FIX: Updated category to 'Pantaloni' to match type definition.
  { id: 'pants-shorts-cargo', name: 'Cargo Shorts', category: 'Pantaloni', description: 'Shorts with large side pockets', fit: 'Baggy', printArea: 'Side Pocket, Thigh', icon: 'CargoShortsIcon', customizations: [fitCustomization] },
  // FIX: Updated category to 'Pantaloni' to match type definition.
  { id: 'pants-shorts-basketball', name: 'Basketball Shorts', category: 'Pantaloni', description: 'Athletic mesh basketball shorts', fit: 'Baggy', printArea: 'Thigh', icon: 'BasketballShortsIcon' },
  
  // OUTERWEAR
  { id: 'outerwear-bomber', name: 'Bomber Jacket', category: 'Outerwear', description: 'Classic bomber jacket with zip front', fit: 'Tailored', printArea: 'Left Chest, Back', icon: 'BomberJacketIcon', customizations: [fitCustomization] },
  { id: 'outerwear-denim-jacket', name: 'Denim Jacket', category: 'Outerwear', description: 'Button-up denim jacket', fit: 'Tailored', printArea: 'Back, Cuffs', icon: 'DenimJacketIcon', customizations: [fitCustomization] },
  { id: 'outerwear-coach-jacket', name: 'Coach Jacket', category: 'Outerwear', description: 'Lightweight coach jacket with snap buttons', fit: 'Tailored', printArea: 'Left Chest, Back', icon: 'CoachJacketIcon', customizations: [fitCustomization] },
  { id: 'outerwear-windbreaker', name: 'Windbreaker', category: 'Outerwear', description: 'Lightweight windbreaker jacket', fit: 'Tailored', printArea: 'Chest, Back', icon: 'WindbreakerIcon', customizations: [fitCustomization] },
  { id: 'outerwear-puffer-vest', name: 'Puffer Vest', category: 'Outerwear', description: 'Sleeveless insulated puffer vest', fit: 'Tailored', printArea: 'Left Chest, Back', icon: 'PufferJacketIcon', customizations: [fitCustomization] },
  { id: 'outerwear-puffer-jacket', name: 'Puffer Jacket', category: 'Outerwear', description: 'Insulated puffer jacket with sleeves', fit: 'Tailored', printArea: 'Left Chest, Back', icon: 'PufferJacketIcon', customizations: [fitCustomization] },
  { id: 'outerwear-varsity', name: 'Varsity Jacket', category: 'Outerwear', description: 'College-style varsity jacket', fit: 'Tailored', printArea: 'Chest, Back, Sleeves', icon: 'VarsityJacketIcon', customizations: [fitCustomization] },
  { id: 'outerwear-parka', name: 'Parka', category: 'Outerwear', description: 'Long hooded jacket, often with fur trim', fit: 'Baggy', printArea: 'Back, Chest', icon: 'WindbreakerIcon', customizations: [fitCustomization] },
  { id: 'outerwear-trench-coat', name: 'Trench Coat', category: 'Outerwear', description: 'Classic belted trench coat', fit: 'Tailored', printArea: 'Back', icon: 'CoachJacketIcon', customizations: [fitCustomization] },
  { id: 'outerwear-leather-jacket', name: 'Leather Jacket', category: 'Outerwear', description: 'Classic biker-style leather jacket', fit: 'Tailored', printArea: 'Back', icon: 'BomberJacketIcon', customizations: [fitCustomization] },
  { id: 'outerwear-blazer', name: 'Blazer', category: 'Outerwear', description: 'A casual, unstructured blazer', fit: 'Tailored', printArea: 'Left Chest', icon: 'CoachJacketIcon', customizations: [fitCustomization] },

  // ACCESSORI (No fit customization)
  { id: 'accessory-dad-hat', name: 'Dad Hat', category: 'Accessori', description: 'Curved brim baseball cap', fit: 'N/A', printArea: 'Front', icon: 'DadHatIcon' },
  { id: 'accessory-snapback', name: 'Snapback Hat', category: 'Accessori', description: 'Flat brim baseball cap', fit: 'N/A', printArea: 'Front', icon: 'SnapbackIcon' },
  { id: 'accessory-beanie', name: 'Beanie', category: 'Accessori', description: 'Knit beanie', fit: 'N/A', printArea: 'Front', icon: 'BeanieIcon' },
  { id: 'accessory-bucket-hat', name: 'Bucket Hat', category: 'Accessori', description: 'Bucket hat', fit: 'N/A', printArea: 'Front', icon: 'BucketHatIcon' },
  { id: 'accessory-socks', name: 'Crew Socks', category: 'Accessori', description: 'Crew-length socks', fit: 'N/A', printArea: 'Side, Top', icon: 'TshirtIcon' }, // Placeholder icon
  { id: 'accessory-boxers', name: 'Boxer Briefs', category: 'Accessori', description: 'Classic boxer briefs', fit: 'N/A', printArea: 'Waistband', icon: 'BasketballShortsIcon' }, // Placeholder icon
  { id: 'accessory-tote-bag', name: 'Tote Bag', category: 'Accessori', description: 'Canvas tote bag', fit: 'N/A', printArea: 'Main Side', icon: 'ToteBagIcon' },
  { id: 'accessory-crossbody-bag', name: 'Crossbody Bag', category: 'Accessori', description: 'Small crossbody bag', fit: 'N/A', printArea: 'Front', icon: 'CrossbodyBagIcon' },
  { id: 'accessory-backpack', name: 'Backpack', category: 'Accessori', description: 'Standard backpack', fit: 'N/A', printArea: 'Front Pocket, Top', icon: 'BackpackIcon' },
];
