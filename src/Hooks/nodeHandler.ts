import { useEffect, useRef } from "react";
import { trpc } from "../utils/trpc";

// return a map with node id as key and node x,y
// the x,y should be already modified based on mouse interaction
export default function useNodeCords() {
  const nodesInit = trpc.useQuery(["nodes.getAll"]);
  const nodesCords = useRef(new Map<string, {x: number, y:number}>());
  const heldIndex = useRef<string>("nothing");
  const clicked = useRef<boolean>(false);


  function handlePointerDown(event: PointerEvent) {
    const { innerWidth: width, innerHeight: height } = window;
    clicked.current = true; 
    // check if the mouse is over a node
    nodesCords.current.forEach((node, id) => {
      if (Math.abs(node.x - (event.x - width/2)) < 20 && Math.abs(node.y - (event.y - height/2)) < 20) {
          heldIndex.current = id 
      }
    });

    // if clicked and nothing is held, hold the background
    if (heldIndex.current === "nothing") {
      heldIndex.current = "background";
    }

  }

  function handlePointerUp(event: PointerEvent) {
    heldIndex.current = "nothing";
    clicked.current = false
  }

  function handleMove(event: PointerEvent) {
    const { innerWidth: width, innerHeight: height } = window;
    const mx = event.x - width/2
    const my = event.y - height/2
    if (nodesCords.current.size === 0) {
      return;
    }
    
    
    if (clicked.current) {
      switch (heldIndex.current) {
        case "background": // move everything if background is held
          nodesCords.current.forEach((node, id) => {
            nodesCords.current.set(id, {
              x: node.x + event.movementX,
              y: node.y + event.movementY,
            });
          });
          break;
        case "nothing": // if nothing is held, do nothing
          break
        default: // if a node is held, move it to the mouse position
          nodesCords.current.set(heldIndex.current, {
            x: mx,
            y: my,
          });
      }
    } 
  }


  useEffect(() => {
    if (nodesInit.data && nodesCords.current.size === 0) {
      nodesInit.data.forEach(node => {
        nodesCords.current.set(node.id, {x: node.x, y: node.y});
      }); 
    }
    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointermove', handleMove);

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointermove', handleMove);
    }
  }, [nodesInit.data]);


  return {n: nodesCords, i: heldIndex};

}
