import { useCallback } from "react";
import { api } from "@/trpc/react";

interface FarcasterData {
  [userId: string]: {
    id: string;
    profileImage?: string;
    profileName?: string;
    profileDisplayName?: string;
  };
}

export const useFarcasterData = () => {
  const { data: farcasterData = {}, isLoading } =
    api.farcaster.getAllData.useQuery<FarcasterData>();

  const { data: addressToUserIdMap = {} } =
    api.farcaster.getAddressToUserIdMap.useQuery<{
      [address: string]: string;
    }>();

  const getFarcasterDataForConnections = useCallback(
    (connections: string[]) => {
      return connections.map((userId) => ({
        userId,
        ...farcasterData[userId]
      }));
    },
    [farcasterData]
  );

  const getFarcasterDataByAddress = useCallback(
    (address: string) => {
      const userId = addressToUserIdMap[address.toLowerCase()];
      return userId ? farcasterData[userId] : undefined;
    },
    [farcasterData, addressToUserIdMap]
  );

  return {
    getFarcasterDataForConnections,
    getFarcasterDataByAddress,
    isLoading
  };
};
