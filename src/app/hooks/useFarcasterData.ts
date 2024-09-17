import { useState, useEffect, useCallback } from "react";

interface FarcasterData {
  [userId: string]: {
    id: string;
    profileImage?: string;
    profileName?: string;
  };
}

export const useFarcasterData = () => {
  const [farcasterData, setFarcasterData] = useState<FarcasterData>({});
  const [addressToUserIdMap, setAddressToUserIdMap] = useState<{
    [address: string]: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);

  const fetchFarcasterData = useCallback(async () => {
    if (Object.keys(farcasterData).length > 0) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        "/data/CitizensWithoutFarcasterDataField.json"
      );
      const data = await response.json();
      const processedData: FarcasterData = {};
      const addressMap: { [address: string]: string } = {};

      data.forEach((citizen: any) => {
        if (citizen.userId) {
          processedData[citizen.userId] = {
            id: citizen.id,
            profileImage: citizen.profileImage,
            profileName: citizen.profileName,
          };
          addressMap[citizen.id.toLowerCase()] = citizen.userId;
        }
      });

      setFarcasterData(processedData);
      setAddressToUserIdMap(addressMap);
    } catch (error) {
      console.error("Error fetching Farcaster data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [farcasterData]);

  useEffect(() => {
    fetchFarcasterData();
  }, [fetchFarcasterData]);

  const getFarcasterDataForConnections = useCallback(
    (connections: string[]) => {
      return connections.map((userId) => ({
        userId,
        ...farcasterData[userId],
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
    isLoading,
  };
};
