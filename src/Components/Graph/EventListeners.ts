import cuid from "cuid";
import imt from "immutable";
import React, { Dispatch, MutableRefObject, SetStateAction } from "react";
import {toolStates} from "../Toolbar/Toolbar";
import { isNodeVisible } from "./Canvas";
import { defaultNode, graphState, GState, nodeState } from "./graphHandler";


const heldKeys: Set<string> = new Set();

export function focusNode(G: GState, selectedNode: string, width: number, height: number) {
  const {nodes, setGraph} = G;
  const node = nodes.get(selectedNode);
  if (node) {
    const visibleDependencies = node.dependencyIds.filter((dep) => {
      const depNode = nodes.get(dep);
      return depNode && isNodeVisible(depNode, G);
    });
    setGraph(graph => {
      const deltaX = graph.TopLeftX - node.x;
      const deltaY = graph.TopLeftY - node.y;
      return {
        ...graph,
        animation: {
          animation: "pan",
          target: {
            x: graph.TopLeftX - deltaX - (width / (2 * graph.scale)),
            y: graph.TopLeftY - deltaY - (height / (2 * graph.scale)),
          },
        },
        selectedNodes: imt.Set([selectedNode]),
        treeFocus: !visibleDependencies.isEmpty() ? selectedNode : graph.treeFocus,
      }
    });
  }
}

export function handleDoubleClick(
  event: React.MouseEvent<HTMLCanvasElement>,
  G: GState,
  currentTool: MutableRefObject<toolStates>, setCollapseConfig: Dispatch<SetStateAction<boolean>>
) {
  const {graph, nodes} = G;
  const mx = event.clientX/graph.scale + graph.TopLeftX 
  const my = event.clientY/graph.scale + graph.TopLeftY 

  if (currentTool.current === "pointer"){
    setCollapseConfig(false);

    let selectedNode = graph.heldNode;
    nodes.forEach((node, id) => {
      if (Math.abs(node.x - mx) < node.nodeSize*1.25 && Math.abs(node.y - my) < node.nodeSize*1.25 && isNodeVisible(node, G)) {
        selectedNode = id
      }
    });
    if (selectedNode) {
      const {width, height} = event.currentTarget.getBoundingClientRect();
      focusNode(G, selectedNode, width, height);
    }
  }
}



export function handlePointerDown(
  event: React.PointerEvent<HTMLCanvasElement>,
  evCache: MutableRefObject<React.PointerEvent<HTMLCanvasElement>[]>,
  G: GState,
  currentTool: MutableRefObject<toolStates>, setCurrentTool: Dispatch<SetStateAction<toolStates>>,
  nodeCache: MutableRefObject<imt.Map<string, nodeState>>
) {
  const {graph, setGraph, nodes, setNodes, edgeAction} = G;
  nodeCache.current = nodes;
  const mx = event.clientX/graph.scale + graph.TopLeftX 
  const my = event.clientY/graph.scale + graph.TopLeftY 
  evCache.current.push(event);

  if (currentTool.current === "addNode") {
    currentTool.current = "pointer" // this has to happen straight away to avoid creating two nodes if user double clickes
    setCurrentTool("pointer")
    const newNodeID = cuid();
    setNodes(nodes.set(newNodeID, {
      ...defaultNode,
      x: Math.round(mx),
      y: Math.round(my),
    }));
    const {width, height} = event.currentTarget.getBoundingClientRect();
    focusNode(G, newNodeID, width, height);
    return
  }
  
  // check if the mouse is over a node
  let newHeldNode = graph.heldNode;
  if (currentTool.current != "move"){
    nodes.forEach((node, id) => {
      if (Math.abs(node.x - mx) < node.nodeSize*1.25 && Math.abs(node.y - my) < node.nodeSize*1.25 && isNodeVisible(node, G)) {
        newHeldNode = id
      }
    });
  }

  if (currentTool.current === "deleteNode" || currentTool.current === "completeNode") {
    const t = currentTool.current
    currentTool.current = "pointer" // this has to happen straight away to avoid creating two nodes if user double clickes
    setCurrentTool("pointer")
    const n = nodes.get(newHeldNode)!

    if (t === "completeNode"){ // TODO what happens if you archive a node that is not saved yet
      setNodes(tempNodes => {
        const node = tempNodes.get(newHeldNode)
        if (!node) return tempNodes
        if (node.layerIds.has(graph.completeLayerId)) return tempNodes
        return tempNodes.set(newHeldNode, {
          ...node,
          action: node.action === "add" ? "add" : "update",
          animation: {
            animation: "complete",
            startTime: Date.now(),
          },
          layerIds: node.layerIds.add(graph.completeLayerId)
        });
      })
    }

    if (t === "deleteNode" && n.action != "add") {
      edgeAction("deleteAll", newHeldNode, newHeldNode)
      setNodes(tempNodes => {
        const node = tempNodes.get(newHeldNode)
        if (!node) return tempNodes
        return tempNodes.set(newHeldNode, {
          ...node,
          action: "delete"
        });
      });
    }
    else if (t === "deleteNode" && n.action === "add") {
      edgeAction("deleteAll", newHeldNode, newHeldNode)
      setNodes(tempNodes => tempNodes.delete(newHeldNode));
    }

    setGraph(graph => ({
      ...graph,
      mouseDown: true,
      heldNode: "nothing",
      scale: graph.scale + 0.00001,
    }));
    return
  }

  const EAS = graph.edgeActionState;
  if (EAS.action !== "nothing" && !["nothing", "background"].includes(newHeldNode)) {

    if (EAS.children.isEmpty() && !EAS.parents.has(newHeldNode)) {
      setGraph(graph => ({
        ...graph,
        edgeActionState: {
          ...graph.edgeActionState,
          children: graph.edgeActionState.children.add(newHeldNode)
        },
      }))
    } else if (EAS.parents.isEmpty() && !EAS.children.has(newHeldNode)) {
      setGraph(graph => ({
        ...graph,
        edgeActionState: {
          ...graph.edgeActionState,
          parents: graph.edgeActionState.parents.add(newHeldNode)
        },
      }))
    }
  }

  // if clicked and nothing is held, hold the background
  if (newHeldNode === "nothing") {
    newHeldNode = "background";
  }
  
  let newSelectedNodes = newHeldNode != "background" ? imt.Set([newHeldNode]) : imt.Set<string>();
  if (graph.selectedNodes.has(newHeldNode)) {
    newSelectedNodes = graph.selectedNodes
  }

  setGraph(graph => ({
    ...graph,
    mouseDown: true,
    heldNode: newHeldNode,
    selectedNodes: newSelectedNodes,
    selectedArea: {x1: mx, y1: my, x2: mx, y2: my}
  }))

}


export function handlePointerUp(
  event: React.PointerEvent<HTMLCanvasElement>,
  evCache: MutableRefObject<React.PointerEvent<HTMLCanvasElement>[]>,
  pinchDiff: MutableRefObject<number>,
  G: GState,
  nodesCache: MutableRefObject<imt.Map<string, nodeState>>
) {
  const {graph, setGraph, nodes, setNodes} = G;
  // setNodes(nodesCache.current); // undo any changes to nodes

  for (let i = 0; i < evCache.current.length; i++) {
    if (evCache.current[i]!.pointerId === event.pointerId) {
      evCache.current.splice(i,1);
      break;
    }
  }

  const EAS = graph.edgeActionState;
  if (EAS.action !== "nothing") {

    graph.selectedNodes.forEach((nodeId) => {
      if (EAS.parents.isEmpty() && !EAS.children.has(nodeId)) {
        setGraph(graph => ({
          ...graph,
          edgeActionState: {
            ...graph.edgeActionState,
            parents: graph.edgeActionState.parents.add(nodeId)
          },
        }))
      } else if (EAS.children.isEmpty() && !EAS.parents.has(nodeId)) {
        setGraph(graph => ({
          ...graph,
          edgeActionState: {
            ...graph.edgeActionState,
            children: graph.edgeActionState.children.add(nodeId)
          },
        }))
      }
    })

  }

  if (evCache.current.length < 2) {
    pinchDiff.current = -1;
  }

  setGraph(graph => ({
    ...graph,
    heldNode: "nothing",
    mouseDown: false,
    selectedArea: {x1: 0, y1: 0, x2: 0, y2: 0}
  }))
}


export function handleMove(
  event: React.PointerEvent<HTMLCanvasElement>,
  evCache: MutableRefObject<React.PointerEvent<HTMLCanvasElement>[]>,
  pinchDiff: MutableRefObject<number>,
  G: GState,
  currentTool: MutableRefObject<toolStates> 
) {
  const {graph, setGraph, nodes, setNodes} = G;


  if (nodes.size === 0)
    return;

  let prevX = -1;
  let prevY = -1;

  // handle pinch events:
  // https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events/Pinch_zoom_gestures
  for (let i = 0; i < evCache.current.length; i++) {
    if (event.pointerId === evCache.current[i]!.pointerId) {
      prevX = evCache.current[i]!.clientX;
      prevY = evCache.current[i]!.clientY;
      evCache.current[i] = event;
      break;
    }
  }

  if (evCache.current.length === 2) {
    const curDiff = Math.hypot(evCache.current[0]!.clientX - evCache.current[1]!.clientX, evCache.current[0]!.clientY - evCache.current[1]!.clientY);
      
    if (pinchDiff.current > 0) {
      const delta = pinchDiff.current - curDiff

      const newScale = graph.scale - (graph.scale*delta)/200

      setGraph(graph => ({
        ...graph,
        scale: newScale,
        TopLeftX: graph.TopLeftX + (event.clientX/graph.scale) - (event.clientX/newScale),
        TopLeftY: graph.TopLeftY + (event.clientY/graph.scale) - (event.clientY/newScale)
      }));

    }
    pinchDiff.current = curDiff 

  } else if (graph.mouseDown) {
    switch (graph.heldNode) {
      case "background": // move everything if background is held
        const movementX = prevX === -1 ? 0 : prevX - event.clientX
        const movementY = prevY === -1 ? 0 : prevY - event.clientY
        
        if (currentTool.current === "pointer") {
          // look for nodes in the new area, and add them
          let tempSelectedNodes = graph.selectedNodes
          const xDir = Math.sign(graph.selectedArea.x2 - graph.selectedArea.x1)
          const yDir = Math.sign(graph.selectedArea.y2 - graph.selectedArea.y1)
          const newX2 = event.clientX/graph.scale + graph.TopLeftX 
          const newY2 = event.clientY/graph.scale + graph.TopLeftY


          nodes.forEach((node, nodeID) => {
            if (!isNodeVisible(node, G)) return
            const xCond1 = xDir === 1 && node.x >= graph.selectedArea.x1 && node.x <= newX2
            const yCond1 = yDir === 1 && node.y >= graph.selectedArea.y1 && node.y <= newY2
            const xCond2 = xDir === -1 && node.x <= graph.selectedArea.x1 && node.x >= newX2
            const yCond2 = yDir === -1 && node.y <= graph.selectedArea.y1 && node.y >= newY2
            if ((xCond1 || xCond2) && (yCond1 || yCond2) && !tempSelectedNodes.has(nodeID)) {
              tempSelectedNodes = tempSelectedNodes.add(nodeID)
            } else if (!(xCond1 || xCond2) || !(yCond1 || yCond2)) {
              tempSelectedNodes = tempSelectedNodes.delete(nodeID)
            }
          });

          setGraph(graph => ({
            ...graph,
            selectedArea: {
              ...graph.selectedArea, 
              x2: newX2,
              y2: newY2 
            },
            selectedNodes: tempSelectedNodes
          }));
          break;
        }

        // if the current tool is not the pointer tool
        setGraph(graph => ({
          ...graph,
          TopLeftX: graph.TopLeftX + movementX/graph.scale,
          TopLeftY: graph.TopLeftY + movementY/graph.scale,
        }));
      
        break;
      case "nothing": // if nothing is held, do nothing
        break
      default: // if a node is held, move it to the mouse position
        // instead of just moving the held node, move all selectedNodes
        setNodes(nodes => {
          let tempNodes = nodes;
          const heldNodeState = nodes.get(graph.heldNode)!
          nodes.forEach((node, nodeID) => {
            if (graph.selectedNodes.has(nodeID)) {
              const xDiff = node.x - heldNodeState.x 
              const yDiff = node.y - heldNodeState.y
              tempNodes = tempNodes.set(nodeID, {
                ...node, 
                x: Math.round(event.clientX/graph.scale + graph.TopLeftX + xDiff),
                y: Math.round(event.clientY/graph.scale + graph.TopLeftY + yDiff),
                action: node.action === "add" ? "add" : "update",
              })
            }
          });
          return tempNodes;
        });
    }
  } 
}


export function handleWheel(event: React.WheelEvent<HTMLCanvasElement>, graph: graphState, setGraph: Dispatch<SetStateAction<graphState>>) {

  if (event.ctrlKey) {
    const newScale = graph.scale - (graph.scale*event.deltaY)/1000

    setGraph(graph => ({
      ...graph,
      scale: newScale,
      TopLeftX: graph.TopLeftX + (event.clientX/graph.scale) - (event.clientX/newScale),
      TopLeftY: graph.TopLeftY + (event.clientY/graph.scale) - (event.clientY/newScale)
    }));

  } else if (event.shiftKey) {
    setGraph(graph => ({
      ...graph,
      TopLeftX: graph.TopLeftX + (event.deltaY/graph.scale),
      TopLeftY: graph.TopLeftY + (event.deltaX/graph.scale),
    }));
  } else {
    setGraph(graph => ({
      ...graph,
      TopLeftY: graph.TopLeftY + (event.deltaY/graph.scale),
      TopLeftX: graph.TopLeftX + (event.deltaX/graph.scale),
    }));
  }

}

export function handleKeyDown(
  event: React.KeyboardEvent<HTMLCanvasElement>,
  G: GState,
  currentTool: MutableRefObject<toolStates>, setCurrentTool: Dispatch<SetStateAction<toolStates>>
) {
  const { nodes, edgeAction, graph, setGraph, setNodes } = G;

  if (!heldKeys.has(event.key)) {
    heldKeys.add(event.key)
  }

  if (event.key === "Delete") {

    setNodes(tempNodes => {
      graph.selectedNodes.forEach((nodeID) => {
        edgeAction("deleteAll", nodeID, nodeID)
        const node = tempNodes.get(nodeID)
        if (!node) return
        if (node.action != "add"){
          tempNodes = tempNodes.set(nodeID, {
            ...node,
            action: "delete"
          });
        } else {
          tempNodes = tempNodes.delete(nodeID);
        }
      });
      return tempNodes;
    })

    setGraph(graph => ({
      ...graph,
      selectedNodes: imt.Set<string>(),
      scale: graph.scale + 0.00001
    }));

  } else if (event.key === " ") {
    setCurrentTool("move")
    currentTool.current = "move"
  } else if (event.key.match(/^[1-9]$/)) {
    const index = parseInt(event.key) - 1
    if (index < graph.indexedLayerIds.size) {
      setGraph(graph => {
        const layerId = graph.indexedLayerIds.get(index)
        if (!layerId) return graph
        const layer = graph.layers.get(layerId)
        if (!layer) return graph
        return {
          ...graph,
          layers: graph.layers.set(layerId, {
            ...layer,
            visible: !layer.visible,
            action: layer.action === "add" ? "add" : "update"
          })
        }
      });
    }
  }

}

export function movementShortcuts(G: GState) {
  const { setGraph } = G;
  if (heldKeys.has("ArrowLeft")) {
    setGraph(graph => ({
      ...graph,
      TopLeftX: graph.TopLeftX - 10/graph.scale,
    }));
  } if (heldKeys.has("ArrowRight")) {
    setGraph(graph => ({
      ...graph,
      TopLeftX: graph.TopLeftX + 10/graph.scale,
    }));
  } if (heldKeys.has("ArrowUp")) {
    setGraph(graph => ({
      ...graph,
      TopLeftY: graph.TopLeftY - 10/graph.scale,
    }));
  } if (heldKeys.has("ArrowDown")) {
    setGraph(graph => ({
      ...graph,
      TopLeftY: graph.TopLeftY + 10/graph.scale,
    }));
  }
}

export function handleKeyUp(
  event: React.KeyboardEvent<HTMLCanvasElement>,
  currentTool: MutableRefObject<toolStates>, setCurrentTool: Dispatch<SetStateAction<toolStates>>
) {
  heldKeys.delete(event.key)
  if (event.key === " ") {
    setCurrentTool("pointer")
    currentTool.current = "pointer"
  }
}










