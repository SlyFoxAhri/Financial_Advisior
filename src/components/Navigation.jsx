import React from 'react';

// --- SVG Icons ---
const HomeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
);
const PortfolioIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" /><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" /><path d="M12 14c-2.5 0-8 1.25-8 4v2h16v-2c0-2.75-5.5-4-8-4z" /></svg>
);
const BotIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8" /><rect width="16" height="12" x="4" y="8" rx="2" /><path d="M2 14h2" /><path d="M20 14h2" /><path d="M15 13v2" /><path d="M9 13v2" /></svg>
);
const NewspaperIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2V4" /><path d="M4 6h16" /><path d="M4 12h16" /><path d="M4 18h16" /><path d="M10 6v12" /></svg>
);
const TargetIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>
);
// New Icon for Prediction
const TrendUpIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>
);

const Navigation = ({ activeScreen, setActiveScreen }) => {
    const navItems = [
        { id: 'Dashboard', icon: <HomeIcon />, label: 'Dashboard' },
        { id: 'Portfolio', icon: <PortfolioIcon />, label: 'Portfolio' },
        { id: 'Prediction', icon: <TrendUpIcon />, label: 'Market Predictor' }, // Added here
        { id: 'AI Insights', icon: <BotIcon />, label: 'AI Insights' },
        { id: 'Financial News', icon: <NewspaperIcon />, label: 'Financial News' },
        { id: 'Goals', icon: <TargetIcon />, label: 'Goals' },
    ];

    const baseItemClasses = "flex items-center p-3 rounded-lg transition-colors duration-200";
    const activeItemClasses = "bg-gray-700 text-white";
    const inactiveItemClasses = "text-gray-400 hover:bg-gray-700 hover:text-white";

    const baseMobileItemClasses = "flex flex-col items-center justify-center flex-1 p-2 transition-colors duration-200";
    const activeMobileItemClasses = "text-blue-500";
    const inactiveMobileItemClasses = "text-gray-500 hover:text-blue-500";

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex flex-col w-64 bg-gray-800 text-white p-4 rounded-l-2xl">
                <div className="text-2xl font-bold mb-10 pl-2">Fin-AI</div>
                <nav className="flex flex-col space-y-2">
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveScreen(item.id)}
                            className={`${baseItemClasses} ${activeScreen === item.id ? activeItemClasses : inactiveItemClasses}`}
                        >
                            {item.icon}
                            <span className="ml-4 font-semibold">{item.label}</span>
                        </button>
                    ))}
                </nav>
            </aside>

            {/* Mobile Bottom Navigation */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around">
                {navItems.map(item => (
                    <button
                        key={item.id}
                        onClick={() => setActiveScreen(item.id)}
                        className={`${baseMobileItemClasses} ${activeScreen === item.id ? activeMobileItemClasses : inactiveMobileItemClasses}`}
                    >
                        {item.icon}
                        <span className="text-xs font-medium mt-1">{item.label}</span>
                    </button>
                ))}
            </nav>
        </>
    );
};

export default Navigation;