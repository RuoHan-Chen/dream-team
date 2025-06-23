import { createPublicClient, http } from 'viem'
import { sepolia } from 'viem/chains'

export async function POST(req) {
  try {
    const { txHash, rpcUrl } = await req.json()

    if (!txHash || !rpcUrl) {
      return Response.json({ error: 'Missing txHash or rpcUrl' }, { status: 400 })
    }

    const client = createPublicClient({
      chain: sepolia,
      transport: http(rpcUrl),
    })

    const receipt = await client.getTransactionReceipt({ hash: txHash })

    if (!receipt.contractAddress) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const receipt2 = await client.getTransactionReceipt({ hash: txHash })
      if (!receipt2.contractAddress) {
        return Response.json({ status: 'error', error: 'No contractAddress found — was this a contract deployment?' }, { status: 400 })
      }
      return Response.json({
        status: 'success',
        contractAddress: receipt2.contractAddress
      })
    }

    return Response.json({
      status: 'success',
      contractAddress: receipt.contractAddress
    })
  } catch (err) {
    return Response.json({ status: 'error', error: err.message }, { status: 500 })
  }
}
