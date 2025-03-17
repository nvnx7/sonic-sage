# 🧙🏼‍♂️ SonicSage

### NOTE: The front-end source code is [here](https://github.com/nvnx7/sonic-sage-ui).

SonicSage is a binary prediction market built on the Sonic blockchain, leveraging the Logarithmic Market Scoring Rule (LMSR) mechanism for automated market making. The platform allows users to predict outcomes by purchasing shares of Yes or No with USDC tokens. Here’s a technical overview:

### 1. Market Creation:

Prediction markets are initiated by market makers who provide an initial liquidity subsidy and configure market parameters. This ensures sufficient liquidity and facilitates smooth trading from the outset.

### 2. Trading Mechanism:

- Participants can buy or sell shares of Yes or No, representing possible outcomes of an event.
- The LMSR mechanism dynamically adjusts prices based on the relative demand for each outcome, ensuring continuous liquidity and reflecting the crowd’s aggregated probability estimates.

### 3. Resolution and Payouts:

- Once the event concludes, the market is resolved to a definitive outcome.
- The accumulated USDC in the market pool is distributed proportionally among holders of the correct outcome shares, based on their stake.

### 4. Key Features:

- The LMSR model ensures that prices remain stable and predictable, even with limited trading activity.
- The system incentivizes participants to make accurate predictions by aligning payouts with the correctness of their bets.

This design promotes efficient information aggregation while maintaining decentralization and transparency through on-chain operations.
