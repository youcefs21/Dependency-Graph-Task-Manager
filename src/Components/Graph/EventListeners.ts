import Immutable from "immutable";
import React, { Dispatch, MutableRefObject, SetStateAction } from "react";
import {toolStates} from "../Toolbar/Toolbar";
import { isNodeVisible } from "./Canvas";
import { graphState, GState, nodeState } from "./graphHandler";

export function handlePointerDown(
  event: React.PointerEvent<HTMLCanvasElement>,
  evCache: MutableRefObject<React.PointerEvent<HTMLCanvasElement>[]>,
  G: GState,
  currentTool: MutableRefObject<toolStates>, setCurrentTool: Dispatch<SetStateAction<toolStates>>
) {
  const {graph, setGraph, nodes, setNodes} = G;
  const mx = event.clientX/graph.scale + graph.TopLeftX 
  const my = event.clientY/graph.scale + graph.TopLeftY 
  evCache.current.push(event);

  if (currentTool.current === "addNode") {
    currentTool.current = "pointer" // this has to happen straight away to avoid creating two nodes if user double clickes
    setCurrentTool("pointer")
    const unixTime = Date.now() 
    const newNodeID = graph.userId + unixTime.toString(36)
    setNodes(nodes.set(newNodeID, {
      x: Math.round(mx),
      y: Math.round(my),
      goal: "insert goal here",
      description: null,
      action: "add",
      nodeSize: 1,
      due: null,
      priority: "normal",
      layerIds: Immutable.Map(),
      archive: false
    }));
    // TODO set the new node as the focus
    return
  }
  
  // check if the mouse is over a node
  let newHeldNode = graph.heldNode;
  if (currentTool.current != "move"){
    nodes.forEach((node, id) => {
      if (Math.abs(node.x - mx) < 1 && Math.abs(node.y - my) < 1 && isNodeVisible(node, G)) {
        newHeldNode = id
      }
    });
  }

  if (currentTool.current === "deleteNode" || currentTool.current === "completeNode") {
    const t = currentTool.current
    currentTool.current = "pointer" // this has to happen straight away to avoid creating two nodes if user double clickes
    setCurrentTool("pointer")
    let tempNodes = nodes
    const n = nodes.get(newHeldNode)!

    if (t === "completeNode") // TODO what happens if you archive a node that is not saved yet
      tempNodes = tempNodes.set(newHeldNode, {
        ...n,
        action: "update",
        archive: true
      });
    if (t === "deleteNode" && n.action != "add")
      tempNodes = tempNodes.set(newHeldNode, {
        ...n,
        action: "delete"
      });
    if (t === "deleteNode" && n.action === "add")
      tempNodes = tempNodes.delete(newHeldNode)

    setNodes(tempNodes)
    setGraph({
      ...graph,
      mouseDown: true,
      heldNode: "nothing",
      scale: graph.scale + 0.00001,
    })
    return
  }

  let newSelectedPair = Immutable.List<string>()
  if (["addEdge", "removeEdge"].includes(currentTool.current) && !["nothing", "background"].includes(newHeldNode) && graph.selectedPair.size < 2 && !graph.selectedPair.includes(newHeldNode)) 
    newSelectedPair = graph.selectedPair.push(newHeldNode)

  // if clicked and nothing is held, hold the background
  if (newHeldNode === "nothing") {
    newHeldNode = "background";
  }
  
  let newSelectedNodes = newHeldNode != "background" ? Immutable.Set([newHeldNode]) : Immutable.Set<string>();
  if (graph.selectedNodes.has(newHeldNode)) {
    newSelectedNodes = graph.selectedNodes
  }

  setGraph({
    ...graph,
    mouseDown: true,
    heldNode: newHeldNode,
    selectedNodes: newSelectedNodes,
    selectedPair: newSelectedPair,
    selectedArea: {x1: mx, y1: my, x2: mx, y2: my}
  })

}


export function handlePointerUp(
  event: React.PointerEvent<HTMLCanvasElement>,
  evCache: MutableRefObject<React.PointerEvent<HTMLCanvasElement>[]>,
  pinchDiff: MutableRefObject<number>,
  graph: graphState,
  setGraph: Dispatch<SetStateAction<graphState>>,
) {

  for (let i = 0; i < evCache.current.length; i++) {
    if (evCache.current[i]!.pointerId === event.pointerId) {
      evCache.current.splice(i,1);
      break;
    }
  }

  if (evCache.current.length < 2) {
    pinchDiff.current = -1;
  }

  setGraph({
    ...graph,
    heldNode: "nothing",
    mouseDown: false,
    selectedArea: {x1: 0, y1: 0, x2: 0, y2: 0}
  })
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

      setGraph({
        ...graph,
        scale: newScale,
        TopLeftX: graph.TopLeftX + (event.clientX/graph.scale) - (event.clientX/newScale),
        TopLeftY: graph.TopLeftY + (event.clientY/graph.scale) - (event.clientY/newScale)
      });

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

          setGraph({
            ...graph,
            selectedArea: {
              ...graph.selectedArea, 
              x2: newX2,
              y2: newY2 
            },
            selectedNodes: tempSelectedNodes
          });
          break;
        }

        // if the current tool is not the pointer tool
        setGraph({
          ...graph,
          TopLeftX: graph.TopLeftX + movementX/graph.scale,
          TopLeftY: graph.TopLeftY + movementY/graph.scale,
        });
      
        break;
      case "nothing": // if nothing is held, do nothing
        break
      default: // if a node is held, move it to the mouse position
        // instead of just moving the held node, move all selectedNodes
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
              action: "update"
            })
          }
        });
        setNodes(tempNodes)
    }
  } 
}


export function handleWheel(event: React.WheelEvent<HTMLCanvasElement>, graph: graphState, setGraph: Dispatch<SetStateAction<graphState>>) {

  if (event.ctrlKey) {
    const newScale = graph.scale - (graph.scale*event.deltaY)/1000

    setGraph({
      ...graph,
      scale: newScale,
      TopLeftX: graph.TopLeftX + (event.clientX/graph.scale) - (event.clientX/newScale),
      TopLeftY: graph.TopLeftY + (event.clientY/graph.scale) - (event.clientY/newScale)
    })

  } else if (event.shiftKey) {
    setGraph({
      ...graph,
      TopLeftX: graph.TopLeftX + (event.deltaY/graph.scale),
      TopLeftY: graph.TopLeftY + (event.deltaX/graph.scale),
    })
  } else {
    setGraph({
      ...graph,
      TopLeftY: graph.TopLeftY + (event.deltaY/graph.scale),
      TopLeftX: graph.TopLeftX + (event.deltaX/graph.scale),
    })
  }

}

export function handleKeyDown(
  event: React.KeyboardEvent<HTMLCanvasElement>,
  graph: graphState, setGraph: Dispatch<SetStateAction<graphState>>,
  nodes: Immutable.Map<string, nodeState>, setNodes: Dispatch<SetStateAction<Immutable.Map<string, nodeState>>>,
  currentTool: MutableRefObject<toolStates>, setCurrentTool: Dispatch<SetStateAction<toolStates>>
) {
  let tempNodes = nodes

  if (event.key === "Delete") {

    graph.selectedNodes.forEach((nodeID) => {
      tempNodes = tempNodes.set(nodeID, {
        ...tempNodes.get(nodeID)!,
        action: "delete"
      });
    });

    setGraph({
      ...graph,
      selectedNodes: Immutable.Set<string>(),
      scale: graph.scale + 0.00001
    })

  }
  setNodes(tempNodes)


}











