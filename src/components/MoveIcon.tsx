import React, { FC } from "react";
import { Move } from "./types"
import convert from 'color-convert'
import _ from 'lodash'

interface MoveIconProps {
  move: Move
  className?: string
}
function lighten(rgb: Array<number>, amount: number) {
  const hsl = convert.rgb.hsl(rgb[0], rgb[1], rgb[2]);
  const darker: [number, number, number] = [hsl[0], hsl[1], _.clamp(hsl[2] + amount, 0, 100)];
  const rgb_darker = convert.hsl.rgb(darker);
  return rgb_darker;
}
function to_css_format(color_rgb: Array<number>, transparency: number) {
  return "rgb(" + color_rgb[0] + "," + color_rgb[1] + "," + color_rgb[2] + "," + transparency + ")";
}

const MoveIcon: FC<MoveIconProps> = ({ move, className }) => {
  // const border_color = move.border ? move.border : lighten(move.color, -.8);
  // get rgb color
  if (className === undefined) {
    className = "h-4 w-4 my-1 mx-1 rounded-sm border-2 drop-shadow-md hover:ring-grey-700 focus:ring-blue-800 hover:ring-blue-500 focus:ring-2 hover:ring-2"
  }
  const rgb_color = to_css_format(move.color, .75)
  const border_color = to_css_format(move.borderColor ? move.borderColor : lighten(move.color, -20), .75);
  const styles = {
    backgroundColor: rgb_color,
    borderColor: border_color,
  }
  return <div className={className} style={styles}>
    <p className='text-m absolute font-mono'
      style={{ letterSpacing: '-.605rem', lineHeight: '.77rem', fontSize: '1rem', textAlign: 'center' }}>{move.symbol}</p>
  </div>
}

export default MoveIcon