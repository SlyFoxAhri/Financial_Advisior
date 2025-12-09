import React, { useState } from 'react';
import { Home, BarChart2, BrainCircuit, Newspaper, Target, TrendingUp } from 'lucide-react';

import Navigation from './components/Navigation.jsx';
import DashboardScreen from './screens/DashboardScreen.jsx';
import PortfolioScreen from './screens/PortfolioScreen.jsx';
import AiInsightsScreen from './screens/AiInsightsScreen.jsx';
import FinancialNewsScreen from './screens/FinancialNewsScreen.jsx';
import GoalsScreen from './screens/GoalsScreen.jsx';
import PredictionScreen from './screens/PredictionScreen.jsx';
import DarkModeToggle from './components/DarkModeToggle';

function App() {
  const [activeScreen, setActiveScreen] = useState('Dashboard');

  // --- Centralized State for Portfolio ---
  const [holdings, setHoldings] = useState([]);

  // --- Centralized State for Goals ---
  const [goals, setGoals] = useState([
    { id: 1, name: 'Vacation Fund', target: 5000, current: 1200 },
    { id: 2, name: 'New Car', target: 25000, current: 8500 },
  ]);

  // Function to add a new holding to the portfolio
  const addHolding = (newHolding) => {
    const existingHoldingIndex = holdings.findIndex(h => h.symbol === newHolding.symbol.toUpperCase());

    if (existingHoldingIndex > -1) {
      const updatedHoldings = [...holdings];
      updatedHoldings[existingHoldingIndex].shares += newHolding.shares;
      setHoldings(updatedHoldings);
    } else {
      setHoldings([...holdings, { ...newHolding, symbol: newHolding.symbol.toUpperCase() }]);
    }
  };

  // Function to remove a holding
  const removeHolding = (symbol) => {
    setHoldings(holdings.filter(h => h.symbol !== symbol));
  };

  // Function to add a new goal
  const addGoal = (newGoal) => {
    setGoals([...goals, { ...newGoal, id: Date.now(), current: 0 }]);
  };

  // Function to add a contribution to a goal
  const addContribution = (goalId, amount) => {
    const updatedGoals = goals.map(goal => {
      if (goal.id === goalId) {
        return { ...goal, current: goal.current + amount };
      }
      return goal;
    });
    setGoals(updatedGoals);
  };

  const renderScreen = () => {
    switch (activeScreen) {
      case 'Dashboard':
        return <DashboardScreen holdings={holdings} />;
      case 'Portfolio':
        return <PortfolioScreen holdings={holdings} addHolding={addHolding} removeHolding={removeHolding} />;
      case 'Prediction':
        return <PredictionScreen />;
      case 'AI Insights':
        return <AiInsightsScreen />;
      case 'Financial News':
        return <FinancialNewsScreen />;
      case 'Goals':
        return <GoalsScreen goals={goals} addGoal={addGoal} addContribution={addContribution} />;
      default:
        return <DashboardScreen holdings={holdings} />;
    }
  };

   // Navigation items configuration
    const navItems = [
        { name: 'Dashboard', icon: Home },
        { name: 'Portfolio', icon: BarChart2 },
        { name: 'Prediction', icon: TrendingUp },
        { name: 'Financial News', icon: Newspaper },
        { name: 'Goals', icon: Target },
    ];

    return (
        <div className="bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 min-h-screen flex flex-col md:flex-row">
            {/* Main Navigation Component */}
            <Navigation 
                navItems={navItems}
                activeScreen={activeScreen}
                setActiveScreen={setActiveScreen}
            />

            {/* Dark Mode Toggle Button */}
            <div className="absolute top-4 right-4">
                <DarkModeToggle />
            </div>

            {/* Main Content Area */}
            <main className="flex-1 p-4 md:p-8 overflow-y-auto">
                {renderScreen()}
            </main>
        </div>

  );
}

export default App;