import type { NextPage } from "next";
import Head from "next/head";
import {useState, Dispatch, SetStateAction} from "react";
import { Canvas } from "../Components/Canvas";
import { AddEdgeIcon, RemoveEdgeIcon, AddNodeIcon, DeleteNodeIcon, Seperator, CompleteNodeIcon, MoveIcon, PointerIcon} from "../Components/ToolbarIcons";

interface ToolbarButtonProps {
  children: JSX.Element,
  currentTool: string,
  setCurrentTool: Dispatch<SetStateAction<string>>,
  toolName: string
}

const ToolbarButton = ({children, currentTool, setCurrentTool, toolName}: ToolbarButtonProps) => {
  return (
    <button className={`py-2 px-2 mx-1 rounded-md ${currentTool != toolName ? 'hover:bg-neutral-700' : 'bg-blue-500'} `} 
      onClick={() => setCurrentTool(toolName)}>
      {children}
    </button>
  )
}


const Home: NextPage = () => {
  const [centrePos, setCentrePos] = useState({x: 0, y: 0});
  const [scale, setScale] = useState(1);
  const [currentTool, setCurrentTool] = useState("pointer");
  const [selectedCount, setSelectedCount] = useState(0);

  const hintText = (t: string) => {
    switch(t) {
      case "addEdge":
        return <>Select the node you want to <span className={"text-green-500"}>connect {selectedCount === 0 ? "from" : "to"}</span> </>
      case "removeEdge":
        return <>select the <span className="text-red-500">{selectedCount === 0 ? "first" : "second"}</span> node of the pair you want to <span className="text-red-500">disconnect</span></>
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

  return (
    <>
      <Head>
        <title>Nodify</title>
        <meta name="description" content="A graph based life management app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Canvas 
        toolbarDataCallback={(x, y, scale, edgeCount) => {
          setCentrePos({x, y});
          setScale(scale)
          setSelectedCount(edgeCount)
        }}
        currentTool={currentTool}
        setCurrentTool={setCurrentTool}
      />
      <div className="relative top-5 flex w-5/6 max-w-4xl justify-between rounded-xl bg-[#121316] m-auto">
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
          <div>
            <p>x: {Math.round(centrePos.x)}</p>
            <p>y: {Math.round(centrePos.y)}</p>
          </div>
          <Seperator/>
          {Math.round(scale*10)}%
        </div>
      </div>
      
      <p className="relative text-white w-1/2 m-auto text-center my-7 font-mono">
        {hintText(currentTool)}
      </p>

    </>
  );
};

export default Home;
