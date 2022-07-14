import {useEffect, useState} from "react";
import useWindowDimensions from "./WindowDimensions";


export default function useMouseGlobalState() {
  const [mousePos, setMousePos] = useState({mx: 0, my: 0})
  const [mouseVel, setMouseVel] = useState({mvx: 0, mvy: 0})
  const { height, width } = useWindowDimensions();
     
  
  useEffect(() => {
    
    function handleMove(event: MouseEvent) {
      const newX = event.x - width/2
      const newY = event.y - height/2
      setMouseVel({
        mvx: mousePos.mx - newX,
        mvy: mousePos.my - newY
      })
      setMousePos({
        mx: newX, 
        my: newY 
      })
    }

    window.addEventListener('mousemove', handleMove)
    return () => window.removeEventListener('mousemove', handleMove);
  }, [mousePos, width, height]);

  return {pos: mousePos, vel: mouseVel}
}