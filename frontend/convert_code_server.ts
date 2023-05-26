/*
A headless js server that can take in a blockly workspace and convert it
into python code.

Run with npx tsx watch convert_code_server.tsx

Wait! Why not just do it on the django backend?
- Backend is python, and block to code conversion only works in js.

Ok, then why not do it on the frontend?
- Both clients need to agree about what the code does, we don't want to do it once for each client
because version differences/hackers/bugs could cause problems.
- Allowing clients to send code to run on the server is unsafe, better to send workspace XML.
- If we allow saving code to our database, it will be quite hard to deploy updates
- It will be harder to test changes to our code generation.

Thus, this is our second backend. We put it in the frontend folder just for convienence,
as this folder has the blockly generators and a javascript setup already.
*/

import express, { Express, Request, Response } from 'express';
import {Blockly, pythonGenerator} from '../frontend/src/blockly.js';

const app: Express = express()
app.use(express.json());

const port = 3333
function generate(json) {
  const demoWorkspace = new Blockly.Workspace();
  Blockly.serialization.workspaces.load(json, demoWorkspace);
  const code = pythonGenerator.workspaceToCode(demoWorkspace);
  return code
}

app.get('/', (req: Request, res: Response) => {
  let code = '{"blocks": {"languageVersion": 0, "blocks": [{"type": "chess_action", "id": "`8DRg_aD7uEOo{L?xIXd", "x": 137, "y": 52, "inputs": {"ACTION": {"block": {"type": "move", "id": "S5kX9!cc`[Weq+@;23GT", "inputs": {"FROM_UNIT": {"block": {"type": "acting_unit", "id": "8IZ.zuq_o3fB_EYrd|r5"}}, "TO_TILE": {"block": {"type": "targeted_tile", "id": "^!!!^cr){Mn?=xSH#6Ao"}}}}}}}]}}'
  const workspace_json = JSON.parse(code)
  res.send("<pre>" + generate(workspace_json) + "</pre>")
})

app.post('/', (req: Request, res: Response) => {
  const workspace_json = req.body
  console.log(req)
  res.send(generate(workspace_json))
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})