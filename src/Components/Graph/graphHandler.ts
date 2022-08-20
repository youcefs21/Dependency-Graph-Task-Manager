import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import Immutable from "immutable";
import { trpc } from "../../utils/trpc";
import {useSession} from "next-auth/react";


export interface nodeState {
  goal: string,
  x: number,
  y: number,
  description: string | null,
  action: "nothing" | "add" | "delete" | "archive" | "update",
  nodeSize: number,
  due: string | null,
  priority: "critical" | "high" | "normal" | "low" | string
}

export interface graphState {
  graphId: string, 
  graphName: string,
  scale: number,
  TopLeftX: number,
  TopLeftY: number,
  mouseDown: boolean,
  heldNode: "nothing" | "background" | string,
  selectedNodes: Immutable.Set<string>,
  selectedPair: Immutable.List<string>,
  selectedArea: {x1: number, y1: number, x2: number, y2: number},
  userId: string,
  saveState: "saved" | "not saved",
  loaded: boolean,
  ignoreChange: boolean,
  layers: Immutable.Map<string, layerState>
}

export interface edgeState {
  action: "nothing" | "add" | "delete" 
}

export interface layerState {
  name: string,
  visible: boolean
}

export interface GState {
  nodes: Immutable.Map<string, nodeState>,
  setNodes: Dispatch<SetStateAction<Immutable.Map<string, nodeState>>>,
  edges: Immutable.Map<Immutable.List<string>, edgeState>,
  edgeAction: (action: string, n1: string, n2: string) => void 
  graph: graphState,
  setGraph: Dispatch<SetStateAction<graphState>>,
}

const initialGraph: graphState = {
  graphId: "root",
  graphName: "Graph",
  scale: 10,
  TopLeftX: 0,
  TopLeftY: 0,
  mouseDown: false,
  heldNode: "nothing",
  selectedNodes: Immutable.Set(),
  selectedArea: {x1: 0, y1: 0, x2: 0, y2: 0},
  selectedPair: Immutable.List<string>(),
  userId: "root",
  saveState: "saved",
  loaded: false,
  ignoreChange: true,
  layers: Immutable.Map<string, layerState>()
}

export function useGraph(): GState {
  const session = useSession();
  const nodesInit = trpc.useQuery(["nodes.getAll", {userID: session.data?.user?.id ?? null}]);
  const graphInit = trpc.useQuery(["graph.getFirst", {userId: session.data?.user?.id ?? null}]);

  const updateNode = trpc.useMutation(["nodes.updateNode"]);
  const deleteNode = trpc.useMutation(["nodes.deleteNode"]);
  
  const updateGraph = trpc.useMutation(["graph.updateOne"]);

  const nodeIdPairs = trpc.useQuery(["nodes.getPairs", {userID: session.data?.user?.id ?? null}]);
  const addPair = trpc.useMutation(["nodes.addPair"])
  const deletePair = trpc.useMutation(["nodes.deletePair"])
  const adj = useRef(new Map<string, Set<string>>())

  const [nodes, setNodes] = useState(Immutable.Map<string, nodeState>())
  const [edges, setEdges] = useState(Immutable.Map<Immutable.List<string>, edgeState>())
  const [graph, setGraph] = useState<graphState>(initialGraph);

  const [saveTimer, setSaveTimer] = useState<number>(10000);
  
  // ============ setup state ============
  useEffect( () => {
    if (nodesInit.data && nodes.size === 0 && graphInit.data && nodeIdPairs.data && session.data?.user?.id) {

      let tempNodes = Immutable.Map<string,nodeState>()
      
      nodesInit.data.forEach(node => {
        tempNodes = tempNodes.set(node.id, {
          x: node.x,
          y: node.y,
          goal: node.goal,
          description: node.description,
          action: "nothing",
          nodeSize: node.size,
          due: node.due,
          priority: node.priority
        });
      });
      setNodes(tempNodes);


      const layers = graph.layers

      graphInit.data.layers.forEach((edge) => {
        layers.set(edge.id, {
          name: edge.name,
          visible: edge.visible
        })
      })
      
      setGraph({
        ...graph,
        graphId: graphInit.data.id,
        graphName: graphInit.data.name,
        TopLeftX: graphInit.data.x,
        TopLeftY: graphInit.data.y,
        userId: session.data?.user?.id,
        scale: graphInit.data.scale,
        loaded: true,
        layers: layers
      });

      let tempEdges = edges

      nodeIdPairs.data.forEach(({node1_id, node2_id}) => {
        // set up adjecency list
        if (adj.current.get(node1_id)) {
          adj.current.get(node1_id)!.add(node2_id)
        } else {
          adj.current.set(node1_id, new Set(node2_id))
        }
        // set up edges
        tempEdges = tempEdges.set(Immutable.List([node1_id, node2_id]), {
          action: "nothing"
        });
      });
      setEdges(tempEdges)
    }

  }, [nodesInit.data, graphInit.data, nodeIdPairs.data, session.data])

  // ============ edge handling ============
  
  const edgeAction = (action: string, n1: string, n2: string) => {

    let tempEdges = edges;
    const p1 = Immutable.List([n1, n2])
    const p2 = Immutable.List([n2, n1])

    if (action === "add") {
      if (dfs(n1, n2) && !adj.current.get(n1)?.has(n2)) {
        if (!tempEdges.has(p1)) {
          tempEdges = tempEdges.set(p1, {
            action: "add"
          });
        } else {
          tempEdges = tempEdges.set(p1, {
            action: "nothing"
          });
        }
        adj.current.get(n1) ? adj.current.get(n1)!.add(n2) : adj.current.set(n1, new Set([n2]))
          
      } else {
        console.log("connection failed, would create a cycle")
      }
    } else if (action === "delete") {
        if (tempEdges.has(p1)) {
          tempEdges = tempEdges.set(p1, {
            action: "delete"
          });
        }

        if (tempEdges.has(p2)) {
          tempEdges = tempEdges.set(p2, {
            action: "delete"
          });
        }
        adj.current.get(n1)?.delete(n2)
        adj.current.get(n2)?.delete(n1)
        
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
    if (!graph.loaded)
      return
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
  }, [graph.scale, graph.TopLeftY, graph.TopLeftX, graph.loaded, nodes, edges]);


  // ============ trigger save if page is unloading ============
  const beforeUnloadListener = (event: Event) => {
    setSaveTimer(100)
  };

  useEffect( () => {
    if (graph.saveState === "not saved") {
      window.addEventListener("beforeunload", beforeUnloadListener);
      return () => window.removeEventListener("beforeunload", beforeUnloadListener);
    } else {
      window.removeEventListener("beforeunload", beforeUnloadListener);
    }

  }, [graph.saveState]);

  // ============ push to database ============
  useEffect(() => {
    if (saveTimer != 100)
      return

    
    // update graph
    updateGraph.mutate({
      graphid: graph.graphId,
      userId: graph.userId,
      scale: graph.scale, 
      pos: {x: graph.TopLeftX, y: graph.TopLeftY}
    })
    
    // update nodes 
    let tempNodes = nodes
    nodes.forEach((node, key) => {
      if (node.action === "add" || node.action === "update") {
        updateNode.mutate({
          userId: graph.userId,
          nodeId: key,
          cords: {x: node.x, y: node.y},
          goal: node.goal,
          description: node.description,
          nodeSize: node.nodeSize,
          due: node.due,
          priority: node.priority
        })
        tempNodes = tempNodes.set(key, {...node, action: "nothing"});
      }
      else if (node.action === "archive") {
        updateNode.mutate({
          nodeId: key,
          userId: graph.userId,
          cords: {x: node.x, y: node.y},
          goal: node.goal,
          description: node.description,
          nodeSize: node.nodeSize,
          due: node.due,
          priority: node.priority,
          archive: true
        });
        tempNodes = tempNodes.delete(key);
      }
      else if (node.action === "delete"){
        deleteNode.mutate({
          nodeId: key
        });
        tempNodes = tempNodes.delete(key);
      }
    });

    setNodes(tempNodes)

    // add and delete edges
    let tempEdges = edges
    edges.forEach((edge, pair) => {
      if (edge.action === "add"){
        addPair.mutate({node1Id: pair.get(0)!, node2Id: pair.get(1)!, userId: graph.userId})
        tempEdges = edges.set(pair, {...edge, action: "nothing"})
      }
      else if (edge.action === "delete") {
        deletePair.mutate({node1Id: pair.get(0)!, node2Id: pair.get(1)!})
        tempEdges = edges.delete(pair)
      }
    });

    setEdges(tempEdges)

    // clear archive and delete lists
    setGraph({
      ...graph,
      saveState: "saved",
      ignoreChange: true
    })
  }, [saveTimer]);

  return {nodes, setNodes, graph, setGraph, edges, edgeAction}

}
