export const marketContractAddress = '0xYourContractAddressHere'; // TODO: Replace with your deployed prediction market contract address

export const marketContractAbi = [
  {
    "type": "function",
    "name": "placeBet",
    "inputs": [
      { "name": "marketId", "type": "uint256", "internalType": "uint256" },
      { "name": "side", "type": "uint8", "internalType": "uint8" }, // 0 for NO, 1 for YES
      { "name": "amount", "type": "uint256", "internalType": "uint256" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  }
] as const;

export const pyusdContractAddress = '0x669e9c75C6AebBA41f86D39E727FCedd89D5Ea53'; // PYUSD on Sepolia

export const pyusdContractAbi = [
    {
        "constant": false,
        "inputs": [
            { "name": "spender", "type": "address" },
            { "name": "value", "type": "uint256" }
        ],
        "name": "approve",
        "outputs": [ { "name": "", "type": "bool" } ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [
            { "name": "owner", "type": "address" },
            { "name": "spender", "type": "address" }
        ],
        "name": "allowance",
        "outputs": [ { "name": "", "type": "uint256" } ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    }
] as const; 