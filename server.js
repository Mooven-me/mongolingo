import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import Ajv from 'ajv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

const collectionsData = JSON.parse(fs.readFileSync('./mongodbData.json')).collections;
const questionsData = JSON.parse(fs.readFileSync('./mongodbQuestions.json'));

app.post('/import-data', async (req, res) => {
  try {
    const importData = req.body;
    
    // Validate the format
    if (!importData.collections || typeof importData.collections !== 'object') {
      return res.json({ 
        success: false, 
        message: 'Invalid format: expected { collections: { collectionName: [documents] } }' 
      });
    }

    // Drop existing collections (except questions)
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(col => col.name).filter(name => name !== 'questions');
    
    for (const collectionName of collectionNames) {
      await mongoose.connection.db.dropCollection(collectionName);
      console.log(`Dropped collection: ${collectionName}`);
    }

    let totalImported = 0;
    const importedCollections = {};

    // Fill collections with data - FIXED: Handle nested structure
    for (const [collectionName, collectionData] of Object.entries(importData.collections)) {
      let documents;
      
      // Handle both formats: direct array or nested structure with 'data' property
      if (Array.isArray(collectionData)) {
        documents = collectionData;
      } else if (collectionData && Array.isArray(collectionData.data)) {
        documents = collectionData.data;
      } else {
        console.log(`Skipping ${collectionName}: no documents or invalid format`);
        continue;
      }

      if (documents.length > 0) {
        console.log(`Importing ${documents.length} documents to ${collectionName}`);
        
        // Process documents to handle ObjectId placeholders
        const processedDocuments = documents.map(doc => {
          return processObjectIds(doc);
        });
        
        await mongoose.connection.db.collection(collectionName).insertMany(processedDocuments);
        importedCollections[collectionName] = documents.length;
        totalImported += documents.length;
        console.log(`Successfully imported ${documents.length} documents to ${collectionName}`);
      } else {
        console.log(`Skipping ${collectionName}: no documents found`);
      }
    }

    res.json({ 
      success: true, 
      message: `Successfully imported ${totalImported} documents`,
      collections: importedCollections,
      totalDocuments: totalImported
    });
  } catch (error) {
    console.error('Error importing database:', error);
    res.json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Helper function to process ObjectId placeholders
function processObjectIds(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => processObjectIds(item));
  }
  
  const processed = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string' && value === 'ObjectId()') {
      processed[key] = new mongoose.Types.ObjectId();
    } else if (typeof value === 'object' && value !== null) {
      processed[key] = processObjectIds(value);
    } else {
      processed[key] = value;
    }
  }
  
  return processed;
}

// Route to import data from the local mongodbData.json file
app.post('/import-local-data', async (req, res) => {
  try {
    // Drop existing collections (except questions)
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(col => col.name).filter(name => name !== 'questions');
    
    for (const collectionName of collectionNames) {
      await mongoose.connection.db.dropCollection(collectionName);
      console.log(`Dropped collection: ${collectionName}`);
    }

    let totalImported = 0;
    const importedCollections = {};

    // Import from local collectionsData
    for (const [collectionName, collectionData] of Object.entries(collectionsData)) {
      if (collectionData && Array.isArray(collectionData.data) && collectionData.data.length > 0) {
        const documents = collectionData.data;
        console.log(`Importing ${documents.length} documents to ${collectionName}`);
        
        // Process documents to handle ObjectId placeholders
        const processedDocuments = documents.map(doc => {
          return processObjectIds(doc);
        });
        
        await mongoose.connection.db.collection(collectionName).insertMany(processedDocuments);
        importedCollections[collectionName] = documents.length;
        totalImported += documents.length;
        console.log(`Successfully imported ${documents.length} documents to ${collectionName}`);
      } else {
        console.log(`Skipping ${collectionName}: no documents found`);
      }
    }

    res.json({ 
      success: true, 
      message: `Successfully imported ${totalImported} documents from local file`,
      collections: importedCollections,
      totalDocuments: totalImported
    });
  } catch (error) {
    console.error('Error importing local database:', error);
    res.json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Route to export all database collections
app.get('/export-data', async (req, res) => {
  try {
    const collections = await mongoose.connection.db.listCollections().toArray();
    const exportData = { collections: {} };

    for (const collectionInfo of collections) {
      const collectionName = collectionInfo.name;
      // Skip questions collection
      if (collectionName !== 'questions') {
        const collection = mongoose.connection.db.collection(collectionName);
        const documents = await collection.find({}).project({ _id: 0 }).toArray();
        exportData.collections[collectionName] = documents;
      }
    }
    res.json(exportData);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error exporting database',
      error: error.message
    });
  }
});

app.get('/execute', async (req, res) => {
  try {
    const collections = await mongoose.connection.db.listCollections().toArray();
    const exportData = {};

    for (const collection of collections) {
      const collectionName = collection.name;
      const documents = await mongoose.connection.db.collection(collectionName).find({}).toArray();
      exportData[collectionName] = documents;
    }

    res.status(200).json(exportData);
  } catch (error) {
    console.error('Error exporting data:', error);
    res.status(500).json({ error: 'Error exporting data', details: error.message });
  }
});

//Questions sections

const questionSchema = new mongoose.Schema({
  question: String,
  options: [String],
  correctAnswer: Number,
  difficulty: String,
  explanation: String
});

const Question = mongoose.model('Question', questionSchema);

app.post('/import-questions', async (req, res) => {
  try {
    const questions = req.body;
    
    // Validate that it's an array
    if (!Array.isArray(questions)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid format: expected an array of questions' 
      });
    }

    // Clear existing questions
    await Question.deleteMany({});
    console.log('Cleared existing questions');

    // Insert new questions
    const insertedQuestions = await Question.insertMany(questions);
    console.log(`Inserted ${insertedQuestions.length} questions`);

    res.json({ 
      success: true, 
      message: `Successfully imported ${insertedQuestions.length} questions`,
      count: insertedQuestions.length 
    });
  } catch (error) {
    console.error('Error importing questions:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error importing questions', 
      error: error.message 
    });
  }
});

// Route to export questions
app.get('/export-questions', async (req, res) => {
  try {
    const questions = await Question.find({}).select('-_id -__v');
    
    res.json(questions);
  } catch (error) {
    console.error('Error exporting questions:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error exporting questions', 
      error: error.message 
    });
  }
});

// Route to get questions for the game
app.get('/questions', async (req, res) => {
  try {
    const { limit = 10, difficulty } = req.query;
    
    let filter = {};
    if (difficulty) {
      filter.difficulty = difficulty;
    }
    
    const questions = await Question.find(filter)
      .limit(parseInt(limit))
      .select('-_id');
    
    res.json(questions);
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching questions', 
      error: error.message 
    });
  }
});

app.get('/questions/:id', async (req, res) => {
  try {
    const questionId = parseInt(req.params.id);
    if (questionId >= 0 && questionId < questionsData.length) {
      const question = questionsData[questionId];
      res.json({
        success: true,
        question: {
          id: questionId,
          question: question.question,
          options: question.options,
          difficulty: question.difficulty
        }
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }
  } catch (error) {
    console.error('Error fetching question:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching question',
      error: error.message
    });
  }
});

app.post('/questions/:id/answer', async (req, res) => {
  try {
    const questionId = parseInt(req.params.id);
    const { selectedAnswer } = req.body;
    
    if (questionId >= 0 && questionId < questionsData.length) {
      const question = questionsData[questionId];
      const isCorrect = selectedAnswer === question.correctAnswer;
      
      res.json({
        success: true,
        isCorrect: isCorrect,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation,
        selectedAnswer: selectedAnswer
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }
  } catch (error) {
    console.error('Error checking answer:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking answer',
      error: error.message
    });
  }
});

//Config section
const PORT = 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));