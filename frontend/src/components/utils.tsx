import React, {FC} from "react";

export type SaveState ='saving'|'fail'|'ok' 

interface SaveElementProps {
  savingState: SaveState
}
export const SaveElement: FC<SaveElementProps> = ({savingState}) => {
  let response = <p>{savingState}</p>
  if(savingState == 'fail'){
    response = <p>fail</p>
  }
  if(savingState == 'saving'){
    // todo use loading bar?
    response = <p>saving...</p>
  }
  if(savingState == 'ok'){
    // maybe: flash animation or something?
    response = <p></p>
  }
  return response
}