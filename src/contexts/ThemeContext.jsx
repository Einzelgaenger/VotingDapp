// // ✅ src/contexts/ThemeContext.jsx

// import { createContext, useContext, useState, useEffect } from 'react';

// const ThemeContext = createContext();

// export function ThemeProvider({ children }) {
//     const [theme, setTheme] = useState('light');

//     useEffect(() => {
//         const storedTheme = localStorage.getItem('theme');
//         if (storedTheme) setTheme(storedTheme);
//     }, []);

//     useEffect(() => {
//         document.documentElement.setAttribute('data-theme', theme);
//         localStorage.setItem('theme', theme);
//     }, [theme]);

//     const toggleTheme = () => {
//         setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
//     };

//     return (
//         <ThemeContext.Provider value={{ theme, toggleTheme }}>
//             {children}
//         </ThemeContext.Provider>
//     );
// }

// export function useTheme() {
//     return useContext(ThemeContext);
// }
