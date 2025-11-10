// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract UserRegistry {
    error InvalidRole();

    event UserRegistered(address indexed wallet, Role role);

    enum Role {
        Client,
        Freelancer
    }

    struct User {
        address wallet;
        Role role;
        bool exists;
    }

    mapping(address => User) public users;

    function registerUser(Role _role) external {
        require(!users[msg.sender].exists, "User already registered");
        if (!(_role == Role.Client || _role == Role.Freelancer)) {
            revert InvalidRole();
        }
        users[msg.sender] = User(msg.sender, _role, true);
        emit UserRegistered(msg.sender, _role);
    }

    function getUser(address _wallet) external view returns (User memory) {
        return users[_wallet];
    }

    function isClient(address _wallet) external view returns (bool) {
        return users[_wallet].role == Role.Client;
    }

    function isFreelancer(address _wallet) external view returns (bool) {
        return users[_wallet].role == Role.Freelancer;
    }
}
