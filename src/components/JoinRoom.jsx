import { useState, useEffect } from 'react';
import { Contract, isAddress, BrowserProvider } from 'ethers';
import { useWallet } from '../contexts/WalletContext';
import VotingRoomAbi from '../abis/VotingRoom.json';
import { Loader2, ArrowLeft, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';

export default function JoinRoom({ setPage, setActiveRoomAddress }) {
    const { account } = useWallet();
    const [roomAddress, setRoomAddress] = useState('');
    const [loading, setLoading] = useState(false);
    const [localTime, setLocalTime] = useState('');

    useEffect(() => {
        const updateTime = () => {
            const time = new Date().toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
                timeZone: 'Asia/Jakarta',
            });
            setLocalTime(time);
        };

        updateTime();
        const interval = setInterval(updateTime, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleJoinRoom = async (e) => {
        e.preventDefault();
        if (!isAddress(roomAddress)) {
            toast.error('Invalid room address.');
            return;
        }

        try {
            setLoading(true);
            const provider = new BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new Contract(roomAddress, VotingRoomAbi, signer);

            const [roomAdmin, superAdmin, voterList] = await Promise.all([
                contract.roomAdmin(),
                contract.superAdmin(),
                contract.getVoters(),
            ]);

            const lowerAccount = account.toLowerCase();
            const isAdmin =
                roomAdmin.toLowerCase() === lowerAccount ||
                superAdmin.toLowerCase() === lowerAccount;
            const isVoter = voterList
                .map((v) => v.toLowerCase())
                .includes(lowerAccount);

            if (isAdmin || isVoter) {
                setActiveRoomAddress(roomAddress);
                setPage('roominteract');
            } else {
                toast.error("You're not authorized to join this room.");
            }
        } catch (err) {
            console.error(err);
            toast.error('Failed to join the room.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center px-4 relative">
            <div className="section-container flex-grow flex items-center justify-center">
                <div className="card max-w-xl w-full px-6 py-8 md:px-10 md:py-12">
                    <div className="flex items-center justify-center gap-3 mb-6">
                        <LogIn className="w-8 h-8 icon" />
                        <h2 className="text-3xl md:text-4xl font-exo font-semibold tracking-wide">
                            Join a Voting Session
                        </h2>
                    </div>

                    <form onSubmit={handleJoinRoom} className="space-y-8 font-exo">
                        <div className="space-y-1">
                            <label className="block text-sm font-medium">Session Address</label>
                            <input
                                type="text"
                                value={roomAddress}
                                onChange={(e) => setRoomAddress(e.target.value)}
                                placeholder="Enter a valid room address"
                                className="input"
                            />
                        </div>

                        <button type="submit" disabled={loading} className="btn-primary w-full">
                            {loading && <Loader2 className="w-5 h-5 mr-2 animate-spin icon" />}
                            Join Session
                        </button>

                        <p className="text-xs text-center opacity-60">
                            Only authorized participants may access this session.
                        </p>

                        <div className="pt-2 text-center">
                            <button
                                type="button"
                                onClick={() => setPage('home')}
                                className="text-sm hover:underline inline-flex items-center gap-1"
                            >
                                <ArrowLeft className="w-4 h-4 icon" />
                                Back to Home
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            <div className="metadata absolute bottom-4 right-6">
                SYSTEM · EN · {localTime}
            </div>
        </div>
    );
}
