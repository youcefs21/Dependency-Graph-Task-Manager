import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import Immutable from "immutable";
import { trpc } from "../../utils/trpc";
import {useSession} from "next-auth/react";


export type actionType = "nothing" | "add" | "delete" | "update"

export interface nodeState {
  goal: string,
  x: number,
  y: number,
  description: string | null,
  action: actionType,
  nodeSize: number,
  due: string | null,
  priority: "critical" | "high" | "normal" | "low" | string,
  layerIds: Immutable.Map<string, actionType>,
  archive: boolean,
  dependencyIds: Immutable.List<string>,
  dependentIds: Immutable.List<string>,
  cascadeDue: boolean,
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
  saveState: "saved" | "not saved" | "saving" | "save error",
  loaded: boolean,
  layers: Immutable.Map<string, layerState>,
  showArchive: boolean,
  completeLayerId: string,
}

export interface edgeState {
  action: "nothing" | "add" | "delete" 
}

export interface layerState {
  name: string,
  visible: boolean,
  action: actionType 
}

export interface GState {
  nodes: Immutable.Map<string, nodeState>,
  setNodes: Dispatch<SetStateAction<Immutable.Map<string, nodeState>>>,
  edges: Immutable.Map<Immutable.List<string>, edgeState>,
  edgeAction: (action: string, n1: string, n2: string) => void,
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
  layers: Immutable.Map<string, layerState>(),
  showArchive: false,
  completeLayerId: ""
}

export function useGraph(): GState {
  const session = useSession();

  const [nodes, setNodes] = useState(Immutable.Map<string, nodeState>())
  const [edges, setEdges] = useState(Immutable.Map<Immutable.List<string>, edgeState>())
  const [graph, setGraph] = useState<graphState>(initialGraph);
  const alreadyUpdated = useRef<boolean>(true);

  const [saveTimer, setSaveTimer] = useState<number>(10000);

  const mutationOptions = {
    onSuccess: () => {
      setGraph(graph => ({...graph, saveState: "saved"}));
    },
    onError: () => {
      setGraph(graph => ({...graph, saveState: "save error"}));
    },
  }

  const nodesInit = trpc.useQuery(["nodes.getAll", {userID: session.data?.user?.id ?? null}]);
  const graphInit = trpc.useQuery(["graph.getFirst", {userId: session.data?.user?.id ?? null}]);

  const updateNode = trpc.useMutation(["nodes.updateNode"], mutationOptions);
  const deleteNode = trpc.useMutation(["nodes.deleteNode"], mutationOptions);
  
  const updateGraph = trpc.useMutation(["graph.updateOne"], mutationOptions);
  const updateLayer = trpc.useMutation(["graph.upsertLayer"], mutationOptions);
  const deleteLayer = trpc.useMutation(["graph.deleteLayer"], mutationOptions);

  const deleteNodeLayer = trpc.useMutation(["nodes.deleteNodeLayer"], mutationOptions);
  const addNodeLayer = trpc.useMutation(["nodes.addNodeLayer"], mutationOptions);

  const nodeIdPairs = trpc.useQuery(["nodes.getPairs", {userID: session.data?.user?.id ?? null}]);
  const addPair = trpc.useMutation(["nodes.addPair"], mutationOptions)
  const deletePair = trpc.useMutation(["nodes.deletePair"], mutationOptions)
  const adj = useRef(new Map<string, Set<string>>())

  
  // ============ setup state ============
  useEffect( () => {
    if (nodesInit.data && nodes.size === 0 && graphInit.data && nodeIdPairs.data && session.data?.user?.id) {

      let tempNodes = Immutable.Map<string,nodeState>()
      
      nodesInit.data.forEach(node => {
        let layerIds = Immutable.Map<string, actionType>()
        node.nodeLayers.forEach(layer => {
          layerIds = layerIds.set(layer.layerId, "nothing")
        });
        tempNodes = tempNodes.set(node.id, {
          x: node.x,
          y: node.y,
          goal: node.goal,
          description: node.description,
          action: "nothing",
          nodeSize: node.size,
          due: node.due,
          priority: node.priority,
          layerIds: layerIds,
          archive: node.archive,
          dependencyIds: Immutable.List(),
          dependentIds: Immutable.List(),
          cascadeDue: node.cascadeDue
        });
      });


      let layers = graph.layers

      graphInit.data.layers.forEach((edge) => {
        layers = layers.set(edge.id, {
          name: edge.name,
          visible: edge.visible,
          action: "nothing"
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
        layers: layers,
        completeLayerId: graphInit.data.completeLayerId ?? layers.keySeq().first()
      });

      let tempEdges = edges

      nodeIdPairs.data.forEach(({node1_id, node2_id}) => {
        // set up adjecency list
        if (tempNodes.has(node1_id) && tempNodes.has(node2_id)) {
          tempNodes = tempNodes.set(node1_id, {
            ...tempNodes.get(node1_id)!,
            dependencyIds: tempNodes.get(node1_id)!.dependencyIds.push(node2_id)
          })
          tempNodes = tempNodes.set(node2_id, {
            ...tempNodes.get(node2_id)!,
            dependentIds: tempNodes.get(node2_id)!.dependentIds.push(node1_id)
          })
        }
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
      setEdges(tempEdges);
      setNodes(tempNodes);
    }

  }, [nodesInit.data, graphInit.data, nodeIdPairs.data, session.data])

  // ============ edge handling ============
  
  const edgeAction = (action: string, n1: string, n2: string) => {

    const p1 = Immutable.List([n1, n2])
    const p2 = Immutable.List([n2, n1])

    if (action === "add") {
      if (dfs(n1, n2) && !adj.current.get(n1)?.has(n2)) {

        setNodes(tempNodes => {
          if (tempNodes.has(n1) && tempNodes.has(n2)) {
            tempNodes = tempNodes.set(n1, {
              ...tempNodes.get(n1)!,
              dependencyIds: tempNodes.get(n1)!.dependencyIds.push(n2)
            })

            tempNodes = tempNodes.set(n2, {
              ...tempNodes.get(n2)!,
              dependentIds: tempNodes.get(n2)!.dependentIds.push(n1)
            })
          }
          return tempNodes
        })
        

        setEdges(tempEdges => {
          if (!tempEdges.has(p1)) {
            tempEdges = tempEdges.set(p1, {
              action: "add"
            });
          } else {
            tempEdges = tempEdges.set(p1, {
              action: "nothing"
            });
          }
          return tempEdges;
        })

        adj.current.get(n1) ? adj.current.get(n1)!.add(n2) : adj.current.set(n1, new Set([n2]))
          
      } else {
        console.log("connection failed, would create a cycle")
      }
    } else if (action === "delete") {
      
      setNodes(tempNodes => {
        // if we're deleteing an edge between two nodes
        if (tempNodes.has(n1) && tempNodes.has(n2)) {
          tempNodes = tempNodes.set(n1, {
            ...tempNodes.get(n1)!,
            dependencyIds: tempNodes.get(n1)!.dependencyIds.filter(id => id != n2),
            dependentIds: tempNodes.get(n1)!.dependentIds.filter(id => id != n2)
          })

          tempNodes = tempNodes.set(n2, {
            ...tempNodes.get(n2)!,
            dependencyIds: tempNodes.get(n2)!.dependencyIds.filter(id => id != n1),
            dependentIds: tempNodes.get(n2)!.dependentIds.filter(id => id != n1)
          })
        }
        // if we're delete all edges connected to n1 (probably because n1 is being deleted)
        else if (tempNodes.has(n1) && n2 === "all") {
          const node = tempNodes.get(n1)!
          // for every dependency of the deleted node, make them not depend on it
          setEdges(tempEdges => {
            node.dependencyIds.forEach(id => {
              tempEdges = tempEdges.delete(Immutable.List([id, n1]))
              tempEdges = tempEdges.delete(Immutable.List([n1, id]))

              tempNodes = tempNodes.set(id, {
                ...tempNodes.get(id)!,
                dependentIds: tempNodes.get(id)!.dependentIds.filter(idd => idd != n1)
              })
            });
            
            // for every dependent of the deleted node, make them not a dependecy of it
            node.dependentIds.forEach(id => {
              tempEdges = tempEdges.delete(Immutable.List([n1, id]))

              tempNodes = tempNodes.set(id, {
                ...tempNodes.get(id)!,
                dependencyIds: tempNodes.get(id)!.dependencyIds.filter(idd => idd != n1)
              });

            });
            return tempEdges;
          });
          adj.current.delete(n1)
        }

        return tempNodes

      });

      setEdges(tempEdges => {
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
        return tempEdges;
      });
      adj.current.get(n1)?.delete(n2)
      adj.current.get(n2)?.delete(n1)
        
    }

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
      setSaveTimer(saveTimer => saveTimer + 1);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // ============ reset timer on change ============
  useEffect(() => {
    if (!graph.loaded)
      return
    if (!alreadyUpdated.current){
      setSaveTimer(0)
      setGraph(graph => ({
        ...graph,
        saveState: "not saved",
      }));
      return;
    }

    alreadyUpdated.current = false;

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
    if (saveTimer != 100 || alreadyUpdated.current)
      return
    alreadyUpdated.current = true;
    

    setGraph(graph => ({
      ...graph,
      saveState: "saving",
    }))

    
    // update graph
    updateGraph.mutate({
      graphid: graph.graphId,
      name: graph.graphName,
      userId: graph.userId,
      scale: graph.scale, 
      pos: {x: graph.TopLeftX, y: graph.TopLeftY},
      completeLayerId: graph.completeLayerId
    });

    // update layers
    graph.layers.forEach((layer, id) => {
      if (layer.action === "update" || layer.action === "add") {
        updateLayer.mutate({
          graphId: graph.graphId,
          layerId: id,
          name: layer.name,
          visible: layer.visible,
          userId: graph.userId,
        });
        setGraph(graph => ({
          ...graph,
          layers: graph.layers.set(id, {
            ...layer,
            action: "nothing",
          }),
        }));
      } else if (layer.action === "delete") {
        deleteLayer.mutate({
          layerId: id,
          userId: graph.userId,
        });
        setGraph(graph => ({
          ...graph,
          layers: graph.layers.delete(id),
        }));
      }
    });
    
    // update nodes
    nodes.forEach((node, key) => {

      // update nodeLayer
      node.layerIds.forEach((action, layerId) => {
        if (action === "add") {
          addNodeLayer.mutate({
            nodeId: key,
            layerId: layerId,
            userId: graph.userId,
          });
          
          setNodes(nodes => {
            const node = nodes.get(key)
            if (!node) return nodes
            return nodes.set(key, {
              ...node,
              layerIds: node.layerIds.set(layerId, "nothing")
            });
          })

        } else if (action === "delete") {
          deleteNodeLayer.mutate({
            nodeId: key,
            layerId: layerId,
            userId: graph.userId,
          });
          
          setNodes(nodes => {
            const node = nodes.get(key)
            if (!node) return nodes
            return nodes.set(key, {
              ...node,
              layerIds: node.layerIds.delete(layerId)
            });
          })

        }
      });

      // update node
      if (node.action === "add" || node.action === "update") {
        updateNode.mutate({
          userId: graph.userId,
          nodeId: key,
          cords: {x: node.x, y: node.y},
          goal: node.goal,
          description: node.description,
          nodeSize: node.nodeSize,
          due: node.due,
          priority: node.priority,
          archive: node.archive,
          cascadeDue: node.cascadeDue,
        })
        setNodes(nodes => {
            const node = nodes.get(key)
            if (!node) return nodes
            return nodes.set(key, {
            ...node, 
            action: "nothing"
          })
        });
      }
      else if (node.action === "delete"){
        deleteNode.mutate({
          nodeId: key,
          userId: graph.userId
        });
        setNodes(nodes => nodes.delete(key));
      }
    });

    // add and delete edges
    edges.forEach((edge, pair) => {
      if (edge.action === "add"){
        addPair.mutate({node1Id: pair.get(0)!, node2Id: pair.get(1)!, userId: graph.userId})
        setEdges(edges => edges.set(pair, {...edge, action: "nothing"}));
      }
      else if (edge.action === "delete") {
        deletePair.mutate({node1Id: pair.get(0)!, node2Id: pair.get(1)!,userId: graph.userId})
        setEdges(edges => edges.delete(pair));
      }
    });

  }, [saveTimer]);

  return {nodes, setNodes, graph, setGraph, edges, edgeAction}

}
