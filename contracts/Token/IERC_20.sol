// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface IERC20{
    function name() external view returns(string memory);

    function symbol() external view returns(string memory);

    function decimals() external pure returns(uint);

    function balanceOf(address account) external view returns(uint);

    function totalSuply() external view returns(uint);

    function transferTo(address to, uint amount) external returns(bool);

    function transferFrom (address from, address to, uint amount) external returns(bool);

    function allowance(address _owner, address spender ) external view returns(uint);

    function approve(address spender, uint amount) external returns(bool);

    function mint(address to, uint amount) external ;

    function burn(address to, uint amount) external;

    event Transfer(address indexed from, address indexed to, uint amount);

    event Approve(address indexed owner, address indexed to, uint amount);
}