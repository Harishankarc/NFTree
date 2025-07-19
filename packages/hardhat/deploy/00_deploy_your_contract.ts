import { DeployFunction } from "hardhat-deploy/types";

const deployTreeNFT: DeployFunction = async function ({ deployments, getNamedAccounts }) {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  await deploy("TreeNFT", {
    from: deployer,
    log: true,
  });
};

export default deployTreeNFT;
deployTreeNFT.tags = ["TreeNFT"];
