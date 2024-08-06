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
import GraphHeader from "./components/GraphHeader";
import GraphSidebar from "./components/GraphSidebar";

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

interface Node {
  id: string;
  name?: string;
  x?: number;
  y?: number;
  type?: string;
}

interface Link {
  source: string;
  target: string;
}

interface TECHolder {
  id: string;
  balance: string;
  pendingBalanceUpdate: string;
  x?: number;
  y?: number;
  type?: string;
}

const NODE_R = 30;

const GraphPage = () => {
  const [selectedNodesCheckBox, setSelectedNodesCheckBox] = useState<string[]>([
    "citizens",
  ]);
  const [selectedConnectionsCheckBox, setSelectedConnectionsCheckBox] =
    useState<string[]>([]);

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

  const paintRing = useCallback(
    (node: Node, ctx: CanvasRenderingContext2D) => {
      // add ring just for highlighted nodes
      ctx.beginPath();
      ctx.arc(node.x || 0, node.y || 0, NODE_R * 1.4, 0, 2 * Math.PI, false);
      ctx.fillStyle = node === hoverNode ? "#3b60db" : "transparent";
      ctx.fill();
    },
    [hoverNode]
  );

  const filteredGraphData = useMemo(() => {
    const filteredNodes = graphData.nodes.filter((node) =>
      selectedNodesCheckBox.includes(node.type || "")
    );

    const nodeIds = new Set(filteredNodes.map((node) => node.id)); // Create a set of filtered node IDs
    console.log("nodeIds", nodeIds);

    const filteredLinks = graphData.links.filter(
      (link) => nodeIds.has(link.source) || nodeIds.has(link.target) // Only include links where both source and target nodes are in filteredNodes
    );

    return { nodes: filteredNodes, links: filteredLinks };
  }, [graphData, selectedNodesCheckBox]);

  useEffect(() => {
    const fetchData = async () => {
      const citizensResponse = await fetch("/data/Citizens.json");
      const citizens = (await citizensResponse.json()) as ICitizen[];
      const tecHoldersResponse = await fetch("/data/TECHolders.json");
      const tecHolders = (await tecHoldersResponse.json()) as TECHolder[];

      const citizenNodes: ICitizen[] = citizens.map((citizen, index) => ({
        ...citizen,
        type: "citizens", // Use lowercase to match your selectedNodesCheckBox
        x: -30 + Math.random() * 10,
        y: Math.random() * 10 - 5,
      }));

      const tecHolderNode: Node = {
        id: "TECHolder",
        type: "TECHolder",
        x: 30,
        y: 0,
      };

      const nodes: Node[] = [...citizenNodes];

      const links: Link[] = [];

      setGraphData({ nodes, links });
    };

    fetchData();
  }, []);

  useEffect(() => {
    setTimeout(() => {
      fgRef.current?.zoomToFit(500, 120);
    }, 100);
  }, [fgRef, filteredGraphData]);

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <GraphHeader />

      <div className="flex">
        {/* Sidebar */}
        <GraphSidebar
          selectedNodesCheckBox={selectedNodesCheckBox}
          setSelectedNodesCheckBox={setSelectedNodesCheckBox}
          selectedConnectionsCheckBox={selectedConnectionsCheckBox}
          setSelectedConnectionsCheckBox={setSelectedConnectionsCheckBox}
        />

        {/* Graph */}
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
                return node.name ?? node.id; // Fallback to node.id if name is undefined
              }}
              autoPauseRedraw={false}
              linkWidth={0.3}
              nodeCanvasObjectMode={() => "before"}
              nodeCanvasObject={paintRing as any}
              onNodeHover={handleNodeHover as any}
              backgroundColor="white"
              nodeColor={(node) => {
                if (node.type === "citizens") {
                  return "#a4b2e1";
                }
                if (node.name === "Projects") {
                  return "blue";
                } else {
                  return "#3388ff";
                }
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
