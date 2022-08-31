//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./NewPair.sol";
import "./Factory_Token/PairERC20.sol";
contract Factory2 is PairERC20{

    /*

    mapping to store Pair adress, when pair is created 

    */
    mapping(address => mapping(address => address)) public pairs;

    /*

    constructor with token what will be as reward of staking
    Creates as simple token of this factory/platform

    */
    constructor() PairERC20("MACToken", "MAC", address(this)) {}

    /*

    Function Create Pair, adds two address to return the address of this pair
    Pair address is stored  in mapping pairs

    Tokens can't be Zero addresses
    And you can't to add the same addresses, if pair is already created 

    */

    function createPair(address tokenA , address tokenB) public returns (address) {
             
        require(tokenA != address(0) || tokenA != address(0), "invalid token address");
        
        require( pairs[tokenA][tokenA] == address(0),"Pair already exists" );
        //IPairERC20 token = IPairERC20(address(this));
        NewPair pair = new NewPair(tokenA, tokenB, address(this));
        pairs[tokenA][tokenB]= address(pair);
        return address(pair);
    }

    /*

    function to get pair,
    can be used to call in another contract via Interface

    */

    function getPair(address tokenA, address tokenB) public view returns (address) {
        return pairs[tokenA][tokenB];
    }
}