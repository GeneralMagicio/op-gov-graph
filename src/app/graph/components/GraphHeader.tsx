import React from "react";
import SearchResultsDropdown from "./SearchResultsDropdown";
import { Node } from "../types";

interface GraphHeaderProps {
  searchTerm: string;
  onSearch: (term: string) => void;
  searchResults: Node[];
  onSelectSearchedNode: (node: Node) => void;
  onSearchInputClick: () => void;
}

const GraphHeader: React.FC<GraphHeaderProps> = ({
  searchTerm,
  onSearch,
  searchResults,
  onSelectSearchedNode,
  onSearchInputClick,
}) => {
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const term = event.target.value;
    onSearch(term);
  };

  return (
    <header className="p-4 bg-dark-background border border-black">
      <div className="flex items-center gap-8">
        <h1 className="text-2xl font-bold">OP GovGraph</h1>
        <div className="border-l pl-8 flex-grow relative">
          <input
            type="text"
            placeholder="Search by address, ENS or Farcaster ID"
            className="w-96 p-2 rounded"
            value={searchTerm}
            onChange={handleInputChange}
            onClick={onSearchInputClick}
          />
          <SearchResultsDropdown
            searchResults={searchResults}
            onSelectNode={onSelectSearchedNode}
          />
        </div>
      </div>
    </header>
  );
};

export default GraphHeader;
