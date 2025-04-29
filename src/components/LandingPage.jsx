// ✅ src/components/LandingPage.jsx

import { useWallet } from '../contexts/WalletContext';

export default function LandingPage({ setPage }) {
    const { account, connectWallet } = useWallet();

    const handleConnect = async () => {
        await connectWallet();
        if (account) {
            setPage('create'); // Setelah connect, langsung masuk ke halaman Create
        }
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '80vh',
            padding: '2rem'
        }}>
            <h1>Welcome to the Voting DApp</h1>
            <p>Create and manage secure decentralized voting rooms easily!</p>

            {!account ? (
                <button
                    onClick={handleConnect}
                    style={{ marginTop: '2rem', padding: '1rem 2rem', fontSize: '1.2rem' }}
                >
                    Connect Wallet
                </button>
            ) : (
                <div style={{ marginTop: '2rem' }}>
                    <p>Wallet Connected!</p>
                    <button
                        onClick={() => setPage('create')}
                        style={{ marginTop: '1rem', padding: '0.8rem 1.5rem' }}
                    >
                        Continue to Create Room
                    </button>
                </div>
            )}
        </div>
    );
}
