import { useEffect, useState } from 'react';
import { BrowserProvider, Contract } from 'ethers';
import { useWallet } from '../contexts/WalletContext';
import RoomFactoryAbi from '../abis/RoomFactory.json';
import VotingRoomAbi from '../abis/VotingRoom.json';
import { ClipboardList, RefreshCw, BadgeCheck, UserCheck } from 'lucide-react';

const ROOM_FACTORY_ADDRESS = "0x5933899C50ab5DB1bCd94B5a8e60aD34f26e06f3";
const ROOMS_PER_PAGE = 10;

export default function MyRooms({ setPage, setActiveRoomAddress }) {
    const { account } = useWallet();
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [tab, setTab] = useState('created'); // 'created' or 'joined'

    useEffect(() => {
        if (account) fetchRooms();
    }, [account]);

    const fetchRooms = async () => {
        try {
            setLoading(true);
            const provider = new BrowserProvider(window.ethereum);
            const factory = new Contract(ROOM_FACTORY_ADDRESS, RoomFactoryAbi, provider);
            const allRooms = await factory.getRooms();

            const detailedRooms = await Promise.all(
                allRooms.map(async (room) => {
                    try {
                        const contract = new Contract(room.roomAddress, VotingRoomAbi, provider);
                        const [desc, voters, candidates, active] = await Promise.all([
                            contract.description(),
                            contract.getVoters(),
                            contract.getCandidates(),
                            contract.isActive(),
                        ]);
                        const isCreator = room.createdBy.toLowerCase() === account.toLowerCase();
                        const isVoter = voters.map(v => v.toLowerCase()).includes(account.toLowerCase());

                        return {
                            address: room.roomAddress,
                            roomName: room.roomName,
                            description: desc,
                            votersCount: voters.length,
                            candidatesCount: candidates.length,
                            isActive: active,
                            isCreator,
                            isVoter,
                        };
                    } catch (err) {
                        console.error(`Failed to fetch details for ${room.roomAddress}:`, err);
                        return null;
                    }
                })
            );

            const validRooms = detailedRooms.filter(r => r && r.isActive).reverse();
            setRooms(validRooms);
        } catch (err) {
            console.error("Error fetching rooms:", err);
        } finally {
            setLoading(false);
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
            } else {
                alert("You're not authorized.");
            }
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
            const tx = await contract.deactivateRoom();
            await tx.wait();
            setRooms(prev => prev.filter(r => r.address !== address));
        } catch (err) {
            console.error(err);
            alert("Failed to deactivate.");
        }
    };

    const filtered = rooms.filter(r =>
        r.isActive &&
        (tab === 'created' ? r.isCreator : r.isVoter) &&
        (r.roomName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.address.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const total = Math.ceil(filtered.length / ROOMS_PER_PAGE);
    const paginated = filtered.slice((currentPage - 1) * ROOMS_PER_PAGE, currentPage * ROOMS_PER_PAGE);

    return (
        <div className="px-6 py-10 max-w-5xl mx-auto text-gray-800">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <ClipboardList className="w-6 h-6 text-indigo-600" />
                    My Rooms
                </h2>
                <button
                    onClick={fetchRooms}
                    disabled={loading}
                    className="flex items-center gap-2 bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600 disabled:opacity-50"
                >
                    {loading ? <RefreshCw className="animate-spin h-5 w-5" /> : <> <RefreshCw className="h-5 w-5" /> Refresh</>}
                </button>
            </div>

            <div className="flex gap-4 mb-6">
                <button
                    className={`px-4 py-2 rounded font-semibold ${tab === 'created' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-800'}`}
                    onClick={() => setTab('created')}
                >
                    Rooms I Created
                </button>
                <button
                    className={`px-4 py-2 rounded font-semibold ${tab === 'joined' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-800'}`}
                    onClick={() => setTab('joined')}
                >
                    Rooms I'm In
                </button>
            </div>

            <input
                type="text"
                placeholder="Search room name..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border rounded mb-6"
            />

            {loading ? (
                <p>Loading...</p>
            ) : paginated.length === 0 ? (
                <p className="text-center text-gray-500">No rooms found.</p>
            ) : (
                paginated.map((r, i) => (
                    <div key={i} className="border rounded p-4 mb-4 shadow-sm">
                        <p><strong>Room Name:</strong> {r.roomName}</p>
                        <p><strong>Room Address:</strong> {r.address}</p>
                        <p><strong>Description:</strong> {r.description}</p>
                        <p><strong>Voters:</strong> {r.votersCount}</p>
                        <p><strong>Candidates:</strong> {r.candidatesCount}</p>
                        <p className="text-xs font-medium mt-1">
                            {r.isCreator && <span className="inline-block bg-indigo-100 text-indigo-700 px-2 py-1 rounded mr-2"><BadgeCheck className="inline w-4 h-4 mr-1" />You are the creator</span>}
                            {r.isVoter && !r.isCreator && <span className="inline-block bg-green-100 text-green-700 px-2 py-1 rounded"><UserCheck className="inline w-4 h-4 mr-1" />You are a voter</span>}
                        </p>

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
                            {r.isCreator && (
                                <button
                                    onClick={() => handleDeactivate(r.address)}
                                    className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                                >
                                    Deactivate & Remove
                                </button>
                            )}
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
