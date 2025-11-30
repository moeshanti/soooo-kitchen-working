
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
    imageUrl: 'https://images.unsplash.com/photo-1548545812-78d102e3b5e4?q=80&w=1200&auto=format&fit=crop', 
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
    imageUrl: 'https://images.unsplash.com/photo-1599021464947-97594950e32b?q=80&w=1200&auto=format&fit=crop',
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
    imageUrl: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?q=80&w=1200&auto=format&fit=crop', 
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
  },
  // --- NEW RECIPES ---
  {
    id: 'rec_6',
    title: 'Morning Shakshuka',
    origin: 'Tunisia',
    description: "Eggs poached in a simmering sauce of tomatoes, peppers, and garlic. It is the color of the sunrise and tastes like waking up in a warm home.",
    imageUrl: 'https://images.unsplash.com/photo-1590412200988-a436970781fa?q=80&w=1200&auto=format&fit=crop',
    prepTime: 10,
    cookTime: 20,
    difficulty: 'Easy',
    calories: 400,
    ingredients: [
        { item: 'Eggs', amount: '4 large', priceEstimate: 2.00 },
        { item: 'Tomatoes', amount: '1 can', priceEstimate: 1.50 },
        { item: 'Bell Pepper', amount: '1 red', priceEstimate: 1.00 },
        { item: 'Harissa', amount: '1 tbsp', priceEstimate: 0.50 },
        { item: 'Crusty Bread', amount: '1 loaf', priceEstimate: 3.00 }
    ],
    instructions: [
        { stepNumber: 1, text: 'Sauté peppers and onions until soft.', durationMinutes: 5 },
        { stepNumber: 2, text: 'Add tomatoes, harissa, and spices. Simmer until thickened.', durationMinutes: 10 },
        { stepNumber: 3, text: 'Make wells in the sauce and crack the eggs into them.', durationMinutes: 1 },
        { stepNumber: 4, text: 'Cover and simmer until whites are set but yolks are runny.', durationMinutes: 5 }
    ],
    createdAt: NOW - (6 * DAY),
    reviews: []
  },
  {
    id: 'rec_7',
    title: 'Smoky Moutabal',
    origin: 'Syria',
    description: "Often confused with Baba Ghanouj, Moutabal uses tahini and yogurt for a creamier, richer dip. The secret is burning the eggplant skin until it is completely charred.",
    imageUrl: 'https://images.unsplash.com/photo-1628834417578-1a48c4806a62?q=80&w=1200&auto=format&fit=crop',
    prepTime: 15,
    cookTime: 30,
    difficulty: 'Easy',
    calories: 250,
    ingredients: [
        { item: 'Eggplant', amount: '2 large', priceEstimate: 3.00 },
        { item: 'Tahini', amount: '1/2 cup', priceEstimate: 4.00 },
        { item: 'Yogurt', amount: '2 tbsp', priceEstimate: 0.50 },
        { item: 'Garlic', amount: '2 cloves', priceEstimate: 0.20 },
        { item: 'Pomegranate Seeds', amount: 'For garnish', priceEstimate: 2.00 }
    ],
    instructions: [
        { stepNumber: 1, text: 'Roast eggplants directly over an open flame until charred black.', durationMinutes: 15 },
        { stepNumber: 2, text: 'Let cool, peel, and drain excess liquid.', durationMinutes: 10 },
        { stepNumber: 3, text: 'Mash the flesh with tahini, yogurt, garlic, and lemon.', durationMinutes: 5 },
        { stepNumber: 4, text: 'Drizzle with olive oil and top with pomegranate seeds.', durationMinutes: 2 }
    ],
    createdAt: NOW - (7 * DAY),
    reviews: []
  },
  {
    id: 'rec_8',
    title: 'Fisherman\'s Sayadieh',
    origin: 'Lebanon (Coast)',
    description: "A fisherman's pride. Caramelized onions turn the rice a deep, savory brown, served with flaky white fish and roasted nuts. It smells like the ocean breeze.",
    imageUrl: 'https://images.unsplash.com/photo-1626509683518-972cb79c663a?q=80&w=1200&auto=format&fit=crop',
    prepTime: 40,
    cookTime: 50,
    difficulty: 'Hard',
    calories: 750,
    ingredients: [
        { item: 'White Fish Fillets', amount: '1 kg', priceEstimate: 20.00 },
        { item: 'Onions', amount: '4 large', priceEstimate: 2.00 },
        { item: 'Rice', amount: '2 cups', priceEstimate: 1.50 },
        { item: 'Cumin', amount: '1 tbsp', priceEstimate: 0.50 },
        { item: 'Almonds', amount: '1/4 cup', priceEstimate: 3.00 }
    ],
    instructions: [
        { stepNumber: 1, text: 'Fry sliced onions until dark brown (almost burnt).', durationMinutes: 20 },
        { stepNumber: 2, text: 'Boil half the onions with water and spices to make a dark stock.', durationMinutes: 15 },
        { stepNumber: 3, text: 'Cook the rice in this dark stock.', durationMinutes: 20 },
        { stepNumber: 4, text: 'Fry the fish fillets separately.', durationMinutes: 10 },
        { stepNumber: 5, text: 'Serve rice topped with fish, remaining onions, and nuts.', durationMinutes: 5 }
    ],
    createdAt: NOW - (8 * DAY),
    reviews: []
  },
  {
    id: 'rec_9',
    title: 'Qatayef Asafiri',
    origin: 'Middle East',
    description: "Velvety pancakes folded into little cones and filled with fresh cream (ashta) and pistachios. A staple of Ramadan nights.",
    imageUrl: 'https://images.unsplash.com/photo-1598214886806-c87b84b7078b?q=80&w=1200&auto=format&fit=crop',
    prepTime: 30,
    cookTime: 15,
    difficulty: 'Medium',
    calories: 450,
    ingredients: [
        { item: 'Flour', amount: '2 cups', priceEstimate: 0.50 },
        { item: 'Semolina', amount: '1/2 cup', priceEstimate: 0.50 },
        { item: 'Ashta (Cream)', amount: '1 cup', priceEstimate: 5.00 },
        { item: 'Ground Pistachios', amount: '1/2 cup', priceEstimate: 6.00 },
        { item: 'Rose Water Syrup', amount: '1 cup', priceEstimate: 1.00 }
    ],
    instructions: [
        { stepNumber: 1, text: 'Blend batter ingredients and let rest.', durationMinutes: 15 },
        { stepNumber: 2, text: 'Pour small circles onto a hot griddle. Cook on one side only until bubbly.', durationMinutes: 10 },
        { stepNumber: 3, text: 'Pinch one end closed to form a cone.', durationMinutes: 10 },
        { stepNumber: 4, text: 'Fill with cream and dip open end in pistachios.', durationMinutes: 5 }
    ],
    createdAt: NOW - (9 * DAY),
    reviews: []
  },
  {
    id: 'rec_10',
    title: 'Damascene Ful Medames',
    origin: 'Syria',
    description: "The breakfast of champions. Slow-cooked fava beans dressed with lemon, garlic, and olive oil. Served with fresh vegetables and warm bread.",
    imageUrl: 'https://images.unsplash.com/photo-1604152135912-04a022e23696?q=80&w=1200&auto=format&fit=crop',
    prepTime: 10,
    cookTime: 15,
    difficulty: 'Easy',
    calories: 350,
    ingredients: [
        { item: 'Fava Beans', amount: '2 cans', priceEstimate: 2.00 },
        { item: 'Garlic', amount: '3 cloves', priceEstimate: 0.30 },
        { item: 'Lemon Juice', amount: '1/2 cup', priceEstimate: 0.50 },
        { item: 'Olive Oil', amount: 'Generous drizzle', priceEstimate: 1.00 },
        { item: 'Parsley', amount: '1/4 cup', priceEstimate: 0.50 }
    ],
    instructions: [
        { stepNumber: 1, text: 'Simmer beans with their liquid until soft.', durationMinutes: 10 },
        { stepNumber: 2, text: 'Mash slightly and mix with crushed garlic and lemon.', durationMinutes: 3 },
        { stepNumber: 3, text: 'Transfer to bowl and top with tomatoes, parsley, and oil.', durationMinutes: 2 },
        { stepNumber: 4, text: 'Serve with scallions, mint, and pickles.', durationMinutes: 0 }
    ],
    createdAt: NOW - (10 * DAY),
    reviews: []
  }
];
