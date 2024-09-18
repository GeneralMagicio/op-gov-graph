import { NodeLinkType } from ".";

export interface ConnectionType {
  key: NodeLinkType;
  text: string;
  color: string;
}

export const CONNECTION_TYPES: ConnectionType[] = [
  {
    key: NodeLinkType.FarcasterConnection,
    text: "Farcaster connections",
    color: "#01D3DE",
  },
  {
    key: NodeLinkType.BadgeHolderReferral,
    text: "BadgeHolder Referral",
    color: "#FE5B00",
  },
  { key: NodeLinkType.RegenPOAP, text: "ReFi POAPs", color: "#C6CE01" },
  { key: NodeLinkType.RegenScore, text: "RegenScore", color: "#FFB900" },
  { key: NodeLinkType.TrustedSeed, text: "Trusted Seed", color: "#6EE6B6" },
  {
    key: NodeLinkType.CitizenTransaction,
    text: "Mutual Transactions",
    color: "#FF66E3",
  },
  { key: NodeLinkType.TECHolder, text: "TEC Holder", color: "#79A4FF" },
];

export const getConnectionTypeByKey = (
  key: NodeLinkType
): ConnectionType | undefined => {
  return CONNECTION_TYPES.find((type) => type.key === key);
};
