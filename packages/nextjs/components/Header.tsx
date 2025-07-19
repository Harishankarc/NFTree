"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { hardhat } from "viem/chains";
import { FaucetButton, RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useOutsideClick, useTargetNetwork } from "~~/hooks/scaffold-eth";

type HeaderMenuLink = {
  label: string;
  href: string;
  icon?: React.ReactNode;
};

export const menuLinks: HeaderMenuLink[] = [
  {
    label: "Home",
    href: "/",
  },{
    label: "Buy Tree",
    href: "/buytree",
  },{
    label: "Profile",
    href: "/profile",
  }

];

export const HeaderMenuLinks = () => {
  const pathname = usePathname();

  return (
    <>
      {menuLinks.map(({ label, href, icon }) => {
        const isActive = pathname === href;
        return (
          <li key={href}>
            <Link
              href={href}
              passHref
              className={`${
                isActive ? "" : ""
              }  py-1.5 px-3 text-sm rounded-sm gap-2 grid grid-flow-col text-black `}
            >
              {icon}
              <span>{label}</span>
            </Link>
          </li>
        );
      })}
    </>
  );
};

/**
 * Site header
 */
export const Header = () => {
  const { targetNetwork } = useTargetNetwork();
  const isLocalNetwork = targetNetwork.id === hardhat.id;

  const burgerMenuRef = useRef<HTMLDetailsElement>(null);
  useOutsideClick(burgerMenuRef, () => {
    burgerMenuRef?.current?.removeAttribute("open");
  });

  return (
    <div className="py-5 lg:static top-0 navbar min-h-0 shrink-0 justify-between z-20 px-0 sm:px-2 bg-transparent border-black text-black">
      <div className=" fixed navbar-start w-full  flex items-center justify-center border-black ">
        <div className="border-1 border-black rounded-3xl backdrop-blur-[2px]">
        <ul className="hidden lg:flex lg:flex-nowrap menu menu-horizontal px-1 gap-2  text-black no-underline">
          <HeaderMenuLinks />
        </ul>
      </div>
      </div>
      <div className="navbar-end  grow mr-4">
        <RainbowKitCustomConnectButton />
        {isLocalNetwork && <FaucetButton />}
      </div>
    </div>
  );
};
