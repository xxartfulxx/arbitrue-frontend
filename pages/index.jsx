// pages/index.jsx
import React, { useState, useMemo, useEffect } from 'react'
import {
  ConnectionProvider,
  WalletProvider,
  useConnection,
  useWallet
} from '@solana/wallet-adapter-react'
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets'
import { clusterApiUrl, PublicKey, TransactionInstruction, Transaction, SystemProgram, SYSVAR_RENT_PUBKEY } from '@solana/web3.js'
import { serialize } from 'borsh'
import { Buffer } from 'buffer'

if (!global.Buffer) global.Buffer = Buffer

const PROGRAM_ID = new PublicKey('7No7JduA1my3piwiNmZeojiixPojTVyfpEdv19AbJNe7')
const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v')
const TOKEN_PROGRAM = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')

const schema = new Map([ /* your borsh schema here */ ])

function Main() {
  const { connection } = useConnection()
  const { publicKey, sendTransaction } = useWallet()
  const [status, setStatus] = useState('')

  const sendInstruction = async (instructionData, accounts) => {
    if (!publicKey) {
      setStatus('Please connect your wallet')
      return
    }
    try {
      const data = Buffer.from(serialize(schema, instructionData))
      const ix = new TransactionInstruction({ keys: accounts, programId: PROGRAM_ID, data })
      const tx = new Transaction().add(ix)
      const sig = await sendTransaction(tx, connection)
      await connection.confirmTransaction(sig, 'confirmed')
      setStatus(`✅ ${sig}`)
    } catch (e) {
      setStatus(`❌ ${e.message}`)
    }
  }

  // your initialize(), deposit(), etc. functions here,
  // exactly as you had them, but using sendInstruction()

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-6">Arbitrue Escrow</h1>
        <div className="flex justify-center mb-4">
          <WalletMultiButton />
        </div>
        {/* render your buttons and inputs here, wired up to the functions */}
        <p className="mt-4 text-center">{status}</p>
      </div>
    </div>
  )
}

export default function App() {
  const endpoint = useMemo(() => clusterApiUrl('devnet'), [])
  const wallets = useMemo(() => [new PhantomWalletAdapter()], [])

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <Main />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}
