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
      className={`fixed right-0 top-0 h-full w-96 bg-gradient-to-b from-blue-50 to-indigo-100 shadow-lg overflow-y-auto transition-transform transform ease-in-out duration-300 ${
        isVisible ? "translate-x-0" : "translate-x-full"
      }`}
    >
      {selectedNode && (
        <div className="p-6">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-gray-600 hover:text-gray-800 transition-colors duration-200"
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
          <div className="flex flex-col items-center mb-8">
            {selectedNode.profileImage ? (
              <img
                src={selectedNode.profileImage}
                alt="Profile"
                className="w-32 h-32 rounded-full mb-4 border-4 border-white shadow-lg"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center mb-4 border-4 border-white shadow-lg">
                <span className="text-4xl font-bold text-white">
                  {selectedNode.ens?.[0] || selectedNode.id[0]}
                </span>
              </div>
            )}
            <h2 className="text-2xl font-bold text-gray-800">
              {selectedNode.ens || selectedNode.id}
            </h2>
            {selectedNode.profileName && (
              <p className="text-indigo-600 font-medium mt-1">
                @{selectedNode.profileName}
              </p>
            )}
          </div>
          <div className="space-y-6">
            {selectedNode.profileDisplayName && (
              <div className="bg-white rounded-lg p-4 shadow">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  Display Name
                </h3>
                <p className="text-gray-600">
                  {selectedNode.profileDisplayName}
                </p>
              </div>
            )}
            {selectedNode.profileBio && (
              <div className="bg-white rounded-lg p-4 shadow">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  Bio
                </h3>
                <p className="text-gray-600">{selectedNode.profileBio}</p>
              </div>
            )}
            {(selectedNode.tecBalance || selectedNode.regenScore) && (
              <div className="grid grid-cols-1 gap-4">
                {selectedNode.tecBalance && (
                  <div className="bg-white rounded-lg p-4 shadow">
                    <h3 className="text-sm font-semibold text-gray-700 mb-1">
                      TEC Balance
                    </h3>
                    <p className="text-2xl font-bold text-indigo-600">
                      {selectedNode.tecBalance} TEC
                    </p>
                  </div>
                )}
                {selectedNode.regenScore && (
                  <div className="bg-white rounded-lg p-4 shadow">
                    <h3 className="text-sm font-semibold text-gray-700 mb-1">
                      Regen Score
                    </h3>
                    <p className="text-2xl font-bold text-green-600">
                      {selectedNode.regenScore}
                    </p>
                  </div>
                )}
              </div>
            )}
            {(selectedNode.trustedSeed || selectedNode.regenPOAP) && (
              <div className="flex space-x-4">
                {selectedNode.trustedSeed && (
                  <div className="flex-1 bg-white rounded-lg p-4 shadow text-center">
                    <h3 className="text-sm font-semibold text-gray-700 mb-1">
                      Trusted Seed
                    </h3>
                    <p className="text-xl font-bold text-blue-600">Yes</p>
                  </div>
                )}
                {selectedNode.regenPOAP && (
                  <div className="flex-1 bg-white rounded-lg p-4 shadow text-center">
                    <h3 className="text-sm font-semibold text-gray-700 mb-1">
                      Regen POAP
                    </h3>
                    <p className="text-xl font-bold text-purple-600">Yes</p>
                  </div>
                )}
              </div>
            )}
            {selectedNode.followings && (
              <div className="bg-white rounded-lg p-4 shadow">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  Followings
                </h3>
                <p className="text-3xl font-bold text-indigo-600">
                  {selectedNode.followings.length}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RightSidebar;
