import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useState, useEffect } from 'react';
const ThemeContext = createContext({ theme: 'dark', toggle: () => { } });
export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState('dark');
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);
    const toggle = () => setTheme(t => t === 'dark' ? 'light' : 'dark');
    return _jsx(ThemeContext.Provider, { value: { theme, toggle }, children: children });
}
export const useTheme = () => useContext(ThemeContext);
