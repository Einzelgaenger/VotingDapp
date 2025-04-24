// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./VotingRoom.sol";

interface IVotingRoom {
    function deactivateRoom() external;
    function isActive() external view returns (bool);
}

contract RoomFactory {
    address public creator;
    address[] public superAdmins;

    struct RoomInfo {
        address roomAddress;
        string roomName;
        address createdBy;
    }

    RoomInfo[] public rooms;

    event CreatorTransferred(address indexed oldOwner, address indexed newOwner);
    event SuperAdminAdded(address indexed newAdmin);
    event SuperAdminRemoved(address indexed removedAdmin);

    constructor() {
        creator = msg.sender;
        superAdmins.push(creator);
    }

    // 🔒 Hanya Creator
    modifier onlyCreator() {
        require(msg.sender == creator, "Not creator");
        _;
    }

    // 🔒 Hanya Creator atau SuperAdmin
    modifier onlyCreatorOrSuperAdmin() {
        require(
            msg.sender == creator || isSuperAdmin(msg.sender),
            "Not authorized"
        );
        _;
    }

    // 🔎 Cek apakah address adalah superadmin
    function isSuperAdmin(address addr) public view returns (bool) {
        for (uint i = 0; i < superAdmins.length; i++) {
            if (superAdmins[i] == addr) {
                return true;
            }
        }
        return false;
    }

    // ➕ Tambah SuperAdmin (hanya Creator)
    function addSuperAdmin(address newAdmin) public onlyCreator {
        require(newAdmin != address(0), "Invalid address");
        superAdmins.push(newAdmin);
        emit SuperAdminAdded(newAdmin);
    }

    // ➖ Hapus SuperAdmin (hanya Creator)
    function removeSuperAdmin(address adminToRemove) public onlyCreator {
        require(adminToRemove != address(0), "Invalid address");
        require(adminToRemove != creator, "Cannot remove creator");

        uint indexToRemove = superAdmins.length;
        for (uint i = 0; i < superAdmins.length; i++) {
            if (superAdmins[i] == adminToRemove) {
                indexToRemove = i;
                break;
            }
        }
        require(indexToRemove < superAdmins.length, "Admin not found");

        for (uint i = indexToRemove; i < superAdmins.length - 1; i++) {
            superAdmins[i] = superAdmins[i + 1];
        }
        superAdmins.pop();
        emit SuperAdminRemoved(adminToRemove);
    }

    // 🔄 Transfer Creator ke address baru
    function transferCreator(address newCreator) public onlyCreator {
        require(newCreator != address(0), "Invalid address");
        emit CreatorTransferred(creator, newCreator);
        creator = newCreator;
    }

    // 🏗️ Create Voting Room
    function createRoom(string memory name, uint256 maxVoters) public returns (address) {
        VotingRoom newRoom = new VotingRoom(creator, msg.sender, name, maxVoters);
        rooms.push(RoomInfo(address(newRoom), name, msg.sender));
        return address(newRoom);
    }

    // 🛑 Deactivate & Delete Room
    function deactivateAndDeleteRoom(uint index) public onlyCreatorOrSuperAdmin {
        require(index < rooms.length, "Invalid room index");

        IVotingRoom votingRoom = IVotingRoom(rooms[index].roomAddress);
        votingRoom.deactivateRoom();

        for (uint i = index; i < rooms.length - 1; i++) {
            rooms[i] = rooms[i + 1];
        }
        rooms.pop();
    }

    // 🧹 Factory Reset (Creator Only)
    function factoryReset() public onlyCreator {
        for (uint i = 0; i < rooms.length; i++) {
            IVotingRoom votingRoom = IVotingRoom(rooms[i].roomAddress);
            votingRoom.deactivateRoom();
        }
        delete rooms;
        delete superAdmins;
        superAdmins.push(creator);
    }

    // 🧐 Get Status Room Active
    function getRoomStatus(uint index) public view returns (bool) {
        require(index < rooms.length, "Invalid index");
        IVotingRoom votingRoom = IVotingRoom(rooms[index].roomAddress);
        return votingRoom.isActive();
    }

    // 📋 Get All Rooms
    function getRooms() public view returns (RoomInfo[] memory) {
        return rooms;
    }

    // 📋 Get SuperAdmins (PUBLIC NOW 🔥)
    function getSuperAdmins() public view returns (address[] memory) {
        return superAdmins;
    }
}
