import imt from "immutable";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { isNodeVisible, parseDeltaTime, useWindowDimensions } from "../Graph/Canvas";
import { focusNode } from "../Graph/EventListeners";
import { GState } from "../Graph/graphHandler";
import { ConfigPanel } from "./Panels";

type NodeIdTree = [string, imt.List<NodeIdTree>]
// I can store the cords of each node in the tree in a map{nodeID: [l1,l2,...ln]}, and then only change nodes that changed
// that's a latter optimization

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
}


const DiceIcon = () => {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="0.5" y="0.5" width="15" height="15" rx="1.5" stroke="#D9D9D9"/>
      <rect x="3" y="11" width="2" height="2" rx="1" fill="#D9D9D9"/>
      <rect x="7" y="7" width="2" height="2" rx="1" fill="#D9D9D9"/>
      <rect x="11" y="3" width="2" height="2" rx="1" fill="#D9D9D9"/>
    </svg>
  )
}


const TreeIcon = () => {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="0.5" y="0.5" width="7" height="3" stroke="#D9D9D9"/>
      <rect x="8.5" y="6.5" width="7" height="3" stroke="#D9D9D9"/>
      <rect x="8.5" y="12.5" width="7" height="3" stroke="#D9D9D9"/>
      <line x1="3.5" y1="4" x2="3.5" y2="14" stroke="#D9D9D9"/>
      <line x1="3" y1="7.5" x2="8" y2="7.5" stroke="#D9D9D9"/>
      <line x1="3" y1="13.5" x2="8" y2="13.5" stroke="#D9D9D9"/>
    </svg>
  )
}

export const TreeExplorerPanel = ({G, setCollapse} : TreePanelProps) => {
  const {nodes, graph, setGraph} = G;
  const [search, setSearch] = useState("");
  let tree = imt.List<NodeIdTree>()
  const visited = new Set<string>();
  let leafs: string[] = [];
  const {width, height} = useWindowDimensions();
  const [onlyLeafs, setOnlyLeafs] = useState<boolean>(false);

  function fillTree(nodeId: string): NodeIdTree {
    const node = nodes.get(nodeId);
    let out = imt.List<NodeIdTree>();
    let visitedNodes = new Set<string>();
    if (!node) return [nodeId, out]
    node.dependencyIds.forEach((id) => {
      const n = nodes.get(id);
      if (!n) return;
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
    const visibleDependencies = node.dependencyIds.filter((id) => {
      const n = nodes.get(id);
      if (!n) return false;
      return isNodeVisible(n, G)
    })
    if (!node.goal.toLowerCase().includes(search.toLowerCase()) || !isNodeVisible(node, G)) {
      return ["flatten", out]
    }
    else if (!visited.has(nodeId) && visibleDependencies.size === 0) {
      leafs.push(nodeId);
      visited.add(nodeId);
    }
    out = out.sort((a, b) => {
      const nodeBDue = nodes.get(b[0])?.due;
      const nodeADue = nodes.get(a[0])?.due;
      if (!nodeADue) return Infinity;
      if (!nodeBDue) return -Infinity;
      return Date.parse(nodeADue) - Date.parse(nodeBDue);
    })
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
      <div className="sticky -top-4 -left-4 -mx-4 -mt-4 p-4 bg-[#222326]">
        {graph.treeFocus !== "root" &&
        <button className="bg-[#2A2B34] hover:bg-slate-700 px-2 m-2 rounded ml-1 mr-0"
          onClick={() => setGraph(graph => ({...graph, treeFocus: "root"}))}>
          <p className="text-center text-xs">Back</p>
        </button>
        }
        <div className="flex gap-2 items-center">
          <div>
            <input 
            className="bg-[#393939] rounded py-1 px-3 caret-white outline-0 text-xs w-48"
            type={"text"}
            placeholder={"Search"}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            ></input>
          </div>
          <button 
            className={`w-fit h-fit p-1 rounded-md ${onlyLeafs ? 'bg-[#2A2B34] hover:bg-neutral-700' : 'bg-blue-500'} `} 
            onClick={() => setOnlyLeafs((onlyLeafs) => !onlyLeafs)}
          >
            <div className="w-[16px] h-[16px]">
              <TreeIcon />
            </div>
          </button>
          {onlyLeafs &&
          <button className="w-fit h-fit bg-[#2A2B34] hover:bg-slate-700 p-1 rounded"
            onClick={() => focusNode(G, leafs[Math.floor(Math.random()*leafs.length)]!, width, height)}
            >
              <div className="w-[16px] h-[16px]">
                <DiceIcon />
              </div>
          </button>
          }
        </div>
      </div>
      <div className="whitespace-nowrap w-fit">
        <ul className="pl-1 text-xs">
        { onlyLeafs &&
          leafs.sort((a, b) => {
            const nodeBDue = nodes.get(b)?.due;
            const nodeADue = nodes.get(a)?.due;
            if (!nodeADue) return Infinity;
            if (!nodeBDue) return -Infinity;
            return Date.parse(nodeADue) - Date.parse(nodeBDue);
          }).map((nodeId) => {
            return <ListElement G={G} nodeIdTree={[nodeId, imt.List()]} search={search} key={nodeId} />
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
