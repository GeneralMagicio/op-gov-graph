import { useEffect, useCallback, useState, useMemo } from "react";
import {
  ICitizen,
  TECHolder,
  RegenScore,
  TrustedSeed,
  FarcasterConnection,
  Link,
  Node,
  GraphData,
  BadgeHolder,
  NodeLinkType,
  RegenPOAPHolder,
  CitizenTransaction,
} from "../graph/types";

const DATA_URLS = {
  citizensWithFarcaster: "/data/CitizensWithoutFarcasterDataField.json",
  tecHolders: "/data/TECHolders.json",
  regenScores: "/data/RegenScore.json",
  trustedSeed: "/data/TrustedSeed.json",
  farcasterConnections: "/data/CitizensFarcasterConnections.json",
  badgeHolders: "/data/BadgeHolders.json",
  regenPOAP: "/data/RegenPOAP.json",
  citizenTransactions: "/data/citizenTransactions.json",
};

interface CitizenWithFarcaster extends ICitizen {
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

const fetchData = async <T>(url: string): Promise<T> => {
  const response = await fetch(url);
  return response.json();
};

const createNode = (id: string, type: string): Node => ({ id, type });

const createLink = (
  source: string,
  target: string,
  type: NodeLinkType
): Link => ({
  source: source,
  target,
  type,
});

const processCitizens = (citizens: ICitizen[]): Node[] =>
  citizens.map((citizen) => ({ ...citizen, type: "citizens" }));

const processBadgeHolders = (
  badgeHolders: BadgeHolder[],
  citizens: ICitizen[]
): Link[] => {
  const links: Link[] = [];
  const citizenIds = new Set(
    citizens.map((citizen) => citizen.id.toLowerCase())
  );

  badgeHolders.forEach((badgeHolder) => {
    const referredBy = badgeHolder.referredBy.toLowerCase();
    const recipient = badgeHolder.recipient.toLowerCase();

    if (
      referredBy !== "0x0000000000000000000000000000000000000000" &&
      citizenIds.has(referredBy) &&
      citizenIds.has(recipient)
    ) {
      links.push(
        createLink(
          badgeHolder.referredBy,
          badgeHolder.recipient,
          NodeLinkType.BadgeHolderReferral
        )
      );
    }
  });
  return links;
};

const processConnections = (
  citizensWithFarcaster: CitizenWithFarcaster[],
  tecHolders: TECHolder[],
  regenScores: RegenScore[],
  trustedSeeds: TrustedSeed[],
  farcasterConnections: FarcasterConnection[],
  badgeHolders: BadgeHolder[],
  regenPOAPHolders: RegenPOAPHolder[],
  citizenTransactions: CitizenTransaction[]
): Link[] => {
  const links: Link[] = [];
  const specialNodes = {
    TECHolder: createNode("TECHolder", "TECHolder"),
    RegenScore: createNode("RegenScore", "RegenScore"),
    TrustedSeed: createNode("TrustedSeed", "TrustedSeed"),
    RegenPOAP: createNode("RegenPOAP", "RegenPOAP"),
  };

  // Process citizen connections
  citizensWithFarcaster.forEach((citizen) => {
    const { id } = citizen;
    const lowerCaseId = id.toLowerCase();

    if (tecHolders.some((holder) => holder.id.toLowerCase() === lowerCaseId)) {
      links.push(
        createLink(id, specialNodes.TECHolder.id, NodeLinkType.TECHolder)
      );
    }
    if (
      regenScores.some((score) => score.address.toLowerCase() === lowerCaseId)
    ) {
      links.push(
        createLink(id, specialNodes.RegenScore.id, NodeLinkType.RegenScore)
      );
    }
    if (trustedSeeds.some((seed) => seed.id.toLowerCase() === lowerCaseId)) {
      links.push(
        createLink(id, specialNodes.TrustedSeed.id, NodeLinkType.TrustedSeed)
      );
    }
    if (
      regenPOAPHolders.some(
        (holder) => holder.Collection.toLowerCase() === lowerCaseId
      )
    ) {
      links.push(
        createLink(id, specialNodes.RegenPOAP.id, NodeLinkType.RegenPOAP)
      );
    }
  });

  // Process Farcaster connections
  farcasterConnections.forEach((connection) => {
    links.push(
      createLink(
        connection.source,
        connection.target,
        NodeLinkType.FarcasterConnection
      )
    );
  });

  // Process citizen transactions
  citizenTransactions.forEach((transaction) => {
    if (transaction.from !== transaction.to) {
      links.push(
        createLink(
          transaction.from,
          transaction.to,
          NodeLinkType.CitizenTransaction
        )
      );
    }
  });

  // Process badge holders
  links.push(...processBadgeHolders(badgeHolders, citizensWithFarcaster));

  return links;
};

export const useGraphData = (
  selectedConnectionsCheckBox: string[],
  selectedNodesCheckBox: string[]
): GraphData => {
  const [graphData, setGraphData] = useState<GraphData>({
    nodes: [],
    links: [],
  });

  const fetchAllData = useCallback(async () => {
    const [
      citizensWithFarcaster,
      tecHolders,
      regenScores,
      trustedSeeds,
      farcasterConnections,
      badgeHolders,
      regenPOAPHolders,
      citizenTransactions,
    ] = await Promise.all([
      fetchData<CitizenWithFarcaster[]>(DATA_URLS.citizensWithFarcaster),
      fetchData<TECHolder[]>(DATA_URLS.tecHolders),
      fetchData<RegenScore[]>(DATA_URLS.regenScores),
      fetchData<TrustedSeed[]>(DATA_URLS.trustedSeed),
      fetchData<FarcasterConnection[]>(DATA_URLS.farcasterConnections),
      fetchData<BadgeHolder[]>(DATA_URLS.badgeHolders),
      fetchData<RegenPOAPHolder[]>(DATA_URLS.regenPOAP),
      fetchData<CitizenTransaction[]>(DATA_URLS.citizenTransactions),
    ]);

    return {
      citizensWithFarcaster,
      tecHolders,
      regenScores,
      trustedSeeds,
      farcasterConnections,
      badgeHolders,
      regenPOAPHolders,
      citizenTransactions,
    };
  }, [selectedConnectionsCheckBox, selectedNodesCheckBox]);

  const processData = useCallback(
    (data: Awaited<ReturnType<typeof fetchAllData>>) => {
      const {
        citizensWithFarcaster,
        tecHolders,
        regenScores,
        trustedSeeds,
        farcasterConnections,
        badgeHolders,
        regenPOAPHolders,
        citizenTransactions,
      } = data;

      const nodes: Node[] = citizensWithFarcaster.map((citizen) => {
        const tecHolder = tecHolders.find(
          (holder) => holder.id.toLowerCase() === citizen.id.toLowerCase()
        );
        const regenScore = regenScores.find(
          (score) => score.address.toLowerCase() === citizen.id.toLowerCase()
        );
        const trustedSeed = trustedSeeds.find(
          (seed) => seed.id.toLowerCase() === citizen.id.toLowerCase()
        );
        const regenPOAP = regenPOAPHolders.find(
          (holder) =>
            holder.Collection.toLowerCase() === citizen.id.toLowerCase()
        );

        return {
          ...citizen,
          type: "citizens",
          tecBalance: tecHolder?.balance,
          regenScore: regenScore?.score,
          trustedSeed: !!trustedSeed,
          regenPOAP: !!regenPOAP,
          hasFarcaster: !!citizen.userId,
        };
      });

      nodes.push(
        createNode("TECHolder", "TECHolder"),
        createNode("RegenScore", "RegenScore"),
        createNode("TrustedSeed", "TrustedSeed"),
        createNode("RegenPOAP", "RegenPOAP")
      );

      const links = processConnections(
        citizensWithFarcaster,
        tecHolders,
        regenScores,
        trustedSeeds,
        farcasterConnections,
        badgeHolders,
        regenPOAPHolders,
        citizenTransactions
      );

      return { nodes, links };
    },
    []
  );

  useEffect(() => {
    fetchAllData()
      .then(processData)
      .then((data) => {
        setGraphData(data);
      });
  }, [fetchAllData, processData]);

  return graphData;
};
