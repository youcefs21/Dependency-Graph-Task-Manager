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

      <div className="flex relative top-5 w-full place-content-between items-center">
        <button onClick={() => {
          setCollapseExplorer((explorer) => !explorer)
        }} className="w-fit h-fit p-4 hover:bg-neutral-700 rounded-lg mx-4">
          <div className="w-[14px] h-[12px]">
            <svg width="14" height="12" viewBox="0 0 14 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="14" height="2" rx="1" fill="#D9D9D9"/>
              <rect y="5" width="14" height="2" rx="1" fill="#D9D9D9"/>
              <rect y="10" width="14" height="2" rx="1" fill="#D9D9D9"/>
            </svg>
          </div>
        </button>


        <Toolbar currentTool={currentTool} setCurrentTool={setCurrentTool} graph={graph}/>

        <button onClick={() => setCollapseConfig((ex) => !ex)} className={"rounded-lg hover:bg-neutral-700 w-fit h-fit p-4 mx-4"}>
          <div className="w-[16px] h-[16px]">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="8" cy="8" r="5" stroke="#D9D9D9" stroke-width="2"/>
              <rect x="7" width="2" height="4" rx="1" fill="#D9D9D9"/>
              <rect y="9" width="2" height="4" rx="1" transform="rotate(-90 0 9)" fill="#D9D9D9"/>
              <rect x="12" y="9" width="2" height="4" rx="1" transform="rotate(-90 12 9)" fill="#D9D9D9"/>
              <rect x="1" y="3.41418" width="2" height="3.4326" rx="1" transform="rotate(-45 1 3.41418)" fill="#D9D9D9"/>
              <rect x="10.4932" y="11.9073" width="2" height="3.71686" rx="1" transform="rotate(-45 10.4932 11.9073)" fill="#D9D9D9"/>
              <rect x="7" y="12" width="2" height="4" rx="1" fill="#D9D9D9"/>
              <rect x="12.9694" y="1.39758" width="2" height="3.50127" rx="1" transform="rotate(45 12.9694 1.39758)" fill="#D9D9D9"/>
              <rect x="3.62817" y="10" width="2" height="3.71686" rx="1" transform="rotate(45 3.62817 10)" fill="#D9D9D9"/>
            </svg>
          </div>
        </button>


      </div>




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
