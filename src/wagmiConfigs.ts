import { cookieStorage, createConfig, createStorage } from 'wagmi';
import { createClient, http } from "viem";
import {
  arbitrum,
  base,
  gnosis,
  mainnet,
  optimism,
  polygon
} from "wagmi/chains";
import { injected, safe, walletConnect } from "wagmi/connectors";

export const projectId = "275cb569b0d41a83cb3e9ebc1250cb68";

export const metadata = {
  name: "OP GovGraph",
  description: "OP GovGraph...",
  url: "https://op.govgraph.fyi",
  icons: []
};

export const wagmiConfig = createConfig({
  chains: [mainnet, optimism, arbitrum, polygon, base, gnosis],
  ssr: true,
  storage: createStorage({
    storage: cookieStorage
  }),
  client({ chain }) {
    return createClient({ chain, transport: http() });
  }
});
