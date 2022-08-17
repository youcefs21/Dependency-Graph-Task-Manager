import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import Immutable from "immutable";
import { trpc } from "../../utils/trpc";
import {useSession} from "next-auth/react";


export interface nodeState {
  goal: string,
  x: number,
  y: number,
  description: string | null,
  action: "nothing" | "add" | "delete" | "archive" | "update"
}

export interface graphState {
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
  ignoreChange: boolean
}

export interface edgeState {
  node1_id: string,
  node2_id: string,
  action: "nothing" | "add" | "delete" 
}

export interface GState {
  nodes: Immutable.Map<string, nodeState>,
  setNodes: Dispatch<SetStateAction<Immutable.Map<string, nodeState>>>,
  edges: Immutable.List<edgeState>,
  edgeAction: (action: string, n1: string, n2: string) => void 
  graph: graphState,
  setGraph: Dispatch<SetStateAction<graphState>>,
}

const initialGraph: graphState = {
  scale: 0,
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
  ignoreChange: true
}

export function useGraph(): GState {
  const session = useSession();
  const nodesInit = trpc.useQuery(["nodes.getAll", {userID: session.data?.user?.id ?? null}]);
  const graphInit = trpc.useQuery(["settings.getAll"]);

  const updateNode = trpc.useMutation(["nodes.updateNode"]);
  const deleteNode = trpc.useMutation(["nodes.deleteNode"]);
  
  const updateGraph = trpc.useMutation(["settings.updateAll"]);

  const nodeIdPairs = trpc.useQuery(["nodes.getPairs", {userID: session.data?.user?.id ?? null}]);
  const addPair = trpc.useMutation(["nodes.addPair"])
  const deletePair = trpc.useMutation(["nodes.deletePair"])
  const adj = useRef(new Map<string, Set<string>>())

  const [nodes, setNodes] = useState(Immutable.Map<string, nodeState>())
  const [edges, setEdges] = useState(Immutable.List<edgeState>())
  const [graph, setGraph] = useState<graphState>(initialGraph);

  const [saveTimer, setSaveTimer] = useState<number>(10000);
  
  // ============ setup state ============
  useEffect( () => {
    if (nodesInit.data && nodes.size === 0 && graphInit.data && nodeIdPairs.data) {

      let tempNodes = Immutable.Map<string,nodeState>()
      
      nodesInit.data.forEach(node => {
        tempNodes = tempNodes.set(node.id, {
          x: node.x,
          y: node.y,
          goal: node.goal,
          description: node.description,
          action: "nothing"
        });
      });
      setNodes(tempNodes);

      setGraph({
        ...graph,
        TopLeftX: graphInit.data.x,
        TopLeftY: graphInit.data.y,
        scale: graphInit.data.scale,
        loaded: true
      });

      let tempEdges = Immutable.List<edgeState>()

      nodeIdPairs.data.forEach(({node1_id, node2_id}) => {
        // set up adjecency list
        if (adj.current.get(node1_id)) {
          adj.current.get(node1_id)!.add(node2_id)
        } else {
          adj.current.set(node1_id, new Set(node2_id))
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
      if (dfs(n1, n2) && !adj.current.get(n1)?.has(n2)) {
        tempEdges = tempEdges.push({
          node1_id: n1, 
          node2_id: n2, 
          action: "add"
        });
        adj.current.get(n1) ? adj.current.get(n1)!.add(n2) : adj.current.set(n1, new Set(n2))
          
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
              adj.current.get(n1)?.delete(n2)
              adj.current.get(n2)?.delete(n1)
          }
        }
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

    const userID = session.data?.user?.id
    if (!userID){
      setSaveTimer(0)
      return
    }
    
    // update graph
    updateGraph.mutate({
      userId: userID,
      scale: graph.scale, 
      pos: {x: graph.TopLeftX, y: graph.TopLeftY}
    })
    
    // update nodes 
    let tempNodes = nodes
    nodes.forEach((node, key) => {
      if (node.action === "add" || node.action === "update") {
        updateNode.mutate({
          nodeId: key,
          cords: {x: node.x, y: node.y},
          goal: node.goal,
          description: node.description
        })
        tempNodes = tempNodes.set(key, {...node, action: "nothing"});
      }
      else if (node.action === "archive") {
        updateNode.mutate({
          nodeId: key,
          cords: {x: node.x, y: node.y},
          goal: node.goal,
          description: node.description,
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
    edges.forEach((edge, i) => {
      if (edge.action === "add"){
        addPair.mutate({node1Id: edge.node1_id, node2Id: edge.node2_id, userId: session.data?.user?.id ?? null})
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
      saveState: "saved",
      ignoreChange: true
    })
  }, [saveTimer]);

  return {nodes, setNodes, graph, setGraph, edges, edgeAction}

}
