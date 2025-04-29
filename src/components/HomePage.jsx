import { useWallet } from '../contexts/WalletContext';
import { Sparkles, PlusCircle, ClipboardList, KeyRound } from 'lucide-react';

export default function HomePage({ setPage }) {
    const { account } = useWallet();

    return (
        <div className="p-6 sm:p-10">
            <div className="text-center mb-10">
                <h1 className="text-4xl font-bold mb-2 text-gray-800">Welcome back!</h1>
                <p className="text-gray-500 text-lg">
                    {account ? `Hello ${account.slice(0, 6)}...${account.slice(-4)}, ready to vote?` : 'Manage your rooms easily.'}
                </p>
            </div>

            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                <ActionCard
                    icon={<PlusCircle className="w-6 h-6" />}
                    title="Create New Room"
                    desc="Start a secure and decentralized voting room instantly."
                    color="bg-indigo-100 text-indigo-700"
                    onClick={() => setPage('create')}
                />
                <ActionCard
                    icon={<ClipboardList className="w-6 h-6" />}
                    title="My Rooms"
                    desc="Access and manage rooms you’ve created."
                    color="bg-blue-100 text-blue-700"
                    onClick={() => setPage('myrooms')}
                />
                <ActionCard
                    icon={<KeyRound className="w-6 h-6" />}
                    title="Join Room"
                    desc="Join a room and cast your vote securely."
                    color="bg-orange-100 text-orange-700"
                    onClick={() => setPage('join')}
                />
            </div>

            <div className="mt-12 text-center text-sm text-gray-400 flex justify-center items-center gap-1">
                <Sparkles className="w-4 h-4" />
                <span>Decentralized. Secure. Transparent.</span>
            </div>
        </div>
    );
}

function ActionCard({ icon, title, desc, color, onClick }) {
    return (
        <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition p-6 flex flex-col justify-between">
            <div>
                <div className={`w-12 h-12 flex items-center justify-center rounded-lg mb-4 ${color}`}>
                    {icon}
                </div>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">{title}</h2>
                <p className="text-gray-600 text-sm">{desc}</p>
            </div>
            <button
                onClick={onClick}
                className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition"
            >
                Go
            </button>
        </div>
    );
}
