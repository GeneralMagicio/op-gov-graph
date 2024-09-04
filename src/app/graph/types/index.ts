// types.ts

export enum NodeLinkType {
  TECHolder = "TECHolder",
  RegenScore = "RegenScore",
  TrustedSeed = "TrustedSeed",
  FarcasterConnection = "FarcasterConnection",
  BadgeHolderReferral = "BadgeHolderReferral",
  RegenPOAP = "RegenPOAP",
  CitizenTransaction = "CitizenTransaction",
}

export interface RegenPOAPHolder {
  Collection: string;
  Count: number;
}

export interface Link {
  source: string;
  target: string;
  type: NodeLinkType;
}

export interface ICitizen {
  id: string;
  ens?: string;
  x?: number;
  y?: number;
  type?: string;
  userId?: string;
  userAssociatedAddresses?: string[];
  identity?: string;
  profileImage?: string;
  profileName?: string;
  profileDisplayName?: string;
  profileBio?: string;
  userAddress?: string;
  chainId?: string;
  followings?: {
    id: string;
    blockchain: string;
    followingProfileId: string;
  }[];
}

export interface Node extends ICitizen {
  id: string;
  degree?: number;
  name?: string;
  x?: number;
  y?: number;
  type?: string;
  tecBalance?: string;
  regenScore?: number;
  trustedSeed?: boolean;
  regenPOAP?: boolean;
  hasFarcaster?: boolean;
}

export interface GraphData {
  nodes: Node[];
  links: Link[];
}

export interface NodeWithNeighbors extends Node {
  neighbors?: Node[];
  links?: Link[];
}

export interface GraphDataWithNeighbors extends GraphData {
  nodes: NodeWithNeighbors[];
}

export interface TECHolder {
  id: string;
  balance: string;
  pendingBalanceUpdate: string;
  x?: number;
  y?: number;
  type?: string;
}

export interface RegenScore {
  id: string;
  score: number;
  address: string;
  meta: string;
  x?: number;
  y?: number;
  type?: string;
}

export interface TrustedSeed {
  id: string;
  x?: number;
  y?: number;
  type?: string;
}

export interface FarcasterConnection {
  source: string;
  target: string;
}

export interface BadgeHolder {
  id: string;
  attester: string;
  recipient: string;
  rpgfRound: string;
  referredBy: string;
  referredMethod: string;
}

export interface CitizenTransaction {
  date: string;
  from: string;
  to: string;
  tokenName: string;
  tokenSymbol: string;
  value: number;
  hash: string;
}
