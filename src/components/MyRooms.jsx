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
            <div className="relative text-center mb-8 px-4 space-y-2">
                <h1 className="text-4xl font-bold text-gray-900 tracking-tight leading-snug flex justify-center items-center gap-2">
                    <ClipboardList className="w-6 h-6 text-indigo-600" />
                    My Rooms
                </h1>
                <div className="absolute top-0 right-0">
                    <button
                        onClick={fetchRooms}
                        disabled={loading}
                        className="relative inline-flex items-center justify-center px-4 py-2 font-semibold text-white bg-gradient-to-b from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 active:to-indigo-800 border border-indigo-600 rounded-md shadow-md transition duration-300 ease-in-out disabled:opacity-50"
                    >
                        <RefreshCw className={`w-5 h-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>
            </div>


            <div className="flex gap-4 mb-6 justify-center">
                <button
                    onClick={() => setTab('created')}
                    className={`relative inline-flex items-center justify-center px-5 py-2 font-semibold rounded-md border shadow-md transition duration-300 ease-in-out
      ${tab === 'created'
                            ? 'text-white bg-gradient-to-b from-indigo-500 to-indigo-600 border-indigo-600 hover:from-indigo-600 hover:to-indigo-700 active:to-indigo-800'
                            : 'text-gray-800 bg-gradient-to-b from-gray-100 to-gray-200 border-gray-300 hover:from-gray-200 hover:to-gray-300 active:to-gray-400'}`}
                >
                    Rooms I Created
                </button>
                <button
                    onClick={() => setTab('joined')}
                    className={`relative inline-flex items-center justify-center px-5 py-2 font-semibold rounded-md border shadow-md transition duration-300 ease-in-out
      ${tab === 'joined'
                            ? 'text-white bg-gradient-to-b from-green-500 to-green-600 border-green-600 hover:from-green-600 hover:to-green-700 active:to-green-800'
                            : 'text-gray-800 bg-gradient-to-b from-gray-100 to-gray-200 border-gray-300 hover:from-gray-200 hover:to-gray-300 active:to-gray-400'}`}
                >
                    Rooms I'm In
                </button>
            </div>


            <input
                type="text"
                placeholder="Search room name..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 transition mb-6"
            />


            {loading ? (
                <p>Loading...</p>
            ) : paginated.length === 0 ? (
                <p className="text-center text-gray-500">No rooms found.</p>
            ) : (
                paginated.map((r, i) => (
                    <div
                        key={i}
                        className="border border-gray-300 rounded-lg p-5 mb-5 shadow-md bg-white transition hover:shadow-lg"
                    >

                        <p><strong>Room Name:</strong> {r.roomName}</p>
                        <p><strong>Room Address:</strong> {r.address}</p>
                        <p><strong>Description:</strong> {r.description}</p>
                        <p><strong>Voters:</strong> {r.votersCount}</p>
                        <p><strong>Candidates:</strong> {r.candidatesCount}</p>
                        <div className="text-xs font-medium mt-3 flex gap-2 flex-wrap">
                            {r.isCreator && (
                                <span className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-700 px-2 py-1 rounded">
                                    <BadgeCheck className="w-4 h-4" /> You are the creator
                                </span>
                            )}
                            {r.isVoter && !r.isCreator && (
                                <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded">
                                    <UserCheck className="w-4 h-4" /> You are a voter
                                </span>
                            )}
                        </div>


                        <div className="mt-4 flex gap-2 flex-wrap">
                            <button
                                onClick={() => {
                                    setActiveRoomAddress(r.address);
                                    setPage('roomdetail');
                                }}
                                className="relative inline-flex items-center justify-center px-4 py-2 font-semibold text-gray-800 bg-gradient-to-b from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 active:to-gray-400 border border-gray-300 rounded-md shadow-md text-sm"
                            >
                                See Details
                            </button>
                            <button
                                onClick={() => handleJoinRoom(r.address)}
                                className="relative inline-flex items-center justify-center px-4 py-2 font-semibold text-white bg-gradient-to-b from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 active:to-indigo-800 border border-indigo-600 rounded-md shadow-md text-sm"
                            >
                                Join Room
                            </button>
                            {r.isCreator && (
                                <button
                                    onClick={() => handleDeactivate(r.address)}
                                    className="relative inline-flex items-center justify-center px-4 py-2 font-semibold text-white bg-gradient-to-b from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 active:to-red-800 border border-red-600 rounded-md shadow-md text-sm"
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
