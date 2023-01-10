
import React, {FC, useState} from 'react'
import _ from 'lodash'
import { Modal, Tabs } from 'flowbite-react'
import { InformationCircleIcon } from '@heroicons/react/24/outline'

interface HelpModalProps {
  text: string
}
export const ImplementationHelpModal: FC = ({}) => {
  const [isShown, setShown] = useState<boolean>(false);
  return <div>
  <button onClick={() => setShown(true)} className="h-6 w-6">
  <i><InformationCircleIcon/></i>
  </button>
  <Modal
    show={isShown}
    onClose={() => setShown(false)}
  >
    <Modal.Header>
      Implementation Guide
    </Modal.Header>
    <Modal.Body>
          <Tabs.Group
        aria-label="Underline tabs for implementation modal"
        style="underline"
      >
  <Tabs.Item title="Introduction" >
        <p className="text-base leading-relaxed text-gray-500 dark:text-gray-400">
          Every move has an implementation along with it that activates on use, which you
          can view here. This implementation is read by a simple set of rules that
          we'll describe here, and it follows a lot of intuition from normal programming languages.

          This implementation is just a formal restatement of the description text. 
          The main benefit of this language is that you can create your own pieces with
          almost any custom action that you can imagine very easily.

          The implementation is written in a custom language that we'll describe here.

          Every move has two relevant squares:
          the `source` square, where the unit using is, and the `target` square,
          which is where the ability is located. 
        </p>
  </Tabs.Item>
  <Tabs.Item title="Creating a Move" >
        <p className="text-base leading-relaxed text-gray-500 dark:text-gray-400">
          In creating a move, you are describing what happens when a piece at cell `source`
          chooses to target the cell `target`. Every move has a name, and you can use this
          name to compose the move with a move that has been defined earlier in the list 
          (note that you cannot reference moves later in the list).
          For example, the code for `teleport` uses the `swapUnit` move, and `jumpAttack` uses the code for `teleport`.
    </p>
  </Tabs.Item>
  <Tabs.Item title="Basics">
    All whitespace is ignored by this language. End all statements with semicolons.
    All variables should just be lowercase or uppercase letters.

    To execute logic in only certain situations, use the syntax
    <div>
    <code>if(condition) { }else if(condition) { }else (condition)</code>.
    </div>
    There are some basic operations that do what you expect:
    <ul>
      <li><code>x and y</code> is true exactly when both x and y are true. </li>
      <li><code>x or y</code> is true exactly when x or y or both are true. </li>
      <li><code>not x</code> is true exactly when x is false. </li>
      <li><code>x = y</code> assigns the value of y to x. (copy-by-value). </li>
      <li><code>x == y</code> is true exactly when x and y have the same value</li>
      <li><code>x != y</code> Shorthand for <code>not (x == y)</code></li>
    </ul>


  </Tabs.Item>
  <Tabs.Item title="Builtin Functions" >
  <div>
    <h4><code>kill(source, target) </code> 
    <code>rangedKill(source, target) </code> 
    <code>magicKill(source, target) </code></h4>

    These functions remove the unit at the target location.
    They may fail if the target piece has some kind of melee/ranged/magic immunity. 
  </div>
  <div>
    <h4><code>path(source, target)</code></h4>
    Returns a path starting a source and going to target.
  </div>
  <div>
    <h4><code>fail()</code></h4>
    If fail is called at any point in your function, it will not be possible to execute
    the move at all. For example, in the code for `slide`, we fail if there is a piece
    between the current and target location, since a piece cannot slide through another piece.
  </div>
  </Tabs.Item>
  <Tabs.Item title="Types" >
    <h2>Cell</h2>
    Describes one grid cell of the board. `source` and `target` are both of type cell.
    Each cell has a few attributes.
    <ul>
      <li><code>cell.unit</code> The unit at this cell.
      If no unit exists, it returns an empty uni and evaluates to false.
      If you try to access a method on an empty unit, the function will call fail()
      and give an error message.
      </li>
    </ul>
    <h2>Unit</h2>
    Describes a unit on the board.
    <ul>
      <li><code>unit.cell</code> The cell that the unit stands on. </li>
      <li><code>unit.isAlly</code> Returns <code>true</code> if the unit is on your team, otherwise false</li>
    </ul>

  </Tabs.Item>
  <Tabs.Item title="Notes" >
    This game is still in development. Depending on feedback, some existing moves
    may change to support different functionality.
    Backwards compatiblility is NOT guaranteed yet.
  </Tabs.Item>
        </Tabs.Group>
    </Modal.Body>
  </Modal>
</div>
}

export const HelpModal: FC<HelpModalProps> = ({text}) => {
  const [isShown, setShown] = useState<boolean>(false);
  return <div>
  <div onClick={() => setShown(true)} className="h-5 w-5">
  <i><InformationCircleIcon/></i>
  </div>
  <Modal
    show={isShown}
    onClose={() => setShown(false)}
  >
    <Modal.Header>
      Help
    </Modal.Header>
    <Modal.Body>
      <div className="space-y</i>-6">
        <p className="text-base leading-relaxed text-gray-500 dark:text-gray-400">
          {text}
        </p>
      </div>
    </Modal.Body>
  </Modal>
</div>
}
export default HelpModal