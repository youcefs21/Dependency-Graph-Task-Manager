import { Dispatch, SetStateAction, useEffect } from "react";
import {useMousePos, useWindowDimensions} from "../Graph/Canvas";
import { graphState } from "../Graph/graphHandler";
import { AddEdgeIcon, RemoveEdgeIcon, AddNodeIcon, DeleteNodeIcon, Seperator, CompleteNodeIcon, MoveIcon, PointerIcon} from "./ToolbarIcons";

interface ToolbarButtonProps {
  children: JSX.Element,
  currentTool: string,
  setCurrentTool: Dispatch<SetStateAction<toolStates>>,
  toolName: toolStates
}

interface ToolbarProps {
  currentTool: string,
  setCurrentTool: Dispatch<SetStateAction<toolStates>>,
  graph: graphState
}

export type toolStates =  "pointer" | "addNode" | "completeNode" | "deleteNode" | "addEdge" | "removeEdge" | "pointer" | "move"

const ToolbarButton = ({children, currentTool, setCurrentTool, toolName}: ToolbarButtonProps) => {
  return (
    <button className={`py-2 px-2 mx-1 rounded-md ${currentTool != toolName ? 'hover:bg-neutral-700' : 'bg-blue-500'} `} 
      onClick={() => setCurrentTool(toolName)}>
      {children}
    </button>
  )
}

export function Toolbar({currentTool, setCurrentTool, graph}: ToolbarProps) {
  const {mx, my} = useMousePos()

  return (
      <div className="flex w-5/6 max-w-4xl justify-between rounded-xl bg-[#121316]">
        <div className="flex my-2 mx-5">

          <ToolbarButton currentTool={currentTool} setCurrentTool={setCurrentTool} toolName={"addNode"}>
            <AddNodeIcon/>
          </ToolbarButton>

          <ToolbarButton currentTool={currentTool} setCurrentTool={setCurrentTool} toolName={"completeNode"}>
            <CompleteNodeIcon/>
          </ToolbarButton>

          <ToolbarButton currentTool={currentTool} setCurrentTool={setCurrentTool} toolName={"deleteNode"}>
            <DeleteNodeIcon/>
          </ToolbarButton>

          <Seperator/>

          <ToolbarButton currentTool={currentTool} setCurrentTool={setCurrentTool} toolName={"addEdge"}>
            <AddEdgeIcon/>
          </ToolbarButton>

          <ToolbarButton currentTool={currentTool} setCurrentTool={setCurrentTool} toolName={"removeEdge"}>
            <RemoveEdgeIcon/>
          </ToolbarButton>

          <Seperator/>

          <ToolbarButton currentTool={currentTool} setCurrentTool={setCurrentTool} toolName={"pointer"}>
            <PointerIcon/>
          </ToolbarButton>

          <ToolbarButton currentTool={currentTool} setCurrentTool={setCurrentTool} toolName={"move"}>
            <MoveIcon/>
          </ToolbarButton>
        </div>
        <div></div>
        <div className="flex items-center text-white text-sm font-semibold my-1 mx-5 font-mono">
          <p className={`${graph.saveState != "save error" ? "text-neutral-400" : "text-red-500"} text-xs`}>{ graph.saveState }</p>
          <Seperator/>
          <div className="whitespace-nowrap">
            <p>x: {Math.floor(graph.TopLeftX + mx/(graph.scale) ?? 0)}</p>
            <p>y: {Math.floor(graph.TopLeftY + my/(graph.scale) ?? 0)}</p>
          </div>
          <Seperator/>
          {Math.round(graph.scale*10)}%
        </div>
      </div>
  )


}


export const hintText = (t: string, isParentEmpty: boolean, isChildEmpty: boolean) => {
  switch(t) {
    case "addEdge":
      return <>Select the node you want to <span className={"text-green-500"}>connect {isChildEmpty ? "from" : "to"}</span> </>
    case "removeEdge":
      return <>select the <span className="text-red-500">{isChildEmpty ? "first" : "second"}</span> node of the pair you want to <span className="text-red-500">disconnect</span></>
    case "addNode":
      return <>click anywhere on the screen to <span className="text-green-500">create</span> a node there</>
    case "deleteNode":
      return <>click on a node to <span className="text-red-500">permanently delete</span> it</>
    case "completeNode":
      return <>click on a node to mark it as <span className="text-green-500">complete</span></>
    default:
      return <></>
  }
}
