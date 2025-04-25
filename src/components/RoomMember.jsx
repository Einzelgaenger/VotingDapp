import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../contexts/WalletContext';
import VotingRoomAbi from '../abis/VotingRoom.json';

export default function RoomMember({ activeRoomAddress, setPage, returnPage = 'roomdetail' }) {
    const { account } = useWallet();
    const [candidates, setCandidates] = useState([]);
    const [voters, setVoters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [roomAdmin, setRoomAdmin] = useState('');
    const [superAdmin, setSuperAdmin] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        if (activeRoomAddress) {
            fetchMembers();
        }
    }, [activeRoomAddress]);

    const fetchMembers = async () => {
        try {
            setLoading(true);
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const contract = new ethers.Contract(activeRoomAddress, VotingRoomAbi, provider);

            const [
                candidatesRaw,
                voterAddresses,
                voterNames,
                fetchedRoomAdmin,
                fetchedSuperAdmin
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

            const sortedCandidates = [...candidatesRaw].sort((a, b) => {
                if (b.voteCount !== a.voteCount) return b.voteCount - a.voteCount;
                return a.name.localeCompare(b.name);
            });

            setCandidates(sortedCandidates);
            // setVoters(votersExpanded);
            const sortedVoters = votersExpanded.sort((a, b) =>
                a.name.toLowerCase().localeCompare(b.name.toLowerCase())
            );
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
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            const contract = new ethers.Contract(activeRoomAddress, VotingRoomAbi, signer);

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

    if (loading) return <div style={{ padding: '2rem' }}>Loading Members...</div>;

    return (
        <div style={{ padding: '2rem' }}>
            <h2>👥 Room Members</h2>

            <h3>👤 Candidates</h3>
            {candidates.length === 0 ? (
                <p>No candidates available.</p>
            ) : (
                <ul>
                    {candidates.map((cand, idx) => (
                        <li key={idx}>
                            {cand.name} — {cand.voteCount.toString()} vote(s)
                        </li>
                    ))}
                </ul>
            )}

            <h3>🗳️ Voters</h3>
            {voters.length === 0 ? (
                <p>No voters registered.</p>
            ) : (
                <ul>
                    {voters.map((voter, idx) => (
                        <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <span>
                                {voter.name} ({voter.address}) — {voter.hasVoted ? '✅ Voted' : '❌ Not Voted'}
                            </span>
                            {(isRoomAdmin() || isSuperAdmin()) && (
                                <button
                                    onClick={() => handleRemoveVoter(voter.address)}
                                    disabled={actionLoading}
                                    style={{ background: 'red', color: 'white' }}
                                >
                                    🗑️ Remove
                                </button>
                            )}
                        </li>
                    ))}
                </ul>
            )}

            <div style={{ marginTop: '2rem' }}>
                <button onClick={() => setPage(returnPage)}>Back</button>
            </div>
        </div>
    );
}
