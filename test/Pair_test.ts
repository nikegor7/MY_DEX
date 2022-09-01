import {ethers} from 'hardhat';
import {expect} from 'chai';

const toWei = (value : any) => ethers.utils.parseEther(value.toString());
const fromWei = (value : any) =>
  ethers.utils.formatEther(
    typeof value === "string" ? value : value.toString()
  );

const createPair = async function (factory: any, tokenA: any, tokenB:any, sender: any) {
    const pairAddress = await factory.connect(sender).callStatic.createPair(tokenA, tokenB)

    await factory.connect(sender).createPair(tokenA, tokenB)

    const Pair = await ethers.getContractFactory("NewPair")

    return Pair.attach(pairAddress)
}

describe("DEX/AMM tests", function(){

    let owner : any;
    let user : any;

    let token0 :any;
    let token1 :any;
    let tokenStake:any;
    let factory:any;

    let pair : any;
    let stakeToken : any;
   
    beforeEach(async () =>{
        [owner,user] = await ethers.getSigners();

        const Token0 = await ethers.getContractFactory("Token");
        token0 = await Token0.deploy("QWERTY","QWE",toWei(1000000));

        const Token1 = await ethers.getContractFactory("Token");
        token1 = await Token1.deploy("ASDFG","ASD",toWei(1000000));

        const Factory = await ethers.getContractFactory("Factory2");
        factory = await Factory.deploy();
       
        pair = await createPair(factory, token0.address, token1.address, owner);
               
    });

    describe("Deploy",async()=>{
        it("deploy",async()=>{
            expect(await pair.name()).to.equal("MyDEXPair");
            expect(await pair.symbol()).to.equal("PAIR");
            expect(await pair.decimals()).to.equal(18);
            await pair.mint(pair.address, toWei(1000));
            await pair.burn(pair.address, toWei(1000));
            await token0.mint(owner.address, toWei(1000));
            await token0.approve(user.address, toWei(100));
            expect(await token0.allowance(owner.address, user.address)).to.equal(toWei(100));
            await token0.transferFrom(owner.address, user.address, toWei(10));
        })


    });

    describe("addLiquidity", async()=>{
        describe("empty reserves", async()=>{
            
            it("adds liquidity", async()=>{
                await token0.approve(pair.address, toWei(200));
                await token1.approve(pair.address, toWei(200));
                expect(await token0.allowance(owner.address, pair.address)).to.equal(toWei(200));

                await pair.addLiquidity(toWei(200), toWei(200));
                expect (await pair.getReserve0()).to.equal(toWei(200));
                expect (await pair.getReserve1()).to.equal(toWei(200));
            })

            it("mints LP tokens", async()=>{
                await token0.approve(pair.address, toWei(200));
                await token1.approve(pair.address, toWei(200));

                await pair.addLiquidity(toWei(200), toWei(200));
                expect(await pair.balanceOf(owner.address)).to.equal(toWei(200));
                expect(await pair.totalSuply()).to.equal(toWei(200));
            })
            
            it("Doesn't allow zero amounts", async() => {
                await token0.approve(pair.address, toWei(0));
                await token1.approve(pair.address, toWei(0));
                await expect(pair.addLiquidity(toWei(0), toWei(0))).to.be.revertedWith("liquidityTokens = 0"); 
            });

            it("Add liquidity with unbalanced amounts", async ()=>{
                await token0.approve(pair.address, toWei(200));
                await token1.approve(pair.address, toWei(200));

                await pair.addLiquidity(toWei(9), toWei(4));
                expect(await pair.balanceOf(owner.address)).to.equal(toWei(6));
                expect(await pair.totalSuply()).to.equal(toWei(6));

                await pair.addLiquidity(toWei(9), toWei(4));
                expect(await pair.balanceOf(owner.address)).to.equal(toWei(12));
                expect(await pair.totalSuply()).to.equal(toWei(12));
            });

            it("Revert if not enough tokens", async()=>{
                await token0.approve(pair.address, toWei(200));
                await token1.approve(pair.address, toWei(200));
                await expect( pair.addLiquidity(toWei(300), toWei(300))).to.be.reverted;
            });

        });

        describe("Reserves with liqudity", async() =>{
           beforeEach(async ()=>{
                await token0.approve(pair.address, toWei(200));
                await token1.approve(pair.address, toWei(200));
                await pair.addLiquidity(toWei(10), toWei(10));
           });

            it("Add some balanced liqudity", async() =>{
                await pair.addLiquidity(toWei(10), toWei(10));
                expect (await pair.getReserve0()).to.equal(toWei(20));
                expect (await pair.getReserve1()).to.equal(toWei(20));
                expect(await pair.balanceOf(owner.address)).to.equal(toWei(20));
                expect(await pair.totalSuply()).to.equal(toWei(20));
            });

            it("Doesn't allow to Add some unbalanced liqudity", async() =>{
                await expect(pair.addLiquidity(toWei(15), toWei(5))).to.be.revertedWith("x / y != dx / dy");
            });

            it("fails when not enough tokens", async () => {
                await expect(pair.addLiquidity(toWei(200), toWei(200))).to.be.reverted;
            });
        });
    });

    describe("Remove Liqudity", async ()=>{
        beforeEach(async ()=>{
            await token0.approve(pair.address, toWei(200));
            await token1.approve(pair.address, toWei(200));
            await pair.addLiquidity(toWei(200), toWei(200));
        });
            it("remove some liqudity", async()=>{
                await pair.removeLiquidity(toWei(20));
                expect (await pair.getReserve0()).to.equal(toWei(180));
                expect (await pair.getReserve1()).to.equal(toWei(180));
                expect(await pair.totalSuply()).to.equal(toWei(180));
            });

            it("remove all liquidity", async()=>{
                await pair.removeLiquidity(toWei(200));
                expect (await pair.getReserve0()).to.equal(toWei(0));
                expect (await pair.getReserve1()).to.equal(toWei(0));
                expect(await pair.totalSuply()).to.equal(toWei(0));
            });

            it("Revert if user want to remove liqudity more than he has", async()=>{
                await token0.transferTo(user.address, toWei(200));
                await token1.transferTo(user.address, toWei(200));

                await token0.connect(user).approve(pair.address, toWei(200));
                await token1.connect(user).approve(pair.address, toWei(200));

                await pair.connect(user).addLiquidity(toWei(100),toWei(100));
                expect (await pair.balanceOf(user.address)).to.equal(toWei(100));
                expect  (await pair.totalSuply()).to.equal(toWei(300));
                expect (pair.connect(user).removeLiquidity(toWei(150))).to.be.reverted;
            })

            it("burn LP-Tokens", async()=>{
                await expect(()=> pair.removeLiquidity(toWei(25))).to.changeTokenBalance(pair, owner, toWei(-25));
                expect(await pair.totalSuply()).to.equal(toWei(175));
            });
    });

    describe("Swap tokens", async()=>{
            beforeEach(async()=>{
                await token0.approve(pair.address, toWei(200));
                
                await token1.approve(pair.address, toWei(200));
                
                await pair.addLiquidity(toWei(100), toWei(25));
            });
            it("Swap token0 on token1", async()=>{
                
                //reserves before
                
                const reserve1Before = await pair.getReserve1();
                expect (reserve1Before).to.equal(toWei(25));
                expect(await pair.getReserve0()).to.eq(toWei(100));
                
                //function swap

                expect(await pair.swap(token0.address, toWei(25)));

                //reserve0 after

                expect (await pair.getReserve0()).to.equal(toWei(125));
                
                //reserve1 after

                const reserve1After = await pair.getReserve1();
                expect (fromWei(reserve1After)).to.equal("20.012007204322593557");
                
                // subtraction of swap

                expect(fromWei(reserve1After.sub(reserve1Before))).to.equal("-4.987992795677406443")
            });

            it("Swap token1 on token0", async()=>{
                //reserves before
                
                const reserve0Before = await pair.getReserve0();
                expect (reserve0Before).to.equal(toWei(100));

                expect(await pair.getReserve1()).to.equal(toWei(25));

                //function swap

                expect(await pair.swap(token1.address, toWei(10)));

                //reserve1 after

                expect (await pair.getReserve1()).to.equal(toWei(35));
                
                //reserve0 after

                const reserve0After = await pair.getReserve0();
                expect (fromWei(reserve0After)).to.equal("71.489848441521303975");
                
                // subtraction of swap

                expect(fromWei(reserve0After.sub(reserve0Before))).to.equal("-28.510151558478696025");
            });

            it("Revert if zero swap", async()=>{
                await expect(pair.swap(token0.address, toWei(0))).to.be.revertedWith("amount in = 0");
            });

            it("Transfer Lp tokens", async()=>{
                expect(await pair.balanceOf(owner.address)).to.equal(toWei(50));
                
                await pair.connect(owner).sendLP(user.address, toWei(20));
                
                expect(await pair.balanceOf(owner.address)).to.equal(toWei(30));
                
                expect(await pair.balanceOf(user.address)).to.equal(toWei(20));
            })
    });

    describe("Staking tokens", async()=>{

        beforeEach(async()=>{
            await token0.approve(pair.address, toWei("1000"));
            await token1.approve(pair.address, toWei("1000"));
            
            await pair.addLiquidity(toWei(300), toWei(300));

        });

        it("Staked amount for One day", async()=>{
            await ethers.provider.send("evm_increaseTime",[86400]);
            await ethers.provider.send("evm_mine", []);
            expect(await pair._updateAmountForStaking(owner.address)).to.equal(toWei(30));
    
       
        });

        it("Withdraw staked amounts", async()=>{
            await ethers.provider.send("evm_increaseTime",[86400]);

            await expect(()=> pair.withdraw()).to.changeTokenBalance(factory, owner.address, toWei(30));
            expect(await pair._updateAmountForStaking(owner.address)).to.equal(toWei(0));
            expect(await pair.balanceOf(owner.address)).to.equal(toWei(300))
        })

        it("Withdraw 0 tokens", async()=>{
            expect(pair.withdraw()).to.be.revertedWith("Zero Tokens to withdraw");
        });

        it("Update state and amount when adds new liquidity", async()=>{
            await ethers.provider.send("evm_increaseTime",[86400]);
            await ethers.provider.send("evm_mine", []);            
            
            await pair.addLiquidity(toWei(100),toWei(100));

            expect((await pair._updateAmountForStaking(owner.address)).toString()).to.equal("3000034722222222222");
        })

        it("Update state and amount when remove liquidity", async()=>{
            await ethers.provider.send("evm_increaseTime",[86400]);
            await ethers.provider.send("evm_mine", []);
            expect((await pair._updateAmountForStaking(owner.address)).toString()).to.equal(toWei(30));

            await pair.removeLiquidity(toWei(200));
            expect(await pair.balanceOf(owner.address)).to.equal(toWei(100));
            expect((await pair._updateAmountForStaking(owner.address)).toString()).to.equal("3000034722222222222");
        });

        it("Update state and amount when transfer LP tokens", async()=>{
            await ethers.provider.send("evm_increaseTime",[86400]);
            await ethers.provider.send("evm_mine", []);

            await expect(()=> pair.transferTo(user.address, toWei(200)))
            .to.changeTokenBalances(pair,[owner.address, user.address],[toWei(-200),toWei(200)]);

            expect((await pair._updateAmountForStaking(owner.address)).toString()).to.equal("3000034722222222222");
        })
        
    });
});
