// types.ts

export interface Link {
  source: string;
  target: string;
  type: string;
}

export interface ICitizen {
  id: string;
  ens?: string;
  x?: number;
  y?: number;
  type?: string;
}

export interface Node extends ICitizen {
  id: string;
  name?: string;
  x?: number;
  y?: number;
  type?: string;
}

export interface GraphData {
  nodes: Node[];
  links: Link[];
}

export interface NodeWithNeighbors extends Node {
  neighbors?: Node[];
  links?: Link[];
}

export interface GraphDataWithNeighbors extends GraphData {
  nodes: NodeWithNeighbors[];
}

export interface TECHolder {
  id: string;
  balance: string;
  pendingBalanceUpdate: string;
  x?: number;
  y?: number;
  type?: string;
}

export interface RegenScore {
  id: string;
  score: number;
  address: string;
  meta: string;
  x?: number;
  y?: number;
  type?: string;
}

export interface TrustedSeed {
  id: string;
  x?: number;
  y?: number;
  type?: string;
}

export interface FarcasterConnection {
  source: string;
  target: string;
}
