import { useEffect, useRef } from "react";
import { trpc } from "../utils/trpc";

// return a map with node id as key and node x,y
// the x,y should be already modified based on mouse interaction
export default function useNodeCords() {
  const nodesInit = trpc.useQuery(["nodes.getNodes"]);
  const scaleInit = trpc.useQuery(["settings.getScale"]);
  const topLeftPosInit = trpc.useQuery(["settings.getPos"]);
  const topLeftPos = useRef({x: 0, y: 0});
  const nodesCords = useRef(new Map<string, {x: number, y:number}>());
  const heldIndex = useRef<string>("nothing");
  const clicked = useRef<boolean>(false);
  const scale = useRef<number>(10); // a scale of n means that unit is n pixels
  const updateNode = trpc.useMutation(["nodes.updateNode"]);
  const updateScale = trpc.useMutation(["settings.updateScale"]);
  const updateTopLeft = trpc.useMutation(["settings.updatePos"]);
  const scaled = useRef<boolean>(false)


  function handlePointerDown(event: PointerEvent) {
    const mx = event.x/scale.current + topLeftPos.current.x
    const my = event.y/scale.current + topLeftPos.current.y
    
    clicked.current = true; 
    // check if the mouse is over a node
    nodesCords.current.forEach((node, id) => {
      if (Math.abs(node.x - mx) < 1 && Math.abs(node.y - my) < 1) {
          heldIndex.current = id 
      }
    });

    // if clicked and nothing is held, hold the background
    if (heldIndex.current === "nothing") {
      heldIndex.current = "background";
    }

  }

  function handlePointerUp() {
    clicked.current = false

    if (heldIndex.current === "background" || scaled.current) {
      // if scale changed, update database
      if (scaled.current) {
        scaled.current = false
        updateScale.mutate({
          userId: "root",
          scale: scale.current
        });
      }
      updateTopLeft.mutate({
        userId: "root",
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
    
    if (clicked.current) {
      switch (heldIndex.current) {
        case "background": // move everything if background is held
          topLeftPos.current.x -= event.movementX/scale.current;
          topLeftPos.current.y -= event.movementY/scale.current;
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
    const mx = event.x/scale.current + topLeftPos.current.x
    const my = event.y/scale.current + topLeftPos.current.y

    scaled.current = true;
    scale.current -= (scale.current*event.deltaY)/1000

    // update topLeftPos based on mx and my 
    const mxn = event.x/scale.current + topLeftPos.current.x
    const myn = event.y/scale.current + topLeftPos.current.y

    topLeftPos.current.x += mx-mxn 
    topLeftPos.current.y += my-myn


  }


  useEffect(() => {
    if (nodesInit.data && nodesCords.current.size === 0 && scaleInit.data && topLeftPosInit.data) {
      nodesInit.data.forEach(node => {
        nodesCords.current.set(node.id, {x: node.x, y: node.y});
      });
      scale.current = scaleInit.data.scale;
      topLeftPos.current = {x: topLeftPosInit.data.x, y: topLeftPosInit.data.y}
    }
    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointermove', handleMove);
    window.addEventListener("wheel", handleWheel)

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener("wheel", handleWheel)
    }
  }, [nodesInit.data, scaleInit.data]);


  return {n: nodesCords, i: heldIndex, s: scale, tl: topLeftPos};

}
