import {useEffect, useRef, useState} from "react";
import useWindowDimensions from "../Hooks/WindowDimensions";
import useMouseGlobalState from "../Hooks/MousePosition";
import useNodeCords from "../Hooks/nodeHandler";
import { trpc } from "../utils/trpc";


interface vec2 {
    x: number;
    y: number;
}


export function Canvas() {
  const canvasRef = useRef(null);
  const { height, width } = useWindowDimensions();
  const { pos: {mx, my}} = useMouseGlobalState()
  const [cursor, setCursor] = useState("defualt")
  const {n: nodesCords, i: heldIndex} = useNodeCords()
  const nodeIdPairs = trpc.useQuery(["nodes.pairs"]);


  useEffect(
    () => {
      // do nothing if canvas or data are not ready
      if (!canvasRef || !nodesCords || !nodeIdPairs.data) return;
      // set up canvas
      const mainCanvas: HTMLCanvasElement = canvasRef.current!
      const ctx = mainCanvas.getContext('2d')!
      ctx.clearRect(0,0, mainCanvas.width, mainCanvas.height)
      // function that draws the nodes
      const createNode = (pos: vec2, color: string) => {
        ctx.beginPath()
        ctx.fillStyle = color;
        const scale = 20;
        ctx.arc(pos.x + width/2, pos.y + height/2, scale, 0, Math.PI * 2);
        ctx.fill()
      }
      // function that draws the arrows
      const createArrow = (pos1: vec2, pos2: vec2, color: string) => {
        ctx.beginPath()
        ctx.strokeStyle = color;
        ctx.moveTo(pos1.x + width/2, pos1.y + height/2)
        ctx.lineTo(pos2.x + width/2, pos2.y + height/2)
        ctx.stroke()
      }

      // draw the lines
      nodeIdPairs.data.forEach((pair) => {
        createArrow(nodesCords.get(pair.node1_id)!, nodesCords.get(pair.node2_id)!, "gray")
      });
      
      // draw the nodes and set the cursor
      setCursor("default")
      nodesCords.forEach((node, id) => {
        let color = "grey"
        if (Math.abs(node.x - mx) < 20 && Math.abs(node.y - my) < 20) {
          setCursor("pointer")
          color = "lightblue"
        }
        createNode(node, color)
      })
      if (heldIndex.current === "background") setCursor("move")

    },
    [width, height, mx, my, nodesCords]
  );

  return (
    <canvas 
      ref={canvasRef} 
      className={`absolute overflow-hidden`}
      style={{"cursor": cursor}}
      width={width} height={height}/>
  )
}
