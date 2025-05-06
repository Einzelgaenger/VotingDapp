// components/ui/Button.jsx
import { Loader2 } from 'lucide-react';
import classNames from 'classnames';

export default function Button({ children, onClick, disabled, variant = 'primary', loading = false, className = '' }) {
    const base = 'px-4 py-2 rounded font-medium transition duration-200 flex items-center justify-center gap-2';
    const variants = {
        primary: 'bg-indigo-500 text-white hover:bg-indigo-600',
        danger: 'bg-red-600 text-white hover:bg-red-700',
        secondary: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
        outline: 'border border-gray-300 text-gray-800 hover:bg-gray-100',
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled || loading}
            className={classNames(base, variants[variant], className, {
                'opacity-50 cursor-not-allowed': disabled || loading,
            })}
        >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {children}
        </button>
    );
}
