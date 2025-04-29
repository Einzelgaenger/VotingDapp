import { useState } from 'react';
import { ethers } from 'ethers';
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
        if (!roomName || !description || !maxVoters) {
            alert('Please fill all fields');
            return;
        }

        if (isNaN(maxVoters) || Number(maxVoters) <= 0) { // 🔥 tambah validasi
            alert('Max voters must be greater than 0');
            return;
        }

        try {
            setLoading(true);
            setTxHash(null);
            setNewRoomAddress(null);

            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            const roomFactory = new ethers.Contract(ROOM_FACTORY_ADDRESS, RoomFactoryAbi, signer);

            const tx = await roomFactory.createRoom(roomName, description, maxVoters);
            const receipt = await tx.wait();

            setTxHash(tx.hash);
            alert('Room created successfully!');

            const event = receipt.events.find((e) => e.event === "RoomCreated");
            if (event) {
                const roomAddress = event.args.roomAddress;
                console.log("New Room Address:", roomAddress);
                setNewRoomAddress(roomAddress);
            } else {
                console.warn('RoomCreated event not found in tx receipt');
            }

        } catch (error) {
            console.error('Error creating room:', error);
            alert('Failed to create room. See console for details.');
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
        <div style={{ padding: '2rem' }}>
            <h2>Create a Voting Room</h2>

            <div style={{ display: 'flex', flexDirection: 'column', width: '300px', gap: '1rem' }}>
                <input
                    type="text"
                    placeholder="Room Name"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                />
                <textarea
                    placeholder="Room Description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                />
                <input
                    type="number"
                    placeholder="Max Voters"
                    value={maxVoters}
                    onChange={(e) => setMaxVoters(e.target.value)}
                />
                <button onClick={handleCreateRoom} disabled={loading}>
                    {loading ? 'Creating Room...' : 'Create Room'}
                </button>

                {txHash && (
                    <div style={{ marginTop: '1rem' }}>
                        <strong>Transaction Hash:</strong> <br />
                        <a href={`https://sepolia.etherscan.io/tx/${txHash}`} target="_blank" rel="noopener noreferrer">
                            {txHash}
                        </a>
                    </div>
                )}

                {newRoomAddress && (
                    <div style={{ marginTop: '1rem' }}>
                        <button onClick={handleJoinNewRoom} style={{ backgroundColor: 'green', color: 'white' }}>
                            🚀 Join New Room
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
