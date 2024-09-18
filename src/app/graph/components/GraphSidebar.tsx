import React from "react";
import { CONNECTION_TYPES } from "../types/connectionTypes";
import { Check } from "lucide-react";

interface IGraphSidebarProps {
  selectedNodesCheckBox: string[];
  setSelectedNodesCheckBox: React.Dispatch<React.SetStateAction<string[]>>;
  selectedConnectionsCheckBox: string[];
  setSelectedConnectionsCheckBox: React.Dispatch<
    React.SetStateAction<string[]>
  >;
}

const GraphSidebar: React.FC<IGraphSidebarProps> = ({
  selectedNodesCheckBox,
  setSelectedNodesCheckBox,
  selectedConnectionsCheckBox,
  setSelectedConnectionsCheckBox,
}) => {
  const nodeOptions = ["Citizens"];

  return (
    <aside
      className="p-4 flex-shrink-0 text-dark-text-primary"
      style={{ background: "linear-gradient(to bottom, #131B2F, #162c45)" }}
    >
      <div className="mb-6 bg-[#24304B] rounded-lg p-4">
        <div className="space-y-2">
          {nodeOptions.map((node) => (
            <div key={node} className="flex items-center">
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  id={node}
                  checked={selectedNodesCheckBox.includes(node.toLowerCase())}
                  onChange={() => {
                    setSelectedNodesCheckBox((prev) =>
                      prev.includes(node.toLowerCase())
                        ? prev.filter((n) => n !== node.toLowerCase())
                        : [...prev, node.toLowerCase()]
                    );
                  }}
                  className="appearance-none w-4 h-4 border border-dark-text-secondary rounded-md bg-transparent focus:outline-none focus:ring-2 focus:ring-dark-primary"
                />
                {selectedNodesCheckBox.includes(node.toLowerCase()) && (
                  <Check
                    className="absolute left-0.5 top-0.5 w-3 h-3 text-dark-text-secondary pointer-events-none"
                    strokeWidth={3}
                  />
                )}
              </div>
              <label htmlFor={node} className="ml-3 text-sm text-white">
                {node}
              </label>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-[#24304B] rounded-lg p-4">
        <div className="space-y-2">
          {CONNECTION_TYPES.map((connection) => (
            <div key={connection.key} className="flex items-center">
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
                className="ml-3 text-sm"
                style={{ color: connection.color }}
              >
                {connection.text}
              </label>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default GraphSidebar;
