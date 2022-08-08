import { useEffect, useState } from "react";
import Immutable from "immutable";
import { trpc } from "../../utils/trpc";


export interface nodeState {
  goal: string,
  x: number,
  y: number
}

export interface graphState {
  scale: number,
  TopLeftX: number,
  TopLeftY: number,
  mouseDown: boolean,
  heldNode: string,
  selectedNode: string,
  selectedPair: Immutable.List<string>
  userId: string,
  toDelete: Immutable.List<string>,
  toArchive: Immutable.List<string>
}

export const initialGraph = {
  scale: 0,
  TopLeftX: 0,
  TopLeftY: 0,
  mouseDown: false,
  heldNode: "nothing",
  selectedNode: "nothing",
  selectedPair: Immutable.List<string>(),
  userId: "root",
  toDelete: Immutable.List<string>(),
  toArchive: Immutable.List<string>()
}

export function useNodes() {
  const nodesInit = trpc.useQuery(["nodes.getAll"]);
  const graphInit = trpc.useQuery(["settings.getAll"]);

  const updateNode = trpc.useMutation(["nodes.updateNode"]);
  const deleteNode = trpc.useMutation(["nodes.deleteNode"]);
  const updateGraph = trpc.useMutation(["settings.updateAll"]);

  const [nodes, setNodes] = useState(Immutable.Map<string, nodeState>())
  const [graph, setGraph] = useState<graphState>(initialGraph);

  const [saveTimer, setSaveTimer] = useState<number>(0);
  
  // ============ setup state ============
  useEffect( () => {
    if (nodesInit.data && nodes.size === 0 && graphInit.data) {

      let tempNodes = Immutable.Map<string,nodeState>()
      
      nodesInit.data.forEach(node => {
        tempNodes = tempNodes.set(node.id, {
          x: node.x,
          y: node.y,
          goal: node.goal
        });
      });
      setNodes(tempNodes);

      setGraph({
        ...graph,
        TopLeftX: graphInit.data.x,
        TopLeftY: graphInit.data.y,
        scale: graphInit.data.scale
      });

    }

  }, [nodesInit.data, graphInit.data])

  useEffect(() => {
    const interval = setInterval(() => {
      setSaveTimer(saveTimer + 1);
    }, 100);
    return () => clearInterval(interval);
  }, [saveTimer]);

  useEffect(() => {
    setSaveTimer(0)
  }, [graph.scale, graph.TopLeftY, graph.TopLeftX, nodes]);

  useEffect(() => {
    if (saveTimer != 100)
      return
    
    // update graph
    updateGraph.mutate({
      userId: "root",
      scale: graph.scale, 
      pos: {x: graph.TopLeftX, y: graph.TopLeftY}
    })
    
    // update nodes 
    nodes.forEach((node, key) => {
      updateNode.mutate({
        nodeId: key,
        cords: {x: node.x, y: node.y},
        goal: node.goal
      })
    })
    // archive nodes
    graph.toArchive.forEach((nodeID, i) => {
      updateNode.mutate({
        nodeId: nodeID,
        archive: true
      })
    });
    

    // delete nodes
    graph.toDelete.forEach((nodeID, i) => {
      deleteNode.mutate({
        nodeId: nodeID
      });
    });

    // clear archive and delete lists
    setGraph({
      ...graph,
      toDelete: Immutable.List<string>(),
      toArchive: Immutable.List<string>()
    })

    console.log("updating everything")
  }, [saveTimer]);

  return {nodes, setNodes, graph, setGraph}

}
