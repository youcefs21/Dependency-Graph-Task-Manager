import { GState } from "../Graph/graphHandler"


export const ConfigPanelItem = ({itemHeading, children}: {itemHeading: string, children: JSX.Element | JSX.Element[]}) => {
  return (
    <div className="p-2">
      <h3>{itemHeading}</h3>
      <div className="text-sm text-[#BDBDBD] pl-3">
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
        const isSelected = node?.layerIds.has(layerID) && node?.layerIds.get(layerID) != "delete";
        return (
          <li key={layerID} 
          className={`my-2 rounded ${!isSelected ? 'bg-[#2A2B34] hover:bg-slate-700' : 'bg-blue-500 text-white'}`}>
            <div className="flex justify-between items-center">
              <button className="w-full h-full px-4 py-2" 
                onClick={() => {
                  if (!node) return;
                  
                  if (isSelected) {
                    if (node.layerIds.get(layerID) === "delete") {
                      setNodes(nodes.set(nodeID, {
                        ...node,
                        layerIds: node.layerIds.delete(layerID)
                      }))
                    } else {
                      setNodes(nodes.set(nodeID, {
                        ...node,
                        layerIds: node.layerIds.set(layerID, "delete")
                      }));
                    }
                  } else {
                    setNodes(nodes.set(nodeID, {
                      ...node, 
                      layerIds: node.layerIds.set(layerID, "add")
                    }));
                  }
                }}>
                {layer.name}
              </button>
            </div>
          </li>
        )
      }).values())}
    </ul>
  )
}