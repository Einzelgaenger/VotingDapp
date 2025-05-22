/* Updated MyRooms.jsx with full styling, animations, and optimized lazy loading of room details */

import { useEffect, useState } from 'react';
import { BrowserProvider, Contract } from 'ethers';
import { useWallet } from '../contexts/WalletContext';
import RoomFactoryAbi from '../abis/RoomFactory.json';
import VotingRoomAbi from '../abis/VotingRoom.json';
import { ClipboardList, RefreshCw, BadgeCheck, UserCheck, Copy, ClipboardCheck, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Hourglass, CheckCircle, PauseCircle } from 'lucide-react';


const ROOM_FACTORY_ADDRESS = "0x5933899C50ab5DB1bCd94B5a8e60aD34f26e06f3";
const ROOMS_PER_PAGE = 10;

export default function MyRooms({ setPage, setActiveRoomAddress }) {
    const { account } = useWallet();
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [tab, setTab] = useState('created');
    const [expandedIndices, setExpandedIndices] = useState([]);

    const [copied, setCopied] = useState('');
    const [roomDetails, setRoomDetails] = useState({});
    const [detailLoading, setDetailLoading] = useState({});


    const copy = (text) => {
        navigator.clipboard.writeText(text);
        setCopied(text);
        setTimeout(() => setCopied(''), 1500);
    };

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
                        const [voters, candidates, active, votingStarted, votingEnded] = await Promise.all([
                            contract.getVoters(),
                            contract.getCandidates(),
                            contract.isActive(),
                            contract.votingStarted(),
                            contract.votingEnded()
                        ]);

                        const isCreator = room.createdBy.toLowerCase() === account.toLowerCase();
                        const isVoter = voters.map(v => v.toLowerCase()).includes(account.toLowerCase());

                        return {
                            address: room.roomAddress,
                            roomName: room.roomName,
                            votersCount: voters.length,
                            candidatesCount: candidates.length,
                            isActive: active,
                            votingStarted,
                            votingEnded,
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

    const loadRoomDetail = async (address) => {
        if (roomDetails[address]) return;
        setDetailLoading(prev => ({ ...prev, [address]: true }));
        try {
            const provider = new BrowserProvider(window.ethereum);
            const contract = new Contract(address, VotingRoomAbi, provider);
            const [
                roomAdmin,
                superAdmin,
                maxVoters,
                factory,
                description
            ] = await Promise.all([
                contract.roomAdmin(),
                contract.superAdmin(),
                contract.maxVoters(),
                contract.factory(),
                contract.description()
            ]);

            setRoomDetails(prev => ({
                ...prev,
                [address]: {
                    roomAdmin: roomAdmin.toLowerCase(),
                    superAdmin: superAdmin.toLowerCase(),
                    maxVoters: maxVoters.toString(),
                    factory,
                    description,
                }
            }));

        } catch (err) {
            toast.error("Failed to load room details");
            console.error("Failed to load detail for", address, err);
        } finally {
            setDetailLoading(prev => ({ ...prev, [address]: false }));
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
        <div className="px-6 py-10 max-w-5xl mx-auto">
            {/* Header */}
            <div className="relative text-center mb-8 px-4 space-y-2">
                <h1 className="text-4xl font-bold tracking-tight leading-snug flex justify-center items-center gap-2 text-cyberdark dark:text-white">
                    <ClipboardList className="w-6 h-6 icon" />
                    My Rooms
                </h1>
                <div className="absolute top-0 right-0">
                    <button onClick={fetchRooms} disabled={loading} className="btn-primary">
                        <RefreshCw className={`w-5 h-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-6 justify-center">
                <button
                    onClick={() => setTab('created')}
                    className={`btn-gray ${tab === 'created' ? 'btn-tab-active-indigo' : ''}`}
                >
                    Rooms I Created
                </button>
                <button
                    onClick={() => setTab('joined')}
                    className={`btn-gray ${tab === 'joined' ? 'btn-tab-active-green' : ''}`}
                >
                    Rooms I'm In
                </button>
            </div>

            {/* Search Input */}
            <input
                type="text"
                placeholder="Search room name..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="input mb-6"
            />

            {loading ? <p>Loading...</p> : paginated.length === 0 ? <p className="text-center text-gray-500">No rooms found.</p> : paginated.map((r, i) => {
                const isExpanded = expandedIndices.includes(i);

                return (
                    <div key={i} className="card mb-4 p-5 transition-all hover:shadow-lg">

                        <div
                            className="cursor-pointer px-5 py-4  transition"
                            onClick={() => {
                                const isNowExpanded = expandedIndices.includes(i);
                                setExpandedIndices(prev =>
                                    isNowExpanded ? prev.filter(idx => idx !== i) : [...prev, i]
                                );
                                if (!isNowExpanded) loadRoomDetail(r.address);
                            }}

                        >
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 sm:items-center">
                                {/* KIRI: Nama + status voting + badge */}
                                <div className="flex flex-col gap-1 sm:gap-2">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h3 className="font-semibold text-lg text-gray-800">{r.roomName}</h3>
                                        <div className="flex items-center gap-1 text-xs text-gray-600">
                                            {r.votingStarted ? (
                                                r.votingEnded ? (
                                                    <>
                                                        <CheckCircle className="w-4 h-4 text-purple-600" />
                                                        <span>Voting Ended</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Hourglass className="w-4 h-4 text-blue-600 animate-pulse" />
                                                        <span>Voting Open</span>
                                                    </>
                                                )
                                            ) : (
                                                <>
                                                    <PauseCircle className="w-4 h-4 text-gray-500" />
                                                    <span>Not Started</span>
                                                </>
                                            )}
                                        </div>

                                    </div>

                                    <div className="text-xs font-medium flex gap-2 flex-wrap">
                                        {r.isCreator && (
                                            <span className="role-badge inline-flex items-center gap-1 px-2 py-1 rounded text-xs">

                                                <BadgeCheck className="w-4 h-4" /> You are the creator
                                            </span>
                                        )}
                                        {r.isVoter && !r.isCreator && (
                                            <span className="role-badge inline-flex items-center gap-1 px-2 py-1 rounded text-xs">

                                                <UserCheck className="w-4 h-4" /> You are a voter
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* KANAN: Tombol Aksi */}
                                <div
                                    className="flex justify-end gap-2 flex-wrap sm:flex-nowrap"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <button
                                        onClick={() => handleJoinRoom(r.address)}
                                        className="btn-primary !w-auto !px-4 !py-2 text-sm"

                                    >
                                        Join Room
                                    </button>
                                    {r.isCreator && (
                                        <button
                                            onClick={() => handleDeactivate(r.address)}
                                            className="btn-danger !w-auto !px-4 !py-2 text-sm"

                                        >
                                            Deactivate & Remove
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>


                        <AnimatePresence initial={false}>
                            {isExpanded && (
                                <motion.div key="expand" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: "easeInOut" }} className="overflow-hidden px-5 pb-4 space-y-2 text-sm text-gray-700">
                                    <div className="flex items-center gap-2 font-mono text-xs text-gray-600">
                                        {r.address}
                                        <button onClick={(e) => { e.stopPropagation(); copy(r.address); }} className="hover:text-indigo-600" title="Copy Address">
                                            {copied === r.address ? <ClipboardCheck className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    {detailLoading[r.address] ? (
                                        <p className="text-sm text-gray-500">Loading details...</p>
                                    ) : (
                                        <>
                                            {roomDetails[r.address]?.description && (
                                                <p><strong>Description:</strong> {roomDetails[r.address]?.description}</p>
                                            )}

                                            <p><strong>Room Admin:</strong> {roomDetails[r.address]?.roomAdmin || '-'}</p>
                                            <p><strong>Super Admin:</strong> {roomDetails[r.address]?.superAdmin || '-'}</p>
                                            <p><strong>Factory:</strong> {roomDetails[r.address]?.factory || '-'}</p>
                                            {/* <p className="flex items-center gap-2">
                                                <strong>Status Room:</strong>
                                                <span className={`text-xs font-semibold px-2 py-1 rounded ${r.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {r.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </p> */}
                                            <p><strong>Status Room:</strong> {r.isActive ? 'Active' : 'Inactive'}</p>


                                            <p className="flex items-center gap-2">
                                                <strong>Voting Status:</strong>
                                                <div className="flex items-center gap-1 text-xs text-gray-600">
                                                    {r.votingStarted ? (
                                                        r.votingEnded ? (
                                                            <>
                                                                <CheckCircle className="w-4 h-4 text-purple-600" />
                                                                <span>Voting Ended</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Hourglass className="w-4 h-4 text-blue-600 animate-pulse" />
                                                                <span>Voting Open</span>
                                                            </>
                                                        )
                                                    ) : (
                                                        <>
                                                            <PauseCircle className="w-4 h-4 text-gray-500" />
                                                            <span>Not Started</span>
                                                        </>
                                                    )}
                                                </div>

                                            </p>

                                            <p><strong>Max Voters:</strong> {roomDetails[r.address]?.maxVoters || '-'}</p>
                                            <p><strong>Current Voters:</strong> {r.votersCount}</p>
                                            <p><strong>Number of Candidates:</strong> {r.candidatesCount}</p>
                                        </>
                                    )}

                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                );
            })}

            {/* Pagination here */}
            <div className="flex justify-center items-center gap-4 mt-10">
                <button
                    onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="btn-gray"
                >
                    Prev
                </button>
                <span className="text-sm text-cyberdark dark:text-white font-medium">
                    Page {currentPage} of {total}
                </span>
                <button
                    onClick={() => currentPage < total && setCurrentPage(currentPage + 1)}
                    disabled={currentPage === total}
                    className="btn-gray"
                >
                    Next
                </button>
            </div>
        </div>
    );
}
