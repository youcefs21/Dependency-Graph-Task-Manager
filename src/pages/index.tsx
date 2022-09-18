import type { NextPage } from "next";
import {signIn, useSession} from "next-auth/react";
import Head from "next/head";
import { useState } from "react";
import { Canvas } from "../Components/Graph/Canvas";
import { useGraph } from "../Components/Graph/graphHandler";
import { GraphConfigPanel } from "../Components/Panels/GraphConfig";
import { GroupConfigPanel, NodeConfigPanel } from "../Components/Panels/NodeConfig";
import { TreeExplorerPanel } from "../Components/Panels/TreePanel";
import { hintText, Toolbar, toolStates } from "../Components/Toolbar/Toolbar";


const Home: NextPage = () => {
  const [currentTool, setCurrentTool] = useState<toolStates>("pointer");
  const G = useGraph();
  const {graph} = G;
  const selectedNode = graph.selectedNodes.size < 2 ? graph.selectedNodes.first("nothing") : "nothing";
  const [collapseConfig, setCollapseConfig] = useState<boolean>(true)
  const [collapseExplorer, setCollapseExplorer] = useState<boolean>(true)
  const auth = useSession()

  if (auth.status === "unauthenticated") {
    signIn()
    return (<div></div>)
  }
  

  return (
    <>
      <Head>
        <title>Nodify</title>
        <meta name="description" content="A dependency based task management app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Canvas 
        currentTool={currentTool}
        setCurrentTool={setCurrentTool}
        setCollapseConfig={setCollapseConfig}
        G={G}
      />
      
      <Toolbar currentTool={currentTool} setCurrentTool={setCurrentTool} graph={graph}/>

      <div className="absolute text-white w-full text-center my-7 font-mono pointer-events-none flex items-center flex-col gap-2 ">
        <p className="mx-5 max-w-3xl">
          {hintText(currentTool, graph.edgeActionState.parents.isEmpty(), graph.edgeActionState.children.isEmpty())}
        </p>
        { graph.toolbarMsg &&
        <p className="mx-5 max-w-3xl">
          {graph.toolbarMsg}
        </p>
        }
      </div>
      <div className="text-white bg-black p-2 rounded-lg absolute right-5 top-5">
        <button onClick={() => setCollapseConfig(false)} className={"text-white"}>
          Config Panel
        </button>
      </div>

      <button onClick={() => {
        setCollapseExplorer((explorer) => !explorer)
      }} className="w-fit h-fit p-2 absolute hover:bg-neutral-700 rounded left-5 top-5">
        <div className="w-[14px] h-[12px]">
          <svg width="14" height="12" viewBox="0 0 14 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="14" height="2" rx="1" fill="#D9D9D9"/>
            <rect y="5" width="14" height="2" rx="1" fill="#D9D9D9"/>
            <rect y="10" width="14" height="2" rx="1" fill="#D9D9D9"/>
          </svg>
        </div>
      </button>
      
      { !collapseConfig && selectedNode != "nothing" && 
        <NodeConfigPanel G={G} selectedNodeID={selectedNode} setCollapseConfig={setCollapseConfig}/>
      }

      { !collapseConfig && graph.selectedNodes.size == 0 &&
        <GraphConfigPanel G={G} setCollapse={setCollapseConfig}/>
      }

      { !collapseConfig && graph.selectedNodes.size > 1 &&
        <GroupConfigPanel G={G} setCollapse={setCollapseConfig}/>
      }
      
      { !collapseExplorer &&
        <TreeExplorerPanel G={G} setCollapse={setCollapseExplorer}/>
      }

    </>
  );
};



export default Home;
