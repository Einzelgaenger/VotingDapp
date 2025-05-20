import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../contexts/WalletContext';
import { Loader2, ClipboardList, Rocket, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CreateRoom({ setPage, setActiveRoomAddress }) {
    const { account, votingFactoryContract } = useWallet();
    const [roomName, setRoomName] = useState('');
    const [roomDesc, setRoomDesc] = useState('');
    const [creating, setCreating] = useState(false);
    const [txHash, setTxHash] = useState(null);
    const [localTime, setLocalTime] = useState('');

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
        try {
            setCreating(true);
            const tx = await votingFactoryContract.createVotingRoom(roomName, roomDesc);
            toast.loading('Creating room...');
            setTxHash(tx.hash);
            const receipt = await tx.wait();
            const roomAddress = receipt.logs[0]?.address;
            toast.dismiss();
            toast.success('Room created!');
            setActiveRoomAddress(roomAddress);
            setPage('roomdetail');
        } catch (err) {
            console.error(err);
            toast.error('Failed to create room');
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-72px)] pt-10 md:pt-16 px-4 flex justify-center items-start md:items-center relative">
            <div className="card max-w-xl w-full px-6 py-8 md:px-10 md:py-12 transition-all">
                <div className="flex items-center justify-center gap-3 mb-6">
                    <ClipboardList className="w-8 h-8 icon" />
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

                    <button type="submit" disabled={creating} className="btn-primary">
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

            <div className="metadata absolute bottom-4 right-6">
                SYSTEM · EN · {localTime}
            </div>
        </div>
    );
}
