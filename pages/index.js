import React, { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Head from "next/head";

import { Contract } from "@ethersproject/contracts";
import { BigNumber } from "bignumber.js";

import {
  Text,
  Box,
  Stack,
  Center,
  VStack,
  HStack,
  Container,
  Link,
  Flex,
} from "@chakra-ui/layout";
import { Button, ButtonGroup } from "@chakra-ui/button";
import { ArrowDownIcon } from "@chakra-ui/icons";

import Header from "../components/Header";

import { useWeb3 } from "../helpers/web3";
import { formatUnits } from "../helpers/units";

import abiErc20 from "../abi/erc20.json";
import abiBoop from "../abi/boop.json";

import NumericInput from "../components/NumericInput";
import { usePlausible } from "next-plausible";

const IDEX = "0x0856978F7fFff0a2471B4520E3521c4B3343e36f";
const BOOP = "0x890E894F923CFa1Dad0E7da5AD37302b59000696";

const TEN = new BigNumber(10);
const MAX = new BigNumber(2).pow(256).minus(1);

export default function Home() {
  const [page, setPage] = useState("wrap");
  const isWrap = useMemo(() => page === "wrap", [page]);
  const isUnwrap = useMemo(() => page === "unwrap", [page]);

  const plausible = usePlausible();
  const { active, account, library, provider } = useWeb3();

  const [userBalanceIdex, setUserBalanceIdex] = useState(0);
  const [userBalanceBooper, setUserBalanceBooper] = useState(0);
  const [userAllowanceIdex, setUserAllowanceIdex] = useState(0);

  const [isApproving, setIsApproving] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);

  const idex = useMemo(
    () => ({
      name: "idex.io",
      symbol: "IDEX",
      image: "/tokens/IDEX.svg",
      address: IDEX,
      decimals: 18,
      balance: new BigNumber(userBalanceIdex.toString()),
      allowance: new BigNumber(userAllowanceIdex.toString()),
    }),
    [userBalanceIdex, userAllowanceIdex]
  );

  const booper = useMemo(
    () => ({
      name: "booper.finance",
      symbol: "BOOP",
      address: BOOP,
      image: "/tokens/BOOP.svg",
      decimals: 12,
      balance: new BigNumber(userBalanceBooper.toString()),
      allowance: MAX,
    }),
    [userBalanceBooper]
  );

  const fromToken = useMemo(() => (isWrap ? idex : booper), [idex, booper, isWrap]);
  const toToken = useMemo(
    () => (isUnwrap ? idex : booper),
    [idex, booper, isUnwrap]
  );

  const [value, setValue] = useState("");
  const input = useMemo(
    () =>
      new BigNumber(
        (value.endsWith(".") ? value.slice(0, -1) : value) || "0"
      ).times(TEN.pow(fromToken.decimals)),
    [value, fromToken]
  );

  const output = useMemo(() => input, [input]);

  useEffect(() => {
    if (active && library && account) {
      const idexContract = new Contract(IDEX, abiErc20, library);
      const booperContract = new Contract(BOOP, abiErc20, library);

      idexContract.balanceOf(account).then(setUserBalanceIdex);
      booperContract.balanceOf(account).then(setUserBalanceBooper);

      idexContract.allowance(account, BOOP).then(setUserAllowanceIdex);
    } else {
      setUserBalanceIdex(0);
      setUserBalanceBooper(0);
      setUserAllowanceIdex(0);
    }
  }, [active, library, account, isApproving, isSwapping]);

  const inputValid = useMemo(
    () => !active || !input.gt(fromToken.balance),
    [active, input, fromToken]
  );

  const needsApproval = useMemo(
    () => fromToken.symbol !== "BOOP",
    [active, input, fromToken]
  );

  const approveValid = useMemo(
    () =>
      input.lte(fromToken.balance) &&
      input.gt(0) &&
      input.gte(fromToken.allowance),
    [input, fromToken]
  );

  const swapValid = useMemo(
    () =>
      input.lte(fromToken.balance) &&
      input.gt(0) &&
      input.lte(fromToken.allowance),
    [input, fromToken, approveValid]
  );

  const max = useCallback(() => {
    setValue(fromToken.balance.div(TEN.pow(fromToken.decimals)).toFixed());
  }, [fromToken, setValue]);

  const approve = useCallback(() => {
    const fromContract = new Contract(
      fromToken.address,
      abiErc20,
      library.getSigner(account)
    );
    setIsApproving(true);
    fromContract
      .approve(toToken.address, MAX.toFixed())
      .catch(() => setIsApproving(false))
      .then((tx) => tx.wait())
      .catch(() => setIsApproving(false))
      .then(() => setIsApproving(false));
  }, [fromToken, toToken, library, account]);

  const boop = useCallback(() => {
    const booperContract = new Contract(
      booper.address,
      abiBoop,
      library.getSigner(account)
    );
    setIsSwapping(true);
    booperContract.functions["boop(uint256)"](input.toFixed())
      .catch(() => setIsSwapping(false))
      .then((tx) => tx.wait())
      .catch(() => setIsSwapping(false))
      .then(() => setIsSwapping(false));
    plausible("Boop", { props: { amount: input.toFixed() } });
  }, [fromToken, toToken, library, account, input]);

  const unboop = useCallback(() => {
    const booperContract = new Contract(
      booper.address,
      abiBoop,
      library.getSigner(account)
    );
    setIsSwapping(true);
    booperContract.functions["unboop(uint256)"](input.toFixed())
      .catch(() => setIsSwapping(false))
      .then((tx) => tx.wait())
      .catch(() => setIsSwapping(false))
      .then(() => setIsSwapping(false));
    plausible("Unboop", { props: { amount: input.toFixed() } });
  }, [booper, toToken, library, account, input]);

  const swap = useMemo(() => (isWrap ? boop : unboop), [isWrap, boop, unboop]);

  const addToken = useCallback(
    (token) => {
      if (active && provider) {
        provider
          .request({
            method: "wallet_watchAsset",
            params: {
              type: "ERC20",
              options: {
                address: token.address,
                symbol: token.symbol,
                decimals: token.decimals,
                image: `https://booper.finance/${token.image}`,
              },
            },
          })
          .catch(console.error);
      }
    },
    [active, provider]
  );

  return (
    <Box minH="100vh" color="white">
      <Head>
        <title>booper</title>
      </Head>
      <Stack spacing={10}>
        <Header />
        <Center>
          <Container>
            <Stack>
              <Box
                bgColor="whiteAlpha.600"
                p="5"
                w="100%"
                maxW="lg"
                borderRadius="8"
              >
                <Stack spacing={6}>
                  <Center>
                    <ButtonGroup isAttached>
                      <Button
                        colorScheme="purple"
                        fontSize="xl"
                        opacity={isWrap ? 0.8 : 0.4}
                        onClick={() => setPage("wrap")}
                        w={["32", "40"]}
                      >
                        Boop
                      </Button>
                      <Button
                        colorScheme="blue"
                        fontSize="xl"
                        opacity={isUnwrap ? 0.8 : 0.4}
                        onClick={() => setPage("unwrap")}
                        w={["32", "40"]}
                      >
                        Unboop
                      </Button>
                    </ButtonGroup>
                  </Center>
                  <VStack spacing={0} color="black" color="black">
                    <Box
                      w="100%"
                      bg="white"
                      p={4}
                      borderRadius={8}
                      boxShadow="lg"
                    >
                      <Stack spacing={2}>
                        <HStack>
                          <Box flexGrow={1}>
                            <Text fontSize="sm">
                              <span>Balance: </span>
                              <Link onClick={max}>
                                {fromToken.balance.gt(0)
                                  ? formatUnits(
                                      fromToken.balance,
                                      fromToken.decimals
                                    )
                                  : "-"}
                              </Link>
                            </Text>
                          </Box>
                          <Box>
                            <Text fontSize="sm">
                              <Link onClick={() => addToken(fromToken)}>
                                Add Token
                              </Link>
                            </Text>
                          </Box>
                        </HStack>
                        <NumericInput
                          value={value}
                          onChange={setValue}
                          invalid={!inputValid}
                          element={
                            <Image
                              src={fromToken.image}
                              width="32"
                              height="32"
                            />
                          }
                        />
                      </Stack>
                    </Box>
                    <Box
                      w="90%"
                      bg="whiteAlpha.700"
                      px={4}
                      py={3}
                      boxShadow="sm"
                    >
                      <Center>
                        <ArrowDownIcon />
                      </Center>
                    </Box>
                    <Box
                      w="100%"
                      bg="white"
                      p={4}
                      borderRadius={8}
                      boxShadow="lg"
                    >
                      <Stack spacing={2}>
                        <HStack>
                          <Box flexGrow={1}>
                            <Text fontSize="sm">
                              <span>Balance: </span>
                              {toToken.balance.gt(0)
                                ? formatUnits(toToken.balance, toToken.decimals)
                                : "-"}
                            </Text>
                          </Box>
                          <Box>
                            <Text fontSize="sm">
                              <Link onClick={() => addToken(toToken)}>
                                Add Token
                              </Link>
                            </Text>
                          </Box>
                        </HStack>
                        <NumericInput
                          disabled
                          value={formatUnits(output, toToken.decimals)}
                          element={
                            <Image src={toToken.image} width="32" height="32" />
                          }
                        />
                      </Stack>
                    </Box>
                  </VStack>
                  <HStack width="100%">
                    {needsApproval && (
                      <Button
                        width="100%"
                        colorScheme="blackAlpha"
                        size="lg"
                        disabled={!approveValid}
                        isLoading={isApproving}
                        onClick={approve}
                      >
                        Approve
                      </Button>
                    )}
                    <Button
                      width="100%"
                      colorScheme="blackAlpha"
                      size="lg"
                      disabled={!swapValid}
                      isLoading={isSwapping}
                      onClick={swap}
                    >
                      {isWrap ? "Boop" : "Unboop"}
                    </Button>
                  </HStack>
                </Stack>
              </Box>
              <Box
                bgColor="whiteAlpha.300"
                p="5"
                w="100%"
                maxW="lg"
                borderRadius="8"
              >
                <Stack spacing={6}>
                  <HStack wrap="wrap" spacing={0}>
                    <Box flexGrow={1}>
                      <Text>
                        <Link href='https://exchange.pancakeswap.finance/#/swap?outputCurrency=0x890E894F923CFa1Dad0E7da5AD37302b59000696'>
                        🥞 Trade
                        </Link>
                      </Text>
                    </Box>
                    <Box>
                      <Text>
                        by mak.eth with 💙. Special thanks to <Link href="https://yearn.finance">🔵</Link>.
                      </Text>
                    </Box>
                  </HStack>
                </Stack>
              </Box>
            </Stack>
          </Container>
        </Center>
        <Box p="2"></Box>
      </Stack>
    </Box>
  );
}
