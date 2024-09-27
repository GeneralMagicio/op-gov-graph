import React, { useEffect } from "react";
import SearchResultsDropdown from "./SearchResultsDropdown";
import { Node } from "../types";
import { Search } from "lucide-react";
import Image from "next/image";

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
  onSearchInputClick
}) => {
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const term = event.target.value;
    onSearch(term);
  };

  return (
    <header className="bg-dark-background text-dark-text-secondary p-4 flex justify-between items-center border-b border-black">
      <div className="flex items-center">
        <Image
          src="/images/logo.png"
          alt="OP Gov Graph FYI Logo"
          width={50}
          height={50}
          className="mr-3"
        />
        <div className="flex font-bold items-center">
          <h1 className="text-dark-primary text-[26px]">Gov</h1>
          <h1 className="text-dark-text-primary text-[26px]">Graph</h1>
          <h1 className="px-1 text-[12px] bg-dark-primary text-black rounded-sm ml-1 flex items-center">
            .fyi
          </h1>
        </div>
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
              href="https://govgraph.fyi/"
              className="hover:text-dark-text-primary transition-colors"
              target="_blank"
            >
              Docs
            </a>
          </li>
          <li>
            <a
              href="https://github.com/GeneralMagicio/op-gov-graph"
              className="hover:text-dark-text-primary transition-colors"
              target="_blank"
            >
              Github
            </a>
          </li>
          <li>
            <a
              href="https://github.com/GeneralMagicio/op-gov-graph/issues"
              className="hover:text-dark-text-primary transition-colors"
              target="_blank"
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
