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
} from "../graph/types";

const DATA_URLS = {
  citizens: "/data/Citizens.json",
  tecHolders: "/data/TECHolders.json",
  regenScores: "/data/RegenScore.json",
  trustedSeed: "/data/TrustedSeed.json",
  farcasterConnections: "/data/CitizensFarcasterConnections.json",
};

const fetchData = async <T>(url: string): Promise<T> => {
  const response = await fetch(url);
  return response.json();
};

const createNode = (id: string, type: string): Node => ({ id, type });

const createLink = (source: string, target: string, type: string): Link => ({
  source,
  target,
  type,
});

const processCitizens = (citizens: ICitizen[]): Node[] =>
  citizens.map((citizen) => ({ ...citizen, type: "citizens" }));

const processConnections = (
  citizens: ICitizen[],
  tecHolders: TECHolder[],
  regenScores: RegenScore[],
  trustedSeeds: TrustedSeed[],
  farcasterConnections: FarcasterConnection[]
): Link[] => {
  const links: Link[] = [];
  const specialNodes = {
    TECHolder: createNode("TECHolder", "TECHolder"),
    RegenScore: createNode("RegenScore", "RegenScore"),
    TrustedSeed: createNode("TrustedSeed", "TrustedSeed"),
  };

  citizens.forEach((citizen) => {
    const { id } = citizen;
    const lowerCaseId = id.toLowerCase();

    if (tecHolders.some((holder) => holder.id.toLowerCase() === lowerCaseId)) {
      links.push(createLink(id, specialNodes.TECHolder.id, "TECHolder"));
    }
    if (
      regenScores.some((score) => score.address.toLowerCase() === lowerCaseId)
    ) {
      links.push(createLink(id, specialNodes.RegenScore.id, "RegenScore"));
    }
    if (trustedSeeds.some((seed) => seed.id.toLowerCase() === lowerCaseId)) {
      links.push(createLink(id, specialNodes.TrustedSeed.id, "TrustedSeed"));
    }
  });

  farcasterConnections.forEach((connection) => {
    links.push(
      createLink(connection.source, connection.target, "FarcasterConnection")
    );
  });

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
    ] = await Promise.all([
      fetchData<ICitizen[]>(DATA_URLS.citizens),
      fetchData<TECHolder[]>(DATA_URLS.tecHolders),
      fetchData<RegenScore[]>(DATA_URLS.regenScores),
      fetchData<TrustedSeed[]>(DATA_URLS.trustedSeed),
      fetchData<FarcasterConnection[]>(DATA_URLS.farcasterConnections),
    ]);

    return {
      citizens,
      tecHolders,
      regenScores,
      trustedSeeds,
      farcasterConnections,
    };
  }, []);

  const processData = useCallback(
    (data: Awaited<ReturnType<typeof fetchAllData>>) => {
      const {
        citizens,
        tecHolders,
        regenScores,
        trustedSeeds,
        farcasterConnections,
      } = data;
      const nodes: Node[] = [
        ...processCitizens(citizens),
        createNode("TECHolder", "TECHolder"),
        createNode("RegenScore", "RegenScore"),
        createNode("TrustedSeed", "TrustedSeed"),
      ];
      const links = processConnections(
        citizens,
        tecHolders,
        regenScores,
        trustedSeeds,
        farcasterConnections
      );
      return { nodes, links };
    },
    [selectedConnectionsCheckBox, selectedNodesCheckBox]
  );

  useEffect(() => {
    fetchAllData()
      .then(processData)
      .then((data) => {
        setGraphData(data); // Set all data without filtering
      });
  }, [
    fetchAllData,
    processData,
    selectedConnectionsCheckBox,
    selectedConnectionsCheckBox,
  ]);

  return graphData;
};
