export const user = [
    {
        "type": "constructor",
        "inputs": [
            {
                "name": "_governance",
                "type": "address",
                "internalType": "address"
            },
            {
                "name": "_admin",
                "type": "address",
                "internalType": "address"
            }
        ],
        "stateMutability": "nonpayable"
    },
    {
        "type": "function",
        "name": "admin",
        "inputs": [],
        "outputs": [
            {
                "name": "",
                "type": "address",
                "internalType": "address"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "blockUser",
        "inputs": [
            {
                "name": "_wallet",
                "type": "address",
                "internalType": "address"
            }
        ],
        "outputs": [],
        "stateMutability": "nonpayable"
    },
    {
        "type": "function",
        "name": "getUser",
        "inputs": [
            {
                "name": "_wallet",
                "type": "address",
                "internalType": "address"
            }
        ],
        "outputs": [
            {
                "name": "",
                "type": "tuple",
                "internalType": "struct UserRegistry.User",
                "components": [
                    {
                        "name": "wallet",
                        "type": "address",
                        "internalType": "address"
                    },
                    {
                        "name": "role",
                        "type": "uint8",
                        "internalType": "enum UserRegistry.Role"
                    },
                    {
                        "name": "exists",
                        "type": "bool",
                        "internalType": "bool"
                    },
                    {
                        "name": "blocked",
                        "type": "bool",
                        "internalType": "bool"
                    }
                ]
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "governance",
        "inputs": [],
        "outputs": [
            {
                "name": "",
                "type": "address",
                "internalType": "address"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "isBlocked",
        "inputs": [
            {
                "name": "_wallet",
                "type": "address",
                "internalType": "address"
            }
        ],
        "outputs": [
            {
                "name": "",
                "type": "bool",
                "internalType": "bool"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "isClient",
        "inputs": [
            {
                "name": "_wallet",
                "type": "address",
                "internalType": "address"
            }
        ],
        "outputs": [
            {
                "name": "",
                "type": "bool",
                "internalType": "bool"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "isFreelancer",
        "inputs": [
            {
                "name": "_wallet",
                "type": "address",
                "internalType": "address"
            }
        ],
        "outputs": [
            {
                "name": "",
                "type": "bool",
                "internalType": "bool"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "registerUser",
        "inputs": [
            {
                "name": "_role",
                "type": "uint8",
                "internalType": "enum UserRegistry.Role"
            },
            {
                "name": "userAddr",
                "type": "address",
                "internalType": "address"
            }
        ],
        "outputs": [],
        "stateMutability": "nonpayable"
    },
    {
        "type": "function",
        "name": "setGovernor",
        "inputs": [
            {
                "name": "_resolver",
                "type": "address",
                "internalType": "address"
            }
        ],
        "outputs": [],
        "stateMutability": "nonpayable"
    },
    {
        "type": "function",
        "name": "unblockUser",
        "inputs": [
            {
                "name": "_wallet",
                "type": "address",
                "internalType": "address"
            }
        ],
        "outputs": [],
        "stateMutability": "nonpayable"
    },
    {
        "type": "function",
        "name": "users",
        "inputs": [
            {
                "name": "",
                "type": "address",
                "internalType": "address"
            }
        ],
        "outputs": [
            {
                "name": "wallet",
                "type": "address",
                "internalType": "address"
            },
            {
                "name": "role",
                "type": "uint8",
                "internalType": "enum UserRegistry.Role"
            },
            {
                "name": "exists",
                "type": "bool",
                "internalType": "bool"
            },
            {
                "name": "blocked",
                "type": "bool",
                "internalType": "bool"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "event",
        "name": "UserBlocked",
        "inputs": [
            {
                "name": "wallet",
                "type": "address",
                "indexed": true,
                "internalType": "address"
            }
        ],
        "anonymous": false
    },
    {
        "type": "event",
        "name": "UserRegistered",
        "inputs": [
            {
                "name": "wallet",
                "type": "address",
                "indexed": true,
                "internalType": "address"
            },
            {
                "name": "role",
                "type": "uint8",
                "indexed": false,
                "internalType": "enum UserRegistry.Role"
            }
        ],
        "anonymous": false
    },
    {
        "type": "event",
        "name": "UserUnblocked",
        "inputs": [
            {
                "name": "wallet",
                "type": "address",
                "indexed": true,
                "internalType": "address"
            }
        ],
        "anonymous": false
    },
    {
        "type": "error",
        "name": "ClientIsBlocked",
        "inputs": []
    },
    {
        "type": "error",
        "name": "FreelancerIsBlocked",
        "inputs": []
    },
    {
        "type": "error",
        "name": "InvalidRole",
        "inputs": []
    }
]