// ✅ Updated Navbar.jsx - Cleaned up Role Display

import { useWallet } from '../contexts/WalletContext';
import ConnectWalletButton from './ConnectWalletButton';

export default function Navbar({ setPage }) {
    const { account, role } = useWallet();

    return (
        <nav style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem',
            borderBottom: '1px solid black',
            backgroundColor: '#fafafa'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>Voting DApp</div>

                {account && (
                    <>
                        <button onClick={() => setPage('create')}>Create Room</button>
                        <button onClick={() => setPage('myrooms')}>My Rooms</button>
                        <button onClick={() => setPage('join')}>Join Room</button>

                        {(role === 'creator' || role === 'superadmin') && (
                            <button onClick={() => setPage('adminpanel')}>Admin Panel</button>
                        )}
                    </>
                )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ConnectWalletButton />
            </div>
        </nav>
    );
}
