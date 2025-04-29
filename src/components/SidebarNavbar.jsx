// src/components/SidebarNavbar.jsx
import { useState } from 'react';
import { useWallet } from '../contexts/WalletContext';
import {
    Menu,
    X,
    ChevronLeft,
    Plus,
    ClipboardList,
    KeyRound,
    Settings2
} from 'lucide-react';
import ConnectWalletButton from './ConnectWalletButton';

export default function SidebarNavbar({ setPage }) {
    const { account, role } = useWallet();
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState('home');

    const navItems = [
        { label: 'Create Room', page: 'create', icon: <Plus size={18} /> },
        { label: 'My Rooms', page: 'myrooms', icon: <ClipboardList size={18} /> },
        { label: 'Join Room', page: 'join', icon: <KeyRound size={18} /> },
        ...(role === 'creator' || role === 'superadmin'
            ? [{ label: 'Admin Panel', page: 'adminpanel', icon: <Settings2 size={18} /> }]
            : []),
    ];

    const handleNavClick = (page) => {
        setPage(page);
        setCurrentPage(page);
        setMobileOpen(false);
    };

    return (
        <>
            {/* Topbar Mobile */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white shadow flex items-center justify-between px-4 py-3">
                <button onClick={() => setMobileOpen(true)}>
                    <Menu />
                </button>
                <ConnectWalletButton />
            </div>

            {/* Sidebar */}
            <div
                className={`fixed top-0 left-0 h-screen z-50 bg-white border-r shadow-md transition-all duration-300
                ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
                ${collapsed ? 'md:w-20' : 'md:w-64'} md:translate-x-0`}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
                    <h1
                        className={`text-lg font-bold text-indigo-600 cursor-pointer transition-all duration-300 ${collapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'
                            }`}
                        onClick={() => handleNavClick('home')}
                    >
                        Voting DApp
                    </h1>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCollapsed(!collapsed)}
                            className="hidden md:block text-gray-600"
                        >
                            <ChevronLeft
                                className={`transition-transform duration-300 ${collapsed ? 'rotate-180' : ''
                                    }`}
                            />
                        </button>
                        <button onClick={() => setMobileOpen(false)} className="md:hidden text-gray-600">
                            <X />
                        </button>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex flex-col px-3 py-4 space-y-1">
                    {account &&
                        navItems.map((item, index) => (
                            <button
                                key={index}
                                onClick={() => handleNavClick(item.page)}
                                className={`group flex items-center gap-3 px-4 py-2 rounded-md text-left transition font-medium
                                    ${currentPage === item.page
                                        ? 'bg-indigo-100 text-indigo-700 font-semibold'
                                        : 'text-gray-700 hover:bg-indigo-50'
                                    }`}
                            >
                                <div className="min-w-[20px] transition-transform duration-300 group-hover:translate-x-1">
                                    {item.icon}
                                </div>
                                {!collapsed && (
                                    <span className="transition-all duration-300">{item.label}</span>
                                )}
                            </button>
                        ))}
                </nav>
            </div>

            {/* Mobile overlay */}
            {mobileOpen && (
                <div
                    onClick={() => setMobileOpen(false)}
                    className="fixed inset-0 bg-black/30 z-40 md:hidden"
                ></div>
            )}

            {/* Wallet Desktop */}
            <div className="hidden md:flex fixed top-0 right-0 p-4 z-40">
                <ConnectWalletButton />
            </div>
        </>
    );
}
