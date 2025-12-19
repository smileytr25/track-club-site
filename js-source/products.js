// Product Database
const products = [
  {
    id: 'team-jersey',
    name: 'Official Team Jersey',
    category: 'apparel',
    price: 45,
    badge: 'New',
    description: 'High-performance moisture-wicking jersey with official team colors and logo.',
    fullDescription: 'Our official team jersey is designed for peak performance on the track. Made with advanced moisture-wicking fabric that keeps you dry and comfortable during intense training sessions and competitions. Features the iconic Genesee Swift logo and team colors that make you stand out from the competition.',
    features: [
      'Moisture-wicking performance fabric',
      'Lightweight and breathable',
      'Official team colors and logo',
      'Athletic fit for optimal performance',
      'Machine washable'
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    images: ['IMAGE PLACEHOLDER']
  },
  {
    id: 'performance-shorts',
    name: 'Performance Shorts',
    category: 'apparel',
    price: 35,
    description: 'Lightweight running shorts with breathable mesh panels and team branding.',
    fullDescription: 'Engineered for speed and comfort, these performance shorts feature strategic mesh ventilation panels and a secure inner brief. The elastic waistband with drawstring ensures a perfect fit while you push your limits.',
    features: [
      'Lightweight stretch fabric',
      'Breathable mesh panels',
      'Inner compression brief',
      'Secure zip pocket',
      'Reflective team logo'
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    images: ['IMAGE PLACEHOLDER']
  },
  {
    id: 'team-hoodie',
    name: 'Team Hoodie',
    category: 'apparel',
    price: 55,
    badge: 'Popular',
    description: 'Comfortable fleece hoodie perfect for warm-ups and cool weather training.',
    fullDescription: 'Stay warm and represent your team with this premium fleece hoodie. Perfect for pre-race warm-ups, cool-down sessions, or casual wear. Features a comfortable hood, front kangaroo pocket, and embroidered team logo.',
    features: [
      'Soft fleece interior',
      'Adjustable drawstring hood',
      'Front kangaroo pocket',
      'Ribbed cuffs and hem',
      'Embroidered team logo'
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    images: ['IMAGE PLACEHOLDER']
  },
  {
    id: 'athletic-backpack',
    name: 'Athletic Training Backpack',
    category: 'accessories',
    price: 65,
    description: 'Spacious backpack designed for athletes, with multiple compartments for gear organization.',
    fullDescription: 'This professional-grade athletic backpack is built to carry all your training essentials. Features a dedicated shoe compartment, water bottle pockets, and a padded laptop sleeve. The ventilated back panel keeps you comfortable during your commute to practice.',
    features: [
      'Dedicated shoe compartment',
      'Padded laptop sleeve (fits 15")',
      'Multiple organization pockets',
      'Water bottle side pockets',
      'Ventilated back panel',
      'Adjustable padded straps'
    ],
    sizes: ['One Size'],
    images: ['IMAGE PLACEHOLDER']
  },
  {
    id: 'team-cap',
    name: 'Team Performance Cap',
    category: 'accessories',
    price: 22,
    description: 'Moisture-wicking athletic cap with adjustable fit and embroidered team logo.',
    fullDescription: 'Shield yourself from the sun with our lightweight performance cap. The moisture-wicking sweatband keeps perspiration out of your eyes, while the adjustable closure ensures a perfect fit. Embroidered team logo on the front.',
    features: [
      'Moisture-wicking sweatband',
      'Lightweight breathable fabric',
      'Adjustable back closure',
      'Curved brim for sun protection',
      'Embroidered team logo'
    ],
    sizes: ['One Size'],
    images: ['IMAGE PLACEHOLDER']
  },
  {
    id: 'sprint-spikes',
    name: 'Sprint Spike Shoes',
    category: 'equipment',
    price: 95,
    badge: 'Essential',
    description: 'Professional-grade track spikes for maximum speed and traction on the track.',
    fullDescription: 'Engineered for explosive speed, these sprint spikes feature a rigid spike plate for maximum energy return and removable ceramic spikes for optimal traction. The breathable mesh upper keeps your feet cool while the snug fit ensures stability during high-speed sprints.',
    features: [
      'Rigid spike plate for energy return',
      'Breathable mesh upper',
      'Removable ceramic spikes included',
      'Snug performance fit',
      'Lightweight construction',
      'Includes spike wrench'
    ],
    sizes: ['6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11', '11.5', '12', '13'],
    images: ['IMAGE PLACEHOLDER']
  },
  {
    id: 'resistance-bands',
    name: 'Resistance Band Set',
    category: 'equipment',
    price: 35,
    description: 'Complete set of resistance bands for strength training and injury prevention.',
    fullDescription: 'This comprehensive resistance band set includes five different resistance levels, allowing you to progressively build strength. Perfect for warm-ups, strength training, and rehabilitation exercises. Comes with a carrying pouch and exercise guide.',
    features: [
      '5 resistance levels (5-25 lbs)',
      'Durable latex construction',
      'Comfortable foam handles',
      'Door anchor included',
      'Carrying pouch',
      'Exercise guide included'
    ],
    sizes: ['One Size'],
    images: ['IMAGE PLACEHOLDER']
  },
  {
    id: 'water-bottle',
    name: 'Team Water Bottle',
    category: 'accessories',
    price: 18,
    badge: 'Essential',
    description: 'BPA-free sports water bottle with team logo and measurement markers.',
    fullDescription: 'Stay hydrated with our 32oz BPA-free water bottle. Features easy-to-read measurement markers, a leak-proof flip lid, and a carry loop for convenience. Dishwasher safe and printed with the Genesee Swift logo.',
    features: [
      '32oz capacity',
      'BPA-free Tritan material',
      'Leak-proof flip lid',
      'Measurement markers',
      'Carry loop',
      'Dishwasher safe'
    ],
    sizes: ['One Size'],
    images: ['IMAGE PLACEHOLDER']
  },
  {
    id: 'training-tights',
    name: 'Training Compression Tights',
    category: 'apparel',
    price: 48,
    description: 'Full-length compression tights for enhanced performance and muscle support.',
    fullDescription: 'These premium compression tights provide graduated compression to enhance blood flow and reduce muscle fatigue. The moisture-wicking fabric keeps you dry, while the flatlock seams prevent chafing during long training sessions.',
    features: [
      'Graduated compression technology',
      'Moisture-wicking fabric',
      'Flatlock seams prevent chafing',
      'Secure zip pocket',
      'Reflective details',
      'UPF 50+ sun protection'
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    images: ['IMAGE PLACEHOLDER']
  },
  {
    id: 'gym-bag',
    name: 'Team Duffel Bag',
    category: 'accessories',
    price: 45,
    description: 'Durable duffel bag with separate shoe compartment and team logo.',
    fullDescription: 'This versatile duffel bag is perfect for practice and competition. Features a U-shaped opening for easy access, a ventilated shoe compartment, and multiple pockets for organization. Made with water-resistant material to protect your gear.',
    features: [
      'Water-resistant material',
      'Separate ventilated shoe compartment',
      'U-shaped main opening',
      'Adjustable shoulder strap',
      'Multiple organization pockets',
      'Embroidered team logo'
    ],
    sizes: ['One Size'],
    images: ['IMAGE PLACEHOLDER']
  }
];

// Get product by ID
function getProductById(id) {
  return products.find(product => product.id === id);
}

// Get products by category
function getProductsByCategory(category) {
  if (category === 'all') return products;
  return products.filter(product => product.category === category);
}

// Make functions and data globally available
window.products = products;
window.getProductById = getProductById;
window.getProductsByCategory = getProductsByCategory;
