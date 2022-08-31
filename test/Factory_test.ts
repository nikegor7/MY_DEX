import {ethers} from 'hardhat';
import {expect} from 'chai';

const toWei = (value : any) => ethers.utils.parseEther(value.toString());

describe("Factory tests", function(){

    let owner : any;
    let user : any;
    let token0 :any;
    let token1 :any;
    let factory:any;
    let account2:any;

    beforeEach(async ()=>{
        [owner,user,account2] = await ethers.getSigners();

        const Token0 = await ethers.getContractFactory("Token");
        token0 = await Token0.deploy("QWERTY","QWE",toWei(1000000));
        await token0.deployed();

        const Token1 = await ethers.getContractFactory("Token");
        token1 = await Token1.deploy("ASDFG","ASD",toWei(1000000));
        await token1.deployed();

        const Factory = await ethers.getContractFactory("Factory2");
        factory = await Factory.deploy();
        await factory.deployed();

        await factory.mint(factory.address, toWei(10000) );
    });

    it("Factory is deployed", async()=>{
        expect(await factory.deployed()).to.equal(factory);
        expect(await factory.name()).to.equal("MACToken");
        expect(await factory.symbol()).to.equal("MAC");
        expect(await factory.decimals()).to.equal(18);
        expect(await factory.totalSuply()).to.equal(toWei(10000));
    });

    describe("Create new Pair of tokens", async()=>{
        it("deploys an pair",async()=>{
            const pairAddress = await factory.callStatic.createPair(token0.address, token1.address);
            await factory.createPair(token0.address, token1.address);
            expect(await factory.pairs(token0.address, token1.address)).to.equal(pairAddress);

            const Exchange = await ethers.getContractFactory("NewPair");
            const exchange = Exchange.attach(pairAddress);
        });

        it("doesn't allow zero address", async () => {
            await expect(
              factory.createPair("0x0000000000000000000000000000000000000000","0x0000000000000000000000000000000000000000")            ).to.be.revertedWith("invalid token address");
        });
        
        it("fails when exchange exists", async () => {
            await factory.createPair(token0.address,token1.address);
      
            expect(factory.createPair(token0.address, token1.address)).to.be.revertedWith(
              "Pair already exists" );
        });  
    });

    describe("Get Pair", async()=>{
        it("return pair address by tokens adresses", async ()=>{
            const pairAddress = await factory.callStatic.createPair(token0.address, token1.address);
            await factory.createPair(token0.address, token1.address);
            expect(await factory.getPair(token0.address, token1.address)).to.equal(pairAddress);
        console.log(pairAddress);
        
        });
    });


    describe("Balance",function(){
        
        it("owner should have all tokens of totalsuply on balance", async function() {
        const balance = await factory.balanceOf(owner.address);
        expect(balance).to.eq(0);
        })    
    })


    describe("Mint", function(){

        it("Should mint the token ", async function(){

             await factory.mint(owner.address, toWei(1000));
            const balance = await factory.balanceOf(owner.address);
            expect(balance).to.eq(toWei(1000));
        })

    })

    describe("Burn", async function(){
        it("Shold burn the tokens", async function(){
 
             await factory.mint(owner.address, toWei(1000));
             await factory.burn(owner.address, toWei(500));
            const balance = await factory.balanceOf(owner.address);
            expect(balance).to.eq(toWei(500));    
        })

    })

    describe("Transactions", function(){
        
        it("Should be possible to transfer tokens from owner to other account", async function(){
            await factory.mint(owner.address, toWei(1000));
            await factory.connect(owner).transferTo(user.address, toWei(500));
            const balanceuser = await factory.balanceOf(user.address);
            expect(balanceuser).to.equal(toWei(500)); 
        })

        it("Function 'approve', transferFrom, allowance", async function(){
            await factory.mint(owner.address, toWei(10000));
           // await factory.connect(owner).approve(user.address, toWei(1000));
            await factory._approve(owner.address,user.address, toWei(1000));

            expect(await factory.connect(owner).allowance(owner.address, user.address)).to.equal(toWei(1000))
            const tx = await factory.connect(owner).transferFrom(owner.address, user.address, toWei(1000) );

        })

        it("Should be possible to run events: Approve and Transfer", async function(){
            await factory.mint(owner.address, toWei(10000));
            expect(await factory.balanceOf(owner.address)).to.equal(toWei(10000));
            expect(await factory.connect(owner).totalSuply()).to.equal(toWei(20000));
            const Eventemit = await factory.connect(owner).approve(user.address, toWei(1000));
            await expect(Eventemit).to.emit(factory,'Approve').withArgs(owner.address, user.address, toWei(1000));
            const tx = await factory.connect(owner).transferFrom(owner.address, user.address, toWei(1000) );
            await expect(() => tx).to.changeTokenBalance(factory, user.address, toWei(1000)); 
            await expect(tx).to.emit(factory,'Transfer').withArgs(owner.address, user.address, toWei(1000));
        })

        it("Revert if you don't have enough tokens", async function(){
            await expect(factory.connect(account2).transferTo(user.address, 1000 )).to.be.revertedWith("You have not enough tokens");
            const balanceOwner = await factory.balanceOf(owner.address);
            expect(await factory.balanceOf(owner.address)).to.equal(balanceOwner);
        })
    })

});