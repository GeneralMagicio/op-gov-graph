"use client";

import {
  useMemo,
  useState,
  useCallback,
  useEffect,
  useRef,
  MutableRefObject
} from "react";
import ForceGraph2D, {
  ForceGraphMethods,
  NodeObject,
  LinkObject
} from "react-force-graph-2d";
import * as d3 from "d3";
import GraphHeader from "./components/GraphHeader";
import GraphSidebar from "./components/GraphSidebar";
import {
  NodeWithNeighbors,
  GraphDataWithNeighbors,
  Link,
  Node,
  NodeLinkType
} from "./types";
import { useGraphData } from "../hooks/useGraphData";
import RightSidebar from "./components/RightSidebar";
import { useSearchCitizens } from "../hooks/useSearchCitizens";
import {
  CONNECTION_TYPES,
  getConnectionTypeByKey
} from "./types/connectionTypes";

const MIN_NODE_R = 5;
const MAX_NODE_R = 12;

const imageCache = new Map<string, HTMLImageElement>();

const GraphPage = () => {
  const [selectedNodesCheckBox, setSelectedNodesCheckBox] = useState<string[]>([
    "citizens"
  ]);

  const [selectedConnectionsCheckBox, setSelectedConnectionsCheckBox] =
    useState<NodeLinkType[]>([
      NodeLinkType.TECHolder,
      NodeLinkType.RegenScore,
      NodeLinkType.TrustedSeed,
      NodeLinkType.FarcasterConnection,
      NodeLinkType.BadgeHolderReferral,
      NodeLinkType.RegenPOAP,
      NodeLinkType.CitizenTransaction
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
    resetSearch
  } = useSearchCitizens(graphData.nodes);

  const fgRef =
    useRef<ForceGraphMethods<NodeObject<Node>, LinkObject<Node, Link>>>(null);

  const imagesLoadedRef = useRef<Set<string>>(new Set());
  const canvasCache = useRef<Map<string, HTMLCanvasElement>>(new Map());

  const lowercaseGraphData = useMemo(() => {
    return {
      nodes: graphData.nodes.map((node) => ({
        ...node,
        id: node.id.toLowerCase()
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
            : link.target
      }))
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

  const handleNodeClick = useCallback(
    (node: Node) => {
      setSelectedNode(node);
      resetSearch();
    },
    [resetSearch]
  );

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
    const connectionType = CONNECTION_TYPES.find(
      (type) => type.key === (node.type as NodeLinkType)
    );
    return connectionType ? connectionType.color : "#3388ff";
  };

  const getLinkColor = useCallback((link: Link, highlighted: boolean) => {
    const opacity = highlighted ? 1 : 0.1;
    const connectionType = getConnectionTypeByKey(link.type);
    return connectionType
      ? `${connectionType.color}${Math.round(opacity * 255)
          .toString(16)
          .padStart(2, "0")}`
      : `rgba(153, 153, 153, ${opacity})`;
  }, []);

  const filteredGraphData = useMemo(() => {
    const filteredNodes = lowercaseGraphData.nodes.filter(
      (node) =>
        selectedNodesCheckBox.includes(node.type || "") ||
        CONNECTION_TYPES.some(
          (type) => type.key === (node.type as NodeLinkType)
        )
    );

    const nodeIds = new Set(filteredNodes.map((node) => node.id.toLowerCase()));
    const filteredLinks = lowercaseGraphData.links.filter((link) => {
      const isValidLink = nodeIds.has(link.source) && nodeIds.has(link.target);
      return isValidLink && selectedConnectionsCheckBox.includes(link.type);
    });

    return { nodes: filteredNodes, links: filteredLinks };
  }, [lowercaseGraphData, selectedNodesCheckBox, selectedConnectionsCheckBox]);

  const processedGraphData = useMemo(() => {
    const gData: GraphDataWithNeighbors = { ...filteredGraphData };

    // Calculate the degree of each node (number of connections)
    const nodeDegreeMap = new Map<string, number>();
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

    // Cross-link node objects
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
  }, [filteredGraphData]);

  const getNodeRadius = useCallback(
    (node: Node) => {
      if (node.type !== "citizens") return MIN_NODE_R;
      const degree = node.degree || 0;
      const maxDegree = Math.max(
        ...processedGraphData.nodes.map((n) => n.degree || 0)
      );
      return MIN_NODE_R + (MAX_NODE_R - MIN_NODE_R) * (degree / maxDegree);
    },

    [processedGraphData]
  );

  const loadImage = useCallback((src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      if (imageCache.has(src)) {
        resolve(imageCache.get(src)!);
      } else {
        const img = new Image();
        img.onload = () => {
          imageCache.set(src, img);
          imagesLoadedRef.current.add(src);
          resolve(img);
        };
        img.onerror = reject;
        img.src = src;
      }
    });
  }, []);

  const getPreRenderedCanvas = useCallback(
    (src: string, nodeRadius: number): HTMLCanvasElement => {
      if (canvasCache.current.has(src)) {
        return canvasCache.current.get(src)!;
      }

      const img = imageCache.get(src)!;
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;
      const size = nodeRadius * 2;

      canvas.width = size;
      canvas.height = size;
      ctx.drawImage(img, 0, 0, size, size);

      canvasCache.current.set(src, canvas);
      return canvas;
    },
    []
  );

  const paintNode = useCallback(
    (node: Node, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const nodeRadius = getNodeRadius(node);
      const fontSize = 8 / globalScale;
      ctx.font = `${fontSize}px Sans-Serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const isHighlighted = node === hoverNode || highlightNodes.has(node);
      const isSearchSelected =
        selectedSearchedNode &&
        node.id.toLowerCase() === selectedSearchedNode.id.toLowerCase();

      ctx.save();
      ctx.beginPath();
      ctx.arc(node.x || 0, node.y || 0, nodeRadius, 0, 2 * Math.PI, false);
      ctx.clip();

      if (node.profileImage && imagesLoadedRef.current.has(node.profileImage)) {
        // Use pre-rendered canvas
        const preRenderedCanvas = getPreRenderedCanvas(
          node.profileImage,
          nodeRadius
        );
        ctx.drawImage(
          preRenderedCanvas,
          (node.x || 0) - nodeRadius,
          (node.y || 0) - nodeRadius,
          nodeRadius * 2,
          nodeRadius * 2
        );
      } else {
        // Fill circle with color
        ctx.fillStyle = isHighlighted ? "#32CD32" : getNodeColor(node);
        ctx.fill();

        // Initiate image loading if not already loaded
        if (
          node.profileImage &&
          !imagesLoadedRef.current.has(node.profileImage)
        ) {
          loadImage(node.profileImage).catch(() => {
            // Handle image load failure if necessary
          });
        }
      }

      ctx.restore();

      // Draw border
      ctx.beginPath();
      ctx.arc(node.x || 0, node.y || 0, nodeRadius, 0, 2 * Math.PI, false);
      ctx.strokeStyle = isHighlighted ? "#32CD32" : getNodeColor(node);
      ctx.lineWidth = 2;
      ctx.stroke();

      if (isSearchSelected) {
        ctx.strokeStyle = "#FF00FF";
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Draw label
      ctx.fillStyle = isHighlighted ? "#6EE6B6" : "white";
      const labelY = (node.y || 0) + nodeRadius + fontSize;
      ctx.globalAlpha = isHighlighted || isSearchSelected ? 1 : 0.3;
      if (node.type === "citizens") {
        let label =
          node.ens ||
          (node.id ? `${node.id.slice(0, 4)}...${node.id.slice(-4)}` : "");
        ctx.fillText(label, node.x || 0, labelY);
      } else {
        ctx.fillText(node.name || node.id, node.x || 0, labelY);
      }

      ctx.globalAlpha = 1;
    },
    [
      hoverNode,
      highlightNodes,
      selectedSearchedNode,
      getNodeRadius,
      loadImage,
      getPreRenderedCanvas
    ]
  );

  useEffect(() => {
    const timeout = setTimeout(() => {
      // Initial Zoom Out
      fgRef.current?.zoom(0.5, 500);

      // Update Charge Force
      fgRef.current?.d3Force("charge")?.strength((node: any) => {
        // Nodes with higher degrees have less repulsion
        return node.degree === 0 ? -300 : -60 - node.degree * 10;
      });

      // Update Link Distance
      fgRef.current?.d3Force("link")?.distance((link: any) => {
        const sourceDegree = link.source.degree || 0;
        const targetDegree = link.target.degree || 0;
        const baseDistance = 100;

        if (sourceDegree === 0 || targetDegree === 0) {
          return baseDistance * 0.7; // Slightly closer for single connections
        }

        return baseDistance - Math.min(sourceDegree, targetDegree) * 5;
      });

      // Center Force (unchanged)
      fgRef.current?.d3Force("center", d3.forceCenter());

      // Update Radial Force with Dynamic Strength
      fgRef.current?.d3Force(
        "radial",
        d3.forceRadial(50, 0, 0).strength((node: any) => {
          const maxStrength = 1.2;
          const minStrength = 0.05;
          const maxDegree = Math.max(
            ...processedGraphData.nodes.map((n) => n.degree || 0)
          );

          // Avoid division by zero
          const normalizedDegree = maxDegree > 0 ? node.degree / maxDegree : 0;

          return node.degree > 0
            ? minStrength + normalizedDegree * (maxStrength - minStrength)
            : 0.02;
        })
      );

      // Collision Force (unchanged)
      fgRef.current?.d3Force(
        "collision",
        d3.forceCollide().radius(MIN_NODE_R * 1.5)
      );

      // Restart the simulation to apply new forces
      fgRef.current?.d3ReheatSimulation();
    }, 100);

    // Cleanup function to clear the timeout if dependencies change
    return () => clearTimeout(timeout);
  }, [fgRef, processedGraphData, selectedConnectionsCheckBox]);

  useEffect(() => {
    if (selectedSearchedNode && fgRef.current) {
      const node = processedGraphData.nodes.find(
        (n) => n.id.toLowerCase() === selectedSearchedNode.id.toLowerCase()
      );
      if (node && typeof node.x === "number" && typeof node.y === "number") {
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

  useEffect(() => {
    // Collect all unique profile images
    const profileImages = processedGraphData.nodes
      .filter((node) => node.profileImage)
      .map((node) => node.profileImage!);

    // Remove duplicates
    const uniqueImages = Array.from(new Set(profileImages));

    // Load all images
    Promise.all(uniqueImages.map((src) => loadImage(src)))
      .then(() => {
        // All images loaded
      })
      .catch((error) => {
        console.error("Error preloading images:", error);
      });
  }, [processedGraphData, loadImage]);

  return (
    <div className="flex flex-col h-screen bg-dark-background text-dark-text-primary">
      <GraphHeader
        searchTerm={searchTerm}
        onSearch={handleSearch}
        searchResults={searchedNodes}
        onSelectSearchedNode={handleSelectSearchedNode}
        onSearchInputClick={handleCloseRightSidebar}
      />
      <div className="flex flex-grow relative">
        <GraphSidebar
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
              nodeRelSize={MAX_NODE_R}
              nodeVal={(node) => Math.pow(getNodeRadius(node) / MAX_NODE_R, 2)}
              nodeLabel={(node) => {
                if (node.type === "citizens") {
                  return `${node.ens ?? node.id} (Connections: ${node.degree})`;
                }
                return node.name ?? node.id;
              }}
              autoPauseRedraw={false}
              linkDirectionalParticles={4}
              linkDirectionalParticleWidth={(link) =>
                highlightLinks.has(link) ? 4 : 0
              }
              nodeCanvasObjectMode={() => "replace"}
              nodeCanvasObject={paintNode}
              onNodeHover={handleNodeHover}
              linkWidth={(link) => (highlightLinks.has(link) ? 2 : 0.5)}
              backgroundColor="linear-gradient(to bottom, #131B2F, #162c45)"
              onLinkHover={handleLinkHover as any}
              nodeColor={getNodeColor}
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
