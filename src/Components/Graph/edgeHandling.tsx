import { GState, nodeState } from "./graphHandler";
import imt from "immutable";

type edgeActionType =  (G: GState, action: "add" | "delete" | "deleteAll", parentId: string, childId: string) => void

// ============ edge handling ============
export const edgeAction: edgeActionType = (G, action, parentId, childId) => {
  if (parentId === childId) return;
  const {nodes, setNodes, graph, setGraph} = G;

  if (action === "add") {
    if (dfs(nodes, parentId, childId)) {
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
          if (node2.cascadeDue && node1.due && node2.due !== node1.due) {
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

export function dfs(nodes: imt.Map<string, nodeState>, target: string, initial: string) {
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