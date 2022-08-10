import Immutable from "immutable";
import { Dispatch, MutableRefObject, SetStateAction } from "react";
import {toolStates} from "../Toolbar/Toolbar";
import { graphState, nodeState } from "./graphHandler";

export function handlePointerDown(
  event: React.PointerEvent<HTMLCanvasElement>,
  evCache: MutableRefObject<React.PointerEvent<HTMLCanvasElement>[]>,
  graph: graphState, setGraph: Dispatch<SetStateAction<graphState>>,
  nodes: Immutable.Map<string, nodeState>, setNodes: Dispatch<SetStateAction<Immutable.Map<string, nodeState>>>,
  currentTool: MutableRefObject<toolStates>, setCurrentTool: Dispatch<SetStateAction<toolStates>>
) {
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
      action: "nothing"
    }));
    return
  }
  
  // check if the mouse is over a node
  let newHeldNode = graph.heldNode;
  if (currentTool.current != "move"){
    nodes.forEach((node, id) => {
      if (Math.abs(node.x - mx) < 1 && Math.abs(node.y - my) < 1) {
          newHeldNode = id
      }
    });
  }

  if (currentTool.current === "deleteNode" || currentTool.current === "completeNode") {
    const t = currentTool.current
    currentTool.current = "pointer" // this has to happen straight away to avoid creating two nodes if user double clickes
    setCurrentTool("pointer")
    let tempNodes = nodes


    if (t === "completeNode")
      tempNodes = tempNodes.set(newHeldNode, {
        ...tempNodes.get(newHeldNode)!,
        action: "archive"
      });
    if (t === "deleteNode")
      tempNodes = tempNodes.set(newHeldNode, {
        ...tempNodes.get(newHeldNode)!,
        action: "delete"
      });

    setNodes(tempNodes)
    setGraph({
      ...graph,
      mouseDown: true,
      heldNode: "nothing"
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

  setGraph({
    ...graph,
    mouseDown: true,
    heldNode: newHeldNode,
    selectedNode: newHeldNode != "background" ? newHeldNode : graph.selectedNode,
    selectedPair: newSelectedPair
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
    mouseDown: false
  })
}


export function handleMove(
  event: React.PointerEvent<HTMLCanvasElement>,
  evCache: MutableRefObject<React.PointerEvent<HTMLCanvasElement>[]>,
  pinchDiff: MutableRefObject<number>,
  graph: graphState,
  setGraph: Dispatch<SetStateAction<graphState>>,
  nodes: Immutable.Map<string, nodeState>,
  setNodes: Dispatch<SetStateAction<Immutable.Map<string, nodeState>>>
) {


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
        setGraph({
          ...graph,
          TopLeftX: graph.TopLeftX + movementX/graph.scale,
          TopLeftY: graph.TopLeftY + movementY/graph.scale
        });
        break;
      case "nothing": // if nothing is held, do nothing
        break
      default: // if a node is held, move it to the mouse position
        setNodes(
          nodes.set(graph.heldNode, {
            ...nodes.get(graph.heldNode)!, 
            x: Math.round(event.clientX/graph.scale + graph.TopLeftX),
            y: Math.round(event.clientY/graph.scale + graph.TopLeftY),
          })
        )
    }
  } 
}


export function handleWheel(event: React.WheelEvent<HTMLCanvasElement>, graph: graphState, setGraph: Dispatch<SetStateAction<graphState>>) {

  const newScale = graph.scale - (graph.scale*event.deltaY)/1000

  setGraph({
    ...graph,
    scale: newScale,
    TopLeftX: graph.TopLeftX + (event.clientX/graph.scale) - (event.clientX/newScale),
    TopLeftY: graph.TopLeftY + (event.clientY/graph.scale) - (event.clientY/newScale)
  })

}
