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
  const {n: nodesCords, i: heldIndex, s: scale} = useNodeCords()
  const nodeIdPairs = trpc.useQuery(["nodes.pairs"]);
  const goals = trpc.useQuery(["nodes.goals"]);
  const [dashOffset, setDashOffset] = useState(0);


  // setInterval that updates the dash offset
  useEffect(() => {
    const interval = setInterval(() => {
      setDashOffset(dashOffset => dashOffset + 0.05);
    }, 40);
    return () => clearInterval(interval);
  }, []);


  useEffect(
    () => {
      // do nothing if canvas or data are not ready
      if (!canvasRef || !nodesCords || !nodeIdPairs.data || !goals.data) return;
      // set up canvas
      const mainCanvas: HTMLCanvasElement = canvasRef.current!
      const ctx = mainCanvas.getContext('2d')!
      ctx.clearRect(0,0, mainCanvas.width, mainCanvas.height)
      // function that draws the nodes
      const createNode = (pos: vec2, color: string, label: string) => {
        const x = pos.x + width/2;
        const y = pos.y + height/2;
        ctx.fillStyle = color;
        ctx.beginPath()
        ctx.arc(x, y, scale.current, 0, Math.PI * 2);
        ctx.fill()
        if (scale.current > 8){
          ctx.font = scale.current.toString() + 'px serif';
          ctx.fillStyle = "white";
          ctx.textAlign = "center"
          ctx.textBaseline = "middle"
          ctx.fillText(label, x, y + scale.current*2);
        }
      }
      // function that draws the arrows
      const createArrow = (pos1: vec2, pos2: vec2, color: string) => {
        ctx.lineWidth = 1 + scale.current/5;
        ctx.setLineDash([(scale.current*2)/5, scale.current/5]);
        ctx.lineDashOffset = -dashOffset*scale.current;
        ctx.beginPath()
        ctx.strokeStyle = color;
        ctx.moveTo(pos1.x + width/2, pos1.y + height/2)
        ctx.lineTo(pos2.x + width/2, pos2.y + height/2)
        ctx.stroke()
      }


      // draw the lines
      nodeIdPairs.data.forEach((pair) => {
        const node1 = nodesCords.current.get(pair.node1_id) 
        const node2 = nodesCords.current.get(pair.node2_id)
        if (node1 && node2) 
          createArrow(node1, node2, "#334155")
      });
      
      // draw the nodes and set the cursor
      setCursor("default")
      nodesCords.current.forEach((node, id) => {
        let color = "#cbd5e1"
        if (Math.abs(node.x - mx) < 20 && Math.abs(node.y - my) < 20) {
          setCursor("pointer")
          color = "#f472b6"
        }
        createNode(node, color, goals.data.get(id)!)
      })
      if (heldIndex.current === "background") setCursor("move")

    },
    [width, height, mx, my, nodesCords, dashOffset]
  );

  return (
    <canvas 
      ref={canvasRef} 
      className={`absolute overflow-hidden touch-none`}
      style={{"cursor": cursor, WebkitTapHighlightColor: "transparent"}}
      width={width} height={height}/>
  )
}
