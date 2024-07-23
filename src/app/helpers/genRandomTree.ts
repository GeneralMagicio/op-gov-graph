export interface Node {
  id: number; // Assuming id is a number based on the usage in the function
  neighbors?: Node[];
  links?: Link[];
  x?: number;
  y?: number;
}

export interface Link {
  source: number;
  target: number;
}

export interface Graph {
  nodes: Node[];
  links: Link[];
}

export function genRandomTree(N = 300): Graph {
  return {
    nodes: Array.from(Array(N).keys()).map((i) => ({ id: i })),
    links: Array.from(Array(N).keys())
      .filter((id) => id)
      .map((id) => ({
        source: id,
        target: Math.round(Math.random() * (id - 1)),
      })),
  };
}
