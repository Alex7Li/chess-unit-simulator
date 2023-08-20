import _ from 'lodash'
import convert from 'color-convert'
import { Move, Piece } from './types'
export const API_URL = 'http://127.0.0.1:8000/api'

const default_lightness = 72;

// Same as api/models.py Game.Result
export enum GameResult {
  WHITE_WIN = 'W',
  WHITE_WIN_RESIGN = 'Y',
  BLACK_WIN = 'B',
  BLACK_WIN_RESIGN = 'C',
  DRAW = 'D',
  DRAW_AGREED = 'E',
  IN_PROGRESS = "P"
}
// Colors are stored in HSL
// HSL
// https://hslpicker.com/#8b8b8d
// export const MOVES: Array<Move> = [
//   {
//     "cat": "UI",
//     "name": "cancel",
//     "overview": "Use to delete an action. Left click works as well.",
//     "description": "Delete an action you added before..",
//     "color": convert.hsl.rgb([120, 0, 100]),
//     "implementation": "",
//     "symbol": "\u232B",
//     "pk": -1,
//   }, {
//     "cat": "official",
//     "name": "swapUnit",
//     "overview": "(Unblockable) Teleport or Swap.",
//     "description": "Teleport to target empty position, or swap places with the (allied or enemy) unit that is at this position.",
//     "color": convert.hsl.rgb([280, 100, default_lightness]),
//     "implementation":
//       `tmp = source.unit;
// source.unit = target.unit;
// target.unit = tmp;
// `,
//     "symbol": "\u21BB"
//   }, {
//     "cat": "official",
//     "name": "teleport",
//     "overview": "(Unblockable) Teleport.",
//     "description": "Teleport to target empty position.",
//     "color": convert.hsl.rgb([280, 100, default_lightness]),
//     "implementation":
//       `if (target.unit) {
//   fail();
// }
// swapUnit(source, target);
// `,
//     "symbol": ""
//   }, {
//     "cat": "official",
//     "name": "jumpAttack",
//     "overview": "(Unblockable) Teleport or Attack.",
//     "description": "Teleport to target position. If an enemy unit is there, attack it.",
//     "color": convert.hsl.rgb([120, 100, 62]),
//     "implementation":
//       `if(not target.unit.isAlly) {
//   kill(source, target);
// }
// teleport(source, target);
// `,
//     "symbol": ""
//   }, {
//     "cat": "official",
//     "name": "slide",
//     "overview": "Move",
//     "description": "Move to empty target position. All cells on the line the two positions must be empty.",
//     "color": convert.hsl.rgb([250, 100, default_lightness]),
//     "implementation":
//       `for (cell in path(source, target)) {
//   if (cell != source and cell.unit) {
//     fail();
//   }
// }
// swapUnit(source, target);`,
//     "symbol": ""
//   }, {
//     "cat": "official",
//     "name": "slideAttack",
//     "overview": "Attack only.",
//     "description": "Attack the enemy unit at target position and travel there. All cells on the line the two positions must be empty.",
//     "color": convert.hsl.rgb([0, 100, default_lightness]),
//     "implementation":
//       `if (not target.unit.isAlly) {
//   kill(source, target);
//   slide(source, target);
// }
// `,
//     "symbol": ""
//   }, {
//     "cat": "official",
//     "name": "moveOrAttack",
//     "overview": "Move or Attack.",
//     "description": "Move to target position or attack the enemy unit there. All cells on the line the two positions must be empty.",
//     "color": convert.hsl.rgb([120, 0, default_lightness]),
//     "implementation":
//       `if (not target.unit) {
//   slide(source, target);
// } else if(target.unit.isAlly) {
//   slideAttack(source, target);
// }
// `,
//     "symbol": ""
//   }, {
//     "cat": "official",
//     "name": "jumpSwap",
//     "overview": "(Unblockable) Move, Attack, or swap places with ally.",
//     "description": "Teleport to target position. If an enemy unit is there, attack it. If there is a friendly unit there, teleport it back to your starting location.",
//     "color": convert.hsl.rgb([50, 100, default_lightness]),
//     "implementation":
//       `if (not target.unit) {  
//   teleport(source, target);
// } else if (target.unit.isFriend) {
//   swapUnit(source, target);
// } else {
//   jumpAttack(source, target);
// }
// `,
//     "symbol": ""
//   }, {
//     "cat": "official",
//     "name": "destroy",
//     "overview": "(Magic) Destroy target.",
//     "description": "Destroy enemy at target location without moving.",
//     "color": convert.hsl.rgb([20, 100, default_lightness]),
//     "implementation":
//       `if(not target.unit.isFriend) {
//   magicKill(target);
// }
// `,
//     "symbol": ""
//   }, {
//     "cat": "custom",
//     "name": "custom",
//     "overview": "Custom spell 1",
//     "description": "Make your own!",
//     "color": convert.hsl.rgb([180, 100, default_lightness]),
//     "implementation": ``,
//     "symbol": "1"
//   }];

const PASSIVES: Array<string> = [
  "Does not block movement.",
  "Vanishes after attacking.",
  "Vanishes after Magic.",
  "Immune to Poison.",
  "Immune to Petrify.",
  "Immune to Freeze.",
  "(Ranged-Immune)",
  "(Magic-Immune)",
  "(Status-Immune)",
  "(Trigger-Immune)",
  "(Displacement-Immune)",
  "Promotes to PieceName[+].",
  "On Death: Lose 2[+1] morale."
];
