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
import { NodeWithNeighbors, GraphDataWithNeighbors, Link, Node } from "./types";
import { useGraphData } from "../hooks/useGraphData";
import RightSidebar from "./components/RightSidebar";
import { useSearchCitizens } from "../hooks/useSearchCitizens";

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
      "BadgeHolderReferral",
      "RegenPOAP",
      "CitizenTransaction",
    ]);

  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const graphData = useGraphData(
    selectedConnectionsCheckBox,
    selectedNodesCheckBox
  );

  const [highlightNodes, setHighlightNodes] = useState<Set<Node>>(new Set());
  const [highlightLinks, setHighlightLinks] = useState<Set<Link>>(new Set());
  const [hoverNode, setHoverNode] = useState<Node | null>(null);

  const {
    searchTerm,
    searchedNodes,
    selectedSearchedNode,
    handleSearch,
    handleSelectSearchedNode,
    resetSearch,
  } = useSearchCitizens(graphData.nodes);

  const fgRef =
    useRef<ForceGraphMethods<NodeObject<Node>, LinkObject<Node, Link>>>(null);

  const lowercaseGraphData = useMemo(() => {
    return {
      nodes: graphData.nodes.map((node) => ({
        ...node,
        id: node.id.toLowerCase(),
      })),
      links: graphData.links.map((link) => ({
        ...link,
        source:
          typeof link.source === "string"
            ? link.source.toLowerCase()
            : link.source,
        target:
          typeof link.target === "string"
            ? link.target.toLowerCase()
            : link.target,
      })),
    };
  }, [graphData]);

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

  const handleNodeClick = useCallback((node: Node) => {
    setSelectedNode(node);
    resetSearch();
  }, []);

  const handleCloseRightSidebar = useCallback(() => {
    setSelectedNode(null);
  }, []);

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
    if (node.id === "RegenPOAP") return "indigo";
    return "#3388ff";
  };

  const getLinkColor = useCallback((link: Link, highlighted: boolean) => {
    const opacity = highlighted ? 1 : 0.2;
    switch (link.type) {
      case "FarcasterConnection":
        return `rgba(128, 0, 128, ${opacity})`; // purple
      case "TECHolder":
        return `rgba(0, 0, 255, ${opacity})`; // blue
      case "RegenScore":
        return `rgba(0, 128, 0, ${opacity})`; // green
      case "TrustedSeed":
        return `rgba(255, 0, 0, ${opacity})`; // red
      case "BadgeHolderReferral":
        return `rgba(255, 165, 0, ${opacity})`; // orange
      case "RegenPOAP":
        return `rgba(75, 0, 130, ${opacity})`; // indigo
      case "CitizenTransaction":
        return `rgba(255, 192, 203, ${opacity})`; // pink
      default:
        return `rgba(153, 153, 153, ${opacity})`; // #999
    }
  }, []);

  const paintNode = useCallback(
    (node: Node, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const label = node.name || node.id;
      const fontSize = 8 / globalScale;
      ctx.font = `${fontSize}px Sans-Serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const isHighlighted = node === hoverNode || highlightNodes.has(node);
      const isSearchSelected =
        selectedSearchedNode &&
        node.id.toLowerCase() === selectedSearchedNode.id.toLowerCase();

      ctx.globalAlpha = isHighlighted || isSearchSelected ? 1 : 0.3; // Reduce opacity for non-highlighted nodes

      ctx.beginPath();
      ctx.arc(node.x || 0, node.y || 0, NODE_R, 0, 2 * Math.PI, false);
      ctx.fillStyle = isHighlighted ? "#32CD32" : getNodeColor(node);
      ctx.fill();

      // Add stroke for selectedSearchedNode
      if (isSearchSelected) {
        ctx.strokeStyle = "#FF00FF"; // Magenta stroke for selectedSearchedNode
        ctx.lineWidth = 3;
        ctx.stroke();
      }

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
    [hoverNode, highlightNodes, selectedSearchedNode]
  );

  const filteredGraphData = useMemo(() => {
    const filteredNodes = lowercaseGraphData.nodes.filter(
      (node) =>
        selectedNodesCheckBox.includes(node.type || "") ||
        node.type === "TECHolder" ||
        node.type === "RegenScore" ||
        node.type === "TrustedSeed" ||
        node.type === "RegenPOAP"
    );

    const nodeIds = new Set(filteredNodes.map((node) => node.id.toLowerCase()));
    console.log("nodeds", nodeIds);
    const filteredLinks = lowercaseGraphData.links.filter((link) => {
      const isValidLink = nodeIds.has(link.source) && nodeIds.has(link.target);
      if (link.type === "CitizenTransaction") {
        console.log("CitizenTransactionLink:", link);
      }
      return (
        isValidLink &&
        ((selectedConnectionsCheckBox.includes("TECHolder") &&
          link.type === "TECHolder") ||
          (selectedConnectionsCheckBox.includes("RegenScore") &&
            link.type === "RegenScore") ||
          (selectedConnectionsCheckBox.includes("TrustedSeed") &&
            link.type === "TrustedSeed") ||
          (selectedConnectionsCheckBox.includes("FarcasterConnection") &&
            link.type === "FarcasterConnection") ||
          (selectedConnectionsCheckBox.includes("BadgeHolderReferral") &&
            link.type === "BadgeHolderReferral") ||
          (selectedConnectionsCheckBox.includes("RegenPOAP") &&
            link.type === "RegenPOAP") ||
          (selectedConnectionsCheckBox.includes("CitizenTransaction") &&
            link.type === "CitizenTransaction"))
      );
    });

    return { nodes: filteredNodes, links: filteredLinks };
  }, [graphData, selectedNodesCheckBox, selectedConnectionsCheckBox]);

  const processedGraphData = useMemo(() => {
    const gData: GraphDataWithNeighbors = { ...filteredGraphData };

    // Calculate the degree of each node (number of connections)
    const nodeDegreeMap = new Map();
    gData.nodes.forEach((node) => {
      nodeDegreeMap.set(node.id, 0);
    });

    gData.links.forEach((link) => {
      nodeDegreeMap.set(link.source, (nodeDegreeMap.get(link.source) || 0) + 1);
      nodeDegreeMap.set(link.target, (nodeDegreeMap.get(link.target) || 0) + 1);
    });

    gData.nodes.forEach((node) => {
      node.degree = nodeDegreeMap.get(node.id) || 0;
    });

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

  console.log("processedGraphData", processedGraphData.nodes[1]);

  useEffect(() => {
    setTimeout(() => {
      // fgRef.current?.zoomToFit(500, 250);
      fgRef.current?.zoom(0.5, 500);
      console.log("fgRef.cu", fgRef.current);
      // Dynamic force based on node degree
      fgRef.current?.d3Force("charge")?.strength((node: any) => {
        if (node.degree === 0) {
          return -500;
        }
        return -60 - node.degree * 40;
      });

      fgRef.current?.d3Force("link")?.distance((link: any) => {
        const sourceDegree = link.source.degree || 0;
        const targetDegree = link.target.degree || 0;
        const baseDistance = 100;

        if (sourceDegree === 0 || targetDegree === 0) {
          return baseDistance * 0.3; // Bring nodes connected to no-degree nodes even closer
        }

        return baseDistance - Math.min(sourceDegree, targetDegree) * 10;
      });

      // Apply a radial force to nodes without connections to pull them even closer to the center
      fgRef.current?.d3Force("center", d3.forceCenter());
      fgRef.current?.d3Force(
        "radial",
        d3.forceRadial(50, 0, 0).strength((node: any) => {
          return node.degree === 0 ? 1.2 : 0.05; // Stronger pull for unconnected nodes
        })
      );

      fgRef.current?.d3Force(
        "collision",
        d3.forceCollide().radius(NODE_R * 1.5)
      );
    }, 100);
  }, [fgRef, filteredGraphData, selectedConnectionsCheckBox]);

  useEffect(() => {
    if (selectedSearchedNode && fgRef.current) {
      const node = processedGraphData.nodes.find(
        (n) => n.id.toLowerCase() === selectedSearchedNode.id.toLowerCase()
      );
      if (node && typeof node.x === "number" && typeof node.y === "number") {
        const distanceToMove = 40;

        // Step 1: Zoom out
        fgRef.current.zoom(0.5, 300);

        // Step 2: Center on node
        setTimeout(() => {
          fgRef.current?.centerAt(node.x, node.y, 300);
        }, 350);

        // Step 3: Zoom in
        setTimeout(() => {
          fgRef.current?.zoom(2, 300);
        }, 700);
      }
    }
  }, [selectedSearchedNode, processedGraphData.nodes]);

  return (
    <div className="flex flex-col h-screen">
      <GraphHeader
        searchTerm={searchTerm}
        onSearch={handleSearch}
        searchResults={searchedNodes}
        onSelectSearchedNode={handleSelectSearchedNode}
        onSearchInputClick={handleCloseRightSidebar}
      />
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
              graphData={processedGraphData}
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
                if (node.type === "TECHolder") {
                  return "blue";
                }
                if (node.type === "RegenScore") {
                  return "green";
                }
                if (node.type === "TrustedSeed") {
                  return "red";
                }
                if (node.type === "RegenPOAP") {
                  return "indigo";
                } else {
                  return "#3388ff";
                }
              }}
              linkColor={(link) => getLinkColor(link, highlightLinks.has(link))}
              onNodeClick={handleNodeClick}
            />
          )}
        </main>
        <RightSidebar
          selectedNode={selectedNode}
          onClose={handleCloseRightSidebar}
        />
      </div>
    </div>
  );
};

export default GraphPage;
