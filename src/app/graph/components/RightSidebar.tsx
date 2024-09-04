import React, { useEffect, useState } from "react";
import { Node } from "../types";

interface RightSidebarProps {
  selectedNode: Node | null;
  onClose: () => void;
}

const RightSidebar: React.FC<RightSidebarProps> = ({
  selectedNode,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (selectedNode) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [selectedNode]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Delay onClose to allow animation to complete
  };

  return (
    <div
      className={`fixed right-0 top-0 h-full w-80 bg-white shadow-lg p-4 overflow-y-auto transition-transform transform ease-in-out duration-300 ${
        isVisible ? "translate-x-0" : "translate-x-full"
      }`}
    >
      {selectedNode && (
        <>
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
          <div className="flex flex-col items-center mb-4">
            {selectedNode.profileImage ? (
              <img
                src={selectedNode.profileImage}
                alt="Profile"
                className="w-24 h-24 rounded-full mb-2"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center mb-2">
                <span className="text-2xl text-gray-500">
                  {selectedNode.ens?.[0] || selectedNode.id[0]}
                </span>
              </div>
            )}
            <h2 className="text-xl font-semibold">
              {selectedNode.ens || selectedNode.id}
            </h2>
          </div>
          <div className="space-y-4">
            {selectedNode.profileName && (
              <div>
                <h3 className="font-medium">Farcaster Username</h3>
                <p>{selectedNode.profileName}</p>
              </div>
            )}
            {selectedNode.profileDisplayName && (
              <div>
                <h3 className="font-medium">Display Name</h3>
                <p>{selectedNode.profileDisplayName}</p>
              </div>
            )}
            {selectedNode.profileBio && (
              <div>
                <h3 className="font-medium">Bio</h3>
                <p>{selectedNode.profileBio}</p>
              </div>
            )}
            {selectedNode.tecBalance && (
              <div>
                <h3 className="font-medium">TEC Balance</h3>
                <p>{selectedNode.tecBalance} TEC</p>
              </div>
            )}
            {selectedNode.regenScore && (
              <div>
                <h3 className="font-medium">Regen Score</h3>
                <p>{selectedNode.regenScore}</p>
              </div>
            )}
            {selectedNode.trustedSeed && (
              <div>
                <h3 className="font-medium">Trusted Seed</h3>
                <p>Yes</p>
              </div>
            )}
            {selectedNode.regenPOAP && (
              <div>
                <h3 className="font-medium">Regen POAP</h3>
                <p>Yes</p>
              </div>
            )}
            {selectedNode.followings && (
              <div>
                <h3 className="font-medium">Followings</h3>
                <p>{selectedNode.followings.length}</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default RightSidebar;
