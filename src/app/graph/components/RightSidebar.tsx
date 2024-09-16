import React, { useMemo } from "react";
import { Node, BadgeHolderReferralInfo } from "../types";
import { useConvertAddressToENS } from "@/app/hooks/useConvertAddressToENS";
import { useFarcasterData } from "@/app/hooks/useFarcasterData";

interface RightSidebarProps {
  selectedNode: Node | null;
  onClose: () => void;
}

const RightSidebar: React.FC<RightSidebarProps> = ({
  selectedNode,
  onClose,
}) => {
  const { getFarcasterDataForConnections, isLoading } = useFarcasterData();

  const farcasterConnections = useMemo(() => {
    if (!selectedNode?.followings) return [];
    const connectionIds = selectedNode.followings.map(
      (f) => f.followingProfileId
    );
    const data = getFarcasterDataForConnections(connectionIds);
    console.log("Ali", data);
    return data;
  }, [selectedNode?.followings, getFarcasterDataForConnections]);

  if (!selectedNode) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-dark-surface text-dark-text-primary overflow-y-auto transition-transform transform ease-in-out duration-300 translate-x-0 p-6">
      <button
        onClick={onClose}
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
      />
      <FarcasterConnectionsSection
        connections={farcasterConnections}
        isLoading={isLoading}
      />
    </div>
  );
};
const ProfileSection: React.FC<{ node: Node }> = ({ node }) => {
  return (
    <div className="flex flex-col items-center mb-6">
      <img
        src={node.profileImage || `/api/placeholder/100/100`}
        alt="Profile"
        className="w-24 h-24 rounded-full mb-4 border-4 border-white"
      />
      <h2 className="text-2xl font-bold">{node.ens || node.id}</h2>
      {node.profileName && (
        <div className="flex gap-2">
          <p className="text-dark-primary">@{node.profileName} </p>
          <p> · {node.followings?.length || 0} followings</p>
        </div>
      )}
      {node.profileBio && (
        <p
          className="mt-4 text-dark-text-secondary text-sm"
          dangerouslySetInnerHTML={{ __html: formatBio(node.profileBio) }}
        />
      )}
    </div>
  );
};

const BadgesSection: React.FC<{ node: Node }> = ({ node }) => {
  return (
    <div className="mb-6">
      {node.tecBalance && (
        <div className="flex items-center mb-2">
          <span className="mr-2">✓</span>
          <span>TEC Holder</span>
        </div>
      )}
      {node.regenScore && (
        <div className="flex items-center">
          <span className="mr-2">✓</span>
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
}> = ({ referrals }) => {
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
        />
      ))}
      {referrals.referred.map((referral, index) => (
        <ReferralItem
          key={`referred-${index}`}
          referral={referral}
          type="Referred"
        />
      ))}
    </div>
  );
};

const ReferralItem: React.FC<{
  referral: BadgeHolderReferralInfo;
  type: "Referred By" | "Referred";
}> = ({ referral, type }) => {
  const { ensName } = useConvertAddressToENS(referral.address);

  return (
    <div className="flex items-center mb-2">
      <img
        src={`/api/placeholder/24/24`}
        alt="Referral"
        className="w-6 h-6 rounded-full mr-2"
      />
      <div>
        <p className="text-sm">
          {type} {ensName}
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
              src={connection.profileImage || `/api/placeholder/24/24`}
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
