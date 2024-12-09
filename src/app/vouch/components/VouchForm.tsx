import { useState } from "react";
import { api } from "@/trpc/react";
import Toast from "./Toast";

interface VouchFormProps {
  currentAddress: string;
  refetchVouchedFor: () => void;
  refetchVouchesReceived: () => void;
}

const VouchForm: React.FC<VouchFormProps> = ({
  currentAddress,
  refetchVouchedFor,
  refetchVouchesReceived,
}) => {
  const vouchAnAddress = api.vouching.vouch.useMutation();
  const [vouchAddress, setVouchAddress] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const addressRegex = /^0x[a-fA-F0-9]{40}$/;

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
  };

  const handleVouch = async () => {
    if (!vouchAddress) {
      showToast("Please enter a valid wallet address.", "error");
      return;
    }

    try {
      await vouchAnAddress.mutateAsync({
        vouchingAddress: currentAddress,
        walletAddress: vouchAddress,
      });

      showToast(`You vouched for ${vouchAddress}`, "success");
      setVouchAddress("");
      refetchVouchedFor();
      refetchVouchesReceived();
    } catch (err: any) {
      console.error("Failed to vouch for address:", err);
      showToast(err?.message || "Failed to vouch for address.", "error");
    }
  };

  return (
    <div>
      <input
        type="text"
        value={vouchAddress}
        onChange={(e) => setVouchAddress(e.target.value)}
        placeholder="Enter Wallet Address to Vouch"
        className="w-full p-3 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        onClick={handleVouch}
        className="w-full mt-3 px-4 py-2 bg-blue-500 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={!vouchAddress || !addressRegex.test(vouchAddress)}
      >
        Vouch
      </button>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default VouchForm;

