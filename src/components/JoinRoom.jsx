import { useState } from 'react';
import { Contract, isAddress, BrowserProvider } from 'ethers';
import { useWallet } from '../contexts/WalletContext';
import VotingRoomAbi from '../abis/VotingRoom.json';

export default function JoinRoom({ setPage, setActiveRoomAddress }) {
    const { account } = useWallet();
    const [roomAddress, setRoomAddress] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleJoinRoom = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (!isAddress(roomAddress)) {
                setError('Invalid room address.');
                setLoading(false);
                return;
            }

            const provider = new BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new Contract(roomAddress, VotingRoomAbi, signer);

            const [roomAdmin, superAdmin, voterList] = await Promise.all([
                contract.roomAdmin(),
                contract.superAdmin(),
                contract.getVoters()
            ]);

            const lowerAccount = account.toLowerCase();
            const isAdmin = lowerAccount === roomAdmin.toLowerCase() || lowerAccount === superAdmin.toLowerCase();
            const isVoter = voterList.map(addr => addr.toLowerCase()).includes(lowerAccount);

            if (isAdmin || isVoter) {
                setActiveRoomAddress(roomAddress);
                setPage('roominteract');
            } else {
                setError('You are not authorized to join this room.');
            }
        } catch (err) {
            console.error('Error joining room:', err);
            setError('Failed to connect to the room. Maybe wrong address.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '2rem' }}>
            <h2>Join Voting Room</h2>
            <form onSubmit={handleJoinRoom} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px' }}>
                <input
                    type="text"
                    placeholder="Enter Voting Room Address"
                    value={roomAddress}
                    onChange={(e) => setRoomAddress(e.target.value)}
                    required
                />
                <button type="submit" disabled={loading}>
                    {loading ? 'Joining...' : 'Join Room'}
                </button>
            </form>

            {error && <p style={{ color: 'red', marginTop: '1rem' }}>{error}</p>}

            <div style={{ marginTop: '2rem' }}>
                <button onClick={() => setPage('create')}>Back to Home</button>
            </div>
        </div>
    );
}
