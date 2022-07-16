import { useEffect, useRef, useState } from "react";
import { trpc } from "../utils/trpc";
import useMouseClickState from "./mouseClick";
import useMouseGlobalState from "./MousePosition";

// return a map with node id as key and node x,y
// the x,y should be already modified based on mouse interaction
export default function useNodeCords() {
  const { pos: {mx, my}, vel: {mvx, mvy} } = useMouseGlobalState()
  const  isClicked = useMouseClickState()
  const nodesInit = trpc.useQuery(["nodes.getAll"]);
  const [nodesCords, setNodesCords] = useState(new Map<string, {x: number, y:number}>());
  const heldIndex = useRef<string>("nothing");

  useEffect(
    () => {
      if (nodesInit.data && nodesCords.size === 0) {
        const nodes = new Map<string, {x: number, y:number}>();
        nodesInit.data.forEach(node => {
          nodes.set(node.id, {x: node.x, y: node.y});
        }); 
        setNodesCords(nodes);
        return;
      }
      
      if (isClicked) {
        switch (heldIndex.current) {
          case "background": // move everything if background is held
            nodesCords.forEach((node, id) => {
              nodesCords.set(id, {
                x: node.x - mvx,
                y: node.y - mvy
              });
            });
            break;
          case "nothing": // if nothing is held, do nothing
            break
          default: // if a node is held, move it to the mouse position
            nodesCords.set(heldIndex.current, {
              x: mx,
              y: my
            });
        }
      } else if (heldIndex.current !== "nothing") {
        heldIndex.current = "nothing";
      }

      // check if the mouse is over a node
      if (isClicked && heldIndex.current === "nothing") {
        nodesCords.forEach((node, id) => {
          if (Math.abs(node.x - mx) < 20 && Math.abs(node.y - my) < 20) {
            heldIndex.current = id 
          }
        });
      }

      // if clicked and nothing is held, hold the background
      if (isClicked && heldIndex.current === "nothing") {
        heldIndex.current = "background";
      }


    },
    [nodesInit, mx, my]
  )


  return {n: nodesCords, i: heldIndex};

}