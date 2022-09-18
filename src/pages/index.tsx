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
  const [leafOnly, setLeafOnly] = useState<boolean>(false)
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

      <div className="text-white bg-black p-2 rounded-lg absolute left-5 top-5">
        <button onClick={() => {
          setCollapseExplorer(false)
          setLeafOnly(false)
        }} className={"text-white"}>
          Tree Explorer
        </button>
      </div>
      
      <div className="text-white bg-black p-2 rounded-lg absolute left-5 top-18">
        <button onClick={() => {
          setCollapseExplorer(false)
          setLeafOnly(true)
          }} className={"text-white"}>
          Leaf Explorer
        </button>
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
        <TreeExplorerPanel G={G} setCollapse={setCollapseExplorer} onlyLeafs={leafOnly}/>
      }

    </>
  );
};



export default Home;
