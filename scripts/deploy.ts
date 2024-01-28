// scripts/deploy_upgradeable_box.js
const { ethers, upgrades } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    const HikuruUsernameV1 = await ethers.getContractFactory("HikuruUsernameV1");
    console.log("Deploying Username...");
    const HikuruUsernameContract = await upgrades.deployProxy(HikuruUsernameV1, [deployer.address, "0x45b6cebf3528fc8a52657e73b7dedafe122c1308", "49000000", ["0xc2132d05d31c914a87c6611c10748aeb04b58e8f", "0x2791bca1f2de4661ed88a30c99a7a9449aa84174"]], {
        initializer: "initialize",
        kind: "uups"
    });
    await HikuruUsernameContract.waitForDeployment();
    console.log("Username Contract deployed to: ", HikuruUsernameContract.target);
    console.log("Deployer: ", deployer.address);

    return {HikuruUsernameContract, deployer}
}

main();