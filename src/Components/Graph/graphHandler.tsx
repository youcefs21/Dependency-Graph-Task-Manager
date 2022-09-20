import React, { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import imt from "immutable";
import { trpc } from "../../utils/trpc";
import {useSession} from "next-auth/react";
import { hitBoxHalfHeight, hitBoxHalfWidth } from "./Canvas";


export type actionType = "nothing" | "add" | "delete" | "update"

export interface nodeState {
  goal: string,
  x: number,
  y: number,
  description: string | null,
  action: actionType,
  animation: (
      null | {
      animation: "complete",
      startTime: number
      }
  ),
  nodeSize: number,
  nodeColor: string | "default",
  due: string | null,
  priority: "critical" | "high" | "normal" | "low" | string,
  layerIds: imt.Set<string>,
  archive: boolean,
  dependencyIds: imt.List<string>,
  dependentIds: imt.List<string>,
  cascadeDue: boolean,
  treeCollapse: boolean,
}

export type AABB = {
  minX: number,
  minY: number,
  maxX: number,
  maxY: number,
  leaf1: AABB | null,
  leaf2: AABB | null,
}

export interface graphState {
  graphId: string, 
  graphName: string,
  scale: number,
  TopLeftX: number,
  TopLeftY: number,
  mouseDown: boolean,
  heldNode: "nothing" | "background" | string,
  selectedNodes: imt.Set<string>,
  edgeActionState: {parents: imt.Set<string>, children: imt.Set<string>, action: "addEdge" | "removeEdge" | "nothing"},
  selectedArea: {x1: number, y1: number, x2: number, y2: number},
  userId: string,
  saveState: "saved" | "not saved" | "saving" | "save error",
  loaded: boolean,
  layers: imt.Map<string, layerState>,
  indexedLayerIds: imt.List<string>,
  showArchive: boolean,
  completeLayerId: string,
  treeFocus: string,
  animation: null | {
    animation: "pan",
    target: {x: number, y: number},
  },
  toolbarMsg: JSX.Element | null,
  AABBTree: AABB | null,
}

export interface edgeState {
  action: "nothing" | "add" | "delete" 
}

export interface layerState {
  name: string,
  visible: boolean,
  action: actionType 
}

type edgeActionType =  (action: "add" | "delete" | "deleteAll", parentId: string, childId: string) => void
export interface GState {
  nodes: imt.Map<string, nodeState>,
  setNodes: Dispatch<SetStateAction<imt.Map<string, nodeState>>>,
  edgeAction: edgeActionType,
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
  selectedNodes: imt.Set(),
  selectedArea: {x1: 0, y1: 0, x2: 0, y2: 0},
  edgeActionState: {parents: imt.Set(), children: imt.Set(), action: "nothing"},
  userId: "root",
  saveState: "saved",
  loaded: false,
  layers: imt.Map<string, layerState>(),
  indexedLayerIds: imt.List<string>(),
  showArchive: false,
  completeLayerId: "",
  treeFocus: "root",
  animation: null,
  toolbarMsg: null,
  AABBTree: null,
}

export const defaultNode: nodeState = {
  x: 0,
  y: 0,
  goal: "insert goal here",
  description: null,
  action: "add",
  animation: null,
  nodeSize: 1,
  nodeColor: "default",
  due: null,
  priority: "normal",
  layerIds: imt.Set(),
  archive: false,
  dependencyIds: imt.List(),
  dependentIds: imt.List(),
  cascadeDue: true,
  treeCollapse: false,
}

export function isIntrececting (A: AABB, B: AABB){
  return A.maxX > B.minX && A.minX < B.maxX && A.maxY > B.minY && A.minY < B.maxY
}

export function removeAABBLeaf (AABBTree: AABB | null, leaf: AABB): AABB | null {
  if (!AABBTree) return null
  if (!AABBTree.leaf1 && !AABBTree.leaf2){
    return null
  }
  else if (AABBTree.leaf1 && isIntrececting(AABBTree.leaf1, leaf)){
    AABBTree = {
      ...AABBTree,
      leaf1: removeAABBLeaf(AABBTree.leaf1, leaf)
    }
  }
  else if (AABBTree.leaf2 && isIntrececting(AABBTree.leaf2, leaf)){
    AABBTree = {
      ...AABBTree,
      leaf2: removeAABBLeaf(AABBTree.leaf2, leaf)
    }
  }
  if (!AABBTree) return null
  if (AABBTree.leaf1 && AABBTree.leaf2){
    AABBTree = {
      ...AABBTree,
      minX: Math.min(AABBTree.leaf1.minX, AABBTree.leaf2.minX),
      minY: Math.min(AABBTree.leaf1.minY, AABBTree.leaf2.minY),
      maxX: Math.max(AABBTree.leaf1.maxX, AABBTree.leaf2.maxX),
      maxY: Math.max(AABBTree.leaf1.maxY, AABBTree.leaf2.maxY),
    }
  } else if (AABBTree.leaf1){
    AABBTree = {
      ...AABBTree,
      minX: AABBTree.leaf1.minX,
      minY: AABBTree.leaf1.minY,
      maxX: AABBTree.leaf1.maxX,
      maxY: AABBTree.leaf1.maxY,
    }
  } else if (AABBTree.leaf2){
    AABBTree = {
      ...AABBTree,
      minX: AABBTree.leaf2.minX,
      minY: AABBTree.leaf2.minY,
      maxX: AABBTree.leaf2.maxX,
      maxY: AABBTree.leaf2.maxY,
    }
  } else {
    return null
  }

  return AABBTree

}


export function isAABBLeafValid(leaf: AABB, AABBTree: AABB | null): boolean {
  if (!AABBTree) return true;
  if (!isIntrececting(AABBTree, leaf)) {
    return true
  } else if (!AABBTree.leaf1 && !AABBTree.leaf2) {
    return false
  }
  else {
    return isAABBLeafValid(leaf, AABBTree.leaf1) && isAABBLeafValid(leaf, AABBTree.leaf2)
  }
}


export function insertAABBLeaf(leaf: AABB, AABBTree: AABB | null): AABB {

  if (!AABBTree) {
    AABBTree = leaf
  } else if (!isIntrececting(AABBTree, leaf)) {
    // dig in to find the right place
    AABBTree = {
      minX: Math.min(AABBTree.minX, leaf.minX),
      minY: Math.min(AABBTree.minY, leaf.minY),
      maxX: Math.max(AABBTree.maxX, leaf.maxX),
      maxY: Math.max(AABBTree.maxY, leaf.maxY),
      leaf1: AABBTree,
      leaf2: leaf,
    }
  } else if (AABBTree.leaf1 && AABBTree.leaf2) { // we know that the leaf is intersecting
    if (isIntrececting(AABBTree.leaf1, leaf)) {
      const newLeaf1 = insertAABBLeaf(leaf, AABBTree.leaf1)
      if (newLeaf1) AABBTree = {
        ...AABBTree,
        minX: Math.min(AABBTree.leaf1.minX, AABBTree.leaf2.minX),
        minY: Math.min(AABBTree.leaf1.minY, AABBTree.leaf2.minY),
        maxX: Math.max(AABBTree.leaf1.maxX, AABBTree.leaf2.maxX),
        maxY: Math.max(AABBTree.leaf1.maxY, AABBTree.leaf2.maxY),
        leaf1: newLeaf1,
      }
    } else if (isIntrececting(AABBTree.leaf2, leaf)) {
      const newLeaf2 = insertAABBLeaf(leaf, AABBTree.leaf2)
      if (newLeaf2) AABBTree = {
        ...AABBTree,
        minX: Math.min(AABBTree.leaf1.minX, AABBTree.leaf2.minX),
        minY: Math.min(AABBTree.leaf1.minY, AABBTree.leaf2.minY),
        maxX: Math.max(AABBTree.leaf1.maxX, AABBTree.leaf2.maxX),
        maxY: Math.max(AABBTree.leaf1.maxY, AABBTree.leaf2.maxY),
        leaf2: newLeaf2,
      }
    } else {
      const distance1 = (leaf.maxX - AABBTree.leaf1.maxX)**2 + (leaf.maxY - AABBTree.leaf1.maxY)**2
      const distance2 = (leaf.maxX - AABBTree.leaf2.maxX)**2 + (leaf.maxY - AABBTree.leaf2.maxY)**2
      if (distance1 < distance2) {
        AABBTree = {
          ...AABBTree, 
          leaf1: {
            maxX: Math.max(leaf.maxX, AABBTree.leaf1.maxX),
            maxY: Math.max(leaf.maxY, AABBTree.leaf1.maxY),
            minX: Math.min(leaf.minX, AABBTree.leaf1.minX),
            minY: Math.min(leaf.minY, AABBTree.leaf1.minY),
            leaf1: leaf,
            leaf2: AABBTree.leaf1
          }
        }
      } else {
        AABBTree = {
          ...AABBTree, 
          leaf2: {
            maxX: Math.max(leaf.maxX, AABBTree.leaf2.maxX),
            maxY: Math.max(leaf.maxY, AABBTree.leaf2.maxY),
            minX: Math.min(leaf.minX, AABBTree.leaf2.minX),
            minY: Math.min(leaf.minY, AABBTree.leaf2.minY),
            leaf1: leaf,
            leaf2: AABBTree.leaf2
          }
        }
      }
    }
  } else {
    console.error("AABBTree is invalid")
  }

  if (AABBTree?.leaf1?.leaf1 && !AABBTree.leaf1?.leaf2) {
    AABBTree = {
      ...AABBTree,
      leaf1: AABBTree.leaf1.leaf1,
    }
  } else if (AABBTree?.leaf1?.leaf2 && !AABBTree.leaf1?.leaf1) {
    AABBTree = {
      ...AABBTree,
      leaf1: AABBTree.leaf1.leaf2,
    }
  }

  if (AABBTree?.leaf2?.leaf1 && !AABBTree.leaf2?.leaf2) {
    AABBTree = {
      ...AABBTree,
      leaf2: AABBTree.leaf2.leaf1,
    }
  }
  else if (AABBTree?.leaf2?.leaf2 && !AABBTree.leaf2?.leaf1) {
    AABBTree = {
      ...AABBTree,
      leaf2: AABBTree.leaf2.leaf2,
    }
  }

  return AABBTree
}

export function useGraph(): GState {
  const session = useSession();

  const [nodes, setNodes] = useState(imt.Map<string, nodeState>())
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

  const graphInit = trpc.useQuery(["graph.getFirst", {userId: session.data?.user?.id ?? null}]);
  const nodesInit = trpc.useQuery(["nodes.getAll", {
    userID: session.data?.user?.id ?? null,
    graphID: graphInit.data?.id ?? null
  }]);

  const updateNode = trpc.useMutation(["nodes.updateNode"], mutationOptions);
  const deleteNode = trpc.useMutation(["nodes.deleteNode"], mutationOptions);
  
  const updateGraph = trpc.useMutation(["graph.updateOne"], mutationOptions);
  const updateLayer = trpc.useMutation(["graph.upsertLayer"], mutationOptions);
  const deleteLayer = trpc.useMutation(["graph.deleteLayer"], mutationOptions);


  
  // ============ setup state ============
  useEffect( () => {
    if (nodesInit.data && !graph.loaded && graphInit.data && session.data?.user?.id) {
      
      let layers = graph.layers
      let indexedLayerIds = graph.indexedLayerIds
      let AABBTree: AABB | null = null

      graphInit.data.layers.forEach((layer) => {
        layers = layers.set(layer.id, {
          name: layer.name,
          visible: layer.visible,
          action: "nothing"
        })
        indexedLayerIds = indexedLayerIds.push(layer.id)
      })

      let tempNodes = imt.Map<string,nodeState>()
      
      const nodeDepedents = new Map<string, imt.List<string>>();
      const nodeIdSet = new Set<string>();
      nodesInit.data.forEach((node) => {
        nodeIdSet.add(node.id);
      });
      nodesInit.data.forEach(node => {
        const dependencyIds = node.nodeDependencies.split(",").filter(id => nodeIdSet.has(id))
        dependencyIds.forEach(dependencyId => {
          if (nodeDepedents.has(dependencyId)) {
            nodeDepedents.set(dependencyId, nodeDepedents.get(dependencyId)!.push(node.id))
          } else {
            nodeDepedents.set(dependencyId, imt.List([node.id]))
          }
        })

        tempNodes = tempNodes.set(node.id, {
          x: node.x,
          y: node.y,
          goal: node.goal,
          description: node.description,
          action: "nothing",
          animation: null,
          nodeSize: node.size,
          nodeColor: "default",
          due: node.due,
          priority: node.priority,
          layerIds: imt.Set(node.nodeLayers.split(",").filter(id => layers.has(id))),
          archive: node.archive,
          dependencyIds: imt.List(dependencyIds),
          dependentIds: imt.List(),
          cascadeDue: node.cascadeDue,
          treeCollapse: false,
        });
      });


      tempNodes.forEach((node, id) => {
        const leaf: AABB = {
          minX: node.x - hitBoxHalfWidth,
          minY: node.y - hitBoxHalfHeight,
          maxX: node.x + hitBoxHalfWidth,
          maxY: node.y + hitBoxHalfHeight,
          leaf1: null,
          leaf2: null,
        }
        AABBTree = insertAABBLeaf(leaf, AABBTree)
      });

      
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
        indexedLayerIds: indexedLayerIds,
        completeLayerId: graphInit.data.completeLayerId ?? indexedLayerIds.get(0),
        showArchive: graphInit.data.showArchive,
        AABBTree: AABBTree,
      });



      nodeDepedents.forEach((dependentIds, nodeId) => {
        const node = tempNodes.get(nodeId)
        if (!node) return
        tempNodes = tempNodes.set(nodeId, {
          ...node,
          dependentIds: dependentIds
        })
      })

      setNodes(tempNodes);
    }

  }, [nodesInit.data, graphInit.data, session.data])

  // ============ edge handling ============
  const edgeAction = (action: "add" | "delete" | "deleteAll", parentId: string, childId: string) => {
    if (parentId === childId) return;

    if (action === "add") {
      if (dfs(parentId, childId)) {
        setNodes(tempNodes => {
          const parent = tempNodes.get(parentId);
          const child = tempNodes.get(childId);
          if (!parent || !child) {
            console.error("parent or child not found when trying to " + action + " edge");
            return tempNodes;
          };

          tempNodes = tempNodes.set(parentId, {
            ...parent,
            dependencyIds: parent.dependencyIds.push(childId),
            action: "update"
          })

          tempNodes = tempNodes.set(childId, {
            ...child,
            dependentIds: child.dependentIds.push(parentId),
            action: "update"
          })

          return tempNodes
        })
        
        // cascade due date
        setNodes(tempNodes => {
          const node1 = tempNodes.get(parentId)
          const node2 = tempNodes.get(childId)
          if (node1 && node2) {
            if (node1.cascadeDue && node1.due && node2.due !== node1.due) {
              tempNodes = tempNodes.set(childId, {
                ...node2,
                due: node1.due,
              })
            }
          }
          return tempNodes
        })
          
      } else {
        setGraph(tempGraph => ({
          ...tempGraph,
          toolbarMsg: <span className="text-red-500">Failed to create connection, cycles are not allowed</span>
        }))
        setTimeout(() => {
          setGraph(tempGraph => ({
            ...tempGraph,
            toolbarMsg: null
          }))
        }, 5000)
      }
    } else if (action === "delete") {
      
      setNodes(tempNodes => {
        // if we're deleteing an edge between two nodes
        const node1 = tempNodes.get(parentId)
        const node2 = tempNodes.get(childId)
        if (node1 && node2) {
          tempNodes = tempNodes.set(parentId, {
            ...node1,
            dependencyIds: node1.dependencyIds.filter(id => id != childId),
            dependentIds: node1.dependentIds.filter(id => id != childId)
          })

          tempNodes = tempNodes.set(childId, {
            ...node2,
            dependencyIds: node2.dependencyIds.filter(id => id != parentId),
            dependentIds: node2.dependentIds.filter(id => id != parentId)
          })
        }
        return tempNodes
      });

      // cascade due date
      const updateDue = (node: nodeState | undefined, tempNodes: imt.Map<string, nodeState>, nodeId: string) => {
        if (node && node.cascadeDue) {
          let newDue: string | null = null;
          node.dependentIds.forEach(id => {
            const depNode = tempNodes.get(id)
            if (!depNode) return
            if (depNode.due && (!newDue || Date.parse(depNode.due) > Date.parse(newDue))) {
              newDue = depNode.due
            }
          });
          tempNodes = tempNodes.set(nodeId, {
            ...node,
            due: newDue
          });
        }
        return tempNodes
      }
      setNodes(tempNodes => {
        const node1 = tempNodes.get(parentId)
        const node2 = tempNodes.get(childId)
        tempNodes = updateDue(node1, tempNodes, parentId)
        tempNodes = updateDue(node2, tempNodes, childId)
        return tempNodes
      });

    } else if (action === "deleteAll") {
      setNodes(tempNodes => {
        const node = tempNodes.get(parentId)
        if (!node) return tempNodes
        // for every dependency of the deleted node, make them not depend on it
        node.dependencyIds.forEach(id => {
          const node = tempNodes.get(id)
          if (!node) return
          tempNodes = tempNodes.set(id, {
            ...node,
            dependentIds: node.dependentIds.filter(idd => idd != parentId)
          })
        });
          
        // for every dependent of the deleted node, make them not a dependecy of it
        node.dependentIds.forEach(id => {
          const node = tempNodes.get(id)
          if (!node) return

          tempNodes = tempNodes.set(id, {
            ...node,
            dependencyIds: node.dependencyIds.filter(idd => idd != parentId)
          });
        });
        return tempNodes
      })
    }
  }
  
  function dfs(target: string, initial: string) {
    const visited = new Set<string>()

    const targetNode = nodes.get(target)
    if (!targetNode || targetNode.dependencyIds.contains(initial)) return false

    function isValidConnection(n: string) {
      if (n === target)
        return false
      visited.add(n)
      const node = nodes.get(n)
      if (!node || node.dependencyIds.size === 0) return true
      var valid = true
      node.dependencyIds.forEach((next) => {
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

  }, [graph.scale, graph.TopLeftY, graph.TopLeftX, graph.loaded, graph.layers, nodes]);


  // ============ trigger save if page is unloading ============
  const beforeUnloadListener = (event: Event) => {
    setSaveTimer(25)
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
    if (saveTimer != 25 || alreadyUpdated.current)
      return
    alreadyUpdated.current = true;
    

    setGraph(graph => ({
      ...graph,
      saveState: "saving"
    }))


    
    // update graph
    updateGraph.mutate({
      graphid: graph.graphId,
      name: graph.graphName,
      userId: graph.userId,
      scale: graph.scale, 
      pos: {x: graph.TopLeftX, y: graph.TopLeftY},
      completeLayerId: graph.completeLayerId,
      showArchive: graph.showArchive,
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
          graphId: graph.graphId,
          nodeDependencies: node.dependencyIds.toArray().join(","),
          nodeLayers: node.layerIds.toArray().join(","),
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
          userId: graph.userId,
          graphId: graph.graphId,
        });
        setNodes(nodes => nodes.delete(key));
      }
    });


  }, [saveTimer]);

  return {nodes, setNodes, graph, setGraph, edgeAction}

}
