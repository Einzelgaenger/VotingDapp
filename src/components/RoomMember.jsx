import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import VotingRoomAbi from '../abis/VotingRoom.json';

export default function RoomMember({ activeRoomAddress, setPage, returnPage = 'roomdetail' }) {
    const [candidates, setCandidates] = useState([]);
    const [voters, setVoters] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (activeRoomAddress) {
            fetchMembers();
        }
    }, [activeRoomAddress]);

    const fetchMembers = async () => {
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const contract = new ethers.Contract(activeRoomAddress, VotingRoomAbi, provider);

            const [candidatesRaw, voterAddresses] = await Promise.all([
                contract.getCandidates(),
                contract.getVoters()
            ]);

            const votersExpanded = await Promise.all(
                voterAddresses.map(async (addr) => {
                    const data = await contract.voters(addr);
                    return {
                        address: addr,
                        hasVoted: data.hasVoted
                    };
                })
            );

            const sortedCandidates = [...candidatesRaw].sort((a, b) => {
                if (b.voteCount !== a.voteCount) return b.voteCount - a.voteCount;
                return a.name.localeCompare(b.name);
            });

            setCandidates(sortedCandidates);
            setVoters(votersExpanded);
        } catch (err) {
            console.error('Failed to load members:', err);
        } finally {
            setLoading(false);
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
                        <li key={idx}>
                            {voter.address} — {voter.hasVoted ? '✅ Voted' : '❌ Not Voted'}
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
