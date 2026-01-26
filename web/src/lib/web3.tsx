import { createAppKit } from '@reown/appkit/react'
import { WagmiProvider } from 'wagmi'
import { bsc } from '@reown/appkit/networks'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import type { AppKitNetwork } from '@reown/appkit/networks'

const queryClient = new QueryClient()

const projectId = 'b1daffdd6f590ce1fe948af2022b4ec1'

const metadata = {
  name: 'ZenGarden',
  description: 'Zen Garden - Focus to earn flower NFTs',
  url: 'https://zengarden.xyz',
  icons: ['https://zengarden.xyz/icon.png'],
}

const networks: [AppKitNetwork, ...AppKitNetwork[]] = [bsc]

const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks,
})

createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  metadata,
  defaultNetwork: bsc,
  features: {
    analytics: true,
  },
})

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}
