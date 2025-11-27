// scripts/mint-event-nft.ts
import { ethers } from "hardhat";

async function main() {
  // UPDATE THIS AFTER DEPLOYMENT
  const contractAddress = process.env.EVENTNFT_CONTRACT_ADDRESS!!;

  if (!contractAddress || contractAddress === "") {
    throw new Error("Please set your deployed EventNFT address in the script!");
  }

  // Only one signer needed — the owner (who deployed the contract) is the only one allowed to mint
  const [owner] = await ethers.getSigners();

  console.log("Owner (minter)     :", owner.address);
  console.log("Contract           :", contractAddress);

  const eventNFT = await ethers.getContractAt("EventNFT", contractAddress, owner);

  // Who will be the "original seller" (gets resale commission + buyback rights)
  const originalSeller = owner.address; // or use a different wallet if you want

  const eventDate = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60; // +30 days

  console.log("Event date         :", new Date(eventDate * 1000).toLocaleString());
  console.log("Minting ticket for :", originalSeller);
  console.log("Calling mint()...");

  const tx = await eventNFT.mint(
    originalSeller,     // to → becomes originalSeller
    true,               // canBeResold
    500,                // 5.00% resale commission
    eventDate           // event timestamp
  );

  console.log("Tx submitted       :", tx.hash);
  console.log("Waiting for confirmation...");

  const receipt = await tx.wait();

  // Parse the Minted event
  const mintedEvent = receipt.events?.find((e: any) => e.event === "Minted");
  if (mintedEvent) {
    const tokenId = mintedEvent.args.tokenId.toString();
    console.log("\nSUCCESS! Ticket minted!");
    console.log("Token ID           :", tokenId);
    console.log("Original Seller    :", mintedEvent.args.originalSeller);
    console.log("Explorer           : https://suite.camino.network/?network=columbus#/address/" + contractAddress);
  } else {
    console.log("Mint succeeded but no Minted event found. Check explorer manually.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Mint failed:", error);
    process.exit(1);
  });