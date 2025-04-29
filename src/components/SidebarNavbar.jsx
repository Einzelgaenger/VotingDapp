import { useState } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { Menu, X, ChevronLeft } from 'lucide-react';
import ConnectWalletButton from './ConnectWalletButton';

export default function SidebarNavbar({ setPage }) {
    const { account, role } = useWallet();
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    const navItems = [
        { label: 'Dashboard', page: 'home' },
        { label: 'Create Room', page: 'create' },
        { label: 'My Rooms', page: 'myrooms' },
        { label: 'Join Room', page: 'join' },
        ...(role === 'creator' || role === 'superadmin' ? [{ label: 'Admin Panel', page: 'adminpanel' }] : []),
    ];

    const handleNavClick = (page) => {
        setPage(page);
        setMobileOpen(false);
    };

    return (
        <>
            {/* Mobile Topbar */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white shadow flex items-center justify-between px-4 py-3">
                <button onClick={() => setMobileOpen(true)}><Menu /></button>
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
                    {/* Toggle Collapse */}
                    <div className="flex items-center gap-2">
                        <button onClick={() => setCollapsed(!collapsed)} className="hidden md:block text-gray-600">
                            <ChevronLeft className={`${collapsed ? 'rotate-180' : ''} transition-transform`} />
                        </button>
                        <button onClick={() => setMobileOpen(false)} className="md:hidden text-gray-600">
                            <X />
                        </button>
                    </div>
                </div>

                {/* Nav Items */}
                <nav className="flex flex-col px-3 py-4 space-y-1">
                    {account &&
                        navItems.map((item, index) => (
                            <button
                                key={index}
                                onClick={() => handleNavClick(item.page)}
                                className="flex items-center gap-3 px-4 py-2 rounded-md text-left hover:bg-indigo-50 text-gray-700 font-medium transition"
                            >
                                {/* Optional Icon Here */}
                                <span className={`${collapsed ? 'hidden' : ''}`}>{item.label}</span>
                            </button>
                        ))}
                </nav>
            </div>

            {/* Overlay for mobile */}
            {mobileOpen && (
                <div
                    onClick={() => setMobileOpen(false)}
                    className="fixed inset-0 bg-black/30 z-40 md:hidden"
                ></div>
            )}

            {/* Wallet for Desktop */}
            <div className="hidden md:flex fixed top-0 right-0 p-4 z-40">
                <ConnectWalletButton />
            </div>
        </>
    );
}
