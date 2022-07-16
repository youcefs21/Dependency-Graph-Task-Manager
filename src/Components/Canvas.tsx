import {useEffect, useRef, useState} from "react";
import useWindowDimensions from "../Hooks/WindowDimensions";
import useMouseGlobalState from "../Hooks/MousePosition";
import useNodeCords from "../Hooks/nodeHandler";


export function Canvas() {
  const canvasRef = useRef(null);
  const { height, width } = useWindowDimensions();
  const { pos: {mx, my}} = useMouseGlobalState()
  const [cursor, setCursor] = useState("defualt")
  const {n: nodesCords, i: heldIndex} = useNodeCords() 


  useEffect(
    () => {
      if (!canvasRef || !nodesCords) return;
      const mainCanvas: HTMLCanvasElement = canvasRef.current!
      const ctx = mainCanvas.getContext('2d')!
      ctx.clearRect(0,0, mainCanvas.width, mainCanvas.height)
      const createNode = (pos: {x: number, y: number}, color: string) => {
        ctx.beginPath()
        ctx.fillStyle = color;
        const scale = 20;
        ctx.arc(pos.x + width/2, pos.y + height/2, scale, 0, Math.PI * 2);
        ctx.fill()
      }

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
