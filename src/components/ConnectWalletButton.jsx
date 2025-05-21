import { useState } from 'react';
import { ClipboardCheck, ClipboardCopy, User, ShieldCheck, Crown } from 'lucide-react';
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
        creator: <Crown className="w-4 h-4 text-green-400" />,
        superadmin: <ShieldCheck className="w-4 h-4 text-blue-400" />,
        user: <User className="w-4 h-4 text-gray-400" />,
    };

    if (!account) {
        return (
            <button
                onClick={connectWallet}
                className="bg-cyberblue hover:brightness-110 text-white px-4 py-2 rounded-full font-semibold shadow transition active:scale-95"
            >
                Connect Wallet
            </button>
        );
    }

    return (
        <div
            className="group relative"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <div className="wallet-box flex items-center px-4 py-2 rounded-full transition-all">
                <div className="flex items-center gap-2 text-xs font-mono wallet-text">
                    {roleIcon[role]}
                    <span>{account.slice(0, 6)}...{account.slice(-4)}</span>
                    <button onClick={copyToClipboard} className="hover:text-cyberblue">
                        {copied ? <ClipboardCheck className="w-4 h-4" /> : <ClipboardCopy className="w-4 h-4" />}
                    </button>
                    <span className="role-badge px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">
                        {role}
                    </span>
                </div>
            </div>
        </div>
    );
}
