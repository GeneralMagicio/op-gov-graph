const axios = require("axios");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

interface Citizen {
  id: string;
  ens?: string;
}

interface TokenTransaction {
  timeStamp: string;
  from: string;
  to: string;
  tokenName: string;
  tokenSymbol: string;
  tokenDecimal: string;
  value: string;
  hash: string;
}

interface CitizenTransaction {
  date: string;
  from: string;
  to: string;
  tokenName: string;
  tokenSymbol: string;
  value: number;
  hash: string;
}

const apiKey = process.env.NEXT_PUBLIC_OP_ETHERSCAN_API_KEY;

const fetchTokenTransactions = async (
  address: string
): Promise<TokenTransaction[]> => {
  const url = `https://api-optimistic.etherscan.io/api?module=account&action=tokentx&address=${address}&startblock=0&endblock=99999999&sort=asc&apikey=${apiKey}`;

  try {
    const response = await axios.get(url);
    const data = response.data;

    if (data.status === "1") {
      return data.result;
    } else {
      console.error(
        `No token transactions found or an error occurred for address: ${address}`
      );
      return [];
    }
  } catch (error) {
    console.error(`Error fetching transactions for address ${address}:`, error);
    return [];
  }
};

const loadCitizens = (): Citizen[] => {
  const filePath = path.join(process.cwd(), "public", "data", "Citizens.json");
  const fileContent = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(fileContent);
};

const processCitizenTransactions = async (citizens: Citizen[]) => {
  const citizenAddresses = new Set(citizens.map((c) => c.id.toLowerCase()));
  const transactions: CitizenTransaction[] = [];
  const now = new Date();
  const oneYearAgo = new Date(now);
  oneYearAgo.setFullYear(now.getFullYear() - 1);

  for (const citizen of citizens) {
    console.log(`Fetching transactions for citizen: ${citizen.id}`);
    const tokenTransactions = await fetchTokenTransactions(citizen.id);

    for (const tx of tokenTransactions) {
      const txDate = new Date(parseInt(tx.timeStamp) * 1000);

      if (
        citizenAddresses.has(tx.from.toLowerCase()) &&
        citizenAddresses.has(tx.to.toLowerCase())
      ) {
        const value =
          parseInt(tx.value) / Math.pow(10, parseInt(tx.tokenDecimal));

        transactions.push({
          date: txDate.toISOString(),
          from: tx.from,
          to: tx.to,
          tokenName: tx.tokenName,
          tokenSymbol: tx.tokenSymbol,
          value: value,
          hash: tx.hash,
        });
      }
    }
  }

  return transactions;
};

const saveCitizenTransactions = (transactions: CitizenTransaction[]) => {
  const outputPath = path.join(
    process.cwd(),
    "public",
    "data",
    "citizenTransactions.json"
  );
  const jsonContent = JSON.stringify(transactions, null, 2);
  fs.writeFileSync(outputPath, jsonContent);
  console.log(
    "Citizen transactions have been saved to public/data/citizenTransactions.json"
  );
};

const main = async () => {
  const citizens = loadCitizens();
  console.log(`Loaded ${citizens.length} citizens`);

  const transactions = await processCitizenTransactions(citizens);
  console.log(`Found ${transactions.length} transactions between citizens`);
  saveCitizenTransactions(transactions);
};

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { generateCitizenTransactions: main };
