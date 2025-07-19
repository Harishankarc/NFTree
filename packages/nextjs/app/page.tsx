"use client";

import Link from "next/link";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { Address } from "~~/components/scaffold-eth";

const Home: NextPage = () => {
  const { address: connectedAddress } = useAccount();

  return (
    <>
      <div className="flex items-center flex-col grow pt-10">
        <div className="px-5">
            <p className="my-2 font-medium">Connected Address:</p>
            <Address address={connectedAddress} />
        </div>
      </div>
    </>
  );
};

export default Home;
