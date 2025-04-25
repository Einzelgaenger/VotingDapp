// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/// @title VotingRoom (Cloneable)
/// @notice Template contract untuk di-clone via EIP-1167 oleh RoomFactory

contract VotingRoom {
    // ===========================
    // 🧱 Data Structures
    // ===========================

    struct Candidate {
        uint256 id;
        string name;
        uint256 voteCount;
    }

    struct Voter {
        bool hasVoted;
        uint256 votedCandidateId;
    }

    // ===========================
    // 🔐 State Variables
    // ===========================

    address public roomAdmin;
    address public superAdmin;
    address public factory;

    string public roomName;
    string public description;
    uint256 public maxVoters;
    bool public votingStarted;
    bool public votingEnded;
    bool public isActive;
    bool public initialized;

    Candidate[] public candidates;
    address[] public voterList;

    mapping(address => Voter) public voters;
    mapping(address => string) public voterNames;
    mapping(address => bool) public isVoterRegistered;

    // ===========================
    // 📢 Events
    // ===========================

    event RoomAdminTransferred(address indexed oldAdmin, address indexed newAdmin);
    event VoteCast(address indexed voter, uint256 indexed candidateId);
    event VoteStarted();
    event VoteEnded();
    event VoterAdded(address indexed voter, string name);
    event CandidateAdded(uint256 indexed candidateId, string name);
    event VoterRemoved(address indexed voter);
    event CandidateRemoved(uint256 indexed candidateId, string name);
    event VotesCleared(address indexed clearedBy);
    event VotersCleared(address indexed clearedBy);
    event CandidatesCleared(address indexed clearedBy);
    event RoomReset(address indexed resetBy);

    // ===========================
    // 🔐 Modifiers
    // ===========================

    modifier onlyIfActive() {
        require(isActive, "Room is deactivated");
        _;
    }

    modifier onlyAdmin() {
        require(msg.sender == roomAdmin, "Only admin");
        _;
    }

    modifier onlyAuthorizedDeactivator() {
        require(
            msg.sender == roomAdmin ||
            msg.sender == superAdmin ||
            msg.sender == factory,
            "Unauthorized"
        );
        _;
    }

    // ===========================
    // 🏗️ Initialization (for Clone)
    // ===========================

    function initialize(
        address _superAdmin,
        address _roomAdmin,
        string memory _roomName,
        string memory _description,
        uint256 _maxVoters
    ) external {
        require(!initialized, "Already initialized");
        superAdmin = _superAdmin;
        roomAdmin = _roomAdmin;
        roomName = _roomName;
        description = _description;
        maxVoters = _maxVoters;
        isActive = true;
        factory = msg.sender;
        initialized = true;
    }

    // ===========================
    // 👤 Admin Management
    // ===========================

    function transferRoomAdmin(address newAdmin) public onlyAdmin onlyIfActive {
        require(newAdmin != address(0), "Invalid address");
        emit RoomAdminTransferred(roomAdmin, newAdmin);
        roomAdmin = newAdmin;
    }

    function deactivateRoom() public onlyAuthorizedDeactivator {
        isActive = false;
    }

    // ===========================
    // 👥 Voter Management
    // ===========================

    function addVoter(address voter, string memory name) public onlyAdmin onlyIfActive {
        require(voterList.length < maxVoters, "Voter limit reached");
        require(!isVoterRegistered[voter], "Voter already exists");
        voterList.push(voter);
        voterNames[voter] = name;
        isVoterRegistered[voter] = true;
        emit VoterAdded(voter, name);
    }

    function removeVoter(address voter) public onlyAdmin onlyIfActive {
        require(isVoterRegistered[voter], "Voter not found");

        delete voters[voter];
        delete voterNames[voter];
        isVoterRegistered[voter] = false;

        for (uint i = 0; i < voterList.length; i++) {
            if (voterList[i] == voter) {
                voterList[i] = voterList[voterList.length - 1];
                voterList.pop();
                break;
            }
        }

        emit VoterRemoved(voter);
    }

    function clearVoters() public onlyAdmin onlyIfActive {
        for (uint i = 0; i < voterList.length; i++) {
            address voter = voterList[i];
            delete voters[voter];
            delete voterNames[voter];
            isVoterRegistered[voter] = false;
        }
        delete voterList;
        votingStarted = false;
        votingEnded = true;
        emit VotersCleared(msg.sender);
    }

    // ===========================
    // 🧾 Candidate Management
    // ===========================

    function addCandidate(string memory name) public onlyAdmin onlyIfActive {
        candidates.push(Candidate(candidates.length, name, 0));
        emit CandidateAdded(candidates.length - 1, name);
    }

    function removeCandidate(uint256 candidateId) public onlyAdmin onlyIfActive {
        require(candidateId < candidates.length, "Invalid candidate ID");

        string memory removedName = candidates[candidateId].name;

        for (uint i = candidateId; i < candidates.length - 1; i++) {
            candidates[i] = candidates[i + 1];
            candidates[i].id = i;
        }

        candidates.pop();
        emit CandidateRemoved(candidateId, removedName);
    }

    function clearCandidates() public onlyAdmin onlyIfActive {
        delete candidates;
        for (uint i = 0; i < voterList.length; i++) {
            voters[voterList[i]] = Voter(false, 0);
        }
        votingStarted = false;
        votingEnded = true;
        emit CandidatesCleared(msg.sender);
    }

    // ===========================
    // 🗳️ Voting Lifecycle
    // ===========================

    function startVote() public onlyAdmin onlyIfActive {
        require(!votingStarted, "Already started");
        votingStarted = true;
        votingEnded = false;
        emit VoteStarted();
    }

    function endVote() public onlyAdmin onlyIfActive {
        require(votingStarted, "Not started");
        votingEnded = true;
        votingStarted = false;
        emit VoteEnded();
    }

    function vote(uint256 candidateId) public onlyIfActive {
        require(votingStarted && !votingEnded, "Voting not active");
        require(!voters[msg.sender].hasVoted, "Already voted");
        require(candidateId < candidates.length, "Invalid candidate");
        require(isVoterRegistered[msg.sender], "Not a registered voter");

        voters[msg.sender] = Voter(true, candidateId);
        candidates[candidateId].voteCount += 1;

        emit VoteCast(msg.sender, candidateId);
    }

    function clearVotes() public onlyAdmin onlyIfActive {
        for (uint i = 0; i < candidates.length; i++) {
            candidates[i].voteCount = 0;
        }
        for (uint i = 0; i < voterList.length; i++) {
            voters[voterList[i]] = Voter(false, 0);
        }
        votingStarted = false;
        votingEnded = true;
        emit VotesCleared(msg.sender);
    }

    function resetRoom() public onlyAdmin onlyIfActive {
        clearVoters();
        clearCandidates();
        emit RoomReset(msg.sender);
    }

    // ===========================
    // 🔍 View Functions
    // ===========================

    function hasVoted(address voter) public view returns (bool) {
        return voters[voter].hasVoted;
    }

    function getCandidates() public view returns (Candidate[] memory) {
        return candidates;
    }

    function getVoters() public view returns (address[] memory) {
        return voterList;
    }

    function getVoterDetails() public view returns (address[] memory, string[] memory) {
        string[] memory names = new string[](voterList.length);
        for (uint i = 0; i < voterList.length; i++) {
            names[i] = voterNames[voterList[i]];
        }
        return (voterList, names);
    }

    function getVoterName(address voter) public view returns (string memory) {
        return voterNames[voter];
    }
}
