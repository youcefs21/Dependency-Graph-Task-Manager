import Immutable from "immutable";
import { Dispatch, SetStateAction } from "react";
import { graphState, GState, nodeState } from "../Graph/graphHandler";
import { ConfigPanelItem } from "./PanelElements";

interface configPanelProps {
  G: GState,
  title: string, 
  setCollapseConfig: Dispatch<SetStateAction<boolean>>,
  children: JSX.Element | JSX.Element[],
}

export const ConfigPanel = ({G, title, setCollapseConfig, children}: configPanelProps) => {
  const {graph, setGraph} = G
  return (
    <div className={"absolute top-24 right-6 h-5/6 w-80 bg-[#222326] rounded-[34px] text-white font-mono divide-y"}>
        <div className="flex justify-between p-4">
          <h2 className="font-semibold">{title}</h2>
          <button onClick={
            () => {
              setGraph({...graph, selectedNodes: Immutable.Set<string>()})
              setCollapseConfig(true)
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
  const {nodes, setNodes} = G;
  return (
      <ConfigPanel title={nodes.get(selectedNodeID)?.goal ?? " "} G={G} setCollapseConfig={setCollapseConfig}>
        <ConfigPanelItem itemHeading="Basic Node Data">
          <div className="flex items-center">
            <p className="w-16">Goal</p>
            <input className="bg-[#393939] rounded-l m-2 p-1 caret-white outline-0"
              type={'text'}
              name={'goal'}
              placeholder={"short title"}
              value={G.nodes.get(selectedNodeID)?.goal ?? ""} 
              onInput={(e) => handleInputChange(e, selectedNodeID, nodes, setNodes)}
            />
          </div>
          <div className="py-2">
            <p>Description</p>
            <textarea className="bg-[#393939] rounded-l my-2 p-1 caret-white outline-0"
              cols={27}
              rows={5}
              name={'description'}
              placeholder={"long description"}
              value={G.nodes.get(selectedNodeID)?.description ?? ""}
              onInput={(e) => handleInputChange(e, selectedNodeID, nodes, setNodes)}
            />
          </div>
        </ConfigPanelItem>

        <ConfigPanelItem itemHeading="Properties">
          <div></div>
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


function handleInputChange(
  e: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, 
  selectedNode: string,
  nodes: Immutable.Map<string, nodeState>,
  setNodes: Dispatch<SetStateAction<Immutable.Map<string, nodeState>>>
) {
  const input = e.target as HTMLInputElement | HTMLTextAreaElement;

  input.name === "goal" && setNodes(
    nodes.set(selectedNode, {
      ...nodes.get(selectedNode)!,
      goal: input.value,
      action: "update"
    })
  )

  input.name === "description" && setNodes(
    nodes.set(selectedNode, {
      ...nodes.get(selectedNode)!,
      description: input.value,
      action: "update"
    })
  )
}