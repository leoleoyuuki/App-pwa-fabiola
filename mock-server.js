import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer disk storage setup to preserve original file extensions
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ storage: storage });

const app = express();

app.use(cors()); // Enable CORS for testing from client side PWA
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Webhook mock receiver
app.post('/webhook', upload.array('photos'), (req, res) => {
  console.log('\n=========================================');
  console.log('📬 NOVO RELATÓRIO DE INSPEÇÃO RECEBIDO!');
  console.log('=========================================');
  console.log('📋 DADOS DO RELATÓRIO:');
  console.log(`   ID: ${req.body.id}`);
  console.log(`   Data de Criação: ${req.body.createdAt}`);
  console.log(`   Cliente/Projeto: ${req.body.clientName}`);
  console.log(`   Endereço: ${req.body.projectAddress || 'Não especificado'}`);
  console.log(`   Responsável: ${req.body.inspectorName || 'Não especificado'}`);
  console.log(`   Estágio: ${req.body.stage || 'Não especificado'}`);
  console.log(`   Notas: ${req.body.notes || 'Sem observações'}`);
  
  if (req.files && req.files.length > 0) {
    const filesArray = req.files;
    console.log('\n📷 IMAGENS EM ALTA RESOLUÇÃO SALVAS:');
    filesArray.forEach((file, index) => {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      console.log(`   [Foto ${index + 1}] ${file.originalname} (${sizeMB} MB) -> salva em: uploads/${file.filename}`);
    });
  } else {
    console.log('\n📷 Nenhuma imagem recebida.');
  }
  console.log('=========================================\n');

  res.status(200).json({ 
    success: true, 
    message: 'Relatório recebido com sucesso no servidor local!' 
  });
});

const PORT = 3000;
// Listen on 0.0.0.0 to allow network connections from mobile phones
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor de testes rodando em:`);
  console.log(`   Local:   http://localhost:${PORT}/webhook`);
  console.log(`   Rede:    http://192.168.15.13:${PORT}/webhook`);
  console.log(`\nCole o link de "Rede" nas configurações de webhook do PWA para testar!`);
});
