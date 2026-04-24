import { createContext, useContext, useState, ReactNode } from 'react';
import { getTheme, Theme } from '../utils/themes';

interface ThemeContextType {
    activeCategory: string;
    setActiveCategory: (category: string) => void;
    dateFilter: number; // 0 = all, 1 = today, 2 = last 2 days, etc.
    setDateFilter: (days: number) => void;
    currentTheme: Theme;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [activeCategory, setActiveCategory] = useState('all');
    const [dateFilter, setDateFilter] = useState(0);

    const currentTheme = getTheme(activeCategory);

    return (
        <ThemeContext.Provider value={{ 
            activeCategory, 
            setActiveCategory, 
            dateFilter, 
            setDateFilter, 
            currentTheme 
        }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useThemeContext() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useThemeContext must be used within a ThemeProvider');
    }
    return context;
}
