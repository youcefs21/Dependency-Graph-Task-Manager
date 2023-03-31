import imt from "immutable";
import { Dispatch, SetStateAction } from "react";
import { GState } from "../Graph/graphHandler";
import {CloseIcon} from "../Icons";

export interface configPanelProps {
  G: GState,
  title: string, 
  setCollapse: Dispatch<SetStateAction<boolean>>,
  direction?: "right" | "left",
  children: JSX.Element | JSX.Element[],
}

export const ConfigPanel = ({G, title, setCollapse, direction = "right", children}: configPanelProps) => {
  const {graph, setGraph} = G
  const style = direction === "right" ? {right: "1rem"} : {left: "1rem"}
  return (
    <div className={`absolute top-20 bottom-6 rounded-3xl max-w-sm w-1/2 bg-[#222326] text-white font-mono divide-y`} style={style}>
      <div className="flex justify-between p-4">
        <h2 className="font-semibold truncate">{title}</h2>
        <button className={"w-6 h-6 rounded-full hover:bg-neutral-700"}
            onClick={
          () => {
            setGraph(graph => ({...graph, selectedNodes: imt.Set<string>()}))
            setCollapse(true)
          }
        }>
          <CloseIcon/>
        </button>
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
  

