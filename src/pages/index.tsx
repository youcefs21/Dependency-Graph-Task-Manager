import type { NextPage } from "next";
import Head from "next/head";
import { Canvas } from "../Components/Canvas";

const AddEdgeIcon = () => {
  return (
  <svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g id="add edge">
      <path id="Edge" d="M20.1152 1.46895C20.1152 1.19274 19.8914 0.968835 19.6153 0.968835L15.1163 0.968835C14.8403 0.968835 14.6165 1.19274 14.6165 1.46895C14.6165 1.74515 14.8403 1.96906 15.1163 1.96906H19.1154V5.96997C19.1154 6.24618 19.3392 6.47008 19.6153 6.47008C19.8914 6.47008 20.1152 6.24618 20.1152 5.96997V1.46895ZM0.869403 20.9307L19.9688 1.82258L19.2618 1.11531L0.162457 20.2234L0.869403 20.9307Z" fill="#D9D9D9"/>
      <g id="plus">
        <line id="Line 3" x1="2.4624" y1="3.76721" x2="8.21506" y2="3.76721" stroke="#C6FFBD" strokeLinecap="round"/>
        <line id="Line 4" x1="5.51398" y1="6.46948" x2="5.51398" y2="0.713757" stroke="#C6FFBD" strokeLinecap="round"/>
      </g>
    </g>
  </svg>

  )
}
const RemoveEdgeIcon = () => {
  return (
    <svg width="21" height="23" viewBox="0 0 21 23" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g id="remove edge">
        <path id="Edge" d="M20.7271 3.46889C20.7271 3.19269 20.5033 2.96878 20.2272 2.96878H15.7282C15.4521 2.96878 15.2283 3.19269 15.2283 3.46889C15.2283 3.7451 15.4521 3.969 15.7282 3.969H19.7273L19.7273 7.96991C19.7273 8.24612 19.9511 8.47003 20.2272 8.47003C20.5033 8.47003 20.7271 8.24612 20.7271 7.96991V3.46889ZM1.48128 22.9306L20.5807 3.82252L19.8737 3.11526L0.774335 22.2233L1.48128 22.9306Z" fill="#D9D9D9"/>
        <g id="plus">
          <line id="Line 3" x1="0.5" y1="-0.5" x2="6.25419" y2="-0.5" transform="matrix(0.706946 -0.707267 0.706946 0.707267 4.04065 8.45782)" stroke="#FFAAAA" strokeLinecap="round"/>
          <line id="Line 4" x1="0.5" y1="-0.5" x2="6.25419" y2="-0.5" transform="matrix(-0.706946 -0.707267 0.706946 -0.707267 8.81549 7.50244)" stroke="#FFAAAA" strokeLinecap="round"/>
        </g>
      </g>
    </svg>
  )
}

const Toolbar = () => {
  return (
    <div className="relative top-5 flex w-5/6 max-w-4xl justify-between rounded-xl bg-[#121316] m-auto">
      <div className="flex my-3 mx-5">
          <AddEdgeIcon></AddEdgeIcon>
          <RemoveEdgeIcon></RemoveEdgeIcon>
      </div>
      <div></div>
      <div className="text-white text-sm font-semibold my-3 mx-5">
        <button className="py-0.5 px-3 bg-blue-500 rounded-md shadow focus:outline-none">
        </button>
      </div>
    </div>
  );
}

const Home: NextPage = () => {

  return (
    <>
      <Head>
        <title>Nodify</title>
        <meta name="description" content="A graph based life management app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Canvas/>
      <Toolbar/>
    </>
  );
};

export default Home;
