import { Suspense } from "react";
import GraphPage from "./graph/GraphPage";
import { HydrateClient } from "@/trpc/server";

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HydrateClient>
        <GraphPage />
      </HydrateClient>
    </Suspense>
  );
}
