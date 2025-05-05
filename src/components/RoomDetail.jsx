import { useEffect, useState } from 'react';
import { BrowserProvider, Contract } from 'ethers';
import { useWallet } from '../contexts/WalletContext';
import VotingRoomAbi from '../abis/VotingRoom.json';
import { FileText } from 'lucide-react';

export default function RoomDetail({ activeRoomAddress, setPage, setReturnPage, setActiveRoomAddress }) {
    const { account } = useWallet();
    const [roomInfo, setRoomInfo] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!activeRoomAddress) return;
        fetchRoomDetail();
    }, [activeRoomAddress]);

    const fetchRoomDetail = async () => {
        try {
            setLoading(true);
            const provider = new BrowserProvider(window.ethereum);
            const contract = new Contract(activeRoomAddress, VotingRoomAbi, provider);

            const [
                roomName,
                description,
                roomAdmin,
                superAdmin,
                votersRaw,
                candidatesRaw,
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

            const voters = Array.from(votersRaw).map(v => v.toLowerCase());
            const candidates = Array.from(candidatesRaw);

            setRoomInfo({
                roomName,
                description,
                roomAdmin: roomAdmin.toLowerCase(),
                superAdmin: superAdmin.toLowerCase(),
                voters,
                candidates,
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

    const handleJoinRoom = async () => {
        try {
            const user = account.toLowerCase();
            const { roomAdmin, superAdmin, voters } = roomInfo;
            const isAdmin = user === roomAdmin || user === superAdmin;
            const isVoter = voters.includes(user);

            if (isAdmin || isVoter) {
                setActiveRoomAddress(activeRoomAddress);
                setPage('roominteract');
            } else {
                alert("You're not authorized to join this room.");
            }
        } catch (err) {
            console.error('Join room failed:', err);
            alert('Failed to join room.');
        }
    };

    if (loading || !roomInfo) {
        return <div className="p-8">Loading Room Detail...</div>;
    }

    return (
        <div className="p-8 max-w-4xl mx-auto text-gray-800">
            <h2 className="text-2xl font-bold flex items-center gap-2 mb-6">
                <FileText className="text-indigo-600" />
                Room Detail
            </h2>

            <div className="bg-white border shadow rounded-lg p-6 space-y-3">
                <p><strong>Room Name:</strong> {roomInfo.roomName}</p>
                <p><strong>Description:</strong> {roomInfo.description}</p>
                <p><strong>Room Address:</strong> {activeRoomAddress}</p>
                <p><strong>Room Admin:</strong> {roomInfo.roomAdmin}</p>
                <p><strong>Super Admin:</strong> {roomInfo.superAdmin}</p>
                <p><strong>Factory:</strong> {roomInfo.factory}</p>
                <p><strong>Status Room:</strong> {roomInfo.isActive ? 'Active' : 'Inactive'}</p>
                <p>
                    <strong>Voting Status:</strong>{' '}
                    {roomInfo.votingStarted ? (roomInfo.votingEnded ? 'Ended' : 'In Progress') : 'Not Started'}
                </p>
                <p><strong>Max Voters:</strong> {roomInfo.maxVoters}</p>
                <p><strong>Current Voters:</strong> {roomInfo.voters.length}</p>
                <p><strong>Number of Candidates:</strong> {roomInfo.candidates.length}</p>
            </div>

            <div className="flex flex-wrap gap-4 mt-6">
                <button
                    onClick={() => setPage('myrooms')}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md"
                >
                    ← Back to My Rooms
                </button>
                <button
                    onClick={() => {
                        setReturnPage('roomdetail');
                        setPage('roommembers');
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md"
                >
                    View Members
                </button>
                <button
                    onClick={handleJoinRoom}
                    className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-md"
                >
                    Join Room
                </button>
            </div>
        </div>
    );
}
