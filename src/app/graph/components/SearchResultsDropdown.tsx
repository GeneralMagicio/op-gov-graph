import React from "react";
import { Node } from "../types";

interface SearchResultsDropdownProps {
  searchResults: Node[];
  onSelectNode: (node: Node) => void;
}

const SearchResultsDropdown: React.FC<SearchResultsDropdownProps> = ({
  searchResults,
  onSelectNode,
}) => {
  if (searchResults?.length === 0) return null;

  return (
    <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
      {searchResults.map((node) => (
        <div
          key={node.id}
          className="cursor-pointer hover:bg-gray-100 px-4 py-2"
          onClick={() => onSelectNode(node)}
        >
          <p className="text-sm font-medium text-gray-900">
            {node.ens || node.id}
          </p>
          {node.profileName && (
            <p className="text-sm text-gray-500">@{node.profileName}</p>
          )}
        </div>
      ))}
    </div>
  );
};

export default SearchResultsDropdown;
