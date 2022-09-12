import cuid from "cuid";
import Immutable from "immutable";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { isNodeVisible, parseDeltaTime, useWindowDimensions } from "../Graph/Canvas";
import { focusNode } from "../Graph/EventListeners";
import { GState } from "../Graph/graphHandler";
import { ConfigPanel } from "./Panels";

type NodeIdTree = [string, Immutable.List<NodeIdTree>]

const ListElement = ({G, nodeIdTree, search}: {G: GState, nodeIdTree: NodeIdTree, search: string}) => {
  const {nodes, setNodes} = G;
  const [nodeId, nodeTree] = nodeIdTree;
  const node = nodes.get(nodeId);
  const {width, height} = useWindowDimensions();

  if (!node) return null;

  const datetime = node.due ? Date.parse(node.due) : undefined
  let delta = undefined
  let color = undefined
  if (datetime) {
    delta = datetime - Date.now()
    color = delta > 1000*60*60*24 ? "lime" : (delta > 1000*60*60 ? "orange" : "red") ;
  }


  return (
    <li className="pl-3">
      <div className="flex items-center hover:bg-slate-600 py-1 ml-[-11.5px] rounded w-fit">
        { nodeTree.size > 0 &&
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
        <button 
          className={`pr-6 text-left ${nodeTree.size > 0 ? "ml-3" : "ml-9"}`} 
          onClick={() => focusNode(G, nodeId, width, height)}
          >
          {delta &&
            <p className="text-[12px] font-bold font-mono" style={{color: color}}>{parseDeltaTime(delta)}</p>
          }
          <p>{node.goal}</p>
        </button>
      </div>
      { !node.treeCollapse &&
      <ListContainer G={G} nodeIdTree={nodeIdTree} search={search} key={nodeId} />
      }
    </li>
  )
}

const ListContainer = ({G, nodeIdTree, search}: {G: GState, nodeIdTree: NodeIdTree, search: string}) => {
  const {nodes} = G;
  const [nodeId, nodeTree] = nodeIdTree;

  return (
    <ul className="border-l-2 border-slate-700">
      {nodeTree.map(([childId, childTree], index) => {
        const node = nodes.get(childId);
        if (!node) return null;
        return (
          <ListElement G={G} nodeIdTree={[childId, childTree]} search={search} key={index} />
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
  const [search, setSearch] = useState("");
  let tree = Immutable.List<NodeIdTree>()
  const visited = new Set<string>();
  let leafs: string[] = [];

  function fillTree(nodeId: string): NodeIdTree {
    const node = nodes.get(nodeId);
    let out = Immutable.List<NodeIdTree>();
    let visitedNodes = new Set<string>();
    if (!node) return [nodeId, out]
    node.dependencyIds.forEach((id) => {
      const n = nodes.get(id);
      if (!n) return;
      if (!isNodeVisible(n, G)) return
      let [childId, childTree] = fillTree(id);
      if (childId === "flatten") {
        childTree.forEach(([childId2, childTree2]) => {
          if (!visitedNodes.has(childId2)) {
            visitedNodes.add(childId2)
            out = out.push([childId2, childTree2])
          }
        })
     } else {
      if (!visitedNodes.has(childId)){
        out = out.push([childId, childTree])
        visited.add(childId)
      }
     }
    })
    if (!node.goal.toLowerCase().includes(search.toLowerCase())) {
      return ["flatten", out]
    }
    if (!visited.has(nodeId) && node.dependencyIds.size === 0) {
      leafs.push(nodeId);
      visited.add(nodeId);
    }
    return [nodeId, out]
  }

  if (graph.treeFocus === "root") {
    let visitedNodes = new Set<string>()
    nodes.forEach((node, nodeId) => {
      if (node.dependentIds.size === 0){
        const [childId, childTree] = fillTree(nodeId);
        if (childId === "flatten") {
          childTree.forEach(([childId2, childTree2]) => {
            if (!visitedNodes.has(childId2)) {
              tree = tree.push([childId2, childTree2])
              visitedNodes.add(childId2)
            }
          })
        } else {
          if (!visitedNodes.has(childId)){
            tree = tree.push([childId, childTree]);
            visitedNodes.add(childId);
          }
        }
      }
    })
  } else {
    tree = tree.push(fillTree(graph.treeFocus));
  }



  const title = nodes.get(graph.treeFocus)?.goal ?? ""
  return (
    <ConfigPanel title={onlyLeafs ? "Leaf Explorer" : "Tree Explorer"} G={G} setCollapse={setCollapse} direction="left">
      <div className="whitespace-nowrap w-fit">
        <div className="sticky -top-4 -mt-4 pt-4 pb-2 bg-[#222326] flex">
          <div>
            <input 
            className="bg-[#393939] rounded m-2 p-1 caret-white outline-0 text-xs"
            type={"text"}
            placeholder={"Search"}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            ></input>
          </div>
          {graph.treeFocus !== "root" &&
          <>
            <button className="bg-[#2A2B34] hover:bg-slate-700 p-2 ml-1 mt-1 rounded"
              onClick={() => setGraph(graph => ({...graph, treeFocus: "root"}))}>
              <p className="text-center text-xs">Back to Root</p>
            </button>
          </>
          }
        </div>
        <ul className="pl-1 text-xs">
        { onlyLeafs &&
          leafs.sort((a, b) => {
            const nodeBDue = nodes.get(b)?.due;
            const nodeADue = nodes.get(a)?.due;
            if (!nodeADue) return Infinity;
            if (!nodeBDue) return -Infinity;
            return Date.parse(nodeADue) - Date.parse(nodeBDue);
          }).map((nodeId) => {
            return <ListElement G={G} nodeIdTree={[nodeId, Immutable.List()]} search={search} key={nodeId} />
          })
        }
        {!onlyLeafs &&
          tree.map(([nodeId, nodeIdTree]) => {
            return <ListElement G={G} nodeIdTree={[nodeId, nodeIdTree]} search={search} key={nodeId + "a"} />
          })
        }
        </ul>
      </div>

    </ConfigPanel>
  )
}
