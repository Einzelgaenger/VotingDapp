import { useState, useEffect } from 'react';
import { Contract, isAddress, BrowserProvider } from 'ethers';
import { useWallet } from '../contexts/WalletContext';
import VotingRoomAbi from '../abis/VotingRoom.json';
import { LogIn, Loader2, ArrowLeft, UserCheck } from 'lucide-react';
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
                timeZone: 'Asia/Jakarta'
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
            const isAdmin = roomAdmin.toLowerCase() === lowerAccount || superAdmin.toLowerCase() === lowerAccount;
            const isVoter = voterList.map(v => v.toLowerCase()).includes(lowerAccount);

            if (isAdmin || isVoter) {
                setActiveRoomAddress(roomAddress);
                setPage('roominteract');
            } else {
                toast.error("You're not authorized to join this room.");
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to join the room.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-72px)] pt-[72px] flex justify-center items-start">

            <div className="bg-white/80 backdrop-blur-sm border border-blue-100/50 rounded-3xl shadow-[0_8px_30px_rgba(0,240,255,0.07)] max-w-xl w-full px-6 py-8 md:px-10 md:py-12 transition-all">

                <div className="flex items-center justify-center gap-3 mb-6">
                    <UserCheck className="w-8 h-8 text-cyberblue/80" />
                    <h2 className="text-3xl md:text-4xl font-exo font-semibold text-cyberdark tracking-wide">
                        Join Voting Room
                    </h2>
                </div>

                <form onSubmit={handleJoinRoom} className="space-y-6 font-exo text-cyberdark">
                    <div className="space-y-1">
                        <label className="block text-sm font-medium">Room Address</label>
                        <input
                            type="text"
                            value={roomAddress}
                            onChange={(e) => setRoomAddress(e.target.value)}
                            placeholder="Enter Voting Room Address"
                            className="w-full px-4 py-2.5 rounded-lg border border-blue-100 bg-white text-cyberdark placeholder-gray-400 shadow-inner focus:ring-1 focus:ring-cyberblue/80 focus:outline-none"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center px-6 py-3 font-semibold text-white bg-cyberblue hover:brightness-110 hover:shadow-[0_0_10px_#00f0ff55] rounded-full transition-all shadow-md active:scale-95"
                    >
                        {loading && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
                        Join Room
                    </button>

                    <p className="text-xs text-gray-500 text-center">
                        Only authorized voters or admins can join this room.
                    </p>

                    <div className="pt-2 text-center">
                        <button
                            type="button"
                            onClick={() => setPage('home')}
                            className="text-sm text-cyberdark hover:underline inline-flex items-center gap-1"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Home
                        </button>
                    </div>
                </form>
            </div>

            {/* Metadata */}
            <div className="absolute bottom-4 right-6 text-[0.7rem] text-cyberdark/60 font-mono bg-white/40 backdrop-blur-sm px-3 py-1 rounded-md border border-white/30 shadow-sm">
                SYSTEM · EN · {localTime}
            </div>
        </div>
    );
}
