import { ethers } from "ethers";
import RoomFactoryAbi from "../abis/RoomFactory.json";

const ROOM_FACTORY_ADDRESS = "0x953dEb668181ab8a619611CB6401E022CeC4659f";

export async function getUserRole(account, provider) {
    if (!account || !provider) return "guest";

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

        return "guest";
    } catch (error) {
        console.error("Error detecting role:", error);
        return "guest";
    }
}
