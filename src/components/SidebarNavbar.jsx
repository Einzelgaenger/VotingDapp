import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardList, Plus, LogIn, Settings2, Menu, X } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
import ConnectWalletButton from './ConnectWalletButton';
import Logo from '../assets/SecureVote2.png';

const navItems = [
    { label: 'Create', icon: <Plus size={18} />, page: 'create' },
    { label: 'My Rooms', icon: <ClipboardList size={18} />, page: 'myrooms' },
    { label: 'Join', icon: <LogIn size={18} />, page: 'join' },
];

export default function SidebarNavbar({ setPage, currentPage }) {
    const { role } = useWallet();
    const [mobileOpen, setMobileOpen] = useState(false);

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
                className={`flex items-center gap-2 px-4 py-2 rounded-full relative overflow-hidden transition-all duration-300
          ${isActive
                        ? 'bg-cyberblue/20 text-cyberblue shadow-inner'
                        : 'text-cyberdark hover:bg-white/30 hover:text-cyberblue'}`}
            >
                {item.icon}
                <span>{item.label}</span>
                <AnimatePresence>
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
                </AnimatePresence>
            </motion.button>
        );
    };

    return (
        <motion.div
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="fixed top-0 left-0 right-0 z-50 px-4 py-3 bg-white/20 backdrop-blur-lg border-b border-white/20 shadow-[0_2px_10px_rgba(255,255,255,0.05)] flex items-center justify-between"
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
                    renderButton({ label: 'Admin', icon: <Settings2 size={18} />, page: 'adminpanel' })}
            </div>

            {/* Mobile Toggle */}
            <div className="sm:hidden flex items-center gap-2">
                <button onClick={() => setMobileOpen(!mobileOpen)} className="text-cyberdark">
                    {mobileOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Wallet */}
            <div className="hidden sm:block relative z-50">
                <ConnectWalletButton />
            </div>

            {/* Mobile Dropdown */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 w-full bg-white backdrop-blur-md border-t border-white/10 shadow-md py-3 px-4 flex flex-col gap-2 sm:hidden z-40"
                    >
                        {navItems.map(renderButton)}
                        {(role === 'creator' || role === 'superadmin') &&
                            renderButton({ label: 'Admin', icon: <Settings2 size={18} />, page: 'adminpanel' })}
                        <div className="pt-2">
                            <ConnectWalletButton />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}