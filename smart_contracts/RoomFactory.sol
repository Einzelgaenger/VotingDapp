// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./VotingRoom.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";

/// @title RoomFactory 🏭 (Cloning Edition)
/// @notice Membuat VotingRoom menggunakan EIP-1167 Cloning (minimal proxy)

interface IVotingRoom {
    function deactivateRoom() external;
    function isActive() external view returns (bool);
}

contract RoomFactory {
    using Clones for address;

    // 🧱 Template contract
    address public immutable roomImplementation;

    address public creator;
    address[] public superAdmins;

    struct RoomInfo {
        address roomAddress;
        string roomName;
        string description;
        address createdBy;
    }

    RoomInfo[] public rooms;
    mapping(address => address[]) public roomsByUser;

    // 📢 Events
    event CreatorTransferred(address indexed oldOwner, address indexed newOwner);
    event SuperAdminAdded(address indexed newAdmin);
    event SuperAdminRemoved(address indexed removedAdmin);
    event RoomCreated(address indexed roomAddress, string roomName, address indexed createdBy);
    event RoomDeleted(address indexed roomAddress, string roomName, address indexed deletedBy);

    constructor(address _roomImplementation) {
        require(_roomImplementation != address(0), "Invalid implementation");
        roomImplementation = _roomImplementation;

        creator = msg.sender;
        superAdmins.push(creator);
    }

    // =====================
    // 🔐 Modifiers
    // =====================

    modifier onlyCreator() {
        require(msg.sender == creator, "Not creator");
        _;
    }

    modifier onlyCreatorOrSuperAdmin() {
        require(msg.sender == creator || isSuperAdmin(msg.sender), "Not authorized");
        _;
    }

    // =====================
    // 🛠️ Admin Controls
    // =====================

    function isSuperAdmin(address addr) public view returns (bool) {
        for (uint i = 0; i < superAdmins.length; i++) {
            if (superAdmins[i] == addr) {
                return true;
            }
        }
        return false;
    }

    function transferCreator(address newCreator) public onlyCreator {
        require(newCreator != address(0), "Invalid address");
        emit CreatorTransferred(creator, newCreator);
        creator = newCreator;
    }

    function addSuperAdmin(address newAdmin) public onlyCreator {
        require(newAdmin != address(0), "Invalid address");
        superAdmins.push(newAdmin);
        emit SuperAdminAdded(newAdmin);
    }

    function removeSuperAdmin(address adminToRemove) public onlyCreator {
        require(adminToRemove != creator, "Cannot remove creator");

        uint index = superAdmins.length;
        for (uint i = 0; i < superAdmins.length; i++) {
            if (superAdmins[i] == adminToRemove) {
                index = i;
                break;
            }
        }
        require(index < superAdmins.length, "Not found");

        for (uint i = index; i < superAdmins.length - 1; i++) {
            superAdmins[i] = superAdmins[i + 1];
        }
        superAdmins.pop();
        emit SuperAdminRemoved(adminToRemove);
    }

    // =====================
    // 🏗️ Room Lifecycle
    // =====================

    function createRoom(string memory name, string memory description, uint256 maxVoters) public returns (address) {
        address clone = roomImplementation.clone(); // 🔁 clone VotingRoom
        VotingRoom(clone).initialize(creator, msg.sender, name, description, maxVoters);

        rooms.push(RoomInfo(clone, name, description, msg.sender));
        roomsByUser[msg.sender].push(clone);

        emit RoomCreated(clone, name, msg.sender);
        return clone;
    }

    function deactivateAndDeleteRoom(uint index) public onlyCreatorOrSuperAdmin {
        require(index < rooms.length, "Invalid index");

        RoomInfo memory info = rooms[index];
        IVotingRoom(info.roomAddress).deactivateRoom();

        emit RoomDeleted(info.roomAddress, info.roomName, msg.sender);

        for (uint i = index; i < rooms.length - 1; i++) {
            rooms[i] = rooms[i + 1];
        }
        rooms.pop();
    }

    function factoryReset() public onlyCreator {
        for (uint i = 0; i < rooms.length; i++) {
            IVotingRoom(rooms[i].roomAddress).deactivateRoom();
        }
        delete rooms;
        delete superAdmins;
        superAdmins.push(creator);
    }

    // =====================
    // 🔍 Views
    // =====================

    function getRooms() public view returns (RoomInfo[] memory) {
        return rooms;
    }

    function getRoomsByAddress(address user) public view returns (address[] memory) {
        return roomsByUser[user];
    }

    function getRoomCountByUser(address user) public view returns (uint256) {
        return roomsByUser[user].length;
    }

    function getRoomStatus(uint index) public view returns (bool) {
        require(index < rooms.length, "Invalid index");
        return IVotingRoom(rooms[index].roomAddress).isActive();
    }

    function getSuperAdmins() public view returns (address[] memory) {
        return superAdmins;
    }
}
