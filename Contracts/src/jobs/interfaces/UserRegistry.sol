// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface UserRegistry {
    enum Role {
        Client,
        Freelancer
    }

    struct User {
        address wallet;
        Role role;
        bool exists;
    }

    function registerUser(Role _role) external;

    function getUser(address _wallet) external view returns (User memory);

    function isClient(address _wallet) external view returns (bool);

    function isFreelancer(address _wallet) external view returns (bool);
}
