import cuid from "cuid";
import Immutable from "immutable";
import { Dispatch, SetStateAction } from "react";
import { graphState, GState, nodeState } from "../Graph/graphHandler";
import { ConfigPanelItem, SelectLayers } from "./PanelElements";

interface configPanelProps {
  G: GState,
  title: string, 
  setCollapse: Dispatch<SetStateAction<boolean>>,
  direction?: "right" | "left",
  children: JSX.Element | JSX.Element[],
}

export const ConfigPanel = ({G, title, setCollapse, direction = "right", children}: configPanelProps) => {
  const {graph, setGraph} = G
  const style = direction === "right" ? {right: 16} : {left: 16}
  return (
    <div className={`absolute top-24 h-5/6 w-80 bg-[#222326] rounded-[34px] text-white font-mono divide-y`} style={style}>
      <div className="flex justify-between p-4">
        <h2 className="font-semibold truncate">{title}</h2>
        <button onClick={
          () => {
            setGraph({...graph, selectedNodes: Immutable.Set<string>()})
            setCollapse(true)
          }
        }>close</button>
      </div>
      <div className="divide-y p-4">
        {children}
      </div>
    </div>
  );
}

interface NodeConfigPanelProps {
  G: GState,
  selectedNodeID: string,
  setCollapseConfig: Dispatch<SetStateAction<boolean>>
}

export const NodeConfigPanel = ({G, selectedNodeID, setCollapseConfig}: NodeConfigPanelProps) => {
  const {nodes, graph, setGraph} = G;
  const node = nodes.get(selectedNodeID);
  return (
    <ConfigPanel title={node?.goal ?? " "} G={G} setCollapse={setCollapseConfig}>
      <ConfigPanelItem itemHeading="Basic Node Data">
        <div className="flex items-center">
          <p className="w-16">Goal</p>
          <input className="bg-[#393939] rounded m-2 p-1 caret-white outline-0"
            type={'text'}
            name={'goal'}
            placeholder={"short title"}
            value={node?.goal ?? ""} 
            maxLength={35}
            onInput={(e) => handleInputChange(e, selectedNodeID, G)}
          />
        </div>
        <div className="py-2">
          <p>Description</p>
          <textarea className="bg-[#393939] rounded my-2 p-1 caret-white outline-0"
            cols={27}
            rows={5}
            name={'description'}
            placeholder={"long description"}
            value={node?.description ?? ""}
            onInput={(e) => handleInputChange(e, selectedNodeID, G)}
          />
        </div>
      </ConfigPanelItem>

      <ConfigPanelItem itemHeading="Properties">
        <div className="flex items-center">
          <p className="w-16">Due</p>
          <input className="bg-[#393939] rounded m-2 p-1 caret-white outline-0 text-xs"
            type={'datetime-local'}
            name={'due'}
            value={node?.due ?? ""}
            onInput={(e) => handleInputChange(e, selectedNodeID, G)}
          />
        </div>
      </ConfigPanelItem>

      <ConfigPanelItem itemHeading="Select Layers">
        <SelectLayers G={G} nodeID={selectedNodeID} />
        <div className="flex items-center">
          <input className="m-2" 
            type={'checkbox'} 
            name={'archiveNode'} 
            checked={node?.archive ?? false} 
            onChange={(e) => handleInputChange(e, selectedNodeID, G)} 
          />
          <p className="text-xs">Archive Node</p>
        </div>
      </ConfigPanelItem>

      <ConfigPanelItem itemHeading="Connections">
        <div></div>
      </ConfigPanelItem>
      
      <ConfigPanelItem itemHeading="Apearance">
        <div></div>
      </ConfigPanelItem>
    
    </ConfigPanel>
  )  

}

interface GenericPanelProps {
  G: GState,
  setCollapse: Dispatch<SetStateAction<boolean>> 
}
  

export const GraphConfigPanel = ({G, setCollapse} : GenericPanelProps) => {
  const {graph, setGraph} = G;
  return (
    <ConfigPanel title={graph.graphName + " Config"} G={G} setCollapse={setCollapse}>
      <ConfigPanelItem itemHeading="Basic Info">
        <div className="flex items-center">
          <p className="w-16">Goal</p>
          <input className="bg-[#393939] rounded m-2 p-1 caret-white outline-0"
            type={'text'}
            name={'graphName'}
            placeholder={"Project Title"}
            value={graph.graphName} 
            maxLength={35}
            onInput={(e) => handleInputChange(e, "graph", G)}
          />
        </div>

      </ConfigPanelItem>

      <ConfigPanelItem itemHeading="Layers">
        <ul>
          {Array.from(graph.layers.map((layer, index) => {
            if (layer.action === "delete") return null;
            return (
              <li key={index}>
                <div className="flex justify-between items-center">
                  <input className={"border-0 outline-0 bg-[#2A2B34] hover:bg-slate-700 px-4 py-2 w-full rounded"}
                    type={'text'}
                    name={'layerName'}
                    value={layer.name}
                    onInput={(e) => handleInputChange(e, index, G)}
                  />
                  
                  <button onClick={() => {
                    const newLayers = graph.layers.set(index, {
                      ...layer, 
                      visible: !layer.visible, 
                      action: layer.action != "add" ? "update" : "add"
                    });
                    setGraph({...graph, layers: newLayers})
                  }} className={"bg-[#121316] hover:bg-neutral-600 py-2 w-1/4 h-full ml-1 mt-1 rounded"}>
                    {layer.visible ? "V" : "H"}
                  </button>
                  { graph.completeLayerId != index &&
                  <button className="bg-[#121316] hover:bg-rose-700 py-2 w-1/4 h-full ml-1 mt-1 rounded"
                    onClick={() => {
                      const newLayers = graph.layers.set(index, {
                        ...layer, 
                        action: "delete"
                      });
                      setGraph({...graph, layers: newLayers})
                    }}>
                    D
                  </button>
                  }
                  { graph.completeLayerId === index &&
                    <div className="w-1/4 ml-1"></div>
                  }
                </div>
              </li>
            )
          }).values())}
          <li className="my-2 rounded bg-[#2A2B34] hover:bg-slate-700">
            <div className="flex justify-center items-center select-none">
              <button className="w-full h-full px-4 py-2" onClick={
                () => {
                  const newLayers = graph.layers.set(cuid(), {
                    name: "New Layer",
                    visible: true,
                    action: "add"
                  });
                  setGraph({...graph, layers: newLayers})
                }
              }>
                + New Layer
              </button>
            </div>
          </li>
        </ul>
        <div className="flex items-center">
          <input className="m-2" 
            type={'checkbox'} 
            name={'showArchive'} 
            checked={graph.showArchive} 
            onChange={(e) => handleInputChange(e, "graph", G)} 
          />
          <p className="text-xs">Show Archive</p>
        </div>
      </ConfigPanelItem>

      <ConfigPanelItem itemHeading="Properties">
        <div></div>
      </ConfigPanelItem>

      <ConfigPanelItem itemHeading="Apearance">
        <div></div>
      </ConfigPanelItem>

    </ConfigPanel>
  )
}

export const GroupConfigPanel = ({G, setCollapse} : GenericPanelProps) => {
  const {graph, setGraph} = G;
  return (
    <ConfigPanel title={"Group Config"} G={G} setCollapse={setCollapse}>


    </ConfigPanel>
  )
}

export const TreeExplorerPanel = ({G, setCollapse} : GenericPanelProps) => {
  const {graph, setGraph} = G;
  return (
    <ConfigPanel title={"Tree Explorer"} G={G} setCollapse={setCollapse} direction="left">


    </ConfigPanel>
  )
}

function handleInputChange(
  e: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, 
  selectedNode: string,
  G: GState
) {
  const input = e.target as HTMLInputElement | HTMLTextAreaElement;
  const {nodes, setNodes, graph, setGraph} = G;

  input.name === "goal" && setNodes(
    nodes.set(selectedNode, {
      ...nodes.get(selectedNode)!,
      goal: input.value,
      action: "update"
    })
  );

  input.name === "description" && setNodes(
    nodes.set(selectedNode, {
      ...nodes.get(selectedNode)!,
      description: input.value,
      action: "update"
    })
  );

  input.name === "due" && setNodes(
    nodes.set(selectedNode, {
      ...nodes.get(selectedNode)!,
      due: input.value,
      action: "update"
    })
  );

  input.name === "archiveNode" && setNodes(
    nodes.set(selectedNode, {
      ...nodes.get(selectedNode)!,
      archive: !nodes.get(selectedNode)!.archive,
      action: "update"
    })
  );

  input.name === "graphName" && setGraph({
    ...graph,
    graphName: input.value,
  });

  input.name === "showArchive" && setGraph({
    ...graph,
    showArchive: !graph.showArchive
  });

  input.name === "layerName" && setGraph({
    ...graph,
    layers: graph.layers.set(selectedNode, {
      ...graph.layers.get(selectedNode)!,
      name: input.value,
      action: "update"
    }),
    scale: graph.scale + 0.000001
  });


}
