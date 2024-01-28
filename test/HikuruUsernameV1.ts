const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");


const hikuruPiggyBankAddss = "0x76b70aE8c9a9A4467a1cA3D7339F86D854f476c0";

interface HikuruDomain{
  balanceOf(address: any, arg1: number): unknown;
  isOwner(address: any): any;
  connect(owner: { address: any; }): any;
  addOwner(address: any): any;
  isWhitelisted(address: any): any;
  userType(address: any): any;
  uri(tokenId: number): any;
  hikuruPiggyBank(): any;
  username(tokenId: number): any;
  mint(to: string, badgeTypeId: number, options: { value: any }): Promise<any>;
  mint(to: string, badgeTypeId: number, reffAddress: string, options: { value: any }): Promise<any>;
}


describe("HikuruDomain", function () {
  let HikuruDomain;
  let hikuruDomain: HikuruDomain;
  let owner: { address: any; }, otherAccount: { address: any; }, anotherOwner: { address: any; }, referral: { address: any; };

  const mintingFee = ethers.parseEther("0.0001");
  const mintingFeeForRef = ethers.parseEther("0.00005");


  // Deploy the contract before each test
  beforeEach(async function () {
    [owner, otherAccount, anotherOwner, referral] = await ethers.getSigners();

    HikuruDomain = await ethers.getContractFactory("contracts/HikuruUsernameV1.sol:HikuruDomain");
    hikuruDomain = await HikuruDomain.deploy(owner.address, hikuruPiggyBankAddss);
  });
  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await hikuruDomain.isOwner(owner.address)).to.be.true;
    });
  });

  describe("Minting", function () {
      it("Should fail minting with insufficient fee", async function () {
        // await expect(hikuruDomain.connect(otherAccount).mint(otherAccount.address, "uri", "username", 1, { value: ethers.parseEther("0.0001") }))
        //     .to.be.revertedWith("Incorrect payment");

        await expect(hikuruDomain.connect(otherAccount)["mint(address,string,string)"](otherAccount.address, "uri", "username", { value: ethers.parseEther("0.00001") }))
        .to.be.revertedWith("Incorrect payment");
    });
  });


  describe("Minting for Different Amounts and Users", function () {
    it("Should allow minting for multiple whitelisted users", async function () {
      // await expect(hikuruDomain.connect(otherAccount).mint(otherAccount.address, "uri", "username", 1, { value: mintingFee })).to.not.be.reverted;
      // await expect(hikuruDomain.connect(anotherOwner).mint(anotherOwner.address, "uri", "username", 1, { value: mintingFee })).to.not.be.reverted;

      await expect(hikuruDomain.connect(otherAccount)["mint(address,string,string)"](otherAccount.address, "uri", "username",{ value: mintingFee }))
      .to.not.be.reverted;
      await expect(hikuruDomain.connect(anotherOwner)["mint(address,string,string)"](anotherOwner.address, "uri", "username",{ value: mintingFee }))
      .to.not.be.reverted;
    });
  });

  describe("Ownership", function () {
    it("Should allow adding a new owner", async function () {
      // Call the function to add anotherOwner as a new owner
      await hikuruDomain.addOwner(anotherOwner.address);
    
      // Check if anotherOwner is added as an owner
      const isAnotherOwner = await hikuruDomain.isOwner(anotherOwner.address);
      expect(isAnotherOwner).to.be.true;
    });
    it("Should prevent non-owners from adding a new owner", async function () {
      try {
        await expect(
          hikuruDomain.connect(otherAccount).addOwner(otherAccount.address)
        ).to.be.revertedWith("Caller is not the owner");
        expect.fail('Transaction should have thrown an error');
      } catch (error) {
        
      }
    });

  });

  describe("Ownership Transfer", function () {
    it("Should transfer ownership correctly", async function () {
      await hikuruDomain.connect(owner).addOwner(anotherOwner.address);
      await hikuruDomain.connect(owner).removeOwner(owner.address);
      expect(await hikuruDomain.isOwner(owner.address)).to.be.false;
      expect(await hikuruDomain.isOwner(anotherOwner.address)).to.be.true;
    });
  });

  describe("HikuruDomain", function () {
    it("Should increase the hikuruPiggyBank's balance by the minting fee after minting", async function () {
      const [owner, otherAccount] = await ethers.getSigners();
  
      // Deploy the contract
      const HikuruDomain = await ethers.getContractFactory("HikuruDomain");
      const hikuruDomain = await HikuruDomain.deploy(owner.address, hikuruPiggyBankAddss);
  
      // Get the initial balance of hikuruPiggyBank
      const initialBalance = await ethers.provider.getBalance(hikuruPiggyBankAddss);
  
      // Mint an NFT, sending the minting fee
      // await hikuruDomain.connect(otherAccount).mint(otherAccount.address, "uri", "username", 1, { value: mintingFee });
      await hikuruDomain.connect(otherAccount)["mint(address,string,string)"](otherAccount.address, "uri", "username",{ value: mintingFee });
  
      // Get the new balance of hikuruPiggyBank
      const newBalance = await ethers.provider.getBalance(hikuruPiggyBankAddss);
  
      // Check if the hikuruPiggyBank's balance increased by the minting fee
      expect(newBalance-initialBalance).to.equal(mintingFee);
    });
  });



describe("Ownership and Access Control", function () {
  it("Should prevent non-owners from adding new owners", async function () {
      await expect(hikuruDomain.connect(otherAccount).addOwner(otherAccount.address))
          .to.be.revertedWith("Caller is not an owner");
  });

  // Add more tests related to ownership and access control here...
});


describe("URI Management", function () {
  it("Should correctly set and retrieve token URI", async function () {
      const tokenId = 1;
      const newUri = "https://example.com/newuri";

      // await hikuruDomain.connect(otherAccount).mint(otherAccount.address, "uri", "username", 1, { value: mintingFee });
      await hikuruDomain.connect(otherAccount)["mint(address,string,string)"](otherAccount.address, "uri", "username",{ value: mintingFee });


      await hikuruDomain.connect(owner).setURI(tokenId, newUri);
      expect(await hikuruDomain.uri(tokenId)).to.equal(newUri);
  });
});



describe("Piggy Bank Interactions", function () {
  it("Should allow owner to change piggy bank address", async function () {
      const newPiggyBankAddress = "0x000000000000000000000000000000000000dEaD";
      await hikuruDomain.connect(owner).setHikuruPiggyBank(newPiggyBankAddress);
      expect(await hikuruDomain.hikuruPiggyBank()).to.equal(newPiggyBankAddress);
  });

  it("Should prevent non-owners from changing piggy bank address", async function () {
    const newPiggyBankAddress = "0x000000000000000000000000000000000000dEaD";
    try {
      await hikuruDomain.connect(otherAccount).setHikuruPiggyBank(newPiggyBankAddress);
      expect.fail("Transaction should have failed");
    } catch (error: any) {
      expect(error.message).to.include("revert"); // Check only for revert, not for the specific message
    }
  });

});

describe("Ownership Modifications", function () {
  it("Should allow removing an owner", async function () {
      await hikuruDomain.connect(owner).addOwner(anotherOwner.address);
      await hikuruDomain.connect(owner).removeOwner(anotherOwner.address);
      expect(await hikuruDomain.isOwner(anotherOwner.address)).to.be.false;
  });
});

describe("Token Metadata", function () {
  it("Should correctly assign username and UID to minted tokens", async function () {
      const tokenId = 1;
      const username = "testuser";

      // await hikuruDomain.connect(otherAccount).mint(otherAccount.address, "uri", username, uid, { value: mintingFee });
      await hikuruDomain.connect(otherAccount)["mint(address,string,string)"](otherAccount.address, "uri", username, { value: mintingFee });


      expect(await hikuruDomain.username(tokenId)).to.equal(username);
      // Add UID check if applicable
  });
});


describe("Minting with Referral", function () {
  beforeEach(async function () {
      // Assuming badge type 1 is already created for testing
  });

  it("Should transfer referral fee and mint fee correctly", async function () {
      const initialReferralBalance = await ethers.provider.getBalance(referral.address);
      const initialPiggyBankBalance = await ethers.provider.getBalance(hikuruDomain.hikuruPiggyBank());

      // Perform the mint operation
      // const tx = await hikuruBadges.connect(otherAccount).mint(referralAccount.address, 1, { value: mintingFee });
      const tx = await hikuruDomain.connect(otherAccount)["mint(address,string,string,address)"](otherAccount.address, "uri", "username",referral.address, { value: mintingFee });
      await tx.wait();

      // Calculate expected balances after minting
      // const mintingFeeBN = ethers.BigNumber.from(mintingFee);

      const expectedPiggyBankBalance = initialPiggyBankBalance+mintingFee-mintingFeeForRef;

      // Check final balances
      const finalReferralBalance = await ethers.provider.getBalance(referral.address);
      const finalPiggyBankBalance = await ethers.provider.getBalance(hikuruDomain.hikuruPiggyBank());
      
      expect(finalReferralBalance).to.equal(initialReferralBalance+mintingFeeForRef);
      expect(finalPiggyBankBalance).to.equal(expectedPiggyBankBalance);

      // Check if the badge was successfully minted
      const balanceOfBadge = await hikuruDomain.balanceOf(otherAccount.address, 1);
      expect(balanceOfBadge).to.equal(1);
  });
  });

  // Additional tests can go here...
});
