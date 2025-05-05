// ✅ AdminPanel.jsx - Clean UI + Valid Heroicons + Manual Refresh

import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../contexts/WalletContext';
import RoomFactoryAbi from '../abis/RoomFactory.json';
import VotingRoomAbi from '../abis/VotingRoom.json';
import {
    ClipboardDocumentListIcon,
    UserGroupIcon,
    Cog6ToothIcon,
    ArrowPathIcon,
    ExclamationTriangleIcon
} from "@heroicons/react/24/outline";
import { Settings2 } from 'lucide-react';
import { RefreshCw } from 'lucide-react';

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
    }, [account]);

    const fetchRooms = async () => {
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const factory = new ethers.Contract(ROOM_FACTORY_ADDRESS, RoomFactoryAbi, provider);
            const allRooms = await factory.getRooms();
            const deleted = JSON.parse(localStorage.getItem('deletedRooms') || '[]');

            const roomDetails = await Promise.all(
                allRooms.map(async (room) => {
                    const { roomAddress, roomName, description, createdBy } = room;
                    try {
                        const roomContract = new ethers.Contract(roomAddress, VotingRoomAbi, provider);
                        const isActive = await roomContract.isActive();
                        return { roomAddress, roomName, description, createdBy, isActive };
                    } catch {
                        return { roomAddress, roomName, description, createdBy, isActive: true };
                    }
                })
            );

            const activeRooms = roomDetails.filter(r => r.isActive && !deleted.includes(r.roomAddress)).reverse();
            setRooms(activeRooms);
            setCurrentPage(1);
        } catch (err) {
            console.error('Failed to fetch rooms:', err);
        }
    };

    const fetchSuperAdmins = async () => {
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
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
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
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
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
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

    const filteredRooms = rooms.filter((room) =>
        (room.roomName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (room.roomAddress?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (room.createdBy?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    const filteredSuperAdmins = superAdmins
        .map((addr, idx) => ({ address: addr, isCreator: idx === 0 }))
        .filter(({ address }) => address.toLowerCase().includes(searchAdmin.toLowerCase()));

    const totalPages = Math.ceil(filteredRooms.length / ROOMS_PER_PAGE);
    const paginatedRooms = filteredRooms.slice((currentPage - 1) * ROOMS_PER_PAGE, currentPage * ROOMS_PER_PAGE);

    const handlePrev = () => currentPage > 1 && setCurrentPage(currentPage - 1);
    const handleNext = () => currentPage < totalPages && setCurrentPage(currentPage + 1);

    const handleHardReset = async () => {
        if (!window.confirm('⚠️ Are you sure you want to Hard Reset?')) return;
        if (!window.confirm('⚠️ This will wipe all data! Proceed?')) return;
        await handleTx('factoryReset');
    };

    return (
        <div className="px-6 py-10 max-w-5xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2 text-gray-800">
                <Settings2 className="w-6 h-6 text-indigo-500" />
                Admin Panel
            </h1>

            <div className="flex flex-wrap gap-4 mb-6">
                <button className={`px-4 py-2 rounded ${activeTab === 'room' ? 'bg-indigo-500 text-white' : 'bg-gray-100'}`} onClick={() => setActiveTab('room')}>
                    Room Management
                </button>
                <button className={`px-4 py-2 rounded ${activeTab === 'admin' ? 'bg-indigo-500 text-white' : 'bg-gray-100'}`} onClick={() => setActiveTab('admin')}>
                    SuperAdmin Management
                </button>
                {role === 'creator' && (
                    <button className={`px-4 py-2 rounded ${activeTab === 'factory' ? 'bg-indigo-500 text-white' : 'bg-gray-100'}`} onClick={() => setActiveTab('factory')}>
                        Factory Management
                    </button>
                )}
                <button
                    onClick={async () => {
                        setLoading(true);
                        await Promise.all([fetchRooms(), fetchSuperAdmins()]);
                        setLoading(false);
                    }}
                    className="ml-auto flex items-center gap-2 bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600 disabled:opacity-50"
                    disabled={loading}
                >
                    {loading ? (
                        <RefreshCw className="animate-spin w-5 h-5" />
                    ) : (
                        <>
                            <RefreshCw className="w-5 h-5" />
                            Refresh
                        </>
                    )}
                </button>
            </div>

            {activeTab === 'room' && (
                <>
                    <input
                        type="text"
                        placeholder="Search by Name, Address, Created By"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="mb-4 w-full px-4 py-2 border rounded"
                    />

                    <h2 className="font-semibold mb-2 flex items-center gap-2">
                        <ClipboardDocumentListIcon className="w-5 h-5" />
                        Rooms ({filteredRooms.length})
                    </h2>

                    {paginatedRooms.length === 0 ? (
                        <p>No rooms found.</p>
                    ) : (
                        paginatedRooms.map((room, idx) => (
                            <div key={idx} className="border rounded p-4 mb-4 shadow-sm">
                                <div><strong>Name:</strong> {room.roomName}</div>
                                <div><strong>Address:</strong> {room.roomAddress}</div>
                                <div><strong>Created by:</strong> {room.createdBy}</div>
                                <button
                                    onClick={() => handleDeactivateAndRemove(room.roomAddress)}
                                    className="mt-2 bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                                    disabled={loading}
                                >
                                    Deactivate and Remove Room
                                </button>
                            </div>
                        ))
                    )}

                    <div className="flex justify-center items-center gap-4 mt-4">
                        <button onClick={handlePrev} disabled={currentPage === 1} className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50">Prev</button>
                        <span>Page {currentPage} of {totalPages}</span>
                        <button onClick={handleNext} disabled={currentPage === totalPages} className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50">Next</button>
                    </div>
                </>
            )}

            {activeTab === 'admin' && (
                <>
                    <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
                        <UserGroupIcon className="w-5 h-5" />
                        SuperAdmin Management
                    </h2>

                    {role === 'creator' && (
                        <div className="mb-4 flex gap-2">
                            <input
                                type="text"
                                placeholder="New SuperAdmin Address"
                                value={addSuperAdminAddress}
                                onChange={(e) => setAddSuperAdminAddress(e.target.value)}
                                className="flex-1 px-4 py-2 border rounded"
                            />
                            <button onClick={() => handleTx('addSuperAdmin', addSuperAdminAddress)} disabled={loading} className="bg-indigo-500 text-white px-4 rounded">
                                Add
                            </button>
                        </div>
                    )}

                    <input
                        type="text"
                        placeholder="Search SuperAdmin Address"
                        value={searchAdmin}
                        onChange={(e) => setSearchAdmin(e.target.value)}
                        className="mb-4 w-full px-4 py-2 border rounded"
                    />

                    <ul>
                        {filteredSuperAdmins.map(({ address, isCreator }, idx) => (
                            <li key={idx} className="mb-2 flex items-center justify-between">
                                <span>{address} {isCreator && <strong>(Creator)</strong>}</span>
                                {role === 'creator' && !isCreator && (
                                    <button
                                        onClick={() => handleTx('removeSuperAdmin', address)}
                                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                                        disabled={loading}
                                    >
                                        Remove
                                    </button>
                                )}
                            </li>
                        ))}
                    </ul>
                </>
            )}

            {activeTab === 'factory' && role === 'creator' && (
                <>
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Cog6ToothIcon className="w-5 h-5" />
                        Factory Management
                    </h2>

                    <div className="mb-4 flex gap-2">
                        <input
                            type="text"
                            placeholder="New Creator Address"
                            value={newCreator}
                            onChange={(e) => setNewCreator(e.target.value)}
                            className="flex-1 px-4 py-2 border rounded"
                        />
                        <button onClick={() => handleTx('transferCreator', newCreator)} disabled={loading} className="bg-indigo-500 text-white px-4 rounded">
                            Transfer
                        </button>
                    </div>

                    <button
                        onClick={handleHardReset}
                        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 flex items-center gap-2"
                        disabled={loading}
                    >
                        <ExclamationTriangleIcon className="w-5 h-5" />
                        Hard Reset Factory
                    </button>
                </>
            )}
        </div>
    );
}
