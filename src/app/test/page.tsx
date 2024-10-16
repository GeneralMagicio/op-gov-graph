"use client";

import { api } from "../../trpc/react";

const TestPage = () => {
  // In a React component

  const { data, isLoading } = api.graph.getGraphData.useQuery({
    networkId: 1,
    selectedNodeTypes: ["Citizen"],
    selectedLinkTypes: ["FarcasterConnection"]
  });
  console.log("data", data);
  return <div>Test Page</div>;
};

export default TestPage;
