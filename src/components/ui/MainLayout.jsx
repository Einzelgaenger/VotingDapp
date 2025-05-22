import { useContext } from 'react';
import { ThemeContext } from '../../contexts/ThemeContext';

export default function MainLayout({ children }) {
    const { theme } = useContext(ThemeContext);

    // const bgMap = {
    //     'theme-light': 'bg-gradient-to-br from-white via-[#f0f7ff] to-[#e6f0ff]',
    //     'theme-dark': 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900',
    //     'theme-noir': 'bg-gradient-to-br from-[#0f0f1f] via-[#1a1a30] to-[#101020]',
    // };

    return (
        <div className={`group min-h-screen font-sans transition-all duration-500 ${theme}`}>

            {children}
        </div>
    );
}
