import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../contexts/WalletContext';
import VotingRoomAbi from '../abis/VotingRoom.json';

export default function RoomInteract({ activeRoomAddress, setPage }) {
    const { account } = useWallet();
    const [roomInfo, setRoomInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [candidateName, setCandidateName] = useState('');
    const [newVoterAddress, setNewVoterAddress] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        if (activeRoomAddress) {
            fetchRoomDetail();
        }
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
        } catch (error) {
            console.error('Error fetching room detail:', error);
        } finally {
            setLoading(false);
        }
    };

    const isAdmin = () => {
        if (!roomInfo) return false;
        return (
            account.toLowerCase() === roomInfo.roomAdmin ||
            account.toLowerCase() === roomInfo.superAdmin
        );
    };

    const isSuperAdmin = () => {
        if (!roomInfo) return false;
        return account.toLowerCase() === roomInfo.superAdmin;
    };

    const handleStartVote = async () => {
        try {
            setActionLoading(true);
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            const contract = new ethers.Contract(activeRoomAddress, VotingRoomAbi, signer);

            const tx = await contract.startVote();
            await tx.wait();

            alert('Voting started!');
            fetchRoomDetail();
        } catch (error) {
            console.error('Error starting vote:', error);
            alert('Failed to start voting.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleEndVote = async () => {
        try {
            setActionLoading(true);
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            const contract = new ethers.Contract(activeRoomAddress, VotingRoomAbi, signer);

            const tx = await contract.endVote();
            await tx.wait();

            alert('Voting ended!');
            fetchRoomDetail();
        } catch (error) {
            console.error('Error ending vote:', error);
            alert('Failed to end voting.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleVote = async (candidateId) => {
        try {
            setActionLoading(true);
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            const contract = new ethers.Contract(activeRoomAddress, VotingRoomAbi, signer);

            const tx = await contract.vote(candidateId);
            await tx.wait();

            alert('Voted successfully!');
            fetchRoomDetail();
        } catch (error) {
            console.error('Error voting:', error);
            alert('Failed to vote.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleAddCandidate = async () => {
        try {
            if (!candidateName) return alert('Candidate name is required.');
            setActionLoading(true);
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            const contract = new ethers.Contract(activeRoomAddress, VotingRoomAbi, signer);

            const tx = await contract.addCandidate(candidateName);
            await tx.wait();

            alert('Candidate added!');
            setCandidateName('');
            fetchRoomDetail();
        } catch (error) {
            console.error('Error adding candidate:', error);
            alert('Failed to add candidate.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleAddVoter = async () => {
        try {
            if (!ethers.utils.isAddress(newVoterAddress)) return alert('Invalid address.');
            setActionLoading(true);
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            const contract = new ethers.Contract(activeRoomAddress, VotingRoomAbi, signer);

            const tx = await contract.addVoter(newVoterAddress);
            await tx.wait();

            alert('Voter added!');
            setNewVoterAddress('');
            fetchRoomDetail();
        } catch (error) {
            console.error('Error adding voter:', error);
            alert('Failed to add voter.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleResetRoom = async () => {
        if (!window.confirm('Are you sure you want to reset this room?')) return;
        try {
            setActionLoading(true);
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            const contract = new ethers.Contract(activeRoomAddress, VotingRoomAbi, signer);

            const tx = await contract.resetRoom();
            await tx.wait();

            alert('Room reset successfully!');
            fetchRoomDetail();
        } catch (error) {
            console.error('Error resetting room:', error);
            alert('Failed to reset room.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeactivateRoom = async () => {
        if (!window.confirm('Are you sure you want to deactivate this room?')) return;
        try {
            setActionLoading(true);
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            const contract = new ethers.Contract(activeRoomAddress, VotingRoomAbi, signer);

            const tx = await contract.deactivateRoom();
            await tx.wait();

            alert('Room deactivated successfully!');
            fetchRoomDetail();
        } catch (error) {
            console.error('Error deactivating room:', error);
            alert('Failed to deactivate room.');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading || !roomInfo) {
        return <div style={{ padding: '2rem' }}>Loading Room Interaction...</div>;
    }

    return (
        <div style={{ padding: '2rem' }}>
            <h2>Interact with Voting Room</h2>

            <div style={{ marginBottom: '1rem' }}>
                <strong>Room Name:</strong> {roomInfo.roomName} <br />
                <strong>Room Address:</strong> {activeRoomAddress} <br />
                <strong>Room Admin:</strong> {roomInfo.roomAdmin} <br />
                <strong>Super Admin:</strong> {roomInfo.superAdmin} <br />
                <strong>Status:</strong> {roomInfo.isActive ? 'Active' : 'Inactive'} <br />
                <strong>Voting:</strong> {roomInfo.votingStarted ? (roomInfo.votingEnded ? 'Ended' : 'In Progress') : 'Not Started'} <br />
                <strong>Max Voters:</strong> {roomInfo.maxVoters} <br />
                <strong>Total Candidates:</strong> {roomInfo.candidates.length} <br />
            </div>

            {isAdmin() && (
                <>
                    {!roomInfo.votingStarted && (
                        <button onClick={handleStartVote} disabled={actionLoading}>Start Voting</button>
                    )}
                    {roomInfo.votingStarted && !roomInfo.votingEnded && (
                        <button onClick={handleEndVote} disabled={actionLoading}>End Voting</button>
                    )}

                    <div style={{ marginTop: '1rem' }}>
                        <input
                            type="text"
                            placeholder="New Candidate Name"
                            value={candidateName}
                            onChange={(e) => setCandidateName(e.target.value)}
                        />
                        <button onClick={handleAddCandidate} disabled={actionLoading}>Add Candidate</button>
                    </div>

                    <div style={{ marginTop: '1rem' }}>
                        <input
                            type="text"
                            placeholder="New Voter Address"
                            value={newVoterAddress}
                            onChange={(e) => setNewVoterAddress(e.target.value)}
                        />
                        <button onClick={handleAddVoter} disabled={actionLoading}>Add Voter</button>
                    </div>

                    <div style={{ marginTop: '1rem' }}>
                        <button onClick={handleResetRoom} disabled={actionLoading}>Reset Room</button>
                    </div>
                </>
            )}

            {isAdmin() && (
                <div style={{ marginTop: '1rem' }}>
                    <button onClick={handleDeactivateRoom} disabled={actionLoading} style={{ backgroundColor: 'red', color: 'white' }}>
                        Deactivate Room
                    </button>
                </div>
            )}


            <h3 style={{ marginTop: '2rem' }}>Candidates</h3>
            <ul>
                {roomInfo.candidates.map((candidate, index) => (
                    <li key={index} style={{ marginBottom: '1rem' }}>
                        <div><strong>{candidate.name}</strong> (Votes: {candidate.voteCount.toString()})</div>
                        {roomInfo.votingStarted && !roomInfo.votingEnded && (
                            <button onClick={() => handleVote(candidate.id)} disabled={actionLoading}>Vote</button>
                        )}
                    </li>
                ))}
            </ul>

            <div style={{ marginTop: '2rem' }}>
                <button onClick={() => setPage('create')}>Back to Home</button>
            </div>
        </div>
    );
}

