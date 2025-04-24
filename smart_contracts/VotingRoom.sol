// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract VotingRoom {
    struct Candidate {
        uint256 id;
        string name;
        uint256 voteCount;
    }

    struct Voter {
        bool hasVoted;
        uint256 votedCandidateId;
    }

    address public roomAdmin;   // 👤 Admin khusus room ini
    address public superAdmin;  // 🧙 Super admin (creator)
    address public factory;     // 🏭 Address RoomFactory

    string public roomName;     // 🏷️ Nama room
    uint256 public maxVoters;   // 🔢 Batas maksimum voter
    bool public votingStarted;  // 🟢 Status voting aktif
    bool public votingEnded;    // 🔴 Status voting selesai
    bool public isActive;       // 🛡️ Status room aktif atau tidak

    Candidate[] public candidates;
    mapping(address => Voter) public voters;
    address[] public voterList;

    // 📢 Event logs
    event RoomAdminTransferred(address indexed oldAdmin, address indexed newAdmin);
    event VoteCast(address indexed voter, uint256 indexed candidateId);

    // 🔒 Modifier: Only admin (roomAdmin, superAdmin, or factory)
    modifier onlyAuthorizedCaller() {
        require(
            msg.sender == roomAdmin ||
            msg.sender == superAdmin ||
            msg.sender == factory,
            "Not an admin"
        );
        _;
    }

    // 🔒 Modifier: Only if room is active
    modifier onlyIfActive() {
        require(isActive, "This room has been deactivated");
        _;
    }

    // 🏗️ Constructor: Setup initial room state
    constructor(
        address _superAdmin,
        address _roomAdmin,
        string memory _roomName,
        uint256 _maxVoters
    ) {
        superAdmin = _superAdmin;
        roomAdmin = _roomAdmin;
        roomName = _roomName;
        maxVoters = _maxVoters;
        isActive = true;
        factory = msg.sender;
    }

    // 🔄 Transfer room admin to a new address
    function transferRoomAdmin(address newAdmin) public {
        require(
            msg.sender == roomAdmin || msg.sender == superAdmin,
            "Not authorized"
        );
        require(newAdmin != address(0), "Invalid address");
        emit RoomAdminTransferred(roomAdmin, newAdmin);
        roomAdmin = newAdmin;
    }

    // 🛑 Deactivate the voting room
    function deactivateRoom() public onlyAuthorizedCaller {
        isActive = false;
    }

    // ➕ Add new candidate
    function addCandidate(string memory name) public onlyAuthorizedCaller onlyIfActive {
        candidates.push(Candidate(candidates.length, name, 0));
    }

    // ➕ Add new voter
    function addVoter(address voter) public onlyAuthorizedCaller onlyIfActive {
        require(voterList.length < maxVoters, "Voter limit reached");
        voterList.push(voter);
    }

    // 🟢 Start the voting session
    function startVote() public onlyAuthorizedCaller onlyIfActive {
        require(!votingStarted, "Voting already started");
        votingStarted = true;
        votingEnded = false;
    }

    // 🔴 End the voting session
    function endVote() public onlyAuthorizedCaller onlyIfActive {
        require(votingStarted, "Voting not started yet");
        votingEnded = true;
    }

    // 🗳️ Vote for a candidate
    function vote(uint256 candidateId) public onlyIfActive {
        require(votingStarted && !votingEnded, "Voting not active");
        require(!voters[msg.sender].hasVoted, "Already voted");

        bool allowed = false;
        for (uint i = 0; i < voterList.length; i++) {
            if (voterList[i] == msg.sender) {
                allowed = true;
                break;
            }
        }
        require(allowed, "Not authorized to vote");

        voters[msg.sender] = Voter(true, candidateId);
        candidates[candidateId].voteCount += 1;

        emit VoteCast(msg.sender, candidateId);
    }

    // ♻️ Reset the room: clear candidates and voters
    function resetRoom() public onlyAuthorizedCaller onlyIfActive {
        delete candidates;
        delete voterList;
        votingStarted = false;
        votingEnded = false;
    }

    // 📋 View list of all candidates
    function getCandidates() public view returns (Candidate[] memory) {
        return candidates;
    }

    // 📋 View list of all voters
    function getVoters() public view returns (address[] memory) {
        return voterList;
    }
}
