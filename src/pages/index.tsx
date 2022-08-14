import Immutable from "immutable";
import type { NextPage } from "next";
import Head from "next/head";
import {useState, Dispatch, SetStateAction, FormEvent} from "react";
import { Canvas } from "../Components/Graph/Canvas";
import { useGraph } from "../Components/Graph/graphHandler";
import { NodeConfigPanel } from "../Components/Panels/Panels";
import { hintText, Toolbar, toolStates } from "../Components/Toolbar/Toolbar";


const Home: NextPage = () => {
  const [currentTool, setCurrentTool] = useState<toolStates>("pointer");
  const G = useGraph();
  const selectedNode = G.graph.selectedNodes.size < 2 ? G.graph.selectedNodes.first("nothing") : "nothing";
  const [collapseConfig, setCollapseConfig] = useState<boolean>(true)

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
        G={G}
      />
      
      <Toolbar currentTool={currentTool} setCurrentTool={setCurrentTool} graph={G.graph}/>

      <p className="relative text-white w-1/2 m-auto text-center my-7 font-mono">
        {hintText(currentTool, G.graph.selectedPair.size)}
      </p>
      <div className="text-white bg-black p-2 rounded-lg absolute right-5 top-5">
        <button onClick={() => setCollapseConfig(false)} className={"text-white"}>
          Config Panel
        </button>
      </div>
      
      { !collapseConfig && selectedNode != "nothing" && 
        <NodeConfigPanel G={G} selectedNodeID={selectedNode} setCollapseConfig={setCollapseConfig}/>
      }


    </>
  );
};



export default Home;
