import { useNavigate } from 'react-router-dom';
import { Button, Card, CardBody, CardHeader, Input } from 'reactstrap';
import {handleImportQuestions, handleExportQuestions, handleImportDatabase, handleExportDatabase} from '../Utils/MongoQuestions';

export default function Lobby(props) {
    const navigate = useNavigate();

    const createRoom = () => {
        navigate('/game')
    }

    return (
    <>
        <div className="d-flex flex-column justify-content-between align-items-center align-self-center align-content-center gap-4" style={{width:"40vw", minWidth:"300px"}}>
            <Card style={{padding:0, backgroundColor:"rgb(107, 114, 150)", minWidth:"180px"}}>
                <CardBody>
                    <Button color="info" className='shadow-sm border-0' onClick={createRoom}>
                        <b style={{color:"rgb(255, 255, 255)", textWrap:"nowrap"}}>Commencer une partie</b>
                    </Button>
                </CardBody>
            </Card>
            <Card>
                <b style={{fontSize:"20px"}}>Informations de la base de donnée</b>
                <CardBody>
                    <div className='d-flex flex-column gap-3' style={{minWidth:"300px"}}>
                        <Card style={{padding:0, backgroundColor:"rgb(107, 114, 150)", width:"100%", minWidth:"180px"}}>
                            <CardBody>
                                <Button color="info" className='shadow-sm border-0' onClick={handleImportDatabase}>
                                    <b style={{color:"rgb(255, 255, 255)", textWrap:"nowrap"}}>Importer la BDD</b>
                                </Button>
                            </CardBody>
                        </Card>
                        <Card style={{padding:0, backgroundColor:"rgb(107, 114, 150)", width:"100%", minWidth:"180px"}}>
                            <CardBody>
                                <Button color="info" className='shadow-sm border-0' onClick={handleExportDatabase}>
                                    <b style={{color:"rgb(255, 255, 255)", textWrap:"nowrap"}}>Exporter la BDD</b>
                                </Button>
                            </CardBody>
                        </Card>
                    </div>
                </CardBody>
            </Card>
            <Card>
                <b style={{fontSize:"20px"}}>Informations des questions</b>
                <CardBody>
                    <div className='d-flex flex-column gap-3' style={{minWidth:"300px"}}>
                        <Card style={{padding:0, backgroundColor:"rgb(107, 114, 150)", width:"100%", minWidth:"180px"}}>
                            <CardBody>
                                <Button color="info" className='shadow-sm border-0' onClick={handleImportQuestions}>
                                    <b style={{color:"rgb(255, 255, 255)", textWrap:"nowrap"}}>Importer les questions</b>
                                </Button>
                            </CardBody>
                        </Card>
                        <Card style={{padding:0, backgroundColor:"rgb(107, 114, 150)", width:"100%", minWidth:"180px"}}>
                            <CardBody>
                                <Button color="info" className='shadow-sm border-0' onClick={handleExportQuestions}>
                                    <b style={{color:"rgb(255, 255, 255)", textWrap:"nowrap"}}>Exporter les questions</b>
                                </Button>
                            </CardBody>
                        </Card>
                    </div>
                </CardBody>
            </Card>
        </div>
    </>
    )
}