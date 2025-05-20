import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardList, Plus, LogIn, Settings2, Menu, X } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
import ConnectWalletButton from './ConnectWalletButton';
import ThemeToggle from './ThemeToggle';
import Logo from '../assets/SecureVote2.png';

const navItems = [
    { label: 'Create', icon: <Plus size={18} className="icon" />, page: 'create' },
    { label: 'My Rooms', icon: <ClipboardList size={18} className="icon" />, page: 'myrooms' },
    { label: 'Join', icon: <LogIn size={18} className="icon" />, page: 'join' },
];

export default function SidebarNavbar({ setPage, currentPage }) {
    const { role } = useWallet();
    const [mobileOpen, setMobileOpen] = useState(false);
    const navRef = useRef(null);

    useEffect(() => {
        const handleOutside = (e) => {
            if (navRef.current && !navRef.current.contains(e.target)) {
                setMobileOpen(false);
            }
        };
        if (mobileOpen) document.addEventListener('click', handleOutside);
        return () => document.removeEventListener('click', handleOutside);
    }, [mobileOpen]);

    const renderButton = (item) => {
        const isActive = currentPage === item.page;
        return (
            <motion.button
                key={item.page}
                onClick={() => {
                    setPage(item.page);
                    setMobileOpen(false);
                }}
                whileTap={{ scale: 0.92 }}
                className={`flex items-center gap-2 px-4 py-2 rounded-full relative overflow-hidden transition-all duration-300 ${isActive
                        ? 'bg-cyberblue/20 text-cyberblue shadow-inner'
                        : 'text-cyberdark hover:bg-white/30 hover:text-cyberblue'
                    }`}
            >
                {item.icon}
                <span>{item.label}</span>
                {isActive && (
                    <motion.div
                        layoutId="nav-glow"
                        className="absolute inset-0 rounded-full border border-cyberblue/50 pointer-events-none"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                    />
                )}
            </motion.button>
        );
    };

    return (
        <motion.div
            ref={navRef}
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="navbar shadow-[0_2px_10px_rgba(255,255,255,0.05)] fixed top-0 left-0 right-0 z-50 px-4 py-3 flex items-center justify-between"
        >
            {/* Logo */}
            <div
                className="flex items-center gap-3 cursor-pointer group"
                onClick={() => setPage('home')}
            >
                <img src={Logo} alt="logo" className="w-9 h-9" />
                <h1 className="text-cyberblue text-xl font-exo font-bold tracking-wide group-hover:brightness-125 transition hidden sm:block">
                    SecureVote
                </h1>
            </div>

            {/* Desktop Nav */}
            <div className="hidden sm:flex items-center gap-5 font-exo text-sm">
                {navItems.map(renderButton)}
                {(role === 'creator' || role === 'superadmin') &&
                    renderButton({ label: 'Admin', icon: <Settings2 size={18} className="icon" />, page: 'adminpanel' })}
            </div>

            {/* Right Section */}
            <div className="hidden sm:flex items-center gap-3">
                <ConnectWalletButton />
                <ThemeToggle />
            </div>

            {/* Mobile Toggle */}
            <div className="sm:hidden flex items-center gap-2">
                <button onClick={() => setMobileOpen(!mobileOpen)} className="text-cyberdark">
                    {mobileOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Dropdown */}
            <AnimatePresence>
                {mobileOpen && (
                    <>
                        {/* Blurred overlay */}
                        <motion.div
                            key="overlay"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="fixed inset-0 bg-white/20 backdrop-blur-lg z-40"
                            onClick={() => setMobileOpen(false)}
                        />

                        {/* Dropdown content */}
                        <motion.div
                            key="dropdown"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="fixed top-[72px] left-0 right-0 mx-auto bg-white/20 backdrop-blur-lg border-t border-white/10 shadow-md py-4 px-6 flex flex-col gap-3 sm:hidden z-50 max-w-md rounded-b-xl"
                        >
                            {navItems.map(renderButton)}
                            {(role === 'creator' || role === 'superadmin') &&
                                renderButton({ label: 'Admin', icon: <Settings2 size={18} className="icon" />, page: 'adminpanel' })}
                            <div className="pt-2 flex justify-between items-center">
                                <ConnectWalletButton />
                                <ThemeToggle />
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
