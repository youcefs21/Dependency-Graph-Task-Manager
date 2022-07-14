import {useEffect, useRef, useState} from "react";
import useWindowDimensions from "../Hooks/WindowDimensions";
import useMouseGlobalState from "../Hooks/MousePosition";
import useMouseClickState from "../Hooks/mouseClick";


export function Canvas() {
  const canvasRef = useRef(null);
  const { height, width } = useWindowDimensions();
  const { pos: {mx, my}, vel: {mvx, mvy} } = useMouseGlobalState()
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
      // set state only sets the state after the whole function is done running, 
      // so we need a temp variable that can change rn
      let tempHeld = heldIndex 
      
      if (tempHeld === -2) {
        for (let i = 0; i < nodeCords.length; i++){
          const {x, y} = nodeCords[i]!
          nodeCords[i] = {x: x - mvx, y: y - mvy};
        }
      }

      // draw the nodes
      for (let i = 0; i < nodeCords.length; i++){
        const {x, y} = nodeCords[i]!
        console.log(y-my)
        const inNode = Math.abs(x - mx) < scale && Math.abs(y - my) < scale;
        let color = inNode ? "lightblue" : "grey";
        if (!isClicked)
          tempHeld = -1
        if (inNode && tempHeld === -1)
          tempHeld = i
        if (tempHeld === i && isClicked) {
          nodeCords[i] = {x: mx, y: my}
          createNode({x: mx, y: my}, "lightblue")
        }
        else
          createNode({x, y}, color)
      }

      // if clicked, but not hovering over any nodes, select background (-2)
      if (isClicked && tempHeld === -1)
        tempHeld = -2
      
      setHeldIndex(tempHeld)
      setNodeCords(nodeCords)
    },
    [width, height, mx, my, isClicked]
  );

  return (
    <canvas ref={canvasRef} className={"absolute overflow-hidden"} width={width} height={height}/>
  )
}
