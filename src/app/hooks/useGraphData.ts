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
  BadgeHolderReferralInfo,
  NodeType
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
  refiDAO: "/data/RefiDao.json" // Add this line
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
  isSpecial?: boolean;
  followings?: {
    id: string;
    blockchain: string;
    followingProfileId: string;
  }[];
}

const fetchData = async <T>(url: string): Promise<T> => {
  const response = await fetch(url);
  const data: unknown = await response.json();
  return data as T;
};

const createNode = (id: string, type: NodeType): Node => ({ id, type });

const createLink = (
  source: string,
  target: string,
  type: NodeLinkType
): Link => ({
  source: source,
  target,
  type
});

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
  // refiDAOHolders: RefiDAO[]
): Link[] => {
  const links: Link[] = [];
  const specialNodes = {
    TECHolder: createNode("TECHolder", NodeType.TECHolder),
    RegenScore: createNode("RegenScore", NodeType.RegenScore),
    TrustedSeed: createNode("TrustedSeed", NodeType.TrustedSeed),
    RegenPOAP: createNode("RegenPOAP", NodeType.RegenPOAP)
    // RefiDAO: createNode("RefiDAO", NodeType.RefiDAO),
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
    // if (
    //   refiDAOHolders.some(
    //     (holder) => holder.address.toLowerCase() === lowerCaseId
    //   )
    // ) {
    //   links.push(createLink(id, specialNodes.RefiDAO.id, NodeLinkType.RefiDAO));
    // }
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
    links: []
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
      citizenTransactions
      // refiDAOHolders,
    ] = await Promise.all([
      fetchData<CitizenWithFarcaster[]>(DATA_URLS.citizensWithFarcaster),
      fetchData<TECHolder[]>(DATA_URLS.tecHolders),
      fetchData<RegenScore[]>(DATA_URLS.regenScores),
      fetchData<TrustedSeed[]>(DATA_URLS.trustedSeed),
      fetchData<FarcasterConnection[]>(DATA_URLS.farcasterConnections),
      fetchData<BadgeHolder[]>(DATA_URLS.badgeHolders),
      fetchData<RegenPOAPHolder[]>(DATA_URLS.regenPOAP),
      fetchData<CitizenTransaction[]>(DATA_URLS.citizenTransactions)
      // fetchData<RefiDAO[]>(DATA_URLS.refiDAO),
    ]);

    return {
      citizensWithFarcaster,
      tecHolders,
      regenScores,
      trustedSeeds,
      farcasterConnections,
      badgeHolders,
      regenPOAPHolders,
      citizenTransactions
      // refiDAOHolders,
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
        citizenTransactions
        // refiDAOHolders,
      } = data;

      const badgeHolderReferrals = new Map<
        string,
        {
          referredBy: BadgeHolderReferralInfo[];
          referred: BadgeHolderReferralInfo[];
        }
      >();

      badgeHolders.forEach((badgeHolder) => {
        const referredBy = badgeHolder.referredBy.toLowerCase();
        const recipient = badgeHolder.recipient.toLowerCase();

        if (referredBy !== "0x0000000000000000000000000000000000000000") {
          const referredByData = badgeHolderReferrals.get(referredBy) || {
            referredBy: [],
            referred: []
          };
          referredByData.referred.push({
            address: recipient,
            rpgfRound: badgeHolder.rpgfRound,
            referredMethod: badgeHolder.referredMethod
          });
          badgeHolderReferrals.set(referredBy, referredByData);

          // Update referredBy for recipient
          const recipientData = badgeHolderReferrals.get(recipient) || {
            referredBy: [],
            referred: []
          };
          recipientData.referredBy.push({
            address: referredBy,
            rpgfRound: badgeHolder.rpgfRound,
            referredMethod: badgeHolder.referredMethod
          });
          badgeHolderReferrals.set(recipient, recipientData);
        }
      });

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
        const badgeHolderReferral = badgeHolderReferrals.get(
          citizen.id.toLowerCase()
        );
        // const refiDAO = refiDAOHolders.find(
        //   (holder) => holder.address.toLowerCase() === citizen.id.toLowerCase()
        // );

        return {
          ...citizen,
          type: NodeType.Citizen,
          tecBalance: tecHolder?.balance,
          regenScore: regenScore?.score,
          trustedSeed: !!trustedSeed,
          regenPOAP: !!regenPOAP,
          hasFarcaster: !!citizen.userId,
          badgeHolderReferrals: badgeHolderReferral
          // refiDAO: !!refiDAO,
        };
      });

      nodes.push(
        createNode("TECHolder", NodeType.TECHolder),
        createNode("RegenScore", NodeType.RegenScore),
        createNode("TrustedSeed", NodeType.TrustedSeed),
        createNode("RegenPOAP", NodeType.RegenPOAP)
        // createNode("RefiDAO", NodeType.RefiDAO)
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
        // refiDAOHolders
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
