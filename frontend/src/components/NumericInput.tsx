import React, { FC, useRef, useState } from "react";

interface IntegerInputProps {
  min: number
  max: number
  label: string
  formValue: number
  setFormValue: (formValue: number) => void
  barStyle?: boolean
  labelClass?: string
  inputClass?: string
}

export const IntegerInput: FC<IntegerInputProps> = ({ min, max, label, formValue, setFormValue, barStyle, labelClass, inputClass}) => {
  const onChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const val = e.target.value;
    const intVal = parseInt(val);
    if (intVal.toString() == val && intVal >= min && intVal <= max) {
      setFormValue(intVal);
    }
  };
  if(labelClass == undefined){
    labelClass = "block mb-2 w-12 pr-4 text-sm font-medium text-gray-900 dark:text-white"
  }
  if(inputClass == undefined){
    inputClass = "h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
  }
  return <div className="flex items-center">
    <label htmlFor={label}
      className={labelClass}
    > {label} </label>
    {barStyle ?
      <input type="range" id={label} name={label} min={min} max={max} value={formValue}
        onChange={onChange}
        key={label}
        className={inputClass}
      /> :
      <input type="number" id={label} name={label} min={min} max={max} value={formValue}
        onChange={onChange}
        key={label}
        className={inputClass}
      />
    }
  </div>
}