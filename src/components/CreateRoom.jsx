import { useState } from 'react';
import { BrowserProvider, Contract } from 'ethers';
import { useWallet } from '../contexts/WalletContext';
import RoomFactoryAbi from '../abis/RoomFactory.json';
import { Loader2, Rocket, ClipboardList } from 'lucide-react';
import toast from 'react-hot-toast';

const ROOM_FACTORY_ADDRESS = "0x5933899C50ab5DB1bCd94B5a8e60aD34f26e06f3";

export default function CreateRoom({ setPage, setActiveRoomAddress }) {
    const { account } = useWallet();
    const [roomName, setRoomName] = useState('');
    const [description, setDescription] = useState('');
    const [maxVoters, setMaxVoters] = useState('');
    const [loading, setLoading] = useState(false);
    const [txHash, setTxHash] = useState(null);
    const [newRoomAddress, setNewRoomAddress] = useState(null);

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
                    loading: 'Creating room...',
                    success: 'Room created successfully!',
                    error: 'Failed to create room.'
                }
            );
            const receipt = await tx.wait();


            setTxHash(tx.hash);
            toast.success('Room created successfully!');

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
        }
        finally {
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
        <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-indigo-50 to-white">
            <div className="bg-white/80 backdrop-blur-md p-8 rounded-xl shadow-lg max-w-md w-full">
                <div className="flex justify-center mb-4">
                    <ClipboardList className="w-12 h-12 text-indigo-500" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 text-center mb-6 flex items-center justify-center gap-2">
                    Create Voting Room
                </h2>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700">Room Name</label>
                        <input
                            type="text"
                            placeholder="Enter room name"
                            value={roomName}
                            onChange={(e) => setRoomName(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 transition"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700">Room Description</label>
                        <textarea
                            placeholder="Describe your room purpose..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={4}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 transition"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700">Max Voters</label>
                        <input
                            type="number"
                            placeholder="e.g. 100"
                            value={maxVoters}
                            onChange={(e) => setMaxVoters(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 transition"
                        />
                    </div>

                    <button
                        onClick={handleCreateRoom}
                        disabled={loading}
                        className="w-full inline-flex items-center justify-center px-4 py-2 font-semibold text-white bg-gradient-to-b from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 active:to-indigo-800 border border-indigo-600 rounded-md shadow-md text-sm"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Create Room
                    </button>

                    {txHash && (
                        <div className="text-sm text-gray-600 break-all bg-gray-50 p-3 border rounded">
                            <strong>Tx Hash:</strong><br />
                            <a href={`https://sepolia.etherscan.io/tx/${txHash}`} target="_blank" rel="noreferrer" className="text-blue-600 underline">
                                {txHash}
                            </a>
                        </div>
                    )}

                    {newRoomAddress && (
                        <button
                            onClick={handleJoinNewRoom}
                            className="w-full inline-flex items-center justify-center px-4 py-2 font-semibold text-white bg-gradient-to-b from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 active:to-green-800 border border-green-600 rounded-md shadow-md text-sm"
                        >
                            <Rocket className="w-4 h-4 mr-2" /> Join New Room
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}