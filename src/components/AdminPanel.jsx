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
        <div className="min-h-[calc(100vh-80px)] pt-5 pb-12 px-4 flex justify-center relative">
            <div className="section-container max-w-7xl w-full">
                <div className="text-center mb-8">
                    <h2 className="text-3xl md:text-4xl font-exo font-semibold tracking-wide flex justify-center items-center gap-2">
                        <Settings2 className="w-7 h-7 icon" />
                        Admin Panel
                    </h2>
                </div>

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                    <div className="flex gap-3 justify-center md:justify-start">
                        {['room', 'admin', 'factory'].map(tab =>
                            (tab !== 'factory' || role === 'creator') && (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={activeTab === tab ? 'btn-primary' : 'btn-gray'}
                                >
                                    {tab === 'room' ? 'Room Management' :
                                        tab === 'admin' ? 'SuperAdmin Management' : 'Factory Management'}
                                </button>
                            )
                        )}
                    </div>

                    <div className="flex gap-3 justify-center md:justify-end">
                        <button
                            onClick={async () => {
                                setLoading(true);
                                await Promise.all([fetchRooms(), fetchSuperAdmins()]);
                                setLoading(false);
                            }}
                            className="btn-primary"
                            disabled={loading}
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />

                        </button>

                    </div>
                </div>

                {activeTab === 'room' && (
                    <>
                        <input
                            type="text"
                            placeholder="Search by Name, Address, Created By"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="input mb-4"
                        />

                        <h2 className="font-semibold mb-2 flex items-center gap-2 metadata">
                            <ClipboardDocumentListIcon className="w-5 h-5" />
                            Rooms ({filteredRooms.length})
                        </h2>

                        {paginatedRooms.length === 0 ? (
                            <p className="metadata">No rooms found.</p>
                        ) : (
                            paginatedRooms.map((room, idx) => (
                                <div key={idx} className="card p-4 mb-4 shadow-sm">
                                    <div><strong>Name:</strong> {room.roomName}</div>
                                    <div><strong>Address:</strong> {room.roomAddress}</div>
                                    <div><strong>Created by:</strong> {room.createdBy}</div>
                                    <button
                                        onClick={() => handleDeactivateAndRemove(room.roomAddress)}
                                        className="mt-2 btn-danger text-sm"
                                        disabled={loading}
                                    >
                                        Deactivate and Remove Room
                                    </button>
                                </div>
                            ))
                        )}

                        <div className="flex justify-center items-center gap-4 mt-4">
                            <button onClick={handlePrev} disabled={currentPage === 1} className="btn-gray">Prev</button>
                            <span className="metadata">Page {currentPage} of {totalPages}</span>
                            <button onClick={handleNext} disabled={currentPage === totalPages} className="btn-gray">Next</button>
                        </div>
                    </>
                )}

                {activeTab === 'admin' && (
                    <>
                        <h2 className="text-lg font-semibold mb-2 flex items-center gap-2 metadata">
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
                                    className="input flex-1"
                                />
                                <button
                                    onClick={() => handleTx('addSuperAdmin', addSuperAdminAddress)}
                                    disabled={loading}
                                    className="btn-primary text-sm"
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
                            className="input mb-4"
                        />

                        <ul>
                            {filteredSuperAdmins.map(({ address, isCreator }, idx) => (
                                <li key={idx} className="mb-2 flex items-center justify-between metadata">
                                    <span>{address} {isCreator && <strong>(Creator)</strong>}</span>
                                    {role === 'creator' && !isCreator && (
                                        <button
                                            onClick={() => handleTx('removeSuperAdmin', address)}
                                            className="btn-danger text-sm"
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
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 metadata">
                            <Cog6ToothIcon className="w-5 h-5" />
                            Factory Management
                        </h2>

                        <div className="mb-4 flex gap-2">
                            <input
                                type="text"
                                placeholder="New Creator Address"
                                value={newCreator}
                                onChange={(e) => setNewCreator(e.target.value)}
                                className="input flex-1"
                            />
                            <button
                                onClick={() => handleTx('transferCreator', newCreator)}
                                disabled={loading}
                                className="btn-primary text-sm"
                            >
                                Transfer
                            </button>
                        </div>

                        <button onClick={handleHardReset} className="btn-danger text-sm flex items-center gap-2">
                            <ExclamationTriangleIcon className="w-5 h-5" />
                            Hard Reset Factory
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
