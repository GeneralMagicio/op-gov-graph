"use client";

import { useState } from "react";
import { api } from "@/trpc/react";

const ScoringForm = () => {
  const [walletAddress, setWalletAddress] = useState("");

  const addressRegex = /^0x[a-fA-F0-9]{40}$/;

  const {
    data: sybilScore,
    isLoading,
    error,
    refetch,
  } = api.sybilScoring.calculateSybilScore.useQuery(
    { walletAddress },
    {
      enabled: false,
    }
  );

  const handleCalculateClick = () => {
    if (walletAddress && addressRegex.test(walletAddress)) {
      refetch();
    }
  };

  return (
    <div className="min-h-screen bg-dark-background flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">Sybil Score</h1>

        <div className="mb-4">
          <input
            type="text"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            placeholder="Enter Wallet Address"
            className="w-full border border-gray-300 rounded p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          onClick={handleCalculateClick}
          className="w-full px-4 py-2 bg-blue-500 text-white font-semibold rounded hover:bg-blue-600 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
          disabled={isLoading || !walletAddress || !addressRegex.test(walletAddress)}
        >
          Calculate
        </button>

        <div className="mt-6 text-center">
          {isLoading && <p className="text-gray-500">Loading...</p>}
          {error && <p className="text-red-500">Error: {error.message}</p>}
          {sybilScore !== undefined && (
            <p className="text-lg font-semibold text-green-500">
              Sybil Score: {sybilScore}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScoringForm;
