import { useState, useEffect } from 'react';
import { BrowserProvider, Contract } from 'ethers';
import { Loader2, Plus, Rocket, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import RoomFactoryAbi from '../abis/RoomFactory.json';

const ROOM_FACTORY_ADDRESS = "0x5933899C50ab5DB1bCd94B5a8e60aD34f26e06f3";

export default function CreateRoom({ setPage, setActiveRoomAddress }) {
    const [roomName, setRoomName] = useState('');
    const [roomDesc, setRoomDesc] = useState('');
    const [voterCount, setVoterCount] = useState('');
    const [creating, setCreating] = useState(false);
    const [txHash, setTxHash] = useState(null);
    const [localTime, setLocalTime] = useState('');
    const [newRoomAddress, setNewRoomAddress] = useState(null);


    useEffect(() => {
        const updateTime = () => {
            const time = new Date().toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
                timeZone: 'Asia/Jakarta',
            });
            setLocalTime(time);
        };
        updateTime();
        const interval = setInterval(updateTime, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleCreate = async (e) => {
        e.preventDefault();

        if (!roomName.trim()) return toast.error('Room name is required');
        if (!voterCount || parseInt(voterCount) <= 0) return toast.error('Number of voters must be greater than 0');

        try {
            setCreating(true);
            const provider = new BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const roomFactory = new Contract(ROOM_FACTORY_ADDRESS, RoomFactoryAbi, signer);

            toast.loading('Creating room...');
            const tx = await roomFactory.createRoom(roomName, roomDesc, parseInt(voterCount));
            setTxHash(tx.hash);

            const receipt = await tx.wait();

            const event = receipt.logs.map(log => {
                try {
                    return roomFactory.interface.parseLog(log);
                } catch {
                    return null;
                }
            }).find(e => e && e.name === "RoomCreated");

            toast.dismiss();
            toast.success('Room created!');

            if (event) {
                const roomAddress = event.args.roomAddress;
                setNewRoomAddress(roomAddress); // ✅ simpan alamat untuk tombol "Join"
            }
        } catch (err) {
            console.error(err);
            toast.error('Failed to create room');
        } finally {
            setCreating(false);
        }
    };
    const handleJoinNewRoom = () => {
        if (newRoomAddress) {
            setActiveRoomAddress(newRoomAddress);
            setPage('roominteract');
        }
    };


    return (
        <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center px-4 relative">
            <div className="section-container flex-grow flex items-center justify-center">
                <div className="card max-w-xl w-full px-6 py-8 md:px-10 md:py-12">
                    <div className="flex items-center justify-center gap-3 mb-6">
                        <Plus className="w-8 h-8 icon" />
                        <h2 className="text-3xl md:text-4xl font-exo font-semibold tracking-wide">
                            Create Voting Room
                        </h2>
                    </div>

                    <form onSubmit={handleCreate} className="space-y-6 font-exo">
                        <div className="space-y-1">
                            <label className="block text-sm font-medium">Room Name</label>
                            <input
                                type="text"
                                className="input"
                                value={roomName}
                                onChange={(e) => setRoomName(e.target.value)}
                                placeholder="e.g. Presidential Election"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="block text-sm font-medium">Room Description</label>
                            <textarea
                                className="input resize-none"
                                rows="4"
                                value={roomDesc}
                                onChange={(e) => setRoomDesc(e.target.value)}
                                placeholder="Add context about this voting session..."
                            ></textarea>
                        </div>

                        <div className="space-y-1">
                            <label className="block text-sm font-medium">Number of Voters</label>
                            <input
                                type="number"
                                min="1"
                                className="input"
                                value={voterCount}
                                onChange={(e) => setVoterCount(e.target.value)}
                                placeholder="e.g. 10"
                            />
                        </div>

                        {!newRoomAddress ? (
                            <button type="submit" disabled={creating} className="btn-primary w-full">
                                {creating ? (
                                    <>
                                        <Loader2 className="w-5 h-5 mr-2 animate-spin icon" />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <Rocket className="w-5 h-5 mr-2 icon" />
                                        Initialize Room
                                    </>
                                )}
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleJoinNewRoom}
                                className="btn-primary w-full"
                            >
                                <Rocket className="w-5 h-5 mr-2 icon" /> Join New Room
                            </button>
                        )}


                        {txHash && (
                            <p className="text-sm text-center text-cyberblue mt-2">
                                <CheckCircle className="inline w-4 h-4 mr-1 icon" />
                                Tx:{' '}
                                <a
                                    href={`https://sepolia.etherscan.io/tx/${txHash}`}
                                    className="underline"
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    {txHash.slice(0, 6)}...{txHash.slice(-4)}
                                </a>
                            </p>
                        )}




                    </form>
                </div>
            </div>

            <div className="metadata absolute bottom-4 right-6">SYSTEM · EN · {localTime}</div>
        </div>
    );
}
