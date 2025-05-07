// RoomInteract.jsx – Fix null error + better header & refresh UX
import { useEffect, useState } from 'react';
import { BrowserProvider, Contract } from 'ethers';
import { useWallet } from '../contexts/WalletContext';
import VotingRoomAbi from '../abis/VotingRoom.json';
import {
    UserCheck, Plus, Trash2, ClipboardCheck, Copy, ArrowLeft, Users, CircleCheck,
    User, RefreshCw, X, PlayIcon, ShieldCheck, ChevronDown, ChevronUp
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const BAR_COLORS = ['#6366F1', '#10B981', '#EC4899', '#F59E0B', '#F97316'];

export default function RoomInteract({ activeRoomAddress, setPage, setReturnPage }) {
    const { account } = useWallet();
    const [roomInfo, setRoomInfo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [copied, setCopied] = useState('');
    const [candidateSearch, setCandidateSearch] = useState('');
    const [voterSearch, setVoterSearch] = useState('');
    const [newCandidate, setNewCandidate] = useState('');
    const [newAdminAddress, setNewAdminAddress] = useState('');
    const [newVoterAddr, setNewVoterAddr] = useState('');
    const [newVoterName, setNewVoterName] = useState('');
    const [adminExpanded, setAdminExpanded] = useState(true);
    const [voterExpanded, setVoterExpanded] = useState(true);

    useEffect(() => {
        if (activeRoomAddress) fetchRoom();
    }, [activeRoomAddress]);

    useEffect(() => {
        if (!activeRoomAddress) return;

        let contract;
        let interval;

        const setupListener = async () => {
            try {
                const provider = new BrowserProvider(window.ethereum);
                contract = new Contract(activeRoomAddress, VotingRoomAbi, provider);

                // Listener untuk refresh otomatis saat event terjadi
                const refresh = () => fetchRoom();

                contract.on("VoteCast", refresh);
                contract.on("VoteStarted", refresh);
                contract.on("VoteEnded", refresh);
                contract.on("RoomReset", refresh);
                contract.on("CandidateAdded", refresh);
                contract.on("CandidateRemoved", refresh);
                contract.on("VoterAdded", refresh);
                contract.on("VoterRemoved", refresh);

                // Polling fallback setiap 5 detik
                interval = setInterval(() => fetchRoom(), 5000);
            } catch (e) {
                console.error("[Listener Error]", e);
            }
        };

        setupListener();

        return () => {
            if (contract) {
                contract.removeAllListeners("VoteCast");
                contract.removeAllListeners("VoteStarted");
                contract.removeAllListeners("VoteEnded");
                contract.removeAllListeners("RoomReset");
                contract.removeAllListeners("CandidateAdded");
                contract.removeAllListeners("CandidateRemoved");
                contract.removeAllListeners("VoterAdded");
                contract.removeAllListeners("VoterRemoved");
            }
            if (interval) clearInterval(interval);
        };
    }, [activeRoomAddress]);


    const fetchRoom = async () => {
        try {
            setLoading(true);
            const provider = new BrowserProvider(window.ethereum);
            const contract = new Contract(activeRoomAddress, VotingRoomAbi, provider);
            const [
                roomName, description, roomAdmin, superAdmin, isActive, votingStarted, votingEnded, maxVoters,
                candidatesRaw, voterAddresses, voterNames
            ] = await Promise.all([
                contract.roomName(),
                contract.description(),
                contract.roomAdmin(),
                contract.superAdmin(),
                contract.isActive(),
                contract.votingStarted(),
                contract.votingEnded(),
                contract.maxVoters(),
                contract.getCandidates(),
                contract.getVoterDetails().then(r => r[0]),
                contract.getVoterDetails().then(r => r[1])
            ]);
            const voters = await Promise.all(
                voterAddresses.map(async (addr, i) => {
                    const data = await contract.voters(addr);
                    return { address: addr.toLowerCase(), name: voterNames[i], hasVoted: data.hasVoted };
                })
            );
            const candidates = candidatesRaw.map(c => ({
                id: c.id, name: c.name, voteCount: Number(c.voteCount)
            }));
            setRoomInfo({
                roomName,
                description,
                roomAdmin: roomAdmin.toLowerCase(),
                superAdmin: superAdmin.toLowerCase(),
                isActive,
                votingStarted,
                votingEnded,
                maxVoters: maxVoters.toString(),
                candidates,
                voters
            });
        } catch {
            toast.error('Failed to load room data');
        } finally {
            setLoading(false);
        }
    };

    const isAdmin = () => account?.toLowerCase() === roomInfo?.roomAdmin || account?.toLowerCase() === roomInfo?.superAdmin;
    const isVoter = () => roomInfo?.voters?.some(v => v.address === account?.toLowerCase());
    const hasVoted = () => roomInfo?.voters?.find(v => v.address === account?.toLowerCase())?.hasVoted;
    const votedCount = roomInfo?.voters?.filter(v => v.hasVoted).length || 0;
    const totalVotes = roomInfo?.candidates.reduce((sum, c) => sum + c.voteCount, 0) || 1;

    const handleTx = async (method, ...args) => {
        try {
            setActionLoading(true);
            const provider = new BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new Contract(activeRoomAddress, VotingRoomAbi, signer);
            const tx = await contract[method](...args);
            await tx.wait();
            fetchRoom();
            toast.success(`${method} success`);
        } catch {
            toast.error(`Failed to ${method}`);
        } finally {
            setActionLoading(false);
        }
    };

    const copy = (text) => {
        navigator.clipboard.writeText(text);
        setCopied(text);
        setTimeout(() => setCopied(''), 1500);
    };

    const filteredCandidates = roomInfo?.candidates?.filter(c =>
        c.name.toLowerCase().includes(candidateSearch.toLowerCase())) || [];
    const filteredVoters = roomInfo?.voters?.filter(v =>
        v.name.toLowerCase().includes(voterSearch.toLowerCase()) ||
        v.address.toLowerCase().includes(voterSearch.toLowerCase())) || [];

    return (
        <div className="px-6 py-10 max-w-5xl mx-auto">
            <Toaster />

            {/* Header */}
            <div className="relative text-center mb-6">
                <h1 className="text-3xl font-bold">{roomInfo?.roomName || '...'}</h1>
                <p className="text-sm text-gray-600">{roomInfo?.description}</p>
                <div className="flex justify-center items-center gap-2 mt-1 text-xs text-gray-500">
                    <span className="font-mono">{activeRoomAddress}</span>
                    <button onClick={() => copy(activeRoomAddress)}>
                        {copied === activeRoomAddress
                            ? <ClipboardCheck className="w-4 h-4 text-green-500" />
                            : <Copy className="w-4 h-4" />}
                    </button>
                </div>
                <div className="absolute top-0 right-0">
                    <button
                        onClick={fetchRoom}
                        disabled={loading}
                        className="flex items-center gap-2 bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600 disabled:opacity-50"
                    >
                        {loading ? <RefreshCw className="animate-spin h-5 w-5" /> : <>
                            <RefreshCw className="h-5 w-5" /> Refresh
                        </>}
                    </button>
                </div>
            </div>

            {/* Wait until roomInfo exists */}
            {!roomInfo ? (
                <div className="text-center text-sm text-gray-500">Loading room data...</div>
            ) : (
                <>
                    {/* Voted Notification */}
                    {hasVoted() && (
                        <div className="bg-green-100 border border-green-300 text-green-700 p-3 rounded mb-6 flex items-center justify-center gap-2">
                            <CircleCheck className="w-5 h-5" />
                            You have voted!
                        </div>
                    )}

                    {/* Cast Vote Section */}
                    {roomInfo.votingStarted && !roomInfo.votingEnded && isVoter() && !hasVoted() && (
                        <div className="bg-white p-4 rounded shadow mb-6">
                            <h2 className="text-lg font-semibold mb-2">Cast Your Vote</h2>
                            <div className="flex flex-wrap justify-center gap-3">
                                {filteredCandidates.map((c, i) => (
                                    <button
                                        key={c.id}
                                        onClick={() => handleTx("vote", c.id)}
                                        className="px-4 py-2 rounded text-white font-semibold"
                                        style={{ backgroundColor: BAR_COLORS[i % BAR_COLORS.length] }}
                                    >
                                        Vote for {c.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Voting Chart */}
                    <div className="bg-white p-4 rounded shadow mb-6">
                        <h2 className="text-lg font-semibold mb-2">Voting Chart</h2>
                        <div className="flex flex-wrap justify-center gap-4">
                            {filteredCandidates.map((c, i) => {
                                const percent = (c.voteCount / totalVotes) * 100;
                                return (
                                    <div key={c.id} className="text-center w-24">
                                        <p className="text-sm font-medium mb-1">{percent.toFixed(1)}%</p>
                                        <div className="h-24 bg-gray-100 rounded overflow-hidden relative">
                                            {percent > 0 && (
                                                <div
                                                    className="absolute bottom-0 w-full"
                                                    style={{ height: `${percent}%`, backgroundColor: BAR_COLORS[i % BAR_COLORS.length] }}
                                                />
                                            )}
                                        </div>
                                        <p className="mt-1 font-semibold text-sm">{c.name}</p>
                                        <p className="text-xs text-gray-500">{c.voteCount} vote(s)</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Admin Panel */}
                    {isAdmin() && (
                        <div className="bg-white p-5 rounded-lg shadow mb-6">
                            <div
                                className="flex justify-between items-center cursor-pointer"
                                onClick={() => setAdminExpanded(!adminExpanded)}
                            >
                                <h3 className="font-semibold text-lg flex items-center gap-2">
                                    <ShieldCheck className="text-indigo-600" />
                                    Admin Panel
                                </h3>
                                {adminExpanded ? (
                                    <ChevronUp className="w-5 h-5" />
                                ) : (
                                    <ChevronDown className="w-5 h-5" />
                                )}
                            </div>
                            {adminExpanded && (
                                <div className="mt-4 space-y-6">
                                    {/* Add Candidate */}
                                    <div className="flex flex-wrap gap-2">
                                        <input
                                            value={newCandidate}
                                            onChange={(e) => setNewCandidate(e.target.value)}
                                            placeholder="New Candidate"
                                            className="border px-3 py-2 rounded w-full sm:w-auto"
                                        />
                                        <button
                                            onClick={() => handleTx("addCandidate", newCandidate)}
                                            className="bg-green-500 text-white px-4 py-2 rounded flex items-center gap-1"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Add
                                        </button>
                                    </div>

                                    {/* Search + List Candidates */}
                                    <div className="space-y-2">
                                        <input
                                            type="text"
                                            placeholder="Search candidates..."
                                            value={candidateSearch}
                                            onChange={(e) => setCandidateSearch(e.target.value)}
                                            className="w-full px-3 py-2 border rounded"
                                        />
                                        {filteredCandidates.map((c, i) => (
                                            <div
                                                key={c.id}
                                                className="flex items-center justify-between px-4 py-2 rounded border"
                                                style={{
                                                    backgroundColor: `${BAR_COLORS[i % BAR_COLORS.length]}20`,
                                                    borderColor: `${BAR_COLORS[i % BAR_COLORS.length]}40`,
                                                }}
                                            >
                                                <div>
                                                    <p className="font-medium text-sm">{c.name}</p>
                                                    <p className="text-xs text-gray-600">{c.voteCount} votes</p>
                                                </div>
                                                <button
                                                    onClick={() => handleTx("removeCandidate", c.id)}
                                                    className="text-red-600 hover:text-red-800"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            onClick={() => handleTx("clearCandidates")}
                                            className="bg-yellow-500 text-white px-4 py-2 rounded text-sm flex items-center gap-1"
                                        >
                                            <Trash2 className="w-4 h-4" /> Clear Candidates
                                        </button>
                                        <button
                                            onClick={() => handleTx("clearVotes")}
                                            className="bg-orange-500 text-white px-4 py-2 rounded text-sm flex items-center gap-1"
                                        >
                                            <Trash2 className="w-4 h-4" /> Clear Votes
                                        </button>
                                        {!roomInfo.votingStarted && (
                                            <button
                                                onClick={() => handleTx("startVote")}
                                                className="bg-indigo-500 text-white px-4 py-2 rounded text-sm flex items-center gap-1"
                                            >
                                                <PlayIcon className="w-4 h-4" /> Start
                                            </button>
                                        )}
                                        {roomInfo.votingStarted && !roomInfo.votingEnded && (
                                            <button
                                                onClick={() => handleTx("endVote")}
                                                className="bg-indigo-500 text-white px-4 py-2 rounded text-sm flex items-center gap-1"
                                            >
                                                <X className="w-4 h-4" /> End
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleTx("resetRoom")}
                                            className="bg-gray-200 px-4 py-2 rounded text-sm flex items-center gap-1"
                                        >
                                            <RefreshCw className="w-4 h-4" /> Reset
                                        </button>
                                        <button
                                            onClick={() => handleTx("deactivateRoom")}
                                            className="bg-red-600 text-white px-4 py-2 rounded text-sm flex items-center gap-1"
                                        >
                                            <Trash2 className="w-4 h-4" /> Deactivate
                                        </button>
                                    </div>

                                    {/* Transfer Admin */}
                                    <div className="flex flex-col gap-2">
                                        <input
                                            type="text"
                                            value={newAdminAddress}
                                            onChange={(e) => setNewAdminAddress(e.target.value)}
                                            placeholder="New Admin Address"
                                            className="border px-3 py-2 rounded w-full"
                                        />
                                        <button
                                            onClick={() => handleTx("transferRoomAdmin", newAdminAddress)}
                                            className="bg-indigo-500 text-white px-4 py-2 rounded text-sm"
                                        >
                                            Transfer Admin
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}


                    {/* Voter Panel */}
                    <div className="bg-white p-5 rounded-lg shadow mb-6">
                        <div className="flex justify-between items-center cursor-pointer" onClick={() => setVoterExpanded(!voterExpanded)}>
                            <h3 className="font-semibold text-lg flex items-center gap-2">
                                <UserCheck className="text-green-700" />
                                Voters
                            </h3>
                            {voterExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </div>
                        {voterExpanded && (
                            <div className="mt-4 space-y-4">
                                {isAdmin() && (
                                    <div className="flex flex-wrap gap-2">
                                        <input value={newVoterAddr} onChange={(e) => setNewVoterAddr(e.target.value)} placeholder="Voter Address" className="border px-3 py-2 rounded w-full sm:w-auto" />
                                        <input value={newVoterName} onChange={(e) => setNewVoterName(e.target.value)} placeholder="Voter Name" className="border px-3 py-2 rounded w-full sm:w-auto" />
                                        <button onClick={() => handleTx("addVoter", newVoterAddr, newVoterName)} className="bg-green-500 text-white px-4 py-2 rounded flex items-center gap-1"><Plus className="w-4 h-4" />Add</button>
                                    </div>
                                )}
                                <p className="text-sm text-gray-600">Total: {roomInfo.voters.length} | Voted: {votedCount} | Not Yet: {roomInfo.voters.length - votedCount}</p>
                                <input type="text" value={voterSearch} onChange={e => setVoterSearch(e.target.value)} placeholder="Search voters..." className="w-full px-3 py-2 border rounded" />
                                <ul className="divide-y">
                                    <AnimatePresence>
                                        {filteredVoters.map((v, i) => (
                                            <motion.li key={v.address} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.25 }} className="flex items-center justify-between py-2">
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <User className="w-4 h-4 text-gray-500" />
                                                        <span className="font-medium">{v.name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-gray-600">
                                                        <span className="font-mono">{v.address}</span>
                                                        <button onClick={() => copyToClipboard(v.address)} className="hover:text-indigo-600">
                                                            {copied === v.address ? <ClipboardCheck className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                                        </button>
                                                        <span className={`px-2 py-0.5 rounded-full text-white text-xs font-semibold ${v.hasVoted ? 'bg-green-500' : 'bg-yellow-500'}`}>{v.hasVoted ? 'Voted' : 'Not Voted'}</span>
                                                    </div>
                                                </div>
                                                {isAdmin() && (
                                                    <button onClick={() => handleTx("removeVoter", v.address)} className="bg-red-600 text-white px-2 py-1 text-xs rounded hover:bg-red-700 flex items-center gap-1">
                                                        <User className="w-3 h-3" /> Remove
                                                    </button>
                                                )}
                                            </motion.li>
                                        ))}
                                    </AnimatePresence>
                                </ul>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Back Buttons */}
            <div className="flex gap-3 mt-8">
                <button onClick={() => setPage('myrooms')} className="bg-gray-100 px-4 py-2 rounded flex items-center gap-2">
                    <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button onClick={() => { setReturnPage('roominteract'); setPage('roommembers'); }}
                    className="bg-gray-100 px-4 py-2 rounded flex items-center gap-2">
                    <Users className="w-4 h-4" /> Room Members
                </button>
            </div>
        </div>
    );
}
