
import React, { useState, useEffect } from 'react';
import { UserMode, Recipe, CartItem, Ingredient } from './types';
import { INITIAL_RECIPES } from './constants';
import { Navbar } from './components/Navbar';
import { ChatWidget } from './components/ChatWidget';
import { Home } from './pages/Home';
import { RecipeDetail } from './pages/RecipeDetail';
import { CookingMode } from './pages/CookingMode';
import { ChefStudio } from './pages/ChefStudio';
import { CartDrawer } from './components/CartDrawer';

const App: React.FC = () => {
  const [userMode, setUserMode] = useState<UserMode>(UserMode.VIEWER);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [currentRoute, setCurrentRoute] = useState<string>('home');
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('soosoo_recipes');
    if (stored) {
      setRecipes(JSON.parse(stored));
    } else {
      setRecipes(INITIAL_RECIPES);
      localStorage.setItem('soosoo_recipes', JSON.stringify(INITIAL_RECIPES));
    }
  }, []);

  const addToCart = (ingredients: Ingredient[], recipeTitle: string) => {
    const newItems: CartItem[] = ingredients.map(ing => ({
        ...ing,
        id: Date.now() + Math.random().toString(),
        recipeTitle: recipeTitle,
        quantityMultiplier: 1
    }));
    setCart(prev => [...prev, ...newItems]);
    setIsCartOpen(true); 
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateCartQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
        if (item.id === id) {
            const newQty = item.quantityMultiplier + delta;
            return newQty > 0 ? { ...item, quantityMultiplier: newQty } : item;
        }
        return item;
    }));
  };

  const clearCart = () => setCart([]);

  const saveRecipe = (newRecipe: Recipe) => {
    const updated = [newRecipe, ...recipes];
    setRecipes(updated);
    try {
        localStorage.setItem('soosoo_recipes', JSON.stringify(updated));
    } catch (e) {
        console.error("Storage limit reached", e);
        alert("Storage is full! Recipe saved for this session only.");
    }
    setCurrentRoute('home');
  };

  const updateRecipe = (updatedRecipe: Recipe) => {
    const updated = recipes.map(r => r.id === updatedRecipe.id ? updatedRecipe : r);
    setRecipes(updated);
    try {
        localStorage.setItem('soosoo_recipes', JSON.stringify(updated));
    } catch (e) { console.error(e); }
  };

  const navigate = (path: string) => setCurrentRoute(path);

  const handleRecipeClick = (id: string) => {
    setSelectedRecipeId(id);
    setCurrentRoute('detail');
  };

  const handleStartCooking = () => {
    if (selectedRecipeId) setCurrentRoute('cooking');
  };

  const renderContent = () => {
    switch (currentRoute) {
      case 'home':
        return <Home recipes={recipes} onRecipeClick={handleRecipeClick} onCreateClick={() => navigate('create')} />;
      case 'detail':
        const recipe = recipes.find(r => r.id === selectedRecipeId);
        if (!recipe) return <Home recipes={recipes} onRecipeClick={handleRecipeClick} onCreateClick={() => navigate('create')} />;
        return <RecipeDetail recipe={recipe} onBack={() => navigate('home')} onStartCooking={handleStartCooking} onUpdateRecipe={updateRecipe} onAddToCart={addToCart} />;
      case 'cooking':
        const cookingRecipe = recipes.find(r => r.id === selectedRecipeId);
        if (!cookingRecipe) return <Home recipes={recipes} onRecipeClick={handleRecipeClick} onCreateClick={() => navigate('create')} />;
        return <CookingMode recipe={cookingRecipe} onExit={() => navigate('detail')} />;
      case 'create':
        return <ChefStudio onSave={saveRecipe} onCancel={() => navigate('home')} />;
      default:
        return <Home recipes={recipes} onRecipeClick={handleRecipeClick} onCreateClick={() => navigate('create')} />;
    }
  };

  return (
    <div className="min-h-screen bg-soosoo-cream font-sans">
      {currentRoute !== 'cooking' && (
        <Navbar mode={userMode} setMode={setUserMode} cartCount={cart.length} onOpenCart={() => setIsCartOpen(true)} navigate={(path) => { if (path === '/') { setCurrentRoute('home'); setSelectedRecipeId(null); } else if (path === '/create') { setCurrentRoute('create'); } }} />
      )}
      {renderContent()}
      {currentRoute !== 'cooking' && <ChatWidget />}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} cartItems={cart} onRemove={removeFromCart} onUpdateQuantity={updateCartQuantity} onClear={clearCart} />
    </div>
  );
};

export default App;
