import { ethers } from "ethers";
import RoomFactoryAbi from "../abis/RoomFactory.json";

const ROOM_FACTORY_ADDRESS = "0xD4a27A0f15af108B164824B8Ff0EA53eE362959a";

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
