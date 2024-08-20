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

interface NodeWithNeighbors extends Node {
  neighbors?: Node[];
  links?: Link[];
}

interface GraphDataWithNeighbors extends GraphData {
  nodes: NodeWithNeighbors[];
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

  const handleLinkHover = (link: Link | null) => {
    highlightNodes.clear();
    highlightLinks.clear();

    if (link) {
      highlightLinks.add(link);
      const sourceNode =
        typeof link.source === "object"
          ? link.source
          : graphData.nodes.find((n) => n.id === link.source);
      const targetNode =
        typeof link.target === "object"
          ? link.target
          : graphData.nodes.find((n) => n.id === link.target);

      if (sourceNode && targetNode) {
        highlightNodes.add(sourceNode);
        highlightNodes.add(targetNode);
      }
    }

    updateHighlight();
  };

  const handleNodeHover = (node: NodeWithNeighbors | null) => {
    highlightNodes.clear();
    highlightLinks.clear();
    if (node) {
      highlightNodes.add(node);
      node.links?.forEach((link) => {
        highlightLinks.add(link);
        const targetNode =
          typeof link.target === "object"
            ? link.target
            : graphData.nodes.find((n) => n.id === link.target);
        const sourceNode =
          typeof link.source === "object"
            ? link.source
            : graphData.nodes.find((n) => n.id === link.source);
        if (targetNode && targetNode !== node) highlightNodes.add(targetNode);
        if (sourceNode && sourceNode !== node) highlightNodes.add(sourceNode);
      });
    }

    setHoverNode(node);
    updateHighlight();
  };

  const getNodeColor = (node: Node) => {
    if (node.type === "citizens") return "#a4b2e1";
    if (node.id === "TECHolder") return "blue";
    if (node.id === "RegenScore") return "green";
    if (node.id === "TrustedSeed") return "red";
    return "#3388ff";
  };

  const paintNode = useCallback(
    (node: Node, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const label = node.name || node.id;
      const fontSize = 8 / globalScale;
      ctx.font = `${fontSize}px Sans-Serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const isHighlighted = node === hoverNode || highlightNodes.has(node);

      ctx.globalAlpha = isHighlighted ? 1 : 0.3; // Reduce opacity for non-highlighted nodes

      ctx.beginPath();
      ctx.arc(node.x || 0, node.y || 0, NODE_R, 0, 2 * Math.PI, false);
      ctx.fillStyle = isHighlighted ? "#32CD32" : getNodeColor(node);
      ctx.fill();

      ctx.fillStyle = isHighlighted ? "red" : "black";
      const labelY = (node.y || 0) + NODE_R + fontSize;

      if (node.type === "citizens") {
        let label =
          node.ens ||
          (node.id ? `${node.id.slice(0, 4)}...${node.id.slice(-4)}` : "");
        ctx.fillText(label, node.x || 0, labelY);
      } else {
        ctx.fillText(label, node.x || 0, labelY);
      }

      ctx.globalAlpha = 1; // Reset global alpha
    },
    [hoverNode, highlightNodes]
  );

  const processedGraphData = useMemo(() => {
    const gData: GraphDataWithNeighbors = { ...graphData };

    // cross-link node objects
    gData.links.forEach((link) => {
      const a = gData.nodes.find(
        (n) => n.id === link.source
      ) as NodeWithNeighbors;
      const b = gData.nodes.find(
        (n) => n.id === link.target
      ) as NodeWithNeighbors;

      if (a && b) {
        !a.neighbors && (a.neighbors = []);
        !b.neighbors && (b.neighbors = []);
        a.neighbors.push(b);
        b.neighbors.push(a);

        !a.links && (a.links = []);
        !b.links && (b.links = []);
        a.links.push(link);
        b.links.push(link);
      }
    });

    return gData;
  }, [graphData]);

  const filteredGraphData = useMemo(() => {
    const filteredNodes = processedGraphData.nodes.filter(
      (node) =>
        selectedNodesCheckBox.includes(node.type || "") ||
        node.type === "TECHolder" ||
        node.type === "RegenScore" ||
        node.type === "TrustedSeed"
    );

    const filteredLinks = processedGraphData.links.filter(
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
  }, [processedGraphData, selectedNodesCheckBox, selectedConnectionsCheckBox]);

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
              linkDirectionalParticles={4}
              linkDirectionalParticleWidth={(link) =>
                highlightLinks.has(link) ? 4 : 0
              }
              nodeCanvasObjectMode={() => "before"}
              nodeCanvasObject={paintNode}
              onNodeHover={handleNodeHover}
              linkWidth={(link) => (highlightLinks.has(link) ? 2 : 0.5)}
              backgroundColor="white"
              onLinkHover={handleLinkHover as any}
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
                if (highlightLinks.has(link)) return "#32CD32";
                if (link.type === "FarcasterConnection")
                  return "rgba(128, 0, 128, 0.2)"; // purple with 0.2 opacity
                if (link.type === "TECHolder") return "rgba(0, 0, 255, 0.2)"; // blue with 0.2 opacity
                if (link.type === "RegenScore") return "rgba(0, 128, 0, 0.2)"; // green with 0.2 opacity
                if (link.type === "TrustedSeed") return "rgba(255, 0, 0, 0.2)"; // red with 0.2 opacity
                return "rgba(153, 153, 153, 0.2)"; // #999 with 0.2 opacity
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
