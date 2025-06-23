// server.js
require('dotenv').config()
const express = require('express')
const { createWalletClient, http } = require('viem')
const { privateKeyToAccount } = require('viem/accounts')

// ERC-20 approve ABI
const ERC20_ABI = [{
  type: 'function',
  name: 'approve',
  inputs: [
    { name: 'spender', type: 'address' },
    { name: 'amount',  type: 'uint256' },
  ],
  outputs: [{ type: 'bool' }]
}]

const app = express()
const port = process.env.PORT || 4201

const {
  USER1_PRIVATE_KEY,
  USER2_PRIVATE_KEY,
  STABLECOIN_ADDRESS,
  RPC_URL
} = process.env

if (!USER1_PRIVATE_KEY || !USER2_PRIVATE_KEY) {
  throw new Error('Missing USER1_PRIVATE_KEY or USER2_PRIVATE_KEY in .env')
}
if (!STABLECOIN_ADDRESS) {
  throw new Error('Missing STABLECOIN_ADDRESS in .env')
}
if (!RPC_URL) {
  throw new Error('Missing RPC_URL in .env')
}

// ─── helper ────────────────────────────────────────────────────────────────────
function makeClient(privateKey) {
  const key     = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`
  const account = privateKeyToAccount(key)
  return createWalletClient({
    account,
    chain: require('viem/chains').sepolia,
    transport: http(RPC_URL),    // ← pass the URL string, not an object :contentReference[oaicite:0]{index=0}
  })
}

const user1Client = makeClient(USER1_PRIVATE_KEY)
const user2Client = makeClient(USER2_PRIVATE_KEY)

app.use(express.json())

app.post('/api/approve-escrow', async (req, res, next) => {
  try {
    const { contractAddress } = req.body
    if (!contractAddress) {
      return res
        .status(400)
        .json({ error: 'Missing contractAddress in body' })
    }

    const amount = (BigInt(1) << BigInt(256)) - BigInt(1) // infinite allowance

    const tx1     = await user1Client.writeContract({
      address:      STABLECOIN_ADDRESS,
      abi:          ERC20_ABI,
      functionName: 'approve',
      args:         [contractAddress, amount],
    })
    const receipt1 = await user1Client.waitForTransactionReceipt({ hash: tx1 })

    const tx2     = await user2Client.writeContract({
      address:      STABLECOIN_ADDRESS,
      abi:          ERC20_ABI,
      functionName: 'approve',
      args:         [contractAddress, amount],
    })
    const receipt2 = await user2Client.waitForTransactionReceipt({ hash: tx2 })

    res.json({
      status: 'approved',
      approvals: [
        { user: 'user1', transactionHash: tx1, receipt: receipt1 },
        { user: 'user2', transactionHash: tx2, receipt: receipt2 },
      ]
    })
  } catch (err) {
    next(err)
  }
})

app.use((err, _, res, next) => {
  console.error(err)
  res.status(500).json({ error: err.message })
})

app.listen(port, () => {
  console.log(`🚀 Approval service running on http://localhost:${port}`)
})
