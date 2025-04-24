import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../contexts/WalletContext';
import RoomFactoryAbi from '../abis/RoomFactory.json';

// Minimal ABI VotingRoom untuk get info voters/candidates
const VotingRoomAbi = [
    {
        "inputs": [],
        "name": "getVoters",
        "outputs": [{ "internalType": "address[]", "name": "", "type": "address[]" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getCandidates",
        "outputs": [
            {
                "components": [
                    { "internalType": "uint256", "name": "id", "type": "uint256" },
                    { "internalType": "string", "name": "name", "type": "string" },
                    { "internalType": "uint256", "name": "voteCount", "type": "uint256" }
                ],
                "internalType": "struct VotingRoom.Candidate[]",
                "name": "",
                "type": "tuple[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
];

const ROOM_FACTORY_ADDRESS = "0x953dEb668181ab8a619611CB6401E022CeC4659f";

export default function MyRooms({ setPage, setActiveRoomAddress }) {
    const { account } = useWallet();
    const [myRooms, setMyRooms] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (account) {
            fetchMyRooms();
        }
    }, [account]);

    const fetchMyRooms = async () => {
        try {
            setLoading(true);
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const factoryContract = new ethers.Contract(ROOM_FACTORY_ADDRESS, RoomFactoryAbi, provider);

            const rooms = await factoryContract.getRooms();
            const myCreatedRooms = rooms.filter(room => room.createdBy.toLowerCase() === account.toLowerCase());

            const detailedRooms = await Promise.all(myCreatedRooms.map(async (room) => {
                const votingRoom = new ethers.Contract(room.roomAddress, VotingRoomAbi, provider);
                const voters = await votingRoom.getVoters();
                const candidates = await votingRoom.getCandidates();
                return {
                    ...room,
                    votersCount: voters.length,
                    candidatesCount: candidates.length
                };
            }));

            setMyRooms(detailedRooms.reverse()); // 🔥 Reverse di sini! Newest first!
        } catch (error) {
            console.error("Error fetching my rooms:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenRoom = (address) => {
        setActiveRoomAddress(address);
        setPage('roomdetail');
    };

    return (
        <div style={{ padding: '2rem' }}>
            <h2>My Voting Rooms</h2>

            {loading ? (
                <p>Loading your rooms...</p>
            ) : myRooms.length === 0 ? (
                <p>No rooms created yet.</p>
            ) : (
                <ul style={{ listStyle: 'none', padding: 0 }}>
                    {myRooms.map((room, index) => (
                        <li key={index} style={{ border: '1px solid gray', padding: '1rem', marginBottom: '1rem', borderRadius: '8px' }}>
                            <div><strong>Room Name:</strong> {room.roomName}</div>
                            <div><strong>Room Address:</strong> {room.roomAddress}</div>
                            <div><strong>Voters:</strong> {room.votersCount}</div>
                            <div><strong>Candidates:</strong> {room.candidatesCount}</div>

                            <div style={{ marginTop: '1rem' }}>
                                <button onClick={() => handleOpenRoom(room.roomAddress)}>Open Room</button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
