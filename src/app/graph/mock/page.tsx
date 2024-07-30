"use client";

import { Link, genRandomTree, Node } from "@/app/helpers/genRandomTree";
import { useMemo, useState, useCallback } from "react";
import ForceGraph2D from "react-force-graph-2d";
import GraphHeader from "../components/GraphHeader";
import GraphSidebar from "../components/GraphSidebar";

interface GraphData {
  nodes: Node[];
  links: Link[];
}

const NODE_R = 8;

const GraphPage = () => {
  const [selectedNodesCheckBox, setSelectedNodesCheckBox] = useState<string[]>(
    []
  );
  const [selectedConnectionsCheckBox, setSelectedConnectionsCheckBox] =
    useState<string[]>([]);

  const data = useMemo(() => {
    const gData: GraphData = genRandomTree(80);

    // cross-link node objects
    gData.links.forEach((link) => {
      const a = gData.nodes.find((n) => n.id === link.source) as Node;
      const b = gData.nodes.find((n) => n.id === link.target) as Node;
      !a.neighbors && (a.neighbors = []);
      !b.neighbors && (b.neighbors = []);
      a.neighbors.push(b);
      b.neighbors.push(a);

      !a.links && (a.links = []);
      !b.links && (b.links = []);
      a.links.push(link);
      b.links.push(link);
    });
    console.log("gData", gData);
    return gData;
  }, []);

  const [highlightNodes, setHighlightNodes] = useState<Set<Node>>(new Set());
  const [highlightLinks, setHighlightLinks] = useState<Set<Link>>(new Set());
  const [hoverNode, setHoverNode] = useState<Node | null>(null);

  const updateHighlight = () => {
    setHighlightNodes(new Set(highlightNodes));
    setHighlightLinks(new Set(highlightLinks));
  };

  const handleNodeHover = (node: Node | null) => {
    highlightNodes.clear();
    highlightLinks.clear();
    if (node) {
      highlightNodes.add(node);
      node.neighbors?.forEach((neighbor) => highlightNodes.add(neighbor));
      node.links?.forEach((link) => highlightLinks.add(link));
    }

    setHoverNode(node);
    updateHighlight();
  };

  const handleLinkHover = (link: Link | null) => {
    highlightNodes.clear();
    highlightLinks.clear();

    if (link) {
      highlightLinks.add(link);
      const sourceNode =
        typeof link.source === "object"
          ? link.source
          : data.nodes.find((n) => n.id === link.source);
      const targetNode =
        typeof link.target === "object"
          ? link.target
          : data.nodes.find((n) => n.id === link.target);

      if (sourceNode && targetNode) {
        highlightNodes.add(sourceNode);
        highlightNodes.add(targetNode);
      }
    }

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
        <main>
          {typeof window !== "undefined" && (
            <ForceGraph2D
              graphData={data}
              nodeRelSize={NODE_R}
              autoPauseRedraw={false}
              linkWidth={(link) => (highlightLinks.has(link) ? 5 : 1)}
              linkDirectionalParticles={4}
              linkDirectionalParticleWidth={(link: Link) =>
                highlightLinks.has(link) ? 4 : 0
              }
              nodeCanvasObjectMode={() => "before"}
              nodeCanvasObject={paintRing as any}
              onNodeHover={handleNodeHover as any}
              onLinkHover={handleLinkHover as any}
              backgroundColor="white"
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default GraphPage;
