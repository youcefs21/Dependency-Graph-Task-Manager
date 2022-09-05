import cuid from "cuid";
import { GState } from "../Graph/graphHandler";
import { ConfigPanelItem } from "./PanelElements";
import { ConfigPanel, GenericPanelProps } from "./Panels";


const GraphBasicInfoSec = ({G}: {G: GState}) => {
  const {graph} = G;

  return (
    <ConfigPanelItem itemHeading="Basic Info">
      <div className="flex items-center">
        <p className="w-16">Title</p>
        <input className="bg-[#393939] rounded m-2 py-1 px-2 w-56 caret-white outline-0"
          type={'text'}
          name={'graphName'}
          placeholder={"Project Title"}
          value={graph.graphName} 
          maxLength={35}
          onInput={(e) => handleInputChange(e, "graph", G)}
        />
      </div>
    </ConfigPanelItem>
  )
}

const GraphLayersSec = ({G}: {G: GState}) => {
  const {graph, setGraph} = G;
  
  return (
    <ConfigPanelItem itemHeading="Layers">
      <ul>
        {
        Array.from(graph.layers.map((layer, index) => {
          if (layer.action === "delete") return null;
          return (
            <li key={index}>
              <div className="grid grid-cols-7 gap-1 my-1">
                
                <input className={"border-0 outline-0 bg-[#2A2B34] hover:bg-slate-700 pl-3 py-1 col-span-5 rounded"}
                  type={'text'}
                  name={'layerName'}
                  value={layer.name}
                  onInput={(e) => handleInputChange(e, index, G)}
                />
                
                <button onClick={() => setGraph(graph => ({
                  ...graph, 
                  layers: graph.layers.set(index, {
                    ...layer, 
                    visible: !layer.visible, 
                    action: layer.action != "add" ? "update" : "add"
                  })
                }))} 
                className={"bg-[#121316] hover:bg-neutral-600 p-1 rounded"}>
                  {layer.visible ? "V" : "H"}
                </button>

                {
                  graph.completeLayerId != index &&
                  <button className="bg-[#121316] hover:bg-rose-700 p-1 rounded"
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
              </div>
            </li>
          )
        }).values())}
        <li className="my-2 rounded bg-[#2A2B34] hover:bg-slate-700">
          <div className="flex justify-center items-center select-none">
            <button className="w-full h-full py-1" onClick={
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
  )
}


export const GraphConfigPanel = ({G, setCollapse} : GenericPanelProps) => {
  const {graph, setGraph} = G;
  return (
    <ConfigPanel title={graph.graphName + " Config"} G={G} setCollapse={setCollapse}>

      <GraphBasicInfoSec G={G} />
      <GraphLayersSec G={G} />

      <ConfigPanelItem itemHeading="Properties">
        <div></div>
      </ConfigPanelItem>

      <ConfigPanelItem itemHeading="Apearance">
        <div></div>
      </ConfigPanelItem>

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