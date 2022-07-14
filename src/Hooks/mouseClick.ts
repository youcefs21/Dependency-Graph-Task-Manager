import {useEffect, useState} from "react";


export default function useMouseClickState() {
  const [isClicked, setIsClicked] = useState(false)

  useEffect(() => {
    const downHandler = (ev: MouseEvent) => setIsClicked(true)
    const upHandler = (ev: MouseEvent) => setIsClicked(false)

    window.addEventListener('mousedown', downHandler)
    window.addEventListener('mouseup', upHandler)


    return () => {
      window.removeEventListener('mousedown', downHandler)
      window.removeEventListener('mouseup', upHandler)
    }
  }, [])

  return isClicked
}