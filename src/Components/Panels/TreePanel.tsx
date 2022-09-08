import { Dispatch, SetStateAction } from "react";
import { isNodeVisible, parseDeltaTime, useWindowDimensions } from "../Graph/Canvas";
import { focusNode } from "../Graph/EventListeners";
import { GState } from "../Graph/graphHandler";
import { ConfigPanel } from "./Panels";

const ListElement = ({G, nodeId}: {G: GState, nodeId: string}) => {
  const {nodes, setNodes, setGraph} = G;
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
        <button 
          className={`pr-6 text-left ${visibleDependencies.size > 0 ? "ml-3" : "ml-9"}`} 
          onClick={() => focusNode(G, nodeId, width, height)}
          >
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


  rootNodes.sort((a, b) => {
    const nodeBDue = nodes.get(b)?.due;
    const nodeADue = nodes.get(a)?.due;
    if (!nodeADue) return Infinity;
    if (!nodeBDue) return -Infinity;
    return Date.parse(nodeADue) - Date.parse(nodeBDue);
  })

  const title = nodes.get(graph.treeFocus)?.goal ?? ""
  return (
    <ConfigPanel title={onlyLeafs ? "Leaf Explorer" : "Tree Explorer"} G={G} setCollapse={setCollapse} direction="left">
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
