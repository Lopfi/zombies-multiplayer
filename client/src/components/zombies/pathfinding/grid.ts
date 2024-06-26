import Matter from "matter-js";
import { getObstacles } from "../zombieLogic";
import PF from "pathfinding";

export type PathFindingGrid = {
  width: number;
  height: number;
  data: number[][];
  pfGrid: PF.Grid;
  mapPointToGrid: (point: { x: number; y: number }) => { x: number; y: number };
  mapGridToPoint: (gridPoint: { x: number; y: number }) => {
    x: number;
    y: number;
  };
};

let cachedGridHash: string | null = null;
let cachedGrid: PathFindingGrid | null = null;

// we generate an image
export function generateObstaclePathFindingGrid() {
  const obstacles = getObstacles();

  const verticesHash = obstacles
    .map((body) =>
      body.vertices
        .map((vertex) => Math.round(vertex.x) + ":" + Math.round(vertex.y))
        .join(",")
    )
    .join(";");

  if (cachedGridHash === verticesHash) {
    return cachedGrid!;
  }

  // find the min and max x and y
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  obstacles.forEach((body) => {
    body.vertices.forEach((vertex) => {
      minX = Math.min(minX, vertex.x);
      minY = Math.min(minY, vertex.y);
      maxX = Math.max(maxX, vertex.x);
      maxY = Math.max(maxY, vertex.y);
    });
  });

  const resolution = 0.008; // grid fields per pixel
  const width = Math.ceil((maxX - minX) * resolution);
  const height = Math.ceil((maxY - minY) * resolution);
  const grid = new Array(width).fill(null).map(() => new Array(height).fill(0));

  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      const point = {
        x: minX + x / resolution,
        y: minY + y / resolution,
      };

      const isObstacle = obstacles.some((body) =>
        Matter.Vertices.contains(body.vertices, point)
      );

      grid[x][y] = isObstacle ? 1 : 0;
    }
  }

  cachedGridHash = verticesHash;
  cachedGrid = {
    width,
    height,
    data: grid,
    pfGrid: new PF.Grid(grid),
    mapPointToGrid: (point) => ({
      x: Math.round((point.x - minX) * resolution),
      y: Math.round((point.y - minY) * resolution),
    }),
    mapGridToPoint: (gridPoint) => ({
      x: minX + gridPoint.x / resolution,
      y: minY + gridPoint.y / resolution,
    }),
  };

  return cachedGrid!;
}
