import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../contexts/WalletContext';
import VotingRoomAbi from '../abis/VotingRoom.json';

export default function RoomInteract({ activeRoomAddress, setPage, setReturnPage }) {
    const { account } = useWallet();
    const [roomInfo, setRoomInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [candidateName, setCandidateName] = useState('');
    const [newVoterAddress, setNewVoterAddress] = useState('');
    const [newAdminAddress, setNewAdminAddress] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        if (activeRoomAddress) fetchRoomDetail();
    }, [activeRoomAddress]);

    const fetchRoomDetail = async () => {
        try {
            setLoading(true);
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const contract = new ethers.Contract(activeRoomAddress, VotingRoomAbi, provider);

            const [
                roomName,
                roomAdmin,
                superAdmin,
                voters,
                candidates,
                isActive,
                votingStarted,
                votingEnded,
                maxVoters
            ] = await Promise.all([
                contract.roomName(),
                contract.roomAdmin(),
                contract.superAdmin(),
                contract.getVoters(),
                contract.getCandidates(),
                contract.isActive(),
                contract.votingStarted(),
                contract.votingEnded(),
                contract.maxVoters()
            ]);

            setRoomInfo({
                roomName,
                roomAdmin: roomAdmin.toLowerCase(),
                superAdmin: superAdmin.toLowerCase(),
                voters: voters.map(addr => addr.toLowerCase()),
                candidates,
                isActive,
                votingStarted,
                votingEnded,
                maxVoters: maxVoters.toString()
            });
        } catch (err) {
            console.error('Error fetching room detail:', err);
        } finally {
            setLoading(false);
        }
    };

    const isRoomAdmin = () => account.toLowerCase() === roomInfo?.roomAdmin;
    const isSuperAdmin = () => account.toLowerCase() === roomInfo?.superAdmin;

    const handleTx = async (method, ...args) => {
        try {
            setActionLoading(true);
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            const contract = new ethers.Contract(activeRoomAddress, VotingRoomAbi, signer);

            const tx = await contract[method](...args);
            await tx.wait();
            await fetchRoomDetail();
            alert(`${method} success!`);
        } catch (err) {
            console.error(`Error during ${method}:`, err);
            alert(`Failed to ${method}`);
        } finally {
            setActionLoading(false);
        }
    };

    if (loading || !roomInfo) return <div style={{ padding: '2rem' }}>Loading Room Interaction...</div>;

    return (
        <div style={{ padding: '2rem' }}>
            <h2>Interact with Voting Room</h2>

            <div>
                <strong>Room Name:</strong> {roomInfo.roomName}<br />
                <strong>Room Address:</strong> {activeRoomAddress}<br />
                <strong>Room Admin:</strong> {roomInfo.roomAdmin}<br />
                <strong>Super Admin:</strong> {roomInfo.superAdmin}<br />
                <strong>Status:</strong> {roomInfo.isActive ? 'Active' : 'Inactive'}<br />
                <strong>Voting:</strong> {roomInfo.votingStarted ? (roomInfo.votingEnded ? 'Ended' : 'In Progress') : 'Not Started'}<br />
                <strong>Max Voters:</strong> {roomInfo.maxVoters}<br />
                <strong>Total Candidates:</strong> {roomInfo.candidates.length}<br />
            </div>

            {isRoomAdmin() && (
                <>
                    {!roomInfo.votingStarted && (
                        <button onClick={() => handleTx("startVote")} disabled={actionLoading}>Start Voting</button>
                    )}
                    {roomInfo.votingStarted && !roomInfo.votingEnded && (
                        <button onClick={() => handleTx("endVote")} disabled={actionLoading}>End Voting</button>
                    )}

                    <div style={{ marginTop: '1rem' }}>
                        <input
                            type="text"
                            placeholder="New Candidate Name"
                            value={candidateName}
                            onChange={(e) => setCandidateName(e.target.value)}
                        />
                        <button onClick={() => handleTx("addCandidate", candidateName)} disabled={actionLoading}>
                            Add Candidate
                        </button>
                    </div>

                    <div style={{ marginTop: '1rem' }}>
                        <input
                            type="text"
                            placeholder="New Voter Address"
                            value={newVoterAddress}
                            onChange={(e) => setNewVoterAddress(e.target.value)}
                        />
                        <button onClick={() => handleTx("addVoter", newVoterAddress)} disabled={actionLoading}>
                            Add Voter
                        </button>
                    </div>

                    <div style={{ marginTop: '1rem' }}>
                        <button onClick={() => handleTx("clearVotes")} disabled={actionLoading}>Clear Votes</button>
                        <button onClick={() => handleTx("clearCandidates")} disabled={actionLoading} style={{ marginLeft: '1rem' }}>
                            Clear Candidates
                        </button>
                        <button onClick={() => handleTx("resetRoom")} disabled={actionLoading} style={{ marginLeft: '1rem' }}>
                            Reset Room
                        </button>
                    </div>

                    <div style={{ marginTop: '1rem' }}>
                        <input
                            type="text"
                            placeholder="New Admin Address"
                            value={newAdminAddress}
                            onChange={(e) => setNewAdminAddress(e.target.value)}
                        />
                        <button onClick={() => handleTx("transferRoomAdmin", newAdminAddress)} disabled={actionLoading}>
                            Transfer Admin
                        </button>
                    </div>
                </>
            )}

            {(isRoomAdmin() || isSuperAdmin()) && (
                <div style={{ marginTop: '1rem' }}>
                    <button
                        onClick={() => {
                            if (window.confirm('Deactivate this room?')) handleTx("deactivateRoom");
                        }}
                        disabled={actionLoading}
                        style={{ backgroundColor: 'red', color: 'white' }}
                    >
                        Deactivate Room
                    </button>
                </div>
            )}

            <h3 style={{ marginTop: '2rem' }}>Candidates</h3>
            <ul>
                {roomInfo.candidates.map((candidate, idx) => (
                    <li key={idx} style={{ marginBottom: '1rem' }}>
                        <div><strong>{candidate.name}</strong> (Votes: {candidate.voteCount.toString()})</div>
                        {roomInfo.votingStarted && !roomInfo.votingEnded && (
                            <button onClick={() => handleTx("vote", candidate.id)} disabled={actionLoading}>Vote</button>
                        )}
                    </li>
                ))}
            </ul>

            <div style={{ marginTop: '2rem' }}>
                <button onClick={() => {
                    setReturnPage('roominteract');
                    setPage('roommembers');
                }}>View Room Members</button>
                <button onClick={() => setPage('myrooms')} style={{ marginLeft: '1rem' }}>Back to My Rooms</button>
            </div>
        </div>
    );
}
