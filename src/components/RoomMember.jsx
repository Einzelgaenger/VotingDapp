import { useEffect, useState } from 'react';
import { BrowserProvider, Contract } from 'ethers';
import { useWallet } from '../contexts/WalletContext';
import VotingRoomAbi from '../abis/VotingRoom.json';
import {
    Users, BadgeCheck, UserCheck, RefreshCw, Copy, ClipboardCheck, ArrowLeft, User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function RoomMember({ activeRoomAddress, setPage, returnPage = 'roomdetail' }) {
    const { account } = useWallet();
    const [candidates, setCandidates] = useState([]);
    const [voters, setVoters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [roomAdmin, setRoomAdmin] = useState('');
    const [superAdmin, setSuperAdmin] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [searchVoters, setSearchVoters] = useState('');
    const [searchCandidates, setSearchCandidates] = useState('');
    const [copied, setCopied] = useState('');

    useEffect(() => {
        if (!activeRoomAddress) return;
        fetchMembers();
    }, [activeRoomAddress]);

    const fetchMembers = async () => {
        try {
            setLoading(true);
            const provider = new BrowserProvider(window.ethereum);
            const contract = new Contract(activeRoomAddress, VotingRoomAbi, provider);

            const [
                candidatesRaw,
                voterAddresses,
                voterNames,
                fetchedRoomAdmin,
                fetchedSuperAdmin,
            ] = await Promise.all([
                contract.getCandidates(),
                contract.getVoterDetails().then(res => res[0]),
                contract.getVoterDetails().then(res => res[1]),
                contract.roomAdmin(),
                contract.superAdmin()
            ]);

            setRoomAdmin(fetchedRoomAdmin.toLowerCase());
            setSuperAdmin(fetchedSuperAdmin.toLowerCase());

            const votersExpanded = await Promise.all(
                voterAddresses.map(async (addr, i) => {
                    const voterData = await contract.voters(addr);
                    return {
                        address: addr,
                        name: voterNames[i],
                        hasVoted: voterData.hasVoted
                    };
                })
            );

            const sortedCandidates = [...candidatesRaw].sort((a, b) => b.voteCount - a.voteCount);
            const sortedVoters = votersExpanded.sort((a, b) => a.hasVoted === b.hasVoted ? 0 : a.hasVoted ? -1 : 1);

            setCandidates(sortedCandidates);
            setVoters(sortedVoters);
        } catch (err) {
            console.error('Failed to load members:', err);
        } finally {
            setLoading(false);
        }
    };

    const isRoomAdmin = () => account?.toLowerCase() === roomAdmin;
    const isSuperAdmin = () => account?.toLowerCase() === superAdmin;

    const handleRemoveVoter = async (voterAddress) => {
        if (!window.confirm(`Remove voter ${voterAddress}?`)) return;
        try {
            setActionLoading(true);
            const provider = new BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new Contract(activeRoomAddress, VotingRoomAbi, signer);

            const tx = await contract.removeVoter(voterAddress);
            await tx.wait();
            await fetchMembers();
            alert('Voter removed!');
        } catch (err) {
            console.error('Error removing voter:', err);
            alert('Failed to remove voter');
        } finally {
            setActionLoading(false);
        }
    };

    const copyToClipboard = (address) => {
        navigator.clipboard.writeText(address);
        setCopied(address);
        setTimeout(() => setCopied(''), 2000);
    };

    const filteredVoters = voters.filter(v =>
        v.name.toLowerCase().includes(searchVoters.toLowerCase()) ||
        v.address.toLowerCase().includes(searchVoters.toLowerCase())
    );

    const filteredCandidates = candidates.filter(c =>
        c.name.toLowerCase().includes(searchCandidates.toLowerCase())
    );

    return (
        <div className="px-6 py-10 max-w-4xl mx-auto text-gray-800">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Users className="text-indigo-600" />
                    Room Members
                </h2>
                <button
                    onClick={async () => {
                        setLoading(true);
                        await fetchMembers();
                        setLoading(false);
                    }}
                    disabled={loading}
                    className="ml-auto flex items-center gap-2 bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600 disabled:opacity-50"
                >
                    {loading ? (
                        <RefreshCw className="animate-spin w-5 h-5" />
                    ) : (
                        <>
                            <RefreshCw className="w-5 h-5" />
                            Refresh
                        </>
                    )}
                </button>

            </div>

            {/* Candidates */}
            <div className="bg-white border rounded-lg p-4 mb-6 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                        <BadgeCheck className="text-yellow-600" />
                        Candidates
                    </h3>
                    <input
                        type="text"
                        placeholder="Search candidates..."
                        value={searchCandidates}
                        onChange={e => setSearchCandidates(e.target.value)}
                        className="border rounded px-2 py-1 text-sm"
                    />
                </div>
                {filteredCandidates.length === 0 ? (
                    <p>No candidates available.</p>
                ) : (
                    <ul className="space-y-1">
                        {filteredCandidates.map((c, i) => (
                            <li key={i} className="text-gray-700">
                                {c.name} — {c.voteCount.toString()} vote(s)
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Voters */}
            <div className="bg-white border rounded-lg p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                        <UserCheck className="text-green-700" />
                        Voters
                    </h3>
                    <input
                        type="text"
                        placeholder="Search voters..."
                        value={searchVoters}
                        onChange={e => setSearchVoters(e.target.value)}
                        className="border rounded px-2 py-1 text-sm"
                    />
                </div>

                <ul className="divide-y">
                    <AnimatePresence>
                        {filteredVoters.map((v, i) => (
                            <motion.li
                                key={v.address}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.25 }}
                                className="flex items-center justify-between py-2"
                            >
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
                                        <span className={`px-2 py-0.5 rounded-full text-white text-xs font-semibold ${v.hasVoted ? 'bg-green-500' : 'bg-yellow-500'}`}>
                                            {v.hasVoted ? 'Voted' : 'Not Voted'}
                                        </span>
                                    </div>
                                </div>
                                {(isRoomAdmin() || isSuperAdmin()) && (
                                    <button
                                        onClick={() => handleRemoveVoter(v.address)}
                                        disabled={actionLoading}
                                        className="bg-red-600 text-white px-2 py-1 text-xs rounded hover:bg-red-700 flex items-center gap-1"
                                    >
                                        <User className="w-3 h-3" />
                                        Remove
                                    </button>
                                )}
                            </motion.li>
                        ))}
                    </AnimatePresence>
                </ul>
            </div>

            <div className="mt-8">
                <button
                    onClick={() => setPage(returnPage)}
                    className="flex items-center gap-2 text-gray-700 border px-3 py-1.5 rounded hover:bg-gray-100"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </button>
            </div>
        </div>
    );
}
