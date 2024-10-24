import { useState, useCallback, useMemo } from "react";
import { Node, NodeType } from "../graph/types";

export const useSearchCitizens = (nodes: Node[]) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSearchedNode, setSelectedSearchedNode] = useState<Node | null>(
    null
  );

  const normalizeString = (str: string) =>
    str.toLowerCase().replace(/\s+/g, "");

  const searchedNodes = useMemo(() => {
    if (!searchTerm) return [];

    const normalizedSearchTerm = normalizeString(searchTerm);

    return nodes.filter((node) => {
      if (node.type !== NodeType.Citizen) return false;

      const matchesAddress = normalizeString(node.id).includes(
        normalizedSearchTerm
      );
      const matchesENS =
        node.ens && normalizeString(node.ens).includes(normalizedSearchTerm);
      const matchesFarcaster =
        node.profileName &&
        normalizeString(node.profileName).includes(normalizedSearchTerm);

      return matchesAddress || matchesENS || matchesFarcaster;
    });
  }, [nodes, searchTerm]);

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    setSelectedSearchedNode(null);
  }, []);

  const handleSelectSearchedNode = useCallback((node: Node) => {
    setSelectedSearchedNode(node);
    setSearchTerm("");
  }, []);

  const resetSearch = useCallback(() => {
    setSearchTerm("");
    setSelectedSearchedNode(null);
  }, []);

  return {
    searchTerm,
    searchedNodes,
    selectedSearchedNode,
    handleSearch,
    handleSelectSearchedNode,
    resetSearch,
    setSearchTerm
  };
};
