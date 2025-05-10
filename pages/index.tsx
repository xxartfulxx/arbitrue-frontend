import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { Program, AnchorProvider, web3, BN } from '@project-serum/anchor';
import idl from '../idl/arbitrue.json';

const PROGRAM_ID = new PublicKey('7No7JduA1my3piwiNmZeojiixPojTVyfpEdv19AbJNe7'); // Replace with your deployed program ID

export default function Home() {
  const { publicKey, sendTransaction, connected } = useWallet();
  const [selfieHash, setSelfieHash] = useState('');
  const [status, setStatus] = useState('');

  const getProvider = () => {
    if (!publicKey || !sendTransaction) return null;
    const connection = new web3.Connection(web3.clusterApiUrl('devnet'), 'confirmed');
    return new AnchorProvider(connection, { publicKey, signTransaction: sendTransaction }, { commitment: 'confirmed' });
  };

  const initialize = async () => {
    const provider = getProvider();
    if (!provider) {
      setStatus('Please connect your wallet');
      return;
    }

    const program = new Program(idl, PROGRAM_ID, provider);
    const [globalPda] = PublicKey.findProgramAddressSync([Buffer.from('global')], PROGRAM_ID);
    const [feeWalletPda] = PublicKey.findProgramAddressSync([Buffer.from('fee_wallet')], PROGRAM_ID);

    try {
      const tx = await program.methods
        .initialize()
        .accounts({
          globalPda,
          payer: publicKey,
          usdcMint: new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'), // USDC mint (devnet)
          feeWalletPda,
          systemProgram: SystemProgram.programId,
          rent: web3.SYSVAR_RENT_PUBKEY,
        })
        .transaction();

      const signature = await sendTransaction(tx, provider.connection);
      await provider.connection.confirmTransaction(signature);
      setStatus('Initialization successful');
    } catch (error) {
      console.error(error);
      setStatus(`Error: ${error.message}`);
    }
  };

  const createUserAccount = async () => {
    const provider = getProvider();
    if (!provider || !selfieHash) {
      setStatus('Please connect wallet and provide selfie hash');
      return;
    }

    const program = new Program(idl, PROGRAM_ID, provider);
    const [userPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('user'), publicKey.toBuffer()],
      PROGRAM_ID
    );

    try {
      const selfieHashArray = Buffer.from(selfieHash, 'hex');
      if (selfieHashArray.length !== 32) throw new Error('Invalid selfie hash');

      const tx = await program.methods
        .createUserAccount([...selfieHashArray])
        .accounts({
          userPda,
          owner: publicKey,
          usdcMint: new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
          tokenProgram: new PublicKey('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'),
          systemProgram: SystemProgram.programId,
          rent: web3.SYSVAR_RENT_PUBKEY,
        })
        .transaction();

      const signature = await sendTransaction(tx, provider.connection);
      await provider.connection.confirmTransaction(signature);
      setStatus('User account created');
    } catch (error) {
      console.error(error);
      setStatus(`Error: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-6">Arbitrue Escrow DApp</h1>
      <WalletMultiButton />
      {connected && (
        <div className="w-full max-w-md">
          <div className="mb-4">
            <button
              onClick={initialize}
              className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
            >
              Initialize Program
            </button>
          </div>
          <div className="mb-4">
            <input
              type="text"
              placeholder="Selfie Hash (hex)"
              value={selfieHash}
              onChange={(e) => setSelfieHash(e.target.value)}
              className="w-full p-2 border rounded mb-2"
            />
            <button
              onClick={createUserAccount}
              className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
            >
              Create User Account
            </button>
          </div>
          <p className="text-red-500">{status}</p>
        </div>
      )}
    </div>
  );
}
