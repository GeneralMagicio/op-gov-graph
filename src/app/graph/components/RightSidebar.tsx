import React, { useEffect, useMemo, useState } from "react";
import { Node, BadgeHolderReferralInfo } from "../types";
import { useConvertAddressToENS } from "@/app/hooks/useConvertAddressToENS";
import { useFarcasterData } from "@/app/hooks/useFarcasterData";

interface RightSidebarProps {
  selectedNode: Node | null;
  onClose: () => void;
}

const formatAddress = (address: string) => {
  if (address.length <= 20) return address; // If the address is too short, return it as is
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
};

const RightSidebar: React.FC<RightSidebarProps> = ({
  selectedNode,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const {
    getFarcasterDataForConnections,
    getFarcasterDataByAddress,
    isLoading,
  } = useFarcasterData();

  const farcasterConnections = useMemo(() => {
    if (!selectedNode?.followings) return [];
    const connectionIds = selectedNode.followings.map(
      (f) => f.followingProfileId
    );
    return getFarcasterDataForConnections(connectionIds);
  }, [selectedNode?.followings, getFarcasterDataForConnections]);

  useEffect(() => {
    if (selectedNode) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [selectedNode]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Delay onClose to allow animation to complete
  };

  return (
    <div
      className={`fixed right-0 top-0 h-full w-72 bg-dark-surface text-dark-text-primary overflow-y-auto transition-transform transform ease-in-out duration-300 ${
        isVisible ? "translate-x-0" : "translate-x-full"
      }`}
    >
      {selectedNode && (
        <div className="p-6">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-gray-600 hover:text-gray-800 transition-colors duration-200"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          <ProfileSection node={selectedNode} />
          <BadgesSection node={selectedNode} />
          <BadgeholderReferralSection
            referrals={selectedNode.badgeHolderReferrals}
            getFarcasterDataByAddress={getFarcasterDataByAddress}
          />
          <FarcasterConnectionsSection
            connections={farcasterConnections}
            isLoading={isLoading}
          />
        </div>
      )}
    </div>
  );
};

const ProfileSection: React.FC<{ node: Node }> = ({ node }) => {
  return (
    <div className="flex flex-col items-center mb-6">
      <img
        src={node.profileImage || "/images/profile-ph.jpg"}
        alt="Profile"
        className="w-24 h-24 rounded-full mb-4 border-4 border-white"
      />
      <h2 className="text-2xl font-bold">
        {node.ens || formatAddress(node.id)}
      </h2>
      {node.profileName && (
        <div className="flex gap-1">
          <a
            href={`https://warpcast.com/${node.profileName}`}
            className="text-dark-primary font-medium"
            target="_blank"
            rel="noopener noreferrer"
          >
            @{node.profileName}
          </a>
          <p>· {node.followings?.length || 0} followings</p>
        </div>
      )}
      {node.profileBio && (
        <div>
          <p
            className="mt-9 text-left text-dark-text-primary text-sm self-start"
            dangerouslySetInnerHTML={{ __html: formatBio(node.profileBio) }}
          />
        </div>
      )}
    </div>
  );
};

const BadgesSection: React.FC<{ node: Node }> = ({ node }) => {
  return (
    <div className="mb-6">
      {node.tecBalance && (
        <div className="flex items-center mb-2">
          <span className="mr-2 p-1 border text-dark-text-secondary border-dark-text-secondary rounded-lg flex items-center justify-center w-5 h-5">
            ✓
          </span>{" "}
          <span>TEC Holder</span>
        </div>
      )}
      {node.regenScore && (
        <div className="flex items-center">
          <span className="mr-2 p-1 border text-dark-text-secondary border-dark-text-secondary rounded-lg flex items-center justify-center w-5 h-5">
            ✓
          </span>{" "}
          <span>RegenScore · {node.regenScore}</span>
        </div>
      )}
    </div>
  );
};

const BadgeholderReferralSection: React.FC<{
  referrals:
    | {
        referredBy: BadgeHolderReferralInfo[];
        referred: BadgeHolderReferralInfo[];
      }
    | undefined;
  getFarcasterDataByAddress: (
    address: string
  ) => { profileImage?: string; profileName?: string } | undefined;
}> = ({ referrals, getFarcasterDataByAddress }) => {
  if (
    !referrals ||
    (referrals.referredBy.length === 0 && referrals.referred.length === 0)
  )
    return null;

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-2">Badgeholder Referral</h3>
      {referrals.referredBy.map((referral, index) => (
        <ReferralItem
          key={`referredBy-${index}`}
          referral={referral}
          type="Referred By"
          getFarcasterDataByAddress={getFarcasterDataByAddress}
        />
      ))}
      {referrals.referred.map((referral, index) => (
        <ReferralItem
          key={`referred-${index}`}
          referral={referral}
          type="Referred"
          getFarcasterDataByAddress={getFarcasterDataByAddress}
        />
      ))}
    </div>
  );
};

const ReferralItem: React.FC<{
  referral: BadgeHolderReferralInfo;
  type: "Referred By" | "Referred";
  getFarcasterDataByAddress: (
    address: string
  ) => { profileImage?: string; profileName?: string } | undefined;
}> = ({ referral, type, getFarcasterDataByAddress }) => {
  const { ensName } = useConvertAddressToENS(referral.address);
  const farcasterData = getFarcasterDataByAddress(referral.address);

  return (
    <div className="flex items-center mb-2">
      <img
        src={farcasterData?.profileImage || "/images/profile-ph.jpg"}
        alt="Referral"
        className="w-6 h-6 rounded-full mr-2"
      />
      <div>
        <p className="text-sm">
          {type}{" "}
          {farcasterData?.profileName ||
            formatAddress(ensName) ||
            formatAddress(referral.address)}
        </p>
        <p className="text-xs text-dark-text-secondary">
          RPGF Round: {referral.rpgfRound}
        </p>
      </div>
    </div>
  );
};

const FarcasterConnectionsSection: React.FC<{
  connections: {
    userId: string;
    id?: string;
    profileImage?: string;
    profileName?: string;
  }[];
  isLoading: boolean;
}> = ({ connections, isLoading }) => {
  if (isLoading) return <p>Loading Farcaster connections...</p>;
  if (connections.length === 0) return null;

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Farcaster Connections</h3>
      {connections.map((connection, index) =>
        connection.profileImage || connection.profileName ? (
          <div key={index} className="flex items-center mb-2">
            <img
              src={connection.profileImage || "/images/profile-ph.jpg"}
              alt="Connection"
              className="w-6 h-6 rounded-full mr-2"
            />
            <p className="text-sm">
              {connection.profileName || connection.id || connection.userId}
            </p>
          </div>
        ) : null
      )}
    </div>
  );
};

const formatBio = (bio: string) => {
  // Replace URLs with clickable links
  return bio.replace(
    /(https?:\/\/[^\s]+)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-dark-primary underline">$1</a>'
  );
};

export default RightSidebar;
