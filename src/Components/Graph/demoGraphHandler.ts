import { useEffect, useState } from "react";
import { defaultNode, graphState, layerState, nodeState } from "./graphHandler";
import imt from "immutable";
import { AABB } from "./AABB";
import { hitBoxHalfHeight, hitBoxHalfWidth, useWindowDimensions } from "./Canvas";

const initialGraph: graphState = {
  graphId: "demo",
  graphName: "Demo Graph",
  scale: 30,
  TopLeftX: 0,
  TopLeftY: 0,
  mouseDown: false,
  heldNode: "nothing",
  selectedNodes: imt.Set(),
  selectedArea: {x1: 0, y1: 0, x2: 0, y2: 0},
  edgeActionState: {parents: imt.Set(), children: imt.Set(), action: "nothing"},
  userId: "demo",
  saveState: "demo mode, no save",
  loaded: false,
  layers: imt.Map<string, layerState>(),
  indexedLayerIds: imt.List<string>(),
  showArchive: false,
  completeLayerId: "",
  treeFocus: "root",
  animation: null,
  toolbarMsg: null,
  AABBTree: new AABB(),
  width: 0,
  height: 0,
}

const initialNodes: [string, nodeState][] = [
  ["A", {
    ...defaultNode,
    goal: "Getting started with Nodify",
    dependencyIds: imt.List(["B"]),
  }],
  ["B", {
    ...defaultNode,
    goal: "Double click me!",
    dependencyIds: imt.List(["C", "D"]),
    dependentIds: imt.List(["A"]),
    y: hitBoxHalfHeight*2
  }],
  ["C", {
    ...defaultNode,
    goal: "Completing a node",
    description: "There is two ways of marking a node as complete",
    dependentIds: imt.List(["B"]),
    y: hitBoxHalfHeight*4,
    x: hitBoxHalfWidth
  }],
  ["D", {
    ...defaultNode,
    goal: "Navigating the graph",
    dependentIds: imt.List(["B"]),
    y: hitBoxHalfHeight*4,
    x: -hitBoxHalfWidth
  }],
]

export function useDemoGraph() {
  const [nodes, setNodes] = useState(imt.Map<string, nodeState>(initialNodes))
  const [graph, setGraph] = useState<graphState>(initialGraph);
  const {width, height} = useWindowDimensions();


  useEffect(() => {
    setGraph({
      ...graph, 
      TopLeftX: graph.TopLeftX - (width-graph.width)/(graph.scale*2), 
      TopLeftY: graph.TopLeftY - (height-graph.height)/(graph.scale*2),
      loaded: true,
      width: width,
      height: height,
    });
  }, [width, height])
  
  return {nodes, setNodes, graph, setGraph}
}