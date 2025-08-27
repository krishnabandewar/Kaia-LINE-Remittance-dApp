# Kaia × LINE Remittance dApp — MVP to Pilot

## 0) Goal
Ship an MVP that lets a sender on LINE type `Send 100 USDT to @Mom` and complete a USDT-on-Kaia transfer with <1% fee. The recipient receives funds in a LINE-linked wallet (non-custodial via Kaia Wallet or optional light-custody), plus a simple cash-out request flow.

## 1) Product Scope (MVP)
- Channels: LINE Chatbot + LIFF mini-app (wallet UI & KYC forms)
- Assets: USDT (native on Kaia) as settlement currency; KAIA for gas (sponsor/paymaster for gasless UX later)
- Core flows:
	- Onboard (LINE Login → create/connect Kaia address in wallet)
	- Send (chat command or LIFF form → transfer USDT → notify recipient)
	- Receive (auto-claim to recipient wallet; show balance & QR)
	- Cash-out request (submit amount + method; off-ramp handled off-chain initially)
- Fees: % fee + fixed spread for FX (if any). Fee address configurable.
- Regions (pilot): JP→TH or JP→ID corridors (changeable)
- Out-of-scope (Phase 1): full agent network payouts, bank direct APIs in all countries, price-hedging engine

## 2) Architecture
- LINE Messaging API (chatbot)
- LIFF webview (React)
- Kaia Wallet (in-app or external)
- Kaia RPC (EVM)
- Remittance API (Node.js backend)
- EVM signer (service ops, NOT holding user funds)
- Price/FX oracles (off-chain first)
- Off-ramp connector(s) (manual CSV/payments in MVP)

## 3) Platform Specifics
- Kaia: EVM L1, merger of Klaytn & Finschia; native USDT available
- LINE: Messaging API for chatbots; LIFF for webviews; LINE Login for identity
- Wallet: Kaia Wallet (Kaikas successor) supports social login including LINE

## 4) Smart Contracts
### RemittanceRouter.sol
- Roles: feeCollector (EOA/treasury), owner
- Config: feeBps, allowedTokens (start with USDT)
- Function: `remit(token, to, amount, memo)`
- Calculates fee and emits `Remitted(sender, to, token, netAmount, fee, memo)`
- Security: ReentrancyGuard; pause
- MVP avoids custody of user private keys

## 5) LINE Integration
- Messaging API bot: triggers on text, quick-reply, rich menus
- Webhook receives text → NLU parser → build transfer intent → reply with confirm message + deep link to LIFF for signing
- LIFF app: Home, Send, Receive (QR), Cash-out, History, Settings/KYC
- LIFF init → bind LINE userId ↔ Kaia address

## 6) Off-ramp (Phase 0 → Phase 1)
- Phase 0: manual cash-out, ops team settles via local methods
- Phase 1: integrate regulated off-ramps per corridor
- FX: quote off-chain at request time; add margin; store in DB alongside on-chain tx hash

## 7) Data & Infra
- DB (Postgres): users, contacts, intents, quotes, payouts, KYC status, tx logs
- Queues: payout processing, notifications
- Analytics: daily volume, MAU, CAC, cost/tx, corridor splits

## 8) Security & Compliance
- No server-side custody of user funds
- Protect service signer with HSM/KMS
- Encrypt PII at rest; segregate KYC docs; rotate tokens
- Per-user/day send limits; sanctions screening
- Fee breakdown, on-chain risks, volatility disclosures
- Money transfer licensing—start as closed beta; partner MSB for cash-out

## 9) Milestones
1. Dev setup: Kaia RPC, USDT contract, test funds, LINE provider, LIFF app, bot channel
2. Wallet bind: open LIFF → connect Kaia Wallet → store address
3. Send/Receive: construct USDT transfer TX → sign in wallet → on-chain → notify recipient
4. Cash-out request: form + admin dashboard
5. Router contract: deploy + fee logic + events
6. Gasless v2: sponsor gas/paymaster; intent-based UX
7. Pilot: small corridor, capped limits, feedback loop

## 10) Example Code Snippets
### Solidity: RemittanceRouter
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
interface IERC20 { function transferFrom(address,address,uint256) external returns (bool); }
contract RemittanceRouter {
		address public owner;
		address public feeCollector;
		uint16 public feeBps; // 100 = 1%
		mapping(address=>bool) public allowed;
		event Remitted(address indexed from, address indexed to, address indexed token, uint256 gross, uint256 fee, string memo);
		modifier onlyOwner(){require(msg.sender==owner, "!owner"); _;}
		constructor(address _feeCollector,uint16 _feeBps){ owner=msg.sender; feeCollector=_feeCollector; feeBps=_feeBps; }
		function setAllowed(address token, bool ok) external onlyOwner { allowed[token]=ok; }
		function setFee(uint16 bps) external onlyOwner { require(bps<=200, "fee too high"); feeBps=bps; }
		function remit(address token, address to, uint256 amount, string calldata memo) external {
				require(allowed[token], "token not allowed");
				uint256 fee = amount * feeBps / 10000;
				uint256 net = amount- fee;
				require(IERC20(token).transferFrom(msg.sender, feeCollector, fee), "fee xfer fail");
				require(IERC20(token).transferFrom(msg.sender, to, net), "net xfer fail");
				emit Remitted(msg.sender, to, token, amount, fee, memo);
		}
}
```
### Node/Express: LINE Webhook
```js
import express from "express";
import crypto from "crypto";
const app = express();
app.use(express.json());
const CHANNEL_SECRET = process.env.LINE_SECRET;
const CHANNEL_TOKEN = process.env.LINE_TOKEN;
function verify(req){
	const h = crypto.createHmac('sha256', CHANNEL_SECRET).update(JSON.stringify(req.body)).digest('base64');
	return h === req.headers['x-line-signature'];
}
app.post('/webhook', (req,res)=>{
	if(!verify(req)) return res.sendStatus(403);
	const ev = req.body.events?.[0];
	if(ev?.type==='message' && ev.message.type==='text'){
		// naive parse: "send 100 usdt to @mom"
		const txt = ev.message.text.toLowerCase();
		// Build intent + generate LIFF deep link with prefilled params
		const deepLink = `https://liff.line.me/LIFF_ID/send?amt=100&sym=USDT&to=@mom`;
		// reply with confirm template (left as exercise)
	}
	res.sendStatus(200);
});
app.listen(3000);
```
### LIFF (React) – connect & sign
```js
import liff from '@line/liff';
import { ethers } from 'ethers';
await liff.init({ liffId: import.meta.env.VITE_LIFF_ID });
const profile = await liff.getProfile();
// connect Kaia Wallet via window.ethereum (Kaia Wallet injects provider)
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();
const usdt = new ethers.Contract(USDT_ADDR, ["function transfer(address,uint256) returns (bool)"], signer);
await usdt.transfer(recipientAddress, ethers.parseUnits(amount, 6));
```

## 11) Test Checklist
- [x] LINE Login works in LIFF webview; profile ↔ wallet address saved
- [x] Send flow signs & broadcasts USDT on Kaia testnet/mainnet
- [x] Recipient notification (push) + balance refresh
- [x] Fee accounting (if Router used) checked against events
- [x] Cash-out form stored; admin dashboard updates status → user notified

## 12) References
- Kaia overview/site; transition FAQ; Kaia Wallet apps; USDT on Kaia updates
- LINE Developers: LIFF API reference; Messaging API; Mini dApp/dApp Portal docs and FAQ

## 13) Next Steps
1. Create LINE Provider → Messaging API channel → LIFF app; set callback URL
2. Deploy a simple Node webhook; echo messages
3. Add LIFF Send page that builds a USDT tx and asks Kaia Wallet to sign
4. Unblock test funds on Kaia; test P2P send; add recipient notify
5. Optional: deploy RemittanceRouter (feeBps=50 = 0.5%) and switch LIFF to call

## 14) Future Enhancements
- Sponsor gas (paymaster) so users don’t need KAIA
- Contacts/aliases synced to LINE friends
- approve+remit
- Instant quotes with slippage guard; on-chain settlement checks
- Regulated off-ramps per corridor; automate payouts
- Risk/compliance: limits, screening, fraud patterns
# Sample Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, and a Hardhat Ignition module that deploys that contract.

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat ignition deploy ./ignition/modules/Lock.js
```
