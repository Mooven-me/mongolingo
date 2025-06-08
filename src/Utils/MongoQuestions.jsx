export const handleExportDatabase = () => {
    fetch('http://localhost:5000/export-data')
        .then(res => res.json())
        .then(data => {
            const blob = new Blob([JSON.stringify(data, null, 2)], { 
                type: 'application/json' 
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'mongodbData.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            console.log('Database exported successfully');
            alert('Base de données exportée avec succès!');
        })
        .catch(error => {
            console.error('Error exporting database:', error);
            alert('Erreur lors de l\'exportation de la base de données!');
        });
}

export const handleImportDatabase = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const jsonData = JSON.parse(e.target.result);
                    
                    // Validate the format
                    if (!jsonData.collections || typeof jsonData.collections !== 'object') {
                        alert('Format invalide: le fichier doit contenir un objet "collections"');
                        return;
                    }
                    
                    // Send to server
                    fetch('http://localhost:5000/import-data', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(jsonData)
                    })
                    .then(res => res.json())
                    .then(data => {
                        if (data.success) {
                            alert('Base de données importée avec succès!');
                        } else {
                            alert(`Erreur lors de l'importation: ${data.message}`);
                        }
                    })
                    .catch(error => {
                        console.error('Error importing database:', error);
                        alert('Erreur lors de l\'importation de la base de données!');
                    });
                    
                } catch (error) {
                    alert('Fichier JSON invalide!');
                }
            };
            reader.readAsText(file);
        }
    };
    input.click();
}

export const handleExportQuestions = () => {
    fetch('http://localhost:5000/export-questions')
        .then(res => res.json())
        .then(data => {
            const blob = new Blob([JSON.stringify(data, null, 2)], { 
                type: 'application/json' 
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'mongodbQuestions.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        })
        .catch(error => console.error('Error exporting questions:', error));
}

export const handleImportQuestions = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const questions = JSON.parse(e.target.result);
                    
                    fetch('http://localhost:5000/import-questions', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(questions)
                    })
                    .then(res => res.json())
                    .then(data => {
                        alert('Questions imported successfully!');
                    })
                    .catch(error => {
                        console.error('Error importing questions:', error);
                        alert('Error importing questions!');
                    });
                } catch (error) {
                    console.error('Error parsing JSON:', error);
                    alert('Invalid JSON file!');
                }
            };
            reader.readAsText(file);
        }
    };
    
    input.click();
}

export const getQuestionById = async (questionId) => {
    try {
        const response = await fetch(`http://localhost:5000/questions/${questionId}`);
        const data = await response.json();
        
        if (data.success) {
            return data.question;
        } else {
            console.error('Question not found:', data.message);
            return null;
        }
    } catch (error) {
        console.error('Error fetching question:', error);
        return null;
    }
}

export const getAnswerById = async (questionId, selectedAnswerIndex = 0) => {
    try {
        const response = await fetch(`http://localhost:5000/questions/${questionId}/answer`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ selectedAnswer: selectedAnswerIndex })
        });
        
        const data = await response.json();
        
        if (data.success) {
            return {
                isCorrect: data.isCorrect,
                correctAnswer: data.correctAnswer,
                explanation: data.explanation,
                selectedAnswer: selectedAnswerIndex
            };
        } else {
            console.error('Error checking answer:', data.message);
            return null;
        }
    } catch (error) {
        console.error('Error checking answer:', error);
        return null;
    }
}


export const executeMongoQuery = async (queryString, database = 'test') => {
  try {
    console.log('Executing MongoDB query:', queryString);
    
    const response = await fetch('http://localhost:5000/execute-mongo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        query: queryString,
        database: database 
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Query execution failed');
    }

    if (data.success) {
      console.log('✅ Query executed successfully:', data.result);
      return data.result;
    } else {
      throw new Error(data.message || 'Unknown error');
    }

  } catch (error) {
    console.error('❌ Error executing query:', error);
    throw new Error(`Query execution failed: ${error.message}`);
  }
};