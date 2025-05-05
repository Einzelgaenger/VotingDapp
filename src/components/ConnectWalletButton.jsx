import { useState } from 'react';
import { ClipboardCheck, ClipboardCopy, UserCheck, ShieldCheck, User, Crown } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';

export default function ConnectWalletButton() {
    const { account, role, connectWallet } = useWallet();
    const [hovered, setHovered] = useState(false);
    const [copied, setCopied] = useState(false);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(account);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const roleIcon = {
        creator: <Crown className="w-5 h-5 text-green-600" />,
        superadmin: <ShieldCheck className="w-5 h-5 text-blue-600" />,
        user: <User className="w-5 h-5 text-gray-500" />,
    };

    const iconOnly = {
        creator: <Crown className="w-4 h-4 text-green-700" />,
        superadmin: <ShieldCheck className="w-4 h-4 text-blue-700" />,
        user: <User className="w-4 h-4 text-gray-600" />,
    };

    const roleColor = {
        creator: 'bg-green-100',
        superadmin: 'bg-blue-100',
        user: 'bg-gray-200',
    };

    if (!account) {
        return (
            <button
                onClick={connectWallet}
                className="fixed top-4 right-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-full font-semibold shadow"
            >
                Connect Wallet
            </button>
        );
    }

    return (
        <div
            className={`fixed top-4 right-4 z-50 group transition-all`}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <div className={`flex items-center ${roleColor[role]} rounded-full shadow px-3 py-2 transition-all duration-300 ease-in-out ${hovered ? 'w-auto' : 'w-10'} overflow-hidden relative`}>
                <div className={`flex-shrink-0 w-4.5 h-5 flex items-center justify-center`}>
                    {iconOnly[role]}
                </div>

                <div className={`ml-2 whitespace-nowrap transition-opacity duration-200 ${hovered ? 'opacity-100' : 'opacity-0'} flex items-center gap-2`}>
                    <span className="text-sm font-medium text-gray-800">
                        {account.slice(0, 6)}...{account.slice(-4)}
                    </span>
                    <button onClick={copyToClipboard} className="hover:text-indigo-500">
                        {copied ? <ClipboardCheck className="w-4 h-4" /> : <ClipboardCopy className="w-4 h-4" />}
                    </button>
                    <span className="text-xs bg-white border px-2 py-0.5 rounded-full text-gray-700 font-semibold">
                        {role.toUpperCase()}
                    </span>
                </div>
            </div>
        </div>
    );
}
