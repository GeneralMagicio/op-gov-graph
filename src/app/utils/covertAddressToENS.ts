interface Citizen {
  id: string;
  ens: string | null;
}

const citizensData = async (): Promise<Citizen[]> => {
  const response = await fetch("/data/Citizens.json");
  return response.json();
};

let addressToEnsMap: Map<string, string> | null = null;

const initializeAddressToEnsMap = async () => {
  if (addressToEnsMap === null) {
    const citizens = await citizensData();
    addressToEnsMap = new Map();
    citizens.forEach((citizen: Citizen) => {
      if (citizen.ens) {
        addressToEnsMap!.set(citizen.id.toLowerCase(), citizen.ens);
      }
    });
  }
};

export const convertAddressToENS = async (address: string): Promise<string> => {
  await initializeAddressToEnsMap();
  return addressToEnsMap!.get(address.toLowerCase()) || address;
};
