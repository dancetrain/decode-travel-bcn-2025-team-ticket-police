import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", ethers.utils.formatEther(await deployer.getBalance()), "ETH");

  const EventNFT = await ethers.getContractFactory("EventNFT");
  const contract = await EventNFT.deploy(deployer.address); // platformFeeRecipient = deployer.address

  // v5 syntax: Wait for deployment
  await contract.deployed();

  console.log("EventNFT deployed to:", contract.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});