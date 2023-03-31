import assert from "assert";
import imt from "immutable";
import React, {Dispatch, SetStateAction, useEffect, useRef, useState} from "react";
import {toolStates} from "../Toolbar/Toolbar";
import { AABB } from "./AABB";
import { edgeAction } from "./edgeHandling";
import { handleDoubleClick, handleKeyDown, handleKeyUp, handleMove, handlePointerDown, handlePointerUp, handleWheel, movementShortcuts } from "./EventListeners";
import { GState, nodeState } from "./graphHandler";



interface canvasProps {
  currentTool: toolStates
  setCurrentTool: Dispatch<SetStateAction<toolStates>>,
  setCollapseConfig: Dispatch<SetStateAction<boolean>>,
  G: GState
}

const blue = "rgb(59 130 246)"
const red = "rgb(239 68 68)"
const paleBlue = "#cbd5e1"
const darkGreen = "#336555"
const darkPaleBlue = "#334155"

export const hitBoxHalfWidth = 8
export const hitBoxHalfHeight = 6

const drawAABBGrid = true

export function isNodeVisible(node: nodeState, G: GState) {
  const {graph} = G;

  if (node.animation?.animation === "complete") return true;
  if (node.action === "delete") return false;
  if (!graph.showArchive && node.archive) return false;

  let inVisibleLayer = false;
  let inNoLayers = true;
  node.layerIds.forEach((layerId) => {
    inNoLayers = false;
    if (!graph.layers.get(layerId)?.visible) {
      inVisibleLayer = true
    }
  });
  return !inVisibleLayer || inNoLayers;
}

export function getNodeApearance(G: GState, nodeId: string, isHovered: boolean) {
  const {nodes, graph} = G;
  const node = nodes.get(nodeId);
  assert(node !== undefined);
  const isComplete = node.layerIds.has(graph.completeLayerId) && node.layerIds.get(graph.completeLayerId) != "delete"
  const isSelected = graph.selectedNodes.has(nodeId) || isHovered;

  let selectFill = "pink"
  let color = paleBlue
  let nodeOutline = false
  let nodeOutlineColor = blue
  switch (node.priority) {
    case "critical":
      color = "red"
      selectFill = "red"
      break;
    case "high":
      color = "orange"
      selectFill = "#FFD067"
      break;
    case "normal":
      color = "lightblue"
      selectFill = "lightblue"
      break;
    case "low":
      selectFill = paleBlue
      break;
  }

  if (node.nodeColor !== "default") {
    color = node.nodeColor;
  }

  if (isComplete) {
    color = "#99ff99"
  } else if (isSelected) {
    color = "#f472b6"
  }

  if (graph.edgeActionState.parents.has(nodeId)) {
    color = red
  } else if (graph.edgeActionState.children.has(nodeId)) {
    color = blue
  }

  return {
    color,
    selectFill,
    nodeOutline,
    nodeOutlineColor
  }


}

export const parseDeltaTime = (d: number) => {
  if (d < 0) return "00:00:00"
  d = Math.floor(d/1000);
  const s = d%60;
  d = Math.floor(d/60)
  const m = d%60;
  d = Math.floor(d/60)
  const h = d%24;
  d = Math.floor(d/24)

  return d.toString().padStart(2, "0") + ":" + h.toString().padStart(2, "0") + ":" + m.toString().padStart(2, "0") + ":" + s.toString().padStart(2, "0")

}


export function Canvas({ currentTool, setCurrentTool, setCollapseConfig, G}: canvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { height, width } = useWindowDimensions();
  const {mx: fmx, my: fmy} = useMousePos()
  const [cursor, setCursor] = useState("defualt")
  const [dashOffset, setDashOffset] = useState(0);
  const currentToolRef = useRef<toolStates>("pointer");
  const inCanvas = useRef<boolean>(false)
  const evCache = useRef<React.PointerEvent<HTMLCanvasElement>[]>([]);
  const nodesCache = useRef<imt.Map<string, nodeState>>(G.nodes);
  const pinchDiff = useRef<number>(-1);
  const clickTimestamp = useRef<number>(-1);
  const {nodes, setNodes, graph, setGraph} = G;


  useEffect(() => {
    currentToolRef.current = currentTool;
    setGraph(graph => ({
      ...graph,
      edgeActionState: {
        parents: imt.Set(),
        children: imt.Set(),
        action: currentTool === "addEdge" || currentTool === "removeEdge" ? currentTool : "nothing",
      },
    }))
  }, [currentTool])



  // setInterval that updates the dash offset
  useEffect(() => {
    const interval = setInterval(() => {
      setDashOffset(dashOffset => dashOffset + 0.1);
      movementShortcuts(G)
      setGraph(graph => {
        if (graph.animation?.animation === "pan") {
          const {x, y} = graph.animation.target;
          if (Math.abs(x - graph.TopLeftX) < 0.5 && Math.abs(y - graph.TopLeftY) < 0.5) {
            return {
              ...graph,
              TopLeftX: x,
              TopLeftY: y,
              animation: null,
            }
          }
          return {
            ...graph,
            TopLeftX: graph.TopLeftX + (x - graph.TopLeftX) * 0.1,
            TopLeftY: graph.TopLeftY + (y - graph.TopLeftY) * 0.1,
          }
        }
        return graph;
      })
    }, 20);
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
      if (clickTimestamp.current === -1 && graph.mouseDown) {
        clickTimestamp.current = Date.now();
      } else if (!graph.mouseDown && clickTimestamp.current !== -1) {
        clickTimestamp.current = -1;
      }


      // set up canvas
      const mainCanvas: HTMLCanvasElement = canvasRef.current!
      const mx = fmx/graph.scale + graph.TopLeftX
      const my = fmy/graph.scale + graph.TopLeftY

      let ratio = window.devicePixelRatio || 1;
      mainCanvas.width = width * ratio;
      mainCanvas.height = height * ratio;
      mainCanvas.style.width = width + "px";
      mainCanvas.style.height = height + "px";
      const ctx = mainCanvas.getContext('2d')!;
      ctx.scale(ratio, ratio);

      ctx.clearRect(0,0, mainCanvas.width, mainCanvas.height)

      // DRAW the grid
      if (graph.scale > 5) {
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
      }
      // function that draws the nodes
      const createNode = (node: nodeState, isSelected: boolean, nodeID: string) => {
        const pos = {x: node.x, y: node.y}
        const label = node.goal
        const datetime = node.due ? Date.parse(node.due) : undefined
        const nodeSize = node.nodeSize * graph.scale
        const x = (pos.x - graph.TopLeftX)*graph.scale
        const y = (pos.y - graph.TopLeftY)*graph.scale
        let alpha = 1;
        if (node.animation?.animation === "complete" && !graph.layers.get(graph.completeLayerId)?.visible) {
          const delta = Date.now() - node.animation.startTime;
          alpha = delta > 400 ? 2 - delta/400 : 1;
          alpha = alpha < 0 ? 0 : alpha;
        }
        ctx.globalAlpha = alpha;

        const {color, selectFill, nodeOutline, nodeOutlineColor} = getNodeApearance(G, nodeID, isSelected)
        ctx.fillStyle = color;
        if (nodeOutline) {
          const gradient = ctx.createRadialGradient(x, y, 0, x, y, nodeSize + 5);
          gradient.addColorStop(0, color);
          gradient.addColorStop(1, nodeOutlineColor);
          ctx.fillStyle = gradient;
        }
        ctx.beginPath()
        ctx.arc(x, y, nodeSize, 0, Math.PI * 2);
        ctx.fill()
        ctx.closePath()

        // fill the hitbox
        // if (graph.selectedNodes.includes(nodeID) || (graph.heldNode != "background" && graph.mouseDown && clickTimestamp.current !== -1 && Date.now() - clickTimestamp.current > 200)) {
        //   ctx.beginPath()
        //   ctx.fillStyle = selectFill
        //   ctx.globalAlpha = 0.1*alpha;
        //   const selectedW = Math.round(node.nodeSize*hitBoxHalfWidth) * graph.scale * 2;
        //   const selectedH = Math.round(node.nodeSize*hitBoxHalfHeight) * graph.scale * 2;
        //   const selectedX = x - selectedW/2
        //   const selectedY = y - selectedH/2
        //   ctx.rect(selectedX, selectedY, selectedW, selectedH)
        //   ctx.strokeStyle = "black"
        //   ctx.fill()
        //   ctx.globalAlpha = 0.1*alpha;
        //   ctx.stroke();
        //   ctx.closePath()
        //   ctx.globalAlpha = alpha;
        // }


        if (nodeSize > 5 ){
          if (node.layerIds.has(graph.completeLayerId) && node.layerIds.get(graph.completeLayerId) != "delete") {
            const ax = x - nodeSize/16
            const ay = y
            const ancor1 = {x: ax - nodeSize/3, y: ay}
            const ancor2 = {x: ax, y: ay + nodeSize/2}
            const ancor3 = {x: ax + nodeSize/2, y: ay - nodeSize/3}
            let p1 = 1
            let p2 = 1
            ctx.lineWidth = 1 + nodeSize/5;
            if (node.animation?.animation === "complete") {
              const delta = Date.now() - node.animation.startTime;
              // only fade if complete layer is not visible
              if (delta >= 800) {
                setNodes(nodes => nodes.set(nodeID, {...node, animation: null}))
              }
              p1 = Math.min(delta/100, 1);
              p2 = Math.max(Math.min(delta/100 - 1, 1), 0);
            }

            ctx.strokeStyle = "green";
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath()
            ctx.moveTo(ancor1.x, ancor1.y)

            ctx.lineTo((1-p1)*ancor1.x + p1*ancor2.x, (1-p1)*ancor1.y + p1*ancor2.y)

            if(p2 > 0) ctx.lineTo((1-p2)*ancor2.x + p2*ancor3.x, (1-p2)*ancor2.y + p2*ancor3.y)

            ctx.stroke()
            ctx.closePath()
          }
          ctx.font = nodeSize.toString() + 'px sans-serif';
          ctx.fillStyle = "white";
          ctx.textAlign = "center"
          ctx.textBaseline = "middle"
          ctx.fillText(label, x, y + nodeSize*2);

          if (!datetime || (node.layerIds.has(graph.completeLayerId) && node.layerIds.get(graph.completeLayerId) != "delete")) return;

          const delta = datetime - Date.now()
          ctx.font = "bold " + (0.75*nodeSize).toString() + 'px monospace';
          ctx.fillStyle = delta > 1000*60*60*24 ? "lime" : (delta > 1000*60*60 ? "orange" : "red") ;
          ctx.textAlign = "center"
          ctx.textBaseline = "middle"
          ctx.fillText(parseDeltaTime(delta), x, y - nodeSize*2);
        }
      }
      // function that draws the arrows
      const createArrow = (node1: nodeState, node2: nodeState, color: string, bitPos: number, bitR: number) => {
        // pos1 and pos2 are real positions, turn them into screen cords:
        // pos1 is the parent, pos2 is the child
        let alpha = 1;
        if (node1.animation?.animation === "complete" && !graph.layers.get(graph.completeLayerId)?.visible) {
          const delta = Date.now() - node1.animation.startTime;
          alpha = delta > 200 ? 2 - delta/400 : 1;
        }
        if (node2.animation?.animation === "complete" && !graph.layers.get(graph.completeLayerId)?.visible) {
          const delta = Date.now() - node2.animation.startTime;
          alpha = delta > 400 ? 2 - delta/400 : 1;
        }
        alpha = alpha < 0 ? 0 : alpha;
        ctx.globalAlpha = alpha;
        const x1 = (node1.x - graph.TopLeftX)*graph.scale
        const x2 = (node2.x - graph.TopLeftX)*graph.scale
        const y1 = (node1.y - graph.TopLeftY)*graph.scale
        const y2 = (node2.y - graph.TopLeftY)*graph.scale

        const len = Math.sqrt((x1-x2)**2 + (y2-y1)**2)
        if (len === 0) return;
        const prog = (bitPos*graph.scale)/len;
        const r = (bitR*graph.scale)/len;

        ctx.lineWidth = 1 + graph.scale/5;
        // ctx.lineDashOffset = -dashOffset*graph.scale;

        const gradient = ctx.createRadialGradient(x2, y2, 0, x2, y2, len)
        gradient.addColorStop(Math.min(Math.max(prog-r, 0), 1), color);
        gradient.addColorStop(Math.max(Math.min(prog, 1), 0), blue);
        gradient.addColorStop(Math.max(Math.min(prog+r, 1), 0), color);

        gradient.addColorStop(Math.min(Math.max((1-prog)-r, 0), 1), color);
        gradient.addColorStop(Math.max(Math.min(1-prog, 1), 0), red);
        gradient.addColorStop(Math.max(Math.min((1-prog)+r, 1), 0), color);

        ctx.beginPath()
        ctx.strokeStyle = gradient;
        ctx.moveTo(x2, y2)
        ctx.lineTo(x1, y1)
        ctx.stroke()
      }

      // Draw AABB visualisation
      const colors = ["red", "orange", "yellow", "green", "blue", "indigo", "violet"]
      const drawAABB = (AABB: AABB, colorIndex: number) => {
        if (!AABB) return;
        ctx.beginPath()

        const selectedX = (AABB.minX - graph.TopLeftX) * graph.scale
        const selectedY = (AABB.minY - graph.TopLeftY) * graph.scale
        const selectedW = (AABB.maxX - AABB.minX) * graph.scale
        const selectedH = (AABB.maxY - AABB.minY) * graph.scale

        if (colorIndex >= 0) {
          ctx.rect(selectedX, selectedY, selectedW, selectedH)

          ctx.strokeStyle = colors[colorIndex%colors.length]!
          ctx.lineWidth = graph.scale/5;
          ctx.stroke()
          ctx.closePath()
        }
        if (AABB.leafs.length === 2) {
          drawAABB(AABB.leafs[0]!, (colorIndex+1))
          drawAABB(AABB.leafs[1]!, (colorIndex+1))
        }
      }
      // =============================
      // = toggle AABB visualisation =
      // =============================
      if (drawAABBGrid) {
        drawAABB(graph.AABBTree, 0)
      }

      nodes.forEach((node, id) => {
        if (!isNodeVisible(node, G)) return;
        node.dependencyIds.forEach((depId) => {
          const depNode = nodes.get(depId)
          let color = darkPaleBlue
          let endsSize = 4
          if (!depNode) return;

          if (!isNodeVisible(depNode, G)) return;
          if (node.layerIds.has(graph.completeLayerId) || depNode.layerIds.has(graph.completeLayerId)) {
            color = darkGreen
            endsSize = 0
          }
          createArrow(node, depNode, color, 0, endsSize)
        });

      });


      // draw the nodes and set the cursor
      setCursor("default")
      nodes.forEach((node, id) => {
        if (!isNodeVisible(node, G)) return;

        if (Math.abs(node.x - mx) < node.nodeSize*1.25 && Math.abs(node.y - my) < node.nodeSize*1.25 && !["move", "addNode"].includes(currentToolRef.current)) {
          setCursor("pointer")
          createNode(node, true, id)
        }
        else if (graph.selectedNodes.has(id)){
          createNode(node, true, id)
        } else {
          createNode(node, false, id)
        }


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

      if (!graph.edgeActionState.parents.isEmpty() && !graph.edgeActionState.children.isEmpty()) {
        const parents = graph.edgeActionState.parents
        const children = graph.edgeActionState.children
        if (graph.edgeActionState.action === "addEdge") {
          // do a depth first search to check if a path from n1 to n2 already exists
          parents.forEach((n1) => {
            children.forEach((n2) => {
              edgeAction(G, "add", n1, n2)
            })
          });
        }
        else if (graph.edgeActionState.action === "removeEdge") {
          parents.forEach((n1) => {
            children.forEach((n2) => {
              edgeAction(G, "delete", n1, n2)
            })
          });
        }
        setGraph(graph => ({
          ...graph,
          edgeActionState: {
            parents: imt.Set(),
            children: imt.Set(),
            action: "nothing",
          }
        }));
        setCurrentTool("pointer")
      }

    },
    [width, height, fmx, fmy, dashOffset, currentTool]
  );

  return (
    <>
      <canvas
        ref={canvasRef}
        className={`absolute overflow-hidden touch-none inset-0 -z-10`}
        style={{"cursor": cursor, WebkitTapHighlightColor: "transparent"}}
        width={width} height={height}
        onPointerEnter={() => inCanvas.current = true}
        onPointerDown={(ev) => handlePointerDown(ev, evCache, G, currentToolRef, setCurrentTool, nodesCache)}
        onDoubleClick={(ev) => handleDoubleClick(ev, G, currentToolRef, setCollapseConfig)}
        onPointerUp={(ev) => handlePointerUp(ev, evCache, pinchDiff, G, nodesCache)}
        onPointerOut={(ev) => handlePointerUp(ev, evCache, pinchDiff, G, nodesCache)}
        onPointerCancel={(ev) => handlePointerUp(ev, evCache, pinchDiff, G, nodesCache)}
        onPointerLeave={(ev) => {
          inCanvas.current = false;
          handlePointerUp(ev, evCache, pinchDiff, G, nodesCache)
        }}
        onPointerMove={(ev) => handleMove(ev, evCache, pinchDiff, G, currentToolRef)}
        onWheel={(ev) => handleWheel(ev, graph, setGraph)}
        onKeyDown={(ev) => handleKeyDown(ev, G, currentToolRef, setCurrentTool)}
        onKeyUp={(ev) => handleKeyUp(ev, currentToolRef, setCurrentTool)}
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
