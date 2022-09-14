import Immutable from "immutable";
import { Dispatch, SetStateAction } from "react";
import { GState } from "../Graph/graphHandler";

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
      <div className="p-4 overflow-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-900 h-5/6 corner">
        {children}
      </div>
    </div>
  );
}



export interface GenericPanelProps {
  G: GState,
  setCollapse: Dispatch<SetStateAction<boolean>> 
}
  

