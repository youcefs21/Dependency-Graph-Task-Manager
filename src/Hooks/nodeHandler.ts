import { useEffect, useRef } from "react";
import { trpc } from "../utils/trpc";

// return a map with node id as key and node x,y
// the x,y should be already modified based on mouse interaction
export default function useNodeCords() {
  const nodesInit = trpc.useQuery(["nodes.getNodes"]);
  const scaleInit = trpc.useQuery(["settings.getScale"]);
  const centrePosInit = trpc.useQuery(["settings.getPos"]);
  const nodesCords = useRef(new Map<string, {x: number, y:number}>());
  const heldIndex = useRef<string>("nothing");
  const clicked = useRef<boolean>(false);
  const scale = useRef<number>(20);
  const updateNode = trpc.useMutation(["nodes.updateNode"]);
  const updateScale = trpc.useMutation(["settings.updateScale"]);
  const scaled = useRef<boolean>(false)


  function handlePointerDown(event: PointerEvent) {
    const { innerWidth: width, innerHeight: height } = window;
    clicked.current = true; 
    // check if the mouse is over a node
    nodesCords.current.forEach((node, id) => {
      if (Math.abs(node.x - (event.x - width/2)) < scale.current && Math.abs(node.y - (event.y - height/2)) < scale.current) {
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

    if (scaled.current) {
      scaled.current = false
      updateScale.mutate({
        userId: "root",
        scale: scale.current
      });
    }

    if (heldIndex.current === "background") {
      // every node has moved
      heldIndex.current = "nothing";
      return
    }
    else if (heldIndex.current === "nothing") {
      return  
    }
    // update the node at heldIndex.current
    updateNode.mutate({
      nodeId: heldIndex.current, 
      cords: nodesCords.current.get(heldIndex.current)!
    });
    
    heldIndex.current = "nothing";
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


  function handleWheel(event: WheelEvent) {
    scaled.current = true;
    scale.current -= (scale.current*event.deltaY)/1000
    nodesCords.current.forEach((node, id) => {
      nodesCords.current.set(id, {
        x: node.x - (node.x*event.deltaY)/1000,
        y: node.y - (node.y*event.deltaY)/1000
      })
    });
  }


  useEffect(() => {
    if (nodesInit.data && nodesCords.current.size === 0 && scaleInit.data && centrePosInit.data) {
      nodesInit.data.forEach(node => {
        nodesCords.current.set(node.id, {x: node.x, y: node.y});
      });
      scale.current = scaleInit.data.scale;
      const centreX = centrePosInit.data.x
      const centreY = centrePosInit.data.y
      const deltaScroll = 1000 - (50 * scale.current) // assumes an initial scale of 20
      nodesCords.current.forEach((node, id) => {
        nodesCords.current.set(id, {
          x: (node.x - (node.x*deltaScroll)/1000) + centreX, 
          y: (node.y - (node.y*deltaScroll)/1000) + centreY
        })
      });
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


  return {n: nodesCords, i: heldIndex, s: scale};

}
