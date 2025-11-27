// scripts/resell-event-nft.ts
import { ethers } from "hardhat";

async function main() {
  // UPDATE THESE TWO LINES
  const contractAddress = process.env.CONTRACT_ADDRESS;   // ← your real deployed address
  const tokenId = process.env.TOKEN_ID;                   // ← the token you just minted

  if (contractAddress === "") {
    throw new Error("Don't forget to replace contractAddress with your real one!");
  }

  const [owner, seller, buyer] = await ethers.getSigners();

  console.log("Contract           :", contractAddress);
  console.log("Token ID           :", tokenId);
//   console.log("Current owner (seller) :", seller.address); //currently there is no exchange between buyer and seller for the demo
//   console.log("Buyer              :", buyer.address);

  const eventNFT = await ethers.getContractAt("EventNFT", contractAddress);

//   // Make sure the token is owned by the seller (and approved if needed)
//   const currentOwner = await eventNFT.ownerOf(tokenId);
//   if (currentOwner.toLowerCase() !== seller.address.toLowerCase()) {
//     throw new Error(`Token ${tokenId} is not owned by the seller! Current owner: ${currentOwner}`);
//   }
// 1. Check current owner
  const currentOwner = await eventNFT.ownerOf(tokenId);  
  console.log("Current owner                   :", currentOwner);

  if (currentOwner.toLowerCase() !== owner.address.toLowerCase()) {
    throw new Error(`Token ${tokenId} is not owned by you! Owner: ${currentOwner}`);
  }

//   // Seller must approve the contract to transfer the token
//   console.log("Seller approving contract to transfer the token...");
//   const approveTx = await eventNFT.connect(seller).setApprovalForAll(contractAddress, true);
//   await approveTx.wait();
//   console.log("Approved!");

  // 2. Approve the contract to transfer the token (required!)
  console.log("Approving contract to transfer token...");
  const approveTx = await eventNFT.connect(owner).setApprovalForAll(contractAddress, true);
  await approveTx.wait();
  console.log("Approval done");

  const price = ethers.utils.parseEther("1.0"); // buyer pays 1 CAM

  console.log(`Buyer purchasing token ${tokenId} for ${ethers.utils.formatEther(price)} CAM...`);

  // Buyer calls resell() and sends 1 CAM
  //   const tx = await eventNFT.connect(buyer).resell(tokenId, seller.address, {
  //     value: price,
  //   });
  const tx = await eventNFT.connect(owner).resell(tokenId, owner.address, {
    value: price,
  });

  console.log("Transaction hash   :", tx.hash);
  console.log("Waiting for confirmation...");

  const receipt = await tx.wait();

  const resoldEvent = receipt.events?.find((e: any) => e.event === "Resold");
  if (resoldEvent) {
    console.log("\nRESALE SUCCESSFUL!");
    console.log(`Token ${tokenId} sold from ${resoldEvent.args.from} → ${resoldEvent.args.to}`);
    console.log(`Price: ${ethers.utils.formatEther(resoldEvent.args.price)} CAM`);
    console.log(`Original seller commission (5%): ${ethers.utils.formatEther(resoldEvent.args.price.mul(500).div(10000))} CAM`);
    console.log(`Platform fee (2%): ${ethers.utils.formatEther(resoldEvent.args.price.mul(200).div(10000))} CAM`);
  }

  console.log("Explorer link: https://suite.camino.network/?network=columbus#/address/" + contractAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Resell failed:", error.message || error);
    process.exit(1);
  });