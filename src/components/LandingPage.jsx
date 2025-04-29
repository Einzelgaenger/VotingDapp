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
        <div style={{ backgroundColor: '#F9FAFB', color: '#111827', minHeight: '100vh', padding: '2rem' }}>
            {/* Hero Section */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                marginBottom: '4rem'
            }}>
                <h1 style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                    Welcome to Voting DApp
                </h1>
                <p style={{ fontSize: '1.25rem', maxWidth: '600px', marginBottom: '2rem' }}>
                    Securely create, join, and manage decentralized voting rooms with ease.
                </p>

                {!account ? (
                    <button
                        onClick={handleConnect}
                        style={primaryButton}
                    >
                        Connect Wallet
                    </button>
                ) : (
                    <button
                        onClick={() => setPage('home')}
                        style={primaryButton}
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

const primaryButton = {
    padding: '1rem 2rem',
    backgroundColor: '#4F46E5',
    color: 'white',
    fontSize: '1.1rem',
    fontWeight: 'bold',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
};
