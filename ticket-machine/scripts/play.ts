import { ethers } from "hardhat";
import { TicketMachine } from "../typechain";
import { TicketMintedEvent } from "../typechain/TicketMachine"

async function sleep(ms: number) {
    return new Promise((resolve, reject) => {
        setTimeout(resolve, ms);
    });
}

async function main() {
  const ticketMachine = await ethers.getContractAt("TicketMachine", process.env.TICKET_OFFICER_ADDRESS!!)
  const eventId = 1
  const buyer = process.env.TEST_ADDRESS!!

  var ticketMinted: TicketMintedEvent | undefined

  ticketMachine.on("TicketMinted", (...eventData: TicketMintedEvent[]) => {
    console.log("TicketMinted", eventData)
    // 

    ticketMinted = eventData[5]
  })

  // scenario 1:
  // With one ticket - you only can pass once
  const ticketCreated = await ticketMachine.recordSale(buyer, eventId, "", "")

  // wait for ticketMinted
  while(!ticketMinted) {
    await sleep(500)
  }

  console.log("ticketMinted", ticketMinted.args)

  // consume once
  await ticketMachine.validateAndConsume(
    ticketMinted.args.tokenId,
    ticketMinted.args.eventId,
    ticketMinted.args.qrPayload
  )  

  ticketMachine.removeAllListeners("TicketMinted")
  console.log("Done")
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
