import type { NextPage } from "next";
import Head from "next/head";


const Home: NextPage = () => {
  // redirect to /demo
  return (
    <>
      <Head>
        <title>Nodify</title>
        <meta name="description" content="A dependency based task management app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <h1 className={"text-white"}>This project is deprecated... Redirecting to demo</h1>
    </>
  );
};



export default Home;
