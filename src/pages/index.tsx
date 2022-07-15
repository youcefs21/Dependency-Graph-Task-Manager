import type { NextPage } from "next";
import Head from "next/head";
import { Canvas } from "../Components/Canvas";

const Home: NextPage = () => {

  return (
    <>
      <Head>
        <title>Nodify</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="overflow-hidden">
        <Canvas/>
      </div>
    </>
  );
};

export default Home;
