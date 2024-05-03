import './react.css'
export default function ZoomButton({text, id, onclick}:{text:string, id:string, onclick:()=>void}){
    return (
        <button id={id} onClick={onclick} className="reactButton">{text}</button>
    )
}
