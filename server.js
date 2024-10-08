require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors'); // Importar cors

// Crear una instancia de Express
const app = express();

// Configurar CORS
app.use(cors({
  origin: '*' // Aquí puedes reemplazar '*' por el dominio de tu frontend para mayor seguridad
}));

// Middleware para parsear JSON
app.use(express.json());

// Ruta del archivo donde se almacenarán los datos faciales
const DATA_FILE_PATH = path.join(__dirname, 'data.json');

// Función para leer datos del archivo JSON
const readDataFromFile = () => {
  const data = fs.readFileSync(DATA_FILE_PATH);
  return JSON.parse(data);
};

// Función para escribir datos en el archivo JSON
const writeDataToFile = (data) => {
  fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(data, null, 2));
};

// Ruta para registrar los datos faciales (Enrolamiento)
app.post('/api/register-face', (req, res) => {
  const { userId, faceData } = req.body;

  try {
    // Leer los datos existentes
    const existingData = readDataFromFile();

    // Verificar si el usuario ya existe
    const userExists = existingData.some((item) => item.userId === userId);

    if (userExists) {
      return res.status(400).json({ message: 'El usuario ya está registrado' });
    }

    // Agregar los nuevos datos faciales
    existingData.push({ userId, faceData });

    // Guardar los nuevos datos en el archivo JSON
    writeDataToFile(existingData);

    res.status(200).json({ message: 'Datos faciales registrados correctamente.' });
  } catch (error) {
    res.status(500).json({ error: 'Error al registrar los datos faciales' });
  }
});

// Ruta para obtener el listado de todos los datos faciales almacenados
app.get('/api/face-data', (req, res) => {
    try {
        const faceData = readDataFromFile(); // Leer los datos del archivo JSON
        res.status(200).json(faceData); // Enviar el listado de datos faciales como respuesta
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener los datos faciales' });
    }
});

// Ruta para actualizar los datos faciales de un usuario
app.put('/api/update-face/:userId', (req, res) => {
    const { userId } = req.params;
    const { faceData } = req.body;
  
    try {
      // Leer los datos existentes
      const existingData = readDataFromFile();
  
      // Buscar el usuario en los datos almacenados
      const userIndex = existingData.findIndex((item) => item.userId === userId);
  
      if (userIndex === -1) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }
  
      // Actualizar los datos faciales del usuario
      existingData[userIndex].faceData = faceData;
  
      // Guardar los datos actualizados en el archivo JSON
      writeDataToFile(existingData);
  
      res.status(200).json({ message: 'Datos faciales actualizados correctamente.' });
    } catch (error) {
      res.status(500).json({ error: 'Error al actualizar los datos faciales' });
    }
});

// Ruta para autenticar al usuario usando los datos faciales
app.post('/api/authenticate-face', (req, res) => {
  const { userId, faceData } = req.body;

  try {
    // Leer los datos del archivo JSON
    const existingData = readDataFromFile();

    // Buscar los datos faciales almacenados del usuario
    const storedUser = existingData.find((item) => item.userId === userId);

    if (!storedUser) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Comparar landmarks (puntos faciales) entre los datos guardados y los nuevos
    const storedLandmarks = storedUser.faceData.landmarks;
    const newLandmarks = faceData.landmarks;

    // Comparar landmarks usando distancia euclidiana
    const distance = calculateEuclideanDistance(storedLandmarks, newLandmarks);

    // Definir un umbral de distancia para autenticación exitosa
    const threshold = 1.0;
    if (distance < threshold) {
      return res.status(200).json({ message: 'Autenticación exitosa' });
    } else {
      return res.status(401).json({ message: 'Autenticación fallida' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error durante la autenticación facial' });
  }
});

// Función para calcular la distancia euclidiana
const calculateEuclideanDistance = (points1, points2) => {
  let sum = 0;
  for (let i = 0; i < points1.length; i++) {
    sum += Math.pow(points1[i] - points2[i], 2);
  }
  return Math.sqrt(sum);
};

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Servidor corriendo en el puerto ${port}`);
});
