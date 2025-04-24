import { useWallet } from '../contexts/WalletContext';

export default function ConnectWalletButton() {
    const { account, role, connectWallet } = useWallet();

    return (
        <div>
            {account ? (
                <span>
                    {account.slice(0, 6)}...{account.slice(-4)} | {role.toUpperCase()}
                </span>
            ) : (
                <button onClick={connectWallet}>Connect Wallet</button>
            )}
        </div>
    );
}
