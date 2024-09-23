import React, { useState, useRef, useEffect } from "react";
import { CONNECTION_TYPES } from "../types/connectionTypes";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { NodeLinkType } from "../types";

interface IGraphSidebarProps {
  selectedConnectionsCheckBox: NodeLinkType[];
  setSelectedConnectionsCheckBox: React.Dispatch<
    React.SetStateAction<NodeLinkType[]>
  >;
}

const GraphSidebar: React.FC<IGraphSidebarProps> = ({
  selectedConnectionsCheckBox,
  setSelectedConnectionsCheckBox
}) => {
  const [isConnectionsExpanded, setIsConnectionsExpanded] = useState(true);
  const connectionsRef = useRef<HTMLDivElement>(null);
  const [connectionsHeight, setConnectionsHeight] = useState<
    number | undefined
  >(undefined);

  useEffect(() => {
    if (connectionsRef.current) {
      setConnectionsHeight(connectionsRef.current.scrollHeight);
    }
  }, []);

  const toggleConnections = () => {
    setIsConnectionsExpanded(!isConnectionsExpanded);
  };

  return (
    <aside className="fixed left-4 top-[94px] bottom-0 z-10 w-50 flex flex-col">
      <div className="bg-[#24304B] rounded-lg p-4 mb-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-white">Citizens</span>
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
        className={`bg-[#24304B] rounded-lg p-4 overflow-hidden transition-all duration-300 ease-in-out`}
        style={{
          maxHeight: isConnectionsExpanded ? connectionsHeight : 0,
          opacity: isConnectionsExpanded ? 1 : 0
        }}
      >
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
                className="ml-3 text-xs"
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
