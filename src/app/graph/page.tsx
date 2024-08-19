"use client";

import {
  useMemo,
  useState,
  useCallback,
  useEffect,
  useRef,
  MutableRefObject,
} from "react";
import ForceGraph2D, {
  ForceGraphMethods,
  NodeObject,
  LinkObject,
} from "react-force-graph-2d";
import d3 from "d3";
import GraphHeader from "./components/GraphHeader";
import GraphSidebar from "./components/GraphSidebar";

interface Link {
  source: string;
  target: string;
  type: string;
}

interface IProject472 {
  attester?: string;
  category?: string;
  farcasterID?: number;
  id: string;
  metadataType?: number;
  metadataUrl?: string;
  name?: string;
  parentProjectRefUID?: string;
  projectRefUID?: string;
  x?: number;
  y?: number;
  type?: string;
}

interface ICitizen {
  id: string;
  ens?: string;
  x?: number;
  y?: number;
  type?: string;
}

interface GraphData {
  nodes: Node[];
  links: Link[];
}

interface Node extends ICitizen {
  id: string;
  name?: string;
  x?: number;
  y?: number;
  type?: string;
}

interface TECHolder {
  id: string;
  balance: string;
  pendingBalanceUpdate: string;
  x?: number;
  y?: number;
  type?: string;
}

interface RegenScore {
  id: string;
  score: number;
  address: string;
  meta: string;
  x?: number;
  y?: number;
  type?: string;
}

interface TrustedSeed {
  id: string;
  x?: number;
  y?: number;
  type?: string;
}

interface FarcasterConnection {
  source: string;
  target: string;
}

const NODE_R = 10;

const GraphPage = () => {
  const [selectedNodesCheckBox, setSelectedNodesCheckBox] = useState<string[]>([
    "citizens",
  ]);
  const [selectedConnectionsCheckBox, setSelectedConnectionsCheckBox] =
    useState<string[]>([
      "TECHolder",
      "RegenScore",
      "TrustedSeed",
      "FarcasterConnection",
    ]);

  const [graphData, setGraphData] = useState<GraphData>({
    nodes: [],
    links: [],
  });

  const [highlightNodes, setHighlightNodes] = useState<Set<Node>>(new Set());
  const [highlightLinks, setHighlightLinks] = useState<Set<Link>>(new Set());
  const [hoverNode, setHoverNode] = useState<Node | null>(null);

  const fgRef =
    useRef<ForceGraphMethods<NodeObject<Node>, LinkObject<Node, Link>>>(null);

  const updateHighlight = () => {
    setHighlightNodes(new Set(highlightNodes));
    setHighlightLinks(new Set(highlightLinks));
  };

  const handleNodeHover = (node: Node | null) => {
    highlightNodes.clear();
    highlightLinks.clear();
    if (node) {
      highlightNodes.add(node);
    }

    setHoverNode(node);
    updateHighlight();
  };

  const paintNode = useCallback(
    (node: Node, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const label = node.name || node.id;
      const fontSize = 8 / globalScale;
      ctx.font = `${fontSize}px Sans-Serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      ctx.beginPath();
      ctx.arc(node.x || 0, node.y || 0, NODE_R, 0, 2 * Math.PI, false);
      ctx.fill();

      if (node.type !== "citizens") {
        ctx.fillStyle = "black";
        ctx.fillText(label, node.x || 0, (node.y || 0) + NODE_R + fontSize);
      } else {
        let label = "";
        if (node.ens) {
          label = node.ens;
        } else if (node.id) {
          const address = node.id;
          label = `${address.slice(0, 4)}...${address.slice(-4)}`;
        }
        ctx.fillStyle = "black"; // Label color
        ctx.fillText(label, node.x || 0, (node.y || 0) + NODE_R + fontSize); // Draw text below the node
      }
    },
    []
  );

  const filteredGraphData = useMemo(() => {
    const filteredNodes = graphData.nodes.filter(
      (node) =>
        selectedNodesCheckBox.includes(node.type || "") ||
        node.type === "TECHolder" ||
        node.type === "RegenScore" ||
        node.type === "TrustedSeed"
    );

    const filteredLinks = graphData.links.filter(
      (link) =>
        (selectedConnectionsCheckBox.includes("TECHolder") &&
          link.type === "TECHolder") ||
        (selectedConnectionsCheckBox.includes("RegenScore") &&
          link.type === "RegenScore") ||
        (selectedConnectionsCheckBox.includes("TrustedSeed") &&
          link.type === "TrustedSeed") ||
        (selectedConnectionsCheckBox.includes("FarcasterConnection") &&
          link.type === "FarcasterConnection")
    );

    return { nodes: filteredNodes, links: filteredLinks };
  }, [graphData, selectedNodesCheckBox, selectedConnectionsCheckBox]);

  useEffect(() => {
    const fetchData = async () => {
      const citizensResponse = await fetch("/data/Citizens.json");
      const citizens = (await citizensResponse.json()) as ICitizen[];
      const tecHoldersResponse = await fetch("/data/TECHolders.json");
      const tecHolders = (await tecHoldersResponse.json()) as TECHolder[];
      const regenScoresResponse = await fetch("/data/RegenScore.json");
      const regenScores = (await regenScoresResponse.json()) as RegenScore[];
      const trustedSeedResponse = await fetch("/data/TrustedSeed.json");
      const trustedSeeds = (await trustedSeedResponse.json()) as TrustedSeed[];
      const farcasterConnectionsResponse = await fetch(
        "/data/CitizensFarcasterConnections.json"
      );
      const farcasterConnections =
        (await farcasterConnectionsResponse.json()) as FarcasterConnection[];

      const citizenNodes: ICitizen[] = citizens.map((citizen) => ({
        ...citizen,
        type: "citizens",
      }));

      const TecHolderNode: Node = {
        id: "TECHolder",
        type: "TECHolder",
      };

      const RegenScoreNode: Node = {
        id: "RegenScore",
        type: "RegenScore",
      };

      const TrustedSeedNode: Node = {
        id: "TrustedSeed",
        type: "TrustedSeed",
      };

      const nodes: Node[] = [
        ...citizenNodes,
        TecHolderNode,
        RegenScoreNode,
        TrustedSeedNode,
      ];

      const links: Link[] = [];

      // Iterate through each citizen and check if they exist in tecHolders
      citizens.forEach((citizen) => {
        const matchingTEC = tecHolders.find(
          (holder) => holder.id.toLowerCase() === citizen.id.toLowerCase()
        );
        const matchingRegenScore = regenScores.find(
          (score) => score.address.toLowerCase() === citizen.id.toLowerCase()
        );
        const matchingTrustedSeed = trustedSeeds.find(
          (trustedSeed) =>
            trustedSeed?.id.toLowerCase() === citizen.id.toLowerCase()
        );

        if (matchingTEC) {
          links.push({
            source: citizen.id,
            target: TecHolderNode.id,
            type: "TECHolder",
          });
        }
        if (matchingRegenScore) {
          links.push({
            source: citizen.id,
            target: RegenScoreNode.id,
            type: "RegenScore",
          });
        }
        if (matchingTrustedSeed) {
          links.push({
            source: citizen.id,
            target: TrustedSeedNode.id,
            type: "TrustedSeed",
          });
        }
      });

      // Add FarcasterConnection links
      farcasterConnections.forEach((connection) => {
        links.push({
          source: connection.source,
          target: connection.target,
          type: "FarcasterConnection",
        });
      });

      setGraphData({ nodes, links });
    };

    fetchData();
  }, [selectedConnectionsCheckBox, selectedNodesCheckBox]);

  useEffect(() => {
    setTimeout(() => {
      fgRef.current?.zoomToFit(500, 250);
      fgRef.current?.d3Force("link")?.distance(500);
      fgRef.current?.d3Force(
        "charge",
        d3.forceManyBody().strength(-200) // Add this line to increase repulsion
      );
      fgRef.current?.d3Force(
        "collision",
        d3.forceCollide().radius(NODE_R * 1.5) // Increase this value to space nodes apart more
      );
    }, 100);
  }, [fgRef, filteredGraphData, selectedConnectionsCheckBox]);

  return (
    <div className="flex flex-col h-screen">
      <GraphHeader />

      <div className="flex">
        <GraphSidebar
          selectedNodesCheckBox={selectedNodesCheckBox}
          setSelectedNodesCheckBox={setSelectedNodesCheckBox}
          selectedConnectionsCheckBox={selectedConnectionsCheckBox}
          setSelectedConnectionsCheckBox={setSelectedConnectionsCheckBox}
        />

        <main className="max-w-fit flex-grow overflow-hidden flex justify-center items-center">
          {typeof window !== "undefined" && (
            <ForceGraph2D
              ref={
                fgRef as MutableRefObject<
                  | ForceGraphMethods<NodeObject<Node>, LinkObject<Node, Link>>
                  | undefined
                >
              }
              graphData={filteredGraphData}
              nodeRelSize={NODE_R}
              nodeLabel={(node) => {
                if (node.type === "citizens") {
                  return node.ens ?? node.id;
                }
                return node.name ?? node.id;
              }}
              autoPauseRedraw={false}
              linkWidth={0.5}
              linkDirectionalParticles={4}
              linkDirectionalParticleWidth={(link) =>
                highlightLinks.has(link) ? 4 : 0
              }
              nodeCanvasObjectMode={() => "before"}
              nodeCanvasObject={paintNode as any}
              onNodeHover={handleNodeHover as any}
              backgroundColor="white"
              nodeColor={(node) => {
                if (node.type === "citizens") {
                  return "#a4b2e1";
                }
                if (node.id === "TECHolder") {
                  return "blue";
                }
                if (node.id === "RegenScore") {
                  return "green";
                }
                if (node.id === "TrustedSeed") {
                  return "red";
                } else {
                  return "#3388ff";
                }
              }}
              linkColor={(link) => {
                if (link.type === "FarcasterConnection") {
                  return "purple";
                }
                if (link.type === "TECHolder") {
                  return "blue";
                }
                if (link.type === "RegenScore") {
                  return "green";
                }
                if (link.type === "TrustedSeed") {
                  return "red";
                }

                return "#999"; // Default color for other link types
              }}
              onEngineStop={() => {
                fgRef.current?.zoomToFit();
              }}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default GraphPage;
