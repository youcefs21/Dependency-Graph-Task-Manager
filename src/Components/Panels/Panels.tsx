import cuid from "cuid";
import Immutable from "immutable";
import { Dispatch, SetStateAction, useState } from "react";
import { isNodeVisible, parseDeltaTime } from "../Graph/Canvas";
import { GState } from "../Graph/graphHandler";
import { ConfigPanelItem } from "./PanelElements";

export interface configPanelProps {
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
            setGraph(graph => ({...graph, selectedNodes: Immutable.Set<string>()}))
            setCollapse(true)
          }
        }>close</button>
      </div>
      <div className="divide-y p-4 overflow-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-900 h-5/6 corner">
        {children}
      </div>
    </div>
  );
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
                    setGraph(graph => ({...graph, layers: newLayers}))
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
                      setGraph(graph => ({...graph, layers: newLayers}))
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
                  setGraph(graph => ({...graph, layers: newLayers}))
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
  return (
    <ConfigPanel title={"Group Config"} G={G} setCollapse={setCollapse}>


    </ConfigPanel>
  )
}

const ListElement = ({G, nodeId}: {G: GState, nodeId: string}) => {
  const {nodes, setNodes, setGraph} = G;
  const node = nodes.get(nodeId);

  if (!node) return null;

  const datetime = node.due ? Date.parse(node.due) : undefined
  let delta = undefined
  let color = undefined
  if (datetime) {
    delta = datetime - Date.now()
    color = delta > 1000*60*60*24 ? "lime" : (delta > 1000*60*60 ? "orange" : "red") ;
  }
  const visibleDependencies = node.dependencyIds.filter((id) => {
    const n = nodes.get(id);
    if (!n) return false;
    return isNodeVisible(n, G);
  })

  return (
      <li className="pl-3">
        <div className="flex items-center hover:bg-slate-600 py-1 ml-[-11.5px] rounded w-fit">
          { visibleDependencies.size > 0 &&
            <button onClick={() => setNodes((nodes) => {
              const node = nodes.get(nodeId);
              if (!node) return nodes;
              return nodes.set(nodeId, {...node, treeCollapse: !node.treeCollapse})
            }) } className="p-2">
              <div className={node.treeCollapse ? "-rotate-90" : ""}>
                <svg width="9" height="7" viewBox="0 0 9 7" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4.5 7L0.602886 0.25L8.39711 0.25L4.5 7Z" fill="#D9D9D9"/>
                </svg>
              </div>
            </button>
          }
          <button className={`pr-6 text-left ${visibleDependencies.size > 0 ? "ml-3" : "ml-9"}`} onDoubleClick={() => setGraph((graph) => ({...graph, treeFocus: nodeId}))}>
            {delta &&
              <p className="text-[12px] font-bold font-mono" style={{color: color}}>{parseDeltaTime(delta)}</p>
            }
            <p>{node.goal}</p>
          </button>
        </div>
        { !node.treeCollapse &&
        <ListContainer G={G} nodeId={nodeId} />
        }
      </li>
  )
}

const ListContainer = ({G, nodeId}: {G: GState, nodeId: string}) => {
  const {nodes} = G;
  const node = nodes.get(nodeId);

  if (!node) return null;

  return (
    <ul className="border-l-2 border-slate-700">
      {node.dependencyIds.map((id) => {
        const n = nodes.get(id);
        if (!n || !isNodeVisible(n, G)) return null;
        return (
          <ListElement G={G} nodeId={id} key={id} />
        )
      })}
    </ul>
  )
}

interface TreePanelProps {
  G: GState,
  setCollapse: Dispatch<SetStateAction<boolean>>,
  onlyLeafs: boolean
}

export const TreeExplorerPanel = ({G, setCollapse, onlyLeafs} : TreePanelProps) => {
  const {nodes, graph, setGraph} = G;
  const rootNodes: string[] = []
  const visitedNodes: Set<string> = new Set();

  function leafFinder(nodeId: string) {
    const node = nodes.get(nodeId);
    if (!node) return;
    const visibleDependencies = node.dependencyIds.filter((id) => {
      const n = nodes.get(id);
      if (!n) return false;
      return isNodeVisible(n, G);
    })
    if (visibleDependencies.size === 0  && !visitedNodes.has(nodeId)) {
      rootNodes.push(nodeId);
      visitedNodes.add(nodeId);
    } else {
      node.dependencyIds.forEach(leafFinder)
    }
  }

  if (graph.treeFocus === "root" && !onlyLeafs) {
    nodes.forEach((node, nodeId) => {
      if (node.dependentIds.size === 0){
        rootNodes.push(nodeId)
      }
    })
  } else if (graph.treeFocus !== "root" && onlyLeafs){
    leafFinder(graph.treeFocus)
  }
  else if (graph.treeFocus === "root") {
    nodes.forEach((node, nodeId) => {
      const visibleDependencies = node.dependencyIds.filter((id) => {
        const n = nodes.get(id);
        if (!n) return false;
        return isNodeVisible(n, G);
      })
      if (visibleDependencies.size === 0){
        rootNodes.push(nodeId)
      }
    })
  }
  else {
    rootNodes.push(graph.treeFocus)
  }
  const title = nodes.get(graph.treeFocus)?.goal ?? ""
  return (
    <ConfigPanel title={"Tree Explorer"} G={G} setCollapse={setCollapse} direction="left">
      <div className="whitespace-nowrap w-fit">
      <div className="sticky -top-4 -mt-4 pt-4 pb-2 bg-[#222326]">
        {graph.treeFocus !== "root" &&
        <>
          <p className="text-xs">{title}</p>
          <button className="bg-[#2A2B34] hover:bg-slate-700 p-2 ml-1 mt-1 rounded"
            onClick={() => setGraph(graph => ({...graph, treeFocus: "root"}))}>
            <p className="text-center text-xs">Back to Root</p>
          </button>
        </>
        }
      </div>
        <ul className="pl-1 text-xs">
        {
          rootNodes.map(nodeId => {
            const n = nodes.get(nodeId);
            if (!n || !isNodeVisible(n, G)) return null;
            return <ListElement key={nodeId} G={G} nodeId={nodeId} />
        })
        }
        </ul>
      </div>

    </ConfigPanel>
  )
}


function handleInputChange(
  e: React.FormEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>, 
  selectedNode: string,
  G: GState
) {
  const input = e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
  const {setGraph} = G;

  input.name === "graphName" && setGraph(graph => ({
    ...graph,
    graphName: input.value,
  }));

  input.name === "showArchive" && setGraph(graph => ({
    ...graph,
    showArchive: !graph.showArchive
  }));

  input.name === "layerName" && setGraph(graph => ({
    ...graph,
    layers: graph.layers.set(selectedNode, {
      ...graph.layers.get(selectedNode)!,
      name: input.value,
      action: "update"
    }),
    scale: graph.scale + 0.000001
  }));


}
