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
}

interface ICitizens {
  id: string;
  ens?: string;
  x?: number;
  y?: number;
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
}

interface Link {
  source: string;
  target: string;
}

const NODE_R = 2;

const GraphPage = () => {
  const [selectedNodesCheckBox, setSelectedNodesCheckBox] = useState<string[]>([
    "Projects",
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

  // const fgRef = useRef<ForceGraphMethods<NodeObject<IProject472>>>(null);
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
      ctx.fillStyle = node === hoverNode ? "red" : "orange";
      ctx.fill();
    },
    [hoverNode]
  );

  useEffect(() => {
    const fetchProjects472Data = async () => {
      const projectsResponse = await fetch(
        "/data/Projects_Attestation_472.json"
      );
      const projects = (await projectsResponse.json()) as IProject472[];
      const citizensResponse = await fetch("/data/Citizens.json");
      const citizens = (await citizensResponse.json()) as ICitizens[];

      const centralNode: IProject472 = { id: "central", name: "Projects" };

      const projectNodes: IProject472[] = projects.map((project) => ({
        ...project,
        type: "project472",
      }));

      const citizenNodes: ICitizens[] = citizens.map((citizen) => ({
        ...citizen,
        type: "citizen",
      }));

      const nodes: (IProject472 | ICitizens)[] = [
        centralNode,
        ...projectNodes,
        ...citizenNodes,
      ];

      console.log("Nodes", nodes);

      const links: Link[] = projects.map((project) => ({
        source: "central",
        target: project.id,
      }));

      console.log("Nodes and Links", {
        nodes,
        links,
      });

      setGraphData({ nodes, links });
    };

    fetchProjects472Data();
  }, []);

  useEffect(() => {
    setTimeout(() => {
      fgRef.current?.zoomToFit(500, 100);
    }, 100);
  }, [fgRef, selectedNodesCheckBox]);

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
          {typeof window !== "undefined" &&
            selectedNodesCheckBox.includes("Projects") && (
              <ForceGraph2D
                ref={
                  fgRef as MutableRefObject<
                    | ForceGraphMethods<
                        NodeObject<Node>,
                        LinkObject<Node, Link>
                      >
                    | undefined
                  >
                }
                graphData={graphData}
                nodeRelSize={NODE_R}
                nodeLabel={(node) => {
                  if (node.type === "citizen") {
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
                  if (node.type === "citizen") {
                    return "green";
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
