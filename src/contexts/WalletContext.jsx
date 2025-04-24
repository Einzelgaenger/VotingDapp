import { createContext, useContext, useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { getUserRole } from '../utils/roleHelper';

const WalletContext = createContext();

export function useWallet() {
    return useContext(WalletContext);
}

export function WalletProvider({ children }) {
    const [account, setAccount] = useState(null);
    const [role, setRole] = useState("guest");
    const [provider, setProvider] = useState(null);

    useEffect(() => {
        if (window.ethereum) {
            const ethProvider = new ethers.providers.Web3Provider(window.ethereum);
            setProvider(ethProvider);

            window.ethereum.on('accountsChanged', async ([newAccount]) => {
                if (newAccount) {
                    setAccount(newAccount);
                    const userRole = await getUserRole(newAccount, ethProvider);
                    setRole(userRole);
                } else {
                    // Wallet disconnected (e.g., via MetaMask)
                    setAccount(null);
                    setRole("guest");
                }
            });

            window.ethereum.on('disconnect', () => {
                setAccount(null);
                setRole("guest");
            });
        }
    }, []);

    const connectWallet = async () => {
        if (window.ethereum) {
            const ethProvider = new ethers.providers.Web3Provider(window.ethereum);
            setProvider(ethProvider);

            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            const userRole = await getUserRole(accounts[0], ethProvider);

            setAccount(accounts[0]);
            setRole(userRole);
        } else {
            alert('Please install MetaMask!');
        }
    };

    return (
        <WalletContext.Provider value={{ account, role, connectWallet }}>
            {children}
        </WalletContext.Provider>
    );
}
