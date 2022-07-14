import {useEffect, useRef, useState} from "react";
import useWindowDimensions from "../Hooks/WindowDimensions";
import useMouseGlobalPosition from "../Hooks/MousePosition";
import useMouseClickState from "../Hooks/mouseClick";


export function Canvas() {
  const canvasRef = useRef(null);
  const { height, width } = useWindowDimensions();
  const { mx, my } = useMouseGlobalPosition()
  const  isClicked = useMouseClickState()
  const [scale, setScale] = useState(20)
  const [heldIndex, setHeldIndex] = useState(-1)
  const [nodeCords, setNodeCords]  = useState([
    {x: 0, y: 0},
    {x: 0, y: 0},
  ])


  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     // centering force:
  //     for (let i = 0; i < nodeCords.length; i++){
  //       const {x, y} = nodeCords[i]!
  //       nodeCords[i] = {x: x*0.99, y: y*0.99}
  //     }
      
  //     setNeedUpdate(true)
  //   }, 15);
  //   return () => clearInterval(interval);
  // }, []);

  useEffect(
    () => {
      const mainCanvas: HTMLCanvasElement = canvasRef.current!
      const ctx = mainCanvas.getContext('2d')!
      ctx.clearRect(0,0, mainCanvas.width, mainCanvas.height)
      const createNode = (pos: {x: number, y: number}, color: string) => {
        ctx.beginPath()
        ctx.fillStyle = color;
        ctx.arc(pos.x + width/2, pos.y + height/2, scale, 0, Math.PI * 2);
        ctx.fill()
      }

      // draw the nodes
      for (let i = 0; i < nodeCords.length; i++){
        const {x, y} = nodeCords[i]!
        const inNode = Math.abs(x - mx) < scale && Math.abs(y - my) < scale 
        let color = inNode ? "lightblue" : "grey"
        if (!isClicked)
          setHeldIndex(-1)
        if (inNode && heldIndex === -1)
          setHeldIndex(i)
        if (heldIndex === i && isClicked) {
          nodeCords[i] = {x: mx, y: my}
          createNode({x: mx, y: my}, "lightblue")
        }
        else
          createNode({x, y}, color)
      }
      setNodeCords(nodeCords)
    },
    [width, height, mx, my]
  );

  return (
    <canvas ref={canvasRef} className={"absolute overflow-hidden"} width={width} height={height}/>
  )
}
