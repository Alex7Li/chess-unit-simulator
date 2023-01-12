import _ from 'lodash'
import convert from 'color-convert'
import { Move, Piece } from './types'

const default_lightness = 72;
export const PIECES: Array<Piece> = [
  {
    "name": "Delete", 
    "passives": [],
    "image": "data:image/png;base64,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fOK/R72ve7neCVSbD7HA2qtnizZ+Kpw4Ia711t0FabzAlCjsJsacNnlp8Fkcn0Cgq+sK77/uNdrCNJo0Z3H3+jxEgSDpaOL6YMwnEAhlLd0IwfFZqXCjC3U1UjDRntWbx5GD9+XEKH3ntaP4rF1PIRANzhdYVxBuJAe9OvVHadMFRpSWibbSTQg8iUC1e4n2oEeJ97xcmC5pj4yy84nmjGszZg9Az78/iUClmyC2ZPtJ4krdeg6SKD0UgScRCBFDIkaiUrhIHDXceIgeqtNTm/00Ak0FVy/zj4AI5F/GauFABESggeCqaP8IiED+ZawWDkRABBoIror2j4AI5F/GauFABESggeCqaP8IiED+ZawWDkRABBoIror2j4AI5F/GauFABESggeCqaP8IiED+ZawWDkRABBoIror2j4AI5F/GauFABESggeCqaP8IiED+ZawWDkRABBoIror2j4AI5F/GauFABESggeCqaP8IiED+ZawWDkRABBoIror2j4AI5F/GauFABESggeCqaP8IiED+ZawWDkRABBoIror2j4AI5F/GauFABESggeCqaP8IiED+ZawWDkRABBoIror2j4AI5F/GauFABESggeCqaP8IiED+ZawWDkRABBoIror2j4AI5F/GauFABESggeCqaP8IiED+ZawWDkRABBoIror2j4AI5F/GauFABESggeCqaP8IiED+ZawWDkRABBoIror2j4AI5F/GauFABP4LJsAG/ndmmjgAAAAASUVORK5CYII=",
    "moves": [ [ null, null, null, null, null, null, null, null, null, null, null, null, null, null, null ], [ null, null, null, null, null, null, null, null, null, null, null, null, null, null, null ], [ null, null, null, null, null, null, null, null, null, null, null, null, null, null, null ], [ null, null, null, null, null, null, null, null, null, null, null, null, null, null, null ], [ null, null, null, null, null, null, null, null, null, null, null, null, null, null, null ], [ null, null, null, null, null, null, null, null, null, null, null, null, null, null, null ], [ null, null, null, null, null, null, null, null, null, null, null, null, null, null, null ], [ null, null, null, null, null, null, null, null, null, null, null, null, null, null, null ], [ null, null, null, null, null, null, null, null, null, null, null, null, null, null, null ], [ null, null, null, null, null, null, null, null, null, null, null, null, null, null, null ], [ null, null, null, null, null, null, null, null, null, null, null, null, null, null, null ], [ null, null, null, null, null, null, null, null, null, null, null, null, null, null, null ], [ null, null, null, null, null, null, null, null, null, null, null, null, null, null, null ], [ null, null, null, null, null, null, null, null, null, null, null, null, null, null, null ], [ null, null, null, null, null, null, null, null, null, null, null, null, null, null, null ] ],
 },
  {
    "name": "Rook",
    "passives": [],
    "image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAANAAAADQCAYAAAB2pO90AAAAAXNSR0IArs4c6QAAC71JREFUeF7tncGu7bQZRj+GVYUuqA9A7wtAr9RhJeAB6AUxpaI8AdwnoDwBMGQEzKsCopOOgAHj9j4BoHbCCBh0TPWhRM32SfbeieMd2/+ydIU4J3bi5X8dO47jPCESBCCwmcATm3OSEQIQEAIRBBDIIIBAGfDICgEEIgYgkEEAgTLgkRUCCEQMQCCDAAJlwCMrBBCIGIBABgEEyoBHVgggEDEAgQwCCJQBj6wQQCBiAAIZBBAoAx5ZIYBAxAAEMgggUAY8skIAgYgBCGQQQKAMeGSFAAIRAxDIIIBAGfDICgEEIgYgkEEAgTLgkRUCCEQMQCCDAAJlwCMrBBCIGIBABgEEyoBHVgggEDEAgQwCCJQBj6wQQCBiAAIZBBAoAx5ZIYBAxAAEMgggUAY8skIAgYgBCGQQQKAMeGSFAAIRAxDIIIBAGfDICgEEWo6BlyU9L+ljSf8iVCAwRwCB5uPiBUlfTH71iqRPCSEIpAQQaD4mLMvDya8eSXqP8IEAAl2Ogd9K+iY57AHDuMvgIh5BD3S31f8i6e3hxz9J+lbS7yIGB3W+TACB7jL6cpg8GH/zhqSPLqPkiIgEEOhuq/8o6d7kxwzfIppxZZ0R6BSUp64/kWSJnpL0nSTfE5EgMEsAgU6xTO9//Jv3Jb1F7EBgiQACnZJJ7394/oM7Zwkg0Cme9P7n/jALRxhBgCHcFTHwc3IMf2CugBb5EALktPURKLING+qOQAi0IWzIMhJAIATChgwCCIRAGeFDVgRCICzIIIBACJQRPmRFIATCggwCCIRAGeFDVgRCICzIIIBACJQRPquzfijpz5LekeSFu80nBEKgWwWxxbFATgh0K+o3Pg9LecoB91u9rw/FvzjsMeHFu00neiB6oFsEcLpNmHsg77XX/FZhCIRApQXym73/TN7s7eZNXwRCoNIC+Y3ed5OTeAjnlxebTwiEQKWD2HvsTfeV6GYCweAQCIFKCuTdXN9MTvD0sGlLyfPerGwEQqBSwTadth7P0d0mLQiEQCUE8k6u3pzfEwhj8sSBf9781PUUGAIh0N4Czcnjc3S5QSUCIdCeArnHcc+T7iXe7fbICIRAewm0JE9Xs24pLARCoL0E8pbI3hp5mvx1P08mdJsQCIH2CO656eqvJHkJT9cJgU6b198Cembyo26emBeM4nSdm0/1eJCnqxm3OYYIdEol3RsbgS6bl6406HK6egkDAp2SmS6592+6vgG+7MbFI+Z6ny6nqxHoYiz8ckD6eRMEOs8tnTjoftIgxUEPdEokXX4SLiCu+zvzy1Hj69nTLOGGvAh0GjHpkCTETNIKaXyon/e450ln2EKyQiB6oDX+LC3T8dfMLZTfMg2VEOi0ubkHWg5/5Jlhg0CnUMaPDI8//Wzm6Xqov7BDZZfk8bDNzLp/3sMs3HVh70Dx+/tjcmD4BbDIaUme7t7t2dLI9EB3qbEa4f9M3l7YAPGRJC/fCZ8Q6G4IeKulh5MfRwwW79/m+8HpXgYjEqb2J8GBQHcFSicSIg1VzoljUpFYXNW7ItBdTBGfBV0Sx9PUfsjc/EaIV1mx4iAEugsrnUjwPdH9FUxbOtR19UPRuaHaWA/3Ou6Vw860nWtQBJqn0/se2RbG201508Ol5Hsdi+M/IKQFAgh0WaButqEdluF4Zg1xdvqTgEDzIL0k5bnhV73cOPvezgtAl4Zr9DgbpEKgZWh+wu7hS+vruyyOe52l16vdw3qCoIu9qjc4kJUFgbLwVZ3ZEwTe1P2cOL7H8UuEpI0EEGgjuMqzeZjmJUnTnUGnl8yLgjs1IALtBLKyYuZetfYlevGnJxBaH5ZWgxuBqmmKXS/EPY/v3+4NpVocD9e4z9kVM5832RlnVcV5GDeuHqDHKdQ09ECFwFJsDAIIFKOdqWUhAghUCCzFxiCAQDHamVoWIoBAhcBSbAwCCBSjnallIQIIVAgsxcYggEAx2plaFiKAQIXAUmwMAggUo52pZSECCFQILMXGIIBAMdqZWhYigECFwFJsDAIIFKOdqWUhAghUCCzFxiCAQDHamVoWIoBAhcBSbAwCCBSjnallIQItCfTksEXT54VYUCwEVhNoRaA/SvqrpO8l/VrSs5L+s7q2ZIDAzgRaEchfBhh3mDGCv0t6aWcWFAeB1QRaEOhXkv4t6TeT2n0t6Q+ra0sGCOxMoAWBXOUPJP1JkmX6r6RXJf1jZxYUB4HVBFoRyNf5mqTfS/rbsMPm6sqSAQJ7E2hFoL3rTXkQ2IUAAu2CkUKiEkCgqC1PvXchgEC7YKSQqAQQqI2W98eyHkr6jE+T1NVgCFRXe8xdjb+y8M3kF/6i3CM+O19HwyFQHe1w7ir8XR9/43Sa/LmSB/Vfev9XiED1t3HaA41X/IqkT+u//L6vEIHaaF9/KMufqJ8mvnNaQdshUAWNcOUlvCfpzcmxCHQluJKHIVBJuvuWnd4LIdC+fDeVhkCbsB2SCYEOwX7+pAhUYaMsXFIqEJMIFbQdAlXQCFdegh+metbtGUmPJfn/SQcTQKCDG2DD6Z/iIeoGaoWyIFAhsBQbgwACxWhnalmIAAIVAkuxMQggUIx2ppaFCCBQIbAUG4MAAsVoZ2pZiAACFQJLsTEIIFCMdqaWhQggUCGwFBuDAALFaGdqWYgAAhUCS7ExCCBQjHamloUIIFAhsBQbgwACxWhnalmIAAIVAkuxMQggUIx2ppaFCCBQIbAUG4MAAsVoZ2pZiAACFQJLsTEIIFCMdqaWhQggUCGwFBuDQHSBXpfkzdu9RZS/eLAmvZAc/OVQhr/hQwpCIIpAlsSfCPEm7aXTj5L8DZ/3JX1b+mSUfyyBCAJZHO/qeUTyRoj+517JYpE6I9CzQB6W+ZMgtezg6SGih3kW6qvO4ihsdXoVyEO1dyV5F89z6adhuOXAXiuahRh7FZ/n5eHfvSujySL5vO6dGOpdCa22w3oUyOK8NQP6u+EeyEFbMllen/+5FSfxt3/83VNSYwR6E8hDtrmJAv+V989veR/iHm3sla6RyT2av7hAb9SQRD0JNCePh2juDTwrdmTyEM/T3hbK//UXFuaS743S6fEjr5tzXyDQi0Dp5w9dbcvjYFz7fOcWQePeydfm2cH0numNCoS/BYMuztGDQP7r/kPSGjXLM71UP5/yZMJ0iOdh5v0bDze7COYjKtGDQHOfgX9Qac8z18bujTyxMe2J6IWOsGHDOXsQyNX+Oal7a/VKh6BexTA3k7ihiclSkkBrgbbEonWBPEPoSZAxMZlQMup3LLtXgVoawrk5PaHwRdKuvg9iSnvHYC9RVK8C+aGkh0UtJcsynd5usQ4t8d7lWnsRyM95/GqCk2fgfGPe2l9v3/N4FQXDuF1C+zaF9CLQOAzyf0sv1SnVMnOziU8znV0K9z7l9iTQPkSOLcUPfafPhBjGHdseF8+OQBcR3fSAdBjnYagnE0iVEkCguhrGqyoszfSh6jsHvhBYF50KrwaB6muUuXV9rU3L10e10BUhUCGwGcXO9UKsj8sAWjIrApWku71sv/bwSZL94xttirL9qgPmRKB6G92vOnhDlGlidUJl7YVAlTVIcjnp6gR6ocraC4Eqa5DkctJFpv41vVBFbYZAFTXGwqXQC1XcRghUceMMlzbXC/HCXSXthkCVNMSFy0h7IU9r+9lQawtm26C94ioRaAWsAw+de1/Ii2ZfPPCaOLUkBGonDNJ1cr5yC9Tq6vN2yJ+5UgRqqxkty/OTS2aFwsHth0AHN8DK088N5diAZCXEPQ9HoD1p3qasdIUCrzzchvvsWRDoQPgZp57uQvR4w5clMk5N1ikBBGozHqZ7QPDW6oFtiEAHws88tfdQcOJZUCbInOwIlEOPvOEJIFD4EABADgEEyqFH3vAEECh8CAAghwAC5dAjb3gCCBQ+BACQQwCBcuiRNzwBBAofAgDIIYBAOfTIG54AAoUPAQDkEECgHHrkDU8AgcKHAAByCCBQDj3yhieAQOFDAAA5BBAohx55wxP4H7/FUODG0ck4AAAAAElFTkSuQmCC",
    "moves": [ [ null, null, null, null, null, null, null, "moveOrAttack", null, null, null, null, null, null, null ], [ null, null, null, null, null, null, null, "moveOrAttack", null, null, null, null, null, null, null ], [ null, null, null, null, null, null, null, "moveOrAttack", null, null, null, null, null, null, null ], [ null, null, null, null, null, null, null, "moveOrAttack", null, null, null, null, null, null, null ], [ null, null, null, null, null, null, null, "moveOrAttack", null, null, null, null, null, null, null ], [ null, null, null, null, null, null, null, "moveOrAttack", null, null, null, null, null, null, null ], [ null, null, null, null, null, null, null, "moveOrAttack", null, null, null, null, null, null, null ], [ "moveOrAttack", "moveOrAttack", "moveOrAttack", "moveOrAttack", "moveOrAttack", "moveOrAttack", "moveOrAttack", null, "moveOrAttack", "moveOrAttack", "moveOrAttack", "moveOrAttack", "moveOrAttack", "moveOrAttack", "moveOrAttack" ], [ null, null, null, null, null, null, null, "moveOrAttack", null, null, null, null, null, null, null ], [ null, null, null, null, null, null, null, "moveOrAttack", null, null, null, null, null, null, null ], [ null, null, null, null, null, null, null, "moveOrAttack", null, null, null, null, null, null, null ], [ null, null, null, null, null, null, null, "moveOrAttack", null, null, null, null, null, null, null ], [ null, null, null, null, null, null, null, "moveOrAttack", null, null, null, null, null, null, null ], [ null, null, null, null, null, null, null, "moveOrAttack", null, null, null, null, null, null, null ], [ null, null, null, null, null, null, null, "moveOrAttack", null, null, null, null, null, null, null ] ],
  }
]
// Colors are stored in HSL
// HSL
// https://hslpicker.com/#8b8b8d
export const MOVES: Array<Move> = [
  {
    "cat": "UI",
    "name": "cancel",
    "overview": "Use to delete an action. Left click works as well.",
    "description": "Delete an action you added before..",
    "color": convert.hsl.rgb([120, 0, 100]),
    "borderColor": convert.hsl.rgb([120, 0, 90]),
    "implementation": "",
    "symbol": "\u232B",
  }, {
    "cat": "official",
    "name": "swapUnit",
    "overview": "(Unblockable) Teleport or Swap.",
    "description": "Teleport to target empty position, or swap places with the (allied or enemy) unit that is at this position.",
    "color": convert.hsl.rgb([280, 100, default_lightness]),
    "implementation":
      `tmp = source.unit;
source.unit = target.unit;
target.unit = tmp;
`,
    "symbol": "\u21BB"
  }, {
    "cat": "official",
    "name": "teleport",
    "overview": "(Unblockable) Teleport.",
    "description": "Teleport to target empty position.",
    "color": convert.hsl.rgb([280, 100, default_lightness]),
    "implementation":
      `if (target.unit) {
  fail();
}
swapUnit(source, target);
`,
    "symbol": ""
  }, {
    "cat": "official",
    "name": "jumpAttack",
    "overview": "(Unblockable) Teleport or Attack.",
    "description": "Teleport to target position. If an enemy unit is there, attack it.",
    "color": convert.hsl.rgb([120, 100, 62]),
    "implementation":
      `if(not target.unit.isAlly) {
  kill(source, target);
}
teleport(source, target);
`,
    "symbol": ""
  }, {
    "cat": "official",
    "name": "slide",
    "overview": "Move",
    "description": "Move to empty target position. All cells on the line the two positions must be empty.",
    "color": convert.hsl.rgb([250, 100, default_lightness]),
    "implementation":
      `for (cell in path(source, target)) {
  if (cell != source and cell.unit) {
    fail();
  }
}
swapUnit(source, target);`,
    "symbol": ""
  }, {
    "cat": "official",
    "name": "slideAttack",
    "overview": "Attack only.",
    "description": "Attack the enemy unit at target position and travel there. All cells on the line the two positions must be empty.",
    "color": convert.hsl.rgb([0, 100, default_lightness]),
    "implementation":
      `if (not target.unit.isAlly) {
  kill(source, target);
  slide(source, target);
}
`,
    "symbol": ""
  }, {
    "cat": "official",
    "name": "moveOrAttack",
    "overview": "Move or Attack.",
    "description": "Move to target position or attack the enemy unit there. All cells on the line the two positions must be empty.",
    "color": convert.hsl.rgb([120, 0, default_lightness]),
    "implementation":
      `if (not target.unit) {
  slide(source, target);
} else if(target.unit.isAlly) {
  slideAttack(source, target);
}
`,
    "symbol": ""
  }, {
    "cat": "official",
    "name": "jumpSwap",
    "overview": "(Unblockable) Move, Attack, or swap places with ally.",
    "description": "Teleport to target position. If an enemy unit is there, attack it. If there is a friendly unit there, teleport it back to your starting location.",
    "color": convert.hsl.rgb([50, 100, default_lightness]),
    "implementation":
      `if (not target.unit) {  
  teleport(source, target);
} else if (target.unit.isFriend) {
  swapUnit(source, target);
} else {
  jumpAttack(source, target);
}
`,
    "symbol": ""
  }, {
    "cat": "official",
    "name": "destroy",
    "overview": "(Magic) Destroy target.",
    "description": "Destroy enemy at target location without moving.",
    "color": convert.hsl.rgb([20, 100, default_lightness]),
    "implementation":
      `if(not target.unit.isFriend) {
  magicKill(target);
}
`,
    "symbol": ""
  }, {
    "cat": "custom",
    "name": "custom",
    "overview": "Custom spell 1",
    "description": "Make your own!",
    "color": convert.hsl.rgb([180, 100, default_lightness]),
    "implementation": ``,
    "symbol": "1"
  }];

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

export const NAME_TO_MOVE = new Map<String, Move>(); //Lookup key by move name
_.forEach(MOVES, function (m: Move, ix: number) {
  NAME_TO_MOVE.set(m.name, m);
});

export const NAME_TO_PIECE = new Map<String, Piece>(); //Lookup key by move name
_.forEach(PIECES, function (p: Piece, ix: number) {
  NAME_TO_PIECE.set(p.name, p);
});
