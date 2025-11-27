import { ethers } from "hardhat";
import { TicketMachine } from "../typechain";

async function main() {
  const ticketMachine = await ethers.getContractAt("TicketMachine", process.env.TICKET_OFFICER_ADDRESS!!)
  const eventId = 1

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
  await ticketMachine.addPOS(process.env.TEST_ADDRESS!!)
  await ticketMachine.addPOSForEvent(eventId, process.env.TEST_ADDRESS!!)
  console.log("POS configured")
  
  // Create Scanner
  await ticketMachine.addScanner(eventId, process.env.TEST_ADDRESS!!)

  console.log("Done")
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
