import { useWallet } from '../contexts/WalletContext';

export default function HomePage({ setPage }) {
    const { account } = useWallet();

    return (
        <div style={{
            backgroundColor: '#F9FAFB',
            color: '#111827',
            minHeight: '90vh',
            padding: '4rem 2rem',
            textAlign: 'center',
        }}>
            {/* Welcome Section */}
            <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                Dashboard
            </h1>
            <p style={{ fontSize: '1.2rem', marginBottom: '3rem', color: '#6B7280' }}>
                Welcome {account ? account.slice(0, 6) + '...' + account.slice(-4) : ''}!
                Manage and interact with your voting rooms.
            </p>

            {/* Actions */}
            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: '2rem',
            }}>
                <ActionCard
                    icon="➕"
                    title="Create New Room"
                    description="Start a new decentralized voting room easily."
                    buttonLabel="Create Room"
                    onClick={() => setPage('create')}
                    bgColor="#4F46E5"
                />

                <ActionCard
                    icon="📋"
                    title="My Rooms"
                    description="Manage all your created and joined rooms."
                    buttonLabel="My Rooms"
                    onClick={() => setPage('myrooms')}
                    bgColor="#3B82F6"
                />

                <ActionCard
                    icon="🔑"
                    title="Join Room"
                    description="Join existing voting rooms with secure authentication."
                    buttonLabel="Join Room"
                    onClick={() => setPage('join')}
                    bgColor="#F97316"
                />
            </div>
        </div>
    );
}

function ActionCard({ icon, title, description, buttonLabel, onClick, bgColor }) {
    return (
        <div style={{
            flex: '1 1 250px',
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            minHeight: '300px',
            transition: 'all 0.2s ease',
        }}>
            <div>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{icon}</div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{title}</h2>
                <p style={{ fontSize: '1rem', color: '#6B7280' }}>{description}</p>
            </div>
            <button
                onClick={onClick}
                style={{
                    marginTop: '1.5rem',
                    padding: '0.75rem 1.5rem',
                    backgroundColor: bgColor,
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s ease',
                }}
            >
                {buttonLabel}
            </button>
        </div>
    );
}
