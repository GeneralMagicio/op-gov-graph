import { getEnsAddress } from "@wagmi/core";
import { wagmiConfig } from "@/wagmiConfigs";

export function isAddressENS(ens: string | undefined) {
  if (!ens) return false;
  return ens?.toLowerCase().indexOf(".eth") > -1;
}

export async function getAddressFromENS(ens: string | undefined) {
   return await getEnsAddress(wagmiConfig, { name: ens! });
}
