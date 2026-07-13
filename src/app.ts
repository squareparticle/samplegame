import "../style.css";
import { BaseComponent, BaseWidget, BasicGameLoop, BasicScene } from "@essentialskills/gameenginets";
import { FirePulseComponent } from "./components/firePulseComponent";
import { ScreenWrapComponent } from "./components/screenWrapComponent";
import { GameController } from "./gameController";
import { LogoScene } from "./scenes/logoScene";
import { TitleScene } from "./scenes/titleScene";
import { ScorePanel } from "./widgets/scorePanel";
import { Level1 } from "./scenes/levels/level1";

BasicScene.registerType("logo", LogoScene);
BasicScene.registerType("title", TitleScene);
BasicScene.registerType("game", Level1);

BaseComponent.registerType("FirePulseComponent", FirePulseComponent);
BaseComponent.registerType("ScreenWrapComponent", ScreenWrapComponent);

BaseWidget.registerType("ScorePanel", ScorePanel);

// Keep this import and registration point visible for teaching projects that
// add custom widgets later.
void BaseWidget;

const gameController = new GameController();
const gameLoop = new BasicGameLoop(gameController);
gameLoop.start();