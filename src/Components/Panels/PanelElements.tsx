

export const ConfigPanelItem = ({itemHeading, children}: {itemHeading: string, children: JSX.Element | JSX.Element[]}) => {
  return (
    <div className="p-2">
      <h3>{itemHeading}</h3>
      <div className="text-sm text-[#BDBDBD] pl-3">
        {children}
      </div>
    </div>
  )
}
