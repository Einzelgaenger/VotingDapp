// ✅ Final ConnectWalletButton.jsx - No useTheme, Clean and Professional

import { useWallet } from '../contexts/WalletContext';

export default function ConnectWalletButton() {
    const { account, role, connectWallet } = useWallet();

    return (
        <div>
            {account ? (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    backgroundColor: '#f0f0f0',
                    padding: '0.5rem 1rem',
                    borderRadius: '9999px',
                    fontSize: '0.9rem',
                    fontWeight: 'bold'
                }}>
                    <span>{account.slice(0, 6)}...{account.slice(-4)}</span>
                    <span style={{
                        backgroundColor: role === 'creator' ? '#4caf50' : (role === 'superadmin' ? '#2196f3' : '#9e9e9e'),
                        color: 'white',
                        padding: '0.2rem 0.6rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem'
                    }}>
                        {role.toUpperCase()}
                    </span>
                </div>
            ) : (
                <button
                    onClick={connectWallet}
                    style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#4caf50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '9999px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    Connect Wallet
                </button>
            )}
        </div>
    );
}
