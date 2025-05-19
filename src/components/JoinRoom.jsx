import { useState } from 'react';
import { Contract, isAddress, BrowserProvider } from 'ethers';
import { useWallet } from '../contexts/WalletContext';
import VotingRoomAbi from '../abis/VotingRoom.json';
import { LogIn, Loader2, ArrowLeft, UserCheck } from 'lucide-react';

export default function JoinRoom({ setPage, setActiveRoomAddress }) {
    const { account } = useWallet();
    const [roomAddress, setRoomAddress] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleJoinRoom = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (!isAddress(roomAddress)) {
                setError('Invalid room address.');
                setLoading(false);
                return;
            }

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
                setError("You're not authorized to join this room.");
            }
        } catch (err) {
            console.error(err);
            setError('Failed to join the room.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <style>
                {`
          @keyframes gradientBackground {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }

          @keyframes float {
            0% { transform: translateY(0px); opacity: 0.6; }
            50% { transform: translateY(-20px); opacity: 1; }
            100% { transform: translateY(0px); opacity: 0.6; }
          }
        `}
            </style>
            <style>
                {`
    @keyframes snowfall {
      0% {
        transform: translateY(0px) translateX(0px);
        opacity: 0.8;
      }
      100% {
        transform: translateY(100vh) translateX(20px);
        opacity: 0;
      }
    }
  `}
            </style>


            <div
                className="min-h-screen relative flex items-center justify-center px-4 overflow-hidden"
                style={{
                    background: 'linear-gradient(135deg, #e0e7ff, #f3f4f6, #c7d2fe)',
                    backgroundSize: '400% 400%',
                    animation: 'gradientBackground 18s ease infinite'
                }}
            >
                {/* Floating Particles */}
                {Array.from({ length: 35 }).map((_, i) => {
                    const size = 6 + Math.random() * 12; // lebih besar
                    const left = Math.random() * 100;
                    const duration = 12 + Math.random() * 10;
                    const delay = Math.random() * 10;
                    const blur = Math.random() < 0.5 ? 'backdrop-blur-md' : 'backdrop-blur-sm';

                    return (
                        <div
                            key={i}
                            className={`absolute rounded-full ${blur} pointer-events-none`}
                            style={{
                                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                width: `${size}px`,
                                height: `${size}px`,
                                left: `${left}%`,
                                top: `-${size}px`,
                                animation: `snowfall ${duration}s linear infinite`,
                                animationDelay: `${delay}s`,
                                opacity: 0.7,
                                filter: 'drop-shadow(0 0 2px rgba(255,255,255,0.6))'
                            }}
                        />
                    );
                })}



                {/* Glass Card */}
                <div className="relative z-10 backdrop-blur-md bg-white/70 rounded-xl shadow-lg p-8 max-w-md w-full">
                    <div className="flex justify-center mb-4">
                        <UserCheck className="w-12 h-12 text-indigo-500" />
                    </div>
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 flex justify-center items-center gap-2">
                            <LogIn className="w-5 h-5 text-indigo-500" />
                            Join Voting Room
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">Enter a valid room address to participate</p>
                    </div>

                    <form onSubmit={handleJoinRoom} className="space-y-4">
                        <input
                            type="text"
                            placeholder="Enter Voting Room Address"
                            className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 transition"
                            value={roomAddress}
                            onChange={(e) => setRoomAddress(e.target.value)}
                            required
                        />

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full inline-flex items-center justify-center px-4 py-2 font-semibold text-white bg-gradient-to-b from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 active:to-indigo-800 border border-indigo-600 rounded-md shadow-md"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Join Room
                        </button>

                        {error && (
                            <p className="text-red-600 text-sm text-center">{error}</p>
                        )}
                    </form>

                    <p className="text-xs text-gray-500 mt-3 text-center">
                        Tip: You can only join rooms where you're already registered as a voter or admin.
                    </p>

                    <div className="mt-6 text-center">
                        <button
                            onClick={() => setPage('create')}
                            className="text-sm text-gray-600 hover:underline inline-flex items-center gap-1"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Home
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
