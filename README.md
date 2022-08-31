# Sample DEX V2

This project is a simple representation of DEX v2. This project allows you to use your crypto assets for the exchange.

It consists of :<br>
• Smart contracts <br>
• Tests<br>
• Deploy script <br>

<h2>Structural part</h2>
There are 3 main smart contracts in this project:<br>
<h4><a href="https://github.com/nikegor7/MY_DEX/blob/main/contracts/NewPair.sol"> NewPair </a></h4>

<p>To work with this contract, you need to create a factory.<br> It creates a pair of tokens with which you can use the following functions:<br>
  &nbsp&nbsp&nbsp&nbsp•Add/Remove liquidity.<br>
  &nbsp&nbsp&nbsp&nbsp•Swap tokens for tokens.<br>
  &nbsp&nbsp&nbsp&nbsp•Receive staking tokens of factory as reward for providing liquidity.<br></p>

<h4><a href="https://github.com/nikegor7/MY_DEX/blob/main/contracts/Factory2.sol"> Factory2</a></h4>

<p>Еhis contract allows you:<br>
&nbsp&nbsp&nbsp&nbsp•Create an exchanger with two different pairs<br>
&nbsp&nbsp&nbsp&nbsp•Return the address of these pairs</p>
The factory allows you to create several exchangers that will work together and charge tokens of this factory to users for providing liquidity.<br>

<h4><a href="https://github.com/nikegor7/MY_DEX/blob/main/contracts/Token/Token.sol"> Token</a></h4>
> Token</a></h4>

Token contract allows to create token with name, symbol, and initial supply.<br>
This project consists of two types of token. One is for liqudity and swap. Another as reward for staking.<br>
First one uses ERC20 contract and is used in NewPair. Second one uses PairERC20 and is used in Factory2<br>

Below is the index of Hardhat coverage.
![image](https://user-images.githubusercontent.com/105046215/187793045-c8e4a725-41a3-4035-8ddf-6f746a6724e3.png)
