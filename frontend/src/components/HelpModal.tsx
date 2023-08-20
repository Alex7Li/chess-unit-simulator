
import React, {FC, useState, useCallback, useEffect} from 'react'
import _ from 'lodash'
import { Modal, Tabs } from 'flowbite-react'
import { InformationCircleIcon } from '@heroicons/react/24/outline'

interface HelpModalProps {
  text: string
}
export const HelpModal: FC<HelpModalProps> = ({text}) => {
  const [isShown, setShown] = useState<boolean>(false);
  const KEY_NAME_ESC = 'Escape';
  const KEY_EVENT_TYPE = 'keyup';
 
  function useEscapeKey(handleClose) {
      const handleEscKey = useCallback((event) => {
      if (event.key === KEY_NAME_ESC) {
        setShown(false);
      }
    }, [handleClose]);
  
    useEffect(() => {
      document.addEventListener(KEY_EVENT_TYPE, handleEscKey, false);
  
      return () => {
        document.removeEventListener(KEY_EVENT_TYPE, handleEscKey, false);
      };
    }, [handleEscKey]);
  }
  useEscapeKey(()=>setShown(false))
  return <div>
  <div onClick={() => setShown(true)} className="h-5 w-5">
  <i><InformationCircleIcon/></i>
  </div>
  <Modal
    show={isShown}
    onClose={() => setShown(false)}
    className='z-[200]'
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