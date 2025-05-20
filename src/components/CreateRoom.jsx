import { useState } from 'react';
import { BrowserProvider, Contract } from 'ethers';
import { useWallet } from '../contexts/WalletContext';
import RoomFactoryAbi from '../abis/RoomFactory.json';
import { Loader2, Rocket, ClipboardList } from 'lucide-react';
import toast from 'react-hot-toast';
import { useEffect } from 'react';


const ROOM_FACTORY_ADDRESS = "0x5933899C50ab5DB1bCd94B5a8e60aD34f26e06f3";

export default function CreateRoom({ setPage, setActiveRoomAddress }) {
    const { account } = useWallet();
    const [roomName, setRoomName] = useState('');
    const [description, setDescription] = useState('');
    const [maxVoters, setMaxVoters] = useState('');
    const [loading, setLoading] = useState(false);
    const [txHash, setTxHash] = useState(null);
    const [newRoomAddress, setNewRoomAddress] = useState(null);

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

        updateTime(); // initialize immediately
        const interval = setInterval(updateTime, 30000); // refresh every 30s
        return () => clearInterval(interval);
    }, []);

    const handleCreateRoom = async () => {
        if (!roomName || !description || !maxVoters || isNaN(maxVoters) || Number(maxVoters) <= 0) {
            toast.error('Please fill all fields correctly.');
            return;
        }

        try {
            setLoading(true);
            setTxHash(null);
            setNewRoomAddress(null);

            const provider = new BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const roomFactory = new Contract(ROOM_FACTORY_ADDRESS, RoomFactoryAbi, signer);

            const tx = await toast.promise(
                roomFactory.createRoom(roomName, description, maxVoters),
                {
                    loading: 'Creating session...',
                    success: 'Voting session created!',
                    error: 'Failed to create session.',
                }
            );
            const receipt = await tx.wait();

            setTxHash(tx.hash);
            toast.success('Session created successfully!');

            const event = receipt.logs.map(log => {
                try {
                    return roomFactory.interface.parseLog(log);
                } catch {
                    return null;
                }
            }).find(e => e && e.name === "RoomCreated");

            if (event) {
                const roomAddress = event.args.roomAddress;
                setNewRoomAddress(roomAddress);
            }
        } catch (error) {
            console.error('Error creating room:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleJoinNewRoom = () => {
        if (newRoomAddress) {
            setActiveRoomAddress(newRoomAddress);
            setPage('roominteract');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 relative">
            <div className="bg-white/80 backdrop-blur-sm border border-blue-100/50 rounded-3xl shadow-[0_8px_30px_rgba(0,240,255,0.07)] max-w-xl w-full px-6 py-8 md:px-10 md:py-12 transition-all">

                {/* Header with Icon */}
                <div className="flex items-center justify-center gap-3 mb-6">
                    <ClipboardList className="w-8 h-8 text-cyberblue/80" />
                    <h2 className="text-3xl md:text-4xl font-exo font-semibold text-cyberdark tracking-wide">
                        New Voting Session
                    </h2>
                </div>

                <div className="space-y-6 font-exo text-cyberdark">
                    <div className="space-y-1">
                        <label className="block text-sm font-medium">Session Title</label>
                        <input
                            type="text"
                            value={roomName}
                            onChange={(e) => setRoomName(e.target.value)}
                            placeholder="Enter session title"
                            className="w-full px-4 py-2.5 rounded-lg border border-blue-100 bg-white text-cyberdark placeholder-gray-400 shadow-inner focus:ring-1 focus:ring-cyberblue/80 focus:outline-none"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="block text-sm font-medium">Room Purpose</label>
                        <textarea
                            rows={3}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe the purpose..."
                            className="w-full px-4 py-2.5 rounded-lg border border-blue-100 bg-white text-cyberdark placeholder-gray-400 shadow-inner focus:ring-1 focus:ring-cyberblue/80 focus:outline-none"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="block text-sm font-medium">Voter Limit</label>
                        <input
                            type="number"
                            value={maxVoters}
                            onChange={(e) => setMaxVoters(e.target.value)}
                            placeholder="e.g. 100"
                            className="w-full px-4 py-2.5 rounded-lg border border-blue-100 bg-white text-cyberdark placeholder-gray-400 shadow-inner focus:ring-1 focus:ring-cyberblue/80 focus:outline-none"
                        />
                    </div>

                    <button
                        onClick={handleCreateRoom}
                        disabled={loading}
                        className="w-full flex items-center justify-center px-6 py-3 font-semibold text-white bg-cyberblue hover:brightness-110 hover:shadow-[0_0_10px_#00f0ff55] rounded-full transition-all shadow-md active:scale-95"
                    >
                        {loading && <Loader2 className="w-5 h-5 mr-2 animate-spin" />} Initialize Room
                    </button>

                    {txHash && (
                        <div className="text-xs text-cyberdark mt-6 bg-blue-50 border border-blue-200 p-4 rounded-lg shadow-sm">
                            <strong>Tx Hash:</strong><br />
                            <a
                                href={`https://sepolia.etherscan.io/tx/${txHash}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-cyberblue underline"
                            >
                                {txHash}
                            </a>
                        </div>
                    )}

                    {newRoomAddress && (
                        <button
                            onClick={handleJoinNewRoom}
                            className="w-full flex items-center justify-center px-6 py-3 font-semibold text-white bg-emerald-500 hover:bg-emerald-400 rounded-full transition-all shadow-md active:scale-95"
                        >
                            <Rocket className="w-5 h-5 mr-2" /> Join New Room
                        </button>
                    )}

                    {/* Optional accent bar */}
                    {/* <div className="h-1 w-20 bg-cyberblue mx-auto rounded-full mt-10 animate-pulse"></div> */}
                </div>
            </div>

            {/* Metadata display */}
            <div className="absolute bottom-4 right-6 text-[0.7rem] text-cyberdark/60 font-mono bg-white/40 backdrop-blur-sm px-3 py-1 rounded-md border border-white/30 shadow-sm">
                SYSTEM · EN · {localTime}
            </div>

        </div>
    );
}
