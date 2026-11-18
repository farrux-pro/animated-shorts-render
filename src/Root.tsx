import React from "react";
import { Composition } from "remotion";
import { BridgeShort, BRIDGE_FRAMES } from "./videos/bridge/Bridge";
import { GtaShort, GTA_FRAMES } from "./videos/gta/Gta";

export const Root: React.FC = () => (
  <>
    <Composition id="BridgeShort" component={BridgeShort} durationInFrames={BRIDGE_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="GtaShort" component={GtaShort} durationInFrames={GTA_FRAMES} fps={30} width={1080} height={1920} />
  </>
);
