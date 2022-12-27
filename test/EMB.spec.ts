import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { EMBToken } from "../typechain-types"

const provider = ethers.provider
let account1: SignerWithAddress
let account2: SignerWithAddress
let protocolAddress: SignerWithAddress
let rest: SignerWithAddress[]

let EMBToken: EMBToken

describe("EMB", function () {
  beforeEach(async () => {
    [account1, account2, protocolAddress, ...rest] = await ethers.getSigners();

    EMBToken = (await (await ethers.getContractFactory("EMBToken")).deploy("EMB Token", "EMB")) as EMBToken
    await EMBToken.deployed()
  })

  describe("setup", () => {
    it("Init params", async () => {
      await expect(EMBToken.totalSupply()).to.eventually.equal(0);
      await expect(EMBToken.name()).to.eventually.equal("EMB Token");
      await expect(EMBToken.symbol()).to.eventually.equal("EMB");
    })
  })

  describe("test setProtocol", () => {
    it("test set protocol failed due to wrong owner", async () => {
      await expect(EMBToken.connect(account2).setProtocol(protocolAddress.address)).to.be.revertedWith("EMB: only owner");
    })
    it("test set protocol successfully", async () => {
      await EMBToken.connect(account1).setProtocol(protocolAddress.address);
      await expect(EMBToken.protocol()).to.eventually.equal(protocolAddress.address);
    })
  })

  describe("test mint", () => {
    it("test mint failed due to wrong minter", async () => {
      await expect(EMBToken.mint(account1.address, 100)).to.be.revertedWith("EMB: only protocol");
    })

    it("test mint successfully", async () => {
      await EMBToken.setProtocol(protocolAddress.address);
      await EMBToken.connect(protocolAddress).mint(account1.address, 100);
      await expect(EMBToken.balanceOf(account1.address)).to.eventually.equal(100);
    })
  })
})
