import type { NextPage } from "next";
import Head from "next/head";
import { Canvas } from "../Components/Canvas";

const Home: NextPage = () => {

  return (
    <>
      <Head>
        <title>Nodify</title>
        <meta name="description" content="A graph based life management app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Canvas/>
    </>
  );
};

export default Home;
