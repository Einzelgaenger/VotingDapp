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

    address public roomAdmin;
    address public superAdmin;
    address public factory;

    string public roomName;
    string public description; // ✅ New
    uint256 public maxVoters;
    bool public votingStarted;
    bool public votingEnded;
    bool public isActive;

    Candidate[] public candidates;
    mapping(address => Voter) public voters;
    address[] public voterList;

    // 📢 Events
    event RoomAdminTransferred(address indexed oldAdmin, address indexed newAdmin);
    event VoteCast(address indexed voter, uint256 indexed candidateId);
    event VoteStarted(); // ✅ New
    event VoteEnded();   // ✅ New

    // 🔒 Modifier: only active room
    modifier onlyIfActive() {
        require(isActive, "This room has been deactivated");
        _;
    }

    modifier onlyAdmin() {
        require(msg.sender == roomAdmin, "Only room admin allowed");
        _;
    }

    modifier onlyAuthorizedDeactivator() {
        require(
            msg.sender == roomAdmin ||
            msg.sender == superAdmin ||
            msg.sender == factory,
            "Not authorized to deactivate"
        );
        _;
    }

    constructor(
        address _superAdmin,
        address _roomAdmin,
        string memory _roomName,
        string memory _description, // ✅ Tambahkan ini
        uint256 _maxVoters
    ) {
        superAdmin = _superAdmin;
        roomAdmin = _roomAdmin;
        roomName = _roomName;
        description = _description; // ✅ Simpan di sini
        maxVoters = _maxVoters;
        isActive = true;
        factory = msg.sender;
    }

    // 🔄 Transfer Admin
    function transferRoomAdmin(address newAdmin) public onlyAdmin onlyIfActive {
        require(newAdmin != address(0), "Invalid address");
        emit RoomAdminTransferred(roomAdmin, newAdmin);
        roomAdmin = newAdmin;
    }

    // 🛑 Deactivate Room (admin, superAdmin, factory)
    function deactivateRoom() public onlyAuthorizedDeactivator {
        isActive = false;
    }

    // ➕ Add Candidate
    function addCandidate(string memory name) public onlyAdmin onlyIfActive {
        candidates.push(Candidate(candidates.length, name, 0));
    }

    // ➕ Add Voter
    function addVoter(address voter) public onlyAdmin onlyIfActive {
        require(voterList.length < maxVoters, "Voter limit reached");
        voterList.push(voter);
    }

    // 🟢 Start Vote
    function startVote() public onlyAdmin onlyIfActive {
        require(!votingStarted, "Already started");
        votingStarted = true;
        votingEnded = false;
        emit VoteStarted();
    }

    // 🔴 End Vote
    function endVote() public onlyAdmin onlyIfActive {
        require(votingStarted, "Voting not started");
        votingEnded = true;
        votingStarted = false; // ✅ Fix
        emit VoteEnded();
    }

    // 🗳️ Vote
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

    // 🔍 Check if address has voted
    function hasVoted(address voter) public view returns (bool) {
        return voters[voter].hasVoted;
    }

    // ♻️ Clear Votes Only
    function clearVotes() public onlyAdmin onlyIfActive {
        for (uint i = 0; i < voterList.length; i++) {
            delete voters[voterList[i]];
        }
        delete voterList;
        votingStarted = false;
        votingEnded = false;
    }

    // ♻️ Clear Candidates Only
    function clearCandidates() public onlyAdmin onlyIfActive {
        delete candidates;
    }

    // 🔁 Reset Room (Votes + Candidates)
    function resetRoom() public onlyAdmin onlyIfActive {
        clearVotes();
        clearCandidates();
    }

    function getCandidates() public view returns (Candidate[] memory) {
        return candidates;
    }

    function getVoters() public view returns (address[] memory) {
        return voterList;
    }
}
