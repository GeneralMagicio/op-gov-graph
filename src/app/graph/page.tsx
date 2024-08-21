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

  const graphData = useGraphData(
    selectedConnectionsCheckBox,
    selectedNodesCheckBox
  );

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

  useEffect(() => {
    setTimeout(() => {
      // fgRef.current?.zoomToFit(500, 250);
      fgRef.current?.zoom(0.5, 500);

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
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default GraphPage;
