export interface CustomizationOption {
  id: string;
  name: string;
  description: string; // Used in the prompt
}

export interface MockupCustomization {
  id: string;
  name: string;
  options: CustomizationOption[];
  defaultOptionId: string;
}

export interface MockupProduct {
  id: string;
  name: string;
  category: 'Tops' | 'Felpe' | 'Giacche & Outerwear' | 'Pantaloni' | 'Accessori';
  description: string;
  fit: 'regular' | 'oversize' | 'slim' | 'comfy';
  printArea: string;
  icon: string;
  customizations?: MockupCustomization[];
}

export const productCategories: MockupProduct['category'][] = ['Tops', 'Felpe', 'Giacche & Outerwear', 'Pantaloni', 'Accessori'];

export const products: MockupProduct[] = [
  // Tops
  { 
    id: 't-shirt-basic', 
    name: 'T-shirt Basica', 
    category: 'Tops', 
    description: 'Classic regular fit crew neck t-shirt', 
    fit: 'regular', 
    printArea: 'chest', 
    icon: 'TshirtIcon',
    customizations: [
      {
        id: 'collar',
        name: 'Colletto',
        defaultOptionId: 'crew',
        options: [
          { id: 'crew', name: 'Girocollo', description: 'Classic round crew neck' },
          { id: 'v-neck', name: 'A V', description: 'V-neck collar' },
        ],
      },
      {
        id: 'fabric',
        name: 'Tessuto',
        defaultOptionId: 'standard',
        options: [
          { id: 'standard', name: 'Standard', description: 'Standard cotton fabric' },
          { id: 'heavyweight', name: 'Heavyweight', description: 'Heavyweight, thick cotton fabric' },
          { id: 'vintage', name: 'Vintage', description: 'Slightly faded, vintage-wash cotton fabric' },
        ],
      },
    ],
  },
  { id: 't-shirt-oversize', name: 'T-shirt Oversize', category: 'Tops', description: 'Oversized t-shirt with dropped shoulders and a boxy fit', fit: 'oversize', printArea: 'chest', icon: 'OversizeTshirtIcon' },
  { id: 't-shirt-crop', name: 'T-shirt Crop', category: 'Tops', description: 'Cropped length t-shirt with a streetwear fit', fit: 'regular', printArea: 'chest', icon: 'CropTopIcon' },
  { id: 'polo', name: 'Polo', category: 'Tops', description: 'Classic polo shirt with a collar and button placket', fit: 'regular', printArea: 'left chest', icon: 'PoloIcon' },
  { id: 'tank-top', name: 'Canotta', category: 'Tops', description: 'Sleeveless tank top with a regular fit', fit: 'regular', printArea: 'chest', icon: 'TankTopIcon' },
  { id: 'longsleeve', name: 'Maniche Lunghe', category: 'Tops', description: 'Slim or regular fit long-sleeve t-shirt', fit: 'slim', printArea: 'chest', icon: 'LongsleeveIcon' },
  { id: 'longsleeve-oversize', name: 'Longsleeve Oversize', category: 'Tops', description: 'Oversized long-sleeve t-shirt with a streetwear fit', fit: 'oversize', printArea: 'chest', icon: 'OversizeLongsleeveIcon' },
  
  // Felpe
  { id: 'crewneck', name: 'Felpa Girocollo', category: 'Felpe', description: 'Classic crewneck sweatshirt without a hood', fit: 'regular', printArea: 'chest', icon: 'CrewneckIcon' },
  { 
    id: 'hoodie', 
    name: 'Hoodie', 
    category: 'Felpe', 
    description: 'Classic hoodie with a kangaroo pocket and drawstring hood', 
    fit: 'regular', 
    printArea: 'chest', 
    icon: 'HoodieIcon',
    customizations: [
        {
            id: 'pocket',
            name: 'Tasca',
            defaultOptionId: 'kangaroo',
            options: [
                { id: 'kangaroo', name: 'Canguro', description: 'With a classic front kangaroo pocket' },
                { id: 'none', name: 'Senza Tasca', description: 'Without a front pocket for a cleaner look' },
            ],
        },
        {
            id: 'drawstrings',
            name: 'Lacci Cappuccio',
            defaultOptionId: 'with',
            options: [
                { id: 'with', name: 'Con Lacci', description: 'With standard hood drawstrings' },
                { id: 'without', name: 'Senza Lacci', description: 'Without hood drawstrings for a minimalist style' },
            ],
        },
    ]
  },
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
  {
    id: 'jeans-straight',
    name: 'Jeans Straight',
    category: 'Pantaloni',
    description: 'Classic straight-cut jeans',
    fit: 'regular',
    printArea: 'back pocket',
    icon: 'JeansIcon',
    customizations: [
      {
        id: 'wear',
        name: 'Usura',
        defaultOptionId: 'none',
        options: [
          { id: 'none', name: 'Nessuna', description: 'Clean, new denim with no wear' },
          { id: 'light', name: 'Leggermente Strappati', description: 'Lightly distressed with some rips and fading' },
        ],
      },
    ],
  },
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