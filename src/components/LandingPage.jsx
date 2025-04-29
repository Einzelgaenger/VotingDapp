// ✅ Final LandingPage.jsx - Redirect to Home after Connect

import { useWallet } from '../contexts/WalletContext';

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
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '90vh',
            backgroundColor: '#fafafa',
            color: '#333',
            padding: '2rem',
            textAlign: 'center',
        }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Welcome to Voting DApp</h1>
            <p style={{ fontSize: '1.2rem', maxWidth: '600px', marginBottom: '2rem' }}>
                Create, manage, and join decentralized voting rooms securely.
            </p>

            {!account ? (
                <button
                    onClick={handleConnect}
                    style={{
                        padding: '0.8rem 2rem',
                        backgroundColor: '#4caf50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '9999px',
                        fontSize: '1.1rem',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                    }}
                >
                    Connect Wallet
                </button>
            ) : (
                <button
                    onClick={() => setPage('home')}
                    style={{
                        marginTop: '2rem',
                        padding: '0.8rem 2rem',
                        backgroundColor: '#2196f3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '9999px',
                        fontSize: '1.1rem',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                    }}
                >
                    Continue to Dashboard
                </button>
            )}
        </div>
    );
}
