import {BrowserRouter, Route, Routes} from 'react-router'
import './App.css'
import Lobby from './Main/Lobby'
import Game from './Main/Game'

function App(props) {
  return (
    <>
    <div className='d-flex flex-column gap-3'>
      <div style={{top:"18vh", left:"50%",fontSize: "10vw", paddingBottom:"40px"}}>
        Mongolingo
      </div>
      <BrowserRouter>
        <Routes>
          <Route 
            path="/"
            element={<Lobby {...props}/>}
          />
          <Route 
            path="/game"
            element={<Game />}
          />
        </Routes>
      </BrowserRouter>
    </div>
    </>
  )
}

export default App
