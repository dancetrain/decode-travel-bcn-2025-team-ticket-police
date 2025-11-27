# 🎟️ Team Ticket Police 🎫

Organization for selling tickets on Camino Network

## Repository structure
### ticket-machine
Folder with smart contracts for tickets operation

### ticket-frontend
Mock for UI

## How to run
### TicketFrontend
```bash
cd ticket-frontend
npm i
npm run dev
```

Follow the instruction in console

### TicketMachine
There are two smart contracts
1. Happy-path for buy-visit activity: `TicketMachine.sol`
2. Resell-path for buy-resell activity: `EventNFT.sol`

For TicketMachine.sol:
```
scripts/deploy.ts
scripts/setup.ts
scripts/run.ts
```

For EventNFT.sol:
```
scripts/deploy-event-nft.ts
scripts/mint-event-nft.ts
scripts/resell-event-nft.ts
```

Don't forget to create your .env.example
```bash
TICKET_MACHINE_CONTRACT_ADDRESS # is the address of TicketMachine contract
EVENTNFT_CONTRACT_ADDRESS # is the address of EventNFT contract
```
