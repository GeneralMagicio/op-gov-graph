import { useWeb3Modal } from "@web3modal/wagmi/react";

const ConnectWallet = () => {
  const { open } = useWeb3Modal();

  return (
    <div>
      <button
        onClick={() => open()}
        className="w-full px-4 py-2 bg-blue-500 rounded hover:bg-blue-600 transition"
      >
        Connect Wallet
      </button>
    </div>
  );
};

export default ConnectWallet;
