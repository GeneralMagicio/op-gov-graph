import { getAddress } from 'viem';
import { GET_ADDRESS_POAPS_QUERY } from "../../gql-queries/sybil.queries";

const POAP_GRAPHQL_API_URL = "https://public.compass.poap.tech/v1/graphql";
const SAFE_API_URL = "https://safe-transaction-sepolia.safe.global/api/v1";

interface ITransfer {
  timestamp: string;
}

interface IAggregateSum {
  poap_count: number;
}

interface IAggregate {
  sum: IAggregateSum;
}

interface IStatsByChainAggregate {
  aggregate: IAggregate;
}

interface IDrop {
  id: string;
  created_date: string;
  end_date: string;
  start_date: string;
  image_url: string;
  country: string;
  city: string;
  expiry_date: string;
  name: string;
  stats_by_chain_aggregate: IStatsByChainAggregate;
}

export interface IPOAP {
  id: string;
  chain: string;
  transfers: ITransfer[];
  minting_stats: {
    mint_order: number;
  };
  drop: IDrop;
}

export const getPOAPs = async (walletAddress: string): Promise<IPOAP[]> => {
  const variables = {
    limit: 100,
    offset: 100,
    order_by: {
      id: "desc"
    },
    where: {
      collector_address: {
        _eq: walletAddress.toLocaleLowerCase()
      }
    }
  };

  try {
    const response = await fetch(POAP_GRAPHQL_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        query: GET_ADDRESS_POAPS_QUERY,
        variables
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("POAPs:", data);
    return data.data.poaps ?? [];
  } catch (error) {
    console.error("Failed to fetch POAPs:", error);
    return [];
  }
};

export const getMultisigWallets = async (
  walletAddress: string
): Promise<string[]> => {
  try {
    const formatedAddress = getAddress(walletAddress);

    const res = await fetch(
      `${SAFE_API_URL}/owners/${formatedAddress}/safes`
    );
    const data = await res.json();
    console.log("Multisig Wallets:", data);

    if (!data.safes) {
      return [];
    }

    return data.safes;
  } catch (error) {
    console.error("Failed to fetch Multisig Wallets:", error);
    return [];
  }
};
