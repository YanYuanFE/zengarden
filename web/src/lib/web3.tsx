import { createAppKit } from '@reown/appkit/react'
import { SolanaAdapter } from '@reown/appkit-adapter-solana'
import { solana, solanaDevnet } from '@reown/appkit/networks'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { AppKitNetwork } from '@reown/appkit/networks'

const queryClient = new QueryClient()

const projectId = 'b1daffdd6f590ce1fe948af2022b4ec1'

const metadata = {
  name: 'ZenGarden',
  description: 'Zen Garden - Focus to earn flower NFTs',
  url: 'https://zengarden.xyz',
  icons: ['https://zengarden.xyz/icon.png'],
}

const networks: [AppKitNetwork, ...AppKitNetwork[]] = [solana, solanaDevnet]

const solanaAdapter = new SolanaAdapter()

createAppKit({
  adapters: [solanaAdapter],
  networks,
  projectId,
  metadata,
  defaultNetwork: solana,
  features: {
    analytics: true,
  },
})

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
