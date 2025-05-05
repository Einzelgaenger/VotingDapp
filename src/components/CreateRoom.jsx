import { useState } from 'react';
import { BrowserProvider, Contract } from 'ethers';
import { useWallet } from '../contexts/WalletContext';
import RoomFactoryAbi from '../abis/RoomFactory.json';
import { Loader2, Rocket } from 'lucide-react';

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
            alert('Please fill all fields correctly.');
            return;
        }

        try {
            setLoading(true);
            setTxHash(null);
            setNewRoomAddress(null);

            const provider = new BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const roomFactory = new Contract(ROOM_FACTORY_ADDRESS, RoomFactoryAbi, signer);

            const tx = await roomFactory.createRoom(roomName, description, maxVoters);
            const receipt = await tx.wait();

            setTxHash(tx.hash);
            alert('Room created successfully!');

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
            alert('Failed to create room.');
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
        <div className="px-6 py-10 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2 text-indigo-600">
                <ClipboardListIcon className="w-6 h-6 text-indigo-600" />
                Create a Voting Room
            </h1>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">Room Name</label>
                    <input
                        type="text"
                        placeholder="Enter room name"
                        value={roomName}
                        onChange={(e) => setRoomName(e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">Room Description</label>
                    <textarea
                        placeholder="Describe your room purpose..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={4}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">Max Voters</label>
                    <input
                        type="number"
                        placeholder="e.g. 100"
                        value={maxVoters}
                        onChange={(e) => setMaxVoters(e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>

                <button
                    onClick={handleCreateRoom}
                    disabled={loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" /> Creating...
                        </>
                    ) : (
                        'Create Room'
                    )}
                </button>

                {txHash && (
                    <div className="text-sm text-gray-600">
                        <strong>Tx Hash:</strong>{' '}
                        <a href={`https://sepolia.etherscan.io/tx/${txHash}`} target="_blank" rel="noreferrer" className="text-blue-600 underline break-all">
                            {txHash}
                        </a>
                    </div>
                )}

                {newRoomAddress && (
                    <button
                        onClick={handleJoinNewRoom}
                        className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
                    >
                        <Rocket size={18} /> Join New Room
                    </button>
                )}
            </div>
        </div>
    );
}

// Optional icon, or replace with Heroicons if preferred
function ClipboardListIcon(props) {
    return (
        <svg {...props} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5h6m2 2a2 2 0 012 2v10a2 2 0 01-2 2H7a2 2 0 01-2-2V9a2 2 0 012-2h10zm-3 4H9m6 4H9" />
        </svg>
    );
}
