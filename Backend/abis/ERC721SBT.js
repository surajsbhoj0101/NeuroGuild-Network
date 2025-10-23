export const ERC721SBT = [
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_admin",
                "type": "address"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "userAddr",
                "type": "address",
                "indexed": true
            },
            {
                "internalType": "string",
                "name": "skillName",
                "type": "string",
                "indexed": true
            },
            {
                "internalType": "uint8",
                "name": "level",
                "type": "uint8",
                "indexed": true
            }
        ],
        "type": "event",
        "name": "SkillUpdated",
        "anonymous": false
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "tokenId",
                "type": "uint256",
                "indexed": true
            },
            {
                "internalType": "string",
                "name": "uri",
                "type": "string",
                "indexed": false
            }
        ],
        "type": "event",
        "name": "TokenURISet",
        "anonymous": false
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "from",
                "type": "address",
                "indexed": true
            },
            {
                "internalType": "address",
                "name": "to",
                "type": "address",
                "indexed": true
            },
            {
                "internalType": "uint256",
                "name": "id",
                "type": "uint256",
                "indexed": true
            }
        ],
        "type": "event",
        "name": "Transfer",
        "anonymous": false
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "userAddr",
                "type": "address",
                "indexed": true
            }
        ],
        "type": "event",
        "name": "addedToWhitelist",
        "anonymous": false
    },
    {
        "inputs": [],
        "stateMutability": "view",
        "type": "function",
        "name": "MAX_LEVEL",
        "outputs": [
            {
                "internalType": "uint8",
                "name": "",
                "type": "uint8"
            }
        ]
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            },
            {
                "internalType": "bytes32",
                "name": "",
                "type": "bytes32"
            }
        ],
        "stateMutability": "view",
        "type": "function",
        "name": "_skillLevels",
        "outputs": [
            {
                "internalType": "uint8",
                "name": "",
                "type": "uint8"
            }
        ]
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "userAddr",
                "type": "address"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function",
        "name": "addToWhitelist"
    },
    {
        "inputs": [],
        "stateMutability": "view",
        "type": "function",
        "name": "admin",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ]
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "owner",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function",
        "name": "balanceOf",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ]
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "userAddr",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function",
        "name": "isWhiteListed",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ]
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "id",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function",
        "name": "ownerOf",
        "outputs": [
            {
                "internalType": "address",
                "name": "owner",
                "type": "address"
            }
        ]
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "skillName",
                "type": "string"
            }
        ],
        "stateMutability": "view",
        "type": "function",
        "name": "skillLevels",
        "outputs": [
            {
                "internalType": "uint8",
                "name": "",
                "type": "uint8"
            }
        ]
    },
    {
        "inputs": [
            {
                "internalType": "bytes4",
                "name": "interfaceId",
                "type": "bytes4"
            }
        ],
        "stateMutability": "pure",
        "type": "function",
        "name": "supportsInterface",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ]
    }
]