// ✅ src/components/LandingPage.jsx

import { useEffect } from 'react';
import { useWallet } from '../contexts/WalletContext';

export default function LandingPage({ setPage }) {
    const { account, connectWallet } = useWallet();

    const handleConnect = async () => {
        await connectWallet();
        // Jangan langsung cek account di sini
        // Tunggu perubahan account lewat useEffect
    };

    useEffect(() => {
        if (account) {
            setPage('create'); // 🔥 Kalau account terdeteksi, langsung ke Create
        }
    }, [account, setPage]);

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
                    <p>Wallet Connected! Redirecting...</p>
                </div>
            )}
        </div>
    );
}
