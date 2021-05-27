import { ChakraProvider, extendTheme } from "@chakra-ui/react";
import { Web3ContextProvider } from "../helpers/web3";

import PlausibleProvider from "next-plausible";

import "../styles/globals.scss";

const theme = extendTheme({
  fonts: {
    heading: "Inter",
    body: "Inter",
  },
});

export default function BooperApp({ Component, pageProps }) {
  return (
    <PlausibleProvider
      domain="booper.finance"
      customDomain="https://booper.finance"
      selfHosted
    >
      <ChakraProvider theme={theme}>
        <Web3ContextProvider>
          <Component {...pageProps} />
        </Web3ContextProvider>
      </ChakraProvider>
    </PlausibleProvider>
  );
}
