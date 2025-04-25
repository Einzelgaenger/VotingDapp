import { ethers } from "ethers";
import RoomFactoryAbi from "../abis/RoomFactory.json";
import VotingRoomAbi from "../abis/VotingRoom.json";

// ✅ Address RoomFactory terbaru
const ROOM_FACTORY_ADDRESS = "0x5933899C50ab5DB1bCd94B5a8e60aD34f26e06f3";

// 🔐 Deteksi peran pengguna: creator, superadmin, atau user biasa
export async function getUserRole(account, provider) {
    if (!account || !provider) return "user";

    try {
        const roomFactory = new ethers.Contract(ROOM_FACTORY_ADDRESS, RoomFactoryAbi, provider);

        const currentCreator = await roomFactory.creator();
        if (account.toLowerCase() === currentCreator.toLowerCase()) {
            return "creator";
        }

        const superAdmins = await roomFactory.getSuperAdmins();
        const lowerCaseAdmins = superAdmins.map(addr => addr.toLowerCase());

        if (lowerCaseAdmins.includes(account.toLowerCase())) {
            return "superadmin";
        }

        return "user";
    } catch (error) {
        console.error("Error detecting role:", error);
        return "user";
    }
}

// 📦 Untuk mendapatkan instance VotingRoom clone
export const getVotingRoomContract = (address, signerOrProvider) => {
    return new ethers.Contract(address, VotingRoomAbi, signerOrProvider);
};
