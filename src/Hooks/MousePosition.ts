import {useEffect, useState} from "react";
import useWindowDimensions from "./WindowDimensions";


export default function useMouseGlobalState() {
  const [mousePos, setMousePos] = useState({mx: 0, my: 0})
  const [mouseVel, setMouseVel] = useState({mvx: 0, mvy: 0})
  const { height, width } = useWindowDimensions();
     
  
  useEffect(() => {
    
    function handleMove(event: PointerEvent) {
      setMouseVel({
        mvx: -event.movementX,
        mvy: -event.movementY,
      })
      setMousePos({
        mx: event.x - width/2,
        my: event.y - height/2,
      })
    }

    window.addEventListener('pointermove', handleMove)
    return () => {
        window.removeEventListener('pointermove', handleMove);
    }
  }, [mousePos, width, height]);

  return {pos: mousePos, vel: mouseVel}
}
