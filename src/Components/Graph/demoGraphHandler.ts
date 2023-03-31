import { useEffect, useState } from "react";
import { defaultNode, graphState, layerState, nodeState } from "./graphHandler";
import imt from "immutable";
import { AABB } from "./AABB";
import { hitBoxHalfHeight, hitBoxHalfWidth, useWindowDimensions } from "./Canvas";

const initialLayers: [string, layerState][] = [
  ["complete", {
    name: "complete",
    visible: false,
    action: "nothing"
  }],
]

const initialGraph: graphState = {
  graphId: "demo",
  graphName: "Demo Graph",
  scale: 20,
  TopLeftX: -25.027574333239095,
  TopLeftY: -27.74060247256179,
  mouseDown: false,
  heldNode: "nothing",
  selectedNodes: imt.Set(),
  selectedArea: {x1: 0, y1: 0, x2: 0, y2: 0},
  edgeActionState: {parents: imt.Set(), children: imt.Set(), action: "nothing"},
  userId: "demo",
  saveState: "demo mode, no save",
  loaded: false,
  layers: imt.Map<string, layerState>(initialLayers),
  indexedLayerIds: imt.List<string>(["complete"]),
  showArchive: false,
  completeLayerId: "complete",
  treeFocus: "root",
  animation: null,
  toolbarMsg: null,
  AABBTree: new AABB(),
  width: 0,
  height: 0,
}


const initialNodes: [string, nodeState][] = [
  [
    "A",
    {
      "x": -10,
      "y": -12,
      "goal": "root node",
      "description": "This is a root node, it's not a dependency of anything, so it's a terminal goal\n\nThe red connection means the connected node should be complete first",
      "action": "update",
      "animation": null,
      "nodeSize": 1,
      "nodeColor": "default",
      "due": null,
      "priority": "normal",
      "layerIds": imt.Set([]),
      "archive": false,
      "dependencyIds": imt.List([
        "B",
        "C"
      ]),
      "dependentIds": imt.List([]),
      "cascadeDue": true,
      "treeCollapse": false
    }
  ],
  [
    "B",
    {
      "x": 6,
      "y": -2,
      "goal": "Deadline",
      "description": "if you set a due date on a node, it'll have a countdown on it!",
      "action": "add",
      "animation": null,
      "nodeSize": 1,
      "nodeColor": "default",
      "due": "2023-05-09T08:26",
      "priority": "normal",
      "layerIds": imt.Set([]),
      "archive": false,
      "dependencyIds": imt.List([
        "D"
      ]),
      "dependentIds": imt.List([
        "A"
      ]),
      "cascadeDue": false,
      "treeCollapse": false
    }
  ],
  [
    "C",
    {
      "x": -10,
      "y": 1,
      "goal": "leaf node",
      "description": "This is a leaf node, it has no dependencies! it can be complete right now! ",
      "action": "update",
      "animation": null,
      "nodeSize": 1,
      "nodeColor": "default",
      "due": null,
      "priority": "normal",
      "layerIds": imt.Set([]),
      "archive": false,
      "dependencyIds": imt.List([
        "clfwivv8o00022v6m7x0atwn1"
      ]),
      "dependentIds": imt.List([
        "A",
      ]),
      "cascadeDue": true,
      "treeCollapse": false
    }
  ],
  [
    "D",
    {
      "x": 17,
      "y": 3,
      "goal": "Deadline Cascade",
      "description": "When you set the due date for a non-root node, all it's children inherit it as a maximum deadline.\n\nAs in, this node can't be set to be due before it's parent node (the node that depends on it).  ",
      "action": "add",
      "animation": null,
      "nodeSize": 1,
      "nodeColor": "default",
      "due": "2023-05-09T08:26",
      "priority": "normal",
      "layerIds": imt.Set([]),
      "archive": false,
      "dependencyIds": imt.List([]),
      "dependentIds": imt.List([
        "B"
      ]),
      "cascadeDue": true,
      "treeCollapse": false
    }
  ],
  [
    "clfwibezq00002v6m0x12ne8y",
    {
      "x": -10,
      "y": -17,
      "goal": "double click a node to focus on it",
      "description": "start at the root node!",
      "action": "add",
      "animation": null,
      "nodeSize": 1,
      "nodeColor": "default",
      "due": null,
      "priority": "normal",
      "layerIds": imt.Set([]),
      "archive": false,
      "dependencyIds": imt.List([]),
      "dependentIds": imt.List([]),
      "cascadeDue": true,
      "treeCollapse": false
    }
  ],
  [
    "clfwivv8o00022v6m7x0atwn1",
    {
      "x": -16,
      "y": 8,
      "goal": "A completed node",
      "description": "This node is marked as complete",
      "action": "update",
      "animation": null,
      "nodeSize": 1,
      "nodeColor": "default",
      "due": null,
      "priority": "normal",
      "layerIds": imt.Set([
        "complete"
      ]),
      "archive": false,
      "dependencyIds": imt.List([]),
      "dependentIds": imt.List([
        "C"
      ]),
      "cascadeDue": true,
      "treeCollapse": false
    }
  ],
  [
    "clfwiy55u00032v6mzfc1mimj",
    {
      "x": -31,
      "y": 6,
      "goal": "insert goal here",
      "description": null,
      "action": "delete",
      "animation": null,
      "nodeSize": 1,
      "nodeColor": "default",
      "due": null,
      "priority": "normal",
      "layerIds": imt.Set([]),
      "archive": false,
      "dependencyIds": imt.List([
      ]),
      "dependentIds": imt.List([]),
      "cascadeDue": true,
      "treeCollapse": false
    }
  ]
]

export function useDemoGraph() {
  const [nodes, setNodes] = useState(imt.Map<string, nodeState>(initialNodes))
  const [graph, setGraph] = useState<graphState>(initialGraph);
  const {width, height} = useWindowDimensions();


  useEffect(() => {
    // for each node, add it to the AABB tree
    nodes.forEach((node, nodeId) => {
        graph.AABBTree = graph.AABBTree.addNode(node, nodeId) ?? graph.AABBTree;
    })

    setGraph({
      ...graph, 
      loaded: true,
      width: width,
      height: height,
    });
  }, [width, height])
  
  return {nodes, setNodes, graph, setGraph}
}