import { useWallet } from '../contexts/WalletContext';
import ConnectWalletButton from './ConnectWalletButton';

export default function Navbar({ setPage }) {
    const { account, role } = useWallet();

    return (
        <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderBottom: '1px solid black' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>Voting DApp</div>

                {account && (
                    <>
                        {/* Tombol universal untuk semua user yang connect */}
                        <button onClick={() => setPage('create')}>Create Room</button>
                        <button onClick={() => setPage('myrooms')}>My Rooms</button>
                        <button onClick={() => setPage('join')}>Join Room</button>

                        {/* Kalau role = creator atau superadmin, munculkan tombol Admin Panel */}
                        {(role === 'creator' || role === 'superadmin') && (
                            <button onClick={() => setPage('admin')}>Admin Panel</button>
                        )}
                    </>
                )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                <ConnectWalletButton />
                {account && (
                    <div style={{ fontSize: '0.9rem' }}>
                        <div><strong>Role:</strong> {role}</div>
                    </div>
                )}
            </div>
        </nav>
    );
}
