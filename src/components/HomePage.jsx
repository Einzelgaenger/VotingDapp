    // ✅ New HomePage.jsx - Clean Simple Home After Connect

    import { useWallet } from '../contexts/WalletContext';

    export default function HomePage({ setPage }) {
        const { account } = useWallet();

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
                <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Dashboard</h1>
                <p style={{ fontSize: '1.2rem', maxWidth: '600px', marginBottom: '2rem' }}>
                    Welcome {account ? account.slice(0, 6) + '...' + account.slice(-4) : ''}!
                    Manage and interact with your voting rooms.
                </p>

                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                    <button
                        onClick={() => setPage('create')}
                        style={buttonStylePrimary}
                    >
                        ➕ Create New Room
                    </button>

                    <button
                        onClick={() => setPage('myrooms')}
                        style={buttonStyleSecondary}
                    >
                        📋 My Rooms
                    </button>

                    <button
                        onClick={() => setPage('join')}
                        style={buttonStyleSecondary}
                    >
                        🔑 Join Room
                    </button>
                </div>
            </div>
        );
    }

    const buttonStylePrimary = {
        padding: '1rem 2rem',
        backgroundColor: '#4caf50',
        color: 'white',
        border: 'none',
        borderRadius: '12px',
        fontSize: '1.1rem',
        fontWeight: 'bold',
        cursor: 'pointer'
    };

    const buttonStyleSecondary = {
        padding: '1rem 2rem',
        backgroundColor: '#2196f3',
        color: 'white',
        border: 'none',
        borderRadius: '12px',
        fontSize: '1.1rem',
        fontWeight: 'bold',
        cursor: 'pointer'
    };
