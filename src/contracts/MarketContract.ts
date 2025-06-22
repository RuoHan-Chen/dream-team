// TODO: Replace with your deployed BooleanPredictionEscrow contract address
export const marketContractAddress = 'undefined';

export const marketContractAbi = [
  {
    "inputs": [
      { "name": "prediction", "type": "bool" },
      { "name": "amount", "type": "uint256" }
    ],
    "name": "placeBet",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "outcome", "type": "bool" }
    ],
    "name": "resolveAndDistribute",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "question",
    "outputs": [{ "name": "", "type": "string" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "deadline",
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "state",
    "outputs": [{ "name": "", "type": "uint8" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalTrue",
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalFalse",
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalPool",
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "name": "", "type": "address" }],
    "name": "bets",
    "outputs": [
      { "name": "hasBet", "type": "bool" },
      { "name": "prediction", "type": "bool" },
      { "name": "amount", "type": "uint256" },
      { "name": "paidOut", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
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