import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Connection, PublicKey, SystemProgram, Transaction, TransactionInstruction } from '@solana/web3.js';
import idl from '../../idl/arbitrue.json';

const PROGRAM_ID = new PublicKey('7No7JduA1my3piwiNmZeojiixPojTVyfpEdv19AbJNe7');

export default function Home() {
  const { publicKey, sendTransaction, connected } = useWallet();
  const [selfieHash, setSelfieHash] = useState('');
  const [status, setStatus] = useState('');

  const initialize = async () => {
    if (!publicKey) {
      setStatus('Please connect your wallet');
      return;
    }

    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
    const [globalPda] = PublicKey.findProgramAddressSync([Buffer.from('global')], PROGRAM_ID);
    const [feeWalletPda] = PublicKey.findProgramAddressSync([Buffer.from('fee_wallet')], PROGRAM_ID);

    try {
      const instruction = new TransactionInstruction({
        keys: [
          { pubkey: globalPda, isSigner: false, isWritable: true },
          { pubkey: publicKey, isSigner: true, isWritable: true },
          { pubkey: new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'), isSigner: false, isWritable: false }, // USDC mint (devnet)
          { pubkey: feeWalletPda, isSigner: false, isWritable: false },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
          { pubkey: web3.SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
        ],
        programId: PROGRAM_ID,
        data: Buffer.from([0]), // Assuming instruction discriminator 0 for initialize
      });

      const transaction = new Transaction().add(instruction);
      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature);
      setStatus('Initialization successful');
    } catch (error) {
      console.error(error);
      setStatus(`Error: ${error.message}`);
    }
  };

  const createUserAccount = async () => {
    if (!publicKey || !selfieHash) {
      setStatus('Please connect wallet and provide selfie hash');
      return;
    }

    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
    const [userPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('user'), publicKey.toBuffer()],
      PROGRAM_ID
    );

    try {
      const selfieHashArray = Buffer.from(selfieHash, 'hex');
      if (selfieHashArray.length !== 32) throw new Error('Invalid selfie hash');

      const instruction = new TransactionInstruction({
        keys: [
          { pubkey: userPda, isSigner: false, isWritable: true },
          { pubkey: publicKey, isSigner: true, isWritable: true },
          { pubkey: new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'), isSigner: false, isWritable: false },
          { pubkey: new PublicKey('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'), isSigner: false, isWritable: false },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
          { pubkey: web3.SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
        ],
        programId: PROGRAM_ID,
        data: Buffer.concat([Buffer.from([1]), Buffer.from(selfieHashArray)]), // Discriminator 1 for createUserAccount
      });

      const transaction = new Transaction().add(instruction);
      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature);
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
