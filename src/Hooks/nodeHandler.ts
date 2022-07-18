import { useEffect, useRef, useState } from "react";
import { trpc } from "../utils/trpc";
import useMouseGlobalState from "./MousePosition";
import useWindowDimensions from "./WindowDimensions";

// return a map with node id as key and node x,y
// the x,y should be already modified based on mouse interaction
export default function useNodeCords() {
  const { pos: {mx, my}, vel: {mvx, mvy} } = useMouseGlobalState()
  const [isClicked, setIsClicked] = useState(false)
  const nodesInit = trpc.useQuery(["nodes.getAll"]);
  const [nodesCords, setNodesCords] = useState(new Map<string, {x: number, y:number}>());
  const heldIndex = useRef<string>("nothing");
  const { height, width } = useWindowDimensions();


  function handlePointerDown(event: PointerEvent) {
    setIsClicked(true)
    // check if the mouse is over a node
    nodesCords.forEach((node, id) => {
      console.log((event.x - width/2), (event.y - height/2), node.x, node.y)
      if (
        Math.abs(node.x - (event.x - width/2)) < 20 && 
        Math.abs(node.y - (event.y - height/2)) < 20
        ) {
        heldIndex.current = id 
      }
    });

    // if clicked and nothing is held, hold the background
    if (heldIndex.current === "nothing") {
      heldIndex.current = "background";
    }

  }

  function handlePointerUp(event: PointerEvent) {
    setIsClicked(false)
    heldIndex.current = "nothing";
  }



  useEffect(() => {
    if (nodesInit.data && nodesCords.size === 0) {
      const nodes = new Map<string, {x: number, y:number}>();
      nodesInit.data.forEach(node => {
        nodes.set(node.id, {x: node.x, y: node.y});
      }); 
      setNodesCords(nodes);
      return;
    }
  }, [nodesInit.data]);

  useEffect(
    () => {
      if (nodesCords.size === 0) {
        return;
      }
      
      if (isClicked) {
        switch (heldIndex.current) {
          case "background": // move everything if background is held
            nodesCords.forEach((node, id) => {
              nodesCords.set(id, {
                x: node.x - mvx,
                y: node.y - mvy,
              });
            });
            break;
          case "nothing": // if nothing is held, do nothing
            break
          default: // if a node is held, move it to the mouse position
            nodesCords.set(heldIndex.current, {
              x: mx,
              y: my,
            });
        }
      } 
    },
    [isClicked, mx, my]
  )

  useEffect(() => {
    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
    }
  }, [])


  return {n: nodesCords, i: heldIndex};

}