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
  citizens: "/data/Citizens.json",
  tecHolders: "/data/TECHolders.json",
  regenScores: "/data/RegenScore.json",
  trustedSeed: "/data/TrustedSeed.json",
  farcasterConnections: "/data/CitizensFarcasterConnections.json",
  badgeHolders: "/data/BadgeHolders.json",
  regenPOAP: "/data/RegenPOAP.json",
  citizenTransactions: "/data/citizenTransactions.json",
};

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
  citizens: ICitizen[],
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
  citizens.forEach((citizen) => {
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
  links.push(...processBadgeHolders(badgeHolders, citizens));

  console.log(
    "CitizenTransactions in processConnections:",
    links.filter((link) => link.type === NodeLinkType.CitizenTransaction).length
  );

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
      citizens,
      tecHolders,
      regenScores,
      trustedSeeds,
      farcasterConnections,
      badgeHolders,
      regenPOAPHolders,
      citizenTransactions,
    ] = await Promise.all([
      fetchData<ICitizen[]>(DATA_URLS.citizens),
      fetchData<TECHolder[]>(DATA_URLS.tecHolders),
      fetchData<RegenScore[]>(DATA_URLS.regenScores),
      fetchData<TrustedSeed[]>(DATA_URLS.trustedSeed),
      fetchData<FarcasterConnection[]>(DATA_URLS.farcasterConnections),
      fetchData<BadgeHolder[]>(DATA_URLS.badgeHolders),
      fetchData<RegenPOAPHolder[]>(DATA_URLS.regenPOAP),
      fetchData<CitizenTransaction[]>(DATA_URLS.citizenTransactions),
    ]);

    return {
      citizens,
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
        citizens,
        tecHolders,
        regenScores,
        trustedSeeds,
        farcasterConnections,
        badgeHolders,
        regenPOAPHolders,
        citizenTransactions,
      } = data;
      const nodes: Node[] = [
        ...processCitizens(citizens),
        createNode("TECHolder", "TECHolder"),
        createNode("RegenScore", "RegenScore"),
        createNode("TrustedSeed", "TrustedSeed"),
        createNode("RegenPOAP", "RegenPOAP"),
      ];
      const links = processConnections(
        citizens,
        tecHolders,
        regenScores,
        trustedSeeds,
        farcasterConnections,
        badgeHolders,
        regenPOAPHolders,
        citizenTransactions
      );

      console.log("Total nodes:", nodes.length);
      console.log("Total links:", links.length);
      console.log(
        "CitizenTransactions in processData:",
        links.filter((link) => link.type === NodeLinkType.CitizenTransaction)
          .length
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
        console.log(
          "CitizenTransactions in setGraphData:",
          data.links.filter(
            (link) => link.type === NodeLinkType.CitizenTransaction
          ).length
        );
      });
  }, [fetchAllData, processData]);

  return graphData;
};
