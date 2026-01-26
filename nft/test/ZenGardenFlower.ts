import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import { network } from "hardhat";
import { getAddress } from "viem";

describe("ZenGardenFlower", async function () {
  const { viem } = await network.connect();
  const publicClient = await viem.getPublicClient();
  const [owner, minter, user1, user2] = await viem.getWalletClients();

  describe("部署", function () {
    it("应该正确设置名称和符号", async function () {
      const flower = await viem.deployContract("ZenGardenFlower");

      const name = await flower.read.name();
      const symbol = await flower.read.symbol();

      assert.equal(name, "ZenGarden Flower");
      assert.equal(symbol, "ZENF");
    });

    it("部署者应该是 owner", async function () {
      const flower = await viem.deployContract("ZenGardenFlower");
      const contractOwner = await flower.read.owner();

      assert.equal(contractOwner.toLowerCase(), owner.account.address.toLowerCase());
    });

    it("部署者应该自动成为 minter", async function () {
      const flower = await viem.deployContract("ZenGardenFlower");
      const isMinter = await flower.read.minters([owner.account.address]);

      assert.equal(isMinter, true);
    });

    it("初始 totalSupply 应该为 0", async function () {
      const flower = await viem.deployContract("ZenGardenFlower");
      const totalSupply = await flower.read.totalSupply();

      assert.equal(totalSupply, 0n);
    });
  });

  describe("Minter 管理", function () {
    it("owner 可以添加 minter", async function () {
      const flower = await viem.deployContract("ZenGardenFlower");

      await flower.write.addMinter([minter.account.address]);
      const isMinter = await flower.read.minters([minter.account.address]);

      assert.equal(isMinter, true);
    });

    it("添加 minter 应该触发 MinterAdded 事件", async function () {
      const flower = await viem.deployContract("ZenGardenFlower");

      await viem.assertions.emitWithArgs(
        flower.write.addMinter([minter.account.address]),
        flower,
        "MinterAdded",
        [getAddress(minter.account.address)],
      );
    });

    it("owner 可以移除 minter", async function () {
      const flower = await viem.deployContract("ZenGardenFlower");

      await flower.write.addMinter([minter.account.address]);
      await flower.write.removeMinter([minter.account.address]);
      const isMinter = await flower.read.minters([minter.account.address]);

      assert.equal(isMinter, false);
    });

    it("移除 minter 应该触发 MinterRemoved 事件", async function () {
      const flower = await viem.deployContract("ZenGardenFlower");
      await flower.write.addMinter([minter.account.address]);

      await viem.assertions.emitWithArgs(
        flower.write.removeMinter([minter.account.address]),
        flower,
        "MinterRemoved",
        [getAddress(minter.account.address)],
      );
    });

    it("非 owner 不能添加 minter", async function () {
      const flower = await viem.deployContract("ZenGardenFlower");

      await assert.rejects(
        flower.write.addMinter([user1.account.address], { account: user1.account }),
        /OwnableUnauthorizedAccount/
      );
    });

    it("非 owner 不能移除 minter", async function () {
      const flower = await viem.deployContract("ZenGardenFlower");

      await assert.rejects(
        flower.write.removeMinter([owner.account.address], { account: user1.account }),
        /OwnableUnauthorizedAccount/
      );
    });
  });

  describe("Mint 功能", function () {
    it("owner 可以 mint NFT", async function () {
      const flower = await viem.deployContract("ZenGardenFlower");
      const uri = "https://example.com/flower/1.png";

      await flower.write.mint([user1.account.address, uri]);

      const tokenOwner = await flower.read.ownerOf([0n]);
      assert.equal(tokenOwner.toLowerCase(), user1.account.address.toLowerCase());
    });

    it("minter 可以 mint NFT", async function () {
      const flower = await viem.deployContract("ZenGardenFlower");
      await flower.write.addMinter([minter.account.address]);
      const uri = "https://example.com/flower/1.png";

      await flower.write.mint([user1.account.address, uri], { account: minter.account });

      const tokenOwner = await flower.read.ownerOf([0n]);
      assert.equal(tokenOwner.toLowerCase(), user1.account.address.toLowerCase());
    });

    it("mint 应该正确设置 tokenURI", async function () {
      const flower = await viem.deployContract("ZenGardenFlower");
      const uri = "https://example.com/flower/1.png";

      await flower.write.mint([user1.account.address, uri]);

      const tokenURI = await flower.read.tokenURI([0n]);
      assert.equal(tokenURI, uri);
    });

    it("mint 应该触发 FlowerMinted 事件", async function () {
      const flower = await viem.deployContract("ZenGardenFlower");
      const uri = "https://example.com/flower/1.png";

      await viem.assertions.emitWithArgs(
        flower.write.mint([user1.account.address, uri]),
        flower,
        "FlowerMinted",
        [getAddress(user1.account.address), 0n, uri],
      );
    });

    it("mint 应该增加 totalSupply", async function () {
      const flower = await viem.deployContract("ZenGardenFlower");

      await flower.write.mint([user1.account.address, "uri1"]);
      await flower.write.mint([user2.account.address, "uri2"]);

      const totalSupply = await flower.read.totalSupply();
      assert.equal(totalSupply, 2n);
    });

    it("非 minter 不能 mint", async function () {
      const flower = await viem.deployContract("ZenGardenFlower");

      await assert.rejects(
        flower.write.mint([user1.account.address, "uri"], { account: user1.account }),
        /Not a minter/
      );
    });

    it("被移除的 minter 不能 mint", async function () {
      const flower = await viem.deployContract("ZenGardenFlower");
      await flower.write.addMinter([minter.account.address]);
      await flower.write.removeMinter([minter.account.address]);

      await assert.rejects(
        flower.write.mint([user1.account.address, "uri"], { account: minter.account }),
        /Not a minter/
      );
    });
  });

  describe("Token ID 递增", function () {
    it("Token ID 应该从 0 开始递增", async function () {
      const flower = await viem.deployContract("ZenGardenFlower");

      await flower.write.mint([user1.account.address, "uri0"]);
      await flower.write.mint([user1.account.address, "uri1"]);
      await flower.write.mint([user1.account.address, "uri2"]);

      // 验证每个 token 的 owner
      for (let i = 0n; i < 3n; i++) {
        const tokenOwner = await flower.read.ownerOf([i]);
        assert.equal(tokenOwner.toLowerCase(), user1.account.address.toLowerCase());
      }
    });
  });

  describe("ERC721 标准功能", function () {
    it("应该支持 ERC721 接口", async function () {
      const flower = await viem.deployContract("ZenGardenFlower");

      // ERC721 interface ID: 0x80ac58cd
      const supportsERC721 = await flower.read.supportsInterface(["0x80ac58cd"]);
      assert.equal(supportsERC721, true);
    });

    it("应该支持 ERC721Metadata 接口", async function () {
      const flower = await viem.deployContract("ZenGardenFlower");

      // ERC721Metadata interface ID: 0x5b5e139f
      const supportsMetadata = await flower.read.supportsInterface(["0x5b5e139f"]);
      assert.equal(supportsMetadata, true);
    });

    it("token 可以被转移", async function () {
      const flower = await viem.deployContract("ZenGardenFlower");
      await flower.write.mint([user1.account.address, "uri"]);

      await flower.write.transferFrom(
        [user1.account.address, user2.account.address, 0n],
        { account: user1.account }
      );

      const newOwner = await flower.read.ownerOf([0n]);
      assert.equal(newOwner.toLowerCase(), user2.account.address.toLowerCase());
    });
  });
});
