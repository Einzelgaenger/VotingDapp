// ✅ Updated for ethers@6.x
import { useEffect, useState } from 'react';
import { BrowserProvider, Contract, isAddress } from 'ethers';
import { useWallet } from '../contexts/WalletContext';
import RoomFactoryAbi from '../abis/RoomFactory.json';
import VotingRoomAbi from '../abis/VotingRoom.json';

const ROOM_FACTORY_ADDRESS = "0x5933899C50ab5DB1bCd94B5a8e60aD34f26e06f3";
const ROOMS_PER_PAGE = 10;

export default function MyRooms({ setPage, setActiveRoomAddress }) {
    const { account } = useWallet();
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        if (!account) return;
        fetchRoomsFast();
        const interval = setInterval(() => {
            fetchRoomsFast();
        }, 15000);
        return () => clearInterval(interval);
    }, [account]);

    const fetchRoomsFast = async () => {
        try {
            setLoading(true);
            const provider = new BrowserProvider(window.ethereum);
            const factory = new Contract(ROOM_FACTORY_ADDRESS, RoomFactoryAbi, provider);

            const allRooms = await factory.getRooms();
            const myRooms = allRooms.filter(r => r.createdBy.toLowerCase() === account.toLowerCase());

            const formatted = myRooms.map((room, index) => ({
                index,
                address: room.roomAddress,
                roomName: room.roomName,
                description: '',
                votersCount: null,
                candidatesCount: null,
                isActive: true,
            }));

            setRooms(formatted.reverse());
            formatted.forEach((room, i) => fetchRoomDetail(room.address, i));
        } catch (err) {
            console.error('Error fetching my rooms:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchRoomDetail = async (roomAddress, index) => {
        try {
            const provider = new BrowserProvider(window.ethereum);
            const roomContract = new Contract(roomAddress, VotingRoomAbi, provider);

            const [description, voters, candidates, isActive] = await Promise.all([
                roomContract.description(),
                roomContract.getVoters(),
                roomContract.getCandidates(),
                roomContract.isActive(),
            ]);

            setRooms(prev => {
                const updated = [...prev];
                updated[index] = {
                    ...updated[index],
                    description,
                    votersCount: voters.length,
                    candidatesCount: candidates.length,
                    isActive,
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
            const provider = new BrowserProvider(window.ethereum);
            const contract = new Contract(roomAddress, VotingRoomAbi, provider);

            const [roomAdmin, superAdmin, voters] = await Promise.all([
                contract.roomAdmin(),
                contract.superAdmin(),
                contract.getVoters(),
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

    const handleDeactivateAndRemove = async (roomAddress) => {
        if (!window.confirm('Deactivate and remove this room?')) return;
        try {
            const provider = new BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const roomContract = new Contract(roomAddress, VotingRoomAbi, signer);
            const isActive = await roomContract.isActive();
            if (isActive) {
                const tx = await roomContract.deactivateRoom();
                await tx.wait();
            }
            alert('Room deactivated and removed successfully!');
            await fetchRoomsFast();
        } catch (err) {
            console.error('Failed to deactivate room:', err);
            alert('Failed to deactivate room.');
        }
    };

    const filteredRooms = rooms.filter(room =>
        room.isActive &&
        (room.roomName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            room.address.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const totalPages = Math.ceil(filteredRooms.length / ROOMS_PER_PAGE);
    const paginatedRooms = filteredRooms.slice(
        (currentPage - 1) * ROOMS_PER_PAGE,
        currentPage * ROOMS_PER_PAGE
    );

    const handlePrev = () => {
        if (currentPage > 1) setCurrentPage(currentPage - 1);
    };

    const handleNext = () => {
        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
    };

    if (loading) return <div style={{ padding: '2rem' }}>Loading your rooms...</div>;

    return (
        <div style={{ padding: '2rem' }}>
            <h2>My Voting Rooms</h2>

            <div style={{ marginBottom: '1rem' }}>
                <input
                    type="text"
                    placeholder="Search by Room Name or Address"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ padding: '0.5rem', width: '300px' }}
                />
            </div>

            {paginatedRooms.length === 0 ? (
                <p>No active rooms found.</p>
            ) : (
                paginatedRooms.map((room, index) => (
                    <div key={index} style={{ border: '1px solid #aaa', padding: '1rem', marginBottom: '1rem' }}>
                        <strong>Room Name:</strong> {room.roomName} <br />
                        <strong>Room Address:</strong> {room.address} <br />
                        <strong>Description:</strong> {room.description || 'Loading...'} <br />
                        <strong>Voters:</strong> {room.votersCount !== null ? room.votersCount : '...'} <br />
                        <strong>Candidates:</strong> {room.candidatesCount !== null ? room.candidatesCount : '...'} <br />

                        <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                            <button onClick={() => handleSeeDetails(room.address)}>See Details</button>
                            <button onClick={() => handleJoinRoom(room.address)}>Join Room</button>
                            <button
                                onClick={() => handleDeactivateAndRemove(room.address)}
                                style={{ backgroundColor: 'red', color: 'white' }}
                            >
                                Deactivate and Remove
                            </button>
                        </div>
                    </div>
                ))
            )}

            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1rem' }}>
                <button onClick={handlePrev} disabled={currentPage === 1}>Prev</button>
                <span>Page {currentPage} of {totalPages}</span>
                <button onClick={handleNext} disabled={currentPage === totalPages}>Next</button>
            </div>
        </div>
    );
}
