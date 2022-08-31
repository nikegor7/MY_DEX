// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./IERC_20.sol";

contract ERC20 is IERC20{
    address public owner;
    uint public totalTokens;
    string private _name;
    string private _symbol;
    mapping(address => uint) private balances;
    mapping(address => mapping(address => uint)) private allowances;


    modifier EnoughTokens(address _from, uint _amount){
        require(balanceOf(_from) >= _amount,"You have not enough tokens");
        require(msg.sender != address(0), "Not permited");
        _;
    }
 
  
   // basic function with name, symbol, etc.

    function name() external view override returns(string memory){
        return _name;
    }

    function symbol() external view override returns(string memory){
        return _symbol;
    }

    function decimals() external pure override returns(uint){
        return 18;
    }

    function totalSuply() public view override returns(uint){
        return totalTokens; 
    }

  constructor(string memory name_, string memory symbol_){
        _name = name_;
        _symbol = symbol_;    

    }

    function balanceOf(address account) public view override returns(uint){
        return balances[account];
    }

    function transferTo(address to, uint amount) public override EnoughTokens(msg.sender, amount) returns(bool) {
        
        balances[msg.sender] -= amount;
        balances[to] += amount;
        emit Transfer(msg.sender, to, amount);
        
        return true;
    }

    function approve(address spender, uint amount) public override returns(bool) {
        _approve(msg.sender, spender, amount);
        return true;
    }

    function _approve(address sender, address spender, uint amount) internal virtual{
        allowances[sender][spender] = amount;
        emit Approve(sender, spender, amount);
    }

    function allowance(address _owner, address spender) public view override returns(uint){
        return allowances[_owner][spender];
    }

    function transferFrom(address sender, address recipient, uint amount) public override EnoughTokens(sender, amount) returns(bool){
        
        balances[sender] -= amount;
        allowances[sender][recipient] -= amount;
        balances[recipient] += amount;
        emit Transfer(sender, recipient, amount);
       
        return true;
    }

    function mint(address account, uint amount) public override{
        
        totalTokens += amount;
        unchecked{
        balances[account] +=amount;
        }
        emit Transfer(address(0),account, amount);
        
    }

    function burn(address _from, uint amount) public override {
       
       unchecked{
        balances[_from] -= amount;
        totalTokens -= amount;
       }
        emit Transfer(_from, address(0), amount);
        
    }




}
