import React from "react";
import SearchResultsDropdown from "./SearchResultsDropdown";
import { Node } from "../types";
import { Search } from "lucide-react";
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
    <header className="bg-dark-background text-dark-text-secondary p-4 flex justify-between items-center border-b border-black">
      <div className="flex items-center">
        {/* Logo here */}
        <h1 className="text-xl font-bold text-dark-text-primary">
          OP Gov Graph FYI
        </h1>
      </div>

      <nav className="flex-grow flex justify-center">
        <ul className="flex space-x-6">
          <li>
            <a
              href="#"
              className="text-dark-text-primary pb-6 border-b-2 border-dark-primary"
            >
              Network
            </a>
          </li>
          <li>
            <a
              href="#"
              className="hover:text-dark-text-primary transition-colors"
            >
              Docs
            </a>
          </li>
          <li>
            <a
              href="#"
              className="hover:text-dark-text-primary transition-colors"
            >
              Github
            </a>
          </li>
          <li>
            <a
              href="#"
              className="hover:text-dark-text-primary transition-colors"
            >
              Suggest features
            </a>
          </li>
        </ul>
      </nav>

      <div className="relative">
        <input
          type="text"
          placeholder="Search"
          className="bg-dark-surface text-dark-text-primary pl-10 pr-4 py-2 rounded-full focus:outline-none focus:ring-2 focus:ring-dark-primary w-72"
          value={searchTerm}
          onChange={handleInputChange}
          onClick={onSearchInputClick}
        />
        <Search
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-text-secondary"
          size={18}
        />
        <SearchResultsDropdown
          searchResults={searchResults}
          onSelectNode={onSelectSearchedNode}
        />
      </div>
    </header>
  );
};

export default GraphHeader;
