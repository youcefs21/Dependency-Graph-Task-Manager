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
import {BurgerMenuIcon, SettingsIcon} from "../Components/Icons";


const Home: NextPage = () => {
  const [currentTool, setCurrentTool] = useState<toolStates>("pointer");
  const G = useGraph();
  const {graph} = G;
  const selectedNode = graph.selectedNodes.size < 2 ? graph.selectedNodes.first("nothing") : "nothing";
  const [collapseConfig, setCollapseConfig] = useState<boolean>(true)
  const [collapseExplorer, setCollapseExplorer] = useState<boolean>(false)
  const auth = useSession()

  if (auth.status === "unauthenticated") {
    signIn()
    return (<div></div>)
  } else if (auth.status === "loading" || !graph.loaded) {
    return (
    <div className="w-screen h-screen flex items-center ">
      <h1 className="text-4xl text-center text-white m-auto">Loading...</h1>
    </div>
    )
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

      <div>
        <div className="flex relative top-5 w-full place-content-between items-center">
          <button onClick={() => {
            setCollapseExplorer((explorer) => !explorer)
          }} className="w-fit h-fit p-4 hover:bg-neutral-700 rounded-lg mx-4">
            <BurgerMenuIcon/>
          </button>

          <Toolbar currentTool={currentTool} setCurrentTool={setCurrentTool} graph={graph}/>

          <button onClick={() => setCollapseConfig((ex) => !ex)} className={"rounded-lg hover:bg-neutral-700 w-fit h-fit p-4 mx-4"}>
            <SettingsIcon/>
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
      </div>
      
      { !collapseExplorer &&
        <TreeExplorerPanel G={G} setCollapse={setCollapseExplorer}/>
      }

      { !collapseConfig && selectedNode != "nothing" && 
        <NodeConfigPanel G={G} selectedNodeID={selectedNode} setCollapseConfig={setCollapseConfig}/>
      }

      { !collapseConfig && graph.selectedNodes.size == 0 &&
        <GraphConfigPanel G={G} setCollapse={setCollapseConfig}/>
      }

      { !collapseConfig && graph.selectedNodes.size > 1 &&
        <GroupConfigPanel G={G} setCollapse={setCollapseConfig}/>
      }

    </>
  );
};



export default Home;
