import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { Protocol, ERC20, EMBToken} from "../typechain-types"
import { utils } from "ethers";
import { token } from "../typechain-types/@openzeppelin/contracts";


const provider = ethers.provider
let account1: SignerWithAddress
let account2: SignerWithAddress
let rest: SignerWithAddress[]

let EMBToken: EMBToken
let protocol: Protocol
let ECDSA: any
let merkleRoot: string

describe("Protocol", function () {
  before(async () => {
    [account1, account2, ...rest] = await ethers.getSigners();

    EMBToken = (await (await ethers.getContractFactory("EMBToken")).deploy("EMB Token", "EMB")) as EMBToken
    await EMBToken.deployed()
  })

  beforeEach(async () => {
    protocol = await (await ethers.getContractFactory("Protocol")).deploy(account1.address, EMBToken.address)
    ECDSA = (await (await ethers.getContractFactory("ECDSA")).deploy()) 

    await protocol.deployed()
    await EMBToken.setProtocol(protocol.address);
  })

  describe("setup", () => {

    it("should deploy correctly", async () => {
      // if the beforeEach succeeded, then this succeeds
    })

    it("EMB should have set the protocol address", async () => {
      await expect(EMBToken.protocol()).to.eventually.equal(protocol.address)
    })

    it("init params", async () => {
      await expect(protocol.EMBToken()).to.eventually.equal(EMBToken.address)
      await expect((await protocol.functions['signer']()).toString()).to.be.equal(account1.address)
      const abiEncoder = ethers.utils.defaultAbiCoder;
      const chainId = 31337;
      let hash = utils.keccak256(
                abiEncoder.encode(
                  [ "bytes32", "bytes32", "bytes32", "uint256", "address"],
                  [
                    utils.keccak256(utils.toUtf8Bytes("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)")),
                    utils.keccak256(utils.toUtf8Bytes("Protocol")),
                    utils.keccak256(utils.toUtf8Bytes("v1")),
                    chainId,
                    protocol.address.toString()
                  ]
                )
              )
      await expect(protocol.EIP712_DOMAIN()).to.eventually.equal(hash)
    })
  })

  describe("Signature minting", () => {
    it("test minting token by using correct signature", async () => {
      const abiEncoder = ethers.utils.defaultAbiCoder;
      const amount = 100;
      const structHash = utils.keccak256(abiEncoder.encode(["bytes32", "address", "uint256"], [await protocol.SUPPORT_TYPEHASH(), account2.address, amount]));
      const encodePacked =  ethers.utils.concat([ ethers.utils.toUtf8Bytes('\x19\x01'),  ethers.utils.arrayify(await protocol.EIP712_DOMAIN()), ethers.utils.arrayify(structHash) ])
      const digest = utils.arrayify(utils.keccak256(encodePacked));
      const signature = await account1.signMessage(digest);
      await expect(ethers.utils.recoverAddress(utils.hashMessage(digest), signature)).to.be.equal(account1.address);
      await protocol.signatureMint(signature, account2.address, amount);
      await expect(EMBToken.balanceOf(account2.address)).to.eventually.equal(amount);
    })

    it("test minting token failed by using incorrect amount", async () => {
      const abiEncoder = ethers.utils.defaultAbiCoder;
      const amount = 100;
      const wrongAmount = 101;
      const structHash = utils.keccak256(abiEncoder.encode(["bytes32", "address", "uint256"], [await protocol.SUPPORT_TYPEHASH(), account2.address, amount]));
      const encodePacked =  ethers.utils.concat([ ethers.utils.toUtf8Bytes('\x19\x01'),  ethers.utils.arrayify(await protocol.EIP712_DOMAIN()), ethers.utils.arrayify(structHash) ])
      const digest = utils.arrayify(utils.keccak256(encodePacked));
      const signature = await account1.signMessage(digest);
      await expect(ethers.utils.recoverAddress(utils.hashMessage(digest), signature)).to.be.equal(account1.address);
      await expect(protocol.signatureMint(signature, account2.address, wrongAmount)).to.be.rejectedWith('Protocol: invalid signature');
    })

    it ("test minting token failed by using incorrect address", async () => {
      const abiEncoder = ethers.utils.defaultAbiCoder;
      const amount = 100;
      const structHash = utils.keccak256(abiEncoder.encode(["bytes32", "address", "uint256"], [await protocol.SUPPORT_TYPEHASH(), account2.address, amount]));
      const encodePacked =  ethers.utils.concat([ ethers.utils.toUtf8Bytes('\x19\x01'),  ethers.utils.arrayify(await protocol.EIP712_DOMAIN()), ethers.utils.arrayify(structHash) ])
      const digest = utils.arrayify(utils.keccak256(encodePacked));
      const signature = await account1.signMessage(digest);
      await expect(ethers.utils.recoverAddress(utils.hashMessage(digest), signature)).to.be.equal(account1.address);
      await expect(protocol.signatureMint(signature, rest[0].address, amount)).to.be.rejectedWith('Protocol: invalid signature');
    })

    it ("test minting token failed by using incorrect signer", async () => {
      const abiEncoder = ethers.utils.defaultAbiCoder;
      const amount = 100;
      const structHash = utils.keccak256(abiEncoder.encode(["bytes32", "address", "uint256"], [await protocol.SUPPORT_TYPEHASH(), account2.address, amount]));
      const encodePacked =  ethers.utils.concat([ ethers.utils.toUtf8Bytes('\x19\x01'),  ethers.utils.arrayify(await protocol.EIP712_DOMAIN()), ethers.utils.arrayify(structHash) ])
      const digest = utils.arrayify(utils.keccak256(encodePacked));
      const signature = await account2.signMessage(digest);
      await expect(ethers.utils.recoverAddress(utils.hashMessage(digest), signature)).to.be.equal(account2.address);
      await expect(protocol.signatureMint(signature, account2.address, amount)).to.be.rejectedWith('Protocol: invalid signature');
    })
  })
})
