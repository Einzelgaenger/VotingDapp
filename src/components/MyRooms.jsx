import { useEffect, useState } from 'react';
import { BrowserProvider, Contract } from 'ethers';
import { useWallet } from '../contexts/WalletContext';
import RoomFactoryAbi from '../abis/RoomFactory.json';
import VotingRoomAbi from '../abis/VotingRoom.json';
import {
    ClipboardList, RefreshCw, BadgeCheck, UserCheck,
    Copy, ClipboardCheck, Hourglass, CheckCircle, PauseCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ROOM_FACTORY_ADDRESS = "0x5933899C50ab5DB1bCd94B5a8e60aD34f26e06f3";
const ROOMS_PER_PAGE = 10;

export default function MyRooms({ setPage, setActiveRoomAddress }) {
    const { account } = useWallet();
    const [rooms, setRooms] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [tab, setTab] = useState('created');
    const [currentPage, setCurrentPage] = useState(1);
    const [expandedIndices, setExpandedIndices] = useState([]);
    const [copied, setCopied] = useState('');
    const [roomDetails, setRoomDetails] = useState({});
    const [detailLoading, setDetailLoading] = useState({});
    const [loading, setLoading] = useState(false);
    const [localTime, setLocalTime] = useState('');

    useEffect(() => {
        const updateTime = () => {
            setLocalTime(new Date().toLocaleTimeString('en-US', {
                hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Jakarta'
            }));
        };
        updateTime();
        const interval = setInterval(updateTime, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (account) fetchRooms();
    }, [account]);

    const fetchRooms = async () => {
        setLoading(true);
        try {
            const provider = new BrowserProvider(window.ethereum);
            const factory = new Contract(ROOM_FACTORY_ADDRESS, RoomFactoryAbi, provider);
            const allRooms = await factory.getRooms();

            const detailedRooms = await Promise.all(allRooms.map(async (room) => {
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
                        isVoter
                    };
                } catch {
                    return null;
                }
            }));

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
                contract.getVoters()
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
        } catch {
            alert("Failed to deactivate.");
        }
    };

    const loadRoomDetail = async (address) => {
        if (roomDetails[address]) return;
        setDetailLoading(prev => ({ ...prev, [address]: true }));
        try {
            const provider = new BrowserProvider(window.ethereum);
            const contract = new Contract(address, VotingRoomAbi, provider);
            const [roomAdmin, superAdmin, maxVoters, factory, description] = await Promise.all([
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
                    description
                }
            }));
        } catch (err) {
            console.error("Failed to load room detail:", err);
        } finally {
            setDetailLoading(prev => ({ ...prev, [address]: false }));
        }
    };

    const copy = async (text) => {
        await navigator.clipboard.writeText(text);
        setCopied(text);
        setTimeout(() => setCopied(''), 2000);
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
        <div className="min-h-[calc(100vh-80px)] pt-5 pb-12 px-4 flex justify-center relative">
            <div className="section-container max-w-7xl w-full">
                {/* Header */}
                <div className="text-center mb-8">
                    <h2 className="text-3xl md:text-4xl font-exo font-semibold tracking-wide flex justify-center items-center gap-2">
                        <ClipboardList className="w-7 h-7 icon" />
                        My Rooms
                    </h2>
                </div>

                {/* Tabs + Search + Refresh */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                    <div className="flex gap-3 justify-center md:justify-start">
                        <button
                            onClick={() => setTab('created')}
                            className={tab === 'created' ? 'btn-primary' : 'btn-gray'}
                        >
                            Created
                        </button>
                        <button
                            onClick={() => setTab('joined')}
                            className={tab === 'joined' ? 'btn-primary' : 'btn-gray'}
                        >
                            Joined
                        </button>
                    </div>


                    <div className="flex gap-3 justify-center md:justify-end">
                        <input type="text" className="input w-full md:w-64" placeholder="Search room..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                        <button onClick={fetchRooms} className="btn-primary" disabled={loading}>
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* Cards */}
                <div className="card-list">
                    <h2 className="font-semibold mb-2 flex items-center gap-2 metadata">
                        <ClipboardList className="w-5 h-5" />
                        Rooms ({filtered.length})
                    </h2>
                    {loading ? (
                        <p className="text-center text-muted">Loading...</p>
                    ) : paginated.length === 0 ? (
                        <p className="text-center text-muted">No rooms found.</p>
                    ) : (
                        paginated.map((r, i) => {
                            const isExpanded = expandedIndices.includes(i);
                            return (
                                <div key={i} className="card">
                                    <div className="cursor-pointer" onClick={() => {
                                        const now = expandedIndices.includes(i);
                                        setExpandedIndices(prev => now ? prev.filter(x => x !== i) : [...prev, i]);
                                        if (!now) loadRoomDetail(r.address);
                                    }}>
                                        <div className="flex justify-between items-start md:items-center gap-4">
                                            <div>
                                                <h3 className="font-semibold text-lg">{r.roomName}</h3>

                                                <div className="status-text flex items-center gap-1 mt-1">
                                                    {r.votingStarted ? (
                                                        r.votingEnded ? (
                                                            <>
                                                                <CheckCircle className="w-4 h-4 text-purple-500" />
                                                                <span>Voting Ended</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Hourglass className="w-4 h-4 text-blue-500 animate-pulse" />
                                                                <span>Voting Open</span>
                                                            </>
                                                        )
                                                    ) : (
                                                        <>
                                                            <PauseCircle className="w-4 h-4 text-gray-400" />
                                                            <span>Not Started</span>
                                                        </>
                                                    )}
                                                </div>

                                                <div className="mt-2 text-xs flex flex-wrap gap-2">
                                                    {r.isCreator && (
                                                        <span className="role-badge badge-creator">
                                                            <BadgeCheck className="w-4 h-4" />
                                                            You are the creator
                                                        </span>
                                                    )}
                                                    {r.isVoter && !r.isCreator && (
                                                        <span className="role-badge badge-voter">
                                                            <UserCheck className="w-4 h-4" />
                                                            You are a voter
                                                        </span>
                                                    )}
                                                </div>

                                            </div>

                                            <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                                                <button onClick={() => handleJoinRoom(r.address)} className="btn-primary">Join</button>
                                                {r.isCreator && (
                                                    <button onClick={() => handleDeactivate(r.address)} className="btn-danger">Deactivate</button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-3 space-y-1 text-sm text-muted">
                                                <div className="flex items-center gap-2 font-mono text-xs">
                                                    {r.address}
                                                    <button onClick={e => { e.stopPropagation(); copy(r.address); }} className="hover:text-cyberblue">
                                                        {copied === r.address ? <ClipboardCheck className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                                {detailLoading[r.address] ? (
                                                    <p className="text-sm opacity-60">Loading details...</p>
                                                ) : (
                                                    <>
                                                        {roomDetails[r.address]?.description && <p><strong>Description:</strong> {roomDetails[r.address]?.description}</p>}
                                                        <p><strong>Room Admin:</strong> {roomDetails[r.address]?.roomAdmin || '-'}</p>
                                                        <p><strong>Super Admin:</strong> {roomDetails[r.address]?.superAdmin || '-'}</p>
                                                        {/* <p><strong>Factory:</strong> {roomDetails[r.address]?.factory || '-'}</p> */}
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
                        })
                    )}
                </div>

                {/* Pagination */}
                <div className="flex justify-center gap-4 mt-8">
                    <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className="btn-gray">Prev</button>
                    <span className="text-sm font-medium">{currentPage} / {total}</span>
                    <button onClick={() => setCurrentPage(p => Math.min(p + 1, total))} disabled={currentPage === total} className="btn-gray">Next</button>
                </div>
            </div>

            <div className="metadata absolute bottom-4 right-6">
                SYSTEM · EN · {localTime}
            </div>
        </div>
    );
}
