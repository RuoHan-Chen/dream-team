require('dotenv').config()
const express = require('express')
const { createWalletClient, http } = require('viem')
const { privateKeyToAccount } = require('viem/accounts')
const { abi, bytecode } = require('./flow.json')

const app = express()
const port = 4200
const cors = require('cors')

app.use(cors({
  origin: 'http://localhost:3000'
}))

// Load and validate private key
const rawPrivateKey = process.env.DEPLOYER_PRIVATE_KEY
if (!rawPrivateKey) throw new Error('DEPLOYER_PRIVATE_KEY is not set')

const privateKey = rawPrivateKey.startsWith('0x') ? rawPrivateKey : `0x${rawPrivateKey}`
console.log("Loaded private key length:", privateKey.length - 2)
console.log("Loaded private key (masked):", privateKey.slice(0, 6) + "..." + privateKey.slice(-4))

const account = privateKeyToAccount(privateKey)
const client = createWalletClient({
  account,
  chain: require('viem/chains').flowTestnet,
  transport: http()
})

app.use(express.json())

app.post('/api/create-market', async (req, res) => {
  try {
    const txHash = await client.deployContract({
      abi,
      bytecode,
      args: [
        1e21
      ]
    })
    res.json({ status: 'pending', transactionHash: txHash })
  } catch (err) {
    console.error('Deployment error:', err)
    res.status(500).json({ status: 'error', error: err.message })
  }
})

app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`)
})
