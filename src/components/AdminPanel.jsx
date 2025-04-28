import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import RoomFactoryAbi from '../abis/RoomFactory.json';
import { useWallet } from '../contexts/WalletContext';

const ROOM_FACTORY_ADDRESS = "0x5933899C50ab5DB1bCd94B5a8e60aD34f26e06f3";

export default function AdminPanel({ setPage }) {
    const { account } = useWallet();
    const [tab, setTab] = useState('room'); // 'room' or 'admin'
    const [rooms, setRooms] = useState([]);
    const [superAdmins, setSuperAdmins] = useState([]);
    const [creator, setCreator] = useState('');
    const [newAdminAddress, setNewAdminAddress] = useState('');
    const [newCreatorAddress, setNewCreatorAddress] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchFactoryData();
    }, []);

    const fetchFactoryData = async () => {
        try {
            setLoading(true);
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const factory = new ethers.Contract(ROOM_FACTORY_ADDRESS, RoomFactoryAbi, provider);

            const [creatorAddr, superAdminsRaw, roomsRaw] = await Promise.all([
                factory.creator(),
                factory.getSuperAdmins(),
                factory.getRooms()
            ]);

            setCreator(creatorAddr);
            setSuperAdmins(superAdminsRaw);
            setRooms(roomsRaw);
        } catch (error) {
            console.error('Failed to load factory data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleTx = async (method, ...args) => {
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            const factory = new ethers.Contract(ROOM_FACTORY_ADDRESS, RoomFactoryAbi, signer);

            const tx = await factory[method](...args);
            await tx.wait();
            alert(`${method} success!`);
            fetchFactoryData();
        } catch (error) {
            console.error(`Error during ${method}:`, error);
            alert(`Failed to ${method}`);
        }
    };

    const handleDeleteRoom = (index) => {
        if (window.confirm('Are you sure to deactivate and delete this room?')) {
            handleTx('deactivateAndDeleteRoom', index);
        }
    };

    const handleFactoryReset = () => {
        if (window.confirm('⚠️ WARNING: This will deactivate and delete all rooms! Continue?')) {
            handleTx('factoryReset');
        }
    };

    const handleAddSuperAdmin = () => {
        if (!newAdminAddress) {
            alert('Please input an address.');
            return;
        }
        handleTx('addSuperAdmin', newAdminAddress);
    };

    const handleRemoveSuperAdmin = (addressToRemove) => {
        if (window.confirm(`Remove SuperAdmin ${addressToRemove}?`)) {
            handleTx('removeSuperAdmin', addressToRemove);
        }
    };

    const handleTransferCreator = () => {
        if (!newCreatorAddress) {
            alert('Please input new creator address.');
            return;
        }
        if (window.confirm(`Are you sure to transfer creator role to ${newCreatorAddress}?`)) {
            handleTx('transferCreator', newCreatorAddress);
        }
    };

    if (loading) return <div style={{ padding: '2rem' }}>Loading admin panel...</div>;

    return (
        <div style={{ padding: '2rem' }}>
            <h2>🛠️ Admin Panel</h2>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <button onClick={() => setTab('room')} disabled={tab === 'room'}>🏠 Room Management</button>
                <button onClick={() => setTab('admin')} disabled={tab === 'admin'}>🛡️ Admin Management</button>
            </div>

            {tab === 'room' && (
                <>
                    <h3>🏠 Room Management</h3>

                    {rooms.length === 0 ? (
                        <p>No rooms created yet.</p>
                    ) : (
                        rooms.map((room, idx) => (
                            <div key={idx} style={{ border: '1px solid #aaa', padding: '1rem', marginBottom: '1rem' }}>
                                <strong>Room Name:</strong> {room.roomName} <br />
                                <strong>Room Address:</strong> {room.roomAddress} <br />
                                <strong>Created By:</strong> {room.createdBy} <br />
                                <button onClick={() => handleDeleteRoom(idx)} style={{ marginTop: '0.5rem', backgroundColor: 'red', color: 'white' }}>
                                    Deactivate & Delete Room
                                </button>
                            </div>
                        ))
                    )}

                    <div style={{ marginTop: '2rem' }}>
                        <button onClick={handleFactoryReset} style={{ backgroundColor: 'red', color: 'white' }}>
                            ⚡ Factory Reset All Rooms
                        </button>
                    </div>
                </>
            )}

            {tab === 'admin' && (
                <>
                    <h3>🛡️ Admin Management</h3>

                    <h4>Current Creator</h4>
                    <p>{creator}</p>

                    <h4>SuperAdmins</h4>
                    <ul>
                        {/* Creator always on top */}
                        {[creator, ...superAdmins.filter(addr => addr.toLowerCase() !== creator.toLowerCase())].map((admin, idx) => (
                            <li key={idx} style={{ marginBottom: '0.5rem' }}>
                                {admin}
                                {admin.toLowerCase() !== creator.toLowerCase() && (
                                    <button onClick={() => handleRemoveSuperAdmin(admin)} style={{ marginLeft: '1rem' }}>
                                        ❌ Remove
                                    </button>
                                )}
                                {admin.toLowerCase() === creator.toLowerCase() && <span> (Creator)</span>}
                            </li>
                        ))}
                    </ul>

                    <div style={{ marginTop: '2rem' }}>
                        <input
                            type="text"
                            placeholder="New SuperAdmin Address"
                            value={newAdminAddress}
                            onChange={(e) => setNewAdminAddress(e.target.value)}
                            style={{ marginRight: '1rem' }}
                        />
                        <button onClick={handleAddSuperAdmin}>
                            ➕ Add SuperAdmin
                        </button>
                    </div>

                    <div style={{ marginTop: '2rem' }}>
                        <input
                            type="text"
                            placeholder="New Creator Address"
                            value={newCreatorAddress}
                            onChange={(e) => setNewCreatorAddress(e.target.value)}
                            style={{ marginRight: '1rem' }}
                        />
                        <button onClick={handleTransferCreator} style={{ backgroundColor: 'gold' }}>
                            👑 Transfer Creator
                        </button>
                    </div>
                </>
            )}

            <div style={{ marginTop: '2rem' }}>
                <button onClick={() => setPage('myrooms')}>Back to My Rooms</button>
            </div>
        </div>
    );
}
