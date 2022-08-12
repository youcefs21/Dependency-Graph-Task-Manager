import Immutable from "immutable";
import type { NextPage } from "next";
import Head from "next/head";
import {useState, Dispatch, SetStateAction, FormEvent} from "react";
import { Canvas } from "../Components/Graph/Canvas";
import { graphState, nodeState, useGraph } from "../Components/Graph/graphHandler";
import { hintText, Toolbar, toolStates } from "../Components/Toolbar/Toolbar";


const Home: NextPage = () => {
  const [currentTool, setCurrentTool] = useState<toolStates>("pointer");
  const {nodes, setNodes, graph, setGraph, edges, edgeAction} = useGraph();
  const firstSelectedNode = graph.selectedNodes.size < 2 ? graph.selectedNodes.first("nothing") : "nothing";

  return (
    <>
      <Head>
        <title>Nodify</title>
        <meta name="description" content="A graph based goal management app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Canvas 
        currentTool={currentTool}
        setCurrentTool={setCurrentTool}
        nodes={nodes}
        setNodes={setNodes}
        graph={graph}
        setGraph={setGraph}
        edges={edges}
        edgeAction={edgeAction}
      />
      
      <Toolbar currentTool={currentTool} setCurrentTool={setCurrentTool} graph={graph}/>

      <p className="relative text-white w-1/2 m-auto text-center my-7 font-mono">
        {hintText(currentTool, graph.selectedPair.size)}
      </p>
      
      { firstSelectedNode != "nothing" && currentTool === "pointer" &&
      <NodeConfigPanel nodeName={nodes.get(firstSelectedNode)?.goal ?? " "} graph={graph} setGraph={setGraph}>

        <NodeConfigPanelItem itemHeading="Basic Node Data">
          <div className="flex items-center text-sm text-[#BDBDBD] pl-3">
            <p className="w-16">Goal</p>
            <input className="bg-[#393939] rounded-l m-2 p-1 caret-white outline-0"
              type={'text'}
              name={'goal'}
              value={nodes.get(firstSelectedNode)?.goal} 
              onInput={(e) => handleInputChange(e, firstSelectedNode, nodes, setNodes)}
            />
          </div>
        </NodeConfigPanelItem>

        <NodeConfigPanelItem itemHeading="Properties">
          <div></div>
        </NodeConfigPanelItem>

        <NodeConfigPanelItem itemHeading="Connections">
          <div></div>
        </NodeConfigPanelItem>
        
        <NodeConfigPanelItem itemHeading="Apearance">
          <div></div>
        </NodeConfigPanelItem>
      
      </NodeConfigPanel>
      }


    </>
  );
};

function handleInputChange(
  e: FormEvent<HTMLInputElement>, 
  selectedNode: string,
  nodes: Immutable.Map<string, nodeState>,
  setNodes: Dispatch<SetStateAction<Immutable.Map<string, nodeState>>>
) {
  const input = e.target as HTMLInputElement;
  setNodes(
    nodes.set(selectedNode, {
      ...nodes.get(selectedNode)!,
      goal: input.value
    })
  )
}

function NodeConfigPanelItem({itemHeading, children}: {itemHeading: string, children: JSX.Element | JSX.Element[]}) {
  return (
    <div className="p-2">
      <h3>{itemHeading}</h3>
      <div>
        {children}
      </div>
    </div>
  )

}

function NodeConfigPanel({nodeName, children, graph, setGraph}: {nodeName: string, children: JSX.Element[], graph: graphState, setGraph: Dispatch<SetStateAction<graphState>>}) {
  return (
      <div className={"absolute top-24 right-6 h-5/6 min-w-3xl bg-[#222326] rounded-[34px] text-white font-mono divide-y"}>
          <div className="flex justify-between p-4">
            <h2 className="font-semibold">{nodeName}</h2>
            <button onClick={() => setGraph({...graph, selectedNodes: Immutable.Set<string>()})}>close</button>
          </div>
          <div className="divide-y p-4">
            {children}
          </div>
      </div>
  )

}


export default Home;
