import { DeployFunction } from "hardhat-deploy/types";

const deployTreeNFT: DeployFunction = async function ({ deployments, getNamedAccounts }) {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  await deploy("FruitTreeNFT", {
    from: deployer,
    log: true,
  });
};

export default deployTreeNFT;
deployTreeNFT.tags = ["FruitTreeNFT"];
