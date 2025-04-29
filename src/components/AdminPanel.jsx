// ✅ Final AdminPanel.jsx - Fix Remove Only for Creator + Correct SuperAdmin Search

import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../contexts/WalletContext';
import RoomFactoryAbi from '../abis/RoomFactory.json';
import VotingRoomAbi from '../abis/VotingRoom.json';

const ROOM_FACTORY_ADDRESS = "0x5933899C50ab5DB1bCd94B5a8e60aD34f26e06f3";
const ROOMS_PER_PAGE = 10;

export default function AdminPanel({ setPage }) {
    const { account, role } = useWallet();
    const [rooms, setRooms] = useState([]);
    const [superAdmins, setSuperAdmins] = useState([]);
    const [addSuperAdminAddress, setAddSuperAdminAddress] = useState('');
    const [searchAdmin, setSearchAdmin] = useState('');
    const [newCreator, setNewCreator] = useState('');
    const [activeTab, setActiveTab] = useState('room');
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        if (!account) return;
        fetchRooms();
        fetchSuperAdmins();
        const interval = setInterval(() => {
            fetchRooms();
            fetchSuperAdmins();
        }, 15000);
        return () => clearInterval(interval);
    }, [account]);

    const fetchRooms = async () => {
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const factory = new ethers.Contract(ROOM_FACTORY_ADDRESS, RoomFactoryAbi, provider);
            const allRooms = await factory.getRooms();
            const deleted = JSON.parse(localStorage.getItem('deletedRooms') || '[]');

            const roomDetails = await Promise.all(
                allRooms.map(async (room) => {
                    try {
                        const roomContract = new ethers.Contract(room.roomAddress, VotingRoomAbi, provider);
                        const isActive = await roomContract.isActive();
                        return { ...room, isActive };
                    } catch {
                        return { ...room, isActive: false };
                    }
                })
            );

            const activeRooms = roomDetails
                .filter(r => r.isActive && !deleted.includes(r.roomAddress))
                .reverse();

            setRooms(activeRooms);
            setCurrentPage(1);
        } catch (err) {
            console.error('Failed to fetch rooms:', err);
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

    const handleDeactivateAndRemove = async (roomAddress) => {
        if (!window.confirm('Deactivate and remove this room?')) return;
        try {
            setLoading(true);
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            const roomContract = new ethers.Contract(roomAddress, VotingRoomAbi, signer);
            const isActive = await roomContract.isActive();
            if (isActive) {
                const tx = await roomContract.deactivateRoom();
                await tx.wait();
            }
            const deleted = JSON.parse(localStorage.getItem('deletedRooms') || '[]');
            if (!deleted.includes(roomAddress)) {
                deleted.push(roomAddress);
                localStorage.setItem('deletedRooms', JSON.stringify(deleted));
            }
            await fetchRooms();
            alert('Room deactivated and removed successfully!');
        } catch (err) {
            console.error('Failed to deactivate and remove room:', err);
            alert('Failed to deactivate/remove room.');
        } finally {
            setLoading(false);
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

    const clearInputs = () => {
        setAddSuperAdminAddress('');
        setNewCreator('');
    };

    const filteredRooms = rooms.filter(room =>
        room.roomName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        room.roomAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
        room.createdBy.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredSuperAdmins = superAdmins
        .map((addr, idx) => ({
            address: addr,
            isCreator: idx === 0,
        }))
        .filter(({ address }) =>
            address.toLowerCase().includes(searchAdmin.toLowerCase())
        );

    const totalPages = Math.ceil(filteredRooms.length / ROOMS_PER_PAGE);
    const paginatedRooms = filteredRooms.slice(
        (currentPage - 1) * ROOMS_PER_PAGE,
        currentPage * ROOMS_PER_PAGE
    );

    const handlePrev = () => {
        if (currentPage > 1) setCurrentPage(currentPage - 1);
    };

    const handleNext = () => {
        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
    };

    const handleHardReset = async () => {
        if (!window.confirm('⚠️ Are you sure you want to Hard Reset?')) return;
        if (!window.confirm('⚠️ This will wipe all data! Proceed?')) return;
        await handleTx('factoryReset');
    };

    return (
        <div style={{ padding: '2rem' }}>
            <h2>🛠️ Admin Panel</h2>

            <div style={{ marginBottom: '1rem' }}>
                <button onClick={() => setActiveTab('room')} disabled={activeTab === 'room'}>Room Management</button>
                <button onClick={() => setActiveTab('admin')} disabled={activeTab === 'admin'} style={{ marginLeft: '1rem' }}>SuperAdmin Management</button>
                {role === 'creator' && (
                    <button onClick={() => setActiveTab('factory')} disabled={activeTab === 'factory'} style={{ marginLeft: '1rem' }}>Factory Management</button>
                )}
            </div>

            {activeTab === 'room' && (
                <>
                    <div style={{ marginBottom: '1rem' }}>
                        <input
                            type="text"
                            placeholder="Search by Name, Address, Created By"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ padding: '0.5rem', width: '300px' }}
                        />
                    </div>

                    <h3>📋 Rooms ({filteredRooms.length})</h3>

                    {paginatedRooms.length === 0 ? (
                        <p>No rooms found.</p>
                    ) : (
                        paginatedRooms.map((room, idx) => (
                            <div key={idx} style={{ border: '1px solid gray', padding: '1rem', marginBottom: '1rem' }}>
                                <div><strong>Name:</strong> {room.roomName}</div>
                                <div><strong>Address:</strong> {room.roomAddress}</div>
                                <div><strong>Created by:</strong> {room.createdBy}</div>
                                <button
                                    onClick={() => handleDeactivateAndRemove(room.roomAddress)}
                                    style={{ marginTop: '0.5rem', backgroundColor: 'red', color: 'white' }}
                                    disabled={loading}
                                >
                                    Deactivate and Remove Room
                                </button>
                            </div>
                        ))
                    )}

                    <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1rem' }}>
                        <button onClick={handlePrev} disabled={currentPage === 1}>Prev</button>
                        <span>Page {currentPage} of {totalPages}</span>
                        <button onClick={handleNext} disabled={currentPage === totalPages}>Next</button>
                    </div>
                </>
            )}

            {activeTab === 'admin' && (
                <>
                    <h3>👑 SuperAdmin Management</h3>

                    <div style={{ marginBottom: '1rem' }}>
                        <h4>➕ Add SuperAdmin</h4>
                        <input
                            type="text"
                            placeholder="New SuperAdmin Address"
                            value={addSuperAdminAddress}
                            onChange={(e) => setAddSuperAdminAddress(e.target.value)}
                            style={{ marginRight: '1rem' }}
                        />
                        <button onClick={() => handleTx('addSuperAdmin', addSuperAdminAddress)} disabled={loading}>Add</button>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <input
                            type="text"
                            placeholder="Search SuperAdmin Address"
                            value={searchAdmin}
                            onChange={(e) => setSearchAdmin(e.target.value)}
                            style={{ padding: '0.5rem', width: '300px' }}
                        />
                    </div>

                    {filteredSuperAdmins.length === 0 ? (
                        <p>No superadmins found.</p>
                    ) : (
                        <ul>
                            {filteredSuperAdmins.map(({ address, isCreator }, idx) => (
                                <li key={idx} style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    {address} {isCreator && <strong>(Creator)</strong>}
                                    {role === 'creator' && !isCreator && (
                                        <button
                                            onClick={() => handleTx('removeSuperAdmin', address)}
                                            style={{ backgroundColor: 'red', color: 'white' }}
                                            disabled={loading}
                                        >
                                            Remove
                                        </button>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </>
            )}

            {activeTab === 'factory' && role === 'creator' && (
                <>
                    <h3>🏭 Factory Management</h3>

                    <div style={{ marginBottom: '1rem' }}>
                        <h4>🔄 Transfer Creator</h4>
                        <input
                            type="text"
                            placeholder="New Creator Address"
                            value={newCreator}
                            onChange={(e) => setNewCreator(e.target.value)}
                            style={{ marginRight: '1rem' }}
                        />
                        <button onClick={() => handleTx('transferCreator', newCreator)} disabled={loading}>Transfer</button>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <h4>💥 Hard Reset Factory</h4>
                        <button
                            onClick={handleHardReset}
                            style={{ backgroundColor: 'red', color: 'white' }}
                            disabled={loading}
                        >
                            Hard Reset
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
