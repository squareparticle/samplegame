import "../style.css";
import { BaseComponent, BaseLayer, BaseWidget, BasicGameLoop, BasicScene } from "@essentialskills/gameenginets";
import { FirePulseComponent } from "./components/firePulseComponent";
import { GameController } from "./gameController";
import { LogoScene } from "./scenes/logoScene";
import { TitleScene } from "./scenes/titleScene";
import { ScorePanel } from "./widgets/scorePanel";
import { Level1 } from "./scenes/levels/level1";
import { DebrisComponent } from "./components/debrisComponent";
import { ScreenWrapLayer } from "./layers/screenWrapLayer";

BasicScene.registerType("logo", LogoScene);
BasicScene.registerType("title", TitleScene);
BasicScene.registerType("game", Level1);

BaseComponent.registerType("DebrisComponent", DebrisComponent);
BaseComponent.registerType("FirePulseComponent", FirePulseComponent);

BaseLayer.registerType("ScreenWrapLayer", ScreenWrapLayer);

BaseWidget.registerType("ScorePanel", ScorePanel);

const gameController = new GameController();
const gameLoop = new BasicGameLoop(gameController);
gameLoop.start();
