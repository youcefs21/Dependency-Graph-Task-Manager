import { isNodeVisible, useWindowDimensions } from "../Graph/Canvas";
import { focusNode } from "../Graph/EventListeners";
import { GState, nodeState } from "../Graph/graphHandler"


export const ConfigPanelItem = ({itemHeading, children}: {itemHeading: string, children: JSX.Element | JSX.Element[]}) => {
  return (
    <div className="p-2">
      <h3 className="text-sm">{itemHeading}</h3>
      <div className="text-xs text-[#BDBDBD] pl-3">
        {children}
      </div>
    </div>
  )
}

export const SelectLayers = ({G, nodeID} : {G: GState, nodeID: string}) => {
  const {graph, nodes, setNodes} = G;
  const node = nodes.get(nodeID);
  return (
    <ul>
      {Array.from(graph.layers.map((layer, layerID) => {
        let isSelected = true;
        if (nodeID === "group") {
          graph.selectedNodes.forEach((id) => {
            const node = nodes.get(id);
            isSelected = (node?.layerIds.has(layerID) && node.layerIds.get(layerID) != "delete" && isSelected) ?? false;
          })
        }
        else {
          isSelected = (node?.layerIds.has(layerID) && node?.layerIds.get(layerID) != "delete") ?? false;
        }
        if (layer.action === "delete") return null;
        return (
          <li key={layerID} 
          className={`my-1 rounded ${!isSelected ? 'bg-[#2A2B34] hover:bg-slate-700' : 'bg-blue-500 text-white'}`}>
            <div className="flex justify-between items-center">
              <button className="w-full h-full text-xs py-1" 
                onClick={() => handleLayers(nodeID, G, isSelected, layerID)}>
                {layer.name}
              </button>
            </div>
          </li>
        )
      }).values())}
    </ul>
  )
}


function unselectLayer(G: GState, layerID: string, nodeID: string) {
  const {nodes, setNodes} = G;
  const node = nodes.get(nodeID);
  // should return if node is null or layerID is not in node.layerIds
  if (!node || !node.layerIds.has(layerID)) return;
  if (node.layerIds.get(layerID) === "add") {
    setNodes(nodes => nodes.set(nodeID, {
      ...node,
      layerIds: node.layerIds.delete(layerID)
    }))
  } else {
    setNodes(nodes => nodes.set(nodeID, {
      ...node,
      layerIds: node.layerIds.set(layerID, "delete")
    }));
  }
}

function selectLayer(G: GState, layerID: string, nodeID: string) {
  const {nodes, setNodes, graph} = G;
  const node = nodes.get(nodeID);
  // should return if node is null or layerID is already in node.layerIds
  if (!node) return;
  if (node.layerIds.get(layerID) === "delete") {
    setNodes(nodes => nodes.set(nodeID, {
      ...node,
      layerIds: node.layerIds.set(layerID, "nothing"),
      animation: layerID === graph.completeLayerId ? {animation: "complete", startTime: Date.now()} : node.animation
    }))
  } else {
    setNodes(nodes => nodes.set(nodeID, {
      ...node, 
      layerIds: node.layerIds.set(layerID, "add"),
      animation: layerID === graph.completeLayerId ? {animation: "complete", startTime: Date.now()} : node.animation
    }));
  }
}

function handleLayers(nodeID: string, G: GState, isSelected: boolean, layerID: string) {
  const {nodes, setNodes, graph, setGraph} = G;
  if (nodeID === "group") {
    if (isSelected) {
      // unselect the layer from all nodes
      graph.selectedNodes.forEach((id) => {
        unselectLayer(G, layerID, id);
      });
    } else {
      // select the layer for all nodes
      graph.selectedNodes.forEach((id) => {
        selectLayer(G, layerID, id);
      });
    }

  } else {
    const node = nodes.get(nodeID);
    if (!node) return;

    if (isSelected) {
      unselectLayer(G, layerID, nodeID);
    } else {
      selectLayer(G, layerID, nodeID);
    }
  }
}