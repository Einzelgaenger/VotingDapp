// Updated AdminPanel.jsx

import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../contexts/WalletContext';
import RoomFactoryAbi from '../abis/RoomFactory.json';

const ROOM_FACTORY_ADDRESS = "0x5933899C50ab5DB1bCd94B5a8e60aD34f26e06f3";

export default function AdminPanel({ setPage }) {
    const { account, role } = useWallet();
    const [rooms, setRooms] = useState([]);
    const [superAdmins, setSuperAdmins] = useState([]);
    const [addSuperAdminAddress, setAddSuperAdminAddress] = useState('');
    const [removeSuperAdminAddress, setRemoveSuperAdminAddress] = useState('');
    const [newCreator, setNewCreator] = useState('');
    const [activeTab, setActiveTab] = useState('room');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (account) {
            fetchRooms();
            fetchSuperAdmins();
        }
    }, [account]);

    const fetchRooms = async () => {
        try {
            setLoading(true);
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const factory = new ethers.Contract(ROOM_FACTORY_ADDRESS, RoomFactoryAbi, provider);
            const allRooms = await factory.getRooms();
            setRooms(allRooms.reverse()); // 🔥 Urutkan dari newest
        } catch (err) {
            console.error('Failed to fetch rooms:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchSuperAdmins = async () => {
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const factory = new ethers.Contract(ROOM_FACTORY_ADDRESS, RoomFactoryAbi, provider);
            const admins = await factory.getSuperAdmins();
            setSuperAdmins(admins);
        } catch (err) {
            console.error('Failed to fetch superadmins:', err);
        }
    };

    const handleTx = async (method, ...args) => {
        try {
            setLoading(true);
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            const factory = new ethers.Contract(ROOM_FACTORY_ADDRESS, RoomFactoryAbi, signer);
            const tx = await factory[method](...args);
            await tx.wait();
            alert(`${method} success!`);
            await fetchRooms();
            await fetchSuperAdmins();
            clearInputs();
        } catch (err) {
            console.error(`Error during ${method}:`, err);
            alert(`Failed to ${method}`);
        } finally {
            setLoading(false);
        }
    };

    const handleAddSuperAdmin = async () => {
        if (!addSuperAdminAddress) {
            alert('Please enter an address.');
            return;
        }

        const lowerAddress = addSuperAdminAddress.toLowerCase();
        const isAlreadySuperAdmin = superAdmins.some(addr => addr.toLowerCase() === lowerAddress);

        if (isAlreadySuperAdmin) {
            alert('This address is already a super admin.');
            return;
        }

        await handleTx('addSuperAdmin', addSuperAdminAddress);
    };

    const handleRemoveSuperAdmin = async () => {
        if (!removeSuperAdminAddress) {
            alert('Please enter an address.');
            return;
        }

        const lowerAddress = removeSuperAdminAddress.toLowerCase();
        const isSuperAdmin = superAdmins.some(addr => addr.toLowerCase() === lowerAddress);

        if (!isSuperAdmin) {
            alert('This address is not a current super admin.');
            return;
        }

        await handleTx('removeSuperAdmin', removeSuperAdminAddress);
    };

    const clearInputs = () => {
        setAddSuperAdminAddress('');
        setRemoveSuperAdminAddress('');
        setNewCreator('');
    };

    return (
        <div style={{ padding: '2rem' }}>
            <h2>🛠️ Admin Panel</h2>

            <div style={{ marginBottom: '1rem' }}>
                <button onClick={() => setActiveTab('room')} disabled={activeTab === 'room'}>
                    Room Management
                </button>
                <button onClick={() => setActiveTab('admin')} disabled={activeTab === 'admin'} style={{ marginLeft: '1rem' }}>
                    Admin Management
                </button>
            </div>

            {activeTab === 'room' && (
                <>
                    <h3>📋 Rooms</h3>
                    {rooms.length === 0 ? (
                        <p>No rooms created yet.</p>
                    ) : (
                        rooms.map((room, idx) => (
                            <div key={idx} style={{ border: '1px solid gray', padding: '1rem', marginBottom: '1rem' }}>
                                <div><strong>Name:</strong> {room.roomName}</div>
                                <div><strong>Address:</strong> {room.roomAddress}</div>
                                <div><strong>Created by:</strong> {room.createdBy}</div>
                            </div>
                        ))
                    )}
                </>
            )}

            {activeTab === 'admin' && (
                <>
                    <h3>👑 Admin Management</h3>

                    <div>
                        <h4>🧙 Super Admins</h4>
                        {superAdmins.length === 0 ? (
                            <p>No superadmins yet.</p>
                        ) : (
                            <ul>
                                {superAdmins.map((addr, idx) => (
                                    <li key={idx}>
                                        {addr} {idx === 0 && <strong>(Creator)</strong>}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {role === 'creator' && (
                        <>
                            <div style={{ marginTop: '1rem' }}>
                                <h4>➕ Add SuperAdmin</h4>
                                <input
                                    type="text"
                                    placeholder="Address"
                                    value={addSuperAdminAddress}
                                    onChange={(e) => setAddSuperAdminAddress(e.target.value)}
                                />
                                <button onClick={handleAddSuperAdmin} disabled={loading}>Add</button>
                            </div>

                            <div style={{ marginTop: '1rem' }}>
                                <h4>➖ Remove SuperAdmin</h4>
                                <input
                                    type="text"
                                    placeholder="Address"
                                    value={removeSuperAdminAddress}
                                    onChange={(e) => setRemoveSuperAdminAddress(e.target.value)}
                                />
                                <button onClick={handleRemoveSuperAdmin} disabled={loading}>Remove</button>
                            </div>

                            <div style={{ marginTop: '1rem' }}>
                                <h4>🔄 Transfer Creator</h4>
                                <input
                                    type="text"
                                    placeholder="New Creator Address"
                                    value={newCreator}
                                    onChange={(e) => setNewCreator(e.target.value)}
                                />
                                <button onClick={() => handleTx('transferCreator', newCreator)} disabled={loading}>Transfer Creator</button>
                            </div>

                            <div style={{ marginTop: '1rem' }}>
                                <h4>💥 Hard Reset</h4>
                                <button
                                    style={{ backgroundColor: 'red', color: 'white' }}
                                    onClick={() => {
                                        if (window.confirm('Are you sure to perform Hard Reset? This will clear rooms and reset admins.')) {
                                            handleTx('factoryReset');
                                        }
                                    }}
                                    disabled={loading}
                                >
                                    Hard Reset
                                </button>
                            </div>
                        </>
                    )}
                </>
            )}

            <div style={{ marginTop: '2rem' }}>
                <button onClick={() => setPage('create')}>Back to Home</button>
            </div>
        </div>
    );
}
