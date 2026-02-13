import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { bsc } from '@reown/appkit/networks'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import type { AppKitNetwork } from '@reown/appkit/networks'

const queryClient = new QueryClient()

const projectId = 'b1daffdd6f590ce1fe948af2022b4ec1'

const metadata = {
  name: 'ZenGarden',
  description: 'Zen Garden - Focus to earn flower NFTs',
  url: 'https://zengarden.pixstudio.art',
  icons: ['https://zengarden.pixstudio.art/logo.png'],
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
