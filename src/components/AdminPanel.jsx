// AdminPanel.jsx - Final Toast Promise + Alert Popup + Validation
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
import { Settings2, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

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
                const tx = await toast.promise(roomContract.deactivateRoom(), {
                    loading: 'Deactivating room...',
                    success: 'Room deactivated!',
                    error: 'Failed to deactivate room.'
                });
                await tx.wait();
            }
            const deleted = JSON.parse(localStorage.getItem('deletedRooms') || '[]');
            if (!deleted.includes(roomAddress)) {
                deleted.push(roomAddress);
                localStorage.setItem('deletedRooms', JSON.stringify(deleted));
            }
            await fetchRooms();
        } catch (err) {
            console.error('Failed to deactivate and remove room:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleTx = async (method, ...args) => {
        try {
            if (method === 'addSuperAdmin') {
                const alreadyAdded = superAdmins.map(addr => addr.toLowerCase()).includes(args[0].toLowerCase());
                if (alreadyAdded) {
                    toast.error('Address is already a SuperAdmin!');
                    return;
                }
            }

            setLoading(true);
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const factory = new ethers.Contract(ROOM_FACTORY_ADDRESS, RoomFactoryAbi, signer);

            const tx = await toast.promise(
                (async () => {
                    const transaction = await factory[method](...args);
                    await transaction.wait();
                })(),
                {
                    loading: `${method} pending...`,
                    success: `${method} success!`,
                    error: `Failed to ${method}`,
                }
            );

            await fetchRooms();
            await fetchSuperAdmins();
            clearInputs();

            if (method === 'transferCreator') {
                toast.success('Creator transferred!');
                toast('Ownership transferred. You may no longer access Factory tab.', { icon: '⚠️' });
            }
        } catch (err) {
            console.error(`Error during ${method}:`, err);
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
                <button
                    className={`relative inline-flex items-center justify-center px-5 py-2 font-semibold rounded-md border shadow-md transition duration-300 ease-in-out
    ${activeTab === 'room'
                            ? 'text-white bg-gradient-to-b from-indigo-500 to-indigo-600 border-indigo-600 hover:from-indigo-600 hover:to-indigo-700 active:to-indigo-800'
                            : 'text-gray-800 bg-gradient-to-b from-gray-100 to-gray-200 border-gray-300 hover:from-gray-200 hover:to-gray-300 active:to-gray-400'}`}
                    onClick={() => setActiveTab('room')}
                >
                    Room Management
                </button>

                <button
                    className={`relative inline-flex items-center justify-center px-5 py-2 font-semibold rounded-md border shadow-md transition duration-300 ease-in-out
    ${activeTab === 'admin'
                            ? 'text-white bg-gradient-to-b from-indigo-500 to-indigo-600 border-indigo-600 hover:from-indigo-600 hover:to-indigo-700 active:to-indigo-800'
                            : 'text-gray-800 bg-gradient-to-b from-gray-100 to-gray-200 border-gray-300 hover:from-gray-200 hover:to-gray-300 active:to-gray-400'}`}
                    onClick={() => setActiveTab('admin')}
                >
                    SuperAdmin Management
                </button>

                {role === 'creator' && (
                    <button
                        className={`relative inline-flex items-center justify-center px-5 py-2 font-semibold rounded-md border shadow-md transition duration-300 ease-in-out
    ${activeTab === 'factory'
                                ? 'text-white bg-gradient-to-b from-indigo-500 to-indigo-600 border-indigo-600 hover:from-indigo-600 hover:to-indigo-700 active:to-indigo-800'
                                : 'text-gray-800 bg-gradient-to-b from-gray-100 to-gray-200 border-gray-300 hover:from-gray-200 hover:to-gray-300 active:to-gray-400'}`}
                        onClick={() => setActiveTab('factory')}
                    >
                        Factory Management
                    </button>

                )}
                <button
                    onClick={async () => {
                        setLoading(true);
                        await Promise.all([fetchRooms(), fetchSuperAdmins()]);
                        setLoading(false);
                    }}
                    className="relative inline-flex items-center justify-center px-4 py-2 font-semibold text-white bg-gradient-to-b from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 active:to-indigo-800 border border-indigo-600 rounded-md shadow-md transition duration-300 ease-in-out disabled:opacity-50"
                    disabled={loading}
                >
                    <RefreshCw className={`w-5 h-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                    {/* {loading ? (
                        <RefreshCw className="animate-spin w-5 h-5" />
                    ) : (
                        <>
                            <RefreshCw className={`w-5 h-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </>
                    )} */}
                </button>


                {/* <button
                    onClick={fetchRooms}
                    disabled={loading}
                    className="relative inline-flex items-center justify-center px-4 py-2 font-semibold text-white bg-gradient-to-b from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 active:to-indigo-800 border border-indigo-600 rounded-md shadow-md transition duration-300 ease-in-out disabled:opacity-50"
                >
                    <RefreshCw className={`w-5 h-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button> */}

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
                                    className="mt-2 inline-flex items-center justify-center px-4 py-2 font-semibold text-white bg-gradient-to-b from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 active:to-red-800 border border-red-600 rounded-md shadow-md text-sm"
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
                            <button onClick={() => handleTx('addSuperAdmin', addSuperAdminAddress)} disabled={loading} className="inline-flex items-center justify-center px-4 py-2 font-semibold text-white bg-gradient-to-b from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 active:to-indigo-800 border border-indigo-600 rounded-md shadow-md text-sm"
                            >
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
                                        className="inline-flex items-center justify-center px-4 py-2 font-semibold text-white bg-gradient-to-b from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 active:to-red-800 border border-red-600 rounded-md shadow-md text-sm"

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
                        <button onClick={() => handleTx('transferCreator', newCreator)} disabled={loading} className="inline-flex items-center justify-center px-4 py-2 font-semibold text-white bg-gradient-to-b from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 active:to-indigo-800 border border-indigo-600 rounded-md shadow-md text-sm"
                        >
                            Transfer
                        </button>
                    </div>

                    <button onClick={handleHardReset} className="gap-2 inline-flex items-center justify-center px-4 py-2 font-semibold text-white bg-gradient-to-b from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 active:to-red-800 border border-red-600 rounded-md shadow-md text-sm">
                        <ExclamationTriangleIcon className="w-5 h-5" />
                        Hard Reset Factory
                    </button>


                    {/* <button
                        onClick={handleHardReset}
                        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 flex items-center gap-2"
                        disabled={loading}
                    >
                        <ExclamationTriangleIcon className="w-5 h-5" />
                        Hard Reset Factory
                    </button> */}
                </>
            )}
        </div>
    );
}
