
export enum UserMode {
  VIEWER = 'VIEWER',
  CHEF = 'CHEF'
}

export interface Ingredient {
  item: string;
  amount: string;
  priceEstimate?: number; // Estimated cost
}

export interface CartItem extends Ingredient {
  id: string; // Unique ID for cart management
  recipeTitle: string;
  quantityMultiplier: number; // For adjusting quantities (e.g. 2x items)
}

export interface InstructionStep {
  stepNumber: number;
  text: string;
  durationMinutes?: number;
}

export interface Review {
  id: string;
  userName: string;
  rating: number; // 1-5
  comment: string;
  createdAt: number;
}

export interface Recipe {
  id: string;
  title: string;
  description: string; // The "Story"
  origin: string;
  imageUrl: string;
  videoUrl?: string; // For Veo generated tutorials
  prepTime: number; // minutes
  cookTime: number; // minutes
  difficulty: 'Easy' | 'Medium' | 'Hard';
  calories: number;
  ingredients: Ingredient[];
  instructions: InstructionStep[];
  isAI?: boolean;
  createdAt?: number;
  reviews?: Review[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
}

// Structured output for the Dietary Intelligence feature
export interface DietaryAnalysis {
    title: string;
    feasibility: 'High' | 'Medium' | 'Low';
    substitutions: {
        original: string;
        substitute: string;
        instruction: string;
        science: string;
    }[];
    verdict: string;
}
