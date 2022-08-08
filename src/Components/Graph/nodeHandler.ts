import { Dispatch, MutableRefObject, RefObject, SetStateAction, useEffect, useRef, useState } from "react";
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



  return {nodes, setNodes, graph, setGraph}

}