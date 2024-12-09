"use client";

import { api } from "@/trpc/react";
import { useState, useEffect } from "react";
import { useAccount, useDisconnect } from "wagmi";
import ConnectWallet from "./ConnectWallet";
import VouchForm from "./VouchForm";

const VOUCH_THRESHOLD = 5;

const VouchingCard = () => {
  const { isConnected, address } = useAccount();
  const { disconnectAsync } = useDisconnect();

  const [vouchedFor, setVouchedFor] = useState<number>(0);
  const [vouchesReceived, setVouchesReceived] = useState<number>(0);

  const { data: vouchedForData, refetch: refetchVouchedFor } =
    api.vouching.getVouchedCount.useQuery(
      { walletAddress: address || "" },
      { enabled: !!address }
    );

  const { data: vouchesReceivedData, refetch: refetchVouchesReceived } =
    api.vouching.getVouchesCount.useQuery(
      { walletAddress: address || "" },
      { enabled: !!address }
    );

  const {
    data: userSybilScore,
    isLoading,
    error
  } = api.sybilScoring.calculateSybilScore.useQuery(
    { walletAddress: address || "" },
    {
      enabled: !!address
    }
  );

  useEffect(() => {
    if (vouchedForData) setVouchedFor(vouchedForData);
    if (vouchesReceivedData) setVouchesReceived(vouchesReceivedData);
  }, [vouchedForData, vouchesReceivedData]);

  return (
    <div className="min-h-screen bg-dark-background text-white flex flex-col items-center justify-center">
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-xl">
        <h1 className="text-3xl font-bold text-center mb-6">Vouching Page</h1>
        {!isConnected ? (
          <ConnectWallet />
        ) : (
          <div>
            <p className="text-center mb-4">Connected Wallet: {address}</p>
            <p className="text-center mb-4">
              Your score is: {isLoading ? "..." : userSybilScore}
            </p>
            {isLoading ||
            (userSybilScore && userSybilScore >= VOUCH_THRESHOLD) ? (
              <VouchForm
                currentAddress={address!}
                refetchVouchedFor={refetchVouchedFor}
                refetchVouchesReceived={refetchVouchesReceived}
              />
            ) : (
              <div className="border border-red-400 p-4 rounded-xl text-red-200">
                You need a score of {VOUCH_THRESHOLD} to vouch for others.
              </div>
            )}
          </div>
        )}
        {address && (
          <div className="mt-12 mb-6">
            <h2 className="text-xl font-bold mb-6 text-center">
              Vouching Stats
            </h2>
            {error && (
              <p className="text-center text-red-500">Error: {error.message}</p>
            )}
            {isLoading && (
              <p className="text-center text-gray-500">Loading...</p>
            )}
            {!isLoading && !error && (
              <div className="flex justify-around">
                <div className="flex flex-col border border-gray-400 p-4 rounded-xl text-center gap-4">
                  <p>Vouched for</p>
                  <p className="text-2xl font-bold">{vouchedFor}</p>
                </div>
                <div className="flex flex-col border border-gray-400 p-4 rounded-xl text-center gap-4">
                  {" "}
                  <p>You received</p>
                  <p className="text-2xl font-bold">{vouchesReceived}</p>
                </div>
              </div>
            )}
          </div>
        )}
        {isConnected && (
          <button
            onClick={() => disconnectAsync()}
            className="w-full mt-6 px-4 py-2 bg-red-500 rounded hover:bg-red-600 transition"
          >
            Disconnect Wallet
          </button>
        )}
      </div>
    </div>
  );
};

export default VouchingCard;
