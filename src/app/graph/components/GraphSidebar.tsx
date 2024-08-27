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
  const connectionOptions = [
    { name: "TECHolder", color: "blue" },
    { name: "RegenScore", color: "green" },
    { name: "TrustedSeed", color: "red" },
    { name: "FarcasterConnection", color: "purple" },
    { name: "BadgeHolderReferral", color: "orange" },
  ];

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
                  checked={selectedNodesCheckBox.includes(node.toLowerCase())}
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
            <div
              key={connection.name}
              className="flex items-center flex-shrink-0"
            >
              <label className="flex items-center w-full text-gray-700 text-sm">
                <input
                  type="checkbox"
                  checked={selectedConnectionsCheckBox.includes(
                    connection.name
                  )}
                  onChange={() => {
                    setSelectedConnectionsCheckBox((prev) =>
                      prev.includes(connection.name)
                        ? prev.filter((c) => c !== connection.name)
                        : [...prev, connection.name]
                    );
                  }}
                  className="mr-2"
                />
                <div
                  className="w-4 h-4 mr-2 rounded-full"
                  style={{ backgroundColor: connection.color }}
                ></div>
                {connection.name}
              </label>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default GraphSidebar;
