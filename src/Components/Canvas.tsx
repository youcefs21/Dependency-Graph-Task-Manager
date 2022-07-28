import {Dispatch, SetStateAction, useEffect, useRef, useState} from "react";
import useNodeCords from "../utils/nodeHandler";
import { trpc } from "../utils/trpc";


interface vec2 {
    x: number;
    y: number;
}

function useWindowDimensions() {
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

function useMousePos() {
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

interface canvasProps {
  toolbarDataCallback: (x: number, y: number, scale: number, edgeCount: number) => void,
  currentTool: string
  setCurrentTool: Dispatch<SetStateAction<string>>
}

export function Canvas({ toolbarDataCallback, currentTool, setCurrentTool}: canvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { height, width } = useWindowDimensions();
  const {mx: fmx, my: fmy} = useMousePos()
  const [cursor, setCursor] = useState("defualt")
  const nodeIdPairs = trpc.useQuery(["nodes.getPairs"]);
  const goals = trpc.useQuery(["nodes.getGoals"]);
  const addPair = trpc.useMutation(["nodes.addPair"])
  const deletePair = trpc.useMutation(["nodes.deletePair"])
  const [dashOffset, setDashOffset] = useState(0);
  const currentToolRef = useRef("pointer");
  const inCanvas = useRef<boolean>(false)
  const {n: nodesCords, i: heldIndex, s: scale, tl: topLeftPos, sp: selectedPair} = useNodeCords(canvasRef, currentToolRef, setCurrentTool)

  useEffect(() => {
    currentToolRef.current = currentTool;
    selectedPair.current = [];
  }, [currentTool])


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
      const mx = fmx/scale.current + topLeftPos.current.x
      const my = fmy/scale.current + topLeftPos.current.y
      toolbarDataCallback(
        topLeftPos.current.x + (width/scale.current)/2,
        topLeftPos.current.y + (height/scale.current)/2, 
        scale.current,
        selectedPair.current.length
      )
      //console.log("mx: ", mx, "my: ", my)
      const ctx = mainCanvas.getContext('2d')!
      ctx.clearRect(0,0, mainCanvas.width, mainCanvas.height)
      // function that draws the nodes
      const createNode = (pos: vec2, color: string, label: string) => {
        const x = (pos.x - topLeftPos.current.x)*scale.current
        const y = (pos.y - topLeftPos.current.y)*scale.current
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
        // pos1 and pos2 are real positions, turn them into screen cords:
        // pos1 is the parent, pos2 is the child
        const x1 = (pos1.x - topLeftPos.current.x)*scale.current
        const x2 = (pos2.x - topLeftPos.current.x)*scale.current
        const y1 = (pos1.y - topLeftPos.current.y)*scale.current
        const y2 = (pos2.y - topLeftPos.current.y)*scale.current
        
        ctx.lineWidth = 1 + scale.current/5;
        ctx.setLineDash([(scale.current*2)/5, scale.current/5]);
        ctx.lineDashOffset = -dashOffset*scale.current;
        ctx.beginPath()
        ctx.strokeStyle = color;
        ctx.moveTo(x2, y2)
        ctx.lineTo(x1, y1)
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
        if (Math.abs(node.x - mx) < 1 && Math.abs(node.y - my) < 1 && !["move", "addNode"].includes(currentToolRef.current)) {
          setCursor("pointer")
          color = "#f472b6"
        }
        createNode(node, color, goals.data.get(id) ?? "new Node")
      })
      if (inCanvas.current){
        if (heldIndex.current === "background") setCursor("move")

        if (currentToolRef.current === "move") {
          setCursor("grab")
          if (heldIndex.current === "background") {
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

      if (selectedPair.current.length === 2) {
        const n1 = selectedPair.current[0]!
        const n2 = selectedPair.current[1]!
        if (currentToolRef.current === "addEdge"){
          nodeIdPairs.data.push({node1_id: n1, node2_id: n2})
          addPair.mutate({node1Id: n1, node2Id: n2})
        } else if (currentToolRef.current === "removeEdge") {
            for (let i = 0; i < nodeIdPairs.data.length; i++){
              if (nodeIdPairs.data[i]?.node1_id === n1 && nodeIdPairs.data[i]?.node2_id === n2) {
                  nodeIdPairs.data.splice(i, 1)
                  deletePair.mutate({node1Id: n1, node2Id: n2})
                }
            }
          }
        selectedPair.current = []
        setCurrentTool("pointer")
      }

    },
    [width, height, fmx, fmy , dashOffset, currentTool]
  );

  return (
  <>
    <canvas 
      ref={canvasRef} 
      className={`absolute overflow-hidden touch-none inset-0`}
      style={{"cursor": cursor, WebkitTapHighlightColor: "transparent"}}
      width={width} height={height}
      onPointerEnter={() => inCanvas.current = true}
      onPointerLeave={() => inCanvas.current = false}
      />
  </>
  )
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
