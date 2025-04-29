import { useWallet } from '../contexts/WalletContext';
import FeaturesSection from './FeaturesSection';

export default function LandingPage({ setPage }) {
    const { account, connectWallet } = useWallet();

    const handleConnect = async () => {
        try {
            await connectWallet();
        } catch (error) {
            console.error('Failed to connect wallet:', error);
        }
    };

    return (
        <div className="bg-white text-gray-800 font-sans">
            {/* Hero Section */}
            <div className="max-w-6xl mx-auto px-6 pt-24 pb-32 text-center">
                <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4">
                    We create <span className="text-orange-500">solutions</span> for your voting
                </h1>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
                    Our decentralized system helps you launch secure, fast, and transparent voting rooms on the blockchain.
                </p>
                {!account ? (
                    <button
                        onClick={handleConnect}
                        className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold shadow-md transition"
                    >
                        Connect Wallet
                    </button>
                ) : (
                    <button
                        onClick={() => setPage('home')}
                        className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold shadow-md transition"
                    >
                        Go to Dashboard
                    </button>
                )}
            </div>

            {/* Features Section */}
            <FeaturesSection />
        </div>
    );
}
