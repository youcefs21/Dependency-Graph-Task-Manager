import Immutable from "immutable";
import { Dispatch, SetStateAction } from "react";
import { graphState, GState, nodeState } from "../Graph/graphHandler";
import { ConfigPanelItem } from "./PanelElements";

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
  const {nodes, setNodes} = G;
  return (
    <ConfigPanel title={nodes.get(selectedNodeID)?.goal ?? " "} G={G} setCollapse={setCollapseConfig}>
      <ConfigPanelItem itemHeading="Basic Node Data">
        <div className="flex items-center">
          <p className="w-16">Goal</p>
          <input className="bg-[#393939] rounded m-2 p-1 caret-white outline-0"
            type={'text'}
            name={'goal'}
            placeholder={"short title"}
            value={nodes.get(selectedNodeID)?.goal ?? ""} 
            maxLength={35}
            onInput={(e) => handleInputChange(e, selectedNodeID, nodes, setNodes)}
          />
        </div>
        <div className="py-2">
          <p>Description</p>
          <textarea className="bg-[#393939] rounded my-2 p-1 caret-white outline-0"
            cols={27}
            rows={5}
            name={'description'}
            placeholder={"long description"}
            value={nodes.get(selectedNodeID)?.description ?? ""}
            onInput={(e) => handleInputChange(e, selectedNodeID, nodes, setNodes)}
          />
        </div>
      </ConfigPanelItem>

      <ConfigPanelItem itemHeading="Properties">
        <div className="flex items-center">
          <p className="w-16">Due</p>
          <input className="bg-[#393939] rounded m-2 p-1 caret-white outline-0 text-xs"
            type={'datetime-local'}
            name={'due'}
            onInput={(e) => handleInputChange(e, selectedNodeID, nodes, setNodes)}
          />
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
    <ConfigPanel title={"Graph Config"} G={G} setCollapse={setCollapse}>
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
  nodes: Immutable.Map<string, nodeState>,
  setNodes: Dispatch<SetStateAction<Immutable.Map<string, nodeState>>>
) {
  const input = e.target as HTMLInputElement | HTMLTextAreaElement;
  console.log(input.value)

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
