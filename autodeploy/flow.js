// File: server.js
require('dotenv').config()
const express = require('express')
const cors = require('cors')
const { createWalletClient, createPublicClient, http } = require('viem')
const { privateKeyToAccount } = require('viem/accounts')
const chains = require('viem/chains')
const { abi } = require('./flow.json')

const app = express()
const port = process.env.PORT || 4202

// Agent address that handles loans and holds minted tokens\
const agentAddy = "0x6DcdF2D57F55953ee170373bdb41b749a645C91e"

// Select chain via environment variable: 'sepolia' or 'flowTestnet'
const CHAIN_NAME = process.env.CHAIN || 'flowTestnet'
const chainConfig = CHAIN_NAME === 'flowTestnet'
  ? chains.flowTestnet
  : chains.sepolia

// Contract address (deployed USDFWithLendingMVPIndexed)
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || "0x0447E99db48892c7A90966fC0143207365e83460"

// Wallet client setup
const rawPK = process.env.DEPLOYER_PRIVATE_KEY
if (!rawPK) throw new Error('DEPLOYER_PRIVATE_KEY env var is required')
const formattedPK = rawPK.startsWith('0x') ? rawPK : `0x${rawPK}`
const account = privateKeyToAccount(formattedPK)
const walletClient = createWalletClient({
  account,
  chain: chainConfig,
  transport: http(),
})

// Public client for read-only calls
const publicClient = createPublicClient({
  chain: chainConfig,
  transport: http(),
})

app.use(cors({ origin: 'http://localhost:3000' }))
app.use(express.json())

// --- Separate Endpoints ---

// 1) Mint only: mint tokens to the agent
app.post('/api/mint', async (req, res) => {
  try {
    const { amount } = req.body
    if (amount == null) return res.status(400).json({ error: 'Missing `amount`' })
    const amt = BigInt(amount * 1e18)

    const tx = await walletClient.writeContract({
      address: CONTRACT_ADDRESS,
      abi,
      functionName: 'mint',
      args: [agentAddy, amt],
    })
    res.json({ status: 'ok', tx })
  } catch (err) {
    console.error('mint error:', err)
    res.status(500).json({ error: err.message })
  }
})

// 2) Lend only: deposit agent's tokens into contract
app.post('/api/lend', async (req, res) => {
  try {
    const { amount } = req.body
    if (amount == null) return res.status(400).json({ error: 'Missing `amount`' })
    const amt = BigInt(amount * 1e18)

    const tx = await walletClient.writeContract({
      address: CONTRACT_ADDRESS,
      abi,
      functionName: 'lend',
      args: [amt],
    })
    res.json({ status: 'ok', tx })
  } catch (err) {
    console.error('lend error:', err)
    res.status(500).json({ error: err.message })
  }
})

// 3) Unsend only: withdraw principal + interest for a loan
app.post('/api/unsend', async (req, res) => {
  try {
    const { loanId } = req.body
    if (loanId == null) return res.status(400).json({ error: 'Missing `loanId`' })

    const tx = await walletClient.writeContract({
      address: CONTRACT_ADDRESS,
      abi,
      functionName: 'unsend',
      args: [Number(loanId)],
    })
    res.json({ status: 'ok', tx })
  } catch (err) {
    console.error('unsend error:', err)
    res.status(500).json({ error: err.message })
  }
})

// 4) Burn only: burn agent's tokens
app.post('/api/burn', async (req, res) => {
  try {
    const { amount } = req.body
    if (amount == null) return res.status(400).json({ error: 'Missing `amount`' })
    const amt = BigInt(amount * 1e18)

    const tx = await walletClient.writeContract({
      address: CONTRACT_ADDRESS,
      abi,
      functionName: 'burn',
      args: [agentAddy, amt],
    })
    res.json({ status: 'ok', tx })
  } catch (err) {
    console.error('burn error:', err)
    res.status(500).json({ error: err.message })
  }
})

// 5) Add a Year (fast-forward) endpoint
app.post('/api/add-year', async (req, res) => {
  try {
    const { loanId } = req.body
    if (loanId == null) return res.status(400).json({ error: 'Missing `loanId`' })

    const tx = await walletClient.writeContract({
      address: CONTRACT_ADDRESS,
      abi,
      functionName: 'testAdvanceOneYear',
      args: [Number(loanId)],
    })
    res.json({ status: 'ok', tx })
  } catch (err) {
    console.error('add-year error:', err)
    res.status(500).json({ error: err.message })
  }
})

// 6) Read API: agent's balance & loan IDs
app.get('/api/balance-of', async (req, res) => {
  try {
    const balance = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi,
      functionName: 'balanceOf',
      args: [agentAddy],
    })
    const loanIds = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi,
      functionName: 'userLoanIds',
      args: [agentAddy],
    })
    res.json({ status: 'ok', balance: balance.toString(), loanIds })
  } catch (err) {
    console.error('balance-of error:', err)
    res.status(500).json({ error: err.message })
  }
})

app.listen(port, () => {
  console.log(`Server listening on port ${port} (chain=${CHAIN_NAME})`)
})
