import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const ZenGardenFlowerModule = buildModule("ZenGardenFlowerModule", (m) => {
  const flower = m.contract("ZenGardenFlower");
  return { flower };
});

export default ZenGardenFlowerModule;
