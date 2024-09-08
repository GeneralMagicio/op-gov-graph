import { useState, useEffect } from "react";
import { convertAddressToENS } from "../utils/covertAddressToENS";

export const useConvertAddressToENS = (address: string) => {
  const [ensName, setEnsName] = useState<string>(address);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    convertAddressToENS(address).then((result) => {
      if (isMounted) {
        setEnsName(result);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [address]);

  return { ensName, isLoading };
};
