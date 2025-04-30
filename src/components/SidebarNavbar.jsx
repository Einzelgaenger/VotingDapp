import { useWallet } from '../contexts/WalletContext';
import { Menu, X, Plus, ClipboardList, KeyRound, Settings2 } from 'lucide-react';
import ConnectWalletButton from './ConnectWalletButton';
import Logo from '../assets/SecureVote2.png';

export default function SidebarNavbar({
    setPage,
    currentPage,
    collapsed,
    setCollapsed,
    sidebarOpen,
    setSidebarOpen,
}) {
    const { account, role } = useWallet();

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
        setSidebarOpen(false);
    };

    return (
        <>
            {/* Mobile Topbar */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white shadow flex items-center justify-between px-4 py-3">
                <button onClick={() => setSidebarOpen(true)}><Menu /></button>
                <ConnectWalletButton />
            </div>

            {/* Sidebar */}
            <div
                className={`fixed top-0 left-0 h-screen z-50 bg-white border-r shadow-md transition-all duration-300
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                ${collapsed ? 'md:w-20' : 'md:w-64'} md:translate-x-0`}
            >
                {/* Header */}
                <div className="relative flex items-center justify-between px-4 py-4 border-b border-gray-200 h-[72px]">
                    <div
                        className="flex items-center gap-2 cursor-pointer"
                        onClick={() => handleNavClick('home')}
                    >
                        <img
                            src={Logo}
                            alt="SecureVote Logo"
                            className="w-10 h-10"
                        />
                        {!collapsed && (
                            <h1 className="text-lg font-bold text-indigo-600 transition-all duration-300">
                                SecureVote
                            </h1>
                        )}
                    </div>

                    {/* Triangle Toggle Button */}
                    <div className="hidden md:block">
                        <div
                            onClick={() => setCollapsed(!collapsed)}
                            className="absolute top-0 -right-5 h-full flex items-center cursor-pointer z-50"
                        >
                            {/* Triangle with visible border & sharp tip */}
                            <div className="relative w-[20px] h-[72px]">
                                <svg
                                    width="20"
                                    height="72"
                                    viewBox="0 0 20 72"
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="hover:scale-105 transition"
                                    style={{ display: 'block' }}
                                >
                                    {/* FILTER SHADOW */}
                                    <defs>
                                        <filter id="triangleShadow" x="-50%" y="-50%" width="200%" height="200%">
                                            <feDropShadow dx="1" dy="0" stdDeviation="1" flood-color="#cbd5e1" flood-opacity="0.5" />
                                        </filter>
                                    </defs>

                                    {/* Segitiga putih */}
                                    <path d="M0,0 L20,36 L0,72 Z" fill="white" />

                                    {/* Garis sisi miring dengan shadow */}
                                    <path
                                        d="M0,0 L20,36 L0,72"
                                        fill="none"
                                        stroke="#e5e7eb"
                                        strokeWidth="1"
                                        filter="url(#triangleShadow)"
                                    />
                                </svg>

                            </div>



                        </div>
                    </div>



                    {/* Close for mobile */}
                    <button onClick={() => setSidebarOpen(false)} className="md:hidden text-gray-600">
                        <X />
                    </button>
                </div>

                {/* Nav Items */}
                <nav className="flex flex-col px-3 py-4 space-y-1">
                    {account &&
                        navItems.map((item, index) => {
                            const isActive = item.page === currentPage;
                            return (
                                <button
                                    key={index}
                                    onClick={() => handleNavClick(item.page)}
                                    className={`flex items-center gap-3 px-4 py-2 rounded-md text-left font-medium transition
                                        ${isActive ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700 hover:bg-indigo-50'}`}
                                >
                                    <div className="min-w-[20px]">{item.icon}</div>
                                    {!collapsed && <span>{item.label}</span>}
                                </button>
                            );
                        })}
                </nav>
            </div>

            {/* Mobile Overlay */}
            {sidebarOpen && (
                <div
                    onClick={() => setSidebarOpen(false)}
                    className="fixed inset-0 bg-black/30 z-40 md:hidden"
                ></div>
            )}

            {/* Desktop Wallet */}
            <div className="hidden md:flex fixed top-0 right-0 p-4 z-40">
                <ConnectWalletButton />
            </div>
        </>
    );
}
