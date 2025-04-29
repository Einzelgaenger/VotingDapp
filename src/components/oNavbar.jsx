import { useWallet } from '../contexts/WalletContext';
import ConnectWalletButton from './ConnectWalletButton';

export default function Navbar({ setPage }) {
    const { account, role } = useWallet();

    return (
        <nav className="bg-white shadow-sm px-6 py-4 border-b border-gray-200">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                {/* Left Logo + Nav */}
                <div className="flex items-center space-x-6">
                    <div
                        className="text-2xl font-bold text-gray-800 cursor-pointer"
                        onClick={() => setPage('home')}
                    >
                        Voting DApp
                    </div>

                    {account && (
                        <div className="hidden md:flex items-center space-x-4 text-sm text-gray-700 font-medium">
                            <button onClick={() => setPage('home')} className="hover:text-indigo-600">Dashboard</button>
                            <button onClick={() => setPage('create')} className="hover:text-indigo-600">Create Room</button>
                            <button onClick={() => setPage('myrooms')} className="hover:text-indigo-600">My Rooms</button>
                            <button onClick={() => setPage('join')} className="hover:text-indigo-600">Join Room</button>
                            {(role === 'creator' || role === 'superadmin') && (
                                <button onClick={() => setPage('adminpanel')} className="hover:text-indigo-600">Admin Panel</button>
                            )}
                        </div>
                    )}
                </div>

                {/* Right Side: Wallet */}
                <div className="flex items-center">
                    <ConnectWalletButton />
                </div>
            </div>
        </nav>
    );
}
