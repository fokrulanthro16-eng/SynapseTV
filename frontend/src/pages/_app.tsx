import type { AppProps } from 'next/app';
import Head from 'next/head';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>SynapseTV — Autonomous Living-Room Cognitive Hub &amp; Spatial Co-Viewer</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="description" content="Award-winning Autonomous Spatial Co-Viewer for Fire TV powered by AWS Bedrock Swarm" />
        <meta name="theme-color" content="#080B10" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}
