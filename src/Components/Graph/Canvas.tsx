import Immutable from "immutable";
import React, {Dispatch, SetStateAction, useEffect, useRef, useState} from "react";
import {toolStates} from "../Toolbar/Toolbar";
import { handleKeyDown, handleMove, handlePointerDown, handlePointerUp, handleWheel } from "./EventListeners";
import { edgeState, graphState, GState, nodeState } from "./graphHandler";


interface vec2 {
    x: number;
    y: number;
}


interface canvasProps {
  currentTool: toolStates
  setCurrentTool: Dispatch<SetStateAction<toolStates>>,
  G: GState
}

export function Canvas({ currentTool, setCurrentTool, G}: canvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { height, width } = useWindowDimensions();
  const {mx: fmx, my: fmy} = useMousePos()
  const [cursor, setCursor] = useState("defualt")
  const [dashOffset, setDashOffset] = useState(0);
  const currentToolRef = useRef<toolStates>("pointer");
  const inCanvas = useRef<boolean>(false)
  const evCache = useRef<React.PointerEvent<HTMLCanvasElement>[]>([]);
  const pinchDiff = useRef<number>(-1);
  const {nodes, setNodes, graph, setGraph, edges, edgeAction} = G;


  useEffect(() => {
    currentToolRef.current = currentTool;
    setGraph({
      ...graph,
      selectedPair: Immutable.List<string>()
    })
  }, [currentTool])



  // setInterval that updates the dash offset
  useEffect(() => {
    const interval = setInterval(() => {
      setDashOffset(dashOffset => dashOffset + 0.1);
    }, 40);
    return () => clearInterval(interval);
  }, []);

  // prevent default scrolling behavior
  function preventScroll(e: WheelEvent) {
    e.preventDefault();
  }

  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.addEventListener("wheel", preventScroll);
    }
    return () => {
      if (canvasRef.current) {
        canvasRef.current.removeEventListener("wheel", preventScroll);
      }
    }
  } , [])



  useEffect(
    () => {
      // do nothing if canvas or data are not ready
      if (!canvasRef || !graph.loaded) return;
      

      // set up canvas
      const mainCanvas: HTMLCanvasElement = canvasRef.current!
      const mx = fmx/graph.scale + graph.TopLeftX 
      const my = fmy/graph.scale + graph.TopLeftY
      //console.log("mx: ", mx, "my: ", my)
      const ctx = mainCanvas.getContext('2d')!
      ctx.clearRect(0,0, mainCanvas.width, mainCanvas.height)
      
      // DRAW the grid
      ctx.lineWidth = graph.scale/50
      ctx.strokeStyle = "rgb(12 74 110)";
      ctx.setLineDash([])
      for (let i = -(graph.TopLeftX % 1) ; i < width/graph.scale; i++) {
        ctx.beginPath()
        ctx.moveTo(i*graph.scale, 0)
        ctx.lineTo(i*graph.scale, height)
        ctx.stroke()
      }
      for (let i =  -(graph.TopLeftY % 1); i < height/graph.scale; i++){
        ctx.beginPath()
        ctx.moveTo(0, i*graph.scale)
        ctx.lineTo(width, i*graph.scale)
        ctx.stroke()
      }
      // function that draws the nodes
      const createNode = (pos: vec2, color: string, label: string) => {
        const x = (pos.x - graph.TopLeftX)*graph.scale
        const y = (pos.y - graph.TopLeftY)*graph.scale
        ctx.fillStyle = color;
        ctx.beginPath()
        ctx.arc(x, y, graph.scale, 0, Math.PI * 2);
        ctx.fill()
        if (graph.scale > 8){
          ctx.font = graph.scale.toString() + 'px serif';
          ctx.fillStyle = "white";
          ctx.textAlign = "center"
          ctx.textBaseline = "middle"
          ctx.fillText(label, x, y + graph.scale*2);
        }
      }
      // function that draws the arrows
      const createArrow = (pos1: vec2, pos2: vec2, color: string, bitPos: number, bitR: number) => {
        // pos1 and pos2 are real positions, turn them into screen cords:
        // pos1 is the parent, pos2 is the child
        const x1 = (pos1.x - graph.TopLeftX)*graph.scale
        const x2 = (pos2.x - graph.TopLeftX)*graph.scale
        const y1 = (pos1.y - graph.TopLeftY)*graph.scale
        const y2 = (pos2.y - graph.TopLeftY)*graph.scale

        const len = Math.sqrt((x1-x2)**2 + (y2-y1)**2) 
        if (len === 0) return;
        const prog = (bitPos*graph.scale)/len;
        const r = (bitR*graph.scale)/len;
        
        ctx.lineWidth = 1 + graph.scale/5;
        ctx.setLineDash([(graph.scale*2)/5, graph.scale/5]);
        ctx.lineDashOffset = -dashOffset*graph.scale;
        
        const gradient = ctx.createRadialGradient(x2, y2, 0, x2, y2, len)
        gradient.addColorStop(Math.min(Math.max(prog-r, 0), 1), color);
        gradient.addColorStop(Math.max(Math.min(prog, 1), 0), "blue");
        gradient.addColorStop(Math.max(Math.min(prog+r, 1), 0), color);

        gradient.addColorStop(Math.min(Math.max((1-prog)-r, 0), 1), color);
        gradient.addColorStop(Math.max(Math.min(1-prog, 1), 0), "red");
        gradient.addColorStop(Math.max(Math.min((1-prog)+r, 1), 0), color);

        ctx.beginPath()
        ctx.strokeStyle = gradient;
        ctx.moveTo(x2, y2)
        ctx.lineTo(x1, y1)
        ctx.stroke()
      }

      
      // draw the lines
      edges.forEach((pair) => {
        const node1 = nodes.get(pair.node1_id) 
        const node2 = nodes.get(pair.node2_id)
        if (node1 && node2 && pair.action != "delete" && ["add", "update", "nothing"].includes(node1.action) && ["add", "update", "nothing"].includes(node2.action)) 
          createArrow({x: node1.x, y: node1.y}, {x: node2.x, y: node2.y}, "#334155", 0, 4)
      });
      
      // draw the nodes and set the cursor
      setCursor("default")
      nodes.forEach((node, id) => {
        if (node.action === "archive" || node.action === "delete")
          return
        let color = "#cbd5e1"
        if (Math.abs(node.x - mx) < 1 && Math.abs(node.y - my) < 1 && !["move", "addNode"].includes(currentToolRef.current)) {
          setCursor("pointer")
          color = "#f472b6"
        }
        if (graph.selectedNodes.has(id))
          color = "#f472b6"
        createNode(node, color, nodes.get(id)?.goal ?? "new Node")
      });

      // draw selected area
      ctx.fillStyle = "rgb(42 153 222)"
      ctx.globalAlpha = 0.2
      const selectedX = (graph.selectedArea.x1 - graph.TopLeftX) * graph.scale
      const selectedY = (graph.selectedArea.y1 - graph.TopLeftY) * graph.scale
      const selectedW = (graph.selectedArea.x1 - graph.selectedArea.x2) * graph.scale
      const selectedH = (graph.selectedArea.y1 - graph.selectedArea.y2) * graph.scale
      ctx.fillRect(selectedX, selectedY, -selectedW, -selectedH)
      ctx.globalAlpha = 1

      if (inCanvas.current){

        if (currentToolRef.current === "move") {
          setCursor("grab")
          if (graph.heldNode === "background") {
            setCursor("grabbing")
          }
        }
        else if (currentToolRef.current === "addNode") {
          setCursor("copy")
        }
        else if (currentToolRef.current === "deleteNode") {
          setCursor("no-drop")
        } 
      }

      if (graph.selectedPair.size === 2) {
        const n2 = graph.selectedPair.get(0)!
        const n1 = graph.selectedPair.get(1)!
        if (currentToolRef.current === "addEdge"){
          // do a depth first search to check if a path from n1 to n2 already exists
          edgeAction("add", n1, n2)
        } 
        else if (currentToolRef.current === "removeEdge") {
          edgeAction("delete", n1, n2)
        }
        setGraph({
          ...graph,
          selectedPair: Immutable.List<string>()
        });
        setCurrentTool("pointer")
      }

    },
    [width, height, fmx, fmy, dashOffset, currentTool]
  );

  return (
  <>
    <canvas 
      ref={canvasRef} 
      className={`absolute overflow-hidden touch-none inset-0`}
      style={{"cursor": cursor, WebkitTapHighlightColor: "transparent"}}
      width={width} height={height}
      onPointerEnter={() => inCanvas.current = true}
      onPointerDown={(ev) => handlePointerDown(ev, evCache, graph, setGraph, nodes, setNodes, currentToolRef, setCurrentTool)}
      onPointerUp={(ev) => handlePointerUp(ev, evCache, pinchDiff, graph, setGraph)}
      onPointerOut={(ev) => handlePointerUp(ev, evCache, pinchDiff, graph, setGraph)}
      onPointerCancel={(ev) => handlePointerUp(ev, evCache, pinchDiff, graph, setGraph)}
      onPointerLeave={(ev) => {
        inCanvas.current = false;
        handlePointerUp(ev, evCache, pinchDiff, graph, setGraph)
      }}
      onPointerMove={(ev) => handleMove(ev, evCache, pinchDiff, graph, setGraph, nodes, setNodes, currentToolRef)}
      onWheel={(ev) => handleWheel(ev, graph, setGraph)}
      onKeyDown={(ev) => handleKeyDown(ev, graph, setGraph, nodes, setNodes, currentToolRef, setCurrentTool)}
      tabIndex={0}
      />
  </>
  )
}

export function useWindowDimensions() {
  const [windowDimensions, setWindowDimensions] = useState({width: 0, height: 0});

  useEffect(() => {
    function handleResize() {
      const { innerWidth: width, innerHeight: height } = window;
      setWindowDimensions({width, height});
    }

    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowDimensions;
}

export function useMousePos() {
  const [mousePos, setMousePos] = useState({mx: 0, my: 0})
     
  
  useEffect(() => {
    
    function handleMove(event: PointerEvent) {
      setMousePos({
        mx: event.x,
        my: event.y,
      })
    }

    window.addEventListener('pointermove', handleMove)
    return () => {
        window.removeEventListener('pointermove', handleMove);
    }
  }, [mousePos]);

  return mousePos
}
/*
// working custom cursor, low priority, and too tired to finish it up, 
// also it works on mobile, which is bad

      <div className="absolute overflow-hidden inset-0 w-screen h-screen pointer-events-none">
        <svg width="55" height="55" viewBox="0 0 21 23" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute overflow-hidden pointer-events-none"
        style={{top: fmy, left: fmx}}>
          <CustomCursor cursor={cursor}/>
        </svg>
      </div>

function CustomCursor({cursor}: {cursor: string}) {
  if (cursor === "none") {
    return (
      <>
      <line x1="4" y1="9.57104" x2="16" y2="9.57104" stroke="white" strokeLinecap="round"/>
      <line x1="10" y1="15.5" x2="10" y2="3.5" stroke="white" strokeLinecap="round"/>
      <circle cx="10" cy="10" r="9.5" stroke="#D9D9D9"/>
      </>
      )
  }
  return <></>
}
*/
