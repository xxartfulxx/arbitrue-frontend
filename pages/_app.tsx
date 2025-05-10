import { AppProps } from 'next/app';
import { FC, useEffect, useState } from 'react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import '../styles/globals.css';

// Default styles for wallet modal
import '@solana/wallet-adapter-react-ui/styles.css';

// Client-only wrapper to prevent SSR issues
const ClientOnly: FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  return <>{children}</>;
};

const WalletConnectionProvider: FC<{ children: React.ReactNode }> = ({ children }) => {
  const network = WalletAdapterNetwork.Devnet;
  const wallets = [new SolflareWalletAdapter()]; // Removed PhantomWalletAdapter

  return (
    <WalletProvider wallets={wallets} autoConnect>
      <WalletModalProvider>{children}</WalletModalProvider>
    </WalletProvider>
  );
};

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ClientOnly>
      <WalletConnectionProvider>
        <Component {...pageProps} />
      </WalletConnectionProvider>
    </ClientOnly>
  );
}
