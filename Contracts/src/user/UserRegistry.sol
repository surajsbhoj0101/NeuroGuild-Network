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

    modifier onlyGovernance() {
        require(msg.sender == governance, "Only governance");
        _;
    }

    modifier onlyAdmin(){
        require(msg.sender ==  admin,"Only Admin");
        _;
    }

    constructor(address _governance, address _admin) {
        governance = _governance;
        admin = _admin;
    }

    struct User {
        address wallet;
        Role role;
        bool exists;
        bool blocked; 
    }

    address public governance;
    address public admin;
    mapping(address => User) public users;

    function setGovernor(address _resolver) external onlyGovernance {
        governance = _resolver;
    }

    function registerUser(Role _role,address userAddr ) onlyAdmin external {
        require(!users[userAddr].exists, "User already registered");

        if (!(_role == Role.Client || _role == Role.Freelancer)) {
            revert InvalidRole();
        }

        users[userAddr] = User({
            wallet: userAddr,
            role: _role,
            exists: true,
            blocked: false
        });

        emit UserRegistered(userAddr, _role);
    }

    function getUser(address _wallet) external view returns (User memory) {
        User memory u = users[_wallet];
        require(u.exists, "User not found");
        require(!u.blocked, "User is blocked");
        return u;
    }

    function isClient(address _wallet) external view returns (bool) {
        if(users[_wallet].blocked) revert ClientIsBlocked();
        return users[_wallet].role == Role.Client;
    }

    function isFreelancer(address _wallet) external view returns (bool) {
        if(users[_wallet].blocked) revert FreelancerIsBlocked();
        return users[_wallet].role == Role.Freelancer;
    }

    // Governance: Block user
    function blockUser(address _wallet) external onlyGovernance {
        require(users[_wallet].exists, "User not found");
        require(!users[_wallet].blocked, "Already blocked");

        users[_wallet].blocked = true;

        emit UserBlocked(_wallet);
    }

    function unblockUser(address _wallet) external onlyGovernance {
        require(users[_wallet].exists, "User not found");
        require(users[_wallet].blocked, "Not blocked");

        users[_wallet].blocked = false;

        emit UserUnblocked(_wallet);
    }

    function isBlocked(address _wallet) external view returns (bool) {
        return users[_wallet].blocked;
    }
}
