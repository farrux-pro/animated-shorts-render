import React from "react";
import { Composition } from "remotion";
import { BridgeShort, BRIDGE_FRAMES } from "./videos/bridge/Bridge";
import { GtaShort, GTA_FRAMES } from "./videos/gta/Gta";
import { Gta2D, GTA2D_FRAMES } from "./videos/gta2d/Gta2D";
import { BonnieClyde, BC_FRAMES } from "./videos/bc/Bc";
import { Eco, ECO_FRAMES } from "./videos/eco/Eco";
import { CharTest } from "./videos/chars/Test";
import { CityShort, CITY_FRAMES } from "./videos/city/City";

export const Root: React.FC = () => (
  <>
    <Composition id="BridgeShort" component={BridgeShort} durationInFrames={BRIDGE_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="GtaShort" component={GtaShort} durationInFrames={GTA_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="Gta2D" component={Gta2D} durationInFrames={GTA2D_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="BonnieClyde" component={BonnieClyde} durationInFrames={BC_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="Eco" component={Eco} durationInFrames={ECO_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="CharTest" component={CharTest} durationInFrames={1} fps={30} width={1080} height={1920} />
    <Composition id="CityShort" component={CityShort} durationInFrames={CITY_FRAMES} fps={30} width={1080} height={1920} />
  </>
);
