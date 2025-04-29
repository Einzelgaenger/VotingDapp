// ✅ HomePage.jsx - Updated to Match LandingPage + FeaturesSection

import { useWallet } from '../contexts/WalletContext';

export default function HomePage({ setPage }) {
    const { account } = useWallet();

    return (
        <div className="bg-white text-gray-800 font-sans min-h-screen">
            <div className="max-w-6xl mx-auto px-6 pt-24 pb-32 text-center">
                <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4">
                    Dashboard
                </h1>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-12">
                    {account ? `Welcome ${account.slice(0, 6)}...${account.slice(-4)}!` : 'Manage and interact with your voting rooms easily.'}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <ActionCard
                        icon="➕"
                        title="Create New Room"
                        description="Start a new decentralized voting room easily."
                        buttonLabel="Create Room"
                        onClick={() => setPage('create')}
                        bgColor="bg-indigo-500 hover:bg-indigo-600"
                        iconColor="bg-indigo-100 text-indigo-600"
                    />

                    <ActionCard
                        icon="📋"
                        title="My Rooms"
                        description="View and manage your created or joined rooms."
                        buttonLabel="My Rooms"
                        onClick={() => setPage('myrooms')}
                        bgColor="bg-blue-500 hover:bg-blue-600"
                        iconColor="bg-blue-100 text-blue-600"
                    />

                    <ActionCard
                        icon="🔑"
                        title="Join Room"
                        description="Enter existing voting rooms securely."
                        buttonLabel="Join Room"
                        onClick={() => setPage('join')}
                        bgColor="bg-orange-500 hover:bg-orange-600"
                        iconColor="bg-orange-100 text-orange-500"
                    />
                </div>
            </div>
        </div>
    );
}

function ActionCard({ icon, title, description, buttonLabel, onClick, bgColor, iconColor }) {
    return (
        <div
            className="flex flex-col items-center bg-gray-50 rounded-2xl shadow-md hover:shadow-lg p-8 transition transform hover:-translate-y-2 hover:scale-[1.02]"
        >
            <div className={`w-16 h-16 flex items-center justify-center rounded-xl mb-6 text-3xl ${iconColor}`}>
                {icon}
            </div>
            <h2 className="text-2xl font-semibold mb-2">{title}</h2>
            <p className="text-gray-600 text-sm mb-6">{description}</p>
            <button
                onClick={onClick}
                className={`${bgColor} text-white px-6 py-3 rounded-lg font-semibold shadow-md transition`}
            >
                {buttonLabel}
            </button>
        </div>
    );
}
