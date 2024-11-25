import React, { useState, useRef, useEffect } from "react";
import { CONNECTION_TYPES } from "../types/connectionTypes";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { NodeLinkType, NodeType } from "../types";
import { Tooltip } from "react-tooltip";
import clsx from "clsx";

interface IGraphSidebarProps {
  selectedConnectionsCheckBox: NodeLinkType[];
  setSelectedConnectionsCheckBox: React.Dispatch<
    React.SetStateAction<NodeLinkType[]>
  >;
  selectedNodeTypes: NodeType[];
  setSelectedNodeTypes: React.Dispatch<React.SetStateAction<NodeType[]>>;
}

const NODE_TYPES: Array<{
  key: NodeType.Citizen | NodeType.Delegate;
  text: string;
  color: string;
}> = [
  {
    key: NodeType.Citizen,
    text: "Citizens",
    color: "#FFFFFF"
  },
  {
    key: NodeType.Delegate,
    text: "Delegates",
    color: "#FFD700"
  }
];

const GraphSidebar: React.FC<IGraphSidebarProps> = ({
  selectedConnectionsCheckBox,
  setSelectedConnectionsCheckBox,
  selectedNodeTypes,
  setSelectedNodeTypes
}) => {
  const [isConnectionsExpanded, setIsConnectionsExpanded] = useState(true);
  const [isNodesExpanded, setIsNodesExpanded] = useState(true);
  const connectionsRef = useRef<HTMLDivElement>(null);
  const nodesRef = useRef<HTMLDivElement>(null);
  const [connectionsHeight, setConnectionsHeight] = useState<
    number | undefined
  >(undefined);
  const [nodesHeight, setNodesHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (connectionsRef.current) {
      setConnectionsHeight(connectionsRef.current.scrollHeight);
    }
    if (nodesRef.current) {
      setNodesHeight(nodesRef.current.scrollHeight);
    }
  }, []);

  const toggleConnections = () => {
    setIsConnectionsExpanded(!isConnectionsExpanded);
  };

  const toggleNodes = () => {
    setIsNodesExpanded(!isNodesExpanded);
  };

  return (
    <aside className="fixed left-4 top-[94px] bottom-0 z-10 w-50 flex flex-col">
      {/* Node Types Section */}
      <div className="bg-[#24304B] rounded-lg p-4 mb-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-white">Node Types</span>
          <button onClick={toggleNodes} className="text-white">
            {isNodesExpanded ? (
              <ChevronUp size={20} />
            ) : (
              <ChevronDown size={20} />
            )}
          </button>
        </div>
      </div>

      <div
        ref={nodesRef}
        className={clsx(
          "bg-[#24304B] rounded-lg mb-2 overflow-hidden transition-all duration-300 ease-in-out",
          isNodesExpanded && "p-4"
        )}
        style={{
          maxHeight: isNodesExpanded ? nodesHeight : 0,
          opacity: isNodesExpanded ? 1 : 0
        }}
      >
        <div className={clsx("space-y-2", isNodesExpanded && "mb-4")}>
          {NODE_TYPES.map((nodeType) => (
            <div
              key={nodeType.key}
              className="flex items-center"
              data-tooltip-id={`${nodeType.key}-tooltip`}
              data-tooltip-content={getNodeTooltipContent(nodeType.key)}
            >
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  id={nodeType.key}
                  checked={selectedNodeTypes.includes(nodeType.key)}
                  onChange={() => {
                    setSelectedNodeTypes((prev) =>
                      prev.includes(nodeType.key)
                        ? prev.filter((t) => t !== nodeType.key)
                        : [...prev, nodeType.key]
                    );
                  }}
                  className="appearance-none w-4 h-4 border border-dark-text-secondary rounded-md bg-transparent focus:outline-none focus:ring-2 focus:ring-dark-primary"
                />
                {selectedNodeTypes.includes(nodeType.key) && (
                  <Check
                    className="absolute left-0.5 top-0.5 w-3 h-3 text-dark-text-secondary pointer-events-none"
                    strokeWidth={3}
                  />
                )}
              </div>
              <label
                htmlFor={nodeType.key}
                className="ml-3 text-xs cursor-pointer"
                style={{ color: nodeType.color }}
              >
                {nodeType.text}
              </label>
              <Tooltip
                id={`${nodeType.key}-tooltip`}
                place="right"
                className="max-w-xs whitespace-pre-line text-center"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Connections Section */}
      <div className="bg-[#24304B] rounded-lg p-4 mb-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-white">Connections</span>
          <button onClick={toggleConnections} className="text-white">
            {isConnectionsExpanded ? (
              <ChevronUp size={20} />
            ) : (
              <ChevronDown size={20} />
            )}
          </button>
        </div>
      </div>

      <div
        ref={connectionsRef}
        className="bg-[#24304B] rounded-lg p-4 overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          maxHeight: isConnectionsExpanded ? connectionsHeight : 0,
          opacity: isConnectionsExpanded ? 1 : 0
        }}
      >
        <div className="space-y-2">
          {CONNECTION_TYPES.map((connection) => (
            <div
              key={connection.key}
              className="flex items-center"
              data-tooltip-id={`${connection.key}-tooltip`}
              data-tooltip-content={getConnectionTooltipContent(connection.key)}
            >
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  id={connection.key}
                  checked={selectedConnectionsCheckBox.includes(connection.key)}
                  onChange={() => {
                    setSelectedConnectionsCheckBox((prev) =>
                      prev.includes(connection.key)
                        ? prev.filter((c) => c !== connection.key)
                        : [...prev, connection.key]
                    );
                  }}
                  className="appearance-none w-4 h-4 border border-dark-text-secondary rounded-md bg-transparent focus:outline-none focus:ring-2 focus:ring-dark-primary"
                />
                {selectedConnectionsCheckBox.includes(connection.key) && (
                  <Check
                    className="absolute left-0.5 top-0.5 w-3 h-3 text-dark-text-secondary pointer-events-none"
                    strokeWidth={3}
                  />
                )}
              </div>
              <label
                htmlFor={connection.key}
                className="ml-3 text-xs cursor-pointer"
                style={{ color: connection.color }}
              >
                {connection.text}
              </label>
              <Tooltip
                id={`${connection.key}-tooltip`}
                place="right"
                className="max-w-xs whitespace-pre-line text-center"
              />
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};

const getNodeTooltipContent = (nodeType: NodeType): string => {
  switch (nodeType) {
    case NodeType.Citizen:
      return "Community members in the Optimism ecosystem";
    case NodeType.Delegate:
      return "Active delegates in the Optimism governance system";
    default:
      return "Node type information";
  }
};

const getConnectionTooltipContent = (connectionType: NodeLinkType): string => {
  switch (connectionType) {
    case NodeLinkType.FarcasterConnection:
      return "Connections between users on the Farcaster network";
    case NodeLinkType.BadgeHolderReferral:
      return "Referral connections for RPGF (RetroPGF) rounds";
    case NodeLinkType.TECHolder:
      return "Token Engineering Commons (TEC) token holders";
    case NodeLinkType.RegenScore:
      return "Connections based on RegenScore, indicating regenerative finance activity";
    case NodeLinkType.TrustedSeed:
      return "Members of the Trusted Seed community";
    case NodeLinkType.RegenPOAP:
      return "Holders of Regenerative Finance POAPs";
    case NodeLinkType.CitizenTransaction:
      return "Transactions between citizens";
    default:
      return "Connection type information";
  }
};

export default GraphSidebar;
