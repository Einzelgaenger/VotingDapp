// RoomInteract.jsx (rapi + modern UI Tailwind)
import { useEffect, useState } from 'react';
import { BrowserProvider, Contract } from 'ethers';
import { useWallet } from '../contexts/WalletContext';
import VotingRoomAbi from '../abis/VotingRoom.json';
import {
    RefreshCw, ArrowLeft, Users, BadgeCheck, UserCheck,
    ClipboardCheck, Copy, Plus, Trash2, CircleCheck
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { motion } from 'framer-motion';

const BAR_COLORS = ['#6366F1', '#10B981', '#EC4899', '#F59E0B', '#F97316'];

export default function RoomInteract({ activeRoomAddress, setPage, setReturnPage }) {
    const { account } = useWallet();
    const [roomInfo, setRoomInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [candidateSearch, setCandidateSearch] = useState('');
    const [voterSearch, setVoterSearch] = useState('');
    const [newCandidate, setNewCandidate] = useState('');
    const [newVoterAddr, setNewVoterAddr] = useState('');
    const [newVoterName, setNewVoterName] = useState('');
    const [copied, setCopied] = useState('');

    useEffect(() => { if (activeRoomAddress) fetchRoom(); }, [activeRoomAddress]);

    const fetchRoom = async () => {
        try {
            setLoading(true);
            const provider = new BrowserProvider(window.ethereum);
            const contract = new Contract(activeRoomAddress, VotingRoomAbi, provider);
            const [
                roomName, roomAdmin, superAdmin, isActive, votingStarted, votingEnded, maxVoters,
                candidatesRaw, voterAddresses, voterNames
            ] = await Promise.all([
                contract.roomName(), contract.roomAdmin(), contract.superAdmin(), contract.isActive(),
                contract.votingStarted(), contract.votingEnded(), contract.maxVoters(),
                contract.getCandidates(), contract.getVoterDetails().then(r => r[0]),
                contract.getVoterDetails().then(r => r[1])
            ]);
            const voters = await Promise.all(
                voterAddresses.map(async (addr, i) => {
                    const data = await contract.voters(addr);
                    return { address: addr.toLowerCase(), name: voterNames[i], hasVoted: data.hasVoted };
                })
            );
            const candidates = candidatesRaw.map(c => ({ id: c.id, name: c.name, voteCount: Number(c.voteCount) }));
            setRoomInfo({
                roomName, roomAdmin: roomAdmin.toLowerCase(), superAdmin: superAdmin.toLowerCase(),
                isActive, votingStarted, votingEnded, maxVoters: maxVoters.toString(), candidates, voters
            });
        } catch (err) {
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
        } catch (err) {
            toast.error(`Failed to ${method}`);
        } finally {
            setActionLoading(false);
        }
    };

    const copy = text => {
        navigator.clipboard.writeText(text);
        setCopied(text);
        setTimeout(() => setCopied(''), 1500);
    };

    const filteredCandidates = roomInfo?.candidates.filter(c => c.name.toLowerCase().includes(candidateSearch.toLowerCase())).sort((a, b) => b.voteCount - a.voteCount);
    const filteredVoters = roomInfo?.voters.filter(v => v.name.toLowerCase().includes(voterSearch.toLowerCase()) || v.address.toLowerCase().includes(voterSearch.toLowerCase()));
    if (loading || !roomInfo) return <div className="p-8">Loading...</div>;

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6">
            <Toaster />
            <div className="bg-white shadow rounded-lg p-4">
                <h2 className="text-3xl font-bold mb-1">{roomInfo.roomName}</h2>
                <p className="text-sm text-gray-500 mb-3">Room Address: {activeRoomAddress}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {filteredCandidates.map((c, i) => {
                        const percent = (c.voteCount / totalVotes) * 100;
                        return (
                            <div key={c.id} className="text-center">
                                <p className="text-xs mb-1 font-medium">{percent.toFixed(1)}%</p>
                                <div className="h-28 bg-gray-100 rounded-md overflow-hidden relative">
                                    {percent > 0 && (
                                        <motion.div layout className="absolute bottom-0 w-full"
                                            style={{ height: `${percent}%`, backgroundColor: BAR_COLORS[i % BAR_COLORS.length] }} />
                                    )}
                                </div>
                                <p className="mt-1 font-semibold text-sm">{c.name}</p>
                                <p className="text-xs text-gray-500">{c.voteCount} vote(s)</p>
                            </div>
                        );
                    })}
                </div>
            </div>

            {roomInfo.votingStarted && !roomInfo.votingEnded && isVoter() && !hasVoted() && (
                <div className="bg-white p-4 rounded-lg shadow text-center">
                    <h3 className="text-lg font-semibold mb-3">Cast Your Vote</h3>
                    <div className="flex flex-wrap justify-center gap-3">
                        {filteredCandidates.map((c, i) => (
                            <button key={c.id} onClick={() => handleTx("vote", c.id)}
                                className="px-4 py-2 rounded-lg text-white font-semibold shadow"
                                style={{ backgroundColor: BAR_COLORS[i % BAR_COLORS.length] }}>
                                Vote for {c.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {hasVoted() && (
                <div className="bg-green-100 border border-green-400 text-green-800 px-4 py-2 rounded text-center flex justify-center items-center gap-2">
                    <CircleCheck className="w-5 h-5" /> You have voted!
                </div>
            )}

            {isAdmin() && (
                <div className="bg-white p-5 rounded-lg shadow space-y-4">
                    <h3 className="text-xl font-bold mb-2">Admin Panel</h3>
                    <div className="flex flex-wrap gap-2">
                        {!roomInfo.votingStarted && <button onClick={() => handleTx("startVote")} className="btn">Start Voting</button>}
                        {roomInfo.votingStarted && !roomInfo.votingEnded && <button onClick={() => handleTx("endVote")} className="btn">End Voting</button>}
                        <button onClick={() => handleTx("resetRoom")} className="btn">Reset Room</button>
                        <button onClick={() => handleTx("deactivateRoom")} className="btn bg-red-500 text-white">Deactivate Room</button>
                    </div>

                    <div>
                        <h4 className="font-semibold">Manage Candidates</h4>
                        <div className="flex flex-wrap gap-2 mb-2">
                            <input value={newCandidate} onChange={e => setNewCandidate(e.target.value)} placeholder="New Candidate"
                                className="input w-full sm:w-auto" />
                            <button onClick={() => handleTx("addCandidate", newCandidate)} className="btn text-sm flex gap-1 items-center"><Plus className="w-4 h-4" />Add</button>
                            <button onClick={() => handleTx("clearCandidates")} className="btn text-sm"><Trash2 className="w-4 h-4" />Clear</button>
                            <button onClick={() => handleTx("clearVotes")} className="btn text-sm"><Trash2 className="w-4 h-4" />Clear Votes</button>
                        </div>
                        <ul className="text-sm ml-4 list-disc">
                            {filteredCandidates.map((c, i) => <li key={i}>{c.name} ({c.voteCount} votes)</li>)}
                        </ul>
                    </div>
                </div>
            )}

            <div className="bg-white p-5 rounded-lg shadow space-y-3">
                <h3 className="text-lg font-bold flex items-center gap-2"><UserCheck className="w-5 h-5" /> Voters Panel</h3>
                <p className="text-sm text-gray-600">Total: {roomInfo.voters.length} | Voted: {votedCount} | Not Yet: {roomInfo.voters.length - votedCount}</p>
                <input type="text" value={voterSearch} onChange={e => setVoterSearch(e.target.value)} placeholder="Search voter..."
                    className="input w-full" />
                <div className="space-y-1">
                    {filteredVoters?.sort((a, b) => b.hasVoted - a.hasVoted || a.name.localeCompare(b.name)).map((v, i) => (
                        <div key={i} className="flex items-center justify-between px-2 py-1 border rounded text-sm">
                            <div>
                                <span className="font-semibold mr-2">{v.name || 'Unnamed'}</span>
                                <span className="text-gray-500">{v.address}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`text-sm font-bold ${v.hasVoted ? 'text-green-600' : 'text-yellow-600'}`}>
                                    {v.hasVoted ? 'Voted' : 'Not Yet'}
                                </span>
                                <button onClick={() => copy(v.address)}>{copied === v.address ? <ClipboardCheck className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}</button>
                                {isAdmin() && <button onClick={() => handleTx("removeVoter", v.address)} className="text-red-500"><Trash2 className="w-4 h-4" /></button>}
                            </div>
                        </div>
                    ))}
                </div>

                {isAdmin() && (
                    <div className="mt-3 flex flex-wrap gap-2">
                        <input value={newVoterAddr} onChange={e => setNewVoterAddr(e.target.value)} placeholder="Voter Address" className="input w-full sm:w-auto" />
                        <input value={newVoterName} onChange={e => setNewVoterName(e.target.value)} placeholder="Voter Name" className="input w-full sm:w-auto" />
                        <button onClick={() => handleTx("addVoter", newVoterAddr, newVoterName)} className="btn text-sm"><Plus className="w-4 h-4" />Add</button>
                        <button onClick={() => handleTx("clearVoters")} className="btn bg-red-500 text-white text-sm"><Trash2 className="w-4 h-4" />Clear All</button>
                    </div>
                )}
            </div>

            <div className="mt-6 flex gap-4">
                <button onClick={() => { setReturnPage('roominteract'); setPage('roommembers'); }} className="btn-outline"><Users className="w-4 h-4" /> Room Members</button>
                <button onClick={() => setPage('myrooms')} className="btn-outline"><ArrowLeft className="w-4 h-4" /> Back</button>
            </div>
        </div>
    );
}
