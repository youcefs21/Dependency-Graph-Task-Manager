import { useEffect, useRef, useState } from "react";
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
  toArchive: Immutable.List<string>,
  saveState: string,
  ignoreChange: boolean
}

export interface edgeState {
  node1_id: string,
  node2_id: string,
  action: "nothing" | "add" | "delete" 
}

const initialGraph = {
  scale: 0,
  TopLeftX: 0,
  TopLeftY: 0,
  mouseDown: false,
  heldNode: "nothing",
  selectedNode: "nothing",
  selectedPair: Immutable.List<string>(),
  userId: "root",
  toDelete: Immutable.List<string>(),
  toArchive: Immutable.List<string>(),
  saveState: "saved",
  ignoreChange: false
}

export function useGraph() {
  const nodesInit = trpc.useQuery(["nodes.getAll"]);
  const graphInit = trpc.useQuery(["settings.getAll"]);

  const updateNode = trpc.useMutation(["nodes.updateNode"]);
  const deleteNode = trpc.useMutation(["nodes.deleteNode"]);
  
  const updateGraph = trpc.useMutation(["settings.updateAll"]);

  const nodeIdPairs = trpc.useQuery(["nodes.getPairs"]);
  const addPair = trpc.useMutation(["nodes.addPair"])
  const deletePair = trpc.useMutation(["nodes.deletePair"])
  const adj = useRef(new Map<string, string[]>())

  const [nodes, setNodes] = useState(Immutable.Map<string, nodeState>())
  const [edges, setEdges] = useState(Immutable.List<edgeState>())
  const [graph, setGraph] = useState<graphState>(initialGraph);

  const [saveTimer, setSaveTimer] = useState<number>(0);
  
  // ============ setup state ============
  useEffect( () => {
    if (nodesInit.data && nodes.size === 0 && graphInit.data && nodeIdPairs.data) {

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

      let tempEdges = Immutable.List<edgeState>()

      nodeIdPairs.data.forEach(({node1_id, node2_id}) => {
        // set up adjecency list
        if (adj.current.get(node1_id)) {
          adj.current.get(node1_id)!.push(node2_id)
        } else {
          adj.current.set(node1_id, [node2_id])
        }
        // set up edges
        tempEdges = tempEdges.push({
          node1_id: node1_id,
          node2_id: node2_id,
          action: "nothing"
        });
      });
      setEdges(tempEdges)
    }

  }, [nodesInit.data, graphInit.data, nodeIdPairs.data])

  // ============ edge handling ============
  
  const edgeAction = (action: string, n1: string, n2: string) => {

    let tempEdges = edges;

    if (action === "add") {
      if (dfs(n1, n2)) {
        tempEdges = tempEdges.push({
          node1_id: n1, 
          node2_id: n2, 
          action: "add"
        });
        adj.current.get(n1) ? adj.current.get(n1)!.push(n2) : adj.current.set(n1, [n2])
        console.log(adj.current)
          
      } else {
        console.log("connection failed, would create a cycle")
      }
    } else if (action === "delete") {
        for (let i = 0; i < edges.size; i++){
          const cn1 = edges.get(i)?.node1_id
          const cn2 = edges.get(i)?.node2_id
          if ((cn1 === n1 && cn2 === n2) || (cn1 === n2 && cn2 === n1)) {
              tempEdges = tempEdges.set(i, {
                node1_id: cn1,
                node2_id: cn2,
                action: "delete"
              });
          }
        }
        // TODO delete the pair from adj
    }
    setEdges(tempEdges)

  }
  
  function dfs(target: string, initial: string) {
    const visited = new Set<string>()

    function isValidConnection(n: string) {
      if (n === target)
        return false
      visited.add(n)

      if (!adj.current.get(n)) 
        return true
      var valid = true
      adj.current.get(n)!.forEach((next) => {
        if (!visited.has(next) && !isValidConnection(next)) {
          valid = false
          return
        }
      }) 
      return valid
    }
    return isValidConnection(initial)
  }

  // ============ setup timer ============
  useEffect(() => {
    const interval = setInterval(() => {
      setSaveTimer(saveTimer + 1);
    }, 100);
    return () => clearInterval(interval);
  }, [saveTimer]);

  // ============ reset timer on change ============
  useEffect(() => {
    if (!graph.ignoreChange){
      setSaveTimer(0)
      setGraph({
        ...graph,
        saveState: "not saved",
      });
      return;
    }

    setGraph({
      ...graph,
      ignoreChange: false
    });
  }, [graph.scale, graph.TopLeftY, graph.TopLeftX, nodes, edges]);


  // ============ push to database ============
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

    // add and delete edges
    let tempEdges = edges
    edges.forEach((edge, i) => {
      if (edge.action === "add"){
        addPair.mutate({node1Id: edge.node1_id, node2Id: edge.node2_id})
        tempEdges = edges.set(i, {...edge, action: "nothing"})
      }
      else if (edge.action === "delete") {
        deletePair.mutate({node1Id: edge.node1_id, node2Id: edge.node2_id})
        tempEdges = edges.delete(i)
      }
    });

    setEdges(tempEdges)

    // clear archive and delete lists
    setGraph({
      ...graph,
      toDelete: Immutable.List<string>(),
      toArchive: Immutable.List<string>(),
      saveState: "saved",
      ignoreChange: true
    })

    console.log("updating everything")
  }, [saveTimer]);

  return {nodes, setNodes, graph, setGraph, edges, edgeAction}

}
