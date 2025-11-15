import type { MockupProduct, MockupCustomization, CustomizationOption } from '../../types';

export const productCategories: MockupProduct['category'][] = ['Tops', 'Felpe', 'Outerwear', 'Pantaloni', 'Accessori'];

const fitCustomization: MockupCustomization = {
    id: 'fit',
    name: 'Fit',
    defaultOptionId: 'tailored',
    options: [
        { id: 'baggy', name: 'Baggy Fit', description: 'Very loose, drop shoulder, extended length, oversized silhouette' },
        { id: 'tailored', name: 'Tailored Fit', 'description': 'Structured, defined shoulders, shaped waist, classic fit' },
        { id: 'crop', name: 'Crop Fit', 'description': 'Shortened length, ends above the waist or ankle' },
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
  // FELPE
  { id: 'hoodie-classic', name: 'Classic Hoodie', category: 'Felpe', description: 'Classic pullover hoodie with kangaroo pocket', fit: 'Tailored', printArea: 'Chest, Back', icon: 'HoodieIcon', customizations: [fitCustomization, sleeveCustomization] },
  { id: 'hoodie-zip-up', name: 'Zip-Up Hoodie', category: 'Felpe', description: 'Full zip-up hoodie', fit: 'Tailored', printArea: 'Left Chest, Back', icon: 'ZipHoodieIcon', customizations: [fitCustomization] },
  { id: 'hoodie-half-zip', name: 'Half-Zip Sweatshirt', category: 'Felpe', description: 'Pullover with a half-zip collar', fit: 'Tailored', printArea: 'Left Chest', icon: 'HalfZipIcon', customizations: [fitCustomization] },
  { id: 'crewneck-classic', name: 'Classic Crewneck', category: 'Felpe', description: 'Classic crewneck sweatshirt', fit: 'Tailored', printArea: 'Chest, Back', icon: 'CrewneckIcon', customizations: [fitCustomization] },

  // PANTALONI
  { id: 'pants-cargo', name: 'Cargo Pants', category: 'Pantaloni', description: 'Pants with large side pockets', fit: 'Baggy', printArea: 'Side Pocket, Thigh', icon: 'CargoPantsIcon', customizations: [fitCustomization] },
  { id: 'pants-track', name: 'Trackpants', category: 'Pantaloni', description: 'Athletic-style trackpants or joggers', fit: 'Tailored', printArea: 'Thigh', icon: 'JoggersIcon', customizations: [fitCustomization] },
  { id: 'pants-denim-straight', name: 'Straight Jeans', category: 'Pantaloni', description: 'Classic straight-leg denim jeans', fit: 'Tailored', printArea: 'Back Pocket, Thigh', icon: 'JeansIcon', customizations: [fitCustomization] },
  { id: 'pants-denim-wide', name: 'Wide-Leg Jeans', category: 'Pantaloni', description: 'Denim jeans with a wide-leg cut', fit: 'Baggy', printArea: 'Back Pocket', icon: 'SweatpantsIcon', customizations: [fitCustomization] },

  // OUTERWEAR
  { id: 'outerwear-puffer-vest', name: 'Puffer Vest', category: 'Outerwear', description: 'Sleeveless insulated puffer vest', fit: 'Tailored', printArea: 'Left Chest, Back', icon: 'PufferJacketIcon', customizations: [fitCustomization] },
  { id: 'outerwear-bomber', name: 'Bomber Jacket', category: 'Outerwear', description: 'Classic bomber jacket with zip front', fit: 'Tailored', printArea: 'Left Chest, Back', icon: 'BomberJacketIcon', customizations: [fitCustomization] },
  { id: 'outerwear-denim-jacket', name: 'Denim Jacket', category: 'Outerwear', description: 'Button-up denim jacket', fit: 'Tailored', printArea: 'Back, Cuffs', icon: 'DenimJacketIcon', customizations: [fitCustomization] },
  { id: 'outerwear-windbreaker', name: 'Windbreaker', category: 'Outerwear', description: 'Lightweight windbreaker jacket', fit: 'Tailored', printArea: 'Chest, Back', icon: 'WindbreakerIcon', customizations: [fitCustomization] },
  { id: 'outerwear-varsity', name: 'Varsity Jacket', category: 'Outerwear', description: 'College-style varsity jacket', fit: 'Tailored', printArea: 'Chest, Back, Sleeves', icon: 'VarsityJacketIcon', customizations: [fitCustomization] },

  // TOPS
  { id: 't-shirt-basic', name: 'Basic T-Shirt', category: 'Tops', description: 'Classic crew neck t-shirt', fit: 'Tailored', printArea: 'Chest, Back', icon: 'TshirtIcon', customizations: [fitCustomization] },
  { id: 't-shirt-longsleeve', name: 'Longsleeve T-Shirt', category: 'Tops', description: 'Long-sleeve crew neck t-shirt', fit: 'Tailored', printArea: 'Chest, Back, Sleeves', icon: 'LongsleeveIcon', customizations: [fitCustomization, sleeveCustomization] },
  { id: 'polo-shirt', name: 'Polo Shirt', category: 'Tops', description: 'Collared polo shirt with button placket', fit: 'Tailored', printArea: 'Left Chest', icon: 'PoloIcon', customizations: [fitCustomization] },
  { id: 'tank-top', name: 'Tank Top', category: 'Tops', description: 'Sleeveless tank top', fit: 'Skinny', printArea: 'Chest', icon: 'TankTopIcon', customizations: [fitCustomization] },
  { id: 'button-up-shirt', name: 'Button-Up Shirt', category: 'Tops', description: 'Classic long-sleeve button-up shirt', fit: 'Tailored', printArea: 'Pocket, Back', icon: 'OversizeLongsleeveIcon', customizations: [fitCustomization] },

  // ACCESSORI (No fit customization)
  { id: 'accessory-socks', name: 'Crew Socks', category: 'Accessori', description: 'Crew-length socks', fit: 'N/A', printArea: 'Side, Top', icon: 'TshirtIcon' }, // Placeholder icon
  { id: 'accessory-boxers', name: 'Boxer Briefs', category: 'Accessori', description: 'Classic boxer briefs', fit: 'N/A', printArea: 'Waistband', icon: 'BasketballShortsIcon' }, // Placeholder icon
  { id: 'accessory-tote-bag', name: 'Tote Bag', category: 'Accessori', description: 'Canvas tote bag', fit: 'N/A', printArea: 'Main Side', icon: 'ToteBagIcon' },
  { id: 'accessory-crossbody-bag', name: 'Crossbody Bag', category: 'Accessori', description: 'Small crossbody bag', fit: 'N/A', printArea: 'Front', icon: 'CrossbodyBagIcon' },
  { id: 'accessory-backpack', name: 'Backpack', category: 'Accessori', description: 'Standard backpack', fit: 'N/A', printArea: 'Front Pocket, Top', icon: 'BackpackIcon' },
  { id: 'accessory-dad-hat', name: 'Dad Hat', category: 'Accessori', description: 'Curved brim baseball cap', fit: 'N/A', printArea: 'Front', icon: 'DadHatIcon' },
];