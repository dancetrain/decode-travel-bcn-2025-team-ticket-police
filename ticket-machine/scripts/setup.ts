import { ethers } from "hardhat";
import { TicketMachine } from "../typechain";

async function main() {
  const [deployer] = await ethers.getSigners();
  const ticketMachine = await ethers.getContractAt("TicketMachine", process.env.TICKET_MACHINE_CONTRACT_ADDRESS!!)
  const eventId = 1
  const address = deployer.address

  // Create Event
  await ticketMachine.createEvent(
    eventId,
    "Any concert",
    Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // one week 
    "Concert Hall",
    5000
  )
  console.log("Event created")

  // Create POS
  await ticketMachine.addPOS(address)
  console.log("POS configured")
  
  await ticketMachine.addPOSForEvent(eventId, address)
  console.log("POS Assigned to Event")

  // Create Scanner
  await ticketMachine.addScanner(eventId, address)
  console.log("Scanner assigned to event")

  console.log("Done")
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
