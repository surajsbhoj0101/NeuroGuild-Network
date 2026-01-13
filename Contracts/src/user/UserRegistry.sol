// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract UserRegistry {
    error InvalidRole();
    error ClientIsBlocked();
    error FreelancerIsBlocked();

    event UserRegistered(address indexed wallet, Role role);
    event UserBlocked(address indexed wallet);
    event UserUnblocked(address indexed wallet);

    enum Role {
        Client,
        Freelancer
    }

    modifier onlyTimelock() {
        require(msg.sender == timelock, "Only timelock");
        _;
    }

    constructor(address _timelock) {
        timelock = _timelock;
    }

    struct User {
        address wallet;
        Role role;
        bool exists;
        bool blocked;
    }

    address public timelock;

    mapping(address => User) public users;

    function setTimelock(address _resolver) external onlyTimelock {
        timelock = _resolver;
    }

    function registerUser(Role _role) external {
        require(!users[msg.sender].exists, "User already registered");

        if (!(_role == Role.Client || _role == Role.Freelancer)) {
            revert InvalidRole();
        }

        users[msg.sender] = User({
            wallet: msg.sender,
            role: _role,
            exists: true,
            blocked: false
        });

        emit UserRegistered(msg.sender, _role);
    }

    function isUserExist(address _wallet) external view returns (bool) {
        return users[_wallet].exists;
    }

    function isClient(address _wallet) external view returns (bool) {
        if (users[_wallet].blocked) revert ClientIsBlocked();
        return users[_wallet].role == Role.Client;
    }

    function isFreelancer(address _wallet) external view returns (bool) {
        if (users[_wallet].blocked) revert FreelancerIsBlocked();
        return users[_wallet].role == Role.Freelancer;
    }

    // Timelock: Block user
    function blockUser(address _wallet) external onlyTimelock {
        require(users[_wallet].exists, "User not found");
        require(!users[_wallet].blocked, "Already blocked");

        users[_wallet].blocked = true;

        emit UserBlocked(_wallet);
    }

    function unblockUser(address _wallet) external onlyTimelock {
        require(users[_wallet].exists, "User not found");
        require(users[_wallet].blocked, "Not blocked");

        users[_wallet].blocked = false;

        emit UserUnblocked(_wallet);
    }

    function isBlocked(address _wallet) external view returns (bool) {
        return users[_wallet].blocked;
    }
}
