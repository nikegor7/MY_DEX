// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Factory_Token/IPairERC20.sol";
import "./Token/ERC_20.sol";
import "./libraries/Math.sol";
import "./interfaces/IFactory.sol";

contract NewPair is ERC20, Math {
    
    address public token0;
    address public token1;

    uint private reserve0;
    uint private reserve1;

    address public factoryAddress;
    bool private isEntered;
    
    // For Staking
    address public rewardsToken;
    mapping(address => uint) public stakedAddress;
    mapping (address => uint) public blockTimeStamp;
    
    /*

    we simply need to add a flag that is set when swap function is called;
    and we won’t allow to call the function if flag is set

    */

    modifier nonReentrant() {
        require(!isEntered,"False");
        isEntered = true;

        _;

        isEntered = false;
    } 

    /*

    CONSTRUCTOR OF TOKEN0, TOKEN1, REWARDTOKEN ADDRESSES

    */

    constructor(address _token0, address _token1, address _rewardToken) ERC20("MyDEXPair","PAIR") {
        token0= _token0;
        token1= _token1;
        rewardsToken = _rewardToken;
        factoryAddress= msg.sender;
    } 

    /*

    simple function to get reserve of amount of Token0
    an amount what was added to pool liquidity 

    */

    function getReserve0() public view returns (uint256) {
        return reserve0;
    }

    /*

    simple function to get reserve of amount of Token1
    an amount what was added to pool liquidity 

    */

    function getReserve1() public view returns (uint256) {
        return reserve1;
    }

    /*

    function to update reserve0 and reserve1
    reserve0 and reserve1 variable are used to track reserves in pools

    */

    function _update(uint _reserve0, uint _reserve1) private {
        reserve0 = _reserve0;
        reserve1 = _reserve1;
    }

    /*

    addLiquidity a main function to create a liqudity of 2 tokens
    user must transfer 2 tokens to add it in pool
    if TotalTokens - amount of LP tokens is 0
    Uniswap V2 ended up using geometric mean of deposited amounts:
         liquidity = Math.sqrt(_amount0 * _amount1);
    if pool is not empty we use this 
        liquidity = Math.min(
                (_amount0 * totalTokens) / reserve0,
                (_amount1 * totalTokens) / reserve1
            );
​    after that we mint new LP tokens and transfer it to msg.sender. 
    User can transfer, swap, burn that tokens.
    
    */

    function addLiquidity(uint256 _amount0, uint256 _amount1) public returns (uint256 liquidity) {
        IERC20 token0_ = IERC20(token0);
        IERC20 token1_ = IERC20(token1);
        token0_.transferFrom(msg.sender, address(this), _amount0);
        token1_.transferFrom(msg.sender, address(this), _amount1);

        if (reserve0 > 0 || reserve1 > 0) {
            require(reserve0 * _amount1 == reserve1 * _amount0, "x / y != dx / dy");
        }
 
        if (totalTokens == 0) {
            liquidity = Math.sqrt(_amount0 * _amount1);
            blockTimeStamp[msg.sender]=block.timestamp;
        } else {
            liquidity = Math.min(
                (_amount0 * totalTokens) / reserve0,
                (_amount1 * totalTokens) / reserve1
            );
            if (balanceOf(msg.sender) == 0) {
                blockTimeStamp[msg.sender] = block.timestamp;
            } else {
                _updateStateForStaking(msg.sender);
            }
        }
        
        require(liquidity > 0, "liquidityTokens = 0");
        mint(msg.sender, liquidity);

        

        _update(IERC20(token0).balanceOf(address(this)), IERC20(token1).balanceOf(address(this)));
    }

    /*
    
    The opposite of addLiquidity is to burn or removeLiquidity.
    User send LP tokens which he wants to burn and to get back 
    the tokens which were added to pool in equal ratio
    
    */

    function removeLiquidity(uint _liquidity)
        public
        returns (uint amount0, uint amount1)
    {
        
        uint bal0 = IERC20(token0).balanceOf(address(this));
        uint bal1 = IERC20(token1).balanceOf(address(this));

        amount0 = (_liquidity * bal0) / totalTokens;
        amount1 = (_liquidity * bal1) / totalTokens;
        require(amount0 > 0 && amount1 > 0, "amount0 or amount1 = 0");
        burn(msg.sender, _liquidity);
        _update(bal0 - amount0, bal1 - amount1);

        _updateAmountForStaking(msg.sender);

        IERC20(token0).transferTo(msg.sender, amount0);
        IERC20(token1).transferTo(msg.sender, amount1);
    }

    /*

    Swap function of two tokens
    User add one token to get another token
    User can swap tokens if they're in the pool

    In this function every swap transaction grabs a commision 
    0.3% of every transaction and adds it to pool
    to share it to all pool-providers in equal ratio of deposited amounts

    */

    function swap(address _tokenIn, uint _amountIn) public nonReentrant returns(uint amountOut) {
        
        require(
            _tokenIn == address(token0) || _tokenIn == address(token1),
            "invalid token"
        );
        require(_amountIn > 0, "amount in = 0");

        bool isToken0 = _tokenIn == address(token0);
        (address tokenIn, address tokenOut, uint reserveIn, uint reserveOut) = isToken0
            ? (token0, token1, reserve0, reserve1)
            : (token1, token0, reserve1, reserve0);

        IERC20(tokenIn).transferFrom(msg.sender, address(this), _amountIn);

        // 0.3% fee
        uint amountInWithFee = (_amountIn * 997) / 1000;
        amountOut = (reserveOut * amountInWithFee) / (reserveIn + amountInWithFee);

        IERC20(tokenOut).transferTo(msg.sender, amountOut);

        _update(IERC20(token0).balanceOf(address(this)), IERC20(token1).balanceOf(address(this)));
    }

    /*

    function to send LP tokens to different account

    */

    function sendLP(address to, uint256 amount) public {
        transferTo(to,amount);
    }

    // Staking

    /*

    Function to update staking state. If user want to send, mint, burn LP tokens, the state will change 

    */

    function _updateStateForStaking(address user) private returns(uint256){
    
        stakedAddress[user] = _updateAmountForStaking(user);
        blockTimeStamp[user] = block.timestamp;

        return (stakedAddress[user]);
    }

    /*

    Function to show staked tokens which were earned for providing liquidity
    depends on amount of LP tokens
    1 token = 1/10 of LP tokens per day what were created.
    liquidity calculates with formula: sqrt(amount0 * amount1)
    */

    function _updateAmountForStaking(address user) public view returns (uint256){

        uint256 time = block.timestamp - blockTimeStamp[user];
        uint256 amount = (stakedAddress[user] + (balanceOf(user) * time) / 86400) / 10;

        return amount;
    }

    /*

    Function to withdraw reward Token to user account
    you can't withdraw if there're no staking tokens.

    stakedTokens calls _updateStateForStaking to calculate how much tokens contract must mint to user 

    */

    function withdraw() public{
        IPairERC20 token = IPairERC20(rewardsToken);
        uint256 stakedTokens = _updateStateForStaking(msg.sender);

        require(stakedTokens >0, "Zero Tokens to withdraw");

        token.mint(msg.sender, stakedTokens);
        stakedAddress[msg.sender] = 0;
    }

    /*

    function that change state before transfer

    */

    // function _beforeTokenTransfer(
    //     address from,
    //     address to,
    //     uint256
    // ) internal virtual {
    //     _updateStateForStaking(from);
    //     if (balanceOf(to) == 0) {
    //         blockTimeStamp[to] = block.timestamp;
    //     } else {
    //         _updateStateForStaking(to);
    //     }
    // }


}
