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

    const roleColor = {
        creator: 'from-green-100 to-white',
        superadmin: 'from-blue-100 to-white',
        user: 'from-gray-200 to-white',
    };

    if (!account) {
        return (
            <button
                onClick={connectWallet}
                className="bg-cyberblue hover:brightness-110 text-white px-4 py-2 rounded-full font-semibold shadow"
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
            <div className={`flex items-center bg-white/30 backdrop-blur-md border border-white/20 px-4 py-2 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.1)] transition-all`}>
                <div className="flex items-center gap-2 text-xs font-mono text-cyberdark/80">
                    {roleIcon[role]}
                    <span>{account.slice(0, 6)}...{account.slice(-4)}</span>
                    <button onClick={copyToClipboard} className="hover:text-cyberblue">
                        {copied ? <ClipboardCheck className="w-4 h-4" /> : <ClipboardCopy className="w-4 h-4" />}
                    </button>
                    <span className="bg-white border border-gray-200 px-2 py-0.5 rounded-full text-[10px] font-bold text-gray-700">
                        {role.toUpperCase()}
                    </span>
                </div>
            </div>
        </div>
    );
}
