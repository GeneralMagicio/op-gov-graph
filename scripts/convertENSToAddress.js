import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";
import * as fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = createPublicClient({
  chain: mainnet,
  transport: http()
});

async function convertEnsToAddress(ensAddress) {
  try {
    const address = await client.getEnsAddress({
      name: ensAddress
    });
    return address;
  } catch (error) {
    console.error(`Error resolving ENS ${ensAddress}:`, error);
    return null;
  }
}

async function processDelegate(delegate) {
  const walletAddress = await convertEnsToAddress(delegate.ensAddress);
  return {
    ...delegate,
    id: walletAddress || delegate.ensAddress // Use ENS as fallback if resolution fails
  };
}

async function main() {
  try {
    const dataPath = path.join(
      __dirname,
      "..",
      "public",
      "data",
      "delegates.json"
    );
    const data = await fs.readFile(dataPath, "utf-8");
    const delegates = JSON.parse(data);

    const updatedDelegates = await Promise.all(delegates.map(processDelegate));

    await fs.writeFile(dataPath, JSON.stringify(updatedDelegates, null, 2));
    console.log("Updated delegates.json with wallet addresses");
  } catch (error) {
    console.error("Error processing delegates:", error);
  }
}

main();
