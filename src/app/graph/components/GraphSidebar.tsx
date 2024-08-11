import React from "react";

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
  const connectionOptions = ["TECHolder", "RegenScore", "TrustedSeed"];

  return (
    <aside className="p-4 flex-shrink-0">
      <div className="mb-4">
        <h2 className="font-semibold mb-2">Nodes</h2>
        <div className="space-y-2">
          {nodeOptions.map((node) => (
            <div key={node} className="flex items-center flex-shrink-0">
              <label className="flex items-center w-full text-gray-700 text-sm">
                <input
                  type="checkbox"
                  checked={selectedNodesCheckBox.includes(node.toLowerCase())} // Use lowercase to match internal state
                  onChange={() => {
                    setSelectedNodesCheckBox((prev) =>
                      prev.includes(node.toLowerCase())
                        ? prev.filter((n) => n !== node.toLowerCase())
                        : [...prev, node.toLowerCase()]
                    );
                  }}
                  className="mr-2"
                />
                {node}
              </label>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h2 className="font-semibold mb-2">Connections</h2>
        <div className="space-y-2">
          {connectionOptions.map((connection) => (
            <div key={connection} className="flex items-center flex-shrink-0">
              <label className="flex items-center w-full text-gray-700 text-sm">
                <input
                  type="checkbox"
                  checked={selectedConnectionsCheckBox.includes(connection)}
                  onChange={() => {
                    setSelectedConnectionsCheckBox((prev) =>
                      prev.includes(connection)
                        ? prev.filter((c) => c !== connection)
                        : [...prev, connection]
                    );
                  }}
                  className="mr-2"
                />
                {connection}
              </label>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default GraphSidebar;
