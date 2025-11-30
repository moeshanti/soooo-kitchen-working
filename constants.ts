import { Recipe } from './types';

const NOW = Date.now();
const DAY = 24 * 60 * 60 * 1000;

export const PROFILES = [
    { id: 'p1', name: 'Susu', avatar: 'https://images.unsplash.com/photo-1566554273541-37a9ca77b91f?q=80&w=200&auto=format&fit=crop' },
    { id: 'p2', name: 'Papa', avatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?q=80&w=200&auto=format&fit=crop' },
    { id: 'p3', name: 'Sofia', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop' },
    { id: 'p4', name: 'Leo', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop' }
];

export const INITIAL_RECIPES: Recipe[] = [
  {
    id: 'rec_1',
    title: 'Royal Maqluba',
    origin: 'Palestine',
    description: "My grandmother used to say that flipping the Maqluba is the moment truth enters the room. This 'Upside Down' rice dish layers fried vegetables, tender lamb, and spiced rice. It is not just food; it is architecture, built with love and patience.",
    imageUrl: 'https://images.unsplash.com/photo-1628834417730-8d5f35eb270d?q=80&w=1200&auto=format&fit=crop',
    prepTime: 45,
    cookTime: 60,
    difficulty: 'Hard',
    calories: 850,
    ingredients: [
      { item: 'Basmati Rice', amount: '3 cups', priceEstimate: 4.50 },
      { item: 'Lamb Shoulder', amount: '1 kg', priceEstimate: 25.00 },
      { item: 'Eggplant', amount: '2 large', priceEstimate: 3.00 },
      { item: 'Cauliflower', amount: '1 head', priceEstimate: 2.50 },
      { item: 'Potatoes', amount: '3 medium', priceEstimate: 1.50 },
      { item: 'Seven Spice', amount: '2 tbsp', priceEstimate: 1.00 }
    ],
    instructions: [
      { stepNumber: 1, text: 'Wash and soak the rice for 30 minutes. Fry eggplant, cauliflower, and potatoes until golden.', durationMinutes: 20 },
      { stepNumber: 2, text: 'Sear the lamb pieces in a large pot with onions and spices until browned.', durationMinutes: 15 },
      { stepNumber: 3, text: 'Layer the pot: Meat at the bottom, then vegetables, then rice. Add stock carefully.', durationMinutes: 10 },
      { stepNumber: 4, text: 'Simmer on low heat until rice is cooked and liquid absorbed.', durationMinutes: 45 },
      { stepNumber: 5, text: 'The moment of truth: Place a large tray on top and flip the pot swiftly.', durationMinutes: 2 }
    ],
    createdAt: NOW - (5 * DAY),
    reviews: [
      { id: 'r1', userName: 'Fatima', rating: 5, comment: 'Absolutely authentic! Reminds me of home.', createdAt: NOW - (2 * DAY) }
    ]
  },
  {
    id: 'rec_2',
    title: 'Silk Road Warak Enab',
    origin: 'Lebanon',
    description: "Rolling grape leaves is a meditation. We sit for hours, drinking tea, gossiping, and rolling these tiny cigars of joy. Stuffed with tangy rice, tomatoes, and parsley, they are the heart of any mezze table.",
    imageUrl: 'https://images.unsplash.com/photo-1548545812-78d102e3b5e4?q=80&w=1200&auto=format&fit=crop', // Updated reliable ID
    prepTime: 90,
    cookTime: 60,
    difficulty: 'Medium',
    calories: 320,
    ingredients: [
      { item: 'Grape Leaves', amount: '1 jar', priceEstimate: 6.00 },
      { item: 'Short Grain Rice', amount: '2 cups', priceEstimate: 2.00 },
      { item: 'Parsley', amount: '2 bunches', priceEstimate: 1.50 },
      { item: 'Tomatoes', amount: '4 diced', priceEstimate: 2.00 },
      { item: 'Lemon Juice', amount: '1 cup', priceEstimate: 1.00 }
    ],
    instructions: [
      { stepNumber: 1, text: 'Mix rice, parsley, tomatoes, olive oil, and lemon juice for the filling.', durationMinutes: 15 },
      { stepNumber: 2, text: 'Lay a leaf flat, place a teaspoon of filling, fold sides, and roll tightly.', durationMinutes: 60 },
      { stepNumber: 3, text: 'Stack tightly in a pot, cover with a plate, add water and lemon juice.', durationMinutes: 10 },
      { stepNumber: 4, text: 'Simmer gently until leaves are tender.', durationMinutes: 60 }
    ],
    createdAt: NOW - (4 * DAY),
    reviews: []
  },
  {
    id: 'rec_3',
    title: 'Celebration Mansaf',
    origin: 'Jordan',
    description: "You do not eat Mansaf with a fork; you eat it with your hand, in the Bedouin way, to honor the host. Lamb cooked in fermented dried yogurt (Jameed) served over shrak bread and turmeric rice.",
    imageUrl: 'https://images.unsplash.com/photo-1628834417730-8d5f35eb270d?q=80&w=1200&auto=format&fit=crop', // Fallback to Maqluba style if specific Mansaf not found, or use general feast
    prepTime: 30,
    cookTime: 120,
    difficulty: 'Hard',
    calories: 1100,
    ingredients: [
      { item: 'Jameed (Dried Yogurt)', amount: '1 ball', priceEstimate: 12.00 },
      { item: 'Lamb', amount: '1.5 kg', priceEstimate: 30.00 },
      { item: 'Shrak Bread', amount: '3 sheets', priceEstimate: 3.00 },
      { item: 'Rice', amount: '3 cups', priceEstimate: 4.00 },
      { item: 'Pine Nuts', amount: '1/2 cup', priceEstimate: 8.00 }
    ],
    instructions: [
      { stepNumber: 1, text: 'Soak Jameed overnight and blend into a liquid.', durationMinutes: 10 },
      { stepNumber: 2, text: 'Boil lamb in the Jameed broth until tender.', durationMinutes: 120 },
      { stepNumber: 3, text: 'Cook turmeric rice separately.', durationMinutes: 20 },
      { stepNumber: 4, text: 'Assemble: Bread, rice, meat, sauce, and fried pine nuts.', durationMinutes: 10 }
    ],
    createdAt: NOW - (3 * DAY),
    reviews: []
  },
  {
    id: 'rec_4',
    title: 'Street-Style Koshary',
    origin: 'Egypt',
    description: "The chaos of Cairo in a bowl. Rice, lentils, macaroni, chickpeas, fried onions, and a spicy tomato sauce. It is cheap, filling, and absolutely addictive.",
    imageUrl: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?q=80&w=1200&auto=format&fit=crop', // General bowl food
    prepTime: 40,
    cookTime: 45,
    difficulty: 'Medium',
    calories: 600,
    ingredients: [
      { item: 'Lentils', amount: '1 cup', priceEstimate: 1.50 },
      { item: 'Rice', amount: '1 cup', priceEstimate: 1.00 },
      { item: 'Macaroni', amount: '1 cup', priceEstimate: 1.00 },
      { item: 'Chickpeas', amount: '1 can', priceEstimate: 1.00 },
      { item: 'Fried Onions', amount: '1 cup', priceEstimate: 2.00 }
    ],
    instructions: [
      { stepNumber: 1, text: 'Cook lentils and rice together with cumin.', durationMinutes: 30 },
      { stepNumber: 2, text: 'Boil macaroni separately.', durationMinutes: 10 },
      { stepNumber: 3, text: 'Make a spicy tomato sauce with vinegar and garlic.', durationMinutes: 15 },
      { stepNumber: 4, text: 'Layer everything and top generously with fried onions.', durationMinutes: 5 }
    ],
    createdAt: NOW - (2 * DAY),
    reviews: []
  },
  {
    id: 'rec_5',
    title: 'Golden Kunafa',
    origin: 'Nablus',
    description: "Sweet, salty, crunchy, gooey. Warm cheese hidden under golden spun pastry, soaked in blossom water syrup. The queen of desserts.",
    imageUrl: 'https://images.unsplash.com/photo-1576158097036-398335039f8f?q=80&w=1200&auto=format&fit=crop',
    prepTime: 20,
    cookTime: 20,
    difficulty: 'Medium',
    calories: 700,
    ingredients: [
      { item: 'Kataifi Dough', amount: '500g', priceEstimate: 5.00 },
      { item: 'Akkawi Cheese', amount: '400g', priceEstimate: 8.00 },
      { item: 'Butter', amount: '200g', priceEstimate: 2.00 },
      { item: 'Sugar Syrup', amount: '1 cup', priceEstimate: 0.50 },
      { item: 'Pistachios', amount: '1/4 cup', priceEstimate: 4.00 }
    ],
    instructions: [
      { stepNumber: 1, text: 'Shred dough and mix with melted butter.', durationMinutes: 10 },
      { stepNumber: 2, text: 'Press half dough into pan, layer cheese, top with remaining dough.', durationMinutes: 5 },
      { stepNumber: 3, text: 'Bake until golden and cheese is bubbly.', durationMinutes: 20 },
      { stepNumber: 4, text: 'Invert onto plate and drench in hot syrup immediately.', durationMinutes: 2 }
    ],
    createdAt: NOW - DAY,
    reviews: []
  }
];