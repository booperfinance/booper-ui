import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";

import { Contract } from "@ethersproject/contracts";

import { Text, Box, HStack, Container, Center } from "@chakra-ui/layout";
import { Button, ButtonGroup } from "@chakra-ui/button";

import { useWeb3 } from "../../helpers/web3";
import { shortenAddress } from "../../helpers/utils";

import abiErc20 from "../../abi/erc20.json";
import abiBoop from "../../abi/boop.json";
import { formatUnits } from "../../helpers/units";

const IDEX = "0x0856978F7fFff0a2471B4520E3521c4B3343e36f";
const BOOP = "0x890E894F923CFa1Dad0E7da5AD37302b59000696";

export default function Header() {
  const { active, activate, deactivate, account, pending, library } = useWeb3();
  const [userBalanceIdex, setUserBalanceIdex] = useState(0);
  const [userBalanceBoop, setuserBalanceBoop] = useState(0);

  useEffect(() => {
    if (active && library && account) {
      const idexContract = new Contract(IDEX, abiErc20, library);
      const booperContract = new Contract(BOOP, abiBoop, library);

      idexContract.balanceOf(account).then(setUserBalanceIdex);
      booperContract.balanceOf(account).then(setuserBalanceBoop);
    } else {
      setUserBalanceIdex(0);
      setuserBalanceBoop(0);
    }
  }, [active, library, account]);

  const [userDisplayToken, setUserDisplayToken] = useState(true);
  const toggleUserDisplayToken = useCallback(
    () => setUserDisplayToken(!userDisplayToken),
    [setUserDisplayToken, userDisplayToken]
  );

  const displayBalance = useMemo(
    () =>
      userDisplayToken
        ? `${formatUnits(userBalanceIdex, 18)} IDEX`
        : `${formatUnits(userBalanceBoop, 9)} BOOP`,
    [userDisplayToken, userBalanceIdex, userBalanceBoop]
  );

  return (
    <Container maxW="container.xl">
      <HStack py={5} wrap="wrap" spacing={0}>
        <Link href="/">
          <a>
            <HStack spacing={2}>
              <Text fontSize="5xl" fontWeight="extrabold">
               Booper.finance
              </Text>
              <Center>
                <Image src="/tokens/BOOP.svg" width={64} height={64} />
              </Center>
            </HStack>
          </a>
        </Link>
        <Box flexGrow={1}></Box>
        <Box>
          {(!active || !account) && (
            <Button
              colorScheme="blackAlpha"
              boxShadow="sm"
              onClick={activate}
              isLoading={pending}
            >
              Connect to a wallet
            </Button>
          )}
          {active && account && (
            <ButtonGroup isAttached boxShadow="sm">
              <Button colorScheme="blackAlpha" onClick={toggleUserDisplayToken}>
                {displayBalance}
              </Button>
              <Button
                colorScheme="whiteAlpha"
                fontFamily="monospace"
                onClick={deactivate}
              >
                {shortenAddress(account)}
              </Button>
            </ButtonGroup>
          )}
        </Box>
      </HStack>
    </Container>
  );
}
