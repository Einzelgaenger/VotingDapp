import { useState } from 'react';
import { BrowserProvider, Contract } from 'ethers';
import { useWallet } from '../contexts/WalletContext';
import RoomFactoryAbi from '../abis/RoomFactory.json';

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
        <div className="min-h-screen bg-gray-50 text-gray-800 px-4 py-12">
            <h2 className="text-3xl font-bold mb-6">Create a Voting Room</h2>

            <div className="max-w-md space-y-4">
                <input
                    type="text"
                    placeholder="Room Name"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />

                <textarea
                    placeholder="Room Description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />

                <input
                    type="number"
                    placeholder="Max Voters"
                    value={maxVoters}
                    onChange={(e) => setMaxVoters(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />

                <button
                    onClick={handleCreateRoom}
                    disabled={loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition"
                >
                    {loading ? 'Creating Room...' : 'Create Room'}
                </button>

                {txHash && (
                    <div className="text-sm text-gray-600 mt-4">
                        <strong>Tx Hash:</strong>{' '}
                        <a href={`https://sepolia.etherscan.io/tx/${txHash}`} target="_blank" rel="noreferrer" className="text-blue-600 underline">
                            {txHash}
                        </a>
                    </div>
                )}

                {newRoomAddress && (
                    <button
                        onClick={handleJoinNewRoom}
                        className="w-full mt-2 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition"
                    >
                        🚀 Join New Room
                    </button>
                )}
            </div>
        </div>
    );
}
