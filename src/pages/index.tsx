import type { NextPage } from "next";
import Head from "next/head";
import {useState, Dispatch, SetStateAction} from "react";
import { Canvas } from "../Components/Canvas";

const Seperator = () => {
  return (
    <div className="place-self-center mx-3">
      <svg width="3" height="29" viewBox="0 0 3 29" fill="none" xmlns="http://www.w3.org/2000/svg">
        <line id="seperator 1" x1="1.29321" y1="1.51147" x2="1.29321" y2="27.8855" stroke="#444444" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    </div>
  )
}

const AddEdgeIcon = () => {
  return (
  <svg width="25" height="25" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path id="Edge" d="M20.1152 1.46895C20.1152 1.19274 19.8914 0.968835 19.6153 0.968835L15.1163 0.968835C14.8403 0.968835 14.6165 1.19274 14.6165 1.46895C14.6165 1.74515 14.8403 1.96906 15.1163 1.96906H19.1154V5.96997C19.1154 6.24618 19.3392 6.47008 19.6153 6.47008C19.8914 6.47008 20.1152 6.24618 20.1152 5.96997V1.46895ZM0.869403 20.9307L19.9688 1.82258L19.2618 1.11531L0.162457 20.2234L0.869403 20.9307Z" fill="#D9D9D9"/>
    <line id="Line 3" x1="2.4624" y1="3.76721" x2="8.21506" y2="3.76721" stroke="#C6FFBD" strokeLinecap="round"/>
    <line id="Line 4" x1="5.51398" y1="6.46948" x2="5.51398" y2="0.713757" stroke="#C6FFBD" strokeLinecap="round"/>
  </svg>

  )
}
const RemoveEdgeIcon = () => {
  return (
    <svg width="25" height="25" viewBox="0 0 21 23" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path id="Edge" d="M20.7271 3.46889C20.7271 3.19269 20.5033 2.96878 20.2272 2.96878H15.7282C15.4521 2.96878 15.2283 3.19269 15.2283 3.46889C15.2283 3.7451 15.4521 3.969 15.7282 3.969H19.7273L19.7273 7.96991C19.7273 8.24612 19.9511 8.47003 20.2272 8.47003C20.5033 8.47003 20.7271 8.24612 20.7271 7.96991V3.46889ZM1.48128 22.9306L20.5807 3.82252L19.8737 3.11526L0.774335 22.2233L1.48128 22.9306Z" fill="#D9D9D9"/>
      <line id="Line 3" x1="0.5" y1="-0.5" x2="6.25419" y2="-0.5" transform="matrix(0.706946 -0.707267 0.706946 0.707267 4.04065 8.45782)" stroke="#FFAAAA" strokeLinecap="round"/>
      <line id="Line 4" x1="0.5" y1="-0.5" x2="6.25419" y2="-0.5" transform="matrix(-0.706946 -0.707267 0.706946 -0.707267 8.81549 7.50244)" stroke="#FFAAAA" strokeLinecap="round"/>
    </svg>
  )
}

const AddNodeIcon = () => {
  return (
    <svg width="25" height="25" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="4" y1="9.57104" x2="16" y2="9.57104" stroke="white" strokeLinecap="round"/>
      <line x1="10" y1="15.5" x2="10" y2="3.5" stroke="white" strokeLinecap="round"/>
      <circle cx="10" cy="10" r="9.5" stroke="#D9D9D9"/>
    </svg>
  )
}

const CompleteNodeIcon = () => {
  return (
    <svg width="25" height="25" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 9.47059L8.14961 13L15 6" stroke="white" strokeLinecap="round"/>
      <circle cx="10" cy="10" r="9.5" stroke="#D9D9D9"/>
    </svg>
  )
}

const DeleteNodeIcon = () => {
  return (
    <svg width="25" height="25" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="6.20711" y1="5.68994" x2="14.6924" y2="14.1752" stroke="white" strokeLinecap="round"/>
      <line x1="5.5" y1="13.9828" x2="13.9853" y2="5.49755" stroke="white" strokeLinecap="round"/>
      <circle cx="10" cy="10" r="9.5" stroke="#D9D9D9"/>
    </svg>
  )
}

const PointerIcon = () => {
  return (
    <svg width="25" height="25" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M7.0762 14.4574L1.29927 1.29924L14.4574 7.07617L9.38729 9.10928L9.18887 9.18884L9.10931 9.38726L7.0762 14.4574Z" stroke="#D9D9D9"/>
    </svg>
  )
}

const MoveIcon = () => {
  return (
    <svg width="25" height="25" viewBox="0 0 16 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M7.43433 7.88366V2.91111M7.43433 2.91111V1.25359C8.41839 0.915473 8.97296 0.915468 9.95622 1.25359V7.88366V2.08235C10.9902 1.81657 11.5454 1.79346 12.4781 2.08235V7.88366V4.56862C13.4641 4.26057 14.0142 4.24932 15 4.56862V13.685L12.4781 17H7.43433L1.54992 11.1987C0.877671 10.1581 0.75815 9.60185 1.54992 8.71242L4.91244 10.3699V2.91111C5.89801 2.43616 6.44895 2.45896 7.43433 2.91111Z" stroke="#D9D9D9" strokeLinejoin="bevel"/>
    </svg>
  )
}

interface ToolbarButtonProps {
  children: JSX.Element,
  currentTool: string,
  setCurrentTool: Dispatch<SetStateAction<string>>,
  toolName: string
}

const ToolbarButton = ({children, currentTool, setCurrentTool, toolName}: ToolbarButtonProps) => {
  return (
    <button className={`py-2 px-2 mx-1 rounded-md ${currentTool != toolName ? 'hover:bg-neutral-700' : 'bg-blue-500'} `} 
      onClick={() => setCurrentTool(toolName)}>
      {children}
    </button>
  )
}


const Home: NextPage = () => {
  const [centrePos, setCentrePos] = useState({x: 0, y: 0});
  const [scale, setScale] = useState(1);
  const [currentTool, setCurrentTool] = useState("pointer");

  return (
    <>
      <Head>
        <title>Nodify</title>
        <meta name="description" content="A graph based life management app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Canvas 
        toolbarDataCallback={(x, y, scale) => {
          setCentrePos({x, y});
          setScale(scale)
        }}
        currentTool={currentTool}
      />
      <div className="relative top-5 flex w-5/6 max-w-4xl justify-between rounded-xl bg-[#121316] m-auto">
        <div className="flex my-2 mx-5">
          <ToolbarButton currentTool={currentTool} setCurrentTool={setCurrentTool} toolName={"addEdge"}>
            <AddEdgeIcon/>
          </ToolbarButton>

          <ToolbarButton currentTool={currentTool} setCurrentTool={setCurrentTool} toolName={"removeEdge"}>
            <RemoveEdgeIcon/>
          </ToolbarButton>

          <Seperator/>

          <ToolbarButton currentTool={currentTool} setCurrentTool={setCurrentTool} toolName={"addNode"}>
            <AddNodeIcon/>
          </ToolbarButton>

          <ToolbarButton currentTool={currentTool} setCurrentTool={setCurrentTool} toolName={"completeNode"}>
            <CompleteNodeIcon/>
          </ToolbarButton>

          <ToolbarButton currentTool={currentTool} setCurrentTool={setCurrentTool} toolName={"deleteNode"}>
            <DeleteNodeIcon/>
          </ToolbarButton>

          <Seperator/>

          <ToolbarButton currentTool={currentTool} setCurrentTool={setCurrentTool} toolName={"pointer"}>
            <PointerIcon/>
          </ToolbarButton>

          <ToolbarButton currentTool={currentTool} setCurrentTool={setCurrentTool} toolName={"move"}>
            <MoveIcon/>
          </ToolbarButton>
        </div>
        <div></div>
        <div className="flex items-center text-white text-sm font-semibold my-1 mx-5">
          <div>
            <p>x: {Math.round(centrePos.x)}</p>
            <p>y: {Math.round(centrePos.y)}</p>
          </div>
          <Seperator/>
          {Math.round(scale*10)}%
        </div>
      </div>

    </>
  );
};

export default Home;
