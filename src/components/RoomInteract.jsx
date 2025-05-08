// RoomInteract.jsx – Fix null error + better header & refresh UX
import { useEffect, useState } from 'react';
import { BrowserProvider, Contract } from 'ethers';
import { useWallet } from '../contexts/WalletContext';
import VotingRoomAbi from '../abis/VotingRoom.json';
import {
    UserCheck, Plus, Trash2, ClipboardCheck, Copy, ArrowLeft, Users, CircleCheck,
    User, RefreshCw, X, PlayIcon, ShieldCheck, ChevronDown, ChevronUp, BadgeCheck
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@material-tailwind/react";


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
            <div className="relative text-center mb-8 px-4 space-y-2">
                {/* Room Name */}
                <h1 className="text-4xl font-bold text-gray-900 tracking-tight leading-snug">
                    {roomInfo?.roomName || 'Room Title'}
                </h1>

                {/* Room Description */}
                <p className="text-sm text-gray-500 tracking-wide">
                    {roomInfo?.description || 'Welcome to a secure and modern voting experience'}
                </p>

                {/* Room Address */}
                <div className="flex justify-center items-center gap-2 text-xs text-gray-600 mt-1">
                    <span className="font-mono bg-gray-100 text-gray-700 px-2 py-1 rounded-md border border-gray-300 shadow-sm">
                        {activeRoomAddress}
                    </span>
                    <button
                        onClick={() => copy(activeRoomAddress)}
                        className="hover:text-indigo-600 transition"
                        title="Copy Address"
                    >
                        {copied === activeRoomAddress
                            ? <ClipboardCheck className="w-4 h-4 text-green-500" />
                            : <Copy className="w-4 h-4" />}
                    </button>
                </div>

                {/* Refresh Button */}
                <div className="absolute top-0 right-0">
                    <button
                        onClick={() => fetchRoom(true)}
                        disabled={loading}
                        className="relative inline-flex items-center justify-center px-4 py-2 font-semibold text-white bg-gradient-to-b from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 active:to-indigo-800 border border-indigo-600 rounded-md shadow-md transition duration-300 ease-in-out disabled:opacity-50"
                    >
                        <RefreshCw className={`w-5 h-5 mr-2 ${loading ? "animate-spin" : ""}`} />
                        Refresh
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

                    {/* Voting Chart */}
                    <div className="bg-white p-4 rounded shadow mb-6">
                        <h2 className="text-lg font-semibold mb-2">Voting Chart</h2>
                        <div className="flex flex-wrap justify-center gap-4">
                            {filteredCandidates.map((c, i) => {
                                const percent = (c.voteCount / totalVotes) * 100 || 0;
                                const adjustedPercent = Math.max(percent, 5); // Minimal 5% agar label terlihat
                                const colorFrom = BAR_COLORS[i % BAR_COLORS.length];
                                const colorTo = `${colorFrom}cc`;
                                const canVote =
                                    roomInfo.votingStarted && !roomInfo.votingEnded && isVoter() && !hasVoted();
                                const effectiveHeight = percent > 0 ? `${percent}%` : '4px'; // chart bar minimum

                                return (
                                    <div
                                        key={c.id}
                                        className="text-center w-24 group flex flex-col items-center"
                                    >
                                        {/* Chart Container */}
                                        <div className="relative w-full h-44 pt-5  rounded overflow-visible">
                                            {/* Animated Bar */}
                                            <motion.div
                                                className="absolute bottom-0 w-full rounded-t-md"
                                                style={{
                                                    backgroundImage: `linear-gradient(to top, ${colorFrom}, ${colorTo})`,
                                                }}
                                                initial={{ height: 0 }}
                                                animate={{ height: effectiveHeight }}
                                                transition={{ duration: 0.6, type: "spring" }}
                                            />


                                            {/* Animated Percentage Label */}
                                            <motion.p
                                                className="absolute text-sm font-semibold left-1/2 -translate-x-1/2 text-black"
                                                initial={{ bottom: 0 }}
                                                animate={{ bottom: `${adjustedPercent}%` }}
                                                transition={{ duration: 0.6 }}
                                            >
                                                {percent.toFixed(1)}%
                                            </motion.p>
                                        </div>

                                        {/* Candidate Name Button */}
                                        <button
                                            disabled={!canVote}
                                            onClick={() => handleTx("vote", c.id)}
                                            className={`mt-1 text-sm font-semibold transition underline-offset-2 px-2 py-1 rounded border w-full 
              ${canVote ? '' : 'text-gray-400 cursor-not-allowed'}`}
                                            style={{
                                                backgroundColor: canVote ? colorFrom : '',
                                                color: canVote ? '#fff' : '',
                                                cursor: canVote ? 'pointer' : 'not-allowed',
                                            }}
                                        >
                                            {c.name}
                                        </button>

                                        {/* Vote Count */}
                                        <p className="text-xs text-gray-500">{c.voteCount} vote(s)</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>


                    {/* Cast Vote Section
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
                    )} */}



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
                                    {/* Top Control Buttons */}
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {!roomInfo.votingStarted && (
                                            <button
                                                onClick={() => handleTx("startVote")}
                                                className="relative z-30 inline-flex items-center justify-center w-auto px-5 py-2 font-semibold text-white transition-all duration-500 ease-in-out border border-indigo-600 rounded-md cursor-pointer group bg-gradient-to-b from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 active:to-indigo-800 shadow-md"
                                            >
                                                <PlayIcon className="w-4 h-4 mr-1" />
                                                Start
                                            </button>

                                        )}
                                        {roomInfo.votingStarted && !roomInfo.votingEnded && (
                                            <button
                                                onClick={() => handleTx("endVote")}
                                                className="relative z-30 inline-flex items-center justify-center w-auto px-5 py-2 font-semibold text-white transition-all duration-500 ease-in-out border border-indigo-600 rounded-md cursor-pointer group bg-gradient-to-b from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 active:to-indigo-800 shadow-md"
                                            >
                                                <X className="w-4 h-4 mr-1" />
                                                End
                                            </button>

                                        )}
                                        <button
                                            onClick={() => handleTx("resetRoom")}
                                            className="relative z-30 inline-flex items-center justify-center w-auto px-5 py-2 font-semibold text-gray-800 transition-all duration-500 ease-in-out border border-gray-400 rounded-md cursor-pointer group bg-gradient-to-b from-gray-200 to-gray-300 hover:from-gray-300 hover:to-gray-400 active:to-gray-500 shadow-md"
                                        >
                                            <RefreshCw className="w-4 h-4 mr-1" />
                                            Reset
                                        </button>

                                        <button
                                            onClick={() => handleTx("deactivateRoom")}
                                            className="relative z-30 inline-flex items-center justify-center w-auto px-5 py-2 font-semibold text-white transition-all duration-500 ease-in-out border border-red-600 rounded-md cursor-pointer group bg-gradient-to-b from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 active:to-red-800 shadow-md"
                                        >
                                            <Trash2 className="w-4 h-4 mr-1" />
                                            Deactivate
                                        </button>

                                    </div>

                                    {/* Candidate Section */}
                                    <div className="space-y-3">
                                        <h3 className="font-semibold text-lg flex items-center gap-2">
                                            <BadgeCheck className="text-yellow-600" />
                                            Candidates
                                        </h3>

                                        <div className="flex flex-wrap gap-2">
                                            <input
                                                value={newCandidate}
                                                onChange={(e) => setNewCandidate(e.target.value)}
                                                placeholder="New Candidate"
                                                className="border px-3 py-2 rounded w-full sm:w-auto"
                                            />
                                            <button
                                                onClick={() => handleTx("addCandidate", newCandidate)}
                                                className="relative z-30 inline-flex items-center justify-center w-auto px-5 py-2 font-semibold text-white transition-all duration-500 ease-in-out border border-green-600 rounded-md cursor-pointer group bg-gradient-to-b from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 active:to-green-800 shadow-md"
                                            >
                                                <Plus className="w-4 h-4 mr-1" />
                                                Add Candidate
                                            </button>

                                            <button onClick={() => handleTx("clearCandidates")}
                                                className="relative inline-flex items-center justify-center px-5 py-2 font-semibold text-white bg-gradient-to-b from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 active:to-yellow-700 border border-yellow-500 rounded-md shadow-md transition duration-300 ease-in-out">
                                                <Trash2 className="w-4 h-4 mr-1" /> Clear Candidates
                                            </button>
                                            <button onClick={() => handleTx("clearVotes")}
                                                className="relative inline-flex items-center justify-center px-5 py-2 font-semibold text-white bg-gradient-to-b from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 active:to-orange-700 border border-orange-500 rounded-md shadow-md transition duration-300 ease-in-out">
                                                <Trash2 className="w-4 h-4 mr-1" /> Clear Votes
                                            </button>
                                        </div>

                                        <input
                                            type="text"
                                            placeholder="Search candidates..."
                                            value={candidateSearch}
                                            onChange={(e) => setCandidateSearch(e.target.value)}
                                            className="w-full px-3 py-2 border rounded"
                                        />
                                        <AnimatePresence>
                                            {filteredCandidates.map((c, i) => (
                                                <motion.div
                                                    key={c.id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    transition={{ duration: 0.3, delay: i * 0.04 }}
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
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
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
                                        <button onClick={() => handleTx("transferRoomAdmin", newAdminAddress)}
                                            className="relative inline-flex items-center justify-center px-5 py-2 font-semibold text-white bg-gradient-to-b from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 active:to-indigo-800 border border-indigo-600 rounded-md shadow-md transition duration-300 ease-in-out">
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
                                        <button onClick={() => handleTx("addVoter", newVoterAddr, newVoterName)}
                                            className="relative inline-flex items-center justify-center px-5 py-2 font-semibold text-white bg-gradient-to-b from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 active:to-green-800 border border-green-600 rounded-md shadow-md transition duration-300 ease-in-out">
                                            <Plus className="w-4 h-4 mr-1" /> Add Voter
                                        </button>

                                    </div>
                                )}
                                <p className="text-sm text-gray-600">
                                    Total: {roomInfo.voters.length} | Voted: {votedCount} | Not Yet: {roomInfo.voters.length - votedCount}
                                </p>
                                {isAdmin() && roomInfo?.maxVoters !== undefined && (
                                    <p className="text-sm text-indigo-600 font-medium">
                                        Max Voters Allowed: {roomInfo.maxVoters}
                                    </p>
                                )}



                                <input type="text" value={voterSearch} onChange={e => setVoterSearch(e.target.value)} placeholder="Search voters..." className="w-full px-3 py-2 border rounded" />
                                <ul className="divide-y">
                                    <AnimatePresence>
                                        {filteredVoters.map((v, i) => (
                                            <motion.li key={v.address} initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                transition={{ duration: 0.3, delay: i * 0.04 }}
                                                className="flex items-center justify-between py-2">
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <User className="w-4 h-4 text-gray-500" />
                                                        <span className="font-medium">{v.name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-gray-600">
                                                        <span className="font-mono">{v.address}</span>
                                                        <button onClick={() => copy(v.address)} className="hover:text-indigo-600">
                                                            {copied === v.address ? <ClipboardCheck className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                                        </button>
                                                        <span className={`px-2 py-0.5 rounded-full text-white text-xs font-semibold ${v.hasVoted ? 'bg-green-500' : 'bg-yellow-500'}`}>{v.hasVoted ? 'Voted' : 'Not Voted'}</span>
                                                    </div>
                                                </div>
                                                {isAdmin() && (
                                                    <button onClick={() => handleTx("removeVoter", v.address)}
                                                        className="relative inline-flex items-center justify-center px-3 py-1 font-semibold text-white bg-gradient-to-b from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 active:to-red-800 border border-red-600 rounded-md shadow-md text-xs transition duration-300 ease-in-out">
                                                        <User className="w-3 h-3 mr-1" /> Remove
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
                <button onClick={() => setPage('myrooms')}
                    className="relative inline-flex items-center justify-center px-5 py-2 font-semibold text-gray-800 bg-gradient-to-b from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 active:to-gray-400 border border-gray-300 rounded-md shadow-md transition duration-300 ease-in-out">
                    <ArrowLeft className="w-4 h-4 mr-1" /> Back
                </button>
                <button onClick={() => { setReturnPage('roominteract'); setPage('roommembers'); }}
                    className="relative inline-flex items-center justify-center px-5 py-2 font-semibold text-gray-800 bg-gradient-to-b from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 active:to-gray-400 border border-gray-300 rounded-md shadow-md transition duration-300 ease-in-out">
                    <Users className="w-4 h-4 mr-1" /> Room Members
                </button>
            </div>
        </div>
    );
}
