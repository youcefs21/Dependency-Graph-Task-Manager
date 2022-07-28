import { Dispatch, MutableRefObject, RefObject, SetStateAction, useEffect, useRef } from "react";
import { trpc } from "../utils/trpc";

// return a map with node id as key and node x,y
// the x,y should be already modified based on mouse interaction
export default function useNodeCords(canvasRef: RefObject<HTMLCanvasElement>, currentTool: MutableRefObject<string>, setCurrentTool: Dispatch<SetStateAction<string>>) {
  const nodesInit = trpc.useQuery(["nodes.getNodes"]);
  const scaleInit = trpc.useQuery(["settings.getScale"]);
  const topLeftPosInit = trpc.useQuery(["settings.getPos"]);
  const topLeftPos = useRef({x: 0, y: 0});
  const nodesCords = useRef(new Map<string, {x: number, y:number}>());
  const heldIndex = useRef<string>("nothing");
  const clicked = useRef<boolean>(false);
  const scale = useRef<number>(10); // a scale of n means that unit is n pixels
  const updateNode = trpc.useMutation(["nodes.updateNode"]);
  const deleteNode = trpc.useMutation(["nodes.deleteNode"]);
  const archiveNode = trpc.useMutation(["nodes.archiveNode"]);
  const updateScale = trpc.useMutation(["settings.updateScale"]);
  const updateTopLeft = trpc.useMutation(["settings.updatePos"]);
  const scaled = useRef<boolean>(false);
  const evCache = useRef<PointerEvent[]>([]);
  const pinchDiff = useRef<number>(-1);
  const userID = useRef<string>("root");
  const selectedPair = useRef<string[]>([])


  function handlePointerDown(event: PointerEvent) {
    const mx = event.x/scale.current + topLeftPos.current.x
    const my = event.y/scale.current + topLeftPos.current.y
    evCache.current.push(event);

    if (currentTool.current === "addNode") {
      currentTool.current = "pointer" // this has to happen straight away to avoid creating two nodes if user double clickes
      setCurrentTool("pointer")
      const unixTime = Date.now() 
      const newNodeID = userID.current + unixTime.toString(36)
      nodesCords.current.set(newNodeID, {x: mx, y: my})
      updateNode.mutate({nodeId: newNodeID, cords: {x: mx, y: my}})
      return
    }
    
     
    clicked.current = true; 
    // check if the mouse is over a node
    if (currentTool.current != "move"){
      nodesCords.current.forEach((node, id) => {
        if (Math.abs(node.x - mx) < 1 && Math.abs(node.y - my) < 1) {
            heldIndex.current = id
        }
      });
    }

    if (currentTool.current === "deleteNode" || currentTool.current === "completeNode") {
      const t = currentTool.current
      currentTool.current = "pointer" // this has to happen straight away to avoid creating two nodes if user double clickes
      setCurrentTool("pointer")
      nodesCords.current.delete(heldIndex.current)

      if (t === "completeNode") 
        archiveNode.mutate({nodeId: heldIndex.current, archive: true})
      if (t === "deleteNode")
        deleteNode.mutate({nodeId: heldIndex.current})

      heldIndex.current = "nothing"
      return
    } 

    if (["addEdge", "removeEdge"].includes(currentTool.current) && !["nothing", "background"].includes(heldIndex.current) && selectedPair.current.length < 2 && !selectedPair.current.includes(heldIndex.current)) {
      selectedPair.current.push(heldIndex.current)
    } else {
      selectedPair.current = []
    }

    // if clicked and nothing is held, hold the background
    if (heldIndex.current === "nothing") {
      heldIndex.current = "background";
    }

  }

  function handlePointerUp(ev: PointerEvent) {
    clicked.current = false

    for (let i = 0; i < evCache.current.length; i++) {
      if (evCache.current[i]!.pointerId === ev.pointerId) {
        evCache.current.splice(i,1);
        break;
      }
    }

    if (evCache.current.length < 2) {
      pinchDiff.current = -1;
    }

    if (heldIndex.current === "background" || scaled.current) {
      // if scale changed, update database
      if (scaled.current) {
        scaled.current = false
        updateScale.mutate({
          userId: userID.current,
          scale: scale.current
        });
      }
      updateTopLeft.mutate({
        userId: userID.current, 
        pos: {x: Math.round(topLeftPos.current.x), y: Math.round(topLeftPos.current.y)}
      })
    }
    else if (heldIndex.current != "nothing") {
      // update the node at heldIndex.current
      updateNode.mutate({
        nodeId: heldIndex.current, 
        cords: nodesCords.current.get(heldIndex.current)!
      });
    }
    
    heldIndex.current = "nothing";
  }

  function handleMove(event: PointerEvent) {
    if (nodesCords.current.size === 0)
      return;

    let prevX = -1;
    let prevY = -1;

    // handle pinch events:
    // https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events/Pinch_zoom_gestures
    for (let i = 0; i < evCache.current.length; i++) {
      if (event.pointerId === evCache.current[i]!.pointerId) {
        prevX = evCache.current[i]!.x;
        prevY = evCache.current[i]!.y;
        evCache.current[i] = event;
        break;
      }
    }

    if (evCache.current.length === 2) {
      const curDiff = Math.hypot(evCache.current[0]!.clientX - evCache.current[1]!.clientX, evCache.current[0]!.clientY - evCache.current[1]!.clientY);
        
      if (pinchDiff.current > 0) {
        const delta = pinchDiff.current - curDiff
        const old_scale = scale.current

        scaled.current = true;
        scale.current -= (scale.current*delta)/200

        // update topLeftPos based on mx and my 
        topLeftPos.current.x += (event.x/old_scale) - (event.x/scale.current)
        topLeftPos.current.y += (event.y/old_scale) - (event.y/scale.current)
      }

      pinchDiff.current = curDiff 
    } else if (clicked.current) {
      switch (heldIndex.current) {
        case "background": // move everything if background is held
          const movementX = prevX === -1 ? 0 : prevX-event.x
          const movementY = prevY === -1 ? 0 : prevY-event.y
          topLeftPos.current.x += movementX/scale.current;
          topLeftPos.current.y += movementY/scale.current;
          break;
        case "nothing": // if nothing is held, do nothing
          break
        default: // if a node is held, move it to the mouse position
          nodesCords.current.set(heldIndex.current, {
            x: event.x/scale.current + topLeftPos.current.x,
            y: event.y/scale.current + topLeftPos.current.y,
          });
      }
    } 
  }


  function handleWheel(event: WheelEvent) {
    const old_scale = scale.current

    scaled.current = true;
    scale.current -= (scale.current*event.deltaY)/1000

    // update topLeftPos based on mx and my 
    topLeftPos.current.x += (event.x/old_scale) - (event.x/scale.current)
    topLeftPos.current.y += (event.y/old_scale) - (event.y/scale.current)


  }


  useEffect(() => {
    if (!canvasRef.current)
      return;
    if (nodesInit.data && nodesCords.current.size === 0 && scaleInit.data && topLeftPosInit.data) {
      nodesInit.data.forEach(node => {
        nodesCords.current.set(node.id, {x: node.x, y: node.y});
      });
      scale.current = scaleInit.data.scale;
      topLeftPos.current = {x: topLeftPosInit.data.x, y: topLeftPosInit.data.y}
    }
    canvasRef.current.addEventListener('pointerdown', handlePointerDown);
    canvasRef.current.addEventListener('pointerup', handlePointerUp);
    canvasRef.current.addEventListener('pointerout', handlePointerUp);
    canvasRef.current.addEventListener('pointercancel', handlePointerUp);
    canvasRef.current.addEventListener('pointerleave', handlePointerUp);
    canvasRef.current.addEventListener('pointermove', handleMove);
    canvasRef.current.addEventListener("wheel", handleWheel);

    return () => {
      if (!canvasRef.current) return;
      canvasRef.current.removeEventListener('pointerdown', handlePointerDown);
      canvasRef.current.removeEventListener('pointerup', handlePointerUp);
      canvasRef.current.removeEventListener('pointerout', handlePointerUp);
      canvasRef.current.removeEventListener('pointercancel', handlePointerUp);
      canvasRef.current.removeEventListener('pointerleave', handlePointerUp);
      canvasRef.current.removeEventListener('pointermove', handleMove);
      canvasRef.current.removeEventListener("wheel", handleWheel);
    }
  }, [nodesInit.data, scaleInit.data]);


  return {n: nodesCords, i: heldIndex, s: scale, tl: topLeftPos, sp: selectedPair};

}
