import { useEffect, useState } from 'react';
import { BrowserProvider, Contract } from 'ethers';
import { useWallet } from '../contexts/WalletContext';
import RoomFactoryAbi from '../abis/RoomFactory.json';
import VotingRoomAbi from '../abis/VotingRoom.json';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { ClipboardList } from 'lucide-react';


const ROOM_FACTORY_ADDRESS = "0x5933899C50ab5DB1bCd94B5a8e60aD34f26e06f3";
const ROOMS_PER_PAGE = 10;

export default function MyRooms({ setPage, setActiveRoomAddress }) {
    const { account } = useWallet();
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        if (account) fetchRooms();
    }, [account]);

    const fetchRooms = async () => {
        try {
            setLoading(true);
            const provider = new BrowserProvider(window.ethereum);
            const factory = new Contract(ROOM_FACTORY_ADDRESS, RoomFactoryAbi, provider);
            const allRooms = await factory.getRooms();
            const myRooms = allRooms.filter(r => r.createdBy.toLowerCase() === account.toLowerCase());

            // Ambil detail semua room secara paralel
            const roomDetails = await Promise.all(
                myRooms.map(async (room) => {
                    try {
                        const contract = new Contract(room.roomAddress, VotingRoomAbi, provider);
                        const [desc, voters, candidates, active] = await Promise.all([
                            contract.description(),
                            contract.getVoters(),
                            contract.getCandidates(),
                            contract.isActive(),
                        ]);
                        return {
                            address: room.roomAddress,
                            roomName: room.roomName,
                            description: desc,
                            votersCount: voters.length,
                            candidatesCount: candidates.length,
                            isActive: active,
                        };
                    } catch (err) {
                        console.error(`Detail fetch failed for ${room.roomAddress}:`, err);
                        return null;
                    }
                })
            );

            // Hapus room yang gagal atau tidak aktif
            const filtered = roomDetails
                .filter(r => r && r.isActive)
                .reverse()
                .map((r, i) => ({ ...r, index: i }));

            setRooms(filtered);
        } catch (err) {
            console.error('Error fetching rooms:', err);
        } finally {
            setLoading(false);
        }
    };


    const fetchRoomDetail = async (address, i) => {
        try {
            const provider = new BrowserProvider(window.ethereum);
            const contract = new Contract(address, VotingRoomAbi, provider);
            const [desc, voters, candidates, active] = await Promise.all([
                contract.description(),
                contract.getVoters(),
                contract.getCandidates(),
                contract.isActive(),
            ]);

            setRooms(prev => {
                const updated = [...prev];
                updated[i] = {
                    ...updated[i],
                    description: desc,
                    votersCount: voters.length,
                    candidatesCount: candidates.length,
                    isActive: active,
                };
                return updated;
            });
        } catch (err) {
            console.error(`Detail fetch failed for ${address}:`, err);
        }
    };

    const handleJoinRoom = async (address) => {
        try {
            const provider = new BrowserProvider(window.ethereum);
            const contract = new Contract(address, VotingRoomAbi, provider);
            const [admin, superadmin, voters] = await Promise.all([
                contract.roomAdmin(),
                contract.superAdmin(),
                contract.getVoters(),
            ]);
            const user = account.toLowerCase();
            const isAdmin = user === admin.toLowerCase() || user === superadmin.toLowerCase();
            const isVoter = voters.map(v => v.toLowerCase()).includes(user);
            if (isAdmin || isVoter) {
                setActiveRoomAddress(address);
                setPage('roominteract');
            } else alert("You're not authorized.");
        } catch (err) {
            console.error(err);
            alert("Failed to join room.");
        }
    };

    const handleDeactivate = async (address) => {
        if (!window.confirm("Deactivate and remove this room?")) return;

        try {
            const provider = new BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new Contract(address, VotingRoomAbi, signer);

            const isActive = await contract.isActive();
            if (isActive) {
                const tx = await contract.deactivateRoom();
                await tx.wait();
            }

            // Remove room from state immediately for instant UI feedback
            setRooms(prev => prev.filter(r => r.address !== address));

            // Optional: Re-fetch from blockchain to make sure it's synced
            setTimeout(() => fetchRooms(), 500); // debounce sedikit
        } catch (err) {
            console.error('Deactivate failed:', err);
            alert("Failed to deactivate room.");
        }
    };


    const filtered = rooms.filter(r =>
        r.isActive && (
            r.roomName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.address.toLowerCase().includes(searchTerm.toLowerCase())
        )
    );
    const total = Math.ceil(filtered.length / ROOMS_PER_PAGE);
    const paginated = filtered.slice((currentPage - 1) * ROOMS_PER_PAGE, currentPage * ROOMS_PER_PAGE);

    return (
        <div className="px-6 py-10 max-w-5xl mx-auto text-gray-800">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <ClipboardList className="w-6 h-6 text-indigo-600" />
                    My Voting Rooms
                </h2>

                <button
                    onClick={fetchRooms}
                    disabled={loading}
                    className="flex items-center gap-2 bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600 disabled:opacity-50"
                >
                    {loading ? (
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16 8 8 0 01-8-8z" />
                        </svg>
                    ) : (
                        <>
                            <ArrowPathIcon className="h-5 w-5" />
                            Refresh
                        </>
                    )}
                </button>
            </div>

            <input
                type="text"
                placeholder="Search Room Name or Address"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="mb-6 w-full px-4 py-2 border rounded"
            />

            {loading ? (
                <p>Loading...</p>
            ) : paginated.length === 0 ? (
                <p>No active rooms found.</p>
            ) : (
                paginated.map((r, i) => (
                    <div key={i} className="border rounded p-4 mb-4 shadow-sm">
                        <p><strong>Room Name:</strong> {r.roomName}</p>
                        <p><strong>Room Address:</strong> {r.address}</p>
                        <p><strong>Description:</strong> {r.description || 'Loading...'}</p>
                        <p><strong>Voters:</strong> {r.votersCount ?? '...'}</p>
                        <p><strong>Candidates:</strong> {r.candidatesCount ?? '...'}</p>

                        <div className="mt-4 flex gap-2 flex-wrap">
                            <button
                                onClick={() => {
                                    setActiveRoomAddress(r.address);
                                    setPage('roomdetail');
                                }}
                                className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1 rounded"
                            >
                                See Details
                            </button>
                            <button
                                onClick={() => handleJoinRoom(r.address)}
                                className="bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700"
                            >
                                Join Room
                            </button>
                            <button
                                onClick={() => handleDeactivate(r.address)}
                                className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                            >
                                Deactivate & Remove
                            </button>
                        </div>
                    </div>
                ))
            )}

            <div className="flex justify-center items-center gap-4 mt-6">
                <button
                    onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
                >
                    Prev
                </button>
                <span>Page {currentPage} of {total}</span>
                <button
                    onClick={() => currentPage < total && setCurrentPage(currentPage + 1)}
                    disabled={currentPage === total}
                    className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
                >
                    Next
                </button>
            </div>
        </div>
    );
}
