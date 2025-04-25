import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../contexts/WalletContext';
import RoomFactoryAbi from '../abis/RoomFactory.json';
import VotingRoomAbi from '../abis/VotingRoom.json';

// ✅ RoomFactory address (clone-based)
const ROOM_FACTORY_ADDRESS = "0x5933899C50ab5DB1bCd94B5a8e60aD34f26e06f3";

export default function MyRooms({ setPage, setActiveRoomAddress }) {
    const { account } = useWallet();
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (account) fetchRoomsFast();
    }, [account]);

    const fetchRoomsFast = async () => {
        try {
            setLoading(true);
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const factory = new ethers.Contract(ROOM_FACTORY_ADDRESS, RoomFactoryAbi, provider);

            const allRooms = await factory.getRooms();

            const myRooms = allRooms.filter(r => r.createdBy.toLowerCase() === account.toLowerCase());

            const formatted = myRooms.map((room, index) => ({
                index,
                address: room.roomAddress,
                roomName: room.roomName,
                description: '',
                votersCount: null,
                candidatesCount: null
            }));

            setRooms(formatted);

            // Lazy load room detail per room
            formatted.forEach((room, i) => fetchRoomDetail(room.address, i));
        } catch (err) {
            console.error('Error fetching my rooms:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchRoomDetail = async (roomAddress, index) => {
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const roomContract = new ethers.Contract(roomAddress, VotingRoomAbi, provider);

            const [description, voters, candidates] = await Promise.all([
                roomContract.description(),
                roomContract.getVoters(),
                roomContract.getCandidates(),
            ]);

            setRooms(prev => {
                const updated = [...prev];
                updated[index] = {
                    ...updated[index],
                    description,
                    votersCount: voters.length,
                    candidatesCount: candidates.length
                };
                return updated;
            });
        } catch (error) {
            console.error(`Failed to fetch detail for ${roomAddress}:`, error);
        }
    };

    const handleSeeDetails = (addr) => {
        setActiveRoomAddress(addr);
        setPage('roomdetail');
    };

    const handleJoinRoom = async (roomAddress) => {
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const contract = new ethers.Contract(roomAddress, VotingRoomAbi, provider);

            const [roomAdmin, superAdmin, voters] = await Promise.all([
                contract.roomAdmin(),
                contract.superAdmin(),
                contract.getVoters()
            ]);

            const user = account.toLowerCase();
            const isAdmin = user === roomAdmin.toLowerCase() || user === superAdmin.toLowerCase();
            const isVoter = voters.map(v => v.toLowerCase()).includes(user);

            if (isAdmin || isVoter) {
                setActiveRoomAddress(roomAddress);
                setPage('roominteract');
            } else {
                alert("You're not authorized to join this room.");
            }
        } catch (err) {
            console.error('Join room failed:', err);
            alert('Failed to join room');
        }
    };

    if (loading) return <div style={{ padding: '2rem' }}>Loading your rooms...</div>;

    return (
        <div style={{ padding: '2rem' }}>
            <h2>My Voting Rooms</h2>

            {rooms.length === 0 ? (
                <p>No rooms created yet.</p>
            ) : (
                rooms.map((room, index) => (
                    <div key={index} style={{ border: '1px solid #aaa', padding: '1rem', marginBottom: '1rem' }}>
                        <strong>Room Name:</strong> {room.roomName} <br />
                        <strong>Room Address:</strong> {room.address} <br />
                        <strong>Description:</strong> {room.description || 'Loading...'} <br />
                        <strong>Voters:</strong> {room.votersCount !== null ? room.votersCount : '...'} <br />
                        <strong>Candidates:</strong> {room.candidatesCount !== null ? room.candidatesCount : '...'} <br />

                        <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                            <button onClick={() => handleSeeDetails(room.address)}>See Details</button>
                            <button onClick={() => handleJoinRoom(room.address)}>Join Room</button>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}
