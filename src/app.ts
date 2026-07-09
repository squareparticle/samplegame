import "../style.css";
import { BaseComponent, BaseWidget, BasicGameLoop, BasicScene } from "@essentialskills/gameenginets";
import { DebrisSpawnerComponent } from "./components/debrisSpawnerComponent";
import { EntitySpawnerComponent } from "./components/entitySpawnerComponent";
import { FirePulseComponent } from "./components/firePulseComponent";
import { GameplayLoopComponent } from "./components/gameplayLoopComponent";
import { ScreenWrapComponent } from "./components/screenWrapComponent";
import { GameController } from "./gameController";
import { GameScene } from "./scenes/gameScene";
import { LogoScene } from "./scenes/logoScene";
import { TitleScene } from "./scenes/titleScene";

BasicScene.registerType("logo", LogoScene);
BasicScene.registerType("title", TitleScene);
BasicScene.registerType("game", GameScene);

BaseComponent.registerType("EntitySpawnerComponent", EntitySpawnerComponent);
BaseComponent.registerType("DebrisSpawnerComponent", DebrisSpawnerComponent);
BaseComponent.registerType("FirePulseComponent", FirePulseComponent);
BaseComponent.registerType("GameplayLoopComponent", GameplayLoopComponent);
BaseComponent.registerType("ScreenWrapComponent", ScreenWrapComponent);

// Keep this import and registration point visible for teaching projects that
// add custom widgets later.
void BaseWidget;

const gameController = new GameController();
const gameLoop = new BasicGameLoop(gameController);
gameLoop.start();