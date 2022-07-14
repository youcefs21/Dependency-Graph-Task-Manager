import {useEffect, useState} from "react";
import useWindowDimensions from "./WindowDimensions";


export default function useMouseGlobalPosition() {
  const [mousePos, setMousePos] = useState({mx: 0, my: 0})
  const { height, width } = useWindowDimensions();
     
  
  useEffect(() => {
    
    function handleMove(event: MouseEvent) {
      setMousePos({
        mx: event.x - width/2,
        my: event.y - height/2
      })
    }

    window.addEventListener('mousemove', handleMove)
    return () => window.removeEventListener('mousemove', handleMove);
  }, [width, height]);

  return mousePos
}