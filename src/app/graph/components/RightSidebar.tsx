import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Node, BadgeHolderReferralInfo } from "../types";
import { useConvertAddressToENS } from "@/app/hooks/useConvertAddressToENS";
import { useFarcasterData } from "@/app/hooks/useFarcasterData";
import { useRouter, usePathname } from "next/navigation";
import { Tooltip } from "react-tooltip";
import { Info } from "lucide-react";
import { api } from "@/trpc/react";

interface RightSidebarProps {
  selectedNodeId: string | null;
  selectedNode: Node | null;
  onClose: () => void;
}

const formatAddress = (address: string) => {
  if (address.length <= 20) return address; // If the address is too short, return it as is
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
};

const RightSidebar: React.FC<RightSidebarProps> = ({
  selectedNodeId,
  onClose,
  selectedNode
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  const { getFarcasterDataByAddress, isLoading: isFarcasterLoading } =
    useFarcasterData();

  const { data: nodeData, isLoading: isNodeLoading } =
    api.node.getById.useQuery(
      { id: selectedNodeId || "" },
      { enabled: !!selectedNodeId && !selectedNode }
    );

  const { data: farcasterConnections = [], isLoading: isConnectionsLoading } =
    api.farcaster.getConnectionsForNode.useQuery(
      { nodeId: selectedNodeId || "" },
      { enabled: !!selectedNodeId }
    );

  const filteredFarcasterConnections = farcasterConnections.filter(
    (connection) => connection !== null
  );

  const { data: badgeHolderReferrals, isLoading: isReferralsLoading } =
    api.badgeHolder.getReferralsForNode.useQuery(
      { nodeId: selectedNodeId || "" },
      { enabled: !!selectedNodeId }
    );

  const formattedReferrals = React.useMemo(() => {
    if (!badgeHolderReferrals) return undefined;
    return {
      referredBy: badgeHolderReferrals.referredBy.map((ref) => ({
        ...ref,
        address: ref.referredBy
      })),
      referred: badgeHolderReferrals.referred.map((ref) => ({
        ...ref,
        address: ref.recipient
      }))
    };
  }, [badgeHolderReferrals]);

  console.log("Referrals", formattedReferrals);

  const handleConnectionClick = useCallback(
    (connectionId: string) => {
      router.push(`${pathname}?nodeId=${connectionId}`);
    },
    [router, pathname, onClose]
  );

  useEffect(() => {
    if (selectedNodeId || selectedNode) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [selectedNodeId, selectedNode]);

  const displayNode = selectedNode || nodeData;

  if (isNodeLoading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!displayNode || !selectedNode) {
    return null;
  }

  return (
    <div
      className={`fixed right-0 top-0 h-full w-72 bg-dark-surface text-dark-text-primary overflow-y-auto transition-transform transform ease-in-out duration-300 ${
        isVisible ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <div className="p-6">
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
        <ProfileSection
          node={selectedNode}
          connections={filteredFarcasterConnections}
        />
        <BadgesSection node={selectedNode} />
        <BadgeholderReferralSection
          referrals={formattedReferrals}
          getFarcasterDataByAddress={getFarcasterDataByAddress}
        />

        <FarcasterConnectionsSection
          connections={filteredFarcasterConnections}
          isLoading={isFarcasterLoading || isConnectionsLoading}
          onConnectionClick={handleConnectionClick}
        />
      </div>
    </div>
  );
};

const ProfileSection: React.FC<{ node: Node; connections: string[] }> = ({
  node,
  connections
}) => {
  if (!node) return null;
  // console.log("nodeeee", node);
  // const { data: connectionData = [] } =
  //   api.farcaster.getDataForConnections.useQuery(
  //     { connectionIds: connections },
  //     { enabled: connections.length > 0 }
  //   );

  // if (isLoading) return <p>Loading Following on Farcaster...</p>;
  // if (connections.length === 0) return null;

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
          <p>· {connections?.length || 0} followings</p>
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
  console.log("Reffff", referrals.referredBy);
  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-2 flex items-center">
        <span className="mr-2">Badgeholder Referral</span>
        <Info
          size={16}
          className="text-dark-text-secondary cursor-help"
          data-tooltip-id="badgeholder-referral-tooltip"
        />
      </h3>
      <Tooltip
        id="badgeholder-referral-tooltip"
        place="top"
        className="max-w-[300px] text-center"
        content="Shows referral connections for RPGF (RetroPGF) rounds. 'Referred By' indicates who referred this badgeholder, while 'Referred' shows who this badgeholder referred for participation in specific RPGF rounds."
      />
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
  const address =
    type === "Referred By" ? referral.referredBy : referral.recipient;
  const { ensName } = useConvertAddressToENS(address ?? "");
  const farcasterData = getFarcasterDataByAddress(address ?? "");

  console.log("refa", farcasterData);
  if (!referral) return null;
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
            formatAddress(address ?? "")}
        </p>
        <p className="text-xs text-dark-text-secondary">
          RPGF Round: {referral.rpgfRound}
        </p>
      </div>
    </div>
  );
};

const FarcasterConnectionsSection: React.FC<{
  connections: string[];
  isLoading: boolean;
  onConnectionClick: (connectionId: string) => void;
}> = ({ connections, isLoading, onConnectionClick }) => {
  const { data: connectionData = [] } =
    api.farcaster.getDataForConnections.useQuery(
      { connectionIds: connections },
      { enabled: connections.length > 0 }
    );
  console.log("ConnectionData", connectionData);
  console.log("Connections", connections);
  if (isLoading) return <p>Loading Following on Farcaster...</p>;
  if (connections.length === 0) return null;

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2 flex items-center">
        <span className="mr-2">Following on Farcaster</span>
        <Info
          size={16}
          className="text-dark-text-secondary cursor-help"
          data-tooltip-id="farcaster-following-tooltip"
        />
      </h3>
      <Tooltip
        id="farcaster-following-tooltip"
        place="top"
        className="max-w-xs whitespace-pre-line text-center"
        content={`Citizens that this user follows\non the Farcaster network`}
      />
      {connectionData.map((connection, index) => (
        <div
          key={index}
          className="flex items-center mb-2 cursor-pointer hover:bg-dark-hover transition-colors duration-200 rounded-md p-1"
          onClick={() => onConnectionClick(connection.id)}
        >
          <img
            src={connection.profileImage || "/images/profile-ph.jpg"}
            alt="Connection"
            className="w-6 h-6 rounded-full mr-2"
          />
          <p className="text-sm">
            {connection.profileName ||
              connection.profileDisplayName ||
              formatAddress(connection.id)}
          </p>
        </div>
      ))}
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
