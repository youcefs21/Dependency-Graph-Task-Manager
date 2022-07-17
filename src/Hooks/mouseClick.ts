import {useEffect, useState} from "react";


export default function useMouseClickState() {
  const [isClicked, setIsClicked] = useState(false)

  useEffect(() => {
    const downHandler = (ev: PointerEvent) => setIsClicked(true)
    const upHandler = (ev: PointerEvent) => setIsClicked(false)

    window.addEventListener('pointerdown', downHandler)
    window.addEventListener('pointerup', upHandler)


    return () => {
      window.removeEventListener('pointerdown', downHandler)
      window.removeEventListener('pointerup', upHandler)
    }
  }, [])

  return isClicked
}