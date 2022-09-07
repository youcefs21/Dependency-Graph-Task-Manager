import cuid from "cuid";
import Immutable from "immutable";
import { Dispatch, SetStateAction } from "react";
import { isNodeVisible, useWindowDimensions } from "../Graph/Canvas";
import { focusNode } from "../Graph/EventListeners";
import { defaultNode, GState, nodeState } from "../Graph/graphHandler";
import { ConfigPanelItem, SelectLayers } from "./PanelElements";
import { ConfigPanel, GenericPanelProps } from "./Panels";

interface NodeConfigPanelProps {
  G: GState,
  selectedNodeID: string,
  setCollapseConfig: Dispatch<SetStateAction<boolean>>
}


const NodeListItem = ({nodeId, G}: {nodeId: string, G: GState}) => {

  const {nodes} = G;
  const {width, height} = useWindowDimensions();

  const node = nodes.get(nodeId);
  if (!node) return null;
  if (!isNodeVisible(node, G)) return null;
  return (
    <li key={nodeId} className={`mb-1 rounded bg-[#2A2B34] hover:bg-slate-700`}>
      <div className="flex justify-between items-center">
        <button className="w-full h-full text-xs py-1" onClick={(e) => focusNode(G, nodeId, width, height)}>
          {node?.goal ?? " "}
        </button>
      </div>
    </li>
  )
  
}

const BasicNodeInfoSec = ({G, selectedNodeID}: {G: GState, selectedNodeID: string}) => {
  const {nodes} = G;
  const node = nodes.get(selectedNodeID);
  return (
    <ConfigPanelItem itemHeading="Basic Node Info">
      <div className="flex items-center">
        <p className="w-16">Goal</p>
        <input className="bg-[#393939] rounded m-2 p-1 caret-white outline-0 w-56"
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
        <textarea className="bg-[#393939] rounded my-2 p-1 caret-white outline-0 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-900 corner resize-none"
          cols={32}
          rows={8}
          name={'description'}
          placeholder={"long description"}
          value={node?.description ?? ""}
          onInput={(e) => handleInputChange(e, selectedNodeID, G)}
        />
      </div>
    </ConfigPanelItem>
  )

}

const NodePropertiesSec = ({G, selectedNodeID}: {G: GState, selectedNodeID: string}) => {
  const {nodes} = G;
  const node = nodes.get(selectedNodeID);

  return (
    <ConfigPanelItem itemHeading="Properties">
      <div className="flex items-center text-xs">
        <p className="w-16">Due</p>
        <input className="bg-[#393939] rounded m-2 p-1 caret-white outline-0 text-xs"
          type={'datetime-local'}
          name={'due'}
          value={!node?.cascadeDue ? node?.due ?? "" : ""}
          onInput={(e) => handleInputChange(e, selectedNodeID, G)}
        />
      </div>

      <div className="flex items-center text-xs">
        <p className="w-16 my-3">Priority</p>
        <select className={"bg-[#393939] rounded p-1 outline-0 mx-2 w-full"}
          name="priority" 
          value={node?.priority ?? ""} 
          onChange={(e) => handleInputChange(e, selectedNodeID, G)}
        >
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="normal">Normal</option>
          <option value="low">Low</option>
        </select>
      </div>

      <div className="flex items-center text-xs">
        <p className="w-16 mr-1 my-3">Position</p>
        
        <div className="bg-[#393939] text-[#3AB9D4] p-1 rounded-l">x: </div>
        <input className="bg-[#393939] p-1 mr-2 caret-white outline-0 w-1/4 rounded-r"
          type={'number'}
          name={'x'}
          value={node?.x ?? ""}
          onInput={(e) => handleInputChange(e, selectedNodeID, G)}
        />

        <div className="bg-[#393939] p-1 text-[#3AB9D4] rounded-l">y: </div>
        <input className="bg-[#393939] p-1 caret-white outline-0 w-1/4 rounded-r"
          type={'number'}
          name={'y'}
          value={node?.y ?? ""}
          onInput={(e) => handleInputChange(e, selectedNodeID, G)}
        />

      </div>
    </ConfigPanelItem>
  )
}

const NewConnectionsButtons = ({G, parent, relatedNodeId}: {G: GState, parent: boolean, relatedNodeId: string}) => {

  const {nodes, setNodes, edgeAction, setGraph, graph} = G;
  const node = nodes.get(relatedNodeId);
  if (!node) return null;

  const isAddingEdge = parent ? !graph.edgeActionState.parents.isEmpty() : !graph.edgeActionState.children.isEmpty()

  return (
    <div className="flex">
      <button className="my-1 mr-1 p-1 rounded bg-[#2A2B34] hover:bg-slate-700 w-full"
        onClick={() => {
          const newId = cuid();
          setNodes((nodes) => {
            return nodes.set(newId, {
              ...defaultNode, 
              x: node.x + 16,
              y: node.y + (parent ? 12 : -12),
            })
          })
          if (parent) {
            edgeAction("add", relatedNodeId, newId)
          }
          else {
            edgeAction("add", newId, relatedNodeId)
          }
        }}
      >
        + New Node
      </button>
      <button className={`my-1 ml-1 p-1 rounded ${ isAddingEdge ? "bg-blue-500 hover:bg-blue-600 text-white" : "bg-[#2A2B34] hover:bg-slate-700"} w-full`}
        onClick={() => {
          if (isAddingEdge) return;
          setGraph((graph) => {
            if (parent) {
              return {
                ...graph,
                edgeActionState: {
                  ...graph.edgeActionState,
                  parents: graph.edgeActionState.parents.add(relatedNodeId),
                  action: "addEdge"
                }
              }
            } else {
              return {
                ...graph,
                edgeActionState: {
                  ...graph.edgeActionState,
                  children: graph.edgeActionState.children.add(relatedNodeId),
                  action: "addEdge"
                }
              }
            }
          })
          
        }}
      >
        + Existing Node
      </button>
    </div>
  )
}

const NodeConnectionsSec = ({G, selectedNodeID}: {G: GState, selectedNodeID: string}) => {
  const { nodes } = G;
  const node = nodes.get(selectedNodeID);
  if (!node) return null;

  return (
    <ConfigPanelItem itemHeading="Connections">
      <h3 className="mt-2">Dependent Nodes (do after)</h3>
      <ul>
        {node?.dependentIds?.map((id) => (<NodeListItem key={id} nodeId={id} G={G} />))}
      </ul>

      <NewConnectionsButtons G={G} parent={false} relatedNodeId={selectedNodeID} />

      <h3 className="mt-2">Node Dependencies (do before)</h3>
      <ul>
        {node?.dependencyIds?.map((id) => (<NodeListItem key={id} nodeId={id} G={G} />))}
      </ul>
      <NewConnectionsButtons G={G} parent={true} relatedNodeId={selectedNodeID} />

    </ConfigPanelItem>
  )
}

const NodeLayersSec = ({G, selectedNodeID}: {G: GState, selectedNodeID: string}) => {
  const {nodes, graph} = G;
  let isArchive = true
  if (selectedNodeID === "group") {
    graph.selectedNodes.forEach((id) => {
      if (!nodes.get(id)?.archive) isArchive = false;
    })
  } else {
    const node = nodes.get(selectedNodeID);
    if (!node) return null;
    isArchive = node.archive
  }

  return (
    <ConfigPanelItem itemHeading="Select Layers">
      <SelectLayers G={G} nodeID={selectedNodeID} />
      <div className="flex items-center">
        <input className="m-2" 
          type={'checkbox'} 
          name={'archiveNode'} 
          checked={isArchive} 
          onChange={(e) => handleArchive(e, selectedNodeID, G, isArchive)} 
        />
        <p className="text-xs">Archive Node</p>
      </div>
    </ConfigPanelItem>
  )
}

const NodeApearanceSec = ({G, selectedNodeID}: {G: GState, selectedNodeID: string}) => {
  const {nodes} = G;
  const node = nodes.get(selectedNodeID);

  return (
    <ConfigPanelItem itemHeading="Apearance">
      <div></div>
    </ConfigPanelItem>
  )
}

export const NodeConfigPanel = ({G, selectedNodeID, setCollapseConfig}: NodeConfigPanelProps) => {
  const {nodes} = G;
  const node = nodes.get(selectedNodeID);
  return (
    <ConfigPanel title={node?.goal ?? " "} G={G} setCollapse={setCollapseConfig}>

      <BasicNodeInfoSec G={G} selectedNodeID={selectedNodeID} />
      <NodePropertiesSec G={G} selectedNodeID={selectedNodeID} />
      <NodeConnectionsSec G={G} selectedNodeID={selectedNodeID} />
      <NodeLayersSec G={G} selectedNodeID={selectedNodeID} />
      <NodeApearanceSec G={G} selectedNodeID={selectedNodeID} />
    
    </ConfigPanel>
  )  

}

export const GroupConfigPanel = ({G, setCollapse} : GenericPanelProps) => {
  return (
    <ConfigPanel title={"Group Config"} G={G} setCollapse={setCollapse}>

      <NodeLayersSec G={G} selectedNodeID={"group"} />

    </ConfigPanel>
  )
}

function cascadeDueDate(nodeID: string, ns: Immutable.Map<string, nodeState>): Immutable.Map<string, nodeState> {

  const node = ns.get(nodeID)!;

  node.dependencyIds.forEach((id) => {
    const dep = ns.get(id);
    if (!dep) return;
    if (dep.cascadeDue) {
      ns = ns.set(id, {
        ...dep,
        due: node.due,
        action: "update"
      });
    }
    ns = cascadeDueDate(id, ns);
  })
  return ns;
}


function handleArchive(
  e: React.FormEvent<HTMLInputElement>,
  selectedNode: string,
  G: GState,
  isArchived: boolean
) {
  const input = e.target as HTMLInputElement;
  const {setNodes, graph} = G;

  input.name === "archiveNode" && setNodes((nodes) => {
      if (selectedNode === "group") {
        graph.selectedNodes.forEach((id) => {
          nodes = nodes.set(id, {
            ...nodes.get(id)!,
            archive: !isArchived,
            action: "update"
          })
        })
        return nodes;
      } else {
        return nodes.set(selectedNode, {
          ...nodes.get(selectedNode)!,
          archive: !nodes.get(selectedNode)!.archive,
          action: "update"
        })
      }
    }
  );

}

function handleInputChange(
  e: React.FormEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>, 
  selectedNode: string,
  G: GState
) {
  const input = e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
  const {nodes, setNodes, graph, setGraph} = G;

  input.name === "goal" && setNodes( nodes => 
    nodes.set(selectedNode, {
      ...nodes.get(selectedNode)!,
      goal: input.value,
      action: "update"
    })
  );

  input.name === "description" && setNodes( nodes =>
    nodes.set(selectedNode, {
      ...nodes.get(selectedNode)!,
      description: input.value,
      action: "update"
    })
  );

  if (input.name === "due") {
    const node = nodes.get(selectedNode)!;
    let due = input.value;
    node.dependentIds.forEach((id) => {
      const dep = nodes.get(id)!;
      if (dep.due && (Date.parse(dep.due) < Date.parse(due) || due === "")) {
        due = dep.due;
      }
    })
    if (due != input.value) {
      console.log("the latest this node can be due is", due);
    }
    setNodes(nodes =>
      cascadeDueDate(selectedNode, nodes.set(selectedNode, {
        ...node,
        due: due,
        cascadeDue: input.value === "",
        action: "update"
      }))
    );
  }

  input.name === "priority" && setNodes(nodes =>
    nodes.set(selectedNode, {
      ...nodes.get(selectedNode)!,
      priority: input.value,
      action: "update"
    })
  );

  input.name === "x" && setNodes(nodes =>
    nodes.set(selectedNode, {
      ...nodes.get(selectedNode)!,
      x: Number(input.value),
      action: "update"
    })
  );

  input.name === "y" && setNodes(nodes =>
    nodes.set(selectedNode, {
      ...nodes.get(selectedNode)!,
      y: Math.floor(Number(input.value)),
      action: "update"
    })
  );



}