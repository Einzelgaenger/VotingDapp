import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../contexts/WalletContext';
import VotingRoomAbi from '../abis/VotingRoom.json';

export default function RoomDetail({ activeRoomAddress, setPage }) {
    const { account } = useWallet();
    const [roomInfo, setRoomInfo] = useState(null);
    const [loading, setLoading] = useState(true);

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
                description,
                roomAdmin,
                superAdmin,
                voters,
                candidates,
                isActive,
                votingStarted,
                votingEnded,
                maxVoters,
                factory
            ] = await Promise.all([
                contract.roomName(),
                contract.description(),
                contract.roomAdmin(),
                contract.superAdmin(),
                contract.getVoters(),
                contract.getCandidates(),
                contract.isActive(),
                contract.votingStarted(),
                contract.votingEnded(),
                contract.maxVoters(),
                contract.factory()
            ]);

            setRoomInfo({
                roomName,
                description,
                roomAdmin: roomAdmin.toLowerCase(),
                superAdmin: superAdmin.toLowerCase(),
                votersCount: voters.length,
                candidatesCount: candidates.length,
                isActive,
                votingStarted,
                votingEnded,
                maxVoters: maxVoters.toString(),
                factory
            });
        } catch (error) {
            console.error('Error fetching room detail:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading || !roomInfo) {
        return <div style={{ padding: '2rem' }}>Loading Room Detail...</div>;
    }

    return (
        <div style={{ padding: '2rem' }}>
            <h2>Room Detail</h2>

            <div style={{ marginBottom: '1rem' }}>
                <strong>Room Name:</strong> {roomInfo.roomName} <br />
                <strong>Description:</strong> {roomInfo.description} <br />
                <strong>Room Address:</strong> {activeRoomAddress} <br />
                <strong>Room Admin:</strong> {roomInfo.roomAdmin} <br />
                <strong>Super Admin:</strong> {roomInfo.superAdmin} <br />
                <strong>Factory:</strong> {roomInfo.factory} <br />
                <strong>Status Room:</strong> {roomInfo.isActive ? 'Active' : 'Inactive'} <br />
                <strong>Voting Status:</strong> {roomInfo.votingStarted ? (roomInfo.votingEnded ? 'Ended' : 'In Progress') : 'Not Started'} <br />
                <strong>Max Voters:</strong> {roomInfo.maxVoters} <br />
                <strong>Current Voters:</strong> {roomInfo.votersCount} <br />
                <strong>Number of Candidates:</strong> {roomInfo.candidatesCount} <br />
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
                <button onClick={() => setPage('myrooms')}>Back to My Rooms</button>
                <button onClick={() => setPage('roommembers')}>View Members</button>
            </div>
        </div>
    );
}
