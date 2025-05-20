import { useContext } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';
import { Sun, Moon, Sparkles } from 'lucide-react';

const ThemeToggle = () => {
    const { theme, setTheme } = useContext(ThemeContext);
    const next =
        theme === 'theme-light' ? 'theme-dark' :
            theme === 'theme-dark' ? 'theme-noir' : 'theme-light';

    const Icon = {
        'theme-light': Sun,
        'theme-dark': Moon,
        'theme-noir': Sparkles
    }[theme];

    return (
        <button
            onClick={() => setTheme(next)}
            className="
        p-2 rounded-full 
        bg-white/20 hover:bg-white/30 
        text-cyberblue hover:text-white 
        border border-white/30 
        shadow-lg hover:shadow-[0_0_12px_rgba(0,240,255,0.6)] 
        transition-all duration-300 
        backdrop-blur-md
      "
            title={`Switch to ${next.replace('theme-', '')} theme`}
        >
            <Icon size={20} strokeWidth={2} />
        </button>
    );
};

export default ThemeToggle;
